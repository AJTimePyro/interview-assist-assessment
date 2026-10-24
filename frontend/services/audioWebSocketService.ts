import type {
  AnswerMetrics,
  AssistantStatus,
  DetectedQuestion,
  QuestionType,
} from "@/app/type";

type AudioWebSocketCallbacks = {
  onOpen: () => void;
  onError: () => void;
  onClose: () => void;
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onQuestion: (question: DetectedQuestion) => void;
  onAnswerDelta: (text: string) => void;
  onAnswerDone: (metrics: AnswerMetrics) => void;
  onAssistantError: (message: string) => void;
  onStatus: (status: AssistantStatus) => void;
};

type ServerMessage = {
  type: string;
  text?: string;
  message?: string;
  question_type?: QuestionType;
  classify_ms?: number;
  endpoint_ms?: number;
  first_token_ms?: number | null;
  e2e_ms?: number | null;
  total_ms?: number;
  state?: AssistantStatus;
};

export class AudioWebSocketService {
  private socket: WebSocket | null = null;
  private intentionallyClosed = false;

  connect(callbacks: AudioWebSocketCallbacks): void {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsUrl) {
      throw new Error("NEXT_PUBLIC_WS_URL is not configured.");
    }

    const socket = new WebSocket(wsUrl);
    this.intentionallyClosed = false;
    socket.binaryType = "arraybuffer";
    socket.onopen = callbacks.onOpen;
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data as string) as ServerMessage;
      this.dispatch(message, callbacks);
    };
    socket.onerror = () => {
      if (!this.intentionallyClosed) {
        callbacks.onError();
      }
    };
    socket.onclose = () => {
      if (!this.intentionallyClosed) {
        callbacks.onClose();
      }
    };
    this.socket = socket;
  }

  sendStart(resume: string, jobDescription: string): void {
    this.send({
      type: "start",
      audio_format: "pcm_s16le",
      sample_rate: 16000,
      channels: 1,
      resume,
      job_description: jobDescription,
    });
  }

  sendChunk(chunk: ArrayBuffer): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(chunk);
    }
  }

  stop(): void {
    this.intentionallyClosed = true;
    this.send({ type: "stop" });
  }

  close(): void {
    this.intentionallyClosed = true;
    this.socket?.close();
    this.socket = null;
  }

  private dispatch(
    message: ServerMessage,
    callbacks: AudioWebSocketCallbacks,
  ): void {
    switch (message.type) {
      case "interim":
        if (message.text) callbacks.onInterim(message.text);
        break;
      case "final":
        if (message.text) callbacks.onFinal(message.text);
        break;
      case "question":
        if (message.text) {
          callbacks.onQuestion({
            text: message.text,
            type: message.question_type ?? "behavioral",
          });
        }
        break;
      case "answer_delta":
        if (message.text) callbacks.onAnswerDelta(message.text);
        break;
      case "answer_done":
        callbacks.onAnswerDone({
          endpointMs: message.endpoint_ms ?? 0,
          classifyMs: message.classify_ms ?? 0,
          firstTokenMs: message.first_token_ms ?? null,
          e2eMs: message.e2e_ms ?? null,
          totalMs: message.total_ms ?? 0,
        });
        break;
      case "status":
        if (message.state) callbacks.onStatus(message.state);
        break;
      case "error":
        callbacks.onAssistantError(
          message.message ?? "Answer generation failed.",
        );
        break;
    }
  }

  private send(message: Record<string, string | number>): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }
}
