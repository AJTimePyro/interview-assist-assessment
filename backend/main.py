import json
import logging

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from services.audio_stream import AudioStreamSession

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Interview Assistant API")


@app.get("/")
async def root():
    return {"message": "Interview Assistant API"}


@app.websocket("/ws/audio")
async def audio_stream(websocket: WebSocket):
    await websocket.accept()
    session = AudioStreamSession()

    try:
        while True:
            message = await websocket.receive()
            if message["type"] == "websocket.disconnect":
                break

            if message.get("text") is not None:
                try:
                    payload = json.loads(message["text"])
                except json.JSONDecodeError:
                    logger.warning("Received invalid audio control message")
                    continue
                if session.handle_control_message(payload):
                    break
                continue

            chunk = message.get("bytes")
            if chunk is not None:
                session.handle_audio_chunk(chunk)
    except WebSocketDisconnect:
        session.log_disconnect()
    finally:
        session.log_end()
