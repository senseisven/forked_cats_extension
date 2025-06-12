# 🔧 Render Deployment Fix Guide

## Current Issue
Your extension is showing connection errors because the Render backend service can't connect to OpenRouter. The error appears as:
```
Failed to invoke openai/gpt-4.1-mini with structured output: Error: Connection error.
```

## Root Cause
The issue is likely missing or invalid `OPENROUTER_API_KEY` environment variable in your Render deployment.

## 🚨 Immediate Fix Steps

### Step 1: Check Environment Variables in Render

1. **Go to your Render dashboard**: https://dashboard.render.com
2. **Find your service**: Look for `nanobrowser-api` or similar name
3. **Click on your service** to open the service details
4. **Go to the Environment tab** on the left sidebar
5. **Check if `OPENROUTER_API_KEY` is set**

### Step 2: Set Missing Environment Variables

If `OPENROUTER_API_KEY` is missing or incorrect, add/update these environment variables:

```env
OPENROUTER_API_KEY=sk-or-v1-YOUR_ACTUAL_API_KEY_HERE
NODE_ENV=production
PORT=10000
ALLOWED_ORIGINS=chrome-extension://*
RATE_LIMIT_PER_MINUTE=100
ENABLE_USAGE_LOGGING=true
```

**Important**: Replace `sk-or-v1-YOUR_ACTUAL_API_KEY_HERE` with your actual OpenRouter API key.

### Step 3: Get OpenRouter API Key (if needed)

If you don't have an OpenRouter API key:

1. **Sign up at OpenRouter**: https://openrouter.ai
2. **Go to Keys section**: https://openrouter.ai/keys
3. **Create a new API key**
4. **Copy the key** (starts with `sk-or-v1-`)
5. **Add it to Render environment variables**

### Step 4: Restart Service

1. **In Render dashboard**, go to your service
2. **Click "Manual Deploy"** button or **Settings > Deploy**
3. **Wait for deployment to complete** (watch the logs)

## 🧪 Test the Fix

After deployment completes (usually 2-5 minutes):

### Test 1: Health Check
```bash
curl https://einanoshou.onrender.com/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "service": "nanobrowser-api-service",
  "openrouter_key_configured": true,
  "node_version": "..."
}
```

### Test 2: Debug Endpoint
```bash
curl https://einanoshou.onrender.com/debug/openrouter
```

Should return:
```json
{
  "status": "OpenRouter connection successful",
  "response_status": 200,
  "api_key_valid": true,
  "timestamp": "..."
}
```

### Test 3: Chat Completion
```bash
curl -X POST https://einanoshou.onrender.com/api/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

Should return a chat response, not a 502 error.

## 🔍 Troubleshooting

### If API key is set but still getting errors:

1. **Check API key validity**:
   - Make sure it starts with `sk-or-v1-`
   - Test it directly at https://openrouter.ai/keys
   - Ensure you have credits/billing set up

2. **Check Render logs**:
   - Go to your service in Render
   - Click "Logs" tab
   - Look for error messages about OpenRouter

### If service won't start:

1. **Check all environment variables are set**
2. **Ensure `PORT=10000`** (Render's requirement)
3. **Look at deployment logs** for specific error messages

### Common Error Messages:

- `❌ OPENROUTER_API_KEY is required` → API key not set
- `⚠️ OPENROUTER_API_KEY does not start with expected prefix` → Wrong API key format
- `502 Bad Gateway` → API key invalid or OpenRouter connection failed

## 🚀 Verify Extension Works

After fixing the backend:

1. **Open Chrome extension**
2. **Try a simple task**: "Hello, can you help me browse the web?"
3. **Check if you get a response** instead of connection errors

## 📞 Need More Help?

If you're still having issues:

1. **Check Render logs** for specific error messages
2. **Verify your OpenRouter account** has credits
3. **Test the debug endpoint** to isolate the issue

The updated backend service includes much better error reporting, so any remaining issues should be clearly visible in the logs or debug endpoint responses. 