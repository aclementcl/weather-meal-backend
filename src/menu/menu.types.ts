export interface MenuAiInput {
  location: string;
  date: string;
  preferences: string[];
  weatherSummary: string;
  temperatureMin: number;
  temperatureMax: number;
}

export interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}
