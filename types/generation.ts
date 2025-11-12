export type GenerationResult = {
  id: string;
  capturedImageUrl: string;
  transcribedText: string;
  generatedImages: {
    url: string;
    content_type: string;
  }[];
  timestamp: number;
  status: "processing" | "transcribing" | "generating" | "completed" | "error";
  error?: string;
};

export type GenerationStatus =
  | "idle"
  | "capturing"
  | "transcribing"
  | "generating"
  | "completed"
  | "error";
