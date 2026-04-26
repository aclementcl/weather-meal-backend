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

      try {
        const outputText = await this.requestMenuSuggestion(
          baseUrl,
          model,
          apiKey,
          input,
        );
        const parsedMenu = this.parseSuggestedMenu(outputText);

        return this.normalizeSuggestedMenu(parsedMenu);
      } catch (error) {
        if (error instanceof InternalServerErrorException) {
          throw error;
        }

        return this.recoverSuggestedMenuWithRetry(
          baseUrl,
          model,
          apiKey,
          input,
          error,
        );
      }
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
        : 'sin preferencias explicitas';

    return [
      'Eres un asistente de nutricion para una app chilena de planificacion de comidas.',
      'Responde en espanol.',
      'Entrega exactamente tres lineas y nada mas.',
      'Usa este formato exacto:',
      'Desayuno: <plato>',
      'Almuerzo: <plato>',
      'Cena: <plato>',
      'No uses JSON, markdown, listas, introducciones ni explicaciones.',
      `Ubicacion: ${input.location}.`,
      `Fecha: ${input.date}.`,
      `Clima: ${input.weatherSummary}.`,
      `Temperatura minima: ${input.temperatureMin} C.`,
      `Temperatura maxima: ${input.temperatureMax} C.`,
      `Preferencias dietarias: ${preferences}.`,
      'Propone platos realistas, breves y caseros.',
    ].join(' ');
  }

  private buildRecoveryPrompt(input: MenuAiInput): string {
    const preferences =
      input.preferences.length > 0
        ? input.preferences.join(', ')
        : 'sin preferencias explicitas';

    return [
      'Responde solo con estas 3 lineas.',
      'Cada linea debe tener un plato real y concreto.',
      'No copies la palabra "plato" ni uses placeholders.',
      'Ejemplo de formato valido:',
      'Desayuno: Avena con fruta',
      'Almuerzo: Quinoa con verduras',
      'Cena: Sopa de lentejas',
      `Ciudad: ${input.location}.`,
      `Fecha: ${input.date}.`,
      `Clima: ${input.weatherSummary}.`,
      `Temperatura minima: ${input.temperatureMin} C.`,
      `Temperatura maxima: ${input.temperatureMax} C.`,
      `Preferencias: ${preferences}.`,
      'No agregues ningun otro texto.',
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

  private requestMenuSuggestion(
    baseUrl: string,
    model: string,
    apiKey: string,
    input: MenuAiInput,
  ): Promise<string> {
    return this.requestRawOutput(
      baseUrl,
      model,
      apiKey,
      this.buildPrompt(input),
      'plain-text',
    );
  }

  private async requestRawOutput(
    baseUrl: string,
    model: string,
    apiKey: string,
    prompt: string,
    mode: 'plain-text' | 'recovery-text',
  ): Promise<string> {
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
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 300,
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      this.logger.error(
        `Gemini provider request failed with status ${response.status} in ${mode} mode`,
      );
      throw new BadGatewayException('AI provider request failed');
    }

    const payload = (await response.json()) as GeminiGenerateContentResponse;
    const outputText = payload.candidates
      ?.flatMap((candidate) => candidate.content?.parts ?? [])
      .find((part) => typeof part.text === 'string' && part.text.trim().length)
      ?.text;

    if (!outputText) {
      this.logger.error(
        `Gemini provider returned no output text in ${mode} mode. Details: ${this.describeGeminiPayload(payload)}`,
      );
      throw new BadGatewayException('AI provider returned no output text');
    }

    return outputText;
  }

  private async recoverSuggestedMenuWithRetry(
    baseUrl: string,
    model: string,
    apiKey: string,
    input: MenuAiInput,
    originalError: unknown,
  ): Promise<SuggestedMenuDto> {
    this.logger.warn(
      `Primary Gemini response failed. Retrying with recovery prompt. Reason: ${this.getErrorMessage(originalError)}`,
    );

    try {
      const recoveryOutput = await this.requestRawOutput(
        baseUrl,
        model,
        apiKey,
        this.buildRecoveryPrompt(input),
        'recovery-text',
      );
      const parsedRecoveryMenu = this.parseSuggestedMenu(recoveryOutput);

      return this.normalizeSuggestedMenu(parsedRecoveryMenu);
    } catch (error) {
      this.logger.warn(
        `Recovery Gemini response failed. Falling back to deterministic menu. Reason: ${this.getErrorMessage(error)}`,
      );

      return this.buildDeterministicFallbackMenu(input);
    }
  }

  private parseSuggestedMenu(outputText: string): unknown {
    const parseCandidates = this.buildJsonCandidates(outputText);

    for (const candidate of parseCandidates) {
      const normalizedCandidate = this.normalizeJsonCandidate(candidate);

      try {
        return this.normalizeParsedMenu(JSON.parse(normalizedCandidate));
      } catch {
        continue;
      }
    }

    const recoveredMenu = this.extractMenuFromLabeledText(outputText);

    if (recoveredMenu) {
      return recoveredMenu;
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

  private normalizeJsonCandidate(candidate: string): string {
    return candidate
      .trim()
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/^\uFEFF/, '')
      .replace(
        /([{,]\s*)(breakfast|lunch|dinner|desayuno|almuerzo|cena)\s*:/gi,
        '$1"$2":',
      )
      .replace(/:\s*'([^']*)'/g, ': "$1"')
      .replace(/,\s*([}\]])/g, '$1');
  }

  private normalizeParsedMenu(value: unknown): unknown {
    if (!value || typeof value !== 'object') {
      return value;
    }

    const menu = value as Record<string, unknown>;
    const breakfast = menu.breakfast ?? menu.desayuno;
    const lunch = menu.lunch ?? menu.almuerzo;
    const dinner = menu.dinner ?? menu.cena;

    return {
      breakfast,
      lunch,
      dinner,
    };
  }

  private extractMenuFromLabeledText(
    outputText: string,
  ): SuggestedMenuDto | undefined {
    const normalizedText = outputText.replace(/\r/g, '').trim();
    const breakfast = this.extractSectionValue(
      normalizedText,
      /(breakfast|desayuno)/i,
      /(lunch|almuerzo)/i,
    );
    const lunch = this.extractSectionValue(
      normalizedText,
      /(lunch|almuerzo)/i,
      /(dinner|cena)/i,
    );
    const dinner = this.extractSectionValue(
      normalizedText,
      /(dinner|cena)/i,
      undefined,
    );

    if (!breakfast || !lunch || !dinner) {
      return undefined;
    }

    return {
      breakfast,
      lunch,
      dinner,
    };
  }

  private extractSectionValue(
    source: string,
    currentLabel: RegExp,
    nextLabel?: RegExp,
  ): string | undefined {
    const startMatch = source.match(
      new RegExp(`${currentLabel.source}\\s*[:\\-]\\s*`, currentLabel.flags),
    );

    if (!startMatch || startMatch.index === undefined) {
      return undefined;
    }

    const startIndex = startMatch.index + startMatch[0].length;
    const remainingText = source.slice(startIndex);
    const nextMatch = nextLabel
      ? remainingText.match(
          new RegExp(`\\n?\\s*${nextLabel.source}\\s*[:\\-]\\s*`, nextLabel.flags),
        )
      : undefined;
    const rawValue = nextMatch?.index
      ? remainingText.slice(0, nextMatch.index)
      : nextMatch?.index === 0
        ? ''
        : remainingText;
    const cleanedValue = rawValue
      .replace(/^[\s"'*-]+/, '')
      .replace(/[\s"',.]+$/, '')
      .trim();

    return cleanedValue.length > 0 ? cleanedValue : undefined;
  }

  private normalizeSuggestedMenu(parsedMenu: unknown): SuggestedMenuDto {
    if (!this.isSuggestedMenu(parsedMenu)) {
      this.logger.error('Gemini provider returned an invalid menu shape');
      throw new BadGatewayException('AI provider returned an invalid menu');
    }

    return {
      breakfast: parsedMenu.breakfast.trim(),
      lunch: parsedMenu.lunch.trim(),
      dinner: parsedMenu.dinner.trim(),
    };
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

  private describeGeminiPayload(payload: GeminiGenerateContentResponse): string {
    const candidateReasons =
      payload.candidates
        ?.map((candidate) => {
          const reason = candidate.finishReason ?? 'UNKNOWN';
          const message = candidate.finishMessage
            ? ` (${candidate.finishMessage})`
            : '';

          return `${reason}${message}`;
        })
        .join(', ') ?? 'no candidates';

    const promptFeedback = payload.promptFeedback?.blockReason
      ? `prompt blocked: ${payload.promptFeedback.blockReason}${
          payload.promptFeedback.blockReasonMessage
            ? ` (${payload.promptFeedback.blockReasonMessage})`
            : ''
        }`
      : 'no prompt block reported';

    return `${promptFeedback}; candidate reasons: ${candidateReasons}`;
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }

  private buildDeterministicFallbackMenu(
    input: MenuAiInput,
  ): SuggestedMenuDto {
    const normalizedPreferences = input.preferences.map((preference) =>
      preference.toLowerCase(),
    );
    const isVegetarian = normalizedPreferences.includes('vegetarian');
    const isGlutenFree = normalizedPreferences.includes('gluten-free');
    const isDairyFree = normalizedPreferences.includes('dairy-free');
    const isHighProtein = normalizedPreferences.includes('high-protein');
    const averageTemperature =
      (input.temperatureMin + input.temperatureMax) / 2;

    const breakfast = this.pickBreakfastSuggestion({
      averageTemperature,
      isGlutenFree,
      isDairyFree,
      isHighProtein,
    });
    const lunch = this.pickLunchSuggestion({
      averageTemperature,
      isVegetarian,
      isGlutenFree,
      isDairyFree,
      isHighProtein,
    });
    const dinner = this.pickDinnerSuggestion({
      averageTemperature,
      isVegetarian,
      isGlutenFree,
      isDairyFree,
      isHighProtein,
    });

    return {
      breakfast,
      lunch,
      dinner,
    };
  }

  private pickBreakfastSuggestion(options: {
    averageTemperature: number;
    isGlutenFree: boolean;
    isDairyFree: boolean;
    isHighProtein: boolean;
  }): string {
    const { averageTemperature, isGlutenFree, isDairyFree, isHighProtein } =
      options;

    if (isHighProtein) {
      return isGlutenFree
        ? 'Omelette de espinaca con fruta fresca'
        : 'Huevos revueltos con pan integral y fruta';
    }

    if (averageTemperature <= 14) {
      if (isGlutenFree) {
        return isDairyFree
          ? 'Porridge de quinoa con manzana y canela'
          : 'Avena caliente con fruta y nueces';
      }

      return isDairyFree
        ? 'Pan tostado con palta y te caliente'
        : 'Avena caliente con platano y te';
    }

    return isDairyFree
      ? 'Batido de fruta con semillas y tostadas con palta'
      : 'Yogur con fruta, granola y te helado';
  }

  private pickLunchSuggestion(options: {
    averageTemperature: number;
    isVegetarian: boolean;
    isGlutenFree: boolean;
    isDairyFree: boolean;
    isHighProtein: boolean;
  }): string {
    const {
      averageTemperature,
      isVegetarian,
      isGlutenFree,
      isDairyFree,
      isHighProtein,
    } = options;

    if (averageTemperature <= 14) {
      if (isVegetarian) {
        return isGlutenFree
          ? 'Guiso de lentejas con verduras'
          : 'Crema de zapallo con quinoa';
      }

      return isHighProtein
        ? 'Pollo al horno con pure de papas'
        : 'Cazuela de pollo con verduras';
    }

    if (isVegetarian) {
      return isGlutenFree
        ? 'Quinoa con verduras salteadas y palta'
        : 'Lasaña de verduras casera';
    }

    if (isHighProtein) {
      return isDairyFree
        ? 'Pollo grillado con arroz y ensalada'
        : 'Filete de pollo con quinoa y ensalada';
    }

    return 'Pescado al horno con ensalada y papas cocidas';
  }

  private pickDinnerSuggestion(options: {
    averageTemperature: number;
    isVegetarian: boolean;
    isGlutenFree: boolean;
    isDairyFree: boolean;
    isHighProtein: boolean;
  }): string {
    const {
      averageTemperature,
      isVegetarian,
      isGlutenFree,
      isDairyFree,
      isHighProtein,
    } = options;

    if (averageTemperature <= 14) {
      if (isVegetarian) {
        return isGlutenFree
          ? 'Sopa de verduras con huevo pochado'
          : 'Tortilla de verduras con ensalada tibia';
      }

      return isHighProtein
        ? 'Tortilla de atun con ensalada tibia'
        : 'Sopa de pollo con verduras';
    }

    if (isVegetarian) {
      return isDairyFree
        ? 'Ensalada tibia de garbanzos con verduras'
        : 'Ensalada de quinoa con verduras asadas';
    }

    return isGlutenFree
      ? 'Pescado a la plancha con verduras salteadas'
      : 'Sandwich de pollo desmenuzado con ensalada';
  }
}
