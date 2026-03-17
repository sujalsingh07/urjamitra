#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const net = require('net');

const root = path.resolve(__dirname, '..');

function parseEnv(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .reduce((acc, line) => {
      const eq = line.indexOf('=');
      if (eq === -1) return acc;
      const key = line.slice(0, eq).trim();
      const value = line.slice(eq + 1).trim();
      acc[key] = value;
      return acc;
    }, {});
}

function assertNodeVersion() {
  const major = Number(process.versions.node.split('.')[0]);
  if (major !== 20) {
    throw new Error(`Node ${process.versions.node} detected. Please use Node 20.x (see .nvmrc).`);
  }
}

function assertEnvFile(filePath, requiredKeys) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing env file: ${path.relative(root, filePath)}. Copy from the corresponding .env.example.`);
  }

  const vars = parseEnv(fs.readFileSync(filePath, 'utf8'));
  const missing = requiredKeys.filter((k) => !vars[k] || !String(vars[k]).trim());
  if (missing.length) {
    throw new Error(`Missing required keys in ${path.relative(root, filePath)}: ${missing.join(', ')}`);
  }
}

function checkPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}

async function assertPorts() {
  const required = [3000, 5001];
  const results = await Promise.all(required.map((p) => checkPortFree(p)));
  const busy = required.filter((_, i) => !results[i]);
  if (busy.length) {
    throw new Error(`Ports already in use: ${busy.join(', ')}. Stop existing processes and retry.`);
  }
}

async function main() {
  assertNodeVersion();

  const backendEnv = path.join(root, 'backend', '.env');
  const frontendEnv = path.join(root, 'frontend', '.env');

  assertEnvFile(backendEnv, ['PORT', 'MONGODB_URI', 'JWT_SECRET']);
  assertEnvFile(frontendEnv, ['REACT_APP_API_BASE_URL', 'REACT_APP_SOCKET_URL']);

  await assertPorts();

  console.log('[preflight] OK: Node version, env files, and ports are valid.');
}

main().catch((err) => {
  console.error(`[preflight] ${err.message}`);
  process.exit(1);
});
