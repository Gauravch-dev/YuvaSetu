# YuvaSetu -- Developer Setup Guide

Complete setup instructions to get all YuvaSetu services running locally.

---

## Prerequisites

| Requirement | Version | Link |
|---|---|---|
| Node.js | 18+ | https://nodejs.org/ |
| Python | 3.10+ | https://python.org/ |
| Ollama | Latest | https://ollama.ai/ |
| Git | Latest | https://git-scm.com/ |
| MongoDB Atlas Account | -- | https://www.mongodb.com/atlas |
| Firebase Project | -- | https://console.firebase.google.com/ |

---

## Step 1: Clone and Install

```bash
git clone <YOUR_REPOSITORY_URL>
cd CareerBridge/Hack_DTU_Main
```

---

## Step 2: Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory. Copy from `.env.example` and fill in all values:

```env
# Server
PORT=5000

# Database
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/yuvasetu

# Firebase (paste the entire JSON service account as a single line)
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}

# Google / Gemini
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_API_KEY=your_google_api_key

# OpenRouter (optional, for fallback LLM)
OPENROUTER_API_KEY=your_openrouter_api_key

# OpenAI (optional, for fallback LLM)
OPENAI_API_KEY=your_openai_api_key

# Email (Nodemailer)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# ElevenLabs (optional, premium TTS)
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=your_voice_id
```

Start the backend:

```bash
npm run dev
```

The backend will start on **http://localhost:5000**.

---

## Step 3: Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Backend API URL
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

The frontend will start on **http://localhost:8080**.

---

## Step 4: AI Services Setup

Open a new terminal. Install Python dependencies:

```bash
pip install flask flask-cors edge-tts faster-whisper beautifulsoup4 python-dotenv pymongo
```

### Start the TTS Server (Text-to-Speech)

```bash
cd ai-services
python tts_server.py
```

The TTS server will start on **http://localhost:5100**.

### Start the STT Server (Speech-to-Text)

Open another terminal:

```bash
cd ai-services
python stt_server.py
```

The STT server will start on **http://localhost:5200**.

**Note**: The Whisper model (~150MB) downloads automatically on the first request. The first transcription will be slower than usual.

---

## Step 5: Ollama Setup

1. Install Ollama from [ollama.ai](https://ollama.ai/).

2. Pull the required models:

```bash
ollama pull gemma3:4b
ollama pull mistral
ollama pull llama3
```

3. Ollama runs automatically as a background service on **http://localhost:11434** after installation. Verify it is running:

```bash
curl http://localhost:11434/api/tags
```

---

## Step 6: Run Mock Test Scraper (Optional)

This step populates the database with company-specific mock test questions.

```bash
cd backend
python scripts/scraper.py
```

**Requires**: Ollama must be running with `mistral` or `llama3` models pulled. The scraper uses BeautifulSoup4 to scrape question patterns and Ollama to generate MCQs.

---

## Step 7: Verify All Services

Run through this checklist to confirm everything is working:

```bash
# Backend health
curl http://localhost:5000/api/health

# Frontend (should return HTML)
curl -s http://localhost:8080 | head -5

# TTS server
curl -X POST http://localhost:5100/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello from YuvaSetu", "voice": "en-IN-NeerjaNeural"}'

# STT server health
curl http://localhost:5200/health

# Ollama
curl http://localhost:11434/api/tags
```

All 5 checks should return valid responses.

---

## Quick Start (All-in-One)

If you have everything installed and configured, open 5 terminals and run:

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: TTS Server
cd ai-services && python tts_server.py

# Terminal 4: STT Server
cd ai-services && python stt_server.py

# Terminal 5: Ollama (if not running as a service)
ollama serve
```

---

## Troubleshooting

### Ollama Not Running

**Symptom**: Mock interviews fail, LLM responses return errors.

**Fix**: Check if Ollama is running with `curl http://localhost:11434/api/tags`. If not, start it with `ollama serve`. Ensure you have pulled the required models (`ollama list` to check).

---

### STT Returns Empty Transcription

**Symptom**: The AI interview does not detect any speech; transcription comes back blank.

**Fix**:
1. Ensure your microphone is working and the browser has granted mic permissions.
2. Check that the STT server is running on port 5200.
3. Verify faster-whisper installed correctly: `python -c "from faster_whisper import WhisperModel; print('OK')"`.
4. The first request triggers a ~150MB model download -- check the STT server terminal for download progress.

---

### CORS Errors

**Symptom**: Browser console shows "Access to XMLHttpRequest has been blocked by CORS policy".

**Fix**:
1. Ensure the backend has CORS configured for `http://localhost:8080`.
2. Check that `VITE_API_URL` in the frontend `.env` matches the actual backend URL (http://localhost:5000).
3. Restart the backend after any `.env` changes.

---

### Firebase Auth Token Expired

**Symptom**: API calls return 401 Unauthorized even though you are logged in.

**Fix**:
1. Sign out and sign back in to refresh the token.
2. Check that the `FIREBASE_SERVICE_ACCOUNT_JSON` in the backend `.env` matches your Firebase project.
3. Ensure the Firebase project has the correct authorized domains (localhost).

---

### Camo Virtual Mic / Audio Issues

**Symptom**: The AI interview starts but no audio is captured, or the wrong microphone is selected.

**Fix**:
1. If you have Camo or other virtual camera/mic software installed, it may intercept the default audio device.
2. Open your browser's site settings and explicitly select the correct microphone.
3. On Windows, check Settings > System > Sound > Input and set the correct default device.
4. Close any other applications that may be using the microphone exclusively.

---

### MongoDB Connection Fails

**Symptom**: Backend crashes on startup with a MongoDB connection error.

**Fix**:
1. Verify your `MONGODB_URI` in `backend/.env` is correct and includes the database name.
2. Ensure your IP address is whitelisted in MongoDB Atlas (Network Access > Add Current IP).
3. Check that the database user credentials are correct.

---

### Port Already in Use

**Symptom**: "Error: listen EADDRINUSE :::5000" (or any port).

**Fix**:
```bash
# Find the process using the port (example: 5000)
# On Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# On Mac/Linux:
lsof -i :5000
kill -9 <PID>
```

---

## Service Ports Reference

| Service | Port | Command |
|---|---|---|
| Frontend (React/Vite) | 8080 | `cd frontend && npm run dev` |
| Backend (Express) | 5000 | `cd backend && npm run dev` |
| Edge TTS Server | 5100 | `cd ai-services && python tts_server.py` |
| Whisper STT Server | 5200 | `cd ai-services && python stt_server.py` |
| Ollama LLM | 11434 | `ollama serve` |
