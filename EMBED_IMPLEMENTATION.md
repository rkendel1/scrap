# FormCraft AI - Embed Code Implementation

This document describes the embed code functionality that allows users to easily embed their AI-generated forms on any website.

## Features Implemented

### 1. Unique Embed Code Generation
- Each form gets a unique, user-friendly embed code (e.g., `embed_abc123def456`)
- Embed codes are stored in the database with proper associations to forms
- Codes are generated during form creation and linked to the form configuration

### 2. Form Configuration Storage
- All form configurations are properly stored and associated with embed codes
- Form data includes:
  - Generated form fields and structure
  - Styling and design tokens
  - Form metadata (title, description, CTA text, thank you message)
  - User's chosen destination settings

### 3. Cross-Origin Embed Support
- Iframe-based embedding for maximum compatibility across domains
- Proper CORS and frame policies configured for cross-origin access
- Works on any website without security restrictions

### 4. Dynamic Form Rendering
- Forms are dynamically loaded from the database using the embed code
- Real form data is rendered (not mock data)
- Styling and configuration from the original form creation are preserved

### 5. Form Submission Handling
- Submissions are properly stored and associated with the correct form
- Metadata tracking (IP address, user agent, referrer URL)
- Integration with existing connector system for data routing

## Usage

### For Users (Form Creators)
1. Create a form using the conversational form builder
2. Configure your destination (email, Slack, Google Sheets, etc.)
3. Get your embed code from the preview screen
4. Copy the iframe code and paste it on your website

### Embed Code Format
```html
<iframe 
  src="https://formcraft.ai/embed.html?code=YOUR_EMBED_CODE" 
  width="100%" 
  height="500" 
  frameborder="0" 
  style="border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
</iframe>
```

### Alternative Script-based Embed (for same-origin)
```html
<script 
  src="https://formcraft.ai/embed.js" 
  data-embed-code="YOUR_EMBED_CODE">
</script>
```

## API Endpoints

### GET /api/forms/embed/:embedCode
Returns form configuration and styling for a given embed code.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Contact Us",
    "description": "Get in touch with our team",
    "generated_form": {
      "title": "Contact Us",
      "fields": [...],
      "ctaText": "Send Message",
      "thankYouMessage": "Thank you!",
      "styling": {...}
    },
    "styling": {...},
    "embedCode": "embed_abc123",
    "showBranding": true
  }
}
```

### POST /api/forms/submit/:embedCode
Handles form submissions from embedded forms.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Test message"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Form submitted successfully"
}
```

### GET /embed.html
Serves the standalone embed page for iframe embedding.

### GET /embed.js
Serves the JavaScript embed script for same-origin embedding.

## Database Schema

### embed_codes table
- `id`: Primary key
- `form_id`: Foreign key to forms table
- `code`: Unique embed code string
- `domain`: Optional domain restriction
- `is_active`: Boolean flag for active/inactive codes
- `view_count`: Tracking number of form views
- `submission_count`: Tracking number of submissions
- `created_at`: Creation timestamp
- `last_accessed`: Last access timestamp

### form_submissions table
- `id`: Primary key
- `form_id`: Foreign key to forms table
- `embed_code_id`: Foreign key to embed_codes table
- `submission_data`: JSON blob with form data
- `submitted_from_url`: Referrer URL
- `ip_address`: Submitter's IP address
- `user_agent`: Submitter's browser info
- `created_at`: Submission timestamp

## Security Features

1. **CORS Protection**: Proper CORS headers allow cross-origin embedding while maintaining security
2. **Frame Policy**: Configured to allow embedding in iframes from any domain
3. **Input Validation**: All form submissions are validated before storage
4. **Rate Limiting**: API endpoints are protected with rate limiting
5. **Embed Code Validation**: Only active embed codes can receive submissions

## Analytics and Tracking

- View count tracking for each embed code
- Submission count tracking
- Referrer URL tracking for understanding where submissions come from
- User agent tracking for analytics
- Last accessed timestamps for usage patterns

## Fallback and Error Handling

- Graceful fallback to mock data if database is unavailable
- Error messages displayed in embed for invalid/inactive codes
- Comprehensive error logging for debugging
- User-friendly error messages in the embed interface

## Styling and Branding

- Forms maintain their original styling from the creation process
- Branding footer ("Powered by FormCraft AI") for free tier users
- Responsive design that works on all device sizes
- Customizable styling via the original form creation flow

## Integration with Existing System

- Seamlessly integrates with existing form creation workflow
- Works with all existing connector types (email, Slack, Google Sheets, etc.)
- Maintains all existing authentication and user management
- Compatible with subscription tiers and form limits