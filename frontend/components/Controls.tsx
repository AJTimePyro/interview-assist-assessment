"use client";

import type { Dispatch, SetStateAction } from "react";
import type { MicDevice, PanelState } from "@/app/type";

type ControlsProps = {
  resume: string;
  setResume: Dispatch<SetStateAction<string>>;
  jobDesc: string;
  setJobDesc: Dispatch<SetStateAction<string>>;
  selectedMic: MicDevice | null;
  setSelectedMic: Dispatch<SetStateAction<MicDevice | null>>;
  state: PanelState;
  canStart: boolean;
  onToggleListening: () => void;
};

const availableMics: MicDevice[] = [
  { deviceId: "default", label: "Default Microphone" },
];

const buttonLabels: Record<PanelState, string> = {
  idle: "Start Listening",
  connecting: "Connecting...",
  listening: "Stop Listening",
  thinking: "Stop Listening",
  answering: "Stop Listening",
  error: "Start Listening",
};

const buttonStateClasses: Record<PanelState, string> = {
  idle: "bg-blue-600 text-white hover:bg-blue-700",
  connecting: "bg-blue-600 text-white hover:bg-blue-700 cursor-wait opacity-60",
  listening: "bg-red-100 text-red-800",
  thinking: "bg-red-100 text-red-800",
  answering: "bg-red-100 text-red-800",
  error: "bg-blue-600 text-white hover:bg-blue-700",
};

export function Controls({
  resume,
  setResume,
  jobDesc,
  setJobDesc,
  selectedMic,
  setSelectedMic,
  state,
  canStart,
  onToggleListening,
}: ControlsProps) {
  const isStartMode = state === "idle" || state === "error";
  const isDisabled = state === "connecting" || (isStartMode && !canStart);

  return (
    <section className="p-6 space-y-4">
      <div>
        <label
          className="block text-sm font-medium text-gray-700 mb-2"
          htmlFor="resume"
        >
          Resume <span className="text-red-500">*</span>
        </label>
        <textarea
          id="resume"
          rows={4}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Paste your resume here..."
          value={resume}
          onChange={(e) => setResume(e.target.value)}
        />
      </div>

      <div>
        <label
          className="block text-sm font-medium text-gray-700 mb-2"
          htmlFor="job-desc"
        >
          Job Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="job-desc"
          rows={4}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Paste the job description here..."
          value={jobDesc}
          onChange={(e) => setJobDesc(e.target.value)}
        />
      </div>

      <div>
        <label
          className="block text-sm font-medium text-gray-700 mb-2"
          htmlFor="mic"
        >
          Microphone
        </label>
        <select
          id="mic"
          value={selectedMic?.deviceId || ""}
          onChange={(e) =>
            setSelectedMic(
              availableMics.find((m) => m.deviceId === e.target.value) || null,
            )
          }
          className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
        >
          {availableMics.map((mic) => (
            <option key={mic.deviceId} value={mic.deviceId}>
              {mic.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <button
          type="button"
          onClick={onToggleListening}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${buttonStateClasses[state]}`}
          disabled={isDisabled}
        >
          {buttonLabels[state]}
        </button>
        {isStartMode && !canStart && (
          <p className="mt-2 text-xs text-red-600">
            Add your resume and the job description to start listening.
          </p>
        )}
      </div>

      <div>
        <span className="text-xs text-gray-500">
          Selected: {selectedMic?.label || "None"}
        </span>
      </div>
    </section>
  );
}
