"use client";

type LiveFeedBackPanelProps = {
  transcript: string[];
  detectedQuestion: string;
  suggestedAnswer: string;
};

export function LiveFeedBackPanel({
  transcript,
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
            <p key={line} className="text-sm text-gray-700">
              {line}
            </p>
          ))}
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
