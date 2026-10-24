from collections.abc import AsyncGenerator
from dataclasses import dataclass
from typing import Literal, cast

from pydantic import BaseModel, Field

from core.llm import answer_llm, classifier_llm

MAX_CONTEXT_CHARS = 4000
MIN_QUESTION_WORDS = 3


class QuestionDecision(BaseModel):
    """Classifier output for the tail of the live transcript."""

    is_question: bool = Field(
        description="True only when the interviewer asks the candidate something"
    )
    question: str = Field(
        description="Self-contained question with punctuation; empty when not a question"
    )
    type: Literal["technical", "behavioral", "hr", "smalltalk"] = Field(
        description="Question category, or smalltalk when it is not an interview question"
    )


DETECTOR_PROMPT = """You classify the tail of a live job-interview transcript.
The text comes from speech recognition: lowercase, no punctuation, possible recognition errors.

Decide whether the interviewer's latest utterance asks the candidate a question or requests \
information from them.
- Imperative requests count: "tell me about", "walk me through", "describe", "explain".
- Statements are NOT questions, even when they invite elaboration: "so you were at fintech co \
for three years", "you worked on payments", "our stack is python".
- Statements, small talk, logistics, acknowledgements and the interviewer describing the \
company do NOT count.
- Ignore greetings, thanks, filler and back-channel noise.
- If the utterance contains several questions, keep the last complete one.
- Rewrite the question as one clean, self-contained sentence with punctuation.

Classify the question as technical, behavioral, hr, or smalltalk."""

ANSWER_PROMPT = """You help a candidate answer interview questions live.
The resume and job description below describe the candidate; use them for claims about the
candidate's background.

RESUME:
{resume}

JOB DESCRIPTION:
{job_description}

Rules:
- Answer the question that was asked, not the question the resume suggests.
- How-would-you-design/build/scale questions: give your approach first, then key components
  and one trade-off. Do not turn it into a summary of your resume.
- Background and behavioral questions: answer with specific resume evidence.
- Output 3-5 bullet points, one per line, each line starting with "- ".
- Each bullet is one short sentence of at most 15 words.
- No intro sentence, no closing sentence, no headings, no paragraph prose.
- Hard limit: 80 words total. Fewer, sharper bullets beat more.
- Keep numbers, durations and job titles exactly as written in the resume; never round them.
- Never invent employers, titles, dates or metrics that are not in the resume.
- If the resume lacks something, answer from general experience without fabricating."""


@dataclass
class InterviewContext:
    resume: str = ""
    job_description: str = ""


classifier = classifier_llm.with_structured_output(
    QuestionDecision, method="json_schema"
)


def build_answer_messages(
    context: InterviewContext,
    question: str,
) -> list[tuple[str, str]]:
    system = ANSWER_PROMPT.format(
        resume=_truncate(context.resume) or "(not provided)",
        job_description=_truncate(context.job_description) or "(not provided)",
    )
    return [
        ("system", system),
        ("human", f"Interviewer question: {question}"),
    ]


async def detect_question(transcript_tail: str) -> QuestionDecision | None:
    """Return the question the interviewer just asked, or None for anything else."""
    messages = [
        ("system", DETECTOR_PROMPT),
        ("human", f"Transcript:\n{transcript_tail}"),
    ]

    decision = cast(QuestionDecision, await classifier.ainvoke(messages))

    if not decision.is_question or decision.type == "smalltalk":
        return None
    if len(decision.question.split()) < MIN_QUESTION_WORDS:
        return None
    return decision


async def stream_answer(
    context: InterviewContext,
    question: str,
) -> AsyncGenerator[str, None]:
    """Yield answer text deltas as the model produces them."""
    messages = build_answer_messages(context, question)
    async for chunk in answer_llm.astream(messages):
        if isinstance(chunk.content, str) and chunk.content:
            yield chunk.content


def _truncate(text: str) -> str:
    return text.strip()[:MAX_CONTEXT_CHARS]
