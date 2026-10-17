import { execSync } from 'child_process';

const PORT = 3002;

function getPortPid(port = 3002) {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const lines = output.trim().split('\n');
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5 && parts[3] === 'LISTENING') {
        const pid = parseInt(parts[4], 10);
        if (!isNaN(pid)) return pid;
      }
    }
  } catch {
    // Port not bound or netstat failed
  }
  return null;
}

async function checkStatus() {
  console.log(`\n===============================================================`);
  console.log(` [SecureFile Backend] Port ${PORT} Status Check`);
  console.log(`===============================================================`);

  const pid = getPortPid(PORT);

  if (!pid) {
    console.log(`- Port Status:    AVAILABLE (Port ${PORT} is free)`);
    console.log(`- Backend Status: OFFLINE`);
    console.log(`\nTo start the backend, run:`);
    console.log(`  npm start`);
    console.log(`===============================================================\n`);
    return;
  }

  console.log(`- Port ${PORT}:       IN USE by Process ID (PID) ${pid}`);

  // Probe /api/health
  try {
    const healthRes = await fetch(`http://127.0.0.1:${PORT}/api/health`, {
      signal: AbortSignal.timeout(2000),
    });

    if (healthRes.ok) {
      const data = await healthRes.json().catch(() => null);

      if (data && data.service === 'SecureFile Backend') {
        const hasBatch = Array.isArray(data.features) && data.features.includes('batch-hash');

        console.log(`- Service Name:   ${data.service}`);
        console.log(`- Version:        ${data.version || '1.0.0'}`);
        console.log(`- Batch Hashing:  ${hasBatch ? 'SUPPORTED (Ready for Batch Scanner)' : 'MISSING (Outdated Server)'}`);
        console.log(`- Health Check:   ONLINE (HTTP 200 OK)`);
        console.log(`- Uptime:         ${data.uptime !== undefined ? data.uptime + 's' : 'active'}`);

        if (hasBatch) {
          console.log(`\nResult: SecureFile Backend is HEALTHY and READY on port ${PORT}.`);
          console.log(`To stop it safely, run: npm run dev:stop`);
        } else {
          console.warn(`\nWarning: Running server is an older version missing batch support.`);
          console.log(`To restart with updated code, run:`);
          console.log(`  npm run dev:stop`);
          console.log(`  npm start`);
        }
        console.log(`===============================================================\n`);
        return;
      }
    }
  } catch (err) {
    console.log(`- Health Check:   FAILED (${err.message})`);
  }

  console.warn(`- Warning: Process ${pid} is occupying port ${PORT} but did NOT verify as a healthy SecureFile backend.`);
  console.log(`To safely stop verified SecureFile processes, run: npm run dev:stop`);
  console.log(`===============================================================\n`);
}

checkStatus();
