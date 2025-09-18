import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { WebsiteExtractor } from './extractor';
import { DatabaseService } from './database-service';
import { AuthService, AuthRequest } from './auth-service';
import { LLMService } from './llm-service';
import { SaaSService } from './saas-service';
import pool from './database';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize services
const extractor = new WebsiteExtractor();
const dbService = new DatabaseService();
const authService = new AuthService();
const llmService = new LLMService();
const saasService = new SaaSService();

// Middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use(limiter);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealthy = await dbService.checkHealth();
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      database: dbHealthy ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// Extract and save website data
app.post('/api/extract', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    console.log(`Extracting data for: ${url}`);

    // Extract website data
    const extractedData = await extractor.extractWebsiteData(url);
    
    // Save to database
    const savedRecord = await dbService.saveExtractedData(extractedData);

    res.json({
      success: true,
      message: 'Website data extracted and saved successfully',
      data: savedRecord
    });

  } catch (error) {
    console.error('Extraction error:', error);
    res.status(500).json({ 
      error: 'Failed to extract website data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all records
app.get('/api/records', async (req, res) => {
  try {
    const records = await dbService.getAllRecords();
    res.json({
      success: true,
      data: records,
      count: records.length
    });
  } catch (error) {
    console.error('Fetch records error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch records',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get single record by ID
app.get('/api/records/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid record ID' });
    }

    const record = await dbService.getRecordById(id);
    
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('Fetch record error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch record',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete record
app.delete('/api/records/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid record ID' });
    }

    const deleted = await dbService.deleteRecord(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json({
      success: true,
      message: 'Record deleted successfully'
    });
  } catch (error) {
    console.error('Delete record error:', error);
    res.status(500).json({ 
      error: 'Failed to delete record',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Search records
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const records = await dbService.searchRecords(q);
    
    res.json({
      success: true,
      data: records,
      count: records.length,
      query: q
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Failed to search records',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'Website Design Token Extraction API',
    version: '1.0.0',
    description: 'Extracts design tokens, CSS variables, form schemas, and metadata from websites',
    endpoints: {
      'POST /api/extract': {
        description: 'Extract design tokens and metadata from a website',
        body: { url: 'https://example.com' },
        response: 'Extracted data saved to database'
      },
      'GET /api/records': {
        description: 'Get all extracted records',
        response: 'Array of form records'
      },
      'GET /api/records/:id': {
        description: 'Get a specific record by ID',
        response: 'Single form record'
      },
      'DELETE /api/records/:id': {
        description: 'Delete a specific record by ID',
        response: 'Success confirmation'
      },
      'GET /api/search?q=term': {
        description: 'Search records by title, URL, or description',
        response: 'Array of matching records'
      },
      'GET /health': {
        description: 'Health check endpoint',
        response: 'Server and database status'
      }
    }
  });
});

// Error handler
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// ====== AUTHENTICATION ENDPOINTS ======

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, guestToken } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await authService.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    // Create new user
    const user = await authService.createUser(email, password, firstName, lastName);
    const token = authService.generateToken(user.id);

    // Associate guest token if provided
    if (guestToken) {
      try {
        await authService.associateGuestWithUser(guestToken, user.id);
      } catch (error) {
        console.warn('Failed to associate guest token:', error);
      }
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Failed to register user',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await authService.authenticateUser(email, password);
    
    if (!result) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: result.user,
      token: result.token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Failed to login',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user profile
app.get('/api/auth/profile', authService.authenticateToken, async (req: AuthRequest, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Create guest token
app.post('/api/auth/guest', async (req, res) => {
  try {
    const guestToken = await authService.createGuestToken();
    res.json({
      success: true,
      guestToken
    });
  } catch (error) {
    console.error('Guest token error:', error);
    res.status(500).json({ 
      error: 'Failed to create guest token',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ====== SAAS FORM ENDPOINTS ======

// Create AI-generated form from website
app.post('/api/forms/generate', authService.optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { 
      url, 
      formPurpose, 
      formName, 
      formDescription, 
      destinationType,
      destinationConfig,
      guestToken 
    } = req.body;

    if (!url || !formPurpose) {
      return res.status(400).json({ error: 'URL and form purpose are required' });
    }

    // Check form limits for authenticated users
    if (req.user) {
      const canCreate = await authService.canUserCreateForm(req.user.id);
      if (!canCreate) {
        return res.status(403).json({ 
          error: 'Form limit reached. Upgrade to Pro for unlimited forms.',
          upgradeRequired: true
        });
      }
    }

    console.log(`Generating form for: ${url}`);

    // Extract website data
    const extractedData = await extractor.extractWebsiteData(url);
    
    // Generate form with LLM
    const generatedForm = await llmService.generateFormFromWebsite({
      url: extractedData.url,
      title: extractedData.title,
      description: extractedData.description,
      voiceAnalysis: extractedData.voiceAnalysis,
      designTokens: extractedData.designTokens,
      messaging: extractedData.designTokens.messaging || []
    }, formPurpose);

    // Get guest token ID if provided
    let guestTokenId = null;
    if (!req.user && guestToken) {
      const guestQuery = `SELECT id FROM guest_tokens WHERE token = $1`;
      const guestResult = await pool.query(guestQuery, [guestToken]);
      guestTokenId = guestResult.rows[0]?.id || null;
    }

    // Save form to database
    const form = await saasService.createForm(
      req.user?.id || null,
      guestTokenId,
      url,
      formName || generatedForm.title,
      formDescription || generatedForm.description,
      generatedForm,
      extractedData
    );

    // Handle destination configuration if provided
    if (destinationType && destinationConfig) {
      await saasService.configureFormDestination(
        form.id,
        destinationType,
        destinationConfig
      );
    }

    res.json({
      success: true,
      message: 'Form generated successfully',
      form,
      generatedForm
    });
  } catch (error) {
    console.error('Form generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate form',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user's forms
app.get('/api/forms', authService.authenticateToken, async (req: AuthRequest, res) => {
  try {
    const forms = await saasService.getUserForms(req.user!.id);
    res.json({
      success: true,
      data: forms,
      count: forms.length
    });
  } catch (error) {
    console.error('Get forms error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch forms',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get specific form
app.get('/api/forms/:id', authService.authenticateToken, async (req: AuthRequest, res) => {
  try {
    const formId = parseInt(req.params.id);
    if (isNaN(formId)) {
      return res.status(400).json({ error: 'Invalid form ID' });
    }

    const form = await saasService.getFormById(formId, req.user!.id);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json({
      success: true,
      data: form
    });
  } catch (error) {
    console.error('Get form error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch form',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Toggle form live status
app.patch('/api/forms/:id/toggle-live', authService.authenticateToken, async (req: AuthRequest, res) => {
  try {
    const formId = parseInt(req.params.id);
    if (isNaN(formId)) {
      return res.status(400).json({ error: 'Invalid form ID' });
    }

    const isLive = await saasService.toggleFormLive(formId, req.user!.id);
    
    res.json({
      success: true,
      message: `Form ${isLive ? 'activated' : 'deactivated'}`,
      isLive
    });
  } catch (error) {
    console.error('Toggle form error:', error);
    res.status(500).json({ 
      error: 'Failed to toggle form status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Submit form (public endpoint)
app.post('/api/forms/submit/:embedCode', async (req, res) => {
  try {
    const { embedCode } = req.params;
    const submissionData = req.body;

    const metadata = {
      submittedFromUrl: req.headers.referer,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    const result = await saasService.submitForm(embedCode, submissionData, metadata);
    
    res.json(result);
  } catch (error) {
    console.error('Form submission error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to submit form'
    });
  }
});

// Get available connectors
app.get('/api/connectors', authService.authenticateToken, async (req: AuthRequest, res) => {
  try {
    const connectors = await saasService.getAvailableConnectors(req.user!.id);
    res.json({
      success: true,
      data: connectors
    });
  } catch (error) {
    console.error('Get connectors error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch connectors',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Connect form to service
app.post('/api/forms/:id/connectors', authService.authenticateToken, async (req: AuthRequest, res) => {
  try {
    const formId = parseInt(req.params.id);
    const { connectorId, config } = req.body;

    if (isNaN(formId) || !connectorId || !config) {
      return res.status(400).json({ error: 'Form ID, connector ID, and config are required' });
    }

    const success = await saasService.connectFormToService(formId, connectorId, config, req.user!.id);
    
    if (!success) {
      return res.status(400).json({ error: 'Failed to connect form to service' });
    }

    res.json({
      success: true,
      message: 'Connector added successfully'
    });
  } catch (error) {
    console.error('Connect form error:', error);
    res.status(500).json({ 
      error: 'Failed to connect form',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get form analytics
app.get('/api/forms/:id/analytics', authService.authenticateToken, async (req: AuthRequest, res) => {
  try {
    const formId = parseInt(req.params.id);
    if (isNaN(formId)) {
      return res.status(400).json({ error: 'Invalid form ID' });
    }

    const analytics = await saasService.getFormAnalytics(formId, req.user!.id);
    if (!analytics) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ====== LEGACY ENDPOINTS (for backward compatibility) ======

// Extract and save website data (legacy)
app.post('/api/extract', authService.optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    console.log(`Extracting data for: ${url}`);

    // Extract website data
    const extractedData = await extractor.extractWebsiteData(url);
    
    // Save to database
    const savedRecord = await dbService.saveExtractedData(extractedData);

    res.json({
      success: true,
      message: 'Website data extracted and saved successfully',
      data: savedRecord
    });

  } catch (error) {
    console.error('Extraction error:', error);
    res.status(500).json({ 
      error: 'Failed to extract website data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Website Design Token Extraction API running on port ${PORT}`);
  console.log(`📖 API documentation: http://localhost:${PORT}/api/docs`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;