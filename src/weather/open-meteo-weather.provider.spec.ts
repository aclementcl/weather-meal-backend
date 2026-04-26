import { ConfigService } from '@nestjs/config';
import { OpenMeteoWeatherProvider } from './open-meteo-weather.provider';

describe('OpenMeteoWeatherProvider', () => {
  let provider: OpenMeteoWeatherProvider;
  let fetchMock: jest.SpiedFunction<typeof fetch>;

  beforeEach(() => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'WEATHER_API_FORECAST_BASE_URL') {
          return 'https://api.open-meteo.com/v1/forecast';
        }

        return undefined;
      }),
    } as unknown as ConfigService;

    provider = new OpenMeteoWeatherProvider(configService);
  });

  afterEach(() => {
    fetchMock?.mockRestore();
  });

  it('selects the requested day from a multi-day forecast response', async () => {
    const RealDate = Date;

    global.Date = class extends RealDate {
      constructor(value?: string | number | Date) {
        super(value ?? '2026-04-26T12:00:00Z');
      }

      static now(): number {
        return new RealDate('2026-04-26T12:00:00Z').getTime();
      }
    } as DateConstructor;

    fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        daily: {
          time: ['2026-04-26', '2026-04-27'],
          weather_code: [0, 61],
          temperature_2m_min: [16.1, 14.2],
          temperature_2m_max: [23.7, 19.8],
        },
      }),
    } as Response);

    await expect(
      provider.getDailyWeather(
        {
          id: 2,
          name: 'Arica',
          regionId: 1,
          regionName: 'Arica y Parinacota',
          latitude: -18.4783,
          longitude: -70.3126,
        },
        '2026-04-27',
      ),
    ).resolves.toEqual({
      temperatureMin: 14.2,
      temperatureMax: 19.8,
      weatherCode: 61,
    });

    global.Date = RealDate;
  });
});
