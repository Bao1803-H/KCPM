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

function slugifyLabelPart(input) {
    return String(input || 'unknown-stage')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        || 'unknown-stage';
}

function escapeJqlValue(input) {
    return String(input || '')
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"');
}

function extractJiraKey(input) {
    const match = String(input || '').match(/([A-Z][A-Z0-9]+-\d+)/);
    return match ? match[1] : null;
}

function normalizeWhitespace(input) {
    return String(input || '')
        .replace(/\r/g, '')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();
}

function normalizeErrorSignature(input) {
    return normalizeWhitespace(input)
        .replace(/Build:\s*[^\n]+/gi, 'Build: <dynamic>')
        .replace(/Build URL:\s*[^\n]+/gi, 'Build URL: <dynamic>')
        .replace(/Branch:\s*[^\n]+/gi, 'Branch: <dynamic>')
        .replace(/Source branch:\s*[^\n]+/gi, 'Source branch: <dynamic>')
        .replace(/#[0-9]+/g, '#<n>')
        .replace(/https?:\/\/\S+/gi, '<url>');
}

function extractFailureDetail(descriptionText) {
    const text = String(descriptionText || '').trim();
    const marker = 'Failure detail:';
    const markerIndex = text.indexOf(marker);
    if (markerIndex >= 0) {
        return text.slice(markerIndex + marker.length).trim();
    }

    return text;
}

function buildDuplicateSignature({ moduleName, stageName, descriptionText }) {
    const failureDetail = extractFailureDetail(descriptionText);
    const normalizedDetail = normalizeErrorSignature(failureDetail);
    return `${moduleName}::${stageName}::${normalizedDetail}`;
}

function formatDuplicateSignatureLabel(signature) {
    return `dup-${slugifyLabelPart(signature).slice(0, 80)}`;
}

async function searchIssues({ jiraConfig, authHeader, jql, fields, maxResults = 50 }) {
    const response = await fetch(`${jiraConfig.baseUrl}/rest/api/3/search`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            Authorization: authHeader,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            jql,
            maxResults,
            fields
        })
    });

    if (!response.ok) {
        const failureBody = await response.text();
        throw new Error(`Jira search failed: ${response.status} ${failureBody}`);
    }

    const payload = await response.json();
    return Array.isArray(payload.issues) ? payload.issues : [];
}

async function countOpenAssignedIssues({ jiraConfig, authHeader, accountId }) {
    if (!accountId || isPlaceholder(accountId)) {
        return Number.MAX_SAFE_INTEGER;
    }

    const jql = [
        `project = "${escapeJqlValue(jiraConfig.projectKey)}"`,
        `assignee = "${escapeJqlValue(accountId)}"`,
        'statusCategory != Done'
    ].join(' AND ');

    try {
        const issues = await searchIssues({
            jiraConfig,
            authHeader,
            jql,
            fields: ['assignee'],
            maxResults: 100
        });
        return issues.length;
    } catch (error) {
        console.warn(`Cannot count open Jira issues for ${accountId}: ${error.message}`);
        return Number.MAX_SAFE_INTEGER;
    }
}

async function pickAssigneeFromPool({ jiraConfig, authHeader, poolKeys, routingConfig }) {
    if (!Array.isArray(poolKeys) || poolKeys.length === 0) {
        return null;
    }

    const availableEntries = poolKeys
        .map((key) => ({ key, member: routingConfig.members[key] }))
        .filter((entry) => entry.member);

    if (availableEntries.length === 0) {
        return null;
    }

    const workloadEntries = await Promise.all(
        availableEntries.map(async (entry) => ({
            ...entry,
            openIssueCount: await countOpenAssignedIssues({
                jiraConfig,
                authHeader,
                accountId: entry.member.accountId
            })
        }))
    );

    const finiteCounts = workloadEntries
        .map((entry) => entry.openIssueCount)
        .filter(Number.isFinite);
    const minCount = finiteCounts.length > 0 ? Math.min(...finiteCounts) : Number.MAX_SAFE_INTEGER;
    const leastBusyEntries = workloadEntries.filter((entry) => entry.openIssueCount === minCount);
    const selectionPool = leastBusyEntries.length > 0 ? leastBusyEntries : availableEntries;
    const selectedEntry = selectionPool[Math.floor(Math.random() * selectionPool.length)];

    return selectedEntry
        ? {
            key: selectedEntry.key,
            member: selectedEntry.member,
            openIssueCount: Number.isFinite(selectedEntry.openIssueCount) ? selectedEntry.openIssueCount : null
        }
        : null;
}

async function resolveAssignee({ jiraConfig, authHeader, routingConfig, moduleConfig }) {
    if (moduleConfig?.assigneeRole) {
        return {
            key: moduleConfig.assigneeRole,
            member: routingConfig.members[moduleConfig.assigneeRole] || null,
            openIssueCount: null
        };
    }

    if (moduleConfig?.assigneePool) {
        return pickAssigneeFromPool({
            jiraConfig,
            authHeader,
            poolKeys: moduleConfig.assigneePool,
            routingConfig
        });
    }

    return null;
}

async function addIssueComment({ jiraConfig, authHeader, issueKey, lines }) {
    const response = await fetch(`${jiraConfig.baseUrl}/rest/api/3/issue/${issueKey}/comment`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            Authorization: authHeader,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            body: buildAdfDocument(lines)
        })
    });

    if (!response.ok) {
        const failureBody = await response.text();
        console.warn(`Jira comment creation failed for ${issueKey}: ${response.status} ${failureBody}`);
        return false;
    }

    return true;
}

async function moveIssueToStatus({ jiraConfig, authHeader, issueKey, statusName }) {
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
            return false;
        }

        const transitionsPayload = await transitionListResponse.json();
        const transitions = Array.isArray(transitionsPayload.transitions) ? transitionsPayload.transitions : [];
        const expected = String(statusName || '').toLowerCase();
        const targetTransition = transitions.find((transition) => {
            const transitionName = (transition?.name || '').toLowerCase();
            const targetStatus = (transition?.to?.name || '').toLowerCase();
            return transitionName === expected || targetStatus === expected;
        });

        if (!targetTransition) {
            console.warn(`Transition "${statusName}" is not available for ${issueKey}.`);
            return false;
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
            console.warn(`Cannot move ${issueKey} to ${statusName}: ${transitionResponse.status} ${failureBody}`);
            return false;
        }

        console.log(`Transitioned ${issueKey} -> ${statusName}`);
        return true;
    } catch (error) {
        console.warn(`Jira transition skipped for ${issueKey}: ${error.message}`);
        return false;
    }
}

async function findReusableIssue({ jiraConfig, authHeader, branchName, labels, duplicateSignature }) {
    const branchIssueKey = extractJiraKey(branchName);
    if (branchIssueKey) {
        return {
            key: branchIssueKey,
            url: `${jiraConfig.baseUrl}/browse/${branchIssueKey}`,
            reason: 'branch_key'
        };
    }

    const jqlClauses = [
        `project = "${escapeJqlValue(jiraConfig.projectKey)}"`,
        'statusCategory != Done'
    ];

    if (duplicateSignature) {
        jqlClauses.push(`labels = "${escapeJqlValue(formatDuplicateSignatureLabel(duplicateSignature))}"`);
    } else {
        labels.forEach((label) => {
            jqlClauses.push(`labels = "${escapeJqlValue(label)}"`);
        });
    }

    const jql = `${jqlClauses.join(' AND ')} ORDER BY created DESC`;

    try {
        const issues = await searchIssues({
            jiraConfig,
            authHeader,
            jql,
            fields: ['summary', 'status'],
            maxResults: 10
        });

        if (issues.length === 0) {
            return null;
        }

        return {
            key: issues[0].key,
            url: `${jiraConfig.baseUrl}/browse/${issues[0].key}`,
            reason: duplicateSignature ? 'duplicate_signature' : 'open_duplicate'
        };
    } catch (error) {
        console.warn(`Jira duplicate search failed: ${error.message}`);
        return null;
    }
}

async function createIssue({ jiraConfig, routingConfig, moduleName, stageName, descriptionText }) {
    const moduleConfig = routingConfig.moduleRouting[moduleName]
        || routingConfig.moduleRouting[routingConfig.defaultModule];

    const jobName = process.env.JOB_NAME || 'local-run';
    const buildNumber = process.env.BUILD_NUMBER || 'manual';
    const branchName = process.env.BRANCH_NAME || process.env.GIT_BRANCH || 'unknown-branch';
    const buildUrl = process.env.BUILD_URL || 'n/a';
    const duplicateSignature = buildDuplicateSignature({ moduleName, stageName, descriptionText });
    const duplicateSignatureLabel = formatDuplicateSignatureLabel(duplicateSignature);
    const authHeader = `Basic ${Buffer.from(`${jiraConfig.email}:${jiraConfig.apiToken}`).toString('base64')}`;
    const selectedAssignee = await resolveAssignee({
        jiraConfig,
        authHeader,
        routingConfig,
        moduleConfig
    });
    const assignee = selectedAssignee?.member || null;
    const branchPrefix = moduleConfig?.branchPrefix || 'bugfix/general';
    const stageLabel = `stage-${slugifyLabelPart(stageName)}`;
    const labels = [
        'automated-bug',
        `module-${moduleName}`,
        stageLabel,
        duplicateSignatureLabel,
        ...(moduleConfig?.labels || [])
    ];

    const summary = truncate(
        `[${moduleName.toUpperCase()}] ${stageName} failed`,
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
        `Assignment mode: ${moduleConfig?.assignmentStrategy || 'least_open_random'}`,
        selectedAssignee?.openIssueCount != null ? `Open tasks before assignment: ${selectedAssignee.openIssueCount}` : '',
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

    const bugLoggedStatus = process.env.JIRA_STATUS_BUG_LOGGED || 'Bug Logged';
    const reusableIssue = await findReusableIssue({
        jiraConfig,
        authHeader,
        branchName,
        labels: [...new Set(labels)],
        duplicateSignature
    });

    if (reusableIssue) {
        const commentAdded = await addIssueComment({
            jiraConfig,
            authHeader,
            issueKey: reusableIssue.key,
            lines: [
                'Automated QA detected this failure again and reused the existing Jira issue.',
                `Reuse reason: ${reusableIssue.reason}`,
                `Module: ${moduleName}`,
                `Stage: ${stageName}`,
                `Build: ${jobName} #${buildNumber}`,
                `Build URL: ${buildUrl}`,
                `Source branch: ${branchName}`,
                '',
                'Latest failure detail:',
                truncate(descriptionText || 'No failure detail was provided.', 3000)
            ]
        });

        if (commentAdded) {
            console.log(`Reused Jira issue: ${reusableIssue.key} -> ${reusableIssue.url}`);
        }

        if (reusableIssue.reason !== 'branch_key') {
            await moveIssueToStatus({
                jiraConfig,
                authHeader,
                issueKey: reusableIssue.key,
                statusName: bugLoggedStatus
            });
        }

        return;
    }

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

    console.log(`Created Jira issue: ${issueKey} -> ${issueUrl}`);

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

    await moveIssueToStatus({
        jiraConfig,
        authHeader,
        issueKey,
        statusName: bugLoggedStatus
    });
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
        issueType: process.env.JIRA_ISSUE_TYPE || 'Task'
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
