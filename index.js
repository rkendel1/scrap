const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { extractDesignSystem } = require('./src/designSystemExtractor');
const { extractVoice } = require('./src/voiceExtractor');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Main extraction endpoint
app.post('/extract', async (req, res) => {
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

    console.log(`Extracting design system and voice for: ${url}`);

    // Extract design system and voice in parallel
    const [designSystem, voice] = await Promise.all([
      extractDesignSystem(url),
      extractVoice(url)
    ]);

    res.json({
      url,
      timestamp: new Date().toISOString(),
      designSystem,
      voice
    });

  } catch (error) {
    console.error('Extraction error:', error);
    res.status(500).json({ 
      error: 'Failed to extract design system and voice',
      message: error.message 
    });
  }
});

// API documentation endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Design System & Voice Extraction API',
    version: '1.0.0',
    endpoints: {
      'POST /extract': {
        description: 'Extract design system and voice from a website',
        body: { url: 'https://example.com' },
        response: {
          url: 'string',
          timestamp: 'ISO string',
          designSystem: 'object',
          voice: 'object'
        }
      },
      'GET /health': {
        description: 'Health check endpoint'
      }
    }
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`Design System & Voice Extraction API running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} for API documentation`);
});

module.exports = app;