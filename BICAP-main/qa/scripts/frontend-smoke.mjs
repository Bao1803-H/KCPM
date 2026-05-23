const host = process.env.QA_BASE_HOST || '127.0.0.1';

const checks = [
    { name: 'Guest home', url: `http://${host}:3005/`, expectedStatus: 200 },
    { name: 'Guest login', url: `http://${host}:3005/login`, expectedStatus: 200 },
    { name: 'Guest register', url: `http://${host}:3005/register`, expectedStatus: 200 },
    { name: 'Farm health', url: `http://${host}:3002/health`, expectedStatus: 200, expectedJsonStatus: 'ok' },
    { name: 'Farm login', url: `http://${host}:3002/login`, expectedStatus: 200 },
    { name: 'Admin login', url: `http://${host}:3001/login`, expectedStatus: 200 },
    { name: 'Retailer login', url: `http://${host}:3000/login`, expectedStatus: 200 },
    { name: 'Shipping manager login', url: `http://${host}:3003/login`, expectedStatus: 200 }
];

async function assertResponse(check) {
    const response = await fetch(check.url, { redirect: 'manual' });

    if (response.status !== check.expectedStatus) {
        throw new Error(`${check.name} expected ${check.expectedStatus} but received ${response.status}`);
    }

    if (check.expectedJsonStatus) {
        const payload = await response.json();
        if (payload.status !== check.expectedJsonStatus) {
            throw new Error(`${check.name} expected payload.status=${check.expectedJsonStatus}`);
        }
        return;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
        throw new Error(`${check.name} did not return HTML. Content-Type: ${contentType}`);
    }
}

async function main() {
    for (const check of checks) {
        await assertResponse(check);
        console.log(`Smoke passed: ${check.name}`);
    }
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
