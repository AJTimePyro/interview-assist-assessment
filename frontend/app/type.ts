export type MicDevice = {
  deviceId: string;
  label: string;
};

export type PanelState = "idle" | "connecting" | "listening" | "error";

export type TranscriptLine = {
  id: string;
  text: string;
};
