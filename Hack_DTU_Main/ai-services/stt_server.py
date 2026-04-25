"""
Whisper STT Server - Speech-to-Text service using faster-whisper
Runs on port 5200
"""

import os
import re
import tempfile
import subprocess
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_model = None

# Whisper often hallucinates these patterns on silence or noise.
# Reject transcriptions that are *only* these phrases.
HALLUCINATION_PATTERNS = [
    r"^\s*$",
    r"^[\s.…,!?\-]+$",
    r"(?i)^(thank you|thanks)[\s.!]*$",
    r"(?i)^(you|you\.)[\s.]*$",
    r"(?i)^subtitle",
    r"(?i)^music[\s.]*$",
    r"(?i)^applause[\s.]*$",
    r"(?i)^uh+[\s.]*$",
    r"(?i)^(the|a|an|is|it|this|that)[\s.]*$",
    r"(?i)^bye[\s.!]*$",
    # Arabic/foreign script hallucinations from noise
    r"^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s.,:;!?]+$",
    # CJK hallucinations
    r"^[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\s.,:;!?]+$",
]


def is_hallucination(text: str) -> bool:
    """Check if the transcription is a common Whisper hallucination."""
    stripped = text.strip()
    if len(stripped) < 2:
        return True
    for pattern in HALLUCINATION_PATTERNS:
        if re.match(pattern, stripped):
            return True
    return False


def get_model():
    global _model
    if _model is None:
        from faster_whisper import WhisperModel
        logger.info("Loading Whisper model (medium)...")
        _model = WhisperModel("medium", device="cpu", compute_type="int8")
        logger.info("Whisper model loaded successfully")
    return _model


def convert_to_wav(input_path: str) -> str:
    """Convert any audio format to 16kHz mono WAV using ffmpeg."""
    output_path = input_path.rsplit(".", 1)[0] + "_converted.wav"
    try:
        result = subprocess.run(
            [
                "ffmpeg", "-y",
                "-i", input_path,
                "-ar", "16000",
                "-ac", "1",
                "-f", "wav",
                output_path,
            ],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode != 0:
            logger.error(f"ffmpeg error: {result.stderr[:500]}")
            return input_path  # Fallback to original
        logger.info(f"Converted to WAV: {os.path.getsize(output_path)} bytes")
        return output_path
    except Exception as e:
        logger.error(f"ffmpeg conversion failed: {e}")
        return input_path


VALID_LANGUAGES = ("en", "hi", "mr", "ta", "te", "bn", "gu", "kn", "ml", "pa")

INITIAL_PROMPTS = {
    "en": "This is a job interview conversation in English about technology, software engineering, and career experience.",
    "hi": "यह एक job interview है Hindi में। Technology, software engineering, aur career experience ke baare mein baat ho rahi hai.",
    "mr": "हे एक job interview आहे Marathi मध्ये। Technology, software engineering, आणि career experience बद्दल बोलत आहोत.",
}


def _detect_audio_ext(audio_file) -> str:
    """Determine the audio file extension from content type or filename."""
    content_type = audio_file.content_type or ""
    filename = audio_file.filename or "audio.wav"
    if "webm" in content_type or filename.endswith(".webm"):
        return ".webm"
    if "ogg" in content_type:
        return ".ogg"
    return ".wav"


def _save_and_convert(audio_file, ext: str) -> tuple:
    """Save uploaded audio to a temp file and convert to WAV if needed.
    Returns (transcribe_path, tmp_path, converted_path)."""
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        audio_file.save(tmp.name)
        tmp_path = tmp.name

    logger.info(f"Received audio: {os.path.getsize(tmp_path)} bytes, format: {ext}")

    converted_path = None
    if ext != ".wav":
        wav_path = convert_to_wav(tmp_path)
        if wav_path != tmp_path:
            converted_path = wav_path
        return (converted_path or tmp_path, tmp_path, converted_path)

    return (tmp_path, tmp_path, None)


def _run_whisper(transcribe_path: str, language: str, initial_prompt: str):
    """Run Whisper model and return filtered text + info."""
    model = get_model()
    segments, info = model.transcribe(
        transcribe_path,
        beam_size=5,
        language=language,
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 500, "speech_pad_ms": 300},
        initial_prompt=initial_prompt,
        condition_on_previous_text=False,
        no_speech_threshold=0.6,
        log_prob_threshold=-1.0,
    )

    text_parts = []
    for segment in segments:
        if segment.no_speech_prob > 0.7:
            logger.info(f"Skipping low-confidence segment: '{segment.text.strip()}' (no_speech_prob={segment.no_speech_prob:.2f})")
            continue
        text_parts.append(segment.text.strip())

    full_text = " ".join(text_parts)

    if is_hallucination(full_text):
        logger.info(f"Filtered hallucination: '{full_text[:100]}'")
        full_text = ""

    return full_text, info


@app.route("/transcribe", methods=["POST"])
def transcribe():
    try:
        if "audio" not in request.files:
            return jsonify({"error": "No audio file provided"}), 400

        audio_file = request.files["audio"]
        ext = _detect_audio_ext(audio_file)
        transcribe_path, tmp_path, converted_path = _save_and_convert(audio_file, ext)

        try:
            language = request.form.get("language", "en")
            if language not in VALID_LANGUAGES:
                language = "en"

            initial_prompt = request.form.get(
                "initial_prompt",
                INITIAL_PROMPTS.get(language, INITIAL_PROMPTS["en"]),
            )

            full_text, info = _run_whisper(transcribe_path, language, initial_prompt)

            confidence = round(info.language_probability, 2) if info.language_probability else None
            logger.info(f"Transcription: '{full_text[:100]}' (confidence={confidence}, lang={info.language})")

            lang_mismatch = (
                info.language is not None
                and info.language != language
                and confidence is not None
                and confidence > 0.5
            )
            if lang_mismatch:
                logger.warning(f"Language mismatch: requested={language}, detected={info.language}")

            return jsonify({
                "text": full_text,
                "confidence": confidence,
                "duration": round(info.duration, 2) if info.duration else None,
                "language": info.language,
                "language_mismatch": lang_mismatch,
            })

        finally:
            os.unlink(tmp_path)
            if converted_path and os.path.exists(converted_path):
                os.unlink(converted_path)

    except Exception as e:
        logger.error(f"STT error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "service": "whisper-stt"})


if __name__ == "__main__":
    logger.info("Starting Whisper STT Server on port 5200")
    app.run(host="0.0.0.0", port=5200, debug=False)
