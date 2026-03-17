# Team Setup Guide

This guide is for teammates after pulling the latest code.

## 1. Prerequisites

- Node.js 20.x (project is pinned to Node 20)
- npm 10.x
- MongoDB Atlas/local connection string

Check versions:

```bash
node -v
npm -v
```

## 2. Clone / Pull and open project root

```bash
git pull
cd urjamitra
```

## 3. Create environment files (first time only)

Create local env files from examples:

- Copy `backend/.env.example` -> `backend/.env`
- Copy `frontend/.env.example` -> `frontend/.env`

Required backend keys:

- `PORT` (usually `5001`)
- `MONGODB_URI`
- `JWT_SECRET`
- `EMAIL_USER`
- `EMAIL_PASSWORD`

Required frontend keys:

- `REACT_APP_API_BASE_URL` (usually `http://localhost:5001/api`)
- `REACT_APP_SOCKET_URL` (usually `http://localhost:5001`)

## 4. Install dependencies

Use lockfile-based install for consistency:

```bash
cd backend && npm ci
cd ../frontend && npm ci
cd ..
```

## 5. Start project (one command)

Run from project root:

- Windows PowerShell:

```powershell
./start.ps1
```

- Windows CMD:

```bat
start.bat
```

- Mac/Linux:

```bash
chmod +x start.sh && ./start.sh
```

Startup scripts run a preflight check automatically for:

- Node version (must be 20.x)
- Required `.env` files/keys
- Port availability (`3000`, `5001`)

## 6. URLs

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5001`

## 7. Common issues and fixes

### A) Node version mismatch

Symptom: startup fails in preflight.

Fix: switch/install Node 20 and retry.

### B) Missing env keys

Symptom: preflight says missing keys.

Fix: open `backend/.env` or `frontend/.env` and fill missing variables.

### C) Port already in use

Symptom: preflight says port `3000` or `5001` busy.

Fix: stop old processes and rerun startup.

### D) Dependency issues after pull

Fix from project root:

```bash
cd backend && npm ci
cd ../frontend && npm ci
```

## 8. Team workflow notes

- Do not commit `.env` files.
- Commit `package-lock.json` changes whenever dependencies change.
- Keep Node on major version 20 for all teammates.
