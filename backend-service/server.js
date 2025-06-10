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
  process.exit(1);
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
  });
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

    // Forward request to OpenRouter
    const response = await fetch(openrouterUrl, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://nanobrowser.ai',
        'X-Title': 'Nanobrowser (Centralized API)',
        ...req.headers, // Forward other headers except authorization
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    // Get response data
    const responseData = await response.json();

    // Log response stats
    const duration = Date.now() - startTime;
    console.log(`📥 [${new Date().toISOString()}] Response ${response.status} in ${duration}ms`);

    // Optional: Log usage for cost tracking
    if (process.env.ENABLE_USAGE_LOGGING === 'true' && responseData.usage) {
      console.log(`💰 Usage: ${JSON.stringify(responseData.usage)}`);
    }

    // Forward response
    res.status(response.status).json(responseData);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [${new Date().toISOString()}] Error after ${duration}ms:`, error.message);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process OpenRouter request',
      timestamp: new Date().toISOString(),
    });
  }
});

// Generic chat completion endpoint (for easier integration)
app.post('/api/chat/completions', async (req, res) => {
  // Redirect to OpenRouter chat completions
  req.url = '/api/openrouter/chat/completions';
  req.path = '/api/openrouter/chat/completions';

  // Continue with the same handler
  return app._router.handle(req, res);
});

// Catch-all for unsupported endpoints
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    availableEndpoints: ['GET /health', 'GET /stats', 'POST /api/openrouter/*', 'POST /api/chat/completions'],
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
