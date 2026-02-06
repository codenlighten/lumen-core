#!/bin/bash

# Analytics Engine Deployment Script for Lumen Core
# This script sets up Redis and deploys the analytics infrastructure

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════╗"
echo "║   📊 Lumen Core Analytics Engine Deployment          ║"
echo "║   Version 2.1                                         ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Configuration
REDIS_VERSION="7.0"
SERVER_IP="159.89.130.149"
SERVER_USER="root"
DEPLOY_PATH="/var/www/lumen-core"
REDIS_PASSWORD=""  # Will prompt for this

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo "📋 Step 1: Checking prerequisites..."

if ! command -v ssh &> /dev/null; then
    echo -e "${RED}❌ SSH not found. Please install openssh-client.${NC}"
    exit 1
fi

if ! command -v scp &> /dev/null; then
    echo -e "${RED}❌ SCP not found. Please install openssh-client.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites OK${NC}"
echo ""

# Step 2: Prompt for Redis password
echo "🔐 Step 2: Redis Configuration"
read -sp "Enter Redis password (leave empty for no auth): " REDIS_PASSWORD
echo ""

if [ -z "$REDIS_PASSWORD" ]; then
    echo -e "${YELLOW}⚠️  Warning: Running Redis without authentication${NC}"
else
    echo -e "${GREEN}✅ Redis password set${NC}"
fi
echo ""

# Step 3: Install Redis on production server
echo "📦 Step 3: Installing Redis on production server..."

ssh $SERVER_USER@$SERVER_IP << EOF
set -e

# Update package list
apt-get update -qq

# Install Redis
if ! command -v redis-server &> /dev/null; then
    echo "Installing Redis..."
    apt-get install -y redis-server
    systemctl enable redis-server
else
    echo "Redis already installed"
fi

# Configure Redis
echo "Configuring Redis..."
sed -i 's/^bind 127.0.0.1 ::1/bind 127.0.0.1/' /etc/redis/redis.conf
sed -i 's/^# requirepass foobared/requirepass ${REDIS_PASSWORD}/' /etc/redis/redis.conf

# Enable persistence
sed -i 's/^save 900 1/save 900 1/' /etc/redis/redis.conf
sed -i 's/^save 300 10/save 300 10/' /etc/redis/redis.conf
sed -i 's/^save 60 10000/save 60 10000/' /etc/redis/redis.conf

# Set maxmemory policy
echo "maxmemory 256mb" >> /etc/redis/redis.conf
echo "maxmemory-policy allkeys-lru" >> /etc/redis/redis.conf

# Restart Redis
systemctl restart redis-server

# Verify Redis is running
systemctl status redis-server --no-pager

echo "✅ Redis installed and configured"
EOF

echo -e "${GREEN}✅ Redis installation complete${NC}"
echo ""

# Step 4: Install ioredis package
echo "📦 Step 4: Installing ioredis package..."

ssh $SERVER_USER@$SERVER_IP << EOF
cd $DEPLOY_PATH
npm install ioredis
echo "✅ ioredis installed"
EOF

echo -e "${GREEN}✅ Package installation complete${NC}"
echo ""

# Step 5: Deploy analytics files
echo "📁 Step 5: Deploying analytics files..."

# Create lib directory if not exists
ssh $SERVER_USER@$SERVER_IP "mkdir -p $DEPLOY_PATH/lib"
ssh $SERVER_USER@$SERVER_IP "mkdir -p $DEPLOY_PATH/public"

# Copy analytics provider
echo "Copying analyticsProvider.js..."
scp lib/analyticsProvider.js $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/lib/

# Copy analytics middleware
echo "Copying analyticsMiddleware.js..."
scp lib/analyticsMiddleware.js $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/lib/

# Copy analytics routes
echo "Copying analyticsRoutes.js..."
scp lib/analyticsRoutes.js $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/lib/

# Copy analytics config
echo "Copying analyticsConfig.js..."
scp lib/analyticsConfig.js $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/lib/

# Copy analytics dashboard
echo "Copying analytics.html..."
scp public/analytics.html $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/public/

echo -e "${GREEN}✅ Files deployed${NC}"
echo ""

# Step 6: Set environment variables
echo "🔧 Step 6: Setting environment variables..."

ssh $SERVER_USER@$SERVER_IP << EOF
cd $DEPLOY_PATH

# Check if .env exists
if [ ! -f .env ]; then
    touch .env
fi

# Add Redis config if not present
if ! grep -q "REDIS_HOST" .env; then
    echo "REDIS_HOST=localhost" >> .env
fi

if ! grep -q "REDIS_PORT" .env; then
    echo "REDIS_PORT=6379" >> .env
fi

if [ -n "$REDIS_PASSWORD" ]; then
    if ! grep -q "REDIS_PASSWORD" .env; then
        echo "REDIS_PASSWORD=$REDIS_PASSWORD" >> .env
    else
        sed -i "s/^REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASSWORD/" .env
    fi
fi

if ! grep -q "REDIS_DB" .env; then
    echo "REDIS_DB=0" >> .env
fi

echo "✅ Environment variables set"
EOF

echo -e "${GREEN}✅ Configuration complete${NC}"
echo ""

# Step 7: Integrate with api-server.js
echo "🔗 Step 7: Integration instructions"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "To complete integration, add the following to your api-server.js:"
echo ""
echo "// At the top with imports:"
echo "const { getAnalyticsProvider } = require('./lib/analyticsProvider');"
echo "const {"
echo "  chatAnalyticsMiddleware,"
echo "  warRoomAnalyticsMiddleware,"
echo "  initAnalyticsMiddleware,"
echo "  timingMiddleware"
echo "} = require('./lib/analyticsMiddleware');"
echo "const analyticsRoutes = require('./lib/analyticsRoutes');"
echo ""
echo "// After creating Express app:"
echo "app.use(initAnalyticsMiddleware());"
echo "app.use(timingMiddleware());"
echo ""
echo "// On chat route:"
echo "app.post('/api/chat', chatAnalyticsMiddleware(), async (req, res) => {"
echo "  // Your existing chat logic"
echo "});"
echo ""
echo "// On war room route:"
echo "app.post('/api/war-room', warRoomAnalyticsMiddleware(), async (req, res) => {"
echo "  // Your existing war room logic"
echo "});"
echo ""
echo "// Mount analytics routes:"
echo "app.use('/api', analyticsRoutes);"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Step 8: Restart PM2
echo "🔄 Step 8: Restarting PM2..."

ssh $SERVER_USER@$SERVER_IP << EOF
cd $DEPLOY_PATH
pm2 restart lumen-api
pm2 save
echo "✅ PM2 restarted"
EOF

echo -e "${GREEN}✅ Server restarted${NC}"
echo ""

# Step 9: Test installation
echo "🧪 Step 9: Testing installation..."

echo "Testing Redis connection..."
ssh $SERVER_USER@$SERVER_IP "redis-cli ping" && echo -e "${GREEN}✅ Redis responding${NC}" || echo -e "${RED}❌ Redis not responding${NC}"

echo "Testing API health..."
curl -s https://lumenchat.org/health > /dev/null && echo -e "${GREEN}✅ API responding${NC}" || echo -e "${RED}❌ API not responding${NC}"

echo ""

# Final summary
echo "╔════════════════════════════════════════════════════════╗"
echo "║          🎉 Deployment Complete!                      ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "✅ Redis installed and configured"
echo "✅ Analytics files deployed"
echo "✅ Environment variables set"
echo "✅ PM2 restarted"
echo ""
echo "📊 Access Points:"
echo "  • Analytics API: https://lumenchat.org/api/analytics"
echo "  • Dashboard: https://lumenchat.org/analytics.html"
echo "  • Redis: localhost:6379 (internal only)"
echo ""
echo "📚 Documentation:"
echo "  • ANALYTICS_README.md - Complete guide"
echo "  • docs/ANALYTICS_ARCHITECTURE.md - Visual architecture"
echo "  • examples/api-server-with-analytics.js - Integration example"
echo ""
echo "⚠️  Next Steps:"
echo "  1. Add middleware to api-server.js (see instructions above)"
echo "  2. Test endpoints: curl https://lumenchat.org/api/analytics/dashboard"
echo "  3. Access dashboard: https://lumenchat.org/analytics.html"
echo "  4. Monitor PM2 logs: pm2 logs lumen-api"
echo ""
echo "🔐 Security Note:"
echo "  Redis is only accessible from localhost (127.0.0.1)"
echo "  Password protected: ${REDIS_PASSWORD:+Yes}${REDIS_PASSWORD:-No}"
echo ""
echo "Happy monitoring! 📈"
