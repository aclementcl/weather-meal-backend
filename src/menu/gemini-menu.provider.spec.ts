import { ConfigService } from '@nestjs/config';
import { GeminiMenuProvider } from './gemini-menu.provider';

describe('GeminiMenuProvider', () => {
  let provider: GeminiMenuProvider;
  let fetchMock: jest.SpiedFunction<typeof fetch>;

  beforeEach(() => {
    const configService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'GEMINI_API_KEY':
            return 'test-gemini-key';
          case 'GEMINI_BASE_URL':
            return 'https://generativelanguage.googleapis.com/v1beta';
          case 'GEMINI_MODEL':
            return 'gemini-2.5-flash';
          default:
            return undefined;
        }
      }),
    } as unknown as ConfigService;

    provider = new GeminiMenuProvider(configService);
  });

  afterEach(() => {
    fetchMock?.mockRestore();
  });

  it('recovers malformed json with unquoted keys and trailing comma', async () => {
    fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: "{breakfast: 'Avena con fruta', lunch: 'Quinoa con verduras asadas', dinner: 'Sopa de lentejas',}",
                },
              ],
            },
          },
        ],
      }),
    } as Response);

    await expect(
      provider.suggestMenu({
        location: 'Santiago',
        date: '2026-04-26',
        preferences: ['vegetarian', 'gluten-free'],
        weatherSummary: 'Templado y parcialmente nublado',
        temperatureMin: 11,
        temperatureMax: 22,
      }),
    ).resolves.toEqual({
      breakfast: 'Avena con fruta',
      lunch: 'Quinoa con verduras asadas',
      dinner: 'Sopa de lentejas',
    });
  });

  it('recovers labeled plain text in spanish when provider ignores json format', async () => {
    fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: [
                    'Desayuno: Avena tibia con manzana',
                    'Almuerzo: Guiso de garbanzos con verduras',
                    'Cena: Crema de zapallo',
                  ].join('\n'),
                },
              ],
            },
          },
        ],
      }),
    } as Response);

    await expect(
      provider.suggestMenu({
        location: 'Puerto Montt',
        date: '2026-04-26',
        preferences: ['vegetarian'],
        weatherSummary: 'Frio y nublado',
        temperatureMin: 6,
        temperatureMax: 13,
      }),
    ).resolves.toEqual({
      breakfast: 'Avena tibia con manzana',
      lunch: 'Guiso de garbanzos con verduras',
      dinner: 'Crema de zapallo',
    });
  });

  it('retries with plain text fallback when structured response has no output text', async () => {
    fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              finishReason: 'STOP',
              content: {
                parts: [],
              },
            },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: [
                      'Desayuno: Pan con palta y tomate',
                      'Almuerzo: Ensalada tibia de quinoa',
                      'Cena: Sopa de verduras con huevo',
                    ].join('\n'),
                  },
                ],
              },
            },
          ],
        }),
      } as Response);

    await expect(
      provider.suggestMenu({
        location: 'Viña del Mar',
        date: '2026-04-26',
        preferences: ['vegetarian', 'gluten-free'],
        weatherSummary: 'Templado y soleado',
        temperatureMin: 12,
        temperatureMax: 20,
      }),
    ).resolves.toEqual({
      breakfast: 'Pan con palta y tomate',
      lunch: 'Ensalada tibia de quinoa',
      dinner: 'Sopa de verduras con huevo',
    });
  });

  it('returns a deterministic fallback menu when Gemini fails twice', async () => {
    fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'Respuesta no estructurada sin etiquetas utiles',
                  },
                ],
              },
            },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'Todavia sin desayuno, almuerzo y cena',
                  },
                ],
              },
            },
          ],
        }),
      } as Response);

    await expect(
      provider.suggestMenu({
        location: 'Antofagasta',
        date: '2026-04-26',
        preferences: ['vegetarian', 'gluten-free'],
        weatherSummary: 'Partly cloudy',
        temperatureMin: 13.1,
        temperatureMax: 19.8,
      }),
    ).resolves.toEqual({
      breakfast: 'Yogur con fruta, granola y te helado',
      lunch: 'Quinoa con verduras salteadas y palta',
      dinner: 'Ensalada de quinoa con verduras asadas',
    });
  });
});
