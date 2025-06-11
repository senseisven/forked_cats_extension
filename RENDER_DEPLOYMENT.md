# 🚀 Deploy to Render - Complete Guide

## Overview
This guide walks you through deploying your private backend service on **Render** for your custom Nanobrowser extension.

## ✅ Prerequisites
- GitHub account with your private nanobrowser repository
- OpenRouter API key
- 5 minutes of your time

---

## 📋 Step-by-Step Deployment

### **1. Sign Up for Render**
1. Go to [render.com](https://render.com)
2. Click **"Get Started for Free"**
3. Sign in with your **GitHub** account
4. Authorize Render to access your repositories (including private ones)

### **2. Create Web Service**
1. From your Render dashboard, click **"New +"** in the top right
2. Select **"Web Service"**
3. You'll see a list of your repositories (including your private nanobrowser repo)
4. Select your **nanobrowser** repository
5. Click **"Connect"**

### **3. Configure Service Settings**

Fill out these settings:

**Basic Configuration:**
- **Name**: `nanobrowser-api` (or any name you prefer)
- **Region**: Choose the region closest to your users
  - `Oregon (US West)` - for US West Coast users
  - `Ohio (US East)` - for US East Coast users
  - `Frankfurt (EU)` - for European users
  - `Singapore (Asia)` - for Asian users
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend-service`
- **Runtime**: `Node`

**Build & Deploy Commands:**
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### **4. Set Environment Variables**

Add these environment variables in the **Environment Variables** section:

```bash
OPENROUTER_API_KEY=your_openrouter_api_key_here
NODE_ENV=production
PORT=10000
ALLOWED_ORIGINS=chrome-extension://*
RATE_LIMIT_PER_MINUTE=100
ENABLE_USAGE_LOGGING=true
```

> **⚠️ Important**: Replace `your_openrouter_api_key_here` with your actual OpenRouter API key

### **5. Deploy**
1. Click **"Create Web Service"**
2. Render will start building and deploying
3. Watch the deployment logs in real-time
4. Wait for completion (usually 2-5 minutes)

---

## 🌐 After Deployment

### **Get Your Service URL**
Once deployed, you'll receive a URL like:
```
https://einanoshou.onrender.com
```

### **Test Your API**
Test that your API is working:
```bash
curl https://einanoshou.onrender.com/health
```

You should see:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-XX...",
  "uptime": "XX.XX seconds"
}
```

---

## 🔄 Extension Updates

**Good news!** Your extension is already configured to use your Render URL:
- `https://einanoshou.onrender.com/api/chat/completions`

The extension will automatically:
1. Initialize the centralized API provider on startup
2. Set it as the default (no API key required)
3. Show "エイナーのAI (APIキー不要)" in the settings

---

## 📊 Monitoring & Management

### **View Logs**
- Go to your service dashboard on Render
- Click the **"Logs"** tab to see real-time logs
- Monitor API requests and errors

### **Check Usage Stats**
Visit your API's stats endpoint:
```
https://einanoshou.onrender.com/stats
```

### **Scaling**
Render's free tier includes:
- 750 hours/month of runtime
- Automatic sleep after 15 minutes of inactivity
- Automatic wake-up on first request

For higher usage, upgrade to a paid plan for:
- Always-on service (no sleeping)
- More compute resources
- Priority support

---

## 🚨 Troubleshooting

### **Service Won't Start**
1. Check the **Logs** tab for error messages
2. Verify all environment variables are set correctly
3. Ensure `PORT=10000` is set (Render's default port)

### **API Returns Errors**
1. Check your OpenRouter API key is valid
2. Verify the CORS settings allow chrome extensions
3. Check rate limiting isn't too restrictive

### **Extension Can't Connect**
1. Verify your service URL is correct
2. Check the service is running (not sleeping)
3. Test the `/health` endpoint manually

---

## 💰 Cost Estimates

**Free Tier** (Perfect for personal use):
- 750 hours/month runtime
- Service sleeps after 15 min inactivity
- **Cost**: $0/month

**Starter Plan** (Always-on):
- Always-on service
- 0.5 GB RAM, 0.5 CPU
- **Cost**: ~$7/month

---

## 🎉 You're Done!

Your Nanobrowser extension is now running with your own private backend! Users can:
- Use AI features without needing their own API keys
- Enjoy the Japanese localization
- Access your custom templates
- Have a seamless experience

The backend automatically handles:
- Rate limiting
- Error handling  
- Usage logging
- Security headers

**Next Steps:**
1. Test the extension with real usage
2. Monitor the logs for any issues
3. Consider upgrading to paid plan if you hit the free tier limits
4. Share the extension with others! 