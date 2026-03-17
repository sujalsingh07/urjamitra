# ⚡ Urjamitra — Decentralised P2P Solar Energy Marketplace

> **"Solar to Neighbour"** — India's first simulated peer-to-peer energy trading platform with Aadhaar-linked identity, live smart meter telemetry, DEPA consent enforcement, and USI settlement.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   URJAMITRA PLATFORM                    │
│                                                         │
│  ┌──────────────┐   ┌──────────────┐   ┌─────────────┐ │
│  │ IDENTITY     │   │ TELEMETRY    │   │ TRUST       │ │
│  │ LAYER        │   │ LAYER        │   │ LAYER (IES) │ │
│  │              │   │              │   │             │ │
│  │ Aadhaar-     │   │ Smart Meter  │   │ DEPA Consent│ │
│  │ linked IES   │   │ Simulator    │   │ Framework   │ │
│  │ IDs          │   │ (5s ticks)   │   │ Digital Sig │ │
│  └──────┬───────┘   └──────┬───────┘   └──────┬──────┘ │
│         │                  │                   │        │
│         └──────────────────┼───────────────────┘        │
│                            ▼                            │
│                  ┌──────────────────┐                   │
│                  │ SETTLEMENT LAYER │                   │
│                  │   USI / DISCOM   │                   │
│                  │  Bill Adjustment │                   │
│                  │  Wallet Update   │                   │
│                  └──────────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Team-safe setup (recommended)

Use these exact versions/tools to avoid "works on my machine" issues:

- Node.js `20.x` (see `.nvmrc`)
- npm `10.x`

```bash
# 1) Clone
git clone <repo-url>
cd urjamitra

# 2) Create env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3) Install exact dependency tree from lockfiles
cd backend && npm ci
cd ../frontend && npm ci
```

Start the app:

- Windows (PowerShell): `./start.ps1`
- Windows (CMD): `start.bat`
- Mac/Linux: `chmod +x start.sh && ./start.sh`

All three startup scripts now run a preflight check before install/start:

- Node version must be 20.x
- Required `.env` files and keys must exist
- Ports `3000` and `5001` must be free

```bash
# 1. Clone / use the project
cd UJM_enhanced

# 2. Set up backend environment
cp backend/.env.example backend/.env
# Edit backend/.env — set MONGODB_URI and JWT_SECRET

# 3. One-command start
chmod +x start.sh && ./start.sh
```

**Or manually:**

```bash
# Terminal 1 — Backend
cd backend && cp .env.example .env   # fill in MONGODB_URI + JWT_SECRET
npm install && npm run dev

# Terminal 2 — Frontend
cd frontend && cp .env.example .env
npm install && npm start
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5001
- Socket: ws://localhost:5001

---

## 🎬 Demo Script (4-Phase IES Trade Flow)

### Phase 1 — Setup

1. Register as **Arun** (prosumer/seller)
2. Go to **Marketplace** → Create a listing (e.g. 5 kWh at ₹5/kWh)
3. Dashboard now shows **live telemetry** — solar generation, consumption, surplus bars
4. IES identity badge appears: `IES-XXXX-XXXX-XXXX · Aadhaar Verified`

### Phase 2 — Discovery

5. Register as **Lakshmi** (consumer/buyer) in another browser tab
6. Lakshmi opens **🔗 P2P Trade** from the sidebar
7. Selects Arun's listing, enters 5 units → clicks **"Initiate P2P Trade"**
8. IES console shows:
   ```
   [IES] Received Trade Request: Arun → Lakshmi (5 Units)
   [IES] Requesting Data Consent from Arun...
   ```

### Phase 3 — Consent & Verification

9. Arun sees a **DEPA Consent modal** pop up (or it appears in the P2P Trade page)
10. Arun clicks **"Approve & Sign"** — a cryptographic signature is generated
11. Console scrolls:
    ```
    [IES] ✅ Seller approved consent. Digital signature: a3f2b819...
    [DISCOM] Checking meter MTR-ARUN-99 for export ≥ 5 kWh in last 15 min...
    [DISCOM] ✅ 5.12 kWh export confirmed. Finalizing trade...
    ```

### Phase 4 — Settlement

12. **Trade Successful** receipt appears with IES Transaction Hash
13. **Arun's wallet**: increases by ₹25
14. **Lakshmi's wallet**: decreases by ₹25
15. CO₂ offset calculated: ~4.1 kg 🌱

---

## 📁 Project Structure

```
UJM_enhanced/
├── backend/
│   ├── services/
│   │   ├── smartMeterSimulator.js   ← NEW: Telemetry layer
│   │   └── iesSimulator.js          ← NEW: Trust + settlement layer
│   ├── routes/
│   │   ├── iesRoutes.js             ← NEW: All IES API endpoints
│   │   ├── transactionRoutes.js     ← existing (untouched)
│   │   └── listingRoutes.js         ← existing (untouched)
│   ├── models/                      ← existing (untouched)
│   ├── server.js                    ← UPDATED: integrates IES + SmartMeter
│   └── .env.example                 ← NEW
│
├── frontend/
│   └── src/
│       ├── index.js                 ← UPDATED: global socket init
│       ├── App.js                   ← UPDATED: /ies-trade route
│       ├── services/api.js          ← UPDATED: IES API methods
│       ├── components/Sidebar.js    ← UPDATED: P2P Trade nav link
│       └── pages/
│           ├── IESTradeFlow.js      ← NEW: Full 4-phase trade UI
│           ├── Dashboard.js         ← UPDATED: live telemetry + IES badge
│           ├── Marketplace.js       ← UPDATED: meter seeding on listing
│           └── Login.js             ← UPDATED: socket register on login
│
└── start.sh                         ← UPDATED: full startup + demo guide
```

---

## 🔌 New API Endpoints

| Method | Endpoint                       | Description                                         |
| ------ | ------------------------------ | --------------------------------------------------- |
| GET    | `/api/ies/identity`            | Get Aadhaar-linked IES ID for current user          |
| POST   | `/api/ies/register-meter`      | Register smart meter                                |
| GET    | `/api/ies/telemetry`           | Live meter state (generation, consumption, surplus) |
| GET    | `/api/ies/telemetry/all`       | All meters (community map)                          |
| POST   | `/api/ies/trade/initiate`      | Phase 1: Buyer initiates P2P trade                  |
| POST   | `/api/ies/consent/:id/approve` | Phase 2: Seller approves/rejects                    |
| GET    | `/api/ies/pending-consents`    | Seller: get consent inbox                           |
| GET    | `/api/ies/trade/:id/status`    | Poll trade status + IES logs                        |

---

## 📡 Socket.IO Events

| Direction       | Event                 | Payload                                       |
| --------------- | --------------------- | --------------------------------------------- |
| Server → Client | `telemetry:update`    | `{ meters: { userId: meterState } }` every 5s |
| Server → Client | `ies:consent_request` | Consent details → seller                      |
| Server → Client | `ies:log`             | `{ tradeId, logs[] }` → both parties          |
| Server → Client | `ies:trade_update`    | Phase status updates                          |
| Server → Client | `ies:settlement`      | Final receipt with IES hash                   |
| Client → Server | `register`            | `userId` → join personal room                 |
| Client → Server | `meter:setProsumer`   | `{ userId, generationKw, consumptionKw }`     |

---

## 🛠️ Environment Variables

**backend/.env**

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/urjamitra
JWT_SECRET=your_secret_here
```

**frontend/.env**

```env
REACT_APP_API_BASE_URL=http://localhost:5001/api
REACT_APP_SOCKET_URL=http://localhost:5001
```
