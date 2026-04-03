"""
Edge TTS Server - Text-to-Speech service using Microsoft Edge TTS
Runs on port 5100
"""

import asyncio
import edge_tts
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import io
import logging

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEFAULT_VOICE = "en-IN-NeerjaExpressiveNeural"

VOICE_MAP = {
    "en": "en-IN-NeerjaExpressiveNeural",
    "hi": "hi-IN-SwaraNeural",
    "mr": "mr-IN-AarohiNeural",
}


async def synthesize_speech(text: str, voice: str = DEFAULT_VOICE) -> bytes:
    """Synthesize speech from text using Edge TTS."""
    communicate = edge_tts.Communicate(text, voice)
    audio_data = io.BytesIO()

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_data.write(chunk["data"])

    return audio_data.getvalue()


@app.route("/synthesize", methods=["POST"])
def synthesize():
    """POST /synthesize - Convert text to speech."""
    try:
        data = request.get_json()
        if not data or "text" not in data:
            return jsonify({"error": "Missing 'text' field"}), 400

        text = data["text"]
        voice = data.get("voice", DEFAULT_VOICE)

        if not text.strip():
            return jsonify({"error": "Empty text"}), 400

        logger.info(f"Synthesizing: '{text[:50]}...' with voice {voice}")

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        audio_bytes = loop.run_until_complete(synthesize_speech(text, voice))
        loop.close()

        if not audio_bytes:
            return jsonify({"error": "No audio generated"}), 500

        logger.info(f"Generated {len(audio_bytes)} bytes of audio")

        return Response(
            audio_bytes,
            mimetype="audio/mpeg",
            headers={"Content-Length": str(len(audio_bytes))}
        )

    except Exception as e:
        logger.error(f"TTS error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "service": "edge-tts"})


@app.route("/voices", methods=["GET"])
def list_voices():
    """List available voices."""
    return jsonify({"voices": VOICE_MAP, "default": DEFAULT_VOICE})


if __name__ == "__main__":
    logger.info("Starting Edge TTS Server on port 5100")
    app.run(host="0.0.0.0", port=5100, debug=False)
