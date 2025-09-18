#!/bin/bash

# n8n Integration Test Script
echo "🧪 n8n Integration Test Suite"
echo "================================"

# Test 1: Check n8n service availability
echo "1. Testing n8n service availability..."
if curl -s -I http://localhost:5678 | grep -q "200 OK"; then
    echo "   ✅ n8n service is running and accessible"
else
    echo "   ❌ n8n service is not responding"
    exit 1
fi

# Test 2: Check database connectivity
echo "2. Testing database connectivity..."
if docker compose exec -T db pg_isready -U scrap_user -d scrap_db > /dev/null 2>&1; then
    echo "   ✅ Database is ready and accepting connections"
else
    echo "   ❌ Database connection failed"
    exit 1
fi

# Test 3: Check if n8n tables exist (if migration ran)
echo "3. Checking n8n database schema..."
if docker compose exec -T db psql -U scrap_user -d scrap_db -c "\dt n8n.*" 2>/dev/null | grep -q "table"; then
    echo "   ✅ n8n database schema exists"
else
    echo "   ℹ️  n8n database schema not found (will be created on first run)"
fi

# Test 4: Check customer config tables
echo "4. Checking customer configuration tables..."
if docker compose exec -T db psql -U scrap_user -d scrap_db -c "SELECT 1 FROM customer_configs LIMIT 1;" > /dev/null 2>&1; then
    echo "   ✅ Customer configuration tables exist"
else
    echo "   ⚠️  Customer configuration tables not found (migration may be needed)"
fi

# Test 5: Check docker compose configuration
echo "5. Validating Docker Compose configuration..."
if docker compose config > /dev/null 2>&1; then
    echo "   ✅ Docker Compose configuration is valid"
else
    echo "   ❌ Docker Compose configuration has errors"
    exit 1
fi

# Test 6: Check n8n data persistence
echo "6. Checking n8n data volume..."
if docker volume ls | grep -q "scrap_n8n_data"; then
    echo "   ✅ n8n data volume exists"
else
    echo "   ❌ n8n data volume not found"
    exit 1
fi

# Test 7: Check configuration files
echo "7. Validating configuration files..."
config_files=(
    "./n8n/customer-configs/routing-config.json"
    "./n8n/workflows/form-data-router.json"
    "./N8N_INTEGRATION_GUIDE.md"
)

for file in "${config_files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "   ✅ $file exists"
    else
        echo "   ❌ $file missing"
        exit 1
    fi
done

echo ""
echo "🎉 All tests passed! n8n integration is ready."
echo ""
echo "Next steps:"
echo "1. Complete n8n setup at: http://localhost:5678"
echo "2. Import the workflow from: ./n8n/workflows/form-data-router.json"
echo "3. Run database migration for customer config tables"
echo "4. Test end-to-end form submission with customer routing"
echo ""
echo "📖 Full documentation: ./N8N_INTEGRATION_GUIDE.md"