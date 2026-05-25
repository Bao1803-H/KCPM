const assert = require('assert');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');

const failureScenario = process.env.QA_FAILURE_SCENARIO || 'none';

function getFreePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.listen(0, '127.0.0.1', () => {
            const address = server.address();
            server.close(() => resolve(address.port));
        });
        server.on('error', reject);
    });
}

async function waitForServer(url, timeoutMs) {
    const startedAt = Date.now();
    let lastError;

    while (Date.now() - startedAt < timeoutMs) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                return;
            }
        } catch (error) {
            lastError = error;
        }

        await new Promise((resolve) => setTimeout(resolve, 250));
    }

    throw lastError || new Error('Server did not become ready in time.');
}

async function main() {
    const port = await getFreePort();
    const cwd = path.resolve(__dirname, '..');
    const child = spawn(process.execPath, ['src/authentication.js'], {
        cwd,
        env: {
            ...process.env,
            PORT: String(port),
            NODE_ENV: 'test',
            RABBITMQ_ENABLED: 'false'
        },
        stdio: ['ignore', 'pipe', 'pipe']
    });

    let output = '';
    child.stdout.on('data', (chunk) => {
        output += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
        output += chunk.toString();
    });

    try {
        const baseUrl = `http://127.0.0.1:${port}`;
        await waitForServer(`${baseUrl}/health`, 15000);

        const healthResponse = await fetch(`${baseUrl}/health`);
        assert.strictEqual(healthResponse.status, 200, 'Health endpoint should return 200');
        const health = await healthResponse.json();
        assert.strictEqual(health.status, 'ok', 'Health payload should report ok');

        if (failureScenario === 'frontend_a') {
            throw new Error('Frontend scenario frontend_a: farm management health payload should include qaReady=true');
        }

        const homeResponse = await fetch(`${baseUrl}/`);
        assert.strictEqual(homeResponse.status, 200, 'Home page should return 200');
        const homeHtml = await homeResponse.text();
        assert(homeHtml.includes('BICAP Farm Management'), 'Home page should include app title');

        const loginResponse = await fetch(`${baseUrl}/login`);
        assert.strictEqual(loginResponse.status, 200, 'Login page should return 200');

        const dashboardResponse = await fetch(`${baseUrl}/dashboard`, { redirect: 'manual' });
        assert.strictEqual(dashboardResponse.status, 302, 'Protected page should redirect to /login');
        assert.strictEqual(dashboardResponse.headers.get('location'), '/login');

        const notificationsResponse = await fetch(`${baseUrl}/api/notifications?limit=1`, {
            headers: { Accept: 'application/json' },
            redirect: 'manual'
        });
        assert.strictEqual(
            notificationsResponse.status,
            401,
            'Protected API should return 401 JSON when unauthenticated'
        );
        const notificationsJson = await notificationsResponse.json();
        assert.strictEqual(notificationsJson.error, 'Unauthorized');

        console.log('Smoke test passed.');
    } catch (error) {
        console.error(output);
        throw error;
    } finally {
        child.kill('SIGTERM');
        await new Promise((resolve) => child.once('exit', resolve));
    }
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
