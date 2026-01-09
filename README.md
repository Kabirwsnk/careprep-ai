# CarePrep AI

> **Pre-Visit & Post-Visit Medical Intelligence Assistant**

A full-stack web application that helps patients prepare for doctor visits and understand their medical documents using AI-powered assistance.

![CarePrep AI](https://via.placeholder.com/800x400/0077b6/ffffff?text=CarePrep+AI+-+Medical+Intelligence+Assistant)

## ⚠️ Important Medical Disclaimer

**This application is for EDUCATIONAL and ORGANIZATIONAL purposes ONLY.**

- This is NOT a medical diagnostic tool
- This does NOT provide medical advice, diagnosis, or treatment
- ALWAYS consult a qualified healthcare professional for medical decisions
- In case of emergency, call emergency services immediately

---

## 🌟 Features

### Pre-Visit Preparation
- 📋 **Symptom Logging** - Track daily symptoms with severity levels and notes
- 📊 **Timeline Visualization** - View symptom patterns over time with charts
- 🤖 **AI Summary Generation** - Get doctor-friendly summaries of your symptoms
- 💬 **Pre-Visit Chat** - Ask AI about what to discuss with your doctor

### Post-Visit Understanding
- 📄 **Document Upload** - Upload prescriptions, visit notes, and test results
- 🔍 **OCR Processing** - Extract text from images and PDFs automatically
- 💊 **Care Summary** - View simplified explanations of medical documents
- 📅 **Follow-Up Checklist** - Track medications and follow-up actions
- 💬 **Post-Visit Chat** - Ask AI to explain medical terms in plain language

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React.js, Vite, Tailwind CSS, Chart.js |
| **Backend** | Node.js, Express.js, Firebase Admin SDK |
| **AI Service** | Python, Flask, OpenRouter API (Mistral 7B) |
| **Database** | Firebase Firestore |
| **Authentication** | Firebase Authentication (Email/Password) |

---

## 🚀 Complete Local Setup Guide

### Prerequisites

Before starting, make sure you have installed:

| Software | Version | Download Link |
|----------|---------|---------------|
| Node.js | 18+ | https://nodejs.org |
| Python | 3.10+ | https://python.org |
| Git | Any | https://git-scm.com |

**Optional (for PDF/Image OCR):**
- Tesseract OCR: https://github.com/UB-Mannheim/tesseract/wiki
- Poppler: https://github.com/osber/poppler-windows/releases

---

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd careprep-ai

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install

# Install Python dependencies
cd ../ai-service
pip install -r requirements.txt
```

---

### Step 2: Set Up Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** → Name it (e.g., `careprep-ai`)
3. Disable Google Analytics (optional) → Click **"Create project"**

#### Enable Authentication:
1. Click **Build → Authentication → Get Started**
2. Click **Email/Password** → Enable the first toggle → **Save**

#### Enable Firestore Database:
1. Click **Build → Firestore Database → Create database**
2. Select **"Start in test mode"** (we'll add security rules later)
3. Choose a location → Click **"Enable"**

#### Get Web SDK Config (for Frontend):
1. Go to **Project Overview** (home icon)
2. Click the **web icon** (`</>`) to add a web app
3. Enter nickname: `careprep-frontend` → Click **"Register app"**
4. Copy the config values (apiKey, authDomain, projectId, etc.)

#### Get Service Account Key (for Backend):
1. Click ⚙️ (gear icon) → **Project settings**
2. Click **"Service accounts"** tab
3. Click **"Generate new private key"** → Download the JSON file

---

### Step 3: Get OpenRouter API Key (FREE!)

1. Go to https://openrouter.ai/
2. Sign up with Google or GitHub (no payment required!)
3. Go to https://openrouter.ai/keys
4. Click **"Create Key"** → Copy the key (starts with `sk-or-...`)

> **Note:** The `mistralai/mistral-7b-instruct` model is FREE to use!

---

### Step 4: Configure Environment Variables

Create `.env` files in the following locations:

#### Frontend (`frontend/.env`):
```env
VITE_FIREBASE_API_KEY=AIzaSy...your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123def456
VITE_API_URL=http://localhost:3001
```

#### Backend (`backend/.env`):
```env
PORT=3001
FRONTEND_URL=http://localhost:5173

# Firebase Admin SDK (from downloaded JSON file)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...your_key...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# AI Service URL
AI_SERVICE_URL=http://localhost:5000
```

> **Important:** Copy the `private_key` from your downloaded JSON file. Keep the quotes and `\n` characters!

#### AI Service (`ai-service/.env`):
```env
OPENROUTER_API_KEY=sk-or-v1-your_openrouter_key_here
OPENROUTER_MODEL=mistralai/mistral-7b-instruct
PORT=5000
FLASK_DEBUG=False
```

---

### Step 5: Deploy Firebase Security Rules

Update your Firestore security rules in Firebase Console:

1. Go to **Firestore Database → Rules**
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper: Check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper: Check if user owns the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Symptoms - users can only access their own
    match /symptoms/{symptomId} {
      allow read, write: if isAuthenticated() && 
        (resource == null || resource.data.userId == request.auth.uid);
      allow create: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid;
    }

    // Documents - users can only access their own
    match /documents/{documentId} {
      allow read, write: if isAuthenticated() && 
        (resource == null || resource.data.userId == request.auth.uid);
      allow create: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid;
    }

    // Visit Summaries - users can only access their own
    match /visitSummaries/{summaryId} {
      allow read, write: if isAuthenticated() && 
        (resource == null || resource.data.userId == request.auth.uid);
      allow create: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid;
    }

    // Chat History - users can only access their own
    match /chatHistory/{chatId} {
      allow read, write: if isAuthenticated() && 
        (resource == null || resource.data.userId == request.auth.uid);
      allow create: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid;
    }
  }
}
```

3. Click **"Publish"**

---

### Step 6: Start the Application

Open **3 separate terminal windows** and run:

#### Terminal 1 - Frontend:
```bash
cd frontend
npm run dev
```
→ Runs at http://localhost:5173

#### Terminal 2 - Backend:
```bash
cd backend
npm run dev
```
→ Runs at http://localhost:3001

#### Terminal 3 - AI Service:
```bash
cd ai-service
python main.py
```
→ Runs at http://localhost:5000

---

### Step 7: Test the Application

Open http://localhost:5173 in your browser.

#### Test Authentication:
1. Click **"Sign Up"**
2. Enter email and password (min 6 characters)
3. Click **"Create Account"**
4. You should be redirected to the dashboard

#### Test Symptom Logging:
1. Go to **"Pre-Visit"** section
2. Click **"Add Symptom"**
3. Fill in: Symptom name, Severity (1-10), Date, Notes
4. Click **"Save"**
5. Symptom should appear in the timeline

#### Test Document Upload:
1. Go to **"Post-Visit"** section
2. Click **"Upload Document"**
3. Select a PDF or image file (max 10MB)
4. Wait for processing
5. View the generated summary

#### Test AI Chatbot:
1. Go to **"Chat"** section
2. Select mode: **Pre-Visit** or **Post-Visit**
3. Type a question like: "What should I ask my doctor about headaches?"
4. Wait for AI response (may take a few seconds on first request)

---

## 🛠️ Troubleshooting

### Common Issues and Solutions

| Problem | Solution |
|---------|----------|
| **"Firebase error"** | Check your `.env` credentials match the Firebase console |
| **"AI service unavailable"** | Make sure Terminal 3 (Python AI service) is running |
| **"Network error"** | Ensure all 3 services are running on correct ports |
| **"Permission denied" in Firestore** | Deploy the security rules from Step 5 |
| **AI response is slow (first time)** | OpenRouter has cold start delay (~5-10 seconds). Wait and retry. |
| **"Invalid API key"** | Verify your OpenRouter key at https://openrouter.ai/keys |
| **OCR not working** | Install Tesseract OCR and add to system PATH |
| **PDF processing fails** | Install Poppler and add to system PATH |

### First-Time Startup Notes

1. **AI Service Cold Start:** The first AI request may take 5-10 seconds as OpenRouter initializes the model. Subsequent requests are faster.

2. **Firestore Indexes:** If you see "requires an index" errors, click the link in the error message to create the required composite index automatically.

3. **CORS Issues:** If you see CORS errors, ensure the `FRONTEND_URL` in `backend/.env` matches exactly (including `http://` and port).

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/verify` | Verify Firebase token |

### Symptoms
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/symptoms/add` | Add new symptom |
| GET | `/symptoms/list` | Get user's symptoms |
| DELETE | `/symptoms/:id` | Delete a symptom |
| POST | `/symptoms/summary` | Generate AI summary |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/documents/upload` | Upload document |
| GET | `/documents/list` | Get user's documents |
| GET | `/documents/:id` | Get specific document |
| DELETE | `/documents/:id` | Delete document |

### AI Processing
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/summarize` | Process and summarize document |
| POST | `/ai/chat` | Chat with AI assistant |
| GET | `/ai/summary` | Get latest visit summary |

### Visit Summaries
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/visit-summaries/list` | Get all summaries |
| GET | `/visit-summaries/latest` | Get latest summary |
| GET | `/visit-summaries/:id` | Get specific summary |

---

## 🎥 Hackathon Demo Guide

### Demo Flow (5 minutes)

1. **Registration & Login** (30 sec)
   - Create new account
   - Show dashboard

2. **Symptom Logging** (1 min)
   - Add 3 symptoms with different severities
   - Show timeline chart
   - Generate AI summary

3. **Document Upload** (1.5 min)
   - Upload a sample prescription/visit note
   - Show processing indicator
   - Display care summary with medications

4. **AI Chat** (1.5 min)
   - Switch between Pre-Visit and Post-Visit modes
   - Ask "What should I tell my doctor?"
   - Ask "Explain my medication"
   - Point out disclaimers

5. **Wrap-up** (30 sec)
   - Highlight educational purpose
   - Show mobile responsiveness

### Sample Data for Demo

**Symptoms to Log:**
1. Headache - Severity 7/10 - "Started this morning, worse with bright lights"
2. Fatigue - Severity 5/10 - "Feeling tired after lunch"
3. Nausea - Severity 3/10 - "Mild queasiness occasionally"

**Sample Questions for Chat:**
- "What questions should I ask my doctor about my headaches?"
- "Can you explain what ibuprofen does?"
- "When should I take my medication?"

---

## 🔒 Security Features

- ✅ Firebase Authentication for user management
- ✅ Token-based API authentication (JWT)
- ✅ Per-user Firestore security rules
- ✅ Users can only access their own data
- ✅ File size limits (10MB max)
- ✅ Medical disclaimers on all AI responses

### Firestore Security Rules Summary

| Collection | Access Rule |
|------------|-------------|
| `symptoms` | User can only read/write own symptoms |
| `documents` | User can only read/write own documents |
| `visitSummaries` | User can only read/write own summaries |
| `chatHistory` | User can only read/write own chat history |

---

## 📁 Project Structure

```
careprep-ai/
├── frontend/           # React + Vite frontend
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Page components
│   │   ├── hooks/      # React hooks (AuthContext)
│   │   ├── services/   # API service
│   │   └── config/     # Firebase config
│   ├── .env            # Frontend environment variables
│   └── package.json
│
├── backend/            # Node.js + Express API
│   ├── src/
│   │   ├── routes/     # API route handlers
│   │   ├── middleware/ # Auth middleware
│   │   ├── config/     # Firebase Admin config
│   │   └── server.js   # Express server
│   ├── .env            # Backend environment variables
│   └── package.json
│
├── ai-service/         # Python Flask AI service
│   ├── app/
│   │   ├── processors/ # Document, OCR, AI processors
│   │   ├── prompts/    # Prompt templates
│   │   └── routes/     # Flask route handlers
│   ├── main.py
│   ├── .env            # AI service environment variables
│   └── requirements.txt
│
└── firebase/           # Firebase configuration
    └── firestore.rules # Security rules
```

---

## 📄 License

MIT License - See LICENSE file for details.

---

## ⚠️ Legal Notice

This software is provided for educational purposes only. It is not intended to replace professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.

---

Built with ❤️ for patients everywhere
#   c a r e p r e p - a i - f r o n t e n d  
 