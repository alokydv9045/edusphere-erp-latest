#!/bin/bash

# EduSphere Startup Script
# Runs both Admin and ERP servers

echo "🚀 Starting EduSphere Multi-Tenant ERP System"
echo "=============================================="

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Check Node version
NODE_VERSION=$(node --version)
echo "📦 Node.js: $NODE_VERSION"

# Start Admin Server
echo ""
echo "🔧 Starting Admin Portal Server (Port 5000)..."
cd /home/vivek/Desktop/EduSphere/Admin/server
npm run dev &
ADMIN_PID=$!

# Wait a bit
sleep 2

# Start School ERP Server
echo ""
echo "🏫 Starting School ERP Server (Port 5001)..."
cd /home/vivek/Desktop/EduSphere/erp/server
npm run dev &
ERP_PID=$!

echo ""
echo "✅ Both servers started!"
echo ""
echo "📊 Server Status:"
echo "  • Admin Portal: http://localhost:5000"
echo "  • School ERP:   http://localhost:5001"
echo ""
echo "🏥 Health Checks:"
echo "  • Admin: http://localhost:5000/health"
echo "  • ERP:   http://localhost:5001/health"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for both processes
wait $ADMIN_PID $ERP_PID
