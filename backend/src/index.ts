import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs'; // Import fs module
import { WebsiteExtractor } from './extractor';
import { DatabaseService } from './database-service';
import { AuthService, AuthRequest } from './auth-service';
import { LLMService } from './llm-service';
import { SaaSService } from './saas-service';
import { customerConfigService } from './customer-config-service';
import pool from './database';
import { VoiceAnalysis } from './extractor'; // Import VoiceAnalysis
import { GeneratedForm } from './llm-service'; // Import GeneratedForm

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'; // Explicitly define frontend URL

// Initialize services
let extractor: WebsiteExtractor;
let dbService: DatabaseService;
let authService: AuthService;
let llmService: LLMService;
let saasService: SaaSService;

try {
  extractor = new WebsiteExtractor();
  dbService = new DatabaseService();
  authService = new AuthService();
  llmService = new LLMService();
  saasService = new SaaSService();
  console.log('Backend: All services initialized successfully.');
} catch (initError) {
  console.error('Backend: Failed to initialize services:', initError);
  process.exit(1); // Exit if services fail to initialize
}

// Helmet configuration (applied globally, but frameguard and CSP adjusted for embeds)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // 'unsafe-inline' needed for embed.js dynamic script
      styleSrc: ["'self'", "'unsafe-inline'"], // 'unsafe-inline' needed for embed.js inline styles
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", FRONTEND_URL, "http://localhost:3001"], // Allow frontend URL and backend itself
      frameAncestors: ["*"], // Allow embedding in any frame
    },
  },
  frameguard: false, // Disable frame guard to allow embedding
  crossOriginResourcePolicy: false, // Disable for embed scripts to work cross-origin
  crossOriginOpenerPolicy: false,   // Disable for embed scripts to work cross-origin
}));

// Specific CORS for embed.html and embed.js (more permissive)
// These routes should reflect the origin and not require credentials
app.use('/embed.html', cors({ origin: true, credentials: false }));
app.use('/embed.js', cors({ origin: true, credentials: false }));

// General CORS for main API routes (more restrictive, specific to frontend URL)
const mainApiCorsOptions = {
  origin: FRONTEND_URL,
  credentials: true, // Allow cookies/auth headers for main app
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // Added PUT/PATCH for completeness
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use('/api', cors(mainApiCorsOptions)); // Apply only to /api routes

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
  
  // Specific error handling for authorization failures
  if (error.message === 'Unauthorized to configure this form') {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'You are not authorized to perform this action on this form.' 
    });
  }

  // Generic error handling
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

// NEW: Extract design tokens and voice analysis for a URL
app.post('/api/forms/extract-design-tokens', authService.optionalAuth, async (req: AuthRequest, res) => {
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

    console.log(`Extracting design tokens for: ${url}`);
    const extractedData = await extractor.extractWebsiteData(url);
    const savedRecord = await dbService.saveExtractedData(extractedData);

    // Reconstruct the full VoiceAnalysis object from savedRecord fields
    const fullVoiceAnalysis = {
      tone: savedRecord.voice_tone,
      personalityTraits: savedRecord.personality_traits,
      audienceAnalysis: savedRecord.audience_analysis,
    };

    res.json({
      success: true,
      message: 'Website data extracted and saved successfully',
      data: {
        id: savedRecord.id,
        url: savedRecord.url,
        // Return the full designTokens object
        designTokens: {
          colorPalette: savedRecord.color_palette,
          primaryColors: savedRecord.primary_colors,
          colorUsage: savedRecord.color_usage,
          fontFamilies: savedRecord.font_families,
          headings: savedRecord.headings,
          textSamples: savedRecord.text_samples,
          margins: savedRecord.margins,
          paddings: savedRecord.paddings,
          spacingScale: savedRecord.spacing_scale,
          layoutStructure: savedRecord.layout_structure,
          gridSystem: savedRecord.grid_system,
          breakpoints: savedRecord.breakpoints,
          buttons: savedRecord.buttons,
          formFields: savedRecord.form_fields,
          cards: savedRecord.cards,
          navigation: savedRecord.navigation,
          images: savedRecord.images,
          cssVariables: savedRecord.css_variables,
          rawCSS: savedRecord.raw_css,
          formSchema: savedRecord.form_schema,
          logoUrl: savedRecord.logo_url,
          brandColors: savedRecord.brand_colors,
          icons: savedRecord.icons,
          messaging: savedRecord.messaging,
          previewHTML: savedRecord.preview_html,
        },
        // Return the reconstructed full voiceAnalysis object
        voiceAnalysis: fullVoiceAnalysis,
      }
    });
  } catch (error) {
    console.error('Design token extraction error:', error);
    res.status(500).json({
      error: 'Failed to extract design tokens',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


// MODIFIED: Create AI-generated form from pre-extracted website data
app.post('/api/forms/generate', authService.optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { 
      extractedRecordId, // Now expects an ID instead of a URL
      formPurpose, 
      formName, 
      formDescription, 
      guestToken 
    } = req.body;

    if (!extractedRecordId || !formPurpose) {
      return res.status(400).json({ error: 'Extracted record ID and form purpose are required' });
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

    // Fetch the previously extracted data
    const extractedDataRecord = await dbService.getRecordById(extractedRecordId);
    if (!extractedDataRecord) {
      return res.status(404).json({ error: 'Extracted website data not found' });
    }

    console.log('Backend: /api/forms/generate called.');
    console.log('Backend: req.user:', req.user ? `User ID: ${req.user.id}, Email: ${req.user.email}` : 'Guest user');
    console.log(`Generating form for record ID: ${extractedRecordId}`);

    // Reconstruct VoiceAnalysis from FormRecord for LLMService
    const voiceAnalysisForLLM: VoiceAnalysis = {
      tone: extractedDataRecord.voice_tone,
      personalityTraits: extractedDataRecord.personality_traits,
      audienceAnalysis: extractedDataRecord.audience_analysis,
    };

    // Generate form with LLM
    const generatedForm = await llmService.generateFormFromWebsite({
      url: extractedDataRecord.url,
      title: extractedDataRecord.title,
      description: extractedDataRecord.description,
      voiceAnalysis: voiceAnalysisForLLM, // Use the reconstructed object
      designTokens: {
        colorPalette: extractedDataRecord.color_palette,
        primaryColors: extractedDataRecord.primary_colors,
        colorUsage: extractedDataRecord.color_usage,
        fontFamilies: extractedDataRecord.font_families,
        headings: extractedDataRecord.headings,
        textSamples: extractedDataRecord.text_samples,
        margins: extractedDataRecord.margins,
        paddings: extractedDataRecord.paddings,
        spacingScale: extractedDataRecord.spacing_scale,
        layoutStructure: extractedDataRecord.layout_structure,
        gridSystem: extractedDataRecord.grid_system,
        breakpoints: extractedDataRecord.breakpoints,
        buttons: extractedDataRecord.buttons,
        formFields: extractedDataRecord.form_fields,
        cards: extractedDataRecord.cards,
        navigation: extractedDataRecord.navigation,
        images: extractedDataRecord.images,
        cssVariables: extractedDataRecord.css_variables,
        rawCSS: extractedDataRecord.raw_css,
        formSchema: extractedDataRecord.form_schema,
        logoUrl: extractedDataRecord.logo_url,
        brandColors: extractedDataRecord.brand_colors,
        icons: extractedDataRecord.icons,
        messaging: extractedDataRecord.messaging,
        previewHTML: extractedDataRecord.preview_html,
      },
      messaging: extractedDataRecord.messaging || []
    }, formPurpose);

    // Get guest token ID if provided
    let guestTokenId = null;
    if (!req.user && guestToken) {
      const guestQuery = `SELECT id FROM guest_tokens WHERE token = $1`;
      const guestResult = await pool.query(guestQuery, [guestToken]);
      guestTokenId = guestResult.rows[0]?.id || null;
    }

    // Save form to database (without destination config initially)
    const form = await saasService.createForm(
      req.user?.id || null,
      guestTokenId,
      extractedDataRecord.url,
      formName || generatedForm.title,
      formDescription || generatedForm.description,
      generatedForm,
      { // Pass relevant extracted data fields
        title: extractedDataRecord.title,
        description: extractedDataRecord.description,
        favicon: extractedDataRecord.favicon,
        designTokens: {
          colorPalette: extractedDataRecord.color_palette,
          primaryColors: extractedDataRecord.primary_colors,
          colorUsage: extractedDataRecord.color_usage,
          fontFamilies: extractedDataRecord.font_families,
          headings: extractedDataRecord.headings,
          textSamples: extractedDataRecord.text_samples,
          margins: extractedDataRecord.margins,
          paddings: extractedDataRecord.paddings,
          spacingScale: extractedDataRecord.spacing_scale,
          layoutStructure: extractedDataRecord.layout_structure,
          gridSystem: extractedDataRecord.grid_system,
          breakpoints: extractedDataRecord.breakpoints,
          buttons: extractedDataRecord.buttons,
          formFields: extractedDataRecord.form_fields,
          cards: extractedDataRecord.cards,
          navigation: extractedDataRecord.navigation,
          images: extractedDataRecord.images,
          cssVariables: extractedDataRecord.css_variables,
          rawCSS: extractedDataRecord.raw_css,
          formSchema: extractedDataRecord.form_schema,
          logoUrl: extractedDataRecord.logo_url,
          brandColors: extractedDataRecord.brand_colors,
          icons: extractedDataRecord.icons,
          messaging: extractedDataRecord.messaging,
          previewHTML: extractedDataRecord.preview_html,
        },
        voiceAnalysis: voiceAnalysisForLLM, // Use the reconstructed object
        extractedAt: extractedDataRecord.extracted_at.toISOString()
      }
    );
    console.log('Backend: Form created with user_id:', form.user_id);

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

// MODIFIED: Configure destination for an existing form
app.post('/api/forms/:id/configure-destination', authService.optionalAuth, async (req: AuthRequest, res) => {
  try {
    const formId = parseInt(req.params.id);
    const { destinationType, destinationConfig, guestToken } = req.body; // Get guestToken from body

    if (isNaN(formId) || !destinationType || !destinationConfig) {
      return res.status(400).json({ error: 'Form ID, destination type, and configuration are required' });
    }

    const userId = req.user?.id || null; // Get userId if authenticated

    const success = await saasService.configureFormDestination(
      formId,
      destinationType,
      destinationConfig,
      userId,
      guestToken // Pass guestToken
    );

    if (!success) {
      return res.status(400).json({ error: 'Failed to configure form destination' });
    }

    res.json({
      success: true,
      message: 'Form destination configured successfully'
    });
  } catch (error) {
    console.error('Configure destination error:', error);
    res.status(500).json({
      error: 'Failed to configure form destination',
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

    const { isLive, message } = await saasService.toggleFormLive(formId, req.user!.id);
    
    res.json({
      success: true,
      message: message, // Use the message from the service
      data: { // Wrap the actual data in a 'data' object
        isLive: isLive,
        message: message // Also include message here if frontend expects it in data
      }
    });
  } catch (error) {
    console.error('Toggle form error:', error);
    res.status(500).json({ 
      error: 'Failed to toggle form status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// REMOVED: Generate secure embed token for a form (no longer needed for script tag)
// app.post('/api/forms/:id/generate-token', authService.authenticateToken, async (req: AuthRequest, res) => { /* ... */ });

// NEW: Update allowed domains for a form
app.put('/api/forms/:id/allowed-domains', authService.authenticateToken, async (req: AuthRequest, res) => {
  try {
    const formId = parseInt(req.params.id);
    const { allowedDomains } = req.body;

    if (isNaN(formId) || !Array.isArray(allowedDomains)) {
      return res.status(400).json({ success: false, message: 'Invalid form ID or allowed domains format' });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const success = await saasService.updateFormAllowedDomains(formId, req.user.id, allowedDomains);

    if (success) {
      res.json({ success: true, message: 'Allowed domains updated successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Form not found or not owned by user' });
    }
  } catch (error) {
    console.error('Update allowed domains error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// NEW: Get form data by embed code (for embed.js)
app.get('/api/forms/embed-config/:embedCode', async (req, res) => {
  try {
    const { embedCode } = req.params;
    const hostname = req.query.hostname as string || req.headers.origin || req.headers.referer;
    const isTestMode = req.query.testMode === 'true'; // Check for testMode query parameter

    if (!embedCode) {
      return res.status(400).json({ success: false, message: 'Embed code is required' });
    }
    if (!hostname) {
      return res.status(400).json({ success: false, message: 'Hostname is required for domain validation' });
    }

    const formData = await saasService.getFormConfigForPublicEmbed(embedCode, hostname, isTestMode);

    if (!formData) {
      return res.status(403).json({ success: false, message: 'Unauthorized, form not active, or domain not allowed' });
    }

    res.json({
      success: true,
      data: formData
    });
  } catch (error) {
    console.error('Public embed form data fetch error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch form data securely'
    });
  }
});

// REMOVED: Submit form securely with token validation (no longer needed for script tag)
// app.post('/api/forms/submit-secure', async (req, res) => { /* ... */ });

// NEW: Submit form publicly with embed code validation
app.post('/api/forms/submit-public/:embedCode', async (req, res) => {
  try {
    const { embedCode } = req.params;
    const { isTestSubmission, ...submissionData } = req.body; // Extract isTestSubmission

    const metadata = {
      submittedFromUrl: req.headers.referer,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      hostname: req.headers.origin || req.headers.referer, // Use origin or referer for hostname
      isTestSubmission: isTestSubmission === true // Ensure boolean type
    };

    if (!embedCode || !submissionData || !metadata.hostname) {
      return res.status(400).json({ success: false, message: 'Embed code, submission data, and hostname are required' });
    }

    const result = await saasService.submitPublicForm(embedCode, submissionData, metadata);

    if (!result.success && result.message?.includes('Rate limit exceeded')) {
      return res.status(429).json(result);
    }
    if (!result.success && (result.message?.includes('Unauthorized') || result.message?.includes('active') || result.message?.includes('allowed'))) {
      return res.status(403).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Public form submission error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to submit form publicly'
    });
  }
});

// Development: Create test form (remove in production)
app.post('/api/dev/create-test-form', async (req, res) => {
  try {
    // Create a test form directly in the database
    const testForm = {
      user_id: null,
      guest_token_id: null,
      url: 'https://example.com',
      form_name: 'Test Contact Form',
      form_description: 'A test form for embed functionality',
      is_live: true,
      embed_code: 'test_embed_123',
      title: 'Contact Us',
      description: 'Get in touch with our team',
      favicon: 'https://example.com/favicon.ico',
      color_palette: JSON.stringify(['#007bff', '#6c757d', '#28a745']),
      primary_colors: JSON.stringify(['#007bff']),
      color_usage: JSON.stringify({}),
      font_families: JSON.stringify(['system-ui', 'Arial']),
      headings: JSON.stringify([]),
      text_samples: JSON.stringify([]),
      margins: JSON.stringify([]),
      paddings: JSON.stringify([]),
      spacing_scale: JSON.stringify([]),
      layout_structure: JSON.stringify({}),
      grid_system: JSON.stringify({}),
      breakpoints: JSON.stringify([]),
      buttons: JSON.stringify([]),
      form_fields: JSON.stringify([
        { type: 'text', name: 'name', label: 'Full Name', placeholder: 'Enter your name', required: true },
        { type: 'email', name: 'email', label: 'Email', placeholder: 'your@email.com', required: true },
        { type: 'textarea', name: 'message', label: 'Message', placeholder: 'Your message', required: true }
      ]),
      cards: JSON.stringify([]),
      navigation: JSON.stringify([]),
      images: JSON.stringify([]),
      css_variables: JSON.stringify({}),
      raw_css: '',
      form_schema: JSON.stringify([{
        title: 'Contact Us',
        description: 'Get in touch with our team',
        fields: [
          { type: 'text', name: 'name', label: 'Full Name', placeholder: 'Enter your name', required: true },
          { type: 'email', name: 'email', label: 'Email', placeholder: 'your@email.com', required: true },
          { type: 'textarea', name: 'message', label: 'Message', placeholder: 'Your message', required: true }
        ],
        ctaText: 'Send Message',
        thankYouMessage: 'Thank you for your message! We\'ll get back to you soon.',
        styling: {
          primaryColor: '#007bff',
          backgroundColor: '#ffffff',
          fontFamily: 'system-ui',
          borderRadius: '8px',
          textColor: '#333333',
          buttonTextColor: '#ffffff',
          buttonBackgroundColor: '#007bff',
          buttonBorder: '1px solid #ccc',
        }
      }]),
      logo_url: '',
      brand_colors: JSON.stringify(['#007bff']),
      icons: JSON.stringify([]),
      messaging: JSON.stringify([]),
      preview_html: '',
      voice_tone: JSON.stringify({}),
      personality_traits: JSON.stringify([]),
      audience_analysis: JSON.stringify({}),
      extracted_at: new Date().toISOString()
    };

    // Insert into forms table
    const formQuery = `
      INSERT INTO forms (
        user_id, guest_token_id, url, form_name, form_description, 
        is_live, embed_code, title, description, favicon,
        color_palette, primary_colors, color_usage, font_families, 
        headings, text_samples, margins, paddings, spacing_scale,
        layout_structure, grid_system, breakpoints, buttons, 
        form_fields, cards, navigation, images, css_variables, 
        raw_css, form_schema, logo_url, brand_colors, icons, 
        messaging, preview_html, voice_tone, personality_traits, 
        audience_analysis, extracted_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25, $26, $27, $28,
        $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39
      )
      ON CONFLICT (embed_code) DO UPDATE SET
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const formValues = [
      testForm.user_id, testForm.guest_token_id, testForm.url, testForm.form_name, testForm.form_description,
      testForm.is_live, testForm.embed_code, testForm.title, testForm.description, testForm.favicon,
      testForm.color_palette, testForm.primary_colors, testForm.color_usage, testForm.font_families,
      testForm.headings, testForm.text_samples, testForm.margins, testForm.paddings, testForm.spacing_scale,
      testForm.layout_structure, testForm.grid_system, testForm.breakpoints, testForm.buttons,
      testForm.form_fields, testForm.cards, testForm.navigation, testForm.images, testForm.css_variables,
      testForm.raw_css, testForm.form_schema, testForm.logo_url, testForm.brand_colors, testForm.icons,
      testForm.messaging, testForm.preview_html, testForm.voice_tone, testForm.personality_traits,
      testForm.audience_analysis, testForm.extracted_at
    ];

    const formResult = await pool.query(formQuery, formValues);
    const createdForm = formResult.rows[0];

    // Create embed code record
    await pool.query(`
      INSERT INTO embed_codes (form_id, code, is_active)
      VALUES ($1, $2, true)
      ON CONFLICT (code) DO UPDATE SET
        is_active = true, form_id = $1
    `, [createdForm.id, testForm.embed_code]);

    res.json({
      success: true,
      message: 'Test form created successfully',
      form: createdForm,
      embedCode: testForm.embed_code,
      testUrl: `http://localhost:${PORT}/embed.html?code=${testForm.embed_code}`
    });
  } catch (error) {
    console.error('Create test form error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create test form',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Serve embed.html for testing
app.get('/embed.html', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('X-Frame-Options', 'ALLOWALL'); // Allow framing
  res.removeHeader('X-Frame-Options'); // Remove default frame blocking
  res.sendFile(path.join(__dirname, '../frontend/public/embed.html')); // Use absolute path
});

// NEW: Serve test-embed.html from backend
app.get('/test-embed.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/test-embed.html')); // Use absolute path
});

// Serve embed.js script
app.get('/embed.js', (req, res) => {
  const embedJsPath = path.join(__dirname, '../frontend/public/embed.js'); // Correct path to static file
  fs.readFile(embedJsPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading embed.js file:', err); // Detailed error logging
      return res.status(500).send('Error loading embed script.');
    }
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    // It's generally not recommended to remove X-Content-Type-Options,
    // but if it's causing issues with specific browsers/configurations,
    // it can be removed here. For now, let's keep it as is, as the
    // Content-Type header is explicitly set.
    res.send(data);
  });
});

// Get form data for legacy iframe embed (public endpoint)
app.get('/api/forms/embed/:embedCode', async (req, res) => {
  try {
    const { embedCode } = req.params;
    const hostname = req.query.hostname as string || req.headers.origin || req.headers.referer;
    const isTestMode = req.query.testMode === 'true'; // Check for testMode query parameter

    if (!embedCode) {
      return res.status(400).json({ success: false, message: 'Embed code is required' });
    }
    if (!hostname) {
      return res.status(400).json({ success: false, message: 'Hostname is required for domain validation' });
    }

    const formData = await saasService.getFormConfigForPublicEmbed(embedCode, hostname, isTestMode);

    if (!formData) {
      return res.status(403).json({ success: false, message: 'Unauthorized, form not active, or domain not allowed' });
    }

    res.json({
      success: true,
      data: formData
    });
  } catch (error) {
    console.error('Legacy embed form data fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch form data for embed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// REMOVED: Submit form (public endpoint) - replaced by submitPublicForm
// app.post('/api/forms/submit/:embedCode', async (req, res) => { /* ... */ });

// NEW: Submit form publicly with embed code validation
app.post('/api/forms/submit-public/:embedCode', async (req, res) => {
  try {
    const { embedCode } = req.params;
    const { isTestSubmission, ...submissionData } = req.body; // Extract isTestSubmission

    const metadata = {
      submittedFromUrl: req.headers.referer,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      hostname: req.headers.origin || req.headers.referer, // Use origin or referer for hostname
      isTestSubmission: isTestSubmission === true // Ensure boolean type
    };

    if (!embedCode || !submissionData || !metadata.hostname) {
      return res.status(400).json({ success: false, message: 'Embed code, submission data, and hostname are required' });
    }

    const result = await saasService.submitPublicForm(embedCode, submissionData, metadata);

    if (!result.success && result.message?.includes('Rate limit exceeded')) {
      return res.status(429).json(result);
    }
    if (!result.success && (result.message?.includes('Unauthorized') || result.message?.includes('active') || result.message?.includes('allowed'))) {
      return res.status(403).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Public form submission error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to submit form publicly'
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

// New connector management endpoints for schema-driven system

// Get connectors for a specific form (new JSONB format)
app.get('/api/forms/:id/connectors', authService.authenticateToken, async (req: AuthRequest, res) => {
  try {
    const formId = parseInt(req.params.id);
    if (isNaN(formId)) {
      return res.status(400).json({ error: 'Invalid form ID' });
    }

    const connectors = await saasService.getFormConnectors(formId, req.user!.id);
    if (connectors === null) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json({
      success: true,
      data: connectors
    });
  } catch (error) {
    console.error('Get form connectors error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch form connectors',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Save connectors for a specific form (new JSONB format)
app.post('/api/forms/:id/connectors', authService.authenticateToken, async (req: AuthRequest, res) => {
  try {
    const formId = parseInt(req.params.id);
    const { connectors } = req.body;

    if (isNaN(formId) || !Array.isArray(connectors)) {
      return res.status(400).json({ error: 'Form ID and connectors array are required' });
    }

    const success = await saasService.saveFormConnectors(formId, connectors, req.user!.id);
    
    if (!success) {
      return res.status(400).json({ error: 'Failed to save form connectors' });
    }

    res.json({
      success: true,
      message: 'Connectors saved successfully'
    });
  }<ctrl63> catch (error) {
    console.error('Save form connectors error:', error);
    res.status(500).json({ 
      error: 'Failed to save form connectors',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test a connector with mock data
app.post('/api/forms/:id/test-connector', authService.authenticateToken, async (req: AuthRequest, res) => {
  try {
    const formId = parseInt(req.params.id);
    const { connectorType, settings } = req.body;

    if (isNaN(formId) || !connectorType || !settings) {
      return res.status(400).json({ error: 'Form ID, connector type, and settings are required' });
    }

    const result = await saasService.testConnector(formId, connectorType, settings, req.user!.id);
    
    if (!result) {
      return res.status(400).json({ error: 'Failed to test connector or form not found' });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Test connector error:', error);
    res.status(500).json({ 
      error: 'Failed to test connector',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get connector definitions (schema information)
app.get('/api/connector-definitions', authService.authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { getAllConnectorDefinitions } = await import('./connectors/connectorDefinitions');
    const definitions = getAllConnectorDefinitions();
    
    res.json({
      success: true,
      data: definitions
    });
  } catch (error) {
    console.error('Get connector definitions error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch connector definitions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Customer Configuration Management Endpoints

// Get all customer configurations
app.get('/api/customer-configs', authService.authenticateToken, async (req: AuthRequest, res) => {
  try {
    const configs = await customerConfigService.getAllCustomerConfigs();
    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
    console.error('Get customer configs error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch customer configurations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get specific customer configuration
app.get('/api/customer-configs/:customerId', authService.authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { customerId } = req.params;
    const config = await customerConfigService.getCustomerConfig(customerId);
    
    if (!config) {
      return res.status(404).json({ error: 'Customer configuration not found' });
    }
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Get customer config error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch customer configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create customer configuration
app.post('/api/customer-configs', authService.authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { customer_id, customer_name, routing_config } = req.body;
    
    if (!customer_id || !customer_name || !routing_config) {
      return res.status(400).json({ error: 'customer_id, customer_name, and routing_config are required' });
    }
    
    const config = await customerConfigService.createCustomerConfig({
      customer_id,
      customer_name,
      routing_config,
      is_active: true
    });
    
    res.status(201).json({
      success: true,
      message: 'Customer configuration created successfully',
      data: config
    });
  } catch (error) {
    console.error('Create customer config error:', error);
    res.status(500).json({ 
      error: 'Failed to create customer configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update customer configuration
app.put('/api/customer-configs/:customerId', authService.authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { customerId } = req.params;
    const updates = req.body;
    
    const config = await customerConfigService.updateCustomerConfig(customerId, updates);
    
    if (!config) {
      return res.status(404).json({ error: 'Customer configuration not found' });
    }
    
    res.json({
      success: true,
      message: 'Customer configuration updated successfully',
      data: config
    });
  } catch (error) {
    console.error('Update customer config error:', error);
    res.status(500).json({ 
      error: 'Failed to update customer configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// n8n Workflow Management Endpoints

// Get all n8n workflows
app.get('/api/n8n-workflows', authService.authenticateToken, async (req: AuthRequest, res) => {
  try {
    const workflows = await customerConfigService.getAllN8nWorkflows();
    res.json({
      success: true,
      data: workflows
    });
  } catch (error) {
    console.error('Get n8n workflows error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch n8n workflows',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Map form to customer
app.post('/api/forms/:id/customer-mapping', authService.authenticateToken, async (req: AuthRequest, res) => {
  try {
    const formId = parseInt(req.params.id);
    const { customer_id } = req.body;
    
    if (isNaN(formId) || !customer_id) {
      return res.status(400).json({ error: 'Valid form ID and customer_id are required' });
    }
    
    await customerConfigService.mapFormToCustomer(formId, customer_id);
    
    res.json({
      success: true,
      message: 'Form mapped to customer successfully'
    });
  } catch (error) {
    console.error('Map form to customer error:', error);
    res.status(500).json({ 
      error: 'Failed to map form to customer',
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

// NEW: Endpoint to update form configuration
app.patch('/api/forms/:id/config', authService.authenticateToken, async (req: AuthRequest, res) => {
  try {
    const formId = parseInt(req.params.id);
    const updatedConfig: GeneratedForm = req.body;

    if (isNaN(formId) || !updatedConfig) {
      return res.status(400).json({ success: false, message: 'Invalid form ID or configuration data' });
    }
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const updatedForm = await saasService.updateFormConfig(formId, req.user.id, updatedConfig);

    if (updatedForm) {
      res.json({ success: true, message: 'Form configuration updated successfully', data: updatedForm });
    } else {
      res.status(404).json({ success: false, message: 'Form not found or not owned by user' });
    }
  } catch (error) {
    console.error('Update form config error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// NEW: Endpoint to adapt form based on user changes
app.post('/api/forms/:id/adapt-form', authService.authenticateToken, async (req: AuthRequest, res) => {
  try {
    const formId = parseInt(req.params.id);
    const { updatedConfig, websiteData, userChanges } = req.body;

    if (isNaN(formId) || !updatedConfig || !websiteData || !userChanges) {
      return res.status(400).json({ success: false, message: 'Invalid form ID, configuration, website data, or user changes' });
    }
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Adapt the form using LLM
    const adaptedGeneratedForm = await llmService.adaptFormToWebsite(updatedConfig, websiteData, userChanges);

    // Save the adapted form back to the database
    const updatedForm = await saasService.updateFormConfig(formId, req.user.id, adaptedGeneratedForm);

    if (updatedForm) {
      res.json({ success: true, message: 'Form adapted successfully', data: { form: updatedForm, generatedForm: adaptedGeneratedForm } });
    } else {
      res.status(404).json({ success: false, message: 'Form not found or not owned by user' });
    }
  } catch (error) {
    console.error('Adapt form error:', error);
    res.status(500).json({
      success: false,
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
});

export default app;