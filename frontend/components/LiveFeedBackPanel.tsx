"use client";

import { useEffect, useRef } from "react";
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
  const transcriptBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (transcript.length > 0 || interim) {
      transcriptBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcript, interim]);

  return (
    <section className="w-full flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Live Transcript Section */}
      <div className="flex flex-col min-h-45 md:min-h-0 min-w-0 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 shrink-0">
          Live Transcript
        </h2>
        <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1">
          {transcript.length === 0 && !interim && (
            <p className="text-xs text-gray-400">
              No transcript yet. Click &quot;Start Listening&quot;.
            </p>
          )}
          {transcript.map((line) => (
            <p
              key={line.id}
              className="text-xs sm:text-sm text-gray-700 wrap-break-word"
            >
              {line.text}
            </p>
          ))}
          {interim && (
            <p className="text-xs sm:text-sm text-gray-400 italic wrap-break-word">
              {interim}
            </p>
          )}
          <div ref={transcriptBottomRef} />
        </div>
      </div>

      {/* Detected Question Section */}
      <div className="flex flex-col min-h-45 md:min-h-0 min-w-0 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 shrink-0">
          Detected Question
        </h2>
        <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1">
          {question ? (
            <>
              <div>
                <span
                  className={`inline-block rounded px-2 py-0.5 text-xs font-medium uppercase ${questionTypeClasses[question.type]}`}
                >
                  {question.type}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-800 wrap-break-word">
                {question.text}
              </p>
            </>
          ) : (
            <p className="text-xs text-gray-400">No question detected yet.</p>
          )}
        </div>
      </div>

      {/* Suggested Answer Section */}
      <div className="flex flex-col min-h-45 md:min-h-0 min-w-0 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 shrink-0">
          Suggested Answer
        </h2>
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col justify-between pr-1">
          <div className="space-y-1.5">
            {answerError ? (
              <p className="text-xs sm:text-sm text-red-600 wrap-break-word">
                {answerError}
              </p>
            ) : answer ? (
              <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap wrap-break-word">
                {answer}
              </p>
            ) : (
              <p className="text-xs text-gray-400">Answer will appear here.</p>
            )}
          </div>
          {answerMetrics && (
            <div className="mt-2 pt-1.5 border-t border-gray-100 text-[10px] text-gray-400 shrink-0">
              <p>
                question → answer{" "}
                <span className="font-medium text-gray-600">
                  {answerMetrics.e2eMs ?? "—"} ms
                </span>
              </p>
              <p className="mt-0.5">
                endpoint {answerMetrics.endpointMs} ms · classify{" "}
                {answerMetrics.classifyMs} ms · first token{" "}
                {answerMetrics.firstTokenMs ?? "—"} ms · total{" "}
                {answerMetrics.totalMs} ms
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
