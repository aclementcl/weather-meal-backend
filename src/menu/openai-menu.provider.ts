import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  MenuAiInput,
  OpenAiResponsesApiResponse,
  SuggestedMenu,
} from './menu.types';

@Injectable()
export class OpenAiMenuProvider {
  async suggestMenu(input: MenuAiInput): Promise<SuggestedMenu> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new InternalServerErrorException(
        'OPENAI_API_KEY is not configured',
      );
    }

    const baseUrl = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';
    const response = await fetch(`${baseUrl}/responses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
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
      throw new BadGatewayException('AI provider request failed');
    }

    const payload = (await response.json()) as OpenAiResponsesApiResponse;
    const outputText = payload.output
      ?.flatMap((item) => item.content ?? [])
      .find((content) => content.type === 'output_text')?.text;

    if (!outputText) {
      throw new BadGatewayException('AI provider returned no output text');
    }

    let parsedMenu: unknown;

    try {
      parsedMenu = JSON.parse(outputText);
    } catch {
      throw new BadGatewayException('AI provider returned invalid JSON');
    }

    if (!this.isSuggestedMenu(parsedMenu)) {
      throw new BadGatewayException('AI provider returned an invalid menu');
    }

    return {
      breakfast: parsedMenu.breakfast.trim(),
      lunch: parsedMenu.lunch.trim(),
      dinner: parsedMenu.dinner.trim(),
    };
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

  private isSuggestedMenu(value: unknown): value is SuggestedMenu {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const menu = value as Record<string, unknown>;

    return ['breakfast', 'lunch', 'dinner'].every(
      (field) =>
        typeof menu[field] === 'string' && (menu[field] as string).trim().length,
    );
  }
}
