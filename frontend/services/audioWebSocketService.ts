type AudioWebSocketCallbacks = {
  onOpen: () => void;
  onError: () => void;
  onClose: () => void;
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
    socket.onerror = callbacks.onError;
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
      audio_format: "webm",
      codec: "opus",
      timeslice_ms: 250,
    });
  }

  sendChunk(chunk: Blob): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(chunk);
    }
  }

  sendStop(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.send({ type: "stop" });
    }
  }

  close(): void {
    this.intentionallyClosed = true;
    this.socket?.close();
    this.socket = null;
  }

  private send(message: Record<string, string | number>): void {
    this.socket?.send(JSON.stringify(message));
  }
}
