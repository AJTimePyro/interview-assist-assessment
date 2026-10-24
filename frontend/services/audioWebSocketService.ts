type AudioWebSocketCallbacks = {
  onOpen: () => void;
  onError: () => void;
  onClose: () => void;
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
};

type ServerMessage = {
  type: string;
  text?: string;
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
      if (message.type === "final" && message.text) {
        callbacks.onFinal(message.text);
      } else if (message.type === "interim" && message.text) {
        callbacks.onInterim(message.text);
      }
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

  sendStart(): void {
    this.send({
      type: "start",
      audio_format: "pcm_s16le",
      sample_rate: 16000,
      channels: 1,
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

  private send(message: Record<string, string | number>): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }
}
