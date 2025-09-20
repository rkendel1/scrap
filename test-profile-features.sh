#!/bin/bash

# Profile Settings and Subscription Management Test Script
# This script tests the backend API endpoints

API_BASE="http://localhost:3001"
EMAIL="test@example.com"
PASSWORD="TestPassword123!"

echo "=== Profile Settings & Subscription Management Test ==="
echo ""

# Step 1: Create a test user
echo "1. Creating test user..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$EMAIL'",
    "password": "'$PASSWORD'",
    "firstName": "Test",
    "lastName": "User"
  }')

echo "Register response: $REGISTER_RESPONSE"
echo ""

# Extract token from response (assuming JSON format)
TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Failed to get auth token. Trying to login instead..."
  
  LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "'$EMAIL'",
      "password": "'$PASSWORD'"
    }')
  
  echo "Login response: $LOGIN_RESPONSE"
  TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get authentication token"
  exit 1
fi

echo "✅ Authentication successful. Token: ${TOKEN:0:20}..."
echo ""

# Step 2: Test profile update
echo "2. Testing profile update..."
PROFILE_UPDATE=$(curl -s -X PATCH "$API_BASE/api/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "first_name": "John",
    "last_name": "Doe Updated",
    "profile_picture_url": "https://example.com/avatar.jpg"
  }')

echo "Profile update response: $PROFILE_UPDATE"
echo ""

# Step 3: Test notification preferences
echo "3. Testing notification preferences..."
PREFS_UPDATE=$(curl -s -X PATCH "$API_BASE/api/profile/notifications" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email_notifications": true,
    "marketing_emails": false,
    "billing_alerts": true,
    "subscription_updates": true
  }')

echo "Notification preferences update: $PREFS_UPDATE"
echo ""

# Step 4: Test getting notification preferences
echo "4. Getting notification preferences..."
PREFS_GET=$(curl -s -X GET "$API_BASE/api/profile/notifications" \
  -H "Authorization: Bearer $TOKEN")

echo "Notification preferences: $PREFS_GET"
echo ""

# Step 5: Test password reset request (won't actually send email in test)
echo "5. Testing password reset request..."
RESET_REQUEST=$(curl -s -X POST "$API_BASE/api/profile/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$EMAIL'"
  }')

echo "Password reset request: $RESET_REQUEST"
echo ""

# Step 6: Test subscription plans
echo "6. Testing subscription plans..."
PLANS=$(curl -s -X GET "$API_BASE/api/subscription/plans")

echo "Subscription plans: $PLANS"
echo ""

# Step 7: Test current subscription
echo "7. Testing current subscription..."
CURRENT_SUB=$(curl -s -X GET "$API_BASE/api/subscription/current" \
  -H "Authorization: Bearer $TOKEN")

echo "Current subscription: $CURRENT_SUB"
echo ""

# Step 8: Test billing history
echo "8. Testing billing history..."
BILLING_HISTORY=$(curl -s -X GET "$API_BASE/api/subscription/billing-history" \
  -H "Authorization: Bearer $TOKEN")

echo "Billing history: $BILLING_HISTORY"
echo ""

# Step 9: Test notifications list
echo "9. Testing notifications list..."
NOTIFICATIONS=$(curl -s -X GET "$API_BASE/api/profile/notifications/events" \
  -H "Authorization: Bearer $TOKEN")

echo "Notifications: $NOTIFICATIONS"
echo ""

# Step 10: Test profile retrieval
echo "10. Testing profile retrieval..."
PROFILE=$(curl -s -X GET "$API_BASE/api/auth/profile" \
  -H "Authorization: Bearer $TOKEN")

echo "Profile: $PROFILE"
echo ""

echo "=== Test completed ==="
echo ""
echo "To run this test:"
echo "1. Start the backend server: cd backend && npm run dev"
echo "2. Make sure PostgreSQL is running"
echo "3. Run migrations: cd backend && npm run migrate"
echo "4. Run this script: ./test-profile-features.sh"