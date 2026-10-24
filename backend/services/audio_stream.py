import asyncio
import json
import logging
import uuid

from fastapi import WebSocket, WebSocketDisconnect
from vosk import KaldiRecognizer

logger = logging.getLogger(__name__)


class AudioStreamSession:
    def __init__(self, websocket: WebSocket, stream: KaldiRecognizer) -> None:
        self.session_id = uuid.uuid4().hex[:8]
        self._websocket = websocket
        self._stream = stream
        self._disconnected = False
        self._last_partial = ""
        self.chunk_count = 0
        self.total_bytes = 0

    async def handle_control_message(self, payload: dict[str, object]) -> bool:
        """Handle a control frame. Returns True when the session should close."""
        if payload.get("type") == "stop":
            logger.info("Audio stop requested [%s]", self.session_id)
            return True

        logger.info("Audio session started [%s]", self.session_id)
        return False

    async def handle_audio_chunk(self, chunk: bytes) -> None:
        self.chunk_count += 1
        self.total_bytes += len(chunk)

        result_type, text = await asyncio.to_thread(self._process_chunk, chunk)

        if not text:
            return

        if result_type == "final":
            await self._emit_final(text)

            # TODO: Call your question detector here

        elif text != self._last_partial:
            # Only send & debug-log when the interim phrase actually changes
            self._last_partial = text
            logger.debug("Transcript (Interim) [%s]: %s", self.session_id, text)
            await self._send_json({"type": "interim", "text": text})

    async def finalize(self) -> None:
        text = await asyncio.to_thread(self._final_result)

        if text:
            await self._emit_final(text)

        logger.info(
            "Audio session ended [%s]: chunks=%d bytes=%d",
            self.session_id,
            self.chunk_count,
            self.total_bytes,
        )

    def _process_chunk(self, chunk: bytes) -> tuple[str, str]:
        if self._stream.AcceptWaveform(chunk):
            result = json.loads(self._stream.Result())
            return "final", str(result.get("text", "")).strip()

        result = json.loads(self._stream.PartialResult())
        return "interim", str(result.get("partial", "")).strip()

    def _final_result(self) -> str:
        result = json.loads(self._stream.FinalResult())
        return str(result.get("text", "")).strip()

    async def _emit_final(self, text: str) -> None:
        self._last_partial = ""
        logger.info("Transcript (Final) [%s]: %s", self.session_id, text)
        await self._send_json({"type": "final", "text": text})

    async def _send_json(self, payload: dict[str, object]) -> None:
        if self._disconnected:
            return

        try:
            await self._websocket.send_json(payload)
        except (WebSocketDisconnect, RuntimeError):
            self._disconnected = True
            logger.info("Client gone, dropping message [%s]", self.session_id)

    def log_disconnect(self) -> None:
        self._disconnected = True
        logger.info("Audio client disconnected [%s]", self.session_id)
