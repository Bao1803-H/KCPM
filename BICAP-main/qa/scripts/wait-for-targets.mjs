import net from 'node:net';

const targets = process.argv.slice(2);
const timeoutMs = Number(process.env.QA_WAIT_TIMEOUT_MS || 180000);
const intervalMs = Number(process.env.QA_WAIT_INTERVAL_MS || 2000);

if (targets.length === 0) {
    console.error('No targets were provided.');
    process.exit(1);
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseTcpTarget(target) {
    const tcpValue = target.replace('tcp://', '');
    const [host, port] = tcpValue.split(':');
    return { host, port: Number(port) };
}

function probeTcp(target) {
    const { host, port } = parseTcpTarget(target);

    return new Promise((resolve, reject) => {
        const socket = new net.Socket();

        socket.setTimeout(3000);
        socket.once('connect', () => {
            socket.destroy();
            resolve();
        });
        socket.once('timeout', () => {
            socket.destroy();
            reject(new Error(`Timeout connecting to ${target}`));
        });
        socket.once('error', (error) => {
            socket.destroy();
            reject(error);
        });

        socket.connect(port, host);
    });
}

async function probeHttp(target) {
    const response = await fetch(target, { redirect: 'manual' });
    if (response.status >= 200 && response.status < 400) {
        return;
    }

    throw new Error(`Unexpected HTTP status ${response.status} for ${target}`);
}

async function waitForTarget(target) {
    const startedAt = Date.now();
    let lastError;

    while (Date.now() - startedAt < timeoutMs) {
        try {
            if (target.startsWith('tcp://')) {
                await probeTcp(target);
            } else {
                await probeHttp(target);
            }

            console.log(`Ready: ${target}`);
            return;
        } catch (error) {
            lastError = error;
            await sleep(intervalMs);
        }
    }

    throw new Error(`Target did not become ready: ${target}. Last error: ${lastError?.message || 'unknown error'}`);
}

async function main() {
    for (const target of targets) {
        await waitForTarget(target);
    }
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
