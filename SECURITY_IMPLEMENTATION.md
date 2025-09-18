# Security Implementation for FormCraft AI Embed System

## Overview

This document describes the security features implemented to address the requirements for secure form embedding in FormCraft AI.

## Security Features Implemented

### 1. JWT-Based Embed Tokens

- **Purpose**: Replace simple embed codes with signed JWT tokens
- **Implementation**: `EmbedSecurityService.generateEmbedToken()`
- **Token Contains**:
  - Form ID
  - User ID  
  - Subscription tier
  - Allowed domains list
  - Expiration time (1 hour)
- **Benefits**: 
  - Prevents unauthorized access
  - Time-limited to reduce exposure
  - Tied to specific user and subscription

### 2. Domain Whitelist Validation

- **Purpose**: Control which domains can embed forms
- **Implementation**: 
  - Database: `forms.allowed_domains` array field
  - Frontend: Domain configuration UI in form builder
  - Validation: `EmbedSecurityService.isDomainAllowed()`
- **Features**:
  - Exact domain matching
  - Wildcard subdomain support (*.example.com)
  - Case-insensitive matching
  - www prefix normalization

### 3. Rate Limiting by Subscription Tier

- **Purpose**: Prevent abuse and enforce subscription limits
- **Implementation**: 
  - Database: `form_submission_rate_limits` table
  - Service: `EmbedSecurityService.checkRateLimit()`
- **Limits**:
  - Free tier: 10 submissions/hour per IP
  - Paid tier: 100 submissions/hour per IP
- **Tracking**: Per form, IP address, and domain

### 4. Subscription Status Validation

- **Purpose**: Ensure only active subscribers can use forms
- **Implementation**: Real-time checks in token validation
- **Behavior**: 
  - Inactive subscriptions prevent form loading
  - Downgraded accounts show upgrade messages

### 5. Secure embed.js Script

- **New URL Format**: `/embed.js?id=FORM_ID&key=FORM_TOKEN`
- **Features**:
  - Token validation before rendering
  - Domain validation in browser
  - Secure form submission with token
  - Error handling for security violations

## API Endpoints

### Generate Secure Embed Token
```
POST /api/forms/:id/generate-token
Authorization: Bearer <user_token>
Response: { success: true, token: "<jwt_token>", expiresIn: "1h" }
```

### Update Allowed Domains
```
PUT /api/forms/:id/allowed-domains  
Authorization: Bearer <user_token>
Body: { allowedDomains: ["example.com", "*.subdomain.com"] }
```

### Secure Form Data Endpoint
```
POST /api/forms/embed-secure
Body: { token: "<jwt_token>", hostname: "example.com" }
```

### Secure Form Submission
```
POST /api/forms/submit-secure
Body: { 
  token: "<jwt_token>", 
  data: { name: "...", email: "..." },
  hostname: "example.com"
}
```

## Database Schema Changes

### New Fields in `forms` table:
```sql
ALTER TABLE forms ADD COLUMN allowed_domains TEXT[];
```

### New Rate Limiting table:
```sql
CREATE TABLE form_submission_rate_limits (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES forms(id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    domain VARCHAR(255),
    submission_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(form_id, ip_address, domain)
);
```

## Frontend Security Configuration

### Form Builder Updates:
- Domain configuration interface
- Security settings section
- Secure embed code generation
- Token expiry notifications
- Rate limit information display

### UI Features:
- Add/remove domain fields
- Real-time domain validation
- Copy secure embed code
- Regenerate tokens
- Security status indicators

## Security Flow

### 1. Form Creation
1. User creates form
2. User configures allowed domains
3. User generates secure embed token
4. System validates subscription status
5. JWT token generated with form metadata

### 2. Form Embedding
1. Website includes: `<script src="/embed.js?id=FORM_ID&key=TOKEN"></script>`
2. embed.js validates token server-side
3. Domain validation performed
4. Form rendered only if validation passes

### 3. Form Submission
1. Form submission includes secure token
2. Server validates token and domain
3. Rate limiting checked
4. Subscription status verified
5. Submission processed if all checks pass

## Error Handling

### Common Error Scenarios:
- **Invalid Token**: "Invalid or expired embed token"
- **Domain Mismatch**: "Domain not authorized for this form"  
- **Rate Limited**: "Rate limit exceeded. Please try again later."
- **Inactive Subscription**: "Form is no longer active. Please contact the form owner."

## Migration from Old System

### Backward Compatibility:
- Old iframe embeds continue to work
- Gradual migration to secure system
- Both systems supported during transition

### Migration Strategy:
1. Deploy new secure system
2. Encourage users to regenerate embed codes
3. Provide migration tools and documentation
4. Eventually deprecate old iframe system

## Testing Security Features

### Manual Testing:
1. Create form with domain restrictions
2. Generate secure embed token
3. Test embedding on allowed/disallowed domains
4. Test rate limiting with multiple submissions
5. Test token expiration
6. Test subscription downgrade scenarios

### Automated Testing:
- Unit tests for security service methods
- Integration tests for API endpoints
- End-to-end tests for embed flow
- Load testing for rate limiting

## Future Enhancements

### Potential Additions:
- IP-based restrictions
- Geographic restrictions
- Custom rate limits per form
- Analytics on security violations
- CAPTCHA integration for suspicious activity
- Webhook notifications for security events

## Compliance and Best Practices

### Security Best Practices:
- Short-lived tokens (1 hour expiry)
- Secure token storage (no client-side storage)
- HTTPS enforcement
- Input validation and sanitization
- CORS policy enforcement
- SQL injection prevention

### Privacy Considerations:
- IP address hashing for privacy
- GDPR compliance for data collection
- User consent for tracking
- Data retention policies