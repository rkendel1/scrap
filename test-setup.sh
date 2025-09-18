#!/bin/bash

# Quick validation script for Docker Compose setup
echo "🔍 Testing Docker Compose Setup..."

echo "📋 Checking service status..."
docker compose ps

echo ""
echo "🏥 Testing backend health..."
HEALTH=$(curl -s http://localhost:3001/health)
echo "$HEALTH"

echo ""
echo "🌐 Testing frontend..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)
if [ "$FRONTEND_STATUS" = "200" ]; then
  echo "✅ Frontend is accessible at http://localhost:5173"
else
  echo "❌ Frontend not accessible (HTTP $FRONTEND_STATUS)"
fi

echo ""
echo "📡 Testing API endpoints..."
API_DOCS=$(curl -s http://localhost:3001/api/docs | jq -r .name 2>/dev/null)
if [ "$API_DOCS" = "Website Design Token Extraction API" ]; then
  echo "✅ API is responding correctly"
else
  echo "❌ API not responding correctly"
fi

echo ""
echo "🔌 Testing connector definitions..."
CONNECTORS=$(curl -s http://localhost:3001/api/connector-definitions 2>/dev/null | jq -r '.success' 2>/dev/null)
if [ "$CONNECTORS" = "true" ]; then
  echo "✅ Connector system is available"
else
  echo "ℹ️  Connector system may require authentication"
fi

echo ""
echo "📊 Service logs (last 5 lines each):"
echo "Backend:"
docker compose logs backend --tail=5
echo ""
echo "Frontend:"  
docker compose logs frontend --tail=5

echo ""
echo "🎉 Setup validation complete!"
echo "Access your application at:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3001"
echo "  API Docs: http://localhost:3001/api/docs"