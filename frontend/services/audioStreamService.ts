const TARGET_SAMPLE_RATE = 16000;
const WORKLET_URL = "/worklets/pcm16-recorder.js";
const WORKLET_NAME = "pcm16-recorder";

type AudioCaptureCallbacks = {
  onChunk: (chunk: ArrayBuffer) => void;
  onListening: () => void;
  onStopped: () => void;
  onError: (message: string) => void;
};

export class AudioStreamService {
  private context: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: AudioWorkletNode | null = null;
  private sink: GainNode | null = null;
  private callbacks: AudioCaptureCallbacks | null = null;
  private suppressStopCallback = false;

  async start(
    deviceId: string | undefined,
    callbacks: AudioCaptureCallbacks,
  ): Promise<void> {
    this.suppressStopCallback = false;
    this.callbacks = callbacks;

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

      const context = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE });
      this.context = context;

      if (!context.audioWorklet) {
        throw new Error("AudioWorklet is not supported by this browser.");
      }
      await context.audioWorklet.addModule(WORKLET_URL);

      const source = context.createMediaStreamSource(this.stream);
      const processor = new AudioWorkletNode(context, WORKLET_NAME, {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        channelCount: 1,
      });
      processor.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        callbacks.onChunk(event.data);
      };

      // A muted sink keeps the graph pulling audio without echoing the mic.
      const sink = context.createGain();
      sink.gain.value = 0;
      source.connect(processor);
      processor.connect(sink);
      sink.connect(context.destination);

      this.source = source;
      this.processor = processor;
      this.sink = sink;

      await context.resume();
      callbacks.onListening();
    } catch (error) {
      this.cleanup();
      throw this.getStartError(error);
    }
  }

  stop(): void {
    const callbacks = this.callbacks;
    this.cleanup();
    if (!this.suppressStopCallback) {
      callbacks?.onStopped();
    }
  }

  dispose(): void {
    this.suppressStopCallback = true;
    this.cleanup();
  }

  private cleanup(): void {
    if (this.processor) {
      this.processor.port.onmessage = null;
      this.processor.port.close();
      this.processor.disconnect();
      this.processor = null;
    }
    this.source?.disconnect();
    this.source = null;
    this.sink?.disconnect();
    this.sink = null;

    if (this.context && this.context.state !== "closed") {
      void this.context.close();
    }
    this.context = null;

    this.stream?.getTracks().forEach((track) => {
      track.stop();
    });
    this.stream = null;
    this.callbacks = null;
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
