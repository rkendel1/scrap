# Website Design Token Extractor

A full-stack application that extracts design tokens, CSS variables, form schemas, and metadata from websites and stores them in a PostgreSQL database.

## Architecture

- **Backend**: Express.js with TypeScript (`/backend`)
- **Frontend**: React with Vite and TypeScript (`/frontend`)
- **Database**: PostgreSQL with JSONB columns for flexible data storage
- **Data Extraction**: Enhanced crawler that extracts design tokens, CSS variables, form schemas, and metadata

## Features

### Data Extraction
- **Design Tokens**: Colors, typography, spacing, layout structure
- **CSS Variables**: Custom CSS properties and their values
- **Form Schema**: Complete form structure and field definitions
- **Components**: Buttons, cards, navigation elements, images
- **Metadata**: Page title, description, favicon, preview HTML
- **Voice Analysis**: Tone, personality traits, audience analysis

### Frontend Features
- URL input form for website extraction
- Real-time search through extracted records
- Detailed data visualization with expandable rows
- Color palette previews with visual swatches
- JSON preview for complex data structures
- Responsive design with mobile support

### Backend Features
- RESTful API with comprehensive endpoints
- PostgreSQL integration with JSONB storage
- Database migrations and schema management
- CORS support for frontend integration
- Rate limiting and security middleware
- Health checks and error handling

## Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

## Setup Instructions

### 1. Clone and Setup

```bash
git clone <repository-url>
cd scrap
```

### 2. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE scrap_db;
CREATE USER username WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE scrap_db TO username;
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
npm run build
npm run migrate

# Start development server
npm run dev
```

The backend will be available at `http://localhost:3001`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env if needed (default points to localhost:3001)

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

### POST /api/extract
Extract design tokens and metadata from a website.

**Request Body:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Website data extracted and saved successfully",
  "data": {
    "id": 1,
    "url": "https://example.com",
    "title": "Example Site",
    "color_palette": ["#3b82f6", "#1e40af"],
    "form_schema": [...],
    "css_variables": {...},
    "..."
  }
}
```

### GET /api/records
Get all extracted records.

### GET /api/records/:id
Get a specific record by ID.

### DELETE /api/records/:id
Delete a specific record.

### GET /api/search?q=term
Search records by title, URL, or description.

### GET /health
Health check endpoint.

## Database Schema

The `forms` table stores all extracted data with the following key fields:

- **Basic Info**: `url`, `title`, `description`, `favicon`
- **Design Tokens**: `color_palette`, `primary_colors`, `font_families`, `headings`
- **Layout**: `margins`, `paddings`, `spacing_scale`, `layout_structure`, `grid_system`
- **Components**: `buttons`, `form_fields`, `cards`, `navigation`, `images`
- **CSS Data**: `css_variables`, `raw_css`
- **Form Schema**: `form_schema` (structured form definitions)
- **Branding**: `logo_url`, `brand_colors`, `icons`, `messaging`
- **Preview**: `preview_html` (sample extracted content)
- **Voice Analysis**: `voice_tone`, `personality_traits`, `audience_analysis`
- **Timestamps**: `created_at`, `updated_at`, `extracted_at`

## Production Deployment

### Backend (Express.js)

1. Build the application:
```bash
cd backend
npm run build
```

2. Set production environment variables:
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/db
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com
```

3. Run migrations and start:
```bash
npm run migrate
npm start
```

### Frontend (React)

1. Build the application:
```bash
cd frontend
npm run build
```

2. Deploy the `dist` folder to your static hosting service (Vercel, Netlify, etc.)

3. Set environment variable:
```bash
VITE_API_BASE_URL=https://your-backend-domain.com
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://username:password@localhost:5432/scrap_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=scrap_db
DB_USER=username
DB_PASSWORD=password
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:3001
```

## Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configured for frontend domain
- **Security Headers**: Helmet.js for security headers
- **Input Validation**: URL validation and sanitization
- **SQL Injection Protection**: Parameterized queries

## Development

### Running Tests
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Adding New Extractors

To add new data extraction capabilities:

1. Add new methods to `backend/src/extractor.ts`
2. Update the database schema in `backend/migrations/`
3. Update TypeScript interfaces in `backend/src/` and `frontend/src/types/`
4. Add UI components in `frontend/src/components/`

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists and user has permissions

### CORS Issues
- Verify `FRONTEND_URL` in backend `.env`
- Check `VITE_API_BASE_URL` in frontend `.env`

### Extraction Failures
- Some websites may block crawlers
- Large sites may timeout (30s limit)
- CSS parsing may fail on malformed stylesheets

## License

ISC License