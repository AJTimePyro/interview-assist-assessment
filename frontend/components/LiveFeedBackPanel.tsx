"use client";

import type {
  AnswerMetrics,
  DetectedQuestion,
  QuestionType,
  TranscriptLine,
} from "@/app/type";

type LiveFeedBackPanelProps = {
  transcript: TranscriptLine[];
  interim: string;
  question: DetectedQuestion | null;
  answer: string;
  answerMetrics: AnswerMetrics | null;
  answerError: string;
};

const questionTypeClasses: Record<QuestionType, string> = {
  technical: "bg-blue-100 text-blue-700",
  behavioral: "bg-purple-100 text-purple-700",
  hr: "bg-gray-200 text-gray-700",
  smalltalk: "bg-gray-100 text-gray-500",
};

export function LiveFeedBackPanel({
  transcript,
  interim,
  question,
  answer,
  answerMetrics,
  answerError,
}: LiveFeedBackPanelProps) {
  return (
    <section className="flex w-full justify-around">
      <div>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
          Live Transcript
        </h2>
        <div className="h-64 overflow-y-auto space-y-2">
          {transcript.length === 0 && (
            <p className="text-xs text-gray-400">
              No transcript yet. Click "Start Listening".
            </p>
          )}
          {transcript.map((line) => (
            <p key={line.id} className="text-sm text-gray-700">
              {line.text}
            </p>
          ))}
          {interim && <p className="text-sm text-gray-400 italic">{interim}</p>}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
          Detected Question
        </h2>
        <div>
          {question ? (
            <>
              <span
                className={`inline-block rounded px-2 py-0.5 text-xs font-medium uppercase ${questionTypeClasses[question.type]}`}
              >
                {question.type}
              </span>
              <p className="mt-2 text-sm text-gray-800 wrap-break-word">
                {question.text}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400">No question detected yet.</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
          Suggested Answer
        </h2>
        <div>
          {answerError ? (
            <p className="text-sm text-red-600">{answerError}</p>
          ) : answer ? (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {answer}
            </p>
          ) : (
            <p className="text-sm text-gray-400">Answer will appear here.</p>
          )}
          {answerMetrics && (
            <p className="mt-3 text-xs text-gray-400">
              classify {answerMetrics.classifyMs} ms · first token{" "}
              {answerMetrics.firstTokenMs ?? "—"} ms · total{" "}
              {answerMetrics.totalMs} ms
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
