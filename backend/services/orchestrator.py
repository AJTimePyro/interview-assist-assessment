import asyncio
import logging
import time
from collections.abc import Awaitable, Callable
from difflib import SequenceMatcher

from services.assistant import InterviewContext, detect_question, stream_answer

logger = logging.getLogger(__name__)

DEBOUNCE_SECONDS = 0.3
DETECT_TIMEOUT_SECONDS = 8.0
ANSWER_TIMEOUT_SECONDS = 30.0
ERROR_THROTTLE_SECONDS = 30.0
TAIL_CHARS = 300
TAIL_UTTERANCES = 4
SIMILARITY_THRESHOLD = 0.85

Emit = Callable[[dict[str, object]], Awaitable[None]]


class AssistantOrchestrator:
    def __init__(self, emit: Emit, context: InterviewContext) -> None:
        self._emit = emit
        self._context = context
        self._tail: list[str] = []
        self._debounce: asyncio.TimerHandle | None = None
        self._answer_task: asyncio.Task[None] | None = None
        self._prewarm_task: asyncio.Task[None] | None = None
        self._last_question = ""
        self._speech_end_at: float
        self._last_error_at = float("-inf")

    def start(self) -> None:
        """Load the model and cache the context prompt before the first question."""
        self._prewarm_task = asyncio.create_task(self._prewarm())

    def on_final(self, text: str, speech_end_at: float | None = None) -> None:
        """Called from the audio loop; schedules detection and returns immediately."""
        self._tail.append(text)
        del self._tail[:-TAIL_UTTERANCES]
        self._speech_end_at = speech_end_at or time.perf_counter()

        if self._prewarm_task is not None and not self._prewarm_task.done():
            self._prewarm_task.cancel()

        if self._debounce is not None:
            self._debounce.cancel()
        self._debounce = asyncio.get_running_loop().call_later(
            DEBOUNCE_SECONDS, self._on_debounce
        )

    async def close(self) -> None:
        if self._debounce is not None:
            self._debounce.cancel()
            self._debounce = None

        for task in (self._answer_task, self._prewarm_task):
            if task is not None and not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

    def _on_debounce(self) -> None:
        self._debounce = None
        if self._answer_task is not None and not self._answer_task.done():
            self._answer_task.cancel()
        self._answer_task = asyncio.create_task(self._handle_tail())

    async def _handle_tail(self) -> None:
        transcript = " ".join(self._tail)[-TAIL_CHARS:]
        speech_end_at = self._speech_end_at
        started = time.perf_counter()
        endpoint_ms = max(0, round((started - speech_end_at) * 1000))
        await self._emit({"type": "status", "state": "thinking"})

        try:
            async with asyncio.timeout(DETECT_TIMEOUT_SECONDS):
                decision = await detect_question(transcript)
        except Exception:  # noqa: BLE001
            await self._fail("Assistant unavailable — still listening.")
            return

        classify_ms = round((time.perf_counter() - started) * 1000)

        if decision is None or self._is_duplicate(decision.question):
            await self._emit({"type": "status", "state": "listening"})
            return

        self._last_question = decision.question
        await self._emit(
            {
                "type": "question",
                "text": decision.question,
                "question_type": decision.type,
            }
        )
        await self._emit({"type": "status", "state": "answering"})
        completed = await self._stream_answer(
            decision.question, speech_end_at, endpoint_ms, classify_ms
        )
        if not completed and self._last_question == decision.question:
            self._last_question = ""

    async def _stream_answer(
        self,
        question: str,
        speech_end_at: float,
        endpoint_ms: int,
        classify_ms: int,
    ) -> bool:
        started = time.perf_counter()
        first_token_ms: int | None = None
        e2e_ms: int | None = None

        try:
            async with asyncio.timeout(ANSWER_TIMEOUT_SECONDS):
                async for delta in stream_answer(self._context, question):
                    if first_token_ms is None:
                        now = time.perf_counter()
                        first_token_ms = round((now - started) * 1000)
                        e2e_ms = round((now - speech_end_at) * 1000)
                    await self._emit({"type": "answer_delta", "text": delta})
        except Exception:  # noqa: BLE001
            await self._fail("Answer generation failed — still listening.")
            return False

        await self._emit(
            {
                "type": "answer_done",
                "endpoint_ms": endpoint_ms,
                "classify_ms": classify_ms,
                "first_token_ms": first_token_ms,
                "e2e_ms": e2e_ms,
                "total_ms": round((time.perf_counter() - started) * 1000),
            }
        )
        await self._emit({"type": "status", "state": "listening"})
        return True

    async def _fail(self, message: str) -> None:
        """Report a failure without spamming the socket on every utterance."""
        now = time.perf_counter()
        if now - self._last_error_at >= ERROR_THROTTLE_SECONDS:
            self._last_error_at = now
            logger.error(message)
            await self._emit({"type": "error", "message": message})
        await self._emit({"type": "status", "state": "listening"})

    async def _prewarm(self) -> None:
        try:
            async for _ in stream_answer(self._context, "warmup"):
                break
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.warning("Model warmup failed", exc_info=True)

    def _is_duplicate(self, question: str) -> bool:
        if not self._last_question:
            return False
        ratio = SequenceMatcher(
            None, question.lower(), self._last_question.lower()
        ).ratio()
        return ratio >= SIMILARITY_THRESHOLD
