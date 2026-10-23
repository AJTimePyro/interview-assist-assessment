const AUDIO_TIMESLICE_MS = 250;
const AUDIO_MIME_TYPE = "audio/webm;codecs=opus";

type AudioCaptureCallbacks = {
  onChunk: (chunk: Blob) => void;
  onListening: () => void;
  onStopped: () => void;
  onError: (message: string) => void;
};

export class AudioStreamService {
  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private suppressStopCallback = false;

  async start(
    deviceId: string | undefined,
    callbacks: AudioCaptureCallbacks,
  ): Promise<void> {
    this.suppressStopCallback = false;

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone capture is not supported by this browser.");
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio:
          deviceId && deviceId !== "default"
            ? { deviceId: { exact: deviceId } }
            : true,
      });
      const mimeType = MediaRecorder.isTypeSupported(AUDIO_MIME_TYPE)
        ? AUDIO_MIME_TYPE
        : "audio/webm";
      const recorder = new MediaRecorder(this.stream, { mimeType });
      this.recorder = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          callbacks.onChunk(event.data);
        }
      };
      recorder.onerror = () =>
        callbacks.onError("Microphone recording failed.");
      recorder.onstop = () => {
        this.cleanup();
        if (!this.suppressStopCallback) {
          callbacks.onStopped();
        }
      };
      recorder.start(AUDIO_TIMESLICE_MS);
      callbacks.onListening();
    } catch (error) {
      this.cleanup();
      throw this.getStartError(error);
    }
  }

  stop(): void {
    if (this.recorder && this.recorder.state !== "inactive") {
      this.recorder.stop();
    } else {
      this.cleanup();
    }
  }

  dispose(): void {
    this.suppressStopCallback = true;
    if (this.recorder && this.recorder.state !== "inactive") {
      this.recorder.stop();
    }
    this.cleanup();
  }

  private cleanup(): void {
    this.recorder = null;
    this.stream?.getTracks().forEach((track) => {
      track.stop();
    });
    this.stream = null;
  }

  private getStartError(error: unknown): Error {
    if (error instanceof DOMException && error.name === "NotAllowedError") {
      return new Error("Microphone permission was denied.");
    }
    return error instanceof Error
      ? error
      : new Error("Unable to start microphone capture.");
  }
}
