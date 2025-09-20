# SaaS Subscription Management with Stripe Integration

This document outlines the complete implementation of subscription management using Stripe for the FormCraft AI platform.

## Overview

The platform now includes a comprehensive SaaS subscription system with the following features:

- **Tiered subscription plans** (Free, Pro Monthly, Pro Yearly)
- **Usage-based limits** (forms created, submissions received)
- **Premium feature access** control
- **Stripe-powered payments** and billing management
- **Webhook-based subscription** lifecycle management
- **Real-time usage tracking**

## Architecture

### Backend Components

#### 1. Stripe Service (`backend/src/stripe-service.ts`)
- Manages subscription plans and customer data
- Handles checkout session creation
- Processes billing portal sessions
- Manages webhook events for subscription lifecycle

#### 2. Subscription Middleware (`backend/src/subscription-middleware.ts`)
- Enforces form creation limits
- Tracks submission usage
- Controls premium feature access
- Monitors monthly usage quotas

#### 3. Database Schema (`backend/migrations/007_add_subscription_tables.sql`)
```sql
-- User subscriptions table
user_subscriptions (
  id, user_id, stripe_customer_id, stripe_subscription_id, 
  plan_id, status, current_period_start, current_period_end,
  cancel_at_period_end, created_at, updated_at
)

-- Payment history tracking
payment_history (
  id, user_id, stripe_payment_intent_id, stripe_invoice_id,
  amount, currency, status, description, created_at
)

-- Usage tracking for limits enforcement
user_usage (
  id, user_id, month_year, forms_created, 
  submissions_received, created_at, updated_at
)

-- Webhook events processing
stripe_webhook_events (
  id, stripe_event_id, event_type, processed, 
  data, created_at, processed_at
)
```

### Frontend Components

#### 1. Subscription Manager (`frontend/src/components/SubscriptionManager.tsx`)
- Displays available subscription plans
- Shows current subscription status and usage
- Handles plan upgrades and billing management
- Provides usage analytics and limits visualization

#### 2. Stripe Context (`frontend/src/contexts/StripeContext.tsx`)
- Initializes Stripe.js for frontend integration
- Manages Stripe instance across components

#### 3. API Service Extensions (`frontend/src/services/api.ts`)
- Subscription plan endpoints
- Checkout session creation
- Billing portal access
- Current subscription status

## Subscription Plans

### Free Plan
- **Price**: $0/month
- **Forms**: Up to 3
- **Submissions**: 100/month
- **Connectors**: Basic only
- **Features**: Core form generation

### Pro Monthly
- **Price**: $29/month
- **Forms**: Unlimited
- **Submissions**: 10,000/month
- **Connectors**: Premium included
- **Features**: Advanced analytics, all connectors

### Pro Yearly
- **Price**: $290/year (2 months free)
- **Forms**: Unlimited
- **Submissions**: 10,000/month
- **Connectors**: Premium included
- **Features**: Advanced analytics, all connectors

## API Endpoints

### Subscription Management
```typescript
GET    /api/subscription/plans          // Get available plans
GET    /api/subscription/current        // Get user's subscription
POST   /api/subscription/checkout       // Create checkout session
POST   /api/subscription/billing-portal // Create billing portal
```

### Webhook Processing
```typescript
POST   /api/webhooks/stripe            // Stripe webhook handler
```

## Usage Enforcement

### Form Creation Limits
- Middleware checks form count before allowing creation
- Free plan: 3 forms maximum
- Pro plans: Unlimited forms

### Submission Limits
- Tracks submissions per month per user
- Free plan: 100 submissions/month
- Pro plans: 10,000 submissions/month

### Premium Features
- Controls access to premium connectors
- Based on subscription status and plan type

## Environment Variables

### Backend (.env)
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-stripe-webhook-secret
```

### Frontend (.env)
```bash
# Stripe Frontend
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
```

## Stripe Webhook Events

The system processes the following webhook events:

### Subscription Lifecycle
- `customer.subscription.created` - New subscription activated
- `customer.subscription.updated` - Subscription modified
- `customer.subscription.deleted` - Subscription cancelled

### Payment Events
- `invoice.payment_succeeded` - Successful payment processed
- `invoice.payment_failed` - Payment failed

## Usage Tracking

### Monthly Limits
- Usage resets monthly based on calendar month
- Tracks forms created and submissions received
- Prevents overages with real-time checks

### Data Structure
```typescript
interface UserUsage {
  month_year: string;    // 'YYYY-MM' format
  forms_created: number;
  submissions_received: number;
}
```

## Integration Points

### Form Creation
- Middleware enforces limits before allowing form generation
- Tracks successful creations in usage table

### Form Submissions
- Tracks submission counts after successful processing
- Enforces monthly limits for form owners

### Premium Connectors
- Checks subscription status before allowing premium connector access
- Returns upgrade prompts for free users

## Security Considerations

### Webhook Verification
- All webhooks verified using Stripe signature
- Events deduplicated using Stripe event IDs
- Failed events logged for debugging

### Rate Limiting
- Existing rate limiting applies to subscription endpoints
- Webhook endpoint has separate rate limits

### Data Protection
- Sensitive payment data stored in Stripe
- Local database stores only necessary references
- PII handling follows existing patterns

## Testing

### Local Development
1. Set up Stripe test keys in environment
2. Use Stripe CLI for webhook testing:
   ```bash
   stripe listen --forward-to localhost:3001/api/webhooks/stripe
   ```
3. Test checkout flow with test cards
4. Verify webhook processing

### Test Cards
```
Success: 4242424242424242
Decline: 4000000000000002
3D Secure: 4000000000003220
```

## Deployment

### Database Migration
```bash
cd backend
npm run migrate
```

### Environment Setup
1. Configure Stripe keys in production
2. Set up webhook endpoint in Stripe dashboard
3. Configure DNS for webhook delivery

### Production Considerations
- Use production Stripe keys
- Enable webhook endpoint monitoring
- Set up alerting for failed payments
- Monitor usage metrics

## Monitoring

### Key Metrics
- Subscription conversion rates
- Monthly recurring revenue (MRR)
- Usage vs. limits across plans
- Webhook processing success rates

### Error Monitoring
- Failed webhook processing
- Payment failures
- Usage limit violations
- Subscription status mismatches

## Future Enhancements

### Planned Features
- Annual billing discounts
- Enterprise plans
- Usage-based pricing tiers
- Advanced analytics
- White-label options

### Scalability
- Plan for webhook processing at scale
- Usage tracking optimization
- Billing automation improvements
- Customer success tooling

## Support

### Common Issues
1. **Webhook failures**: Check Stripe dashboard for event logs
2. **Usage tracking errors**: Verify database connection
3. **Payment failures**: Check Stripe customer portal
4. **Limit enforcement**: Review subscription status

### Debugging
- Enable Stripe webhook logs
- Monitor database usage tables
- Check authentication token validity
- Verify plan configurations

This implementation provides a solid foundation for SaaS subscription management that can scale with the business needs.