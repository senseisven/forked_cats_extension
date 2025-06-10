# Nanobrowser API Service

A centralized backend service that handles OpenRouter API calls for the Nanobrowser Chrome extension, eliminating the need for users to configure their own API keys.

## 🚀 Features

- **Centralized API Management**: Handle all OpenRouter API calls from one place
- **User-Friendly**: No API key configuration required for end users
- **Rate Limiting**: Built-in protection against abuse
- **CORS Support**: Properly configured for Chrome extension requests
- **Usage Tracking**: Optional logging for cost monitoring
- **Health Monitoring**: Built-in health check and stats endpoints
- **Security**: Helmet.js security headers and request validation

## 📋 Prerequisites

- Node.js 18+ 
- OpenRouter API key
- A server/hosting platform (Railway, Render, Vercel, etc.)

## 🛠 Setup

### 1. Install Dependencies

```bash
cd backend-service
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:
```bash
cp env.example .env
```

Edit `.env` with your configuration:
```env
# Required
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Optional - Server Configuration
PORT=3001
NODE_ENV=production

# Optional - CORS (default allows all chrome-extension://* origins)
ALLOWED_ORIGINS=chrome-extension://your-extension-id

# Optional - Rate Limiting (default: 60 requests per minute)
RATE_LIMIT_PER_MINUTE=60

# Optional - Usage Logging
ENABLE_USAGE_LOGGING=true
LOG_LEVEL=info
```

### 3. Start the Service

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## 🌐 API Endpoints

### Health Check
```
GET /health
```
Returns service status and timestamp.

### Usage Stats
```
GET /stats
```
Returns uptime, memory usage, and other stats.

### OpenRouter Proxy
```
POST /api/openrouter/*
```
Proxies any OpenRouter API request. Examples:
- `POST /api/openrouter/chat/completions`
- `POST /api/openrouter/models`

### Chat Completions (Shortcut)
```
POST /api/chat/completions
```
Direct alias for chat completions endpoint.

## 🚀 Deployment Options

### Railway (Recommended for simplicity)

1. Connect your GitHub repository to Railway
2. Add environment variables in Railway dashboard
3. Deploy automatically on push

### Render

1. Create new Web Service on Render
2. Connect your repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables

### Vercel (Serverless)

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the backend-service directory
3. Configure environment variables in Vercel dashboard

### DigitalOcean App Platform

1. Create new app from GitHub repository
2. Configure build and run commands
3. Add environment variables
4. Deploy

### Manual VPS Setup

```bash
# Clone repository
git clone your-repo-url
cd nanobrowser/backend-service

# Install dependencies
npm install

# Configure environment
cp env.example .env
# Edit .env with your settings

# Install PM2 for process management
npm install -g pm2

# Start service
pm2 start server.js --name nanobrowser-api

# Setup PM2 startup
pm2 startup
pm2 save
```

## 🔧 Extension Configuration

After deploying the backend service, you'll need to update the extension to use your API service instead of direct OpenRouter calls.

The deployed service URL will be something like:
- Railway: `https://your-app.railway.app`
- Render: `https://your-app.onrender.com`
- Vercel: `https://your-app.vercel.app`

## 📊 Monitoring

### Health Check
```bash
curl https://your-api-service.com/health
```

### Usage Stats
```bash
curl https://your-api-service.com/stats
```

### Logs
Monitor your deployment platform's logs for:
- Request/response logging
- Rate limiting events
- Error tracking
- Usage statistics (if enabled)

## 🔐 Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **Rate Limiting**: Configured to prevent abuse
3. **CORS**: Restricts requests to authorized origins
4. **API Key**: Stored securely on server, never exposed to clients
5. **Headers**: Security headers via Helmet.js

## 💰 Cost Management

- Monitor OpenRouter usage in your dashboard
- Enable usage logging: `ENABLE_USAGE_LOGGING=true`
- Set up alerts in your hosting platform
- Consider implementing user authentication for additional control

## 🐛 Troubleshooting

### Common Issues

**CORS Errors:**
- Ensure your extension ID is in `ALLOWED_ORIGINS`
- Check that the origin format matches exactly

**Rate Limiting:**
- Adjust `RATE_LIMIT_PER_MINUTE` if needed
- Monitor logs for rate limit hits

**API Key Issues:**
- Verify OpenRouter API key is valid
- Check API key has sufficient credits

**Connection Issues:**
- Ensure server is running and accessible
- Check firewall/network settings
- Verify SSL certificate (for HTTPS)

### Debug Mode

Run with debug logging:
```bash
LOG_LEVEL=debug npm start
```

## 📝 API Usage Examples

### Test with cURL

```bash
# Health check
curl https://your-api-service.com/health

# Chat completion
curl -X POST https://your-api-service.com/api/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4o",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

## 🔄 Updates

To update the service:

1. Pull latest changes
2. Install any new dependencies: `npm install`
3. Restart the service
4. Monitor logs for any issues

## 📞 Support

For issues related to:
- **OpenRouter API**: Check OpenRouter documentation
- **Hosting Platform**: Consult your platform's support
- **Extension Integration**: Refer to extension documentation 