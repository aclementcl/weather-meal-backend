# WeatherMeal Backend

Backend NestJS para el challenge WeatherMeal. Expone APIs versionadas para:

- regiones y ciudades de Chile
- clima normalizado
- sugerencias de menú con Gemini
- favoritos persistidos en PostgreSQL con TypeORM

Swagger queda disponible en `http://localhost:3000/api/docs`.

## Requisitos

- Node.js 22+
- npm 10+
- PostgreSQL 16+ o Docker

## Variables de entorno

Copia `.env.sample` a `.env` y ajusta los valores.

Variables principales:

- `PORT`: puerto HTTP de Nest
- `DB_TYPE`: `postgres` para ejecución normal, `sqljs` para tests en memoria
- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_LOGGING`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GEMINI_BASE_URL`
- `WEATHER_API_FORECAST_BASE_URL`
- `WEATHER_API_ARCHIVE_BASE_URL`

## Instalación

```bash
npm install
```

## Base de datos y migraciones

La persistencia de favoritos usa TypeORM y migraciones.

Comandos disponibles:

```bash
npm run migration:create
npm run migration:generate
npm run migration:run
npm run migration:revert
```

Migración incluida:

- `src/database/migrations/20260426000000-create-favorites-table.ts`

## Ejecución local

1. Levanta PostgreSQL.
2. Ejecuta migraciones.
3. Inicia la aplicación.

```bash
npm run migration:run
npm run start:dev
```

Producción local:

```bash
npm run build
npm run migration:run:prod
npm run start:prod
```

## Docker

El repositorio incluye:

- `Dockerfile` para la API
- `docker-compose.yml` para API + PostgreSQL

Levantar todo:

```bash
docker compose up --build
```

Comportamiento del contenedor de la API:

- espera que PostgreSQL esté sano
- ejecuta `npm run migration:run:prod`
- levanta Nest con `npm run start:prod`

Servicios expuestos:

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api/docs`
- PostgreSQL: `localhost:5432`

## Tests

Los tests e2e usan `sqljs` en memoria, así que no requieren PostgreSQL externo.

```bash
npm test
npm run test:e2e
```

## Endpoints principales

- `GET /api/v1/locations/chile/regions`
- `GET /api/v1/locations/chile/regions/:regionId/cities`
- `GET /api/v1/locations/chile/cities/:cityId/weather?date=YYYY-MM-DD`
- `POST /api/v1/locations/chile/cities/:cityId/menu-suggestions`
- `GET /api/v1/favorites`
- `POST /api/v1/favorites`
- `DELETE /api/v1/favorites/:id`

## Persistencia de favoritos

Los favoritos ya no viven en memoria. Se almacenan en la tabla `favorites` con estos datos:

- ubicación
- fecha
- resumen del clima
- temperatura mínima y máxima
- desayuno
- almuerzo
- cena

El contrato HTTP de `favorites` se mantiene estable; cambió solo la implementación interna.
