import logging

logger = logging.getLogger(__name__)


class AudioStreamSession:
    def __init__(self) -> None:
        self.chunk_count = 0
        self.total_bytes = 0

    def handle_control_message(self, payload: dict[str, object]) -> bool:
        logger.info("Audio control message: %s", payload)
        return payload.get("type") == "stop"

    def handle_audio_chunk(self, chunk: bytes) -> None:
        self.chunk_count += 1
        self.total_bytes += len(chunk)
        logger.info(
            "Received audio chunk: number=%d bytes=%d total_bytes=%d",
            self.chunk_count,
            len(chunk),
            self.total_bytes,
        )

    def log_disconnect(self) -> None:
        logger.info(
            "Audio client disconnected: chunks=%d total_bytes=%d",
            self.chunk_count,
            self.total_bytes,
        )

    def log_end(self) -> None:
        logger.info(
            "Audio stream ended: chunks=%d total_bytes=%d",
            self.chunk_count,
            self.total_bytes,
        )
