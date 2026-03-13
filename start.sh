#!/bin/bash

# Urjamitra Project Startup Script
# This script starts MongoDB, Backend, and Frontend automatically

echo "🚀 Starting Urjamitra Project..."

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create MongoDB data directory if it doesn't exist
mkdir -p ~/mongodb_data

# Start MongoDB
echo -e "${BLUE}📦 Starting MongoDB...${NC}"
mongod --dbpath ~/mongodb_data > ~/mongodb.log 2>&1 &
MONGODB_PID=$!
echo -e "${GREEN}✓ MongoDB started (PID: $MONGODB_PID)${NC}"

# Wait for MongoDB to be ready
sleep 2

# Start Backend
echo -e "${BLUE}⚙️  Starting Backend Server...${NC}"
cd "$(dirname "$0")/backend"
npm run dev > ~/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"

# Wait for backend to start
sleep 2

# Start Frontend
echo -e "${BLUE}🎨 Starting Frontend Server...${NC}"
cd "$(dirname "$0")/frontend"
npm start > ~/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"

echo ""
echo -e "${GREEN}✅ All services started!${NC}"
echo ""
echo -e "${YELLOW}Access Your Application:${NC}"
echo -e "  Frontend:  ${BLUE}http://localhost:3000${NC}"
echo -e "  Backend:   ${BLUE}http://localhost:5001${NC}"
echo -e "  MongoDB:   ${BLUE}localhost:27017${NC}"
echo ""
echo -e "${YELLOW}Logs:${NC}"
echo "  MongoDB:  ~/mongodb.log"
echo "  Backend:  ~/backend.log"
echo "  Frontend: ~/frontend.log"
echo ""
echo -e "${YELLOW}To stop all services, run:${NC} kill $MONGODB_PID $BACKEND_PID $FRONTEND_PID"
