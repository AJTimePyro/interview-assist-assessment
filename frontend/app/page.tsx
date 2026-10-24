"use client";

import { useEffect, useRef, useState } from "react";
import { Controls } from "@/components/Controls";
import { LiveFeedBackPanel } from "@/components/LiveFeedBackPanel";
import { StatusIndicator } from "@/components/StatusIndicator";
import { AudioStreamService } from "@/services/audioStreamService";
import { AudioWebSocketService } from "@/services/audioWebSocketService";
import type {
  AnswerMetrics,
  DetectedQuestion,
  MicDevice,
  PanelState,
  TranscriptLine,
} from "./type";

export default function Home() {
  const [resume, setResume] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [selectedMic, setSelectedMic] = useState<MicDevice | null>(null);
  const [state, setState] = useState<PanelState>("idle");
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [interim, setInterim] = useState("");
  const [question, setQuestion] = useState<DetectedQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [answerMetrics, setAnswerMetrics] = useState<AnswerMetrics | null>(
    null,
  );
  const [answerError, setAnswerError] = useState("");
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
  const contextReady = resume.trim() !== "" && jobDesc.trim() !== "";

  const setError = (message: string) => {
    audioService.dispose();
    socketService.close();
    setInterim("");
    setErrorMessage(message);
    setState("error");
  };

  const appendFinalTranscript = (text: string) => {
    setInterim("");
    setTranscript((previous) => [
      ...previous,
      { id: crypto.randomUUID(), text },
    ]);
  };

  const startAudio = () => {
    socketService.sendStart(resume, jobDesc);
    void audioService
      .start(selectedMic?.deviceId, {
        onChunk: (chunk) => socketService.sendChunk(chunk),
        onListening: () => setState("listening"),
        onStopped: () => {
          setInterim("");
          socketService.stop();
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
    setQuestion(null);
    setAnswer("");
    setAnswerMetrics(null);
    setAnswerError("");
    setState("connecting");

    try {
      socketService.connect({
        onOpen: startAudio,
        onError: () => setError("Unable to connect to the audio server."),
        onClose: () => setError("The audio server disconnected."),
        onInterim: setInterim,
        onFinal: appendFinalTranscript,
        onQuestion: (detected) => {
          setQuestion(detected);
          setAnswer("");
          setAnswerMetrics(null);
          setAnswerError("");
          setState("thinking");
        },
        onAnswerDelta: (text) => {
          setAnswer((previous) => previous + text);
          setState((current) =>
            current === "idle" || current === "error" ? current : "answering",
          );
        },
        onAnswerDone: setAnswerMetrics,
        onAssistantError: setAnswerError,
        onStatus: (status) => {
          setState((current) => {
            if (
              current === "idle" ||
              current === "connecting" ||
              current === "error"
            ) {
              return current;
            }
            return status === "thinking" ? current : status;
          });
        },
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
    if (
      state === "listening" ||
      state === "thinking" ||
      state === "answering"
    ) {
      audioService.stop();
    } else if ((state === "idle" || state === "error") && contextReady) {
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
          canStart={contextReady}
          onToggleListening={toggleListening}
        />
      </div>

      <StatusIndicator state={state} errorMessage={errorMessage} />
      <LiveFeedBackPanel
        transcript={transcript}
        interim={interim}
        question={question}
        answer={answer}
        answerMetrics={answerMetrics}
        answerError={answerError}
      />
    </main>
  );
}
