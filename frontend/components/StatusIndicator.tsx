"use client";

type StatusIndicatorProps = {
  state: "idle" | "listening" | "processing";
};

export function StatusIndicator({ state }: StatusIndicatorProps) {
  return (
    <section className="p-6 border-t border-gray-200">
      <div className="flex items-center gap-3">
        <div
          className={
            "w-2 h-2 rounded-full " +
            (state === "listening" ? "bg-red-600" : "bg-gray-400") +
            " animate-bounce"
          }
        />
        <span className="text-sm text-gray-600">
          {state === "listening"
            ? "Listening..."
            : state === "processing"
              ? "Processing..."
              : "Idle"}
        </span>
      </div>
    </section>
  );
}
