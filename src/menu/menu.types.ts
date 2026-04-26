export interface MenuAiInput {
  location: string;
  date: string;
  preferences: string[];
  weatherSummary: string;
  temperatureMin: number;
  temperatureMax: number;
}

export interface GeminiGenerateContentResponse {
  promptFeedback?: {
    blockReason?: string;
    blockReasonMessage?: string;
  };
  candidates?: Array<{
    finishReason?: string;
    finishMessage?: string;
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}
