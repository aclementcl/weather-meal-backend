export interface MenuAiInput {
  location: string;
  date: string;
  preferences: string[];
  weatherSummary: string;
  temperatureMin: number;
  temperatureMax: number;
}

export interface OpenAiResponsesApiResponse {
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
}
