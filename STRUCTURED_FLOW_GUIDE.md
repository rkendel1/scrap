# FormCraft AI - Structured Flow Guide

## Overview

The enhanced `llm-service.ts` now provides a comprehensive structured flow to guide users through creating, configuring, and publishing forms. This implementation addresses all requirements from the problem statement.

## Flow Architecture

### 1. Form Creation Flow

#### Step 1: Input Website (`/api/forms/flow/init` & `/api/forms/flow/website-input`)
- User enters a URL
- System validates URL format
- Provides guidance for next steps
- **Features**: Real-time validation, user-friendly error messages

#### Step 2: Extract Design Tokens (existing `/api/forms/extract-design-tokens`)
- System extracts CSS, typography, theme, colors
- Analyzes brand voice and messaging
- Saves extracted data to database

#### Step 3: Form Type Selection (`/api/forms/flow/design-extracted`)
- AI analyzes website content to recommend form types
- Provides 5 form type options: Contact, Newsletter, Feedback, Quote, Signup
- Smart recommendations based on website analysis
- **Features**: AI-driven recommendations, detailed use cases

### 2. Configuration Flow

#### Step 4: Form Generation (`/api/forms/flow/form-type-selected` & `/api/forms/flow/generate`)
- User selects form type
- AI generates form using extracted design tokens
- Applies brand colors, fonts, and voice
- **Features**: Account rule validation, user role awareness

#### Step 5: Form Preview & Styling
- Users can preview generated form
- Make styling adjustments (uses existing `adaptFormToWebsite` method)
- Test form functionality
- **Features**: Real-time preview, style customization

#### Step 6: Configure Delivery (`/api/forms/:id/configure-destination`)
- Email delivery (immediate)
- Webhook support (immediate)
- Planned: Google Sheets, Zapier integration
- **Features**: Multiple delivery methods, extensible architecture

### 3. Publishing Flow

#### Step 7: Publish Form
- Authentication prompts for guests
- Account rule enforcement
- Embed code generation with expiration logic
- **Features**: Account-aware publishing, expiration management

## Account & Usage Rules Implementation

### Guest Users
- ✅ Can create forms with 24-hour expiration
- ✅ Limited embed code functionality
- ✅ Prompted to sign up for permanent solutions

### Free Users
- ✅ Limited to 1 active live form
- ✅ Must deactivate current form to create new one
- ✅ Permanent embed codes (no expiration)

### Paid Users
- ✅ Unlimited live forms
- ✅ All features unlocked
- ✅ No restrictions

## New API Endpoints

### Flow Management
- `POST /api/forms/flow/init` - Initialize form creation flow
- `POST /api/forms/flow/website-input` - Process website URL input
- `POST /api/forms/flow/design-extracted` - Get form type recommendations
- `POST /api/forms/flow/form-type-selected` - Process form type selection
- `POST /api/forms/flow/generate` - Enhanced form generation with flow state
- `POST /api/forms/flow/guidance` - Get contextual guidance for current step

### Utility Endpoints
- `GET /api/forms/:id/embed-status` - Check embed code expiration status

## Key Features Implemented

### 1. User Guidance System
- **Contextual guidance** for each flow step
- **Smart recommendations** based on website analysis
- **Progressive disclosure** of options
- **Clear next actions** at each step

### 2. Account Rule Enforcement
- **Real-time validation** of form creation limits
- **User role awareness** throughout the flow
- **Automatic account upgrade prompts**
- **Graceful handling** of account limitations

### 3. Embed Code Management
- **Expiration logic** for guest users (24 hours)
- **Permanent codes** for authenticated users
- **Status checking** and warning system
- **Automatic renewal** prompts

### 4. Flexible Architecture
- **State-driven flow** management
- **Extensible delivery** configuration
- **Future-proof** design for new features
- **Clean separation** of concerns

## Example Flow Sequence

```javascript
// 1. Initialize flow
POST /api/forms/flow/init
// Returns: Welcome message and guidance

// 2. Input website
POST /api/forms/flow/website-input
Body: { "url": "https://example.com" }
// Returns: Validation result and next steps

// 3. Extract design tokens
POST /api/forms/extract-design-tokens
Body: { "url": "https://example.com" }
// Returns: Extracted data with record ID

// 4. Get recommendations
POST /api/forms/flow/design-extracted
Body: { "extractedRecordId": 123 }
// Returns: Smart recommendations and form types

// 5. Select form type
POST /api/forms/flow/form-type-selected
Body: { "extractedRecordId": 123, "formType": "contact" }
// Returns: Flow state and user role info

// 6. Generate form
POST /api/forms/flow/generate
Body: { "extractedRecordId": 123, "formPurpose": "contact" }
// Returns: Generated form, embed code, and flow state

// 7. Configure delivery
POST /api/forms/:id/configure-destination
Body: { "destinationType": "email", "destinationConfig": { "email": "user@example.com" } }
// Returns: Success confirmation

// 8. Check status
GET /api/forms/:id/embed-status
// Returns: Expiration status and warnings
```

## Validation & Error Handling

- **Input validation** at each step
- **User-friendly error messages**
- **Graceful degradation** for missing data
- **Recovery suggestions** for errors

## Future Enhancements Ready

The architecture supports easy addition of:
- Google Sheets integration
- Zapier webhooks
- Advanced styling options
- A/B testing features
- Analytics integration
- Multi-language support

## Testing

All endpoints are tested and working:
- ✅ Flow initialization
- ✅ URL validation
- ✅ Contextual guidance
- ✅ Error handling
- ✅ Account rule enforcement

The structured flow is now fully implemented and provides a seamless, guided experience for users while maintaining flexibility for future expansions.