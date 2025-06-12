import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Validate required environment variables
if (!process.env.OPENROUTER_API_KEY) {
  console.error('❌ OPENROUTER_API_KEY is required in environment variables');
  console.error('❌ Please set OPENROUTER_API_KEY in your Render environment variables');
  console.error(
    '❌ Available environment variables:',
    Object.keys(process.env).filter(key => !key.includes('SECRET') && !key.includes('KEY')),
  );
  process.exit(1);
}

// Validate API key format
if (!process.env.OPENROUTER_API_KEY.startsWith('sk-or-v1-')) {
  console.warn('⚠️  OPENROUTER_API_KEY does not start with expected prefix "sk-or-v1-"');
  console.warn('⚠️  This may indicate an invalid API key format');
}

// Rate limiting configuration
const rateLimiter = new RateLimiterMemory({
  keyGeneratorFunction: req => req.ip,
  points: parseInt(process.env.RATE_LIMIT_PER_MINUTE) || 60, // Number of requests
  duration: 60, // Per 60 seconds
});

// CORS configuration for Chrome extension
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['chrome-extension://*'];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        const pattern = allowedOrigin.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(origin);
      }
      return allowedOrigin === origin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP for API service
  }),
);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Rate limiting middleware
app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    const msBeforeNext = rejRes.msBeforeNext || 1000;
    res.set('Retry-After', Math.round(msBeforeNext / 1000));
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.round(msBeforeNext / 1000),
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'nanobrowser-api-service',
    openrouter_key_configured: !!process.env.OPENROUTER_API_KEY,
    node_version: process.version,
  });
});

// Debug endpoint to test OpenRouter connection
app.get('/debug/openrouter', async (req, res) => {
  try {
    console.log('🔍 Testing OpenRouter connection...');

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({
        error: 'OPENROUTER_API_KEY not configured',
        configured_vars: Object.keys(process.env).filter(key => !key.includes('SECRET') && !key.includes('KEY')),
      });
    }

    // Test with a simple request to OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();
    console.log(`🔍 OpenRouter models endpoint response: ${response.status}`);

    if (response.ok) {
      res.json({
        status: 'OpenRouter connection successful',
        response_status: response.status,
        api_key_valid: true,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(502).json({
        status: 'OpenRouter connection failed',
        response_status: response.status,
        error_details: responseText,
        api_key_valid: false,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('❌ Debug OpenRouter test failed:', error);
    res.status(500).json({
      error: 'Failed to test OpenRouter connection',
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Usage stats endpoint (optional)
app.get('/stats', (req, res) => {
  const stats = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  };
  res.json(stats);
});

// OpenRouter proxy endpoint
app.post('/api/openrouter/*', async (req, res) => {
  const startTime = Date.now();

  try {
    // Extract the path after /api/openrouter/
    const openrouterPath = req.path.replace('/api/openrouter/', '');
    const openrouterUrl = `https://openrouter.ai/api/v1/${openrouterPath}`;

    // Log request (without sensitive data)
    console.log(`📤 [${new Date().toISOString()}] ${req.method} ${openrouterPath} from ${req.ip}`);
    console.log(`🔗 OpenRouter URL: ${openrouterUrl}`);
    console.log(`🔑 API Key configured: ${process.env.OPENROUTER_API_KEY ? 'Yes' : 'No'}`);
    console.log(`📝 Request body: ${JSON.stringify(req.body)}`);

    // Check if API key is configured
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('❌ OPENROUTER_API_KEY is not configured');
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'OPENROUTER_API_KEY is not configured in environment variables',
        timestamp: new Date().toISOString(),
      });
    }

    // Forward request to OpenRouter
    const response = await fetch(openrouterUrl, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://nanobrowser.ai',
        'X-Title': 'Nanobrowser (Centralized API)',
        // Don't forward all headers to avoid conflicts
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    // Log response status
    console.log(`📊 OpenRouter response status: ${response.status}`);

    // Get response data
    let responseData;
    const responseText = await response.text();

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`❌ Failed to parse OpenRouter response: ${responseText}`);
      return res.status(502).json({
        error: 'Bad Gateway',
        message: 'Invalid response from OpenRouter API',
        details: responseText.substring(0, 500), // Include first 500 chars for debugging
        timestamp: new Date().toISOString(),
      });
    }

    // Log response stats
    const duration = Date.now() - startTime;
    console.log(`📥 [${new Date().toISOString()}] Response ${response.status} in ${duration}ms`);

    // If OpenRouter returned an error, log it
    if (!response.ok) {
      console.error(`❌ OpenRouter API error:`, responseData);
    }

    // Optional: Log usage for cost tracking
    if (process.env.ENABLE_USAGE_LOGGING === 'true' && responseData.usage) {
      console.log(`💰 Usage: ${JSON.stringify(responseData.usage)}`);
    }

    // Forward response
    res.status(response.status).json(responseData);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [${new Date().toISOString()}] Error after ${duration}ms:`, error.message);
    console.error(`❌ Full error:`, error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process OpenRouter request',
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Generic chat completion endpoint (for easier integration)
app.post('/api/chat/completions', async (req, res) => {
  const startTime = Date.now();

  try {
    console.log(`📤 [${new Date().toISOString()}] Chat completion request from ${req.ip}`);
    console.log(`📝 Request body: ${JSON.stringify(req.body)}`);

    // Check if API key is configured
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('❌ OPENROUTER_API_KEY is not configured');
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'OPENROUTER_API_KEY is not configured in environment variables',
        timestamp: new Date().toISOString(),
      });
    }

    const controller = new AbortController();
    const openrouterUrl = 'https://openrouter.ai/api/v1/chat/completions';

    // 30-second safety timeout so one slow request can't freeze the whole app
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const response = await fetch(openrouterUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://nanobrowser.ai',
        'X-Title': 'Nanobrowser (Centralized API)',
      },
      body: JSON.stringify({ ...req.body, stream: false }), // ensure non-streaming
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    console.log(`📊 OpenRouter response status: ${response.status}`);

    // Pipe the raw body straight back to the client – no buffering
    res.status(response.status);
    response.body.pipe(res);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [${new Date().toISOString()}] Chat completion error after ${duration}ms:`, error.message);
    console.error('❌ Full error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process chat completion request',
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Catch-all for unsupported endpoints
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    availableEndpoints: [
      'GET /health',
      'GET /stats',
      'GET /debug/openrouter',
      'POST /api/openrouter/*',
      'POST /api/chat/completions',
    ],
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Nanobrowser API Service running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 OpenRouter API configured: ${process.env.OPENROUTER_API_KEY ? '✅ Yes' : '❌ No'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});
