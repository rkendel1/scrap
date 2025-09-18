# FormCraft AI - SaaS Platform for AI-Native Forms

FormCraft AI transforms the design token extractor into a comprehensive SaaS platform that creates AI-powered forms matching any website's design and tone.

## 🚀 Platform Features

### AI-Powered Form Generation
- **Website Analysis**: Automatically extracts design tokens, color palettes, typography, and voice/tone from target websites
- **Smart Form Creation**: Uses OpenAI GPT-4 to generate optimized form fields based on purpose and website context
- **Brand Matching**: Applies consistent styling and copy that matches the website's personality
- **Purpose Optimization**: Tailored forms for lead generation, contact, surveys, events, and more

### SaaS Infrastructure
- **User Authentication**: JWT-based auth with guest tokens for anonymous creation
- **Subscription Tiers**: 
  - **Free**: 1 live form, basic connectors (email, Google Sheets), branded footer
  - **Pro**: Unlimited forms, premium connectors (Slack, Notion, HubSpot, Salesforce), analytics, branding removal
- **Form Management**: Dashboard for managing forms, analytics, and embed codes
- **Guest-to-User Migration**: Seamlessly transfer guest forms to user accounts after signup

### Embeddable Forms
- **One-Line Embed**: Simple `<script>` tag integration for any website
- **Responsive Design**: Forms adapt to different screen sizes and containers
- **Custom Styling**: Automatically matches host website's design tokens
- **Submission Tracking**: Analytics and form performance monitoring

### Integration Ecosystem
- **Basic Connectors**: Email notifications, Google Sheets integration
- **Premium Connectors**: Slack, Notion, HubSpot, Salesforce integrations
- **Analytics**: Form views, submissions, conversion rates
- **A/B Testing**: Framework for testing form variations (future feature)

## 🏗️ Architecture

```
/backend                    # Express.js + TypeScript + PostgreSQL
├── src/
│   ├── auth-service.ts     # JWT authentication & user management
│   ├── llm-service.ts      # OpenAI integration for form generation
│   ├── saas-service.ts     # SaaS features & form management
│   ├── extractor.ts        # Website analysis & design token extraction
│   └── index.ts            # Main server with API endpoints
├── migrations/
│   ├── 001_create_forms_table.sql      # Original design token storage
│   ├── 002_create_users_table.sql      # User authentication
│   └── 003_modify_forms_for_saas.sql   # SaaS features
└── package.json

/frontend                   # React + Vite + TypeScript
├── src/
│   ├── components/
│   │   ├── FormBuilder.tsx         # AI form creation interface
│   │   ├── AuthForms.tsx          # Login/register components
│   │   ├── EmbeddableForm.tsx     # Form renderer component
│   │   ├── UrlForm.tsx            # Legacy design extractor
│   │   └── RecordsTable.tsx       # Legacy data management
│   ├── types/api.ts               # TypeScript interfaces
│   └── App.tsx                    # Main application with navigation
├── public/
│   └── embed.html                 # Standalone embeddable form
└── package.json
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration with guest token association
- `POST /api/auth/login` - User login with JWT token
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/guest` - Create guest token for anonymous users

### Form Management
- `POST /api/forms/generate` - Generate AI form from website analysis
- `GET /api/forms` - Get user's forms
- `GET /api/forms/:id` - Get specific form
- `PATCH /api/forms/:id/toggle-live` - Activate/deactivate form
- `POST /api/forms/submit/:embedCode` - Public form submission endpoint
- `GET /api/forms/:id/analytics` - Form performance analytics

### Connectors & Integrations
- `GET /api/connectors` - Get available connectors (filtered by subscription)
- `POST /api/forms/:id/connectors` - Connect form to external service

### Legacy Endpoints (Preserved)
- `POST /api/extract` - Extract design tokens from website
- `GET /api/records` - Get all extraction records
- `DELETE /api/records/:id` - Delete extraction record
- `GET /api/search` - Search extraction records

## 🎯 Use Cases

### For Businesses
- **Lead Generation**: Create forms that match landing page design and convert better
- **Customer Support**: Embed contextual support forms that feel native to each page
- **Event Registration**: Generate event-specific forms with appropriate tone and styling
- **Market Research**: Deploy surveys that match brand aesthetics across multiple sites

### For Agencies & Developers
- **Client Projects**: Quickly generate forms for client websites without custom development
- **A/B Testing**: Test different form approaches with AI-generated variations
- **Brand Compliance**: Ensure forms always match client brand guidelines
- **Rapid Prototyping**: Generate functional forms for mockups and demos

### For SaaS Platforms
- **Multi-tenant Forms**: Create forms that adapt to each tenant's branding
- **Embedded Solutions**: Offer form capabilities as a feature within other platforms
- **User Onboarding**: Dynamic forms that adapt based on user context and journey stage

## 🚦 Getting Started

### 1. Environment Setup
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your database credentials and OpenAI API key

# Frontend  
cd frontend
cp .env.example .env
# Edit .env if needed (default points to localhost:3001)
```

### 2. Database Setup
```sql
CREATE DATABASE scrap_db;
CREATE USER username WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE scrap_db TO username;
```

### 3. Run Migrations
```bash
cd backend
npm install
npm run build
npm run migrate
```

### 4. Start Development Servers
```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)  
cd frontend
npm install
npm run dev
```

### 5. Access the Platform
- **Main Application**: http://localhost:5173
- **API Documentation**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/health

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/scrap_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=scrap_db
DB_USER=username
DB_PASSWORD=password

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# AI Integration
OPENAI_API_KEY=your-openai-api-key
```

**Frontend (.env)**
```env
VITE_API_BASE_URL=http://localhost:3001
```

## 🎨 Customization

### Adding New Form Types
1. Add form purpose to `FormBuilder.tsx` dropdown
2. Update LLM prompts in `llm-service.ts` for purpose-specific optimization
3. Add validation rules in form generation logic

### Creating Custom Connectors
1. Add connector definition to `003_modify_forms_for_saas.sql`
2. Implement connector logic in `saas-service.ts`
3. Add configuration UI in frontend connector management

### Extending Design Token Analysis
1. Add new extraction methods to `extractor.ts`
2. Update database schema to store new token types
3. Modify LLM prompts to utilize new design data

## 📊 Analytics & Monitoring

### Form Performance Metrics
- **View Count**: Track form impressions
- **Submission Rate**: Monitor conversion performance  
- **Source Analysis**: See which domains generate most submissions
- **Time-based Analytics**: Track performance over time

### User Metrics
- **Form Usage**: Monitor forms per user and subscription tier limits
- **Feature Adoption**: Track which connectors and features are most used
- **Growth Metrics**: User acquisition and upgrade conversion

## 🔐 Security Features

- **Input Validation**: All form inputs validated and sanitized
- **Rate Limiting**: API endpoints protected against abuse
- **CORS Configuration**: Secure cross-origin requests
- **SQL Injection Protection**: Parameterized queries throughout
- **XSS Prevention**: HTML escaping in embeddable forms
- **JWT Security**: Secure token-based authentication

## 🚀 Deployment

### Production Environment
1. Set up PostgreSQL database
2. Configure environment variables for production
3. Build and deploy backend to cloud service (Heroku, AWS, etc.)
4. Build and deploy frontend to static hosting (Vercel, Netlify, etc.)
5. Set up domain and SSL certificates
6. Configure monitoring and logging

### Docker Deployment
```bash
# Build containers
docker-compose build

# Start services
docker-compose up -d

# Run migrations
docker-compose exec backend npm run migrate
```

## 📈 Roadmap

### Phase 1: Core Platform ✅
- User authentication and subscription tiers
- AI form generation with website analysis
- Basic embeddable forms
- Essential connectors (email, Google Sheets)

### Phase 2: Advanced Features (In Progress)
- Premium connectors (Slack, Notion, HubSpot, Salesforce)
- Advanced analytics dashboard
- A/B testing framework
- Form templates and themes

### Phase 3: Enterprise Features (Planned)
- White-label solutions
- Advanced user management
- Custom connector SDK
- Enterprise security compliance

### Phase 4: AI Enhancements (Future)
- Multi-language form generation
- Voice-to-form conversion
- Predictive form optimization
- Auto-generated follow-up sequences

## 📄 License

ISC License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

- **Documentation**: See README files in backend/ and frontend/ directories
- **Issues**: GitHub Issues for bug reports and feature requests
- **Community**: Discussions for questions and community support