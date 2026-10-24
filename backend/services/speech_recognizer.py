import logging

import vosk

# Disable verbose Kaldi engine logs
vosk.SetLogLevel(-1)

logger = logging.getLogger(__name__)

TARGET_SAMPLE_RATE = 16000
MODEL_NAME = "vosk-model-small-en-in-0.4"

logger.info("Loading Vosk model...")
MODEL = vosk.Model(model_name=MODEL_NAME)
logger.info("Vosk model ready")


def create_stream() -> vosk.KaldiRecognizer:
    rec = vosk.KaldiRecognizer(MODEL, float(TARGET_SAMPLE_RATE))
    rec.SetPartialWords(True)
    return rec
