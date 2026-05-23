import fs from 'node:fs';

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

function requireJiraConfig() {
    const jiraConfig = {
        baseUrl: process.env.JIRA_BASE_URL,
        email: process.env.JIRA_EMAIL,
        apiToken: process.env.JIRA_API_TOKEN
    };

    if (!jiraConfig.baseUrl || !jiraConfig.email || !jiraConfig.apiToken) {
        console.log('Skipping Jira status update because Jira environment variables are not fully configured.');
        process.exit(0);
    }

    return jiraConfig;
}

function buildAuthHeader(jiraConfig) {
    return `Basic ${Buffer.from(`${jiraConfig.email}:${jiraConfig.apiToken}`).toString('base64')}`;
}

async function findTransitionId({ jiraConfig, authHeader, issueKey, targetStatusName }) {
    const response = await fetch(`${jiraConfig.baseUrl}/rest/api/3/issue/${issueKey}/transitions`, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            Authorization: authHeader
        }
    });

    if (!response.ok) {
        const failureBody = await response.text();
        throw new Error(`Cannot load Jira transitions for ${issueKey}: ${response.status} ${failureBody}`);
    }

    const payload = await response.json();
    const transitions = Array.isArray(payload.transitions) ? payload.transitions : [];
    const matchesTarget = (transition) => {
        const transitionName = transition?.name || '';
        const targetStatus = transition?.to?.name || '';

        return transitionName === targetStatusName || targetStatus === targetStatusName;
    };

    const matchesTargetCaseInsensitive = (transition) => {
        const transitionName = (transition?.name || '').toLowerCase();
        const targetStatus = (transition?.to?.name || '').toLowerCase();
        const expected = targetStatusName.toLowerCase();

        return transitionName === expected || targetStatus === expected;
    };

    const exactMatch = transitions.find(matchesTarget);

    if (exactMatch) {
        return exactMatch.id;
    }

    const caseInsensitiveMatch = transitions.find(matchesTargetCaseInsensitive);

    if (caseInsensitiveMatch) {
        return caseInsensitiveMatch.id;
    }

    const availableNames = transitions.map((transition) => transition.name).join(', ');
    throw new Error(`Transition "${targetStatusName}" is not available for ${issueKey}. Available: ${availableNames}`);
}

async function transitionIssue({ jiraConfig, authHeader, issueKey, targetStatusName }) {
    const transitionId = await findTransitionId({
        jiraConfig,
        authHeader,
        issueKey,
        targetStatusName
    });

    const response = await fetch(`${jiraConfig.baseUrl}/rest/api/3/issue/${issueKey}/transitions`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            Authorization: authHeader,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            transition: {
                id: transitionId
            }
        })
    });

    if (!response.ok) {
        const failureBody = await response.text();
        throw new Error(`Cannot transition ${issueKey} to ${targetStatusName}: ${response.status} ${failureBody}`);
    }

    console.log(`Transitioned ${issueKey} -> ${targetStatusName}`);
}

async function main() {
    const args = parseArgs(process.argv);
    const issueKey = args.issueKey;
    const targetStatus = args.status;

    if (!issueKey || !targetStatus) {
        console.log('Usage: node automation/jira/update-jira-status.mjs --issueKey BICAP-101 --status "In Progress"');
        process.exit(0);
    }

    const jiraConfig = requireJiraConfig();
    const authHeader = buildAuthHeader(jiraConfig);

    await transitionIssue({
        jiraConfig,
        authHeader,
        issueKey,
        targetStatusName: targetStatus
    });
}

main().catch((error) => {
    console.warn(`Jira status update skipped due to unexpected error: ${error.message}`);
});
