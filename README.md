# SecureFile — Batch File Integrity Monitoring System (FIM v2.0)

A professional full-stack web application for monitoring and detecting file changes using SHA-256 cryptographic hash comparison. Designed for the **Information and Network Security (INS)** curriculum.

---

## Preferred Development Workflow (2 Terminals)

Open **two separate terminals** in VS Code:

### Terminal 1 — Backend (Port 3002)
```powershell
cd "E:\Projects\Integrity SHA-256\backend"
npm start
```
> **Smart Startup Protection:**
> - If port 3002 is free, the server starts immediately and displays its PID.
> - If port 3002 is **already running** a healthy SecureFile backend, it detects this, displays a confirmation, and exits cleanly with `code 0` (no more ugly `EADDRINUSE` crash!).
> - If port 3002 is occupied by an unrelated or outdated application, it explains which PID is running and provides safe resolution commands.

### Terminal 2 — Frontend Dev Server (Port 5173)
```powershell
cd "E:\Projects\Integrity SHA-256\frontend"
npm run dev
```

Open your browser at:
```
http://localhost:5173
```

---

## Lifecycle Management Commands

From the `backend/` directory:

| Command | Purpose |
|:---|:---|
| `npm start` | Starts the backend on Port 3002. Non-crashing if already running. |
| `npm run dev:status` | Checks Port 3002, process ID, uptime, and verifies `/api/health` & batch endpoint. |
| `npm run dev:stop` | **Safely stops ONLY the verified SecureFile backend process**. Never kills unrelated software. |
| `npm test` | Runs the 15-test automated backend test suite. |

> **Convenience from Project Root:**
> You can also run root commands from `E:\Projects\Integrity SHA-256`:
> - `npm run start:backend`
> - `npm run start:frontend`
> - `npm run status`
> - `npm run stop:backend`

---

## How to Safely Stop the Backend

1. **Option A (Interactive Terminal):** Press `Ctrl+C` in the backend terminal. The server handles `SIGINT` gracefully and frees port 3002.
2. **Option B (Command Line):**
   ```powershell
   cd "E:\Projects\Integrity SHA-256\backend"
   npm run dev:stop
   ```
   *Output:*
   ```text
   [SecureFile Backend] Safe Shutdown Request for Port 3002
   - Confirmed: PID 18176 is SecureFile Backend. Stopping process safely...
   SUCCESS: SecureFile Backend (PID 18176) stopped. Port 3002 is now completely free.
   ```

---

## Demonstrating the 4 FIM States (College Evaluation)

Files are provided in `test_files/`:
- `report.txt`
- `config.conf`
- `database.sql`
- `hacker_script.py`

### 1. Establish Clean Baseline
1. In `test_files\config.conf`, ensure line 1 has `SERVER_PORT=3000`.
2. Open **Batch Scanner** tab in your browser (`http://localhost:5173`).
3. Click **Browse Files** and select:
   - `report.txt`
   - `config.conf`
   - `database.sql`
4. Click **Create & Download Baseline**.
   - Active baseline is set and **persisted across page reloads in browser storage**.
   - Manifest backup downloads automatically.

### 2. Simulate Tampering
1. Edit `test_files\config.conf` and change `SERVER_PORT=3000` to `SERVER_PORT=8000`. Save the file.

### 3. Run Scan
1. In **Batch Scanner**, clear the selection and select:
   - `report.txt` *(clean)*
   - `config.conf` *(modified)*
   - `hacker_script.py` *(new unauthorized file)*
   *(Do NOT select `database.sql` so it is detected as missing)*
2. Click **Scan Files Against Baseline**.

### 4. Results
- `report.txt` $\rightarrow$ **UNCHANGED** (Green)
- `config.conf` $\rightarrow$ **MODIFIED** (Red) — click **Inspect** to see differing hex nibbles (**Strict Avalanche Effect**)
- `hacker_script.py` $\rightarrow$ **NEW FILE** (Blue)
- `database.sql` $\rightarrow$ **MISSING** (Amber)
- Download audit report with **Export CSV** or **Export JSON**.

---

## Backend API Endpoints

- `GET /api/health` — Returns status, version 2.0.0, PID, uptime, and supported feature flags (`['sha256', 'batch-hash', 'single-hash']`).
- `POST /api/hash` — Computes SHA-256 for a single file in memory.
- `POST /api/batch-hash` (or `/api/hash/batch`) — Computes SHA-256 for up to 100 files simultaneously in memory.
