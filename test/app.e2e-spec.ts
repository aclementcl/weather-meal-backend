import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { setupApp } from './../src/app.setup';
import { getCurrentChileIsoDate } from './../src/common/date/chile-date.util';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let fetchMock: jest.SpiedFunction<typeof fetch>;
  const forecastDate = getCurrentChileIsoDate();

  beforeEach(async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    delete process.env.GEMINI_BASE_URL;
    delete process.env.GEMINI_MODEL;

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

        if (url.includes('generativelanguage.googleapis.com')) {
          return {
            ok: true,
            json: async () => ({
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        text: JSON.stringify({
                          breakfast: 'Avena con fruta y te',
                          lunch: 'Crema de zapallo con quinoa',
                          dinner: 'Tortilla de verduras y ensalada tibia',
                        }),
                      },
                    ],
                  },
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
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_BASE_URL;
    delete process.env.GEMINI_MODEL;
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
              id: 7,
              name: 'Metropolitana de Santiago',
            }),
          ]),
        );
      });
  });

  it('/api/v1/locations/chile/regions/:regionId/cities (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/locations/chile/regions/7/cities')
      .expect(200)
      .expect(({ body }) => {
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThan(0);
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: 13,
              name: 'Santiago',
              regionId: 7,
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
      .get('/api/v1/locations/chile/cities/13/weather')
      .query({
        date: forecastDate,
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          location: expect.objectContaining({
            id: 13,
            name: 'Santiago',
            regionId: 7,
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
      .post('/api/v1/locations/chile/cities/13/menu-suggestions')
      .send({
        date: forecastDate,
        preferenceIds: [1, 2],
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

  it('/api/v1/locations/chile/cities/:cityId/menu-suggestions rejects invalid preference ids (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/locations/chile/cities/13/menu-suggestions')
      .send({
        date: forecastDate,
        preferenceIds: [999],
      })
      .expect(400)
      .expect(({ body }) => {
        expect(body.message).toContain('Unsupported dietary preference ids');
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
      id: 1,
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
