# SaaS Deployment Checklist

## Pre-Deployment Setup

### 1. Stripe Account Configuration
- [ ] Create Stripe account (or use existing)
- [ ] Set up subscription products in Stripe Dashboard
- [ ] Configure webhook endpoints
- [ ] Generate API keys (test and production)
- [ ] Test webhook delivery

### 2. Database Setup
- [ ] Run migration 007: `npm run migrate`
- [ ] Verify subscription tables created
- [ ] Test database connections
- [ ] Set up backup strategy

### 3. Environment Variables

#### Backend (.env)
```bash
# Required Stripe variables
STRIPE_SECRET_KEY=sk_live_your-production-secret-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-production-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-production-webhook-secret

# Existing variables...
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your-production-jwt-secret
OPENAI_API_KEY=your-openai-key
```

#### Frontend (.env)
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your-production-publishable-key
VITE_API_BASE_URL=https://your-api-domain.com
```

### 4. Stripe Dashboard Configuration

#### Products & Prices
- [ ] Create "Pro Monthly" product with $29/month price
- [ ] Create "Pro Yearly" product with $290/year price
- [ ] Copy price IDs for configuration
- [ ] Test checkout with test mode

#### Webhooks
- [ ] Add webhook endpoint: `https://your-api-domain.com/api/webhooks/stripe`
- [ ] Select events:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- [ ] Copy webhook signing secret

## Deployment Steps

### 1. Backend Deployment
```bash
cd backend
npm install
npm run build
npm run migrate
npm start
```

### 2. Frontend Deployment
```bash
cd frontend
npm install
npm run build
# Deploy dist/ to your hosting provider
```

### 3. Production Testing

#### Subscription Flow
- [ ] Test subscription signup
- [ ] Verify webhook processing
- [ ] Test billing portal access
- [ ] Verify usage tracking
- [ ] Test limit enforcement

#### Payment Testing
- [ ] Test successful payments
- [ ] Test failed payments
- [ ] Test subscription cancellation
- [ ] Test subscription reactivation

### 4. Monitoring Setup

#### Application Monitoring
- [ ] Set up error tracking
- [ ] Monitor webhook processing
- [ ] Track subscription metrics
- [ ] Set up usage alerts

#### Stripe Monitoring
- [ ] Enable email notifications
- [ ] Set up failed payment alerts
- [ ] Monitor webhook delivery
- [ ] Review subscription analytics

## Post-Deployment Verification

### 1. User Experience Testing
- [ ] Create test user account
- [ ] Test form creation limits
- [ ] Test subscription upgrade
- [ ] Test billing management
- [ ] Verify usage tracking

### 2. System Health Checks
- [ ] Database connections stable
- [ ] Webhook endpoint responsive
- [ ] API endpoints functional
- [ ] Error handling working

### 3. Business Logic Verification
- [ ] Free users limited to 3 forms
- [ ] Pro users have unlimited forms
- [ ] Submission limits enforced
- [ ] Premium connectors restricted
- [ ] Usage resets monthly

## Security Checklist

### 1. API Security
- [ ] All endpoints require authentication
- [ ] Webhook signatures verified
- [ ] Rate limiting enabled
- [ ] HTTPS enforced

### 2. Data Protection
- [ ] PII handling compliant
- [ ] Payment data not stored locally
- [ ] Database access restricted
- [ ] Logs sanitized

## Rollback Plan

### 1. Quick Rollback
```bash
# Disable new subscriptions
# Revert to previous deployment
# Verify existing subscriptions still work
```

### 2. Data Recovery
- [ ] Database backup procedures
- [ ] Stripe data export
- [ ] User migration plan
- [ ] Communication strategy

## Support Preparation

### 1. Documentation
- [ ] User subscription guide
- [ ] Admin troubleshooting guide
- [ ] API documentation updated
- [ ] Error code reference

### 2. Support Tools
- [ ] User lookup by email
- [ ] Subscription status check
- [ ] Usage statistics access
- [ ] Refund processing procedure

## Performance Considerations

### 1. Scale Planning
- [ ] Webhook processing capacity
- [ ] Database query optimization
- [ ] Usage tracking efficiency
- [ ] Cache implementation

### 2. Cost Monitoring
- [ ] Stripe processing fees
- [ ] Infrastructure costs
- [ ] Support overhead
- [ ] Refund policies

## Legal Considerations

### 1. Terms of Service
- [ ] Subscription terms updated
- [ ] Cancellation policy clear
- [ ] Refund policy defined
- [ ] Usage limits documented

### 2. Privacy Policy
- [ ] Payment data handling
- [ ] Stripe integration disclosed
- [ ] Data retention policies
- [ ] User rights documented

## Success Metrics

### 1. Technical Metrics
- [ ] Webhook success rate > 99%
- [ ] API response time < 500ms
- [ ] Database uptime > 99.9%
- [ ] Error rate < 1%

### 2. Business Metrics
- [ ] Conversion rate tracking
- [ ] Monthly recurring revenue
- [ ] Customer satisfaction
- [ ] Support ticket volume

## Emergency Contacts

### 1. Technical Issues
- Backend developer: [contact]
- Database admin: [contact]
- DevOps engineer: [contact]

### 2. Business Issues
- Product manager: [contact]
- Customer success: [contact]
- Finance team: [contact]

### 3. External Services
- Stripe support: support@stripe.com
- Hosting provider: [contact]
- DNS provider: [contact]

---

**Note**: This checklist should be customized based on your specific deployment environment and business requirements.