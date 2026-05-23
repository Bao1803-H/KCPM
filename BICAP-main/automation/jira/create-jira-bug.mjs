import fs from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
    const args = {};

    for (let index = 2; index < argv.length; index += 1) {
        const token = argv[index];
        if (!token.startsWith('--')) {
            continue;
        }

        const key = token.slice(2);
        const value = argv[index + 1] && !argv[index + 1].startsWith('--')
            ? argv[index + 1]
            : 'true';

        args[key] = value;

        if (value !== 'true') {
            index += 1;
        }
    }

    return args;
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function isPlaceholder(value) {
    return !value || /^CHANGE_ME/i.test(value);
}

function makeParagraph(text) {
    return {
        type: 'paragraph',
        content: [
            {
                type: 'text',
                text
            }
        ]
    };
}

function buildAdfDocument(lines) {
    return {
        version: 1,
        type: 'doc',
        content: lines.filter(Boolean).map((line) => makeParagraph(line))
    };
}

function truncate(text, maxLength) {
    if (text.length <= maxLength) {
        return text;
    }

    return `${text.slice(0, maxLength - 3)}...`;
}

function loadAssignmentState(stateFile) {
    if (!stateFile || !fs.existsSync(stateFile)) {
        return {};
    }

    try {
        return readJson(stateFile);
    } catch (_error) {
        return {};
    }
}

function saveAssignmentState(stateFile, state) {
    if (!stateFile) {
        return;
    }

    fs.mkdirSync(path.dirname(stateFile), { recursive: true });
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

function hashString(input) {
    let hash = 0;

    for (let index = 0; index < input.length; index += 1) {
        hash = ((hash << 5) - hash) + input.charCodeAt(index);
        hash |= 0;
    }

    return Math.abs(hash);
}

function pickAssigneeFromPool({ poolKeys, routingConfig, moduleName, stateFile, stageName, buildNumber }) {
    if (!Array.isArray(poolKeys) || poolKeys.length === 0) {
        return null;
    }

    const availableKeys = poolKeys.filter((key) => routingConfig.members[key]);
    if (availableKeys.length === 0) {
        return null;
    }

    try {
        const state = loadAssignmentState(stateFile);
        const stateKey = `${moduleName}:poolIndex`;
        const currentIndex = Number.isInteger(state[stateKey]) ? state[stateKey] : 0;
        const selectedKey = availableKeys[currentIndex % availableKeys.length];
        state[stateKey] = (currentIndex + 1) % availableKeys.length;
        saveAssignmentState(stateFile, state);

        return {
            key: selectedKey,
            member: routingConfig.members[selectedKey]
        };
    } catch (_error) {
        const fallbackIndex = hashString(`${moduleName}:${stageName}:${buildNumber}`) % availableKeys.length;
        const selectedKey = availableKeys[fallbackIndex];
        return {
            key: selectedKey,
            member: routingConfig.members[selectedKey]
        };
    }
}

function resolveAssignee({ routingConfig, moduleConfig, moduleName, stageName, buildNumber, stateFile }) {
    if (moduleConfig?.assigneeRole) {
        return {
            key: moduleConfig.assigneeRole,
            member: routingConfig.members[moduleConfig.assigneeRole] || null
        };
    }

    if (moduleConfig?.assigneePool) {
        return pickAssigneeFromPool({
            poolKeys: moduleConfig.assigneePool,
            routingConfig,
            moduleName,
            stateFile,
            stageName,
            buildNumber
        });
    }

    return null;
}

async function createIssue({ jiraConfig, routingConfig, moduleName, stageName, descriptionText }) {
    const moduleConfig = routingConfig.moduleRouting[moduleName]
        || routingConfig.moduleRouting[routingConfig.defaultModule];

    const jobName = process.env.JOB_NAME || 'local-run';
    const buildNumber = process.env.BUILD_NUMBER || 'manual';
    const branchName = process.env.BRANCH_NAME || process.env.GIT_BRANCH || 'unknown-branch';
    const buildUrl = process.env.BUILD_URL || 'n/a';
    const stateFile = process.env.JIRA_ASSIGNMENT_STATE_FILE
        || path.resolve('automation', 'jira', '.assignment-state.json');
    const selectedAssignee = resolveAssignee({
        routingConfig,
        moduleConfig,
        moduleName,
        stageName,
        buildNumber,
        stateFile
    });
    const assignee = selectedAssignee?.member || null;
    const branchPrefix = moduleConfig?.branchPrefix || 'bugfix/general';
    const labels = [
        'automated-bug',
        `module-${moduleName}`,
        ...(moduleConfig?.labels || [])
    ];

    const summary = truncate(
        `[${moduleName.toUpperCase()}] ${stageName} failed - ${jobName} #${buildNumber}`,
        240
    );

    const description = buildAdfDocument([
        `Module: ${moduleName}`,
        `Stage: ${stageName}`,
        `Build: ${jobName} #${buildNumber}`,
        `Build URL: ${buildUrl}`,
        `Source branch: ${branchName}`,
        `Suggested fix branch: ${branchPrefix}/<JIRA-KEY>-short-description`,
        `Suggested assignee: ${assignee?.displayName || 'Unassigned'}`,
        `Assignment mode: ${moduleConfig?.assignmentStrategy || 'fixed_owner'}`,
        '',
        'Expected fix flow:',
        '1. Developer creates a dedicated bugfix branch from the Jira key.',
        '2. Developer commits and pushes the fix to Git.',
        '3. Jenkins deploys the test server with Docker and reruns QA.',
        '4. Tester performs retest and closes the bug if passed.',
        '',
        'Failure detail:',
        truncate(descriptionText || 'No failure detail was provided.', 3000)
    ]);

    const issuePayload = {
        fields: {
            project: {
                key: jiraConfig.projectKey
            },
            issuetype: {
                name: jiraConfig.issueType
            },
            summary,
            description,
            labels: [...new Set(labels)]
        }
    };

    const authHeader = `Basic ${Buffer.from(`${jiraConfig.email}:${jiraConfig.apiToken}`).toString('base64')}`;
    const issueResponse = await fetch(`${jiraConfig.baseUrl}/rest/api/3/issue`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            Authorization: authHeader,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(issuePayload)
    });

    if (!issueResponse.ok) {
        const failureBody = await issueResponse.text();
        console.warn(`Jira issue creation failed: ${issueResponse.status} ${failureBody}`);
        return;
    }

    const issueData = await issueResponse.json();
    const issueKey = issueData.key;
    const issueUrl = `${jiraConfig.baseUrl}/browse/${issueKey}`;
    const bugLoggedStatus = process.env.JIRA_STATUS_BUG_LOGGED || 'Bug Logged';

    console.log(`Created Jira bug: ${issueKey} -> ${issueUrl}`);

    if (!assignee || isPlaceholder(assignee.accountId)) {
        console.log('Skipping Jira assignee update because accountId is missing or placeholder.');
    } else {
        const assignResponse = await fetch(`${jiraConfig.baseUrl}/rest/api/3/issue/${issueKey}/assignee`, {
            method: 'PUT',
            headers: {
                Accept: 'application/json',
                Authorization: authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                accountId: assignee.accountId
            })
        });

        if (!assignResponse.ok) {
            const failureBody = await assignResponse.text();
            console.warn(`Jira assignee update failed for ${issueKey}: ${assignResponse.status} ${failureBody}`);
        } else {
            console.log(`Assigned ${issueKey} to ${assignee.displayName}.`);
        }
    }

    try {
        const transitionListResponse = await fetch(`${jiraConfig.baseUrl}/rest/api/3/issue/${issueKey}/transitions`, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                Authorization: authHeader
            }
        });

        if (!transitionListResponse.ok) {
            const failureBody = await transitionListResponse.text();
            console.warn(`Jira transition lookup failed for ${issueKey}: ${transitionListResponse.status} ${failureBody}`);
            return;
        }

        const transitionsPayload = await transitionListResponse.json();
        const transitions = Array.isArray(transitionsPayload.transitions) ? transitionsPayload.transitions : [];
        const matchesTarget = (transition) => {
            const transitionName = transition?.name || '';
            const targetStatus = transition?.to?.name || '';
            return transitionName === bugLoggedStatus || targetStatus === bugLoggedStatus;
        };
        const matchesTargetCaseInsensitive = (transition) => {
            const expected = bugLoggedStatus.toLowerCase();
            return (transition?.name || '').toLowerCase() === expected
                || (transition?.to?.name || '').toLowerCase() === expected;
        };
        const targetTransition = transitions.find(matchesTarget)
            || transitions.find(matchesTargetCaseInsensitive);

        if (!targetTransition) {
            console.warn(`Transition "${bugLoggedStatus}" is not available for ${issueKey}.`);
            return;
        }

        const transitionResponse = await fetch(`${jiraConfig.baseUrl}/rest/api/3/issue/${issueKey}/transitions`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                Authorization: authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                transition: {
                    id: targetTransition.id
                }
            })
        });

        if (!transitionResponse.ok) {
            const failureBody = await transitionResponse.text();
            console.warn(`Cannot move ${issueKey} to ${bugLoggedStatus}: ${transitionResponse.status} ${failureBody}`);
            return;
        }

        console.log(`Transitioned ${issueKey} -> ${bugLoggedStatus}`);
    } catch (error) {
        console.warn(`Jira bug transition skipped: ${error.message}`);
    }
}

async function main() {
    const args = parseArgs(process.argv);
    const moduleName = args.module || 'integration';
    const stageName = args.stage || 'Unknown Stage';
    const descriptionFile = args.descriptionFile;

    const jiraConfig = {
        baseUrl: process.env.JIRA_BASE_URL,
        email: process.env.JIRA_EMAIL,
        apiToken: process.env.JIRA_API_TOKEN,
        projectKey: process.env.JIRA_PROJECT_KEY,
        issueType: process.env.JIRA_ISSUE_TYPE || 'Bug'
    };

    if (!jiraConfig.baseUrl || !jiraConfig.email || !jiraConfig.apiToken || !jiraConfig.projectKey) {
        console.log('Skipping Jira bug creation because Jira environment variables are not fully configured.');
        return;
    }

    const routingFile = process.env.JIRA_ROUTING_FILE
        || path.resolve('automation', 'jira', 'team-routing.json');

    if (!fs.existsSync(routingFile)) {
        console.log(`Skipping Jira bug creation because routing file is missing: ${routingFile}`);
        return;
    }

    const routingConfig = readJson(routingFile);
    const descriptionText = descriptionFile && fs.existsSync(descriptionFile)
        ? fs.readFileSync(descriptionFile, 'utf8')
        : 'No failure detail file was found.';

    await createIssue({
        jiraConfig,
        routingConfig,
        moduleName,
        stageName,
        descriptionText
    });
}

main().catch((error) => {
    console.warn(`Jira automation skipped due to unexpected error: ${error.message}`);
});
