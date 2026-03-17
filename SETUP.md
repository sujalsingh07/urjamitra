# ⚡ Urjamitra — Quick Start (2 commands)

## Requirements
- Node.js v18+ installed  →  check: `node --version`
- Two terminal windows

---

## Start the Backend (Terminal 1)

```bash
cd UJM_enhanced/backend
npm install
node server.js
```

✅ You'll see: `Urjamitra Backend is LIVE on port 5001`

> **No MongoDB needed** — the backend uses a built-in in-memory database automatically.
> Data resets when you restart the server, which is fine for demo.

---

## Start the Frontend (Terminal 2)

```bash
cd UJM_enhanced/frontend
npm install
npm start
```

✅ Browser opens at `http://localhost:3000`

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Could not reach server` | Backend not running — start it with `node server.js` in the backend folder |
| `npm install` fails | Run `npm install --legacy-peer-deps` |
| Port 5001 in use | Edit `backend/.env` → change `PORT=5001` to `PORT=5002`, and `frontend/.env` → change `5001` to `5002` |
| Frontend shows blank page | Delete `frontend/node_modules` and run `npm install` again |
