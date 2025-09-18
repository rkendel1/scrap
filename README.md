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

## License

ISC License