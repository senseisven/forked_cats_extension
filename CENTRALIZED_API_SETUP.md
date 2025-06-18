# 🔧 Centralized API Service Setup

This document explains how to set up and deploy your centralized API service so users don't need to configure their own API keys.

## 📋 Overview

The centralized API service acts as a proxy between your Nanobrowser extension and OpenRouter, handling all API calls on behalf of your users. This means:

✅ **Users don't need API keys**  
✅ **You control costs and usage**  
✅ **Simplified user experience**  
✅ **Centralized monitoring and analytics**

## 🚀 Quick Deployment Guide

### Option 1: Railway (Recommended - Easiest)

1. **Create Railway Account**: Go to [railway.app](https://railway.app)

2. **Deploy from GitHub**:
   ```bash
   # Connect your GitHub repository to Railway
   # Railway will auto-detect the Node.js service in /backend-service
   ```

3. **Set Environment Variables** in Railway dashboard:
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   PORT=3001
   NODE_ENV=production
   ALLOWED_ORIGINS=chrome-extension://*
   RATE_LIMIT_PER_MINUTE=100
   ENABLE_USAGE_LOGGING=true
   ```

4. **Get Your Service URL**: Railway will provide a URL like `https://nanobrowser-api-production.railway.app`

### Option 2: Render

1. **Create Render Account**: Go to [render.com](https://render.com)

2. **Create Web Service**:
   - Repository: Your GitHub repository
   - Root Directory: `backend-service`
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Environment Variables**:
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   NODE_ENV=production
   ALLOWED_ORIGINS=chrome-extension://*
   RATE_LIMIT_PER_MINUTE=100
   ```

### Option 3: Vercel (Serverless)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   cd backend-service
   vercel
   ```

3. **Configure in Vercel Dashboard**:
   - Add environment variables
   - Set up custom domain (optional)

## 🔧 Extension Configuration

After deploying your backend service, you need to update the extension configuration:

### Step 1: Update Default API URL

Edit `packages/storage/lib/settings/centralizedApi.ts`:

```typescript
const defaultConfig: CentralizedApiConfig = {
  baseUrl: 'https://YOUR-DEPLOYED-SERVICE.com/api/chat/completions', // Update this!
  enabled: true,
  lastChecked: Date.now(),
  version: '1.0.0',
};
```

### Step 2: Update Default Provider Configuration

Edit `packages/storage/lib/settings/llmProviders.ts`:

```typescript
case ProviderTypeEnum.CentralizedAPI:
  return {
    apiKey: 'not-required',
    name: getDefaultDisplayNameFromProviderId(ProviderTypeEnum.CentralizedAPI),
    type: ProviderTypeEnum.CentralizedAPI,
    baseUrl: 'https://YOUR-DEPLOYED-SERVICE.com/api/chat/completions', // Update this!
    modelNames: [...(llmProviderModelNames[ProviderTypeEnum.CentralizedAPI] || [])],
    createdAt: Date.now(),
  };
```

### Step 3: Update Initialization

Edit `chrome-extension/src/background/index.ts`:

```typescript
// Initialize default centralized API provider with your URL
setupDefaultCentralizedProvider('https://YOUR-DEPLOYED-SERVICE.com/api/chat/completions')
  .catch(error => console.error('Failed to setup default centralized provider:', error));
```

### Step 4: Build and Test

```bash
pnpm build
```

## 📊 Monitoring and Analytics

### Health Checks

Your service provides health endpoints:

```bash
# Check if service is running
curl https://YOUR-SERVICE.com/health

# Get usage statistics
curl https://YOUR-SERVICE.com/stats
```

### Logs and Monitoring

Enable usage logging to track costs:

```env
ENABLE_USAGE_LOGGING=true
```

This will log:
- Request/response times
- Token usage (for cost tracking)
- Error rates
- Rate limiting events

### Set Up Alerts

Most hosting platforms provide alerting:

1. **Railway**: Set up notification webhooks
2. **Render**: Configure health check alerts  
3. **Vercel**: Monitor function usage and errors

## 💰 Cost Management

### OpenRouter Usage

- Monitor your OpenRouter dashboard for usage
- Set up billing alerts
- Consider rate limiting based on your budget

### Recommended Settings

```env
# For moderate usage (small user base)
RATE_LIMIT_PER_MINUTE=60

# For higher usage (larger user base)
RATE_LIMIT_PER_MINUTE=300

# Enable detailed logging for cost tracking
ENABLE_USAGE_LOGGING=true
```

### Budget Protection

1. **Set OpenRouter spending limits** in your OpenRouter account
2. **Monitor daily/monthly usage** via logs
3. **Implement user authentication** if needed for additional control
4. **Set up cost alerts** in your hosting platform

## 🔐 Security Best Practices

### Environment Variables

Never commit `.env` files. Always use your hosting platform's environment variable system.

### CORS Configuration

For production, specify exact extension IDs:

```env
ALLOWED_ORIGINS=chrome-extension://your-actual-extension-id
```

### API Key Security

- Use a dedicated OpenRouter API key for this service
- Rotate keys regularly
- Monitor for unusual usage patterns

## 🐛 Troubleshooting

### Common Issues

**Extension can't connect to API**:
- Check CORS configuration
- Verify the API URL is correct
- Ensure service is running

**High costs**:
- Check rate limiting settings
- Monitor usage logs
- Verify no abuse/spam

**Service not responding**:
- Check health endpoint: `/health`
- Review service logs
- Verify environment variables

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
```

### Testing

Test your API service:

```bash
# Test health endpoint
curl https://YOUR-SERVICE.com/health

# Test chat completion
curl -X POST https://YOUR-SERVICE.com/api/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## 📈 Scaling Considerations

### Performance

- Use Node.js clustering for multiple cores
- Consider using Redis for rate limiting in multi-instance setups
- Monitor response times and optimize as needed

### Multi-Region Deployment

For global users, consider deploying to multiple regions:
- US: Primary deployment
- EU: European users
- APAC: Asian users

### Load Balancing

For high traffic:
- Use your hosting platform's load balancing
- Consider CDN for static assets
- Implement health checks for automatic failover

## 🔄 Updates and Maintenance

### Updating the Service

1. Push updates to your repository
2. Service will auto-deploy (for most platforms)
3. Monitor logs for any issues
4. Test functionality after deployment

### Extension Updates

When updating the extension:
1. Ensure API compatibility
2. Test with your deployed service
3. Update API URL if service endpoint changes
4. Coordinate releases if breaking changes

## 📞 Support Resources

- **OpenRouter Docs**: https://openrouter.ai/docs
- **Railway Docs**: https://docs.railway.app
- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs

## Model Context Protocol (MCP) Setup

### Current Status
The current Google Sheets MCP integration is a **placeholder implementation** and requires proper setup to work.

### Setting Up Google Sheets MCP Integration

To enable actual Google Sheets MCP functionality, you have several options:

#### Option 1: Use mkummer225/google-sheets-mcp (Recommended)

1. Clone and set up the official Google Sheets MCP server:
```bash
git clone https://github.com/mkummer225/google-sheets-mcp.git
cd google-sheets-mcp
npm install
npm run build
```

2. Set up Google Cloud credentials:
   - Create a new project in [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the Google Sheets API
   - Configure OAuth consent screen
   - Create OAuth client ID credentials (Desktop application)
   - Download credentials and save as `gcp-oauth.keys.json` in the `dist` subdirectory

3. Update `chrome-extension/src/background/services/mcp.ts`:
```typescript
// Replace the placeholder configuration
endpoint: 'http://localhost:3000', // or your server URL
command: 'node',
args: ['/path/to/google-sheets-mcp/dist/index.js']
```

#### Option 2: Use felores/gdrive-mcp-server

This includes Google Sheets functionality as part of Google Drive integration:

1. Clone and set up:
```bash
git clone https://github.com/felores/gdrive-mcp-server.git
cd gdrive-mcp-server
npm install
npm run build
```

2. Follow the authentication setup in their README

3. Update the MCP service configuration accordingly

#### Option 3: Disable MCP (Current Default)

The system will automatically fall back to browser automation when MCP is not properly configured. This is the current behavior since `endpoint: undefined` is set.

### Testing MCP Integration

Once you have a real MCP server running:

1. Update the endpoint in the MCP service configuration
2. Test the integration by asking the AI to perform spreadsheet operations
3. Check the console logs for MCP-related messages

### Troubleshooting

**"Failed to fetch" errors**: This indicates the MCP endpoint is not reachable
- Verify the MCP server is running
- Check the endpoint URL is correct
- Ensure proper authentication is set up

**MCP not being used**: The system will automatically fall back to browser automation
- Check console logs for MCP availability messages
- Verify the `shouldUseMCP` logic detects your task properly

## Speech-to-Text API Setup

### OpenAI Whisper
1. Sign up for OpenAI API access
2. Get your API key from the OpenAI dashboard
3. Configure in extension settings

### Google Cloud Speech-to-Text
1. Create a Google Cloud project
2. Enable the Speech-to-Text API
3. Create service account credentials
4. Configure in extension settings

## Other API Integrations

(Add other API setup instructions here as needed) 