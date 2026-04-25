import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { setupApp } from './../src/app.setup';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let fetchMock: jest.SpiedFunction<typeof fetch>;
  const forecastDate = getTodayIsoDate();

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
                time: [forecastDate],
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

  it('/api/v1/locations/chile/regions (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/locations/chile/regions')
      .expect(200)
      .expect(({ body }) => {
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThan(0);
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: 'metropolitana-de-santiago',
              name: 'Metropolitana de Santiago',
            }),
          ]),
        );
      });
  });

  it('/api/v1/locations/chile/regions/:regionId/cities (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/locations/chile/regions/metropolitana-de-santiago/cities')
      .expect(200)
      .expect(({ body }) => {
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThan(0);
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: 'santiago',
              name: 'Santiago',
              regionId: 'metropolitana-de-santiago',
              regionName: 'Metropolitana de Santiago',
              latitude: expect.any(Number),
              longitude: expect.any(Number),
            }),
          ]),
        );
      });
  });

  it('/api/v1/locations/chile/cities/:cityId/weather (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/locations/chile/cities/santiago/weather')
      .query({
        date: forecastDate,
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          location: expect.objectContaining({
            id: 'santiago',
            name: 'Santiago',
            regionId: 'metropolitana-de-santiago',
            regionName: 'Metropolitana de Santiago',
            latitude: -33.4489,
            longitude: -70.6693,
          }),
          date: forecastDate,
          weather: {
            summary: 'Partly cloudy',
            temperatureMin: 9.2,
            temperatureMax: 21.8,
            weatherCode: 3,
          },
        });
      });
  });

  it('/api/v1/locations/chile/cities/:cityId/menu-suggestions (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/locations/chile/cities/santiago/menu-suggestions')
      .send({
        date: forecastDate,
        preferences: ['vegetarian', 'gluten-free'],
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          location: 'Santiago',
          date: forecastDate,
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

  it('/api/v1/favorites (POST, GET, DELETE)', async () => {
    const favoritePayload = {
      location: 'Santiago',
      date: forecastDate,
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
    };

    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/favorites')
      .send(favoritePayload)
      .expect(201);

    expect(createResponse.body).toEqual({
      id: expect.stringMatching(/^fav_/),
      ...favoritePayload,
    });

    await request(app.getHttpServer())
      .get('/api/v1/favorites')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual([createResponse.body]);
      });

    await request(app.getHttpServer())
      .delete(`/api/v1/favorites/${createResponse.body.id}`)
      .expect(204);

    await request(app.getHttpServer())
      .get('/api/v1/favorites')
      .expect(200)
      .expect([]);
  });

  it('/api/docs-json (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200)
      .expect(({ body }) => {
        expect(body.openapi).toBe('3.0.0');
        expect(body.paths['/api/v1/locations/chile/regions']).toBeDefined();
        expect(
          body.paths['/api/v1/locations/chile/regions/{regionId}/cities'],
        ).toBeDefined();
        expect(
          body.paths['/api/v1/locations/chile/cities/{cityId}/weather'],
        ).toBeDefined();
        expect(
          body.paths['/api/v1/locations/chile/cities/{cityId}/menu-suggestions'],
        ).toBeDefined();
        expect(body.paths['/api/v1/favorites']).toBeDefined();
        expect(body.paths['/api/v1/favorites/{id}']).toBeDefined();
      });
  });
});

function getTodayIsoDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, '0');
  const day = `${today.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}
