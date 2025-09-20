"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path")); // Import path module
const extractor_1 = require("./extractor");
const database_service_1 = require("./database-service");
const auth_service_1 = require("./auth-service");
const llm_service_1 = require("./llm-service");
const saas_service_1 = require("./saas-service");
const stripe_service_1 = require("./stripe-service");
const subscription_middleware_1 = require("./subscription-middleware");
const customer_config_service_1 = require("./customer-config-service");
const database_1 = __importDefault(require("./database"));
const stripe_1 = __importDefault(require("stripe"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'; // Explicitly define frontend URL
// Initialize services
let extractor;
let dbService;
let authService;
let llmService;
let saasService;
let stripeService;
let subscriptionMiddleware;
try {
    extractor = new extractor_1.WebsiteExtractor();
    dbService = new database_service_1.DatabaseService();
    authService = new auth_service_1.AuthService();
    llmService = new llm_service_1.LLMService();
    saasService = new saas_service_1.SaaSService();
    stripeService = new stripe_service_1.StripeService();
    subscriptionMiddleware = new subscription_middleware_1.SubscriptionMiddleware();
    console.log('Backend: All services initialized successfully.');
}
catch (initError) {
    console.error('Backend: Failed to initialize services:', initError);
    process.exit(1); // Exit if services fail to initialize
}
// Helmet configuration (applied globally, but frameguard and CSP adjusted for embeds)
app.use((0, helmet_1.default)({
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
    crossOriginOpenerPolicy: false, // Disable for embed scripts to work cross-origin
}));
// Serve static files for embed.js and embed.html from the frontend/public directory
app.use(express_1.default.static(path_1.default.join(__dirname, '../frontend/public')));
// Specific CORS for embed.html and embed.js (more permissive)
// These routes should reflect the origin and not require credentials
app.use('/embed.html', (0, cors_1.default)({ origin: true, credentials: false }));
app.use('/embed.js', (0, cors_1.default)({ origin: true, credentials: false }));
// General CORS for main API routes (more restrictive, specific to frontend URL)
const mainApiCorsOptions = {
    origin: FRONTEND_URL,
    credentials: true, // Allow cookies/auth headers for main app
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // Added PUT/PATCH for completeness
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use('/api', (0, cors_1.default)(mainApiCorsOptions)); // Apply only to /api routes
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
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
    }
    catch (error) {
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
        }
        catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
app.use((error, req, res, next) => {
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
            }
            catch (error) {
                console.warn('Failed to associate guest token:', error);
            }
        }
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user,
            token
        });
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Failed to login',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get user profile
app.get('/api/auth/profile', authService.authenticateToken, async (req, res) => {
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
    }
    catch (error) {
        console.error('Guest token error:', error);
        res.status(500).json({
            error: 'Failed to create guest token',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// ====== SAAS FORM ENDPOINTS ======
// NEW: Extract design tokens and voice analysis for a URL
app.post('/api/forms/extract-design-tokens', authService.optionalAuth, async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        // Validate URL format
        try {
            new URL(url);
        }
        catch (error) {
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
    }
    catch (error) {
        console.error('Design token extraction error:', error);
        res.status(500).json({
            error: 'Failed to extract design tokens',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// MODIFIED: Create AI-generated form from pre-extracted website data
app.post('/api/forms/generate', authService.optionalAuth, (req, res, next) => {
    // Only check form limits for authenticated users
    if (req.user) {
        return subscriptionMiddleware.checkFormCreationLimit(req, res, next);
    }
    next();
}, async (req, res) => {
    try {
        const { extractedRecordId, // Now expects an ID instead of a URL
        formPurpose, formName, formDescription, guestToken } = req.body;
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
        const voiceAnalysisForLLM = {
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
            const guestResult = await database_1.default.query(guestQuery, [guestToken]);
            guestTokenId = guestResult.rows[0]?.id || null;
        }
        // Save form to database (without destination config initially)
        const form = await saasService.createForm(req.user?.id || null, guestTokenId, extractedDataRecord.url, formName || generatedForm.title, formDescription || generatedForm.description, generatedForm, {
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
        });
        console.log('Backend: Form created with user_id:', form.user_id);
        // Track form creation for authenticated users
        if (req.user) {
            try {
                await subscriptionMiddleware.trackFormCreation(req.user.id);
            }
            catch (trackingError) {
                console.error('Form creation tracking error:', trackingError);
                // Don't fail the request if tracking fails
            }
        }
        res.json({
            success: true,
            message: 'Form generated successfully',
            form,
            generatedForm
        });
    }
    catch (error) {
        console.error('Form generation error:', error);
        res.status(500).json({
            error: 'Failed to generate form',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// MODIFIED: Configure destination for an existing form
app.post('/api/forms/:id/configure-destination', authService.optionalAuth, async (req, res) => {
    try {
        const formId = parseInt(req.params.id);
        const { destinationType, destinationConfig, guestToken } = req.body; // Get guestToken from body
        if (isNaN(formId) || !destinationType || !destinationConfig) {
            return res.status(400).json({ error: 'Form ID, destination type, and configuration are required' });
        }
        const userId = req.user?.id || null; // Get userId if authenticated
        const success = await saasService.configureFormDestination(formId, destinationType, destinationConfig, userId, guestToken // Pass guestToken
        );
        if (!success) {
            return res.status(400).json({ error: 'Failed to configure form destination' });
        }
        res.json({
            success: true,
            message: 'Form destination configured successfully'
        });
    }
    catch (error) {
        console.error('Configure destination error:', error);
        res.status(500).json({
            error: 'Failed to configure form destination',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get user's forms
app.get('/api/forms', authService.authenticateToken, async (req, res) => {
    try {
        const forms = await saasService.getUserForms(req.user.id);
        res.json({
            success: true,
            data: forms,
            count: forms.length
        });
    }
    catch (error) {
        console.error('Get forms error:', error);
        res.status(500).json({
            error: 'Failed to fetch forms',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get specific form
app.get('/api/forms/:id', authService.authenticateToken, async (req, res) => {
    try {
        const formId = parseInt(req.params.id);
        if (isNaN(formId)) {
            return res.status(400).json({ error: 'Invalid form ID' });
        }
        const form = await saasService.getFormById(formId, req.user.id);
        if (!form) {
            return res.status(404).json({ error: 'Form not found' });
        }
        res.json({
            success: true,
            data: form
        });
    }
    catch (error) {
        console.error('Get form error:', error);
        res.status(500).json({
            error: 'Failed to fetch form',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Toggle form live status
app.patch('/api/forms/:id/toggle-live', authService.authenticateToken, async (req, res) => {
    try {
        const formId = parseInt(req.params.id);
        if (isNaN(formId)) {
            return res.status(400).json({ error: 'Invalid form ID' });
        }
        const { isLive, message } = await saasService.toggleFormLive(formId, req.user.id);
        res.json({
            success: true,
            message: message, // Use the message from the service
            data: {
                isLive: isLive,
                message: message // Also include message here if frontend expects it in data
            }
        });
    }
    catch (error) {
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
app.put('/api/forms/:id/allowed-domains', authService.authenticateToken, async (req, res) => {
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
        }
        else {
            res.status(404).json({ success: false, message: 'Form not found or not owned by user' });
        }
    }
    catch (error) {
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
        const hostname = req.query.hostname || req.headers.origin || req.headers.referer;
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
    }
    catch (error) {
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
        // Track usage for successful submissions
        if (result.success && result.formOwnerId) {
            try {
                await subscriptionMiddleware.trackSubmission(result.formOwnerId);
            }
            catch (trackingError) {
                console.error('Usage tracking error:', trackingError);
                // Don't fail the request if usage tracking fails
            }
        }
        if (!result.success && result.message?.includes('Rate limit exceeded')) {
            return res.status(429).json(result);
        }
        if (!result.success && (result.message?.includes('Unauthorized') || result.message?.includes('active') || result.message?.includes('allowed'))) {
            return res.status(403).json(result);
        }
        res.json(result);
    }
    catch (error) {
        console.error('Public form submission error:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to submit form publicly'
        });
    }
});
// Get available connectors
app.get('/api/connectors', authService.authenticateToken, async (req, res) => {
    try {
        const connectors = await saasService.getAvailableConnectors(req.user.id);
        res.json({
            success: true,
            data: connectors
        });
    }
    catch (error) {
        console.error('Get connectors error:', error);
        res.status(500).json({
            error: 'Failed to fetch connectors',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// New connector management endpoints for schema-driven system
// Get connectors for a specific form (new JSONB format)
app.get('/api/forms/:id/connectors', authService.authenticateToken, async (req, res) => {
    try {
        const formId = parseInt(req.params.id);
        if (isNaN(formId)) {
            return res.status(400).json({ error: 'Invalid form ID' });
        }
        const connectors = await saasService.getFormConnectors(formId, req.user.id);
        if (connectors === null) {
            return res.status(404).json({ error: 'Form not found' });
        }
        res.json({
            success: true,
            data: connectors
        });
    }
    catch (error) {
        console.error('Get form connectors error:', error);
        res.status(500).json({
            error: 'Failed to fetch form connectors',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Save connectors for a specific form (new JSONB format)
app.post('/api/forms/:id/connectors', authService.authenticateToken, async (req, res) => {
    try {
        const formId = parseInt(req.params.id);
        const { connectors } = req.body;
        if (isNaN(formId) || !Array.isArray(connectors)) {
            return res.status(400).json({ error: 'Form ID and connectors array are required' });
        }
        const success = await saasService.saveFormConnectors(formId, connectors, req.user.id);
        if (!success) {
            return res.status(400).json({ error: 'Failed to save form connectors' });
        }
        res.json({
            success: true,
            message: 'Connectors saved successfully'
        });
    }
    catch (error) {
        console.error('Save form connectors error:', error);
        res.status(500).json({
            error: 'Failed to save form connectors',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Test a connector with mock data
app.post('/api/forms/:id/test-connector', authService.authenticateToken, async (req, res) => {
    try {
        const formId = parseInt(req.params.id);
        const { connectorType, settings } = req.body;
        if (isNaN(formId) || !connectorType || !settings) {
            return res.status(400).json({ error: 'Form ID, connector type, and settings are required' });
        }
        const result = await saasService.testConnector(formId, connectorType, settings, req.user.id);
        if (!result) {
            return res.status(400).json({ error: 'Failed to test connector or form not found' });
        }
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Test connector error:', error);
        res.status(500).json({
            error: 'Failed to test connector',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get connector definitions (schema information)
app.get('/api/connector-definitions', authService.authenticateToken, async (req, res) => {
    try {
        const { getAllConnectorDefinitions } = await Promise.resolve().then(() => __importStar(require('./connectors/connectorDefinitions')));
        const definitions = getAllConnectorDefinitions();
        res.json({
            success: true,
            data: definitions
        });
    }
    catch (error) {
        console.error('Get connector definitions error:', error);
        res.status(500).json({
            error: 'Failed to fetch connector definitions',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Customer Configuration Management Endpoints
// Get all customer configurations
app.get('/api/customer-configs', authService.authenticateToken, async (req, res) => {
    try {
        const configs = await customer_config_service_1.customerConfigService.getAllCustomerConfigs();
        res.json({
            success: true,
            data: configs
        });
    }
    catch (error) {
        console.error('Get customer configs error:', error);
        res.status(500).json({
            error: 'Failed to fetch customer configurations',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get specific customer configuration
app.get('/api/customer-configs/:customerId', authService.authenticateToken, async (req, res) => {
    try {
        const { customerId } = req.params;
        const config = await customer_config_service_1.customerConfigService.getCustomerConfig(customerId);
        if (!config) {
            return res.status(404).json({ error: 'Customer configuration not found' });
        }
        res.json({
            success: true,
            data: config
        });
    }
    catch (error) {
        console.error('Get customer config error:', error);
        res.status(500).json({
            error: 'Failed to fetch customer configuration',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Create customer configuration
app.post('/api/customer-configs', authService.authenticateToken, async (req, res) => {
    try {
        const { customer_id, customer_name, routing_config } = req.body;
        if (!customer_id || !customer_name || !routing_config) {
            return res.status(400).json({ error: 'customer_id, customer_name, and routing_config are required' });
        }
        const config = await customer_config_service_1.customerConfigService.createCustomerConfig({
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
    }
    catch (error) {
        console.error('Create customer config error:', error);
        res.status(500).json({
            error: 'Failed to create customer configuration',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Update customer configuration
app.put('/api/customer-configs/:customerId', authService.authenticateToken, async (req, res) => {
    try {
        const { customerId } = req.params;
        const updates = req.body;
        const config = await customer_config_service_1.customerConfigService.updateCustomerConfig(customerId, updates);
        if (!config) {
            return res.status(404).json({ error: 'Customer configuration not found' });
        }
        res.json({
            success: true,
            message: 'Customer configuration updated successfully',
            data: config
        });
    }
    catch (error) {
        console.error('Update customer config error:', error);
        res.status(500).json({
            error: 'Failed to update customer configuration',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// n8n Workflow Management Endpoints
// Get all n8n workflows
app.get('/api/n8n-workflows', authService.authenticateToken, async (req, res) => {
    try {
        const workflows = await customer_config_service_1.customerConfigService.getAllN8nWorkflows();
        res.json({
            success: true,
            data: workflows
        });
    }
    catch (error) {
        console.error('Get n8n workflows error:', error);
        res.status(500).json({
            error: 'Failed to fetch n8n workflows',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Map form to customer
app.post('/api/forms/:id/customer-mapping', authService.authenticateToken, async (req, res) => {
    try {
        const formId = parseInt(req.params.id);
        const { customer_id } = req.body;
        if (isNaN(formId) || !customer_id) {
            return res.status(400).json({ error: 'Valid form ID and customer_id are required' });
        }
        await customer_config_service_1.customerConfigService.mapFormToCustomer(formId, customer_id);
        res.json({
            success: true,
            message: 'Form mapped to customer successfully'
        });
    }
    catch (error) {
        console.error('Map form to customer error:', error);
        res.status(500).json({
            error: 'Failed to map form to customer',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get form analytics
app.get('/api/forms/:id/analytics', authService.authenticateToken, async (req, res) => {
    try {
        const formId = parseInt(req.params.id);
        if (isNaN(formId)) {
            return res.status(400).json({ error: 'Invalid form ID' });
        }
        const analytics = await saasService.getFormAnalytics(formId, req.user.id);
        if (!analytics) {
            return res.status(404).json({ error: 'Form not found' });
        }
        res.json({
            success: true,
            data: analytics
        });
    }
    catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({
            error: 'Failed to fetch analytics',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// NEW: Endpoint to update form configuration
app.patch('/api/forms/:id/config', authService.authenticateToken, async (req, res) => {
    try {
        const formId = parseInt(req.params.id);
        const updatedConfig = req.body;
        if (isNaN(formId) || !updatedConfig) {
            return res.status(400).json({ success: false, message: 'Invalid form ID or configuration data' });
        }
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        const updatedForm = await saasService.updateFormConfig(formId, req.user.id, updatedConfig);
        if (updatedForm) {
            res.json({ success: true, message: 'Form configuration updated successfully', data: updatedForm });
        }
        else {
            res.status(404).json({ success: false, message: 'Form not found or not owned by user' });
        }
    }
    catch (error) {
        console.error('Update form config error:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// NEW: Endpoint to adapt form based on user changes
app.post('/api/forms/:id/adapt-form', authService.authenticateToken, async (req, res) => {
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
        }
        else {
            res.status(404).json({ success: false, message: 'Form not found or not owned by user' });
        }
    }
    catch (error) {
        console.error('Adapt form error:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
; // Added semicolon here
// ====== LEGACY ENDPOINTS (for backward compatibility) ======
// Extract and save website data (legacy)
app.post('/api/extract', authService.optionalAuth, async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        // Validate URL format
        try {
            new URL(url);
        }
        catch (error) {
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
    }
    catch (error) {
        console.error('Extraction error:', error);
        res.status(500).json({
            error: 'Failed to extract website data',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// ====== ENHANCED STRUCTURED FLOW ENDPOINTS ======
// Initialize form creation flow
app.post('/api/forms/flow/init', async (req, res) => {
    try {
        const flowState = llmService.initializeFormFlow();
        res.json({
            success: true,
            flowState
        });
    }
    catch (error) {
        console.error('Flow initialization error:', error);
        res.status(500).json({
            error: 'Failed to initialize form flow',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Process website URL input in flow
app.post('/api/forms/flow/website-input', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        const flowState = llmService.processWebsiteInput(url);
        if (flowState.validationErrors) {
            return res.status(400).json({
                error: 'Invalid input',
                flowState
            });
        }
        res.json({
            success: true,
            flowState
        });
    }
    catch (error) {
        console.error('Website input processing error:', error);
        res.status(500).json({
            error: 'Failed to process website input',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get form type recommendations after design extraction
app.post('/api/forms/flow/design-extracted', async (req, res) => {
    try {
        const { extractedRecordId } = req.body;
        if (!extractedRecordId) {
            return res.status(400).json({ error: 'Extracted record ID is required' });
        }
        // Fetch the extracted data
        const extractedDataRecord = await dbService.getRecordById(extractedRecordId);
        if (!extractedDataRecord) {
            return res.status(404).json({ error: 'Extracted website data not found' });
        }
        // Reconstruct the extracted data for flow processing
        const extractedData = {
            url: extractedDataRecord.url,
            title: extractedDataRecord.title,
            description: extractedDataRecord.description,
            designTokens: {
                colorPalette: extractedDataRecord.color_palette,
                primaryColors: extractedDataRecord.primary_colors,
                fontFamilies: extractedDataRecord.font_families,
                // Add other design tokens as needed
            },
            messaging: extractedDataRecord.messaging || []
        };
        const flowState = llmService.processDesignExtraction(extractedData);
        const recommendations = llmService.getSmartRecommendations(extractedData);
        res.json({
            success: true,
            flowState,
            recommendations,
            formTypes: llmService.getFormTypeOptions(extractedData)
        });
    }
    catch (error) {
        console.error('Design extraction processing error:', error);
        res.status(500).json({
            error: 'Failed to process design extraction',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Process form type selection
app.post('/api/forms/flow/form-type-selected', authService.optionalAuth, async (req, res) => {
    try {
        const { extractedRecordId, formType } = req.body;
        if (!extractedRecordId || !formType) {
            return res.status(400).json({ error: 'Extracted record ID and form type are required' });
        }
        // Fetch the extracted data
        const extractedDataRecord = await dbService.getRecordById(extractedRecordId);
        if (!extractedDataRecord) {
            return res.status(404).json({ error: 'Extracted website data not found' });
        }
        // Reconstruct the extracted data
        const extractedData = {
            url: extractedDataRecord.url,
            title: extractedDataRecord.title,
            description: extractedDataRecord.description,
            designTokens: {
                colorPalette: extractedDataRecord.color_palette,
                primaryColors: extractedDataRecord.primary_colors,
                fontFamilies: extractedDataRecord.font_families,
                // Add other design tokens as needed
            },
            messaging: extractedDataRecord.messaging || []
        };
        const flowState = llmService.processFormTypeSelection(formType, extractedData);
        if (flowState.validationErrors) {
            return res.status(400).json({
                error: 'Invalid form type',
                flowState
            });
        }
        // Determine user role for flow processing
        const userRole = req.user ?
            (req.user.subscription_tier === 'paid' ? 'paid' : 'free') :
            'guest';
        res.json({
            success: true,
            flowState,
            userRole,
            isAuthenticated: !!req.user
        });
    }
    catch (error) {
        console.error('Form type selection error:', error);
        res.status(500).json({
            error: 'Failed to process form type selection',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Enhanced form generation with flow state
app.post('/api/forms/flow/generate', authService.optionalAuth, async (req, res) => {
    try {
        const { extractedRecordId, formPurpose, formName, formDescription, guestToken } = req.body;
        if (!extractedRecordId || !formPurpose) {
            return res.status(400).json({ error: 'Extracted record ID and form purpose are required' });
        }
        // Determine user role and check limits
        const userRole = req.user ?
            (req.user.subscription_tier === 'paid' ? 'paid' : 'free') :
            'guest';
        let existingLiveFormsCount = 0;
        if (req.user) {
            existingLiveFormsCount = await saasService.getUserLiveFormCount(req.user.id);
        }
        // Validate form creation rules
        const validationResult = llmService.validateFormCreationRules(userRole, existingLiveFormsCount);
        if (!validationResult.canCreate) {
            return res.status(403).json({
                error: validationResult.message,
                suggestedActions: validationResult.suggestedActions,
                upgradeRequired: userRole === 'free'
            });
        }
        // Fetch the extracted data
        const extractedDataRecord = await dbService.getRecordById(extractedRecordId);
        if (!extractedDataRecord) {
            return res.status(404).json({ error: 'Extracted website data not found' });
        }
        // Reconstruct VoiceAnalysis and extracted data for LLMService
        const voiceAnalysisForLLM = {
            tone: extractedDataRecord.voice_tone,
            personalityTraits: extractedDataRecord.personality_traits,
            audienceAnalysis: extractedDataRecord.audience_analysis,
        };
        const websiteData = {
            url: extractedDataRecord.url,
            title: extractedDataRecord.title,
            description: extractedDataRecord.description,
            voiceAnalysis: voiceAnalysisForLLM,
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
        };
        // Generate form with enhanced flow
        const { form: generatedForm, flowState } = await llmService.generateFormWithFlow(websiteData, formPurpose, userRole, !!req.user);
        // Get guest token ID if provided
        let guestTokenId = null;
        if (!req.user && guestToken) {
            const guestQuery = `SELECT id FROM guest_tokens WHERE token = $1`;
            const guestResult = await database_1.default.query(guestQuery, [guestToken]);
            guestTokenId = guestResult.rows[0]?.id || null;
        }
        // Save form to database
        const form = await saasService.createForm(req.user?.id || null, guestTokenId, extractedDataRecord.url, formName || generatedForm.title, formDescription || generatedForm.description, generatedForm, {
            title: extractedDataRecord.title,
            description: extractedDataRecord.description,
            favicon: extractedDataRecord.favicon,
            designTokens: websiteData.designTokens,
            voiceAnalysis: voiceAnalysisForLLM,
            extractedAt: extractedDataRecord.extracted_at.toISOString()
        });
        // Generate embed code with expiration
        const embedResult = llmService.generateEmbedCodeWithExpiration(form.id, userRole, !!req.user);
        res.json({
            success: true,
            message: 'Form generated successfully with flow guidance',
            form,
            generatedForm,
            flowState,
            embedCode: embedResult.embedCode,
            embedExpires: embedResult.expires,
            isPermanent: embedResult.isPermanent,
            userRole,
            validationResult
        });
    }
    catch (error) {
        console.error('Enhanced form generation error:', error);
        res.status(500).json({
            error: 'Failed to generate form with flow',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get contextual guidance for current flow step
app.post('/api/forms/flow/guidance', async (req, res) => {
    try {
        const { step, data } = req.body;
        if (!step) {
            return res.status(400).json({ error: 'Flow step is required' });
        }
        const guidance = llmService.getContextualGuidance(step, data);
        res.json({
            success: true,
            guidance
        });
    }
    catch (error) {
        console.error('Guidance generation error:', error);
        res.status(500).json({
            error: 'Failed to get guidance',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Check embed code expiration status
app.get('/api/forms/:id/embed-status', authService.optionalAuth, async (req, res) => {
    try {
        const formId = parseInt(req.params.id);
        if (isNaN(formId)) {
            return res.status(400).json({ error: 'Invalid form ID' });
        }
        // Get form details
        const form = req.user ?
            await saasService.getFormById(formId, req.user.id) :
            await saasService.getFormByEmbedCode(req.query.embedCode);
        if (!form) {
            return res.status(404).json({ error: 'Form not found' });
        }
        // Determine user role
        const userRole = req.user ?
            (req.user.subscription_tier === 'paid' ? 'paid' : 'free') :
            'guest';
        // Check expiration for guest forms
        const embedResult = llmService.generateEmbedCodeWithExpiration(formId, userRole, !!req.user);
        const expirationWarning = llmService.getExpirationWarning(embedResult.expires);
        const isExpired = llmService.isEmbedCodeExpired(embedResult.expires);
        res.json({
            success: true,
            formId,
            isPermanent: embedResult.isPermanent,
            expires: embedResult.expires,
            isExpired,
            expirationWarning,
            userRole
        });
    }
    catch (error) {
        console.error('Embed status check error:', error);
        res.status(500).json({
            error: 'Failed to check embed status',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// ============================================
// STRIPE SUBSCRIPTION ENDPOINTS
// ============================================
// Get subscription plans
app.get('/api/subscription/plans', (req, res) => {
    try {
        const plans = stripeService.getPlans();
        res.json({ success: true, data: plans });
    }
    catch (error) {
        console.error('Get plans error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get subscription plans'
        });
    }
});
// Get user's current subscription
app.get('/api/subscription/current', authService.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const subscription = await stripeService.getUserSubscription(req.user.id);
        const usage = await subscriptionMiddleware.getUserUsage(req.user.id);
        res.json({
            success: true,
            data: {
                subscription,
                usage: usage.limits,
                currentUsage: {
                    formsCreated: usage.formsCreated,
                    submissionsReceived: usage.submissionsReceived
                }
            }
        });
    }
    catch (error) {
        console.error('Get subscription error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get subscription details'
        });
    }
});
// Create checkout session
app.post('/api/subscription/checkout', authService.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const { planId } = req.body;
        if (!planId) {
            return res.status(400).json({ error: 'Plan ID is required' });
        }
        // Create or get Stripe customer
        const customerId = await stripeService.createOrGetCustomer(req.user.id, req.user.email, req.user.first_name ? `${req.user.first_name} ${req.user.last_name || ''}`.trim() : undefined);
        // Create checkout session
        const checkoutUrl = await stripeService.createCheckoutSession(req.user.id, planId, customerId, `${FRONTEND_URL}/subscription/success`, `${FRONTEND_URL}/subscription/cancel`);
        res.json({ success: true, data: { checkoutUrl } });
    }
    catch (error) {
        console.error('Create checkout session error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create checkout session'
        });
    }
});
// Create billing portal session
app.post('/api/subscription/billing-portal', authService.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const subscription = await stripeService.getUserSubscription(req.user.id);
        if (!subscription || !subscription.stripe_customer_id) {
            return res.status(404).json({
                error: 'No subscription found'
            });
        }
        const portalUrl = await stripeService.createBillingPortalSession(subscription.stripe_customer_id, `${FRONTEND_URL}/subscription`);
        res.json({ success: true, data: { portalUrl } });
    }
    catch (error) {
        console.error('Create billing portal error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create billing portal session'
        });
    }
});
// Stripe webhook endpoint (must use raw body)
app.post('/api/webhooks/stripe', express_1.default.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error('STRIPE_WEBHOOK_SECRET not configured');
        return res.status(500).send('Webhook secret not configured');
    }
    let event;
    try {
        // Verify webhook signature
        const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
    catch (err) {
        console.error('Webhook signature verification failed:', err);
        return res.status(400).send(`Webhook Error: ${err}`);
    }
    // Check if we've already processed this event
    const client = await database_1.default.connect();
    try {
        const existingEvent = await client.query('SELECT id FROM stripe_webhook_events WHERE stripe_event_id = $1', [event.id]);
        if (existingEvent.rows.length > 0) {
            console.log(`Event ${event.id} already processed`);
            return res.json({ received: true });
        }
        // Store the event
        await client.query(`
      INSERT INTO stripe_webhook_events (stripe_event_id, event_type, data, processed)
      VALUES ($1, $2, $3, false)
    `, [event.id, event.type, JSON.stringify(event.data)]);
        // Process the webhook
        switch (event.type) {
            case 'customer.subscription.created':
                await stripeService.handleSubscriptionCreated(event.data.object);
                break;
            case 'customer.subscription.updated':
                await stripeService.handleSubscriptionUpdated(event.data.object);
                break;
            case 'customer.subscription.deleted':
                await stripeService.handleSubscriptionDeleted(event.data.object);
                break;
            case 'invoice.payment_succeeded':
                // Handle successful payment
                const invoice = event.data.object;
                const invoiceAny = invoice;
                if (invoiceAny.subscription) {
                    console.log(`Payment succeeded for subscription: ${invoiceAny.subscription}`);
                }
                break;
            case 'invoice.payment_failed':
                // Handle failed payment
                const failedInvoice = event.data.object;
                const failedInvoiceAny = failedInvoice;
                if (failedInvoiceAny.subscription) {
                    console.log(`Payment failed for subscription: ${failedInvoiceAny.subscription}`);
                }
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        // Mark event as processed
        await client.query('UPDATE stripe_webhook_events SET processed = true, processed_at = NOW() WHERE stripe_event_id = $1', [event.id]);
    }
    catch (error) {
        console.error('Webhook processing error:', error);
        return res.status(500).json({ error: 'Webhook processing failed' });
    }
    finally {
        client.release();
    }
    res.json({ received: true });
});
// ============================================
// END STRIPE ENDPOINTS
// ============================================
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Website Design Token Extraction API running on port ${PORT}`);
    console.log(`📖 API documentation: http://localhost:${PORT}/api/docs`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});
exports.default = app;
//# sourceMappingURL=index.js.map