# Full Stack Website Design Token Extractor

A complete full-stack application that extracts design tokens, CSS variables, form schemas, and metadata from websites and stores them in a PostgreSQL database.

## 🚀 Features Implemented

### Backend (TypeScript + Express.js)
- **Enhanced Data Extraction**: Extracts design tokens, CSS variables, form schemas, colors, typography, spacing, components
- **PostgreSQL Integration**: Comprehensive database schema with JSONB columns for flexible data storage
- **RESTful API**: Complete CRUD operations with search functionality
- **Security & Performance**: CORS, rate limiting, helmet security headers, input validation
- **Database Migrations**: SQL migration system for schema management
- **Mock Database Option**: In-memory database for testing without PostgreSQL setup

### Frontend (React + Vite + TypeScript)
- **URL Input Form**: Validates URLs and triggers extraction with real-time feedback
- **Data Display Table**: Comprehensive table showing all extracted records with expandable details
- **Color Palette Visualization**: Visual color swatches with hex values
- **JSON Data Viewers**: Formatted display of complex data structures
- **Search Functionality**: Real-time search through extracted records
- **Responsive Design**: Mobile-friendly interface with clean styling
- **CRUD Operations**: View, delete, and manage extracted records

### Database Schema
Stores comprehensive website data in the `forms` table:
- **Basic Metadata**: URL, title, description, favicon
- **Design Tokens**: Color palettes, typography, spacing scales, breakpoints
- **Layout Analysis**: Grid systems, layout structures, component inventories
- **CSS Data**: Raw CSS, CSS variables, parsed design tokens
- **Form Schema**: Complete form field definitions and structures
- **Component Data**: Buttons, navigation, cards, images
- **Voice Analysis**: Tone analysis, personality traits, audience insights
- **Preview Content**: Sample HTML and extracted messaging

## 📊 Data Extraction Capabilities

The application extracts and normalizes:

1. **Design Tokens**
   - Color palettes with usage analysis
   - Typography scales and font families
   - Spacing values (margins, paddings)
   - Layout breakpoints

2. **CSS Variables**
   - Custom CSS properties and values
   - Raw CSS content analysis

3. **Form Schema**
   - Complete form field definitions
   - Input types, names, placeholders
   - Required field indicators

4. **Component Inventory**
   - Buttons with classes and styling
   - Navigation structures
   - Card components
   - Image patterns

5. **Metadata**
   - Page titles and descriptions
   - Favicon extraction
   - Preview HTML snippets
   - Brand messaging analysis

## 🖼️ Screenshots

### Main Interface
![Initial Interface](https://github.com/user-attachments/assets/5e0e0e1c-8b80-40a3-b7a6-63fd75b5f49c)

### Data Display with Extracted Records
![Data Display](https://github.com/user-attachments/assets/8403f49e-e280-42e6-be48-3bc0b7a4f49a)

## 🏗️ Architecture

```
/backend                 # Express.js + TypeScript
├── src/
│   ├── index.ts        # Main server with PostgreSQL
│   ├── index-mock.ts   # Server with mock database
│   ├── extractor.ts    # Enhanced website data extraction
│   ├── database.ts     # PostgreSQL connection
│   ├── database-service.ts  # Database operations
│   └── migrate.ts      # Migration runner
├── migrations/
│   └── 001_create_forms_table.sql
└── package.json

/frontend               # React + Vite + TypeScript
├── src/
│   ├── components/
│   │   ├── UrlForm.tsx      # URL input and extraction
│   │   └── RecordsTable.tsx # Data display and management
│   ├── services/api.ts      # API client
│   ├── types/api.ts         # TypeScript interfaces
│   └── App.tsx              # Main application
└── package.json
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 12+ (optional - can use mock database)

### Quick Start (Mock Database)
```bash
# Backend
cd backend
npm install
npm run build
npm run dev:mock    # Starts with sample data

# Frontend (in new terminal)
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to see the application.

### Production Setup with PostgreSQL
```bash
# 1. Setup database
createdb scrap_db

# 2. Backend
cd backend
cp .env.example .env  # Configure database credentials
npm install
npm run build
npm run migrate       # Run database migrations
npm run dev

# 3. Frontend
cd frontend
cp .env.example .env  # Configure API URL
npm install
npm run dev
```

## 📡 API Endpoints

- `POST /api/extract` - Extract website data
- `GET /api/records` - Get all records
- `GET /api/records/:id` - Get specific record
- `DELETE /api/records/:id` - Delete record
- `GET /api/search?q=term` - Search records
- `GET /health` - Health check

## 🔧 Technical Implementation

### Key Enhancements Made
1. **Full TypeScript Migration**: Complete type safety across backend and frontend
2. **Enhanced Data Extraction**: Expanded beyond original scope to include form schemas, CSS variables, design tokens
3. **PostgreSQL Integration**: Robust database schema with JSONB for flexible data storage
4. **Production-Ready Backend**: Security middleware, rate limiting, error handling
5. **Modern React Frontend**: Hook-based components, responsive design, real-time search
6. **Developer Experience**: Hot reloading, TypeScript compilation, comprehensive documentation

### Data Storage Strategy
- Uses PostgreSQL JSONB columns for flexible schema evolution
- Indexes on frequently queried fields (URL, title, created_at)
- Automatic timestamp management with triggers
- Supports complex nested data structures while maintaining query performance

## 🎯 Use Cases

This application is perfect for:
- **Design System Auditing**: Extract and compare design tokens across multiple sites
- **Competitive Analysis**: Analyze design patterns and form structures
- **Design Token Migration**: Extract existing design systems for standardization
- **Web Accessibility Audits**: Analyze form schemas and component structures
- **Brand Analysis**: Extract color palettes, typography, and messaging patterns

## 🔄 Development Status

✅ **Completed**:
- Full-stack TypeScript application
- PostgreSQL database integration with migrations
- Enhanced data extraction engine
- Complete CRUD API with search
- React frontend with comprehensive data visualization
- Production-ready deployment configuration
- Sample data and mock database for easy testing

The application successfully demonstrates a complete full-stack solution for website design token extraction with modern technologies and best practices.