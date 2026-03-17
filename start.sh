#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
#  Urjamitra — One-command startup (runs backend + frontend together)
#  Usage: chmod +x start.sh && ./start.sh
# ─────────────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo -e "${YELLOW}⚡ Urjamitra P2P Energy Marketplace${NC}"
echo ""

# Install deps
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
cd "$ROOT/backend" && npm install --legacy-peer-deps --silent
echo -e "${GREEN}✅ Backend ready${NC}"

echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
cd "$ROOT/frontend" && npm install --legacy-peer-deps --silent
echo -e "${GREEN}✅ Frontend ready${NC}"

echo ""
echo -e "${BLUE}🚀 Starting servers...${NC}"

# Start backend
cd "$ROOT/backend" && node server.js &
BACKEND_PID=$!
sleep 3

# Start frontend
cd "$ROOT/frontend" && BROWSER=none npm start &
FRONTEND_PID=$!
sleep 4

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅  Both servers running!                        ║${NC}"
echo -e "${GREEN}║  Frontend  →  http://localhost:3000              ║${NC}"
echo -e "${GREEN}║  Backend   →  http://localhost:5001              ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Scroll down on login page → 🎬 Launch Demo Mode ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Press ${RED}Ctrl+C${NC} to stop."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
