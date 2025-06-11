# 🛠️ えいなーの手 (Einar's Hand) - Setup & Update Guide

## 📋 Table of Contents
- [Quick Setup](#quick-setup)
- [Testing Your Installation](#testing-your-installation) 
- [Updating the Extension](#updating-the-extension)
- [Backend Management](#backend-management)
- [Troubleshooting](#troubleshooting)
- [Advanced Configuration](#advanced-configuration)

---

## 🚀 Quick Setup

### 1. **Install the Extension**

**Option A: From GitHub Releases (Recommended)**
1. Go to your repository's [Releases page](https://github.com/senseisven/nanobrowser/releases)
2. Download the latest `えいなーの手-extension-*.zip` file
3. Unzip the contents to a folder

**Option B: Build from Source**
```bash
git clone https://github.com/senseisven/nanobrowser.git
cd nanobrowser
npm install
npm run build
```

### 2. **Load Extension in Chrome**
1. Open Chrome and go to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top right)
3. Click **"Load unpacked"**
4. Select the `dist` folder (or unzipped folder from releases)
5. The extension icon should appear in your browser toolbar

### 3. **Verify Installation**
1. Click the extension icon in Chrome toolbar
2. You should see the Japanese interface
3. The default provider should be **"エイナーのAI (APIキー不要)"**
4. No API key configuration required!

---

## 🧪 Testing Your Installation

### **Test 1: Check Extension UI**
- ✅ Sidebar opens in Japanese
- ✅ Custom templates visible (メール, ニュース, 議事録)
- ✅ Settings show centralized API provider

### **Test 2: Test API Connection**
1. Open the extension sidebar
2. Try a simple query: "Hello, how are you?"
3. Should get response from your Render API
4. Check browser console for any errors (F12 → Console)

### **Test 3: Verify Backend Health**
Open in browser: `https://nanobrowser-api.onrender.com/health`

Should show:
```json
{
  "status": "healthy",
  "timestamp": "2024-XX-XX...",
  "service": "nanobrowser-api-service"
}
```

### **Test 4: Check Usage Stats**
Visit: `https://nanobrowser-api.onrender.com/stats`

Shows backend uptime and memory usage.

---

## 🔄 Updating the Extension

### **Automatic Updates (GitHub Actions)**
- ✅ Every push to `master` automatically builds new version
- ✅ Creates GitHub release with downloadable ZIP
- ✅ No manual building required

### **Manual Update Process**
1. **Download latest release** from GitHub releases page
2. **Remove old extension**:
   - Go to `chrome://extensions/`
   - Click "Remove" on old version
3. **Install new version**:
   - Follow installation steps above with new ZIP file
4. **Verify update**: Check version in extension popup

### **For Developers**
```bash
# Pull latest changes
git pull origin master

# Rebuild extension
npm run build

# Reload extension in Chrome
# Go to chrome://extensions/ and click "Reload" on the extension
```

---

## 🖥️ Backend Management

### **Monitoring Your Render Service**
1. **Dashboard**: Login to [render.com](https://render.com) → Your Service
2. **Logs**: Click "Logs" tab to see real-time activity
3. **Metrics**: Monitor CPU, memory, and request patterns

### **Health Monitoring**
- **Health Check**: `https://nanobrowser-api.onrender.com/health`
- **Stats**: `https://nanobrowser-api.onrender.com/stats`
- **Automatic Restart**: Render restarts if service crashes

### **Updating Backend**
Backend updates automatically when you push to GitHub:
1. **Make changes** to files in `backend-service/`
2. **Commit and push**: `git push origin master`
3. **Render auto-deploys** (2-5 minutes)
4. **Monitor logs** in Render dashboard

### **Environment Variables**
Update in Render dashboard → Your Service → Environment:
- `OPENROUTER_API_KEY`: Your OpenRouter API key
- `RATE_LIMIT_PER_MINUTE`: API calls per minute (default: 100)
- `ALLOWED_ORIGINS`: CORS origins (default: chrome-extension://*)

---

## 🚨 Troubleshooting

### **Extension Issues**

**Problem**: Extension doesn't load
- ✅ Check `chrome://extensions/` for error messages
- ✅ Verify you selected the correct `dist` folder
- ✅ Try refreshing the extension page

**Problem**: Japanese text looks broken
- ✅ Restart Chrome
- ✅ Check if Japanese fonts are installed on your system

**Problem**: "エイナーのAI" not showing up
- ✅ Extension might need a few seconds to initialize
- ✅ Check browser console for errors (F12)
- ✅ Try reloading the extension

### **API Connection Issues**

**Problem**: No response from AI
- ✅ Check `https://nanobrowser-api.onrender.com/health`
- ✅ Service might be sleeping (first request takes 30+ seconds)
- ✅ Check Render logs for errors

**Problem**: "Rate limit exceeded"
- ✅ Wait 1 minute for rate limit reset
- ✅ Increase `RATE_LIMIT_PER_MINUTE` in Render environment

**Problem**: CORS errors in browser console
- ✅ Check `ALLOWED_ORIGINS` includes `chrome-extension://*`
- ✅ Restart Render service

### **Build Issues**

**Problem**: npm run build fails
- ✅ Run `npm install` first
- ✅ Check Node.js version (need 18+)
- ✅ Clear cache: `npm run clean:bundle`

---

## ⚙️ Advanced Configuration

### **Custom API Endpoints**
To use different backend URL:
1. Update `packages/storage/lib/settings/centralizedApi.ts`
2. Change `baseUrl` to your custom endpoint
3. Rebuild extension

### **Custom Rate Limits**
Adjust in Render environment variables:
```env
RATE_LIMIT_PER_MINUTE=200  # Higher limit
```

### **Development Mode**
```bash
# Start dev server
npm run dev

# Watch for changes
npm run dev:watch
```

### **Custom Templates**
Users can add their own templates through the extension UI:
1. Click "+" button in favorites
2. Enter title and content
3. Templates saved to local storage

---

## 📊 Usage Analytics

### **Monitor API Usage**
Check your backend stats:
```bash
curl https://nanobrowser-api.onrender.com/stats
```

### **OpenRouter Usage**
Monitor your OpenRouter dashboard for:
- Total API calls
- Cost per month
- Most used models

### **Extension Analytics**
Currently no built-in analytics. Consider adding:
- Usage tracking
- Error reporting
- Performance metrics

---

## 🎉 Success Indicators

✅ **Extension installed and shows Japanese UI**
✅ **API responds within 30 seconds**
✅ **Custom templates work**
✅ **No API key setup required for users**
✅ **Automatic updates working**
✅ **Backend healthy and responsive**

---

## 📞 Support

If you encounter issues:

1. **Check this guide** for common problems
2. **Review logs** in Render dashboard
3. **Test API endpoints** manually
4. **Check GitHub Issues** for similar problems
5. **Create new issue** with detailed error info

**Log Collection**:
- Browser console errors (F12 → Console)
- Render service logs
- Extension error details from `chrome://extensions/` 