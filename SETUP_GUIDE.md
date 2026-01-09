# CarePrep AI - Complete Setup Guide for Beginners 🚀

This guide will walk you through EVERY step needed to run CarePrep AI.

---

## ✅ Already Done For You

The following dependencies have already been installed:
- **Frontend**: 246 npm packages (React, Vite, Tailwind, Chart.js, etc.)
- **Backend**: npm packages (Express, Firebase Admin, etc.)  
- **AI Service**: Python packages (Flask, requests, pandas, Pillow, etc.)

---

## 📋 What YOU Need to Do

### 1. Install Tesseract OCR (for reading images)

1. Go to: https://github.com/UB-Mannheim/tesseract/wiki
2. Download the Windows installer (`.exe` file)  
3. Run the installer with default settings
4. Add to PATH:
   - Press `Windows + R`, type `sysdm.cpl`, press Enter
   - Click "Advanced" tab → "Environment Variables"
   - Under "System variables", find "Path", click "Edit"
   - Click "New" and add: `C:\Program Files\Tesseract-OCR`
   - Click OK on all windows

### 2. Install Poppler (for reading PDFs)

1. Go to: https://github.com/osber/poppler-windows/releases
2. Download the latest `.zip` file
3. Extract to `C:\poppler`
4. Add to PATH (same steps as Tesseract):
   - Add: `C:\poppler\Library\bin`

---

## 🔥 Firebase Setup (Authentication + Firestore)

### Step 1: Create Firebase Project
1. Go to: https://console.firebase.google.com/
2. Sign in with Google account
3. Click **"Create a project"** → Name it `careprep-ai`
4. Disable Analytics → Click **"Create project"**

### Step 2: Enable Authentication
1. Click **Build → Authentication → Get Started**
2. Click **Email/Password** → Enable the first toggle → Save

### Step 3: Enable Firestore Database
1. Click **Build → Firestore Database → Create database**
2. Select **"Start in test mode"** (for development)
3. Choose a location → Click **"Enable"**

### Step 4: Get Web App Credentials (for Frontend)
1. Go to Project Overview (home icon)
2. Click the **web icon** (`</>`)
3. Enter nickname: `careprep-frontend`
4. Click **"Register app"**
5. **Copy these values** (you'll need them):
   ```
   apiKey: "AIza..."
   authDomain: "careprep-ai.firebaseapp.com"
   projectId: "careprep-ai"
   storageBucket: "careprep-ai.appspot.com"
   messagingSenderId: "123456789"
   appId: "1:123456789:web:abc..."
   ```

### Step 5: Get Service Account Key (for Backend)
1. Click ⚙️ (gear icon) → **Project settings**
2. Click **"Service accounts"** tab
3. Click **"Generate new private key"**
4. A JSON file downloads - **save it safely!**

---

## 🤖 OpenRouter Setup (FREE!)

1. Go to: https://openrouter.ai/
2. Sign up with Google or GitHub (no payment required!)
3. Go to: https://openrouter.ai/keys
4. Click **"Create Key"** → Copy the key (starts with `sk-or-...`)
5. **No payment needed!** Use free models like `mistralai/mistral-7b-instruct`

---

## 📝 Configure Environment Files

### Frontend (frontend/.env)
Create a file called `.env` in the `frontend` folder:
```
VITE_FIREBASE_API_KEY=AIza...your_key
VITE_FIREBASE_AUTH_DOMAIN=careprep-ai.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=careprep-ai
VITE_FIREBASE_STORAGE_BUCKET=careprep-ai.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc...
VITE_API_URL=http://localhost:3001
```

### Backend (backend/.env)
Create a file called `.env` in the `backend` folder:
```
PORT=3001
FRONTEND_URL=http://localhost:5173

# Firebase (from your downloaded JSON file)
FIREBASE_PROJECT_ID=careprep-ai
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@careprep-ai.iam.gserviceaccount.com

AI_SERVICE_URL=http://localhost:5000
```

### AI Service (ai-service/.env)
Create a file called `.env` in the `ai-service` folder:
```
OPENROUTER_API_KEY=sk-or-your_openrouter_key_here
OPENROUTER_MODEL=mistralai/mistral-7b-instruct
PORT=5000
```

---

## 🚀 Run the Application

Open **3 separate Command Prompt windows**:

### Terminal 1 - Frontend
```cmd
cd C:\Users\Kabir Wasnik\.gemini\antigravity\scratch\careprep-ai\frontend
npm run dev
```

### Terminal 2 - Backend
```cmd
cd C:\Users\Kabir Wasnik\.gemini\antigravity\scratch\careprep-ai\backend
npm run dev
```

### Terminal 3 - AI Service
```cmd
cd C:\Users\Kabir Wasnik\.gemini\antigravity\scratch\careprep-ai\ai-service
python main.py
```

### Open the App
Go to: **http://localhost:5173** in your browser!

---

## 🛑 Troubleshooting

| Problem | Solution |
|---------|----------|
| "npm is not recognized" | Install Node.js from https://nodejs.org |
| "python is not recognized" | Install Python from https://python.org |
| "Firebase error" | Check your .env credentials |
| "OpenRouter error" | Check API key at openrouter.ai/keys |
| "Firestore permission denied" | Enable Firestore in test mode |

---

**Good luck! 🚀**
