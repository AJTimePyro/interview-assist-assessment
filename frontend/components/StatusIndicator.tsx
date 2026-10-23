"use client";

import type { PanelState } from "@/app/type";

type StatusIndicatorProps = {
  state: PanelState;
  errorMessage?: string;
};

const indicatorColors: Record<PanelState, string> = {
  idle: "bg-gray-400",
  connecting: "bg-yellow-500",
  listening: "bg-red-600",
  error: "bg-red-600",
};

const statusLabels: Record<Exclude<PanelState, "error">, string> = {
  idle: "Idle",
  connecting: "Connecting...",
  listening: "Listening...",
};

export function StatusIndicator({ state, errorMessage }: StatusIndicatorProps) {
  const statusLabel =
    state === "error"
      ? errorMessage || "Connection error"
      : statusLabels[state];

  const is_bounce = state === "idle" || state === "error";

  return (
    <section className="p-6 border-t border-gray-200">
      <div className="flex items-center gap-3">
        <div
          className={`w-2 h-2 rounded-full ${indicatorColors[state]} ${
            is_bounce ? "animate-bounce" : ""
          }`}
        />
        <span className="text-sm text-gray-600">{statusLabel}</span>
      </div>
    </section>
  );
}
