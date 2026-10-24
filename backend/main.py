import json
import logging

from fastapi import FastAPI, WebSocket

from services.audio_stream import AudioStreamSession
from services.speech_recognizer import create_stream

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Interview Assistant API")


@app.get("/")
async def root():
    return {"message": "Interview Assistant API"}


@app.websocket("/ws/audio")
async def audio_stream(websocket: WebSocket):
    await websocket.accept()
    session = AudioStreamSession(websocket, create_stream())

    try:
        while True:
            message = await websocket.receive()
            if message["type"] == "websocket.disconnect":
                session.log_disconnect()
                break

            if message.get("text") is not None:
                if await session.handle_control_message(json.loads(message["text"])):
                    break
            elif message.get("bytes") is not None:
                await session.handle_audio_chunk(message["bytes"])
    finally:
        await session.finalize()
