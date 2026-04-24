import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { setupApp } from './../src/app.setup';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let fetchMock: jest.SpiedFunction<typeof fetch>;

  beforeEach(async () => {
    process.env.OPENAI_API_KEY = 'test-openai-key';
    delete process.env.OPENAI_BASE_URL;
    delete process.env.OPENAI_MODEL;

    fetchMock = jest.spyOn(global, 'fetch').mockImplementation(
      async (input: string | URL | Request) => {
        const url =
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url;

        if (url.includes('open-meteo.com')) {
          return {
            ok: true,
            json: async () => ({
              daily: {
                time: ['2026-04-23'],
                weather_code: [3],
                temperature_2m_min: [9.2],
                temperature_2m_max: [21.8],
              },
            }),
          } as Response;
        }

        if (url.endsWith('/responses')) {
          return {
            ok: true,
            json: async () => ({
              output: [
                {
                  type: 'message',
                  content: [
                    {
                      type: 'output_text',
                      text: JSON.stringify({
                        breakfast: 'Avena con fruta y te',
                        lunch: 'Crema de zapallo con quinoa',
                        dinner: 'Tortilla de verduras y ensalada tibia',
                      }),
                    },
                  ],
                },
              ],
            }),
          } as Response;
        }

        throw new Error(`Unexpected fetch URL: ${url}`);
      },
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterEach(async () => {
    fetchMock.mockRestore();
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_BASE_URL;
    delete process.env.OPENAI_MODEL;
    await app.close();
  });

  it('/api/v1/locations/chile (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/locations/chile')
      .expect(200)
      .expect(({ body }) => {
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThan(0);
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              name: 'Santiago',
              region: 'Metropolitana de Santiago',
              latitude: expect.any(Number),
              longitude: expect.any(Number),
            }),
          ]),
        );
      });
  });

  it('/api/v1/weather (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/weather')
      .query({
        city: 'Santiago',
        date: '2026-04-23',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          location: expect.objectContaining({
            name: 'Santiago',
            region: 'Metropolitana de Santiago',
            latitude: -33.4489,
            longitude: -70.6693,
          }),
          date: '2026-04-23',
          weather: {
            summary: 'Partly cloudy',
            temperatureMin: 9.2,
            temperatureMax: 21.8,
            weatherCode: 3,
          },
        });
      });
  });

  it('/api/v1/menu/suggest (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/menu/suggest')
      .send({
        location: 'Santiago',
        date: '2026-04-23',
        preferences: ['vegetarian', 'gluten-free'],
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          location: 'Santiago',
          date: '2026-04-23',
          weather: {
            summary: 'Partly cloudy',
            temperatureMin: 9.2,
            temperatureMax: 21.8,
          },
          menu: {
            breakfast: 'Avena con fruta y te',
            lunch: 'Crema de zapallo con quinoa',
            dinner: 'Tortilla de verduras y ensalada tibia',
          },
        });
      });
  });

  it('/api/docs-json (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200)
      .expect(({ body }) => {
        expect(body.openapi).toBe('3.0.0');
        expect(body.paths['/api/v1/locations/chile']).toBeDefined();
        expect(body.paths['/api/v1/weather']).toBeDefined();
        expect(body.paths['/api/v1/menu/suggest']).toBeDefined();
      });
  });
});
