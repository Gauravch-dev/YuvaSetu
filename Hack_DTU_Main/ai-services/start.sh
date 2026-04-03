#!/bin/bash
# Start all AI services
# Run from: cd ai-services && bash start.sh

echo "=== Starting AI Services ==="

echo ""
echo "1. Checking Ollama..."
if command -v ollama &> /dev/null; then
    echo "   Ollama found. Ensure it's running: ollama serve"
    echo "   Models: $(ollama list 2>/dev/null | tail -n +2 | awk '{print $1}' | tr '\n' ', ')"
    echo "   URL: http://localhost:11434"
else
    echo "   Ollama not found! Install from https://ollama.ai"
fi

echo ""
echo "2. Starting Edge TTS Server (port 5100)..."
python tts_server.py &
TTS_PID=$!
echo "   TTS PID: $TTS_PID"

echo ""
echo "3. Starting Whisper STT Server (port 5200)..."
python stt_server.py &
STT_PID=$!
echo "   STT PID: $STT_PID"

echo ""
echo "=== All Services Started ==="
echo "  Ollama LLM:    http://localhost:11434"
echo "  Edge TTS:      http://localhost:5100"
echo "  Whisper STT:   http://localhost:5200"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for background processes
wait
