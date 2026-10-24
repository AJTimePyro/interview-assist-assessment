"use client";

import type { TranscriptLine } from "@/app/type";

type LiveFeedBackPanelProps = {
  transcript: TranscriptLine[];
  interim: string;
  detectedQuestion: string;
  suggestedAnswer: string;
};

export function LiveFeedBackPanel({
  transcript,
  interim,
  detectedQuestion,
  suggestedAnswer,
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
          {detectedQuestion ? (
            <p className="text-sm text-gray-800 break-all">
              {detectedQuestion}
            </p>
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
          {suggestedAnswer ? (
            <p className="text-sm text-gray-700 break-all">{suggestedAnswer}</p>
          ) : (
            <p className="text-sm text-gray-400">Answer will appear here.</p>
          )}
        </div>
      </div>
    </section>
  );
}
