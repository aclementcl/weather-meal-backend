import {
  BadGatewayException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SuggestedMenuDto } from './dto/menu-suggest-response.dto';
import {
  MenuAiInput,
  OpenAiResponsesApiResponse,
} from './menu.types';

@Injectable()
export class OpenAiMenuProvider {
  private readonly logger = new Logger(OpenAiMenuProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async suggestMenu(input: MenuAiInput): Promise<SuggestedMenuDto> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      this.logger.error('OPENAI_API_KEY is not configured');
      throw new InternalServerErrorException(
        'OPENAI_API_KEY is not configured',
      );
    }

    const baseUrl =
      this.configService.get<string>('OPENAI_BASE_URL') ??
      'https://api.openai.com/v1';
    const model =
      this.configService.get<string>('OPENAI_MODEL') ?? 'gpt-4.1-mini';

    try {
      this.logger.log(
        `Requesting menu suggestion from OpenAI for ${input.location} on ${input.date}`,
      );

      const response = await fetch(`${baseUrl}/responses`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: this.buildPrompt(input),
          max_output_tokens: 300,
          text: {
            format: {
              type: 'json_schema',
              name: 'menu_suggestion',
              strict: true,
              schema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  breakfast: {
                    type: 'string',
                  },
                  lunch: {
                    type: 'string',
                  },
                  dinner: {
                    type: 'string',
                  },
                },
                required: ['breakfast', 'lunch', 'dinner'],
              },
            },
          },
        }),
      });

      if (!response.ok) {
        this.logger.error(`AI provider request failed with status ${response.status}`);
        throw new BadGatewayException('AI provider request failed');
      }

      const payload = (await response.json()) as OpenAiResponsesApiResponse;
      const outputText = payload.output
        ?.flatMap((item) => item.content ?? [])
        .find((content) => content.type === 'output_text')?.text;

      if (!outputText) {
        this.logger.error('AI provider returned no output text');
        throw new BadGatewayException('AI provider returned no output text');
      }

      let parsedMenu: unknown;

      try {
        parsedMenu = JSON.parse(outputText);
      } catch {
        this.logger.error('AI provider returned invalid JSON');
        throw new BadGatewayException('AI provider returned invalid JSON');
      }

      if (!this.isSuggestedMenu(parsedMenu)) {
        this.logger.error('AI provider returned an invalid menu shape');
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
        `Unexpected error while requesting AI menu suggestion: ${this.getErrorMessage(error)}`,
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

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
