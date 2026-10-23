"use client";

import { useRef, useState } from "react";
import { Controls } from "@/components/Controls";
import { LiveFeedBackPanel } from "@/components/LiveFeedBackPanel";
import { StatusIndicator } from "@/components/StatusIndicator";
import type { MicDevice, PanelState } from "./type";

export default function Home() {
  const [resume, setResume] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [selectedMic, setSelectedMic] = useState<MicDevice | null>(null);
  const [state, setState] = useState<PanelState>("idle");
  const [transcript, setTranscript] = useState<string[]>([]);
  const [detectedQuestion, setDetectedQuestion] = useState<string>("");
  const [suggestedAnswer, setSuggestedAnswer] = useState<string>("");
  const _micRef = useRef<HTMLSelectElement>(null);

  const toggleListening = () => {
    if (state === "idle") {
      setState("listening");
      // TODO: Integrate WebSocket to FastAPI when ready
      const mockTranscript = [
        "Hello, please state your name and experience.",
        "Tell me about a challenging project you worked on.",
      ];
      setTranscript((prev) => [...prev, ...mockTranscript]);
      setDetectedQuestion("Tell me about a challenging project you worked on.");
      setSuggestedAnswer("In my previous role, I led a team of 4 to...");
      setTimeout(() => setState("processing"), 1500);
      setTimeout(() => setState("idle"), 3000);
    } else {
      setState("idle");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 flex flex-col items-center justify-center">
      <header className="p-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Real-Time Interview Assistant
        </h1>
        <p className="text-sm text-gray-500">UI Foundation</p>
      </header>

      <div className="bg-white rounded-xl shadow-sm max-w-2xl w-full space-y-6">
        <Controls
          resume={resume}
          setResume={setResume}
          jobDesc={jobDesc}
          setJobDesc={setJobDesc}
          selectedMic={selectedMic}
          setSelectedMic={setSelectedMic}
          state={state}
          onToggleListening={toggleListening}
        />
      </div>

      <StatusIndicator state={state} />
      <LiveFeedBackPanel
        transcript={transcript}
        detectedQuestion={detectedQuestion}
        suggestedAnswer={suggestedAnswer}
      />
    </main>
  );
}
