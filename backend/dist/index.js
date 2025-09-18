"use strict";
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
const extractor_1 = require("./extractor");
const database_service_1 = require("./database-service");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Initialize services
const extractor = new extractor_1.WebsiteExtractor();
const dbService = new database_service_1.DatabaseService();
// Middleware
app.use((0, helmet_1.default)());
// CORS configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use((0, cors_1.default)(corsOptions));
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
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Website Design Token Extraction API running on port ${PORT}`);
    console.log(`📖 API documentation: http://localhost:${PORT}/api/docs`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map