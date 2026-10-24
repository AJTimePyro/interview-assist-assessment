export type MicDevice = {
  deviceId: string;
  label: string;
};

export type PanelState =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "answering"
  | "error";

export type TranscriptLine = {
  id: string;
  text: string;
};

export type QuestionType = "technical" | "behavioral" | "hr" | "smalltalk";

export type DetectedQuestion = {
  text: string;
  type: QuestionType;
};

export type AnswerMetrics = {
  classifyMs: number;
  firstTokenMs: number | null;
  totalMs: number;
};

export type AssistantStatus = "listening" | "thinking" | "answering";
