# Design System & Voice Extraction API

A Node.js API service that automatically extracts design systems and voice/tone analysis from websites. Simply provide a URL and receive comprehensive insights about the site's visual design patterns and content voice.

## Features

### Design System Extraction
- **Colors**: Extract color palettes, primary colors, and usage patterns
- **Typography**: Analyze font families, sizes, weights, and heading hierarchy
- **Spacing**: Identify margin/padding patterns and spacing scales
- **Layout**: Analyze page structure, navigation, and grid systems
- **Components**: Extract buttons, forms, cards, and other UI components
- **Branding**: Identify logos, icons, and brand imagery patterns

### Voice & Tone Analysis
- **Tone Analysis**: Identify formal, casual, friendly, authoritative, playful, or urgent tones
- **Writing Style**: Analyze sentence structure, word complexity, and punctuation usage
- **Vocabulary**: Examine word frequency, diversity, and domain-specific terms
- **Messaging**: Extract value propositions, CTAs, and key themes
- **Personality**: Determine brand personality traits (innovative, trustworthy, approachable, etc.)
- **Audience**: Infer target audience based on language complexity and content focus

## API Endpoints

### `POST /extract`
Extract design system and voice analysis from a website.

**Request Body:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "url": "https://example.com",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "designSystem": {
    "colors": {
      "palette": ["#3b82f6", "#1e40af", "#f59e0b"],
      "primary": ["#3b82f6", "#1e40af"],
      "usage": { "#3b82f6": 5, "#1e40af": 3 }
    },
    "typography": {
      "fontFamilies": ["Inter", "system-ui"],
      "headings": [
        { "tag": "h1", "text": "Main Heading", "level": 1 }
      ],
      "textSamples": ["Sample text content..."]
    },
    "spacing": {
      "margins": ["1rem", "2rem", "3rem"],
      "paddings": ["0.5rem", "1rem", "1.5rem"],
      "scale": [{ "value": 8, "unit": "px" }, { "value": 16, "unit": "px" }]
    },
    "layout": {
      "structure": {
        "hasHeader": true,
        "hasFooter": true,
        "hasSidebar": false,
        "mainContent": true
      },
      "navigation": [{ "links": [{"text": "Home", "href": "/"}] }]
    },
    "components": {
      "buttons": [{ "text": "Get Started", "type": "button", "classes": "btn primary" }],
      "forms": [{ "fields": [{"type": "email", "name": "email"}] }],
      "cards": [{ "hasImage": true, "hasTitle": true }]
    },
    "branding": {
      "logo": "/logo.png",
      "icons": [{ "type": "svg", "classes": "icon-home" }],
      "messaging": ["Transform your business"]
    }
  },
  "voice": {
    "tone": {
      "primary": "authoritative",
      "scores": [
        { "tone": "authoritative", "score": 8 },
        { "tone": "friendly", "score": 5 }
      ]
    },
    "style": {
      "sentenceStyle": {
        "averageLength": 15,
        "shortSentenceRatio": 0.6,
        "variability": 5.2
      },
      "wordChoice": {
        "complexityRatio": 0.3,
        "averageWordLength": 5.2
      }
    },
    "vocabulary": {
      "mostFrequentWords": [["innovative", 8], ["solution", 6]],
      "vocabularyDiversity": 0.75,
      "domainTerms": {
        "technical": ["platform", "integration"],
        "business": ["growth", "revenue"]
      }
    },
    "messaging": {
      "valuePropositions": ["Transform your business with AI"],
      "callsToAction": ["Get Started", "Learn More"],
      "themes": ["innovation", "trust", "quality"]
    },
    "personality": {
      "dominantTraits": ["innovative", "expert", "trustworthy"],
      "personalityProfile": "thought-leader"
    },
    "audience": {
      "primary": "business",
      "complexity": "medium"
    }
  }
}
```

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### `GET /`
API documentation and endpoint information.

## Installation & Usage

### Prerequisites
- Node.js 14+ 
- npm

### Setup
1. Clone the repository:
```bash
git clone <repository-url>
cd scrap
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

The API will be available at `http://localhost:3000`

### Example Usage

```bash
# Test the health endpoint
curl http://localhost:3000/health

# Extract design system and voice from a website
curl -X POST http://localhost:3000/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

## Configuration

The API includes built-in security and rate limiting:
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Enabled for cross-origin requests
- **Security Headers**: Helmet.js for security headers
- **Request Logging**: Morgan for HTTP request logging

## Technology Stack

- **Express.js**: Web framework
- **Cheerio**: Server-side jQuery for HTML parsing
- **CSS-Tree**: CSS parsing and analysis
- **Axios**: HTTP client for fetching web pages
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing

## Use Cases

- **Design System Audits**: Analyze existing websites to document design patterns
- **Competitive Analysis**: Study competitor design systems and messaging
- **Brand Voice Analysis**: Understand tone and messaging patterns
- **Design Inspiration**: Extract design patterns from multiple sites
- **Content Strategy**: Analyze successful messaging and voice patterns
- **Automated Documentation**: Generate design system documentation

## Limitations

- Requires publicly accessible URLs
- CSS analysis limited to inline styles and basic external stylesheet detection
- JavaScript-rendered content may not be fully captured
- Rate limited to prevent abuse

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

# 🐳 Docker Development Setup

## Quick Start with Docker Compose

The project includes a complete Docker Compose setup for local development with PostgreSQL, backend API, and React frontend.

### Prerequisites
- Docker & Docker Compose installed
- Git

### 🚀 Launch Development Environment

1. **Clone and navigate to project:**
```bash
git clone <repository-url>
cd scrap
```

2. **Start all services:**
```bash
docker compose up -d
```

3. **Run database migrations:**
```bash
docker compose exec backend npm run migrate
```

4. **Access the application:**
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/health

### 🛠️ Services

| Service | Port | Description |
|---------|------|-------------|
| `frontend` | 5173 | React app with hot reload |
| `backend` | 3001 | Express API with TypeScript |
| `db` | 5432 | PostgreSQL database |

### 🔧 Configuration

The setup uses the following environment files:
- **Root**: `.env` - Docker Compose variables
- **Backend**: `backend/.env` - API configuration
- **Frontend**: `frontend/.env` - React app configuration

### 📝 Development Commands

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f [service-name]

# Stop all services
docker compose down

# Rebuild and restart
docker compose up --build -d

# Execute commands in containers
docker compose exec backend npm run migrate
docker compose exec backend npm run build
```

---

# 🔌 Connector Testing Guide

The platform includes built-in connectors for integrating with external services. This guide walks you through testing each connector end-to-end.

## 📋 Available Connectors

| Connector | Purpose | Configuration Required |
|-----------|---------|----------------------|
| **Email** | Send form submissions via email | SMTP credentials |
| **Slack** | Post to Slack channels | Webhook URL |
| **Google Sheets** | Add rows to spreadsheets | Service account credentials |
| **Airtable** | Create records | API key & base ID |
| **HubSpot** | Create contacts/leads | API key |
| **Microsoft Teams** | Team notifications | Webhook URL |

## 🧪 End-to-End Testing Workflow

### 1. Setup Test Environment

**Start the development environment:**
```bash
docker compose up -d
docker compose exec backend npm run migrate
```

**Access the application:**
- Open http://localhost:5173 in your browser
- Create an account or login
- Create a test form

### 2. Email Connector Testing

**Configure Email Connector:**

1. **Update backend/.env:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-test-email@gmail.com
EMAIL_PASS=your-app-password
```

2. **Test via API:**
```bash
# Get auth token first
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test email connector
curl -X POST http://localhost:3001/api/forms/1/test-connector \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "connectorType": "email",
    "settings": {
      "to": "recipient@example.com",
      "subject": "Test Form Submission"
    }
  }'
```

3. **Verify:**
   - Check backend logs: `docker compose logs backend`
   - Look for email sending confirmation
   - Check recipient inbox

### 3. Slack Connector Testing

**Setup Slack Webhook:**

1. **Create Slack App:**
   - Go to https://api.slack.com/apps
   - Create new app → From scratch
   - Select your workspace

2. **Enable Incoming Webhooks:**
   - Go to "Incoming Webhooks" → Activate
   - Click "Add New Webhook to Workspace"
   - Select channel and copy webhook URL

3. **Configure Environment:**
```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

4. **Test Connector:**
```bash
curl -X POST http://localhost:3001/api/forms/1/test-connector \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "connectorType": "slack",
    "settings": {
      "webhookUrl": "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK",
      "channel": "#general"
    }
  }'
```

5. **Verify:**
   - Check Slack channel for test message
   - Verify message formatting and content

### 4. Google Sheets Connector Testing

**Setup Google Sheets Access:**

1. **Create Service Account:**
   - Go to Google Cloud Console
   - Enable Google Sheets API
   - Create service account
   - Download JSON credentials

2. **Configure Credentials:**
```bash
# Base64 encode the service account JSON
cat service-account.json | base64 -w 0
```

```env
GOOGLE_SHEETS_CREDENTIALS=your-base64-encoded-json
```

3. **Prepare Test Sheet:**
   - Create Google Sheet
   - Share with service account email
   - Copy spreadsheet ID from URL

4. **Test Connector:**
```bash
curl -X POST http://localhost:3001/api/forms/1/test-connector \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "connectorType": "googleSheets",
    "settings": {
      "spreadsheetId": "your-spreadsheet-id",
      "sheetName": "Sheet1"
    }
  }'
```

5. **Verify:**
   - Check Google Sheet for new row
   - Verify data mapping

### 5. Complete Form Submission Flow

**Test Real Form Submission:**

1. **Create Form in UI:**
   - Open http://localhost:5173
   - Navigate to form builder
   - Create test form with fields

2. **Configure Connectors:**
   - Go to form settings
   - Add and configure desired connectors
   - Save configuration

3. **Submit Test Data:**
   - Use the form's public URL
   - Fill out and submit form
   - Monitor all configured connectors

4. **Verify End-to-End:**
   - Check each connector received data
   - Verify data format and completeness
   - Review logs for any errors

## 🐛 Troubleshooting

### Common Issues

**Database Connection Errors:**
```bash
# Check database status
docker compose logs db

# Restart database
docker compose restart db
```

**Backend Build Failures:**
```bash
# Rebuild backend
docker compose build backend
docker compose up -d backend
```

**Connector Authentication Issues:**
- Verify environment variables are set correctly
- Check credential formats (base64 encoding for Google Sheets)
- Ensure external service permissions are configured

**CORS Issues:**
- Verify `FRONTEND_URL` is set correctly in backend/.env
- Check that frontend is accessible at configured URL

### Debugging Tips

1. **Monitor Logs:**
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
```

2. **Check Environment Variables:**
```bash
docker compose exec backend env | grep -E "(EMAIL|SLACK|GOOGLE)"
```

3. **Test API Directly:**
```bash
# Health check
curl http://localhost:3001/health

# Connector definitions
curl http://localhost:3001/api/connector-definitions
```

## 🔒 Security Notes

- Never commit real credentials to version control
- Use environment variables for all sensitive data
- Rotate API keys and tokens regularly
- Test with non-production accounts when possible

## License

ISC License