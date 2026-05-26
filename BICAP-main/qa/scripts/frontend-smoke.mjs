const host = process.env.QA_BASE_HOST || '127.0.0.1';
const guestPort = process.env.GUEST_WEB_PORT || '3405';
const farmPort = process.env.FARM_WEB_PORT || '3402';
const adminPort = process.env.ADMIN_WEB_PORT || '3401';
const retailerPort = process.env.RETAILER_WEB_PORT || '3400';
const shippingManagerPort = process.env.SHIPPING_MANAGER_WEB_PORT || '3403';
const failureScenario = process.env.QA_FAILURE_SCENARIO || 'none';

const checks = [
    { name: 'Guest home', url: `http://${host}:${guestPort}/`, expectedStatus: 200 },
    { name: 'Guest login', url: `http://${host}:${guestPort}/login`, expectedStatus: 200 },
    { name: 'Guest register', url: `http://${host}:${guestPort}/register`, expectedStatus: 200 },
    { name: 'Farm health', url: `http://${host}:${farmPort}/health`, expectedStatus: 200, expectedJsonStatus: 'ok' },
    { name: 'Farm login', url: `http://${host}:${farmPort}/login`, expectedStatus: 200 },
    { name: 'Admin login', url: `http://${host}:${adminPort}/login`, expectedStatus: 200 },
    { name: 'Retailer login', url: `http://${host}:${retailerPort}/login`, expectedStatus: 200 },
    { name: 'Shipping manager login', url: `http://${host}:${shippingManagerPort}/login`, expectedStatus: 200 }
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

    if (failureScenario === 'frontend_a') {
        throw new Error('Frontend scenario frontend_a: Admin web login page missing CSRF token in form');
    }

    if (failureScenario === 'frontend_b') {
        throw new Error('Frontend scenario frontend_b: Shipping manager login page missing required meta viewport tag');
    }
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
