import net from "node:net";
import http from "node:http";
import https from "node:https";

const targets = process.argv.slice(2);
const timeoutMs = Number(process.env.QA_WAIT_TIMEOUT_MS || 180000);
const intervalMs = Number(process.env.QA_WAIT_INTERVAL_MS || 2000);

if (targets.length === 0) {
  console.error("No targets were provided.");
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseTcpTarget(target) {
  const tcpValue = target.replace("tcp://", "");
  // handle cases where host may contain colons (IPv6) by splitting at the last colon
  const lastColon = tcpValue.lastIndexOf(":");
  const host = tcpValue.substring(0, lastColon);
  const port = tcpValue.substring(lastColon + 1);
  return { host, port: Number(port) };
}

function probeTcp(target) {
  const { host, port } = parseTcpTarget(target);

  return new Promise((resolve, reject) => {
    const socket = new net.Socket();

    socket.setTimeout(3000);
    socket.once("connect", () => {
      socket.destroy();
      resolve();
    });
    socket.once("timeout", () => {
      socket.destroy();
      reject(new Error(`Timeout connecting to ${target}`));
    });
    socket.once("error", (error) => {
      socket.destroy();
      reject(error);
    });

    socket.connect(port, host);
  });
}

function probeHttp(target) {
  return new Promise((resolve, reject) => {
    let url;
    try {
      url = new URL(target);
    } catch (e) {
      return reject(new Error(`Invalid URL: ${target}`));
    }

    const lib = url.protocol === "https:" ? https : http;
    const options = {
      method: "GET",
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname + (url.search || ""),
      timeout: 3000,
      headers: { "User-Agent": "wait-for-targets" },
    };

    const req = lib.request(options, (res) => {
      // consume response to free socket
      res.resume();
      if (res.statusCode >= 200 && res.statusCode < 400) {
        resolve();
      } else {
        reject(
          new Error(`Unexpected HTTP status ${res.statusCode} for ${target}`),
        );
      }
    });

    req.on("error", (err) => reject(err));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Timeout connecting to ${target}`));
    });
    req.end();
  });
}

async function waitForTarget(target) {
  const startedAt = Date.now();
  let lastError;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      if (target.startsWith("tcp://")) {
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

  throw new Error(
    `Target did not become ready: ${target}. Last error: ${lastError?.message || "unknown error"}`,
  );
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
