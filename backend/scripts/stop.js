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

async function stopBackend() {
  console.log(`\n===============================================================`);
  console.log(` [SecureFile Backend] Safe Shutdown Request for Port ${PORT}`);
  console.log(`===============================================================`);

  const pid = getPortPid(PORT);

  if (!pid) {
    console.log(`- Port ${PORT} is ALREADY FREE. No backend process is running.`);
    console.log(`===============================================================\n`);
    process.exit(0);
    return;
  }

  console.log(`- Found process PID ${pid} listening on port ${PORT}.`);
  console.log(`- Verifying process identity before stopping...`);

  // Probe /api/health to ensure this PID belongs to SecureFile
  let isVerifiedSecureFile = false;
  try {
    const healthRes = await fetch(`http://127.0.0.1:${PORT}/api/health`, {
      signal: AbortSignal.timeout(2000),
    });

    if (healthRes.ok) {
      const data = await healthRes.json().catch(() => null);
      if (data && data.service === 'SecureFile Backend') {
        isVerifiedSecureFile = true;
      }
    }
  } catch {
    // Health probe failed
  }

  if (!isVerifiedSecureFile) {
    console.error(`\n[SAFETY ABORT] The process on port ${PORT} (PID ${pid}) did NOT identify as SecureFile Backend!`);
    console.error(`To protect other applications on your system, this process was NOT stopped.`);
    console.error(`If you know this process is safe to terminate, stop it manually:`);
    console.error(`  PowerShell: Stop-Process -Id ${pid} -Force`);
    console.log(`===============================================================\n`);
    process.exit(1);
    return;
  }

  // Safely terminate verified process
  console.log(`- Confirmed: PID ${pid} is SecureFile Backend. Stopping process safely...`);
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /F /T`, { stdio: 'ignore' });
    } else {
      process.kill(pid, 'SIGTERM');
    }

    // Wait briefly and verify port is released
    await new Promise((r) => setTimeout(r, 600));
    const stillOccupied = getPortPid(PORT);

    if (!stillOccupied) {
      console.log(`\nSUCCESS: SecureFile Backend (PID ${pid}) stopped.`);
      console.log(`Port ${PORT} is now completely free.`);
      console.log(`===============================================================\n`);
      process.exit(0);
    } else {
      console.log(`\nSent termination signal to PID ${pid}. Port will be freed momentarily.`);
      console.log(`===============================================================\n`);
      process.exit(0);
    }
  } catch (err) {
    console.error(`[ERROR] Failed to stop PID ${pid}:`, err.message);
    console.log(`===============================================================\n`);
    process.exit(1);
  }
}

stopBackend();
