"use client";

import { useEffect, useRef, useState } from "react";
import { Controls } from "@/components/Controls";
import { LiveFeedBackPanel } from "@/components/LiveFeedBackPanel";
import { StatusIndicator } from "@/components/StatusIndicator";
import { AudioStreamService } from "@/services/audioStreamService";
import { AudioWebSocketService } from "@/services/audioWebSocketService";
import type { MicDevice, PanelState } from "./type";

const EMPTY_TRANSCRIPT: string[] = [];

export default function Home() {
  const [resume, setResume] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [selectedMic, setSelectedMic] = useState<MicDevice | null>(null);
  const [state, setState] = useState<PanelState>("idle");
  const transcript = EMPTY_TRANSCRIPT;
  const detectedQuestion = "";
  const suggestedAnswer = "";
  const [errorMessage, setErrorMessage] = useState("");
  const audioServiceRef = useRef<AudioStreamService | null>(null);
  const socketServiceRef = useRef<AudioWebSocketService | null>(null);

  if (!audioServiceRef.current) {
    audioServiceRef.current = new AudioStreamService();
  }
  if (!socketServiceRef.current) {
    socketServiceRef.current = new AudioWebSocketService();
  }

  const audioService = audioServiceRef.current;
  const socketService = socketServiceRef.current;

  const setError = (message: string) => {
    audioService.dispose();
    socketService.close();
    setErrorMessage(message);
    setState("error");
  };

  const startAudio = () => {
    socketService.sendStart();
    void audioService
      .start(selectedMic?.deviceId, {
        onChunk: (chunk) => socketService.sendChunk(chunk),
        onListening: () => setState("listening"),
        onStopped: () => {
          socketService.sendStop();
          socketService.close();
          setState("idle");
        },
        onError: (message) => setError(message),
      })
      .catch((error: unknown) => {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to start microphone capture.",
        );
      });
  };

  const startListening = () => {
    setErrorMessage("");
    setState("connecting");

    try {
      socketService.connect({
        onOpen: startAudio,
        onError: () => setError("Unable to connect to the audio server."),
        onClose: () => setError("The audio server disconnected."),
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to start microphone capture.",
      );
    }
  };

  const toggleListening = () => {
    if (state === "listening") {
      audioService.stop();
    } else if (state === "idle" || state === "error") {
      startListening();
    }
  };

  useEffect(() => {
    return () => {
      audioService.dispose();
      socketService.close();
    };
  }, [audioService, socketService]);

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

      <StatusIndicator state={state} errorMessage={errorMessage} />
      <LiveFeedBackPanel
        transcript={transcript}
        detectedQuestion={detectedQuestion}
        suggestedAnswer={suggestedAnswer}
      />
    </main>
  );
}
