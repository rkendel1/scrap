# API Testing Guide for Stripe Integration

This guide provides manual testing procedures for the Stripe subscription integration.

## Prerequisites

1. Backend server running on port 3001
2. Database with migrations applied
3. Stripe test keys configured
4. Test user account created

## Testing Endpoints

### 1. Get Subscription Plans

```bash
curl -X GET "http://localhost:3001/api/subscription/plans"
```

Expected Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "free",
      "name": "Free",
      "price": 0,
      "interval": "month",
      "features": ["Up to 3 forms", "100 submissions/month", "Basic connectors"],
      "formLimit": 3,
      "submissionLimit": 100,
      "premiumConnectors": false
    },
    {
      "id": "pro_monthly",
      "name": "Pro",
      "price": 29,
      "interval": "month",
      "features": ["Unlimited forms", "10,000 submissions/month", "Premium connectors", "Advanced analytics"],
      "formLimit": -1,
      "submissionLimit": 10000,
      "premiumConnectors": true
    }
  ]
}
```

### 2. Get Current Subscription (Authenticated)

```bash
curl -X GET "http://localhost:3001/api/subscription/current" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected Response (Free User):
```json
{
  "success": true,
  "data": {
    "subscription": null,
    "usage": {
      "formLimit": 3,
      "submissionLimit": 100,
      "premiumConnectors": false
    },
    "currentUsage": {
      "formsCreated": 0,
      "submissionsReceived": 0
    }
  }
}
```

### 3. Create Checkout Session (Authenticated)

```bash
curl -X POST "http://localhost:3001/api/subscription/checkout" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"planId": "pro_monthly"}'
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_..."
  }
}
```

### 4. Create Billing Portal Session (Authenticated)

```bash
curl -X POST "http://localhost:3001/api/subscription/billing-portal" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "portalUrl": "https://billing.stripe.com/session/..."
  }
}
```

## Testing Usage Limits

### 1. Test Form Creation Limit

Create 4 forms as a free user to test limit enforcement:

```bash
# This should succeed (form 1)
curl -X POST "http://localhost:3001/api/forms/generate" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "extractedRecordId": 1,
       "formPurpose": "Contact form",
       "formName": "Test Form 1"
     }'

# Repeat for forms 2 and 3...

# This should fail (form 4 - exceeds limit)
curl -X POST "http://localhost:3001/api/forms/generate" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "extractedRecordId": 1,
       "formPurpose": "Contact form",
       "formName": "Test Form 4"
     }'
```

Expected Error Response:
```json
{
  "error": "Form limit exceeded",
  "message": "Your current plan allows up to 3 forms. Upgrade to create more forms.",
  "upgradeRequired": true,
  "currentCount": 3,
  "limit": 3
}
```

### 2. Test Premium Connector Access

```bash
curl -X GET "http://localhost:3001/api/connectors" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Free users should only see basic connectors.

## Testing Webhooks

### 1. Set up Stripe CLI (Development)

```bash
stripe login
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

### 2. Test Subscription Creation Event

```bash
stripe trigger customer.subscription.created
```

Check server logs for webhook processing.

### 3. Test Manual Webhook

```bash
curl -X POST "http://localhost:3001/api/webhooks/stripe" \
     -H "Stripe-Signature: WEBHOOK_SIGNATURE" \
     -H "Content-Type: application/json" \
     -d '{
       "id": "evt_test_webhook",
       "object": "event",
       "api_version": "2020-08-27",
       "created": 1609459200,
       "type": "customer.subscription.created",
       "data": {
         "object": {
           "id": "sub_test",
           "object": "subscription",
           "status": "active",
           "customer": "cus_test",
           "metadata": {
             "userId": "1",
             "planId": "pro_monthly"
           }
         }
       }
     }'
```

## Frontend Testing

### 1. Subscription Manager Component

Open browser to: `http://localhost:5173`

1. Login as test user
2. Navigate to Subscription page
3. Verify plans display correctly
4. Test upgrade button functionality
5. Verify current usage display

### 2. Form Creation Limits

1. Login as free user
2. Try creating 4 forms
3. Verify limit enforcement message
4. Check upgrade prompt appears

## Database Verification

### 1. Check User Subscriptions

```sql
SELECT * FROM user_subscriptions WHERE user_id = 1;
```

### 2. Check Usage Tracking

```sql
SELECT * FROM user_usage WHERE user_id = 1;
```

### 3. Check Webhook Events

```sql
SELECT * FROM stripe_webhook_events ORDER BY created_at DESC LIMIT 10;
```

## Error Testing

### 1. Invalid Plan ID

```bash
curl -X POST "http://localhost:3001/api/subscription/checkout" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"planId": "invalid_plan"}'
```

Expected: 400 error with validation message

### 2. Unauthenticated Request

```bash
curl -X GET "http://localhost:3001/api/subscription/current"
```

Expected: 401 authentication error

### 3. Malformed Webhook

```bash
curl -X POST "http://localhost:3001/api/webhooks/stripe" \
     -H "Content-Type: application/json" \
     -d '{"invalid": "data"}'
```

Expected: 400 webhook verification error

## Load Testing

### 1. Multiple Form Creations

```bash
for i in {1..5}; do
  curl -X POST "http://localhost:3001/api/forms/generate" \
       -H "Authorization: Bearer YOUR_JWT_TOKEN" \
       -H "Content-Type: application/json" \
       -d "{\"extractedRecordId\": 1, \"formPurpose\": \"Test $i\"}" &
done
wait
```

### 2. Concurrent Usage Tracking

Test multiple submissions simultaneously to verify usage tracking accuracy.

## Monitoring Points

### 1. Key Metrics to Monitor

- Response times for subscription endpoints
- Webhook processing success rate
- Database query performance
- Error rates and types

### 2. Log Analysis

Check server logs for:
- Stripe API calls
- Database queries
- Usage limit enforcements
- Webhook processing results

### 3. Performance Baselines

Establish baselines for:
- Subscription endpoint response times
- Form creation with limits check
- Usage tracking updates
- Webhook processing time

## Troubleshooting Common Issues

### 1. Webhook Not Processing

- Check Stripe CLI connection
- Verify webhook signing secret
- Check network connectivity
- Review server logs

### 2. Usage Limits Not Enforcing

- Verify middleware is applied
- Check database connections
- Review usage tracking logic
- Test with fresh user

### 3. Checkout Session Failures

- Verify Stripe API keys
- Check plan configuration
- Review customer creation
- Test with different browsers

This guide should help verify that all subscription functionality is working correctly before production deployment.