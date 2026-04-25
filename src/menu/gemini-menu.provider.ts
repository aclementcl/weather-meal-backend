import {
  BadGatewayException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SuggestedMenuDto } from './dto/menu-suggest-response.dto';
import { GeminiGenerateContentResponse, MenuAiInput } from './menu.types';

@Injectable()
export class GeminiMenuProvider {
  private readonly logger = new Logger(GeminiMenuProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async suggestMenu(input: MenuAiInput): Promise<SuggestedMenuDto> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is not configured');
      throw new InternalServerErrorException('GEMINI_API_KEY is not configured');
    }

    const baseUrl =
      this.configService.get<string>('GEMINI_BASE_URL') ??
      'https://generativelanguage.googleapis.com/v1beta';
    const model =
      this.configService.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash';

    try {
      this.logger.log(
        `Requesting menu suggestion from Gemini for ${input.location} on ${input.date}`,
      );

      const response = await fetch(`${baseUrl}/models/${model}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: this.buildPrompt(input),
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 300,
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                breakfast: {
                  type: 'STRING',
                },
                lunch: {
                  type: 'STRING',
                },
                dinner: {
                  type: 'STRING',
                },
              },
              required: ['breakfast', 'lunch', 'dinner'],
              propertyOrdering: ['breakfast', 'lunch', 'dinner'],
            },
          },
        }),
      });

      if (!response.ok) {
        this.logger.error(
          `Gemini provider request failed with status ${response.status}`,
        );
        throw new BadGatewayException('AI provider request failed');
      }

      const payload = (await response.json()) as GeminiGenerateContentResponse;
      const outputText = payload.candidates?.[0]?.content?.parts?.find(
        (part) => typeof part.text === 'string',
      )?.text;

      if (!outputText) {
        this.logger.error('Gemini provider returned no output text');
        throw new BadGatewayException('AI provider returned no output text');
      }

      const parsedMenu = this.parseSuggestedMenu(outputText);

      if (!this.isSuggestedMenu(parsedMenu)) {
        this.logger.error('Gemini provider returned an invalid menu shape');
        throw new BadGatewayException('AI provider returned an invalid menu');
      }

      return {
        breakfast: parsedMenu.breakfast.trim(),
        lunch: parsedMenu.lunch.trim(),
        dinner: parsedMenu.dinner.trim(),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Unexpected error while requesting Gemini menu suggestion: ${this.getErrorMessage(error)}`,
      );
      throw new BadGatewayException('AI provider request failed');
    }
  }

  private buildPrompt(input: MenuAiInput): string {
    const preferences =
      input.preferences.length > 0
        ? input.preferences.join(', ')
        : 'no explicit preferences';

    return [
      'You are a nutrition assistant for a Chilean meal-planning app.',
      'Return only valid JSON with the keys breakfast, lunch, and dinner.',
      'Do not wrap the JSON in markdown fences or add commentary before or after it.',
      'Keep meal names concise and practical for an everyday home-cooked menu.',
      'Respect all dietary preferences and avoid mentioning the constraints explicitly.',
      `Location: ${input.location}.`,
      `Date: ${input.date}.`,
      `Weather summary: ${input.weatherSummary}.`,
      `Temperature min: ${input.temperatureMin} C.`,
      `Temperature max: ${input.temperatureMax} C.`,
      `Preferences: ${preferences}.`,
      'Prefer seasonally sensible dishes for mild, cold, or warm weather.',
      'Write the meal names in Spanish.',
    ].join(' ');
  }

  private isSuggestedMenu(value: unknown): value is SuggestedMenuDto {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const menu = value as Record<string, unknown>;

    return ['breakfast', 'lunch', 'dinner'].every(
      (field) =>
        typeof menu[field] === 'string' && (menu[field] as string).trim().length,
    );
  }

  private parseSuggestedMenu(outputText: string): unknown {
    const parseCandidates = this.buildJsonCandidates(outputText);

    for (const candidate of parseCandidates) {
      try {
        return JSON.parse(candidate);
      } catch {
        continue;
      }
    }

    this.logger.error(
      `Gemini provider returned invalid JSON. Raw output: ${this.truncateForLog(outputText)}`,
    );
    throw new BadGatewayException('AI provider returned invalid JSON');
  }

  private buildJsonCandidates(outputText: string): string[] {
    const trimmed = outputText.trim();
    const markdownFenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    const withoutMarkdownFence = markdownFenceMatch?.[1]?.trim();
    const firstJsonObject = this.extractFirstJsonObject(trimmed);
    const firstJsonObjectWithoutFence = withoutMarkdownFence
      ? this.extractFirstJsonObject(withoutMarkdownFence)
      : undefined;

    return [
      trimmed,
      withoutMarkdownFence,
      firstJsonObject,
      firstJsonObjectWithoutFence,
    ].filter((candidate): candidate is string => Boolean(candidate));
  }

  private extractFirstJsonObject(value: string): string | undefined {
    const start = value.indexOf('{');

    if (start === -1) {
      return undefined;
    }

    let depth = 0;
    let inString = false;
    let isEscaped = false;

    for (let index = start; index < value.length; index += 1) {
      const currentChar = value[index];

      if (isEscaped) {
        isEscaped = false;
        continue;
      }

      if (currentChar === '\\') {
        isEscaped = true;
        continue;
      }

      if (currentChar === '"') {
        inString = !inString;
        continue;
      }

      if (inString) {
        continue;
      }

      if (currentChar === '{') {
        depth += 1;
      }

      if (currentChar === '}') {
        depth -= 1;

        if (depth === 0) {
          return value.slice(start, index + 1);
        }
      }
    }

    return undefined;
  }

  private truncateForLog(value: string): string {
    const normalizedValue = value.replace(/\s+/g, ' ').trim();

    return normalizedValue.length > 300
      ? `${normalizedValue.slice(0, 300)}...`
      : normalizedValue;
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
