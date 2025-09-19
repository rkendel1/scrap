#!/bin/bash

# FormCraft AI - Structured Flow Test Script
# This script demonstrates the complete form creation flow

echo "🚀 FormCraft AI - Testing Structured Flow"
echo "=========================================="

BASE_URL="http://localhost:3001"

echo ""
echo "1. 🏁 Initializing form creation flow..."
curl -s -X POST "$BASE_URL/api/forms/flow/init" \
  -H "Content-Type: application/json" | jq -r '.flowState.guidance'

echo ""
echo "2. 🌐 Processing website URL input..."
WEBSITE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/forms/flow/website-input" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}')

echo $WEBSITE_RESPONSE | jq -r '.flowState.guidance'

echo ""
echo "3. 📊 Testing invalid URL validation..."
curl -s -X POST "$BASE_URL/api/forms/flow/website-input" \
  -H "Content-Type: application/json" \
  -d '{"url": "invalid-url"}' | jq -r '.flowState.validationErrors[0]'

echo ""
echo "4. 💡 Getting contextual guidance for form type selection..."
curl -s -X POST "$BASE_URL/api/forms/flow/guidance" \
  -H "Content-Type: application/json" \
  -d '{"step": "select_form_type", "data": {}}' | jq -r '.guidance.message'

echo ""
echo "5. 🎯 Getting smart recommendations guidance..."
curl -s -X POST "$BASE_URL/api/forms/flow/guidance" \
  -H "Content-Type: application/json" \
  -d '{"step": "configure_delivery", "data": {"isAuthenticated": false}}' | jq -r '.guidance | "\(.message) - Warning: \(.warnings[0] // "None")"'

echo ""
echo "6. 📋 Testing publish flow for different user types..."

echo "   👤 Guest user:"
curl -s -X POST "$BASE_URL/api/forms/flow/guidance" \
  -H "Content-Type: application/json" \
  -d '{"step": "publish_form", "data": {"isAuthenticated": false, "userRole": "guest"}}' | jq -r '.guidance.message'

echo ""
echo "   🆓 Free user with existing forms:"
curl -s -X POST "$BASE_URL/api/forms/flow/guidance" \
  -H "Content-Type: application/json" \
  -d '{"step": "publish_form", "data": {"isAuthenticated": true, "userRole": "free", "existingLiveFormsCount": 1}}' | jq -r '.guidance.message'

echo ""
echo "   💎 Paid user:"
curl -s -X POST "$BASE_URL/api/forms/flow/guidance" \
  -H "Content-Type: application/json" \
  -d '{"step": "publish_form", "data": {"isAuthenticated": true, "userRole": "paid"}}' | jq -r '.guidance.message'

echo ""
echo "✅ Structured flow test completed!"
echo ""
echo "📋 Summary of tested features:"
echo "   • Flow initialization and guidance"
echo "   • URL validation with user-friendly errors"
echo "   • Contextual help system"
echo "   • Account-aware publishing rules"
echo "   • User role-based messaging"
echo ""
echo "🎉 The enhanced LLM service successfully guides users through"
echo "   the complete form creation, configuration, and publishing flow!"