# Daily Commands — Start & Stop Everything

---

## Start All Services (5 terminals)

Open 5 separate terminals and run one command in each:

### Terminal 1 — Edge TTS (Text-to-Speech)
```bash
cd CareerBridge/Hack_DTU_Main/ai-services
python tts_server.py
```
> Runs on **port 5100**

### Terminal 2 — Whisper STT (Speech-to-Text)
```bash
cd CareerBridge/Hack_DTU_Main/ai-services
python stt_server.py
```
> Runs on **port 5200** — first request downloads Whisper model (~150MB)

### Terminal 3 — Express Backend
```bash
cd CareerBridge/Hack_DTU_Main/backend
npm run dev
```
> Runs on **port 5000**

### Terminal 4 — React Frontend
```bash
cd CareerBridge/Hack_DTU_Main/frontend
npm run dev
```
> Runs on **port 8080**

### Terminal 5 — Ollama (if not already running)
```bash
ollama serve
```
> Runs on **port 11434** — usually auto-starts on Windows

---

## Verify Everything Is Running

```bash
curl http://localhost:5100/health
curl http://localhost:5200/health
curl http://localhost:5000/
curl http://localhost:11434/api/tags
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080
```

Expected output:
```
{"service":"edge-tts","status":"healthy"}
{"service":"whisper-stt","status":"healthy"}
API is running...
{"models":[{"name":"gemma3:4b",...},{"name":"mistral",...},{"name":"llama3",...}]}
200
```

---

## Stop All Services

Press **Ctrl+C** in each terminal. Or kill everything at once:

```bash
# Kill Python servers
taskkill /F /FI "WINDOWTITLE eq python*" 2>nul

# Kill Node backend
taskkill /F /FI "IMAGENAME eq node.exe" 2>nul

# Kill Vite frontend
taskkill /F /FI "IMAGENAME eq node.exe" 2>nul
```

### Linux/Mac alternative:
```bash
# Kill by port
kill $(lsof -t -i:5100) 2>/dev/null
kill $(lsof -t -i:5200) 2>/dev/null
kill $(lsof -t -i:5000) 2>/dev/null
kill $(lsof -t -i:8080) 2>/dev/null
```

---

## Run Mock Test Scraper (Optional)

```bash
cd CareerBridge/Hack_DTU_Main/backend
python scripts/scraper.py
```
> Requires Ollama running with mistral + llama3

---

## Ollama Model Management

```bash
# List installed models
ollama list

# Pull models (first time only)
ollama pull gemma3:4b    # For AI interviews (~3.3GB)
ollama pull mistral      # For mock test scraper (~4.4GB)
ollama pull llama3       # For mock test scraper (~4.7GB)

# Test a model
ollama run gemma3:4b "Say hello"

# Remove a model
ollama rm <model-name>
```

---

## Quick Reference

| Service | Port | Start Command | Health Check |
|---------|------|--------------|-------------|
| Edge TTS | 5100 | `python ai-services/tts_server.py` | `curl localhost:5100/health` |
| Whisper STT | 5200 | `python ai-services/stt_server.py` | `curl localhost:5200/health` |
| Backend | 5000 | `cd backend && npm run dev` | `curl localhost:5000/` |
| Frontend | 8080 | `cd frontend && npm run dev` | `curl localhost:8080` |
| Ollama | 11434 | `ollama serve` | `curl localhost:11434/api/tags` |

---

## Open in Browser

```
http://localhost:8080
```
