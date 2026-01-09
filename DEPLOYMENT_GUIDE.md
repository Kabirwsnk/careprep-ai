# CarePrep AI Deployment Guide

This guide covers deploying CarePrep AI to production using **free tier** services.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRODUCTION                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────────┐    ┌──────────────────┐                  │
│   │  Firebase        │    │  Render.com      │                  │
│   │  Hosting         │───▶│  Backend API     │                  │
│   │  (Frontend)      │    │  (Node.js)       │                  │
│   │                  │    │                  │                  │
│   │  careprep-ai.    │    │  careprep-ai-    │                  │
│   │  web.app         │    │  backend.onrender│                  │
│   └──────────────────┘    │  .com            │                  │
│                           └────────┬─────────┘                  │
│                                    │                            │
│                                    ▼                            │
│                           ┌──────────────────┐                  │
│                           │  Render.com      │                  │
│                           │  AI Service      │                  │
│                           │  (Python)        │                  │
│                           │                  │                  │
│                           │  careprep-ai-    │                  │
│                           │  service.onrender│                  │
│                           │  .com            │                  │
│                           └────────┬─────────┘                  │
│                                    │                            │
│                                    ▼                            │
│                           ┌──────────────────┐                  │
│                           │  OpenRouter      │                  │
│                           │  (Mistral 7B)    │                  │
│                           │  FREE            │                  │
│                           └──────────────────┘                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Services Used (All FREE)

| Component | Service | Free Tier Limits |
|-----------|---------|------------------|
| Frontend | Firebase Hosting | 10GB/month bandwidth |
| Backend | Render.com | 750 hours/month, sleeps after 15min inactivity |
| AI Service | Render.com | 750 hours/month, sleeps after 15min inactivity |
| Database | Firebase Firestore | 50K reads/day, 20K writes/day |
| Auth | Firebase Auth | Unlimited users |
| AI Model | OpenRouter (Mistral 7B) | Free tier |

---

## Step 1: Deploy Frontend to Firebase Hosting

### 1.1 Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 1.2 Login to Firebase
```bash
firebase login
```

### 1.3 Initialize Firebase Hosting
```bash
cd frontend
firebase init hosting
```
- Select your project (`careprep-ai`)
- Public directory: `dist`
- Configure as single-page app: `Yes`
- Don't overwrite `index.html`

### 1.4 Build and Deploy
```bash
# Update frontend/.env with production backend URL first!
# VITE_API_URL=https://careprep-ai-backend.onrender.com

npm run build
firebase deploy --only hosting
```

### 1.5 Get Your Frontend URL
After deployment, you'll get a URL like:
```
https://careprep-ai.web.app
```

---

## Step 2: Deploy Backend to Render.com

### 2.1 Create Render Account
1. Go to https://render.com
2. Sign up with GitHub (recommended)

### 2.2 Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repo or use "Public Git repository"
3. Enter repository URL

### 2.3 Configure Backend Service
| Setting | Value |
|---------|-------|
| Name | `careprep-ai-backend` |
| Region | Oregon (US West) |
| Branch | `main` |
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Plan | Free |

### 2.4 Add Environment Variables
Click **"Environment"** and add:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `FRONTEND_URL` | `https://careprep-ai.web.app` |
| `FIREBASE_PROJECT_ID` | `your-project-id` |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n` |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-xxxx@project.iam.gserviceaccount.com` |
| `AI_SERVICE_URL` | `https://careprep-ai-service.onrender.com` |

> **Important:** For `FIREBASE_PRIVATE_KEY`, paste the entire key including `-----BEGIN` and `-----END` with `\n` line breaks.

### 2.5 Deploy
Click **"Create Web Service"**

Your backend URL will be:
```
https://careprep-ai-backend.onrender.com
```

---

## Step 3: Deploy AI Service to Render.com

### 3.1 Create Another Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect the same repo

### 3.2 Configure AI Service
| Setting | Value |
|---------|-------|
| Name | `careprep-ai-service` |
| Region | Oregon (US West) |
| Branch | `main` |
| Root Directory | `ai-service` |
| Runtime | Python 3 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `gunicorn --bind 0.0.0.0:$PORT main:app` |
| Plan | Free |

### 3.3 Add Environment Variables
| Key | Value |
|-----|-------|
| `OPENROUTER_API_KEY` | `sk-or-v1-your-key-here` |
| `OPENROUTER_MODEL` | `mistralai/mistral-7b-instruct` |
| `PORT` | `5000` |
| `FLASK_DEBUG` | `False` |

### 3.4 Deploy
Click **"Create Web Service"**

Your AI service URL will be:
```
https://careprep-ai-service.onrender.com
```

---

## Step 4: Update Frontend Environment

After getting your backend URL, update `frontend/.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=careprep-ai.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=careprep-ai
VITE_FIREBASE_STORAGE_BUCKET=careprep-ai.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_API_URL=https://careprep-ai-backend.onrender.com
```

Then rebuild and redeploy:
```bash
cd frontend
npm run build
firebase deploy --only hosting
```

---

## Step 5: Verify Deployment

### Test Health Endpoints
```bash
# Backend health check
curl https://careprep-ai-backend.onrender.com/health

# AI service health check
curl https://careprep-ai-service.onrender.com/health
```

### Test Full Application
1. Open https://careprep-ai.web.app
2. Create a new account
3. Log symptoms
4. Try AI chat

---

## Troubleshooting

### "Service Unavailable" on Render
**Cause:** Free tier services sleep after 15 minutes of inactivity.
**Solution:** First request wakes the service. Wait ~30 seconds for cold start.

### "CORS Error" in Browser
**Cause:** Frontend URL not in allowed origins.
**Solution:** Update `FRONTEND_URL` in backend environment variables on Render.

### "Firebase Permission Denied"
**Cause:** Security rules blocking access.
**Solution:** Deploy security rules from Firebase Console.

### "AI Response Timeout"
**Cause:** OpenRouter cold start or rate limiting.
**Solution:** Retry after a few seconds. First request may take 10-15 seconds.

---

## Redeployment

### Redeploy Frontend
```bash
cd frontend
npm run build
firebase deploy --only hosting
```

### Redeploy Backend/AI Service
Render automatically redeploys when you push to the connected branch, or:
1. Go to Render Dashboard
2. Click on the service
3. Click **"Manual Deploy"** → **"Deploy latest commit"**

---

## Production URLs (Example)

| Service | URL |
|---------|-----|
| Frontend | https://careprep-ai.web.app |
| Backend | https://careprep-ai-backend.onrender.com |
| AI Service | https://careprep-ai-service.onrender.com |

---

## Scaling Notes

The free tier supports **10+ concurrent users** for hackathon demos.

For production scale:
- Upgrade Render to Starter plan ($7/month) for always-on services
- Upgrade Firebase for higher read/write limits
- Consider adding Redis for session caching
