# WeatherMeal Backend

La API expone:

- catálogo de regiones y ciudades de Chile
- consulta de clima normalizado para frontend
- sugerencia de menú basada en clima + preferencias
- persistencia de favoritos

Swagger queda disponible en `http://localhost:3000/api/docs`.

## Objetivo y enfoque

Prioridades:

1. contratos HTTP estables y fáciles de consumir desde Angular
2. separación razonable entre catálogo, clima, menú y favoritos
3. dependencias externas encapsuladas
4. despliegue reproducible
5. decisiones explícitas, aunque no necesariamente “enterprise-grade”


## Decisiones técnicas

### 1. NestJS como framework

- controllers para contrato HTTP
- services para lógica de aplicación
- providers para integraciones externas
- módulos para separar contexto

### 2. Versionado de API y Swagger

La API está versionada en URI bajo `/api/v1/...`.

- permite evolucionar contratos sin romper clientes
- deja Swagger alineado con el contrato real
- es la opción más simple para un MVP

### 3. Catálogo estático de ubicaciones

No usé geocoding externo para regiones/ciudades. El catálogo está en [src/locations/locations.data.ts](src/locations/locations.data.ts).


### 4. Rutas REST anidadas

Las rutas quedaron así:

- `GET /api/v1/locations/chile/regions`
- `GET /api/v1/locations/chile/regions/:regionId/cities`
- `GET /api/v1/locations/chile/cities/:cityId/weather`
- `POST /api/v1/locations/chile/cities/:cityId/menu-suggestions`

La decisión fue modelar explícitamente la relación:

- país -> regiones -> ciudades
- ciudad -> clima
- ciudad -> sugerencias de menú

Eso hace la API más legible que pasar todo por query strings o cuerpos ambiguos.

### 5. DTOs y validación

Usé DTOs con `class-validator` y `ValidationPipe` global.

Razón:

- centraliza validación de input
- hace los contratos visibles en código y Swagger
- evita lógica de validación manual dispersa

### 6. Open-Meteo para clima

La integración de clima usa Open-Meteo.

Razón:

- no requiere key para el MVP
- tiene forecast diario con `weather_code`, mínimas y máximas
- tiene endpoint histórico, lo que evita amarrarse solo al presente

La integración está encapsulada en [src/weather/open-meteo-weather.provider.ts](src/weather/open-meteo-weather.provider.ts).

### 7. Gemini para sugerencia de menú

La sugerencia de menú usa Gemini.

Razón:

- permite generar sugerencias textuales sin entrenar nada específico


### 8. Favoritos con PostgreSQL y TypeORM

Los favoritos persisten con PostgreSQL y TypeORM.

- repositorios simples
- entidades claras
- migraciones versionadas

## Estructura del proyecto

Principales módulos:

- `locations`: catálogo y resolución de regiones/ciudades
- `weather`: consulta y normalización de clima
- `menu`: prompt, llamada a IA y normalización/fallback
- `favorites`: persistencia de sugerencias guardadas
- `database`: configuración TypeORM y migraciones

La separación intencional es:

- `controller`: expone HTTP
- `service`: orquesta casos de uso
- `provider`: habla con servicios externos
- `dto`: contrato de entrada/salida

## Variables de entorno

Copia `.env.sample` a `.env` y ajusta los valores.

Variables principales:

- `PORT`
- `DB_TYPE`
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


## Cómo correrlo localmente

### Opción 1: Docker Compose

Es la opción más simple para levantar API + PostgreSQL.

```bash
docker compose up --build
```

Esto:

- levanta PostgreSQL
- levanta la API
- corre migraciones al arrancar la app

URLs:

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api/docs`

### Opción 2: Sin Docker

Necesitas PostgreSQL disponible.

```bash
npm install
npm run migration:run
npm run start:dev
```

Producción local:

```bash
npm run build
npm run migration:run:prod
npm run start:prod
```

## Base de datos y migraciones

Migración incluida:

- [src/database/migrations/20260426000000-create-favorites-table.ts](src/database/migrations/20260426000000-create-favorites-table.ts)

Comandos:

```bash
npm run migration:create
npm run migration:generate
npm run migration:run
npm run migration:revert
```

## Tests

```bash
npm test
npm run test:e2e
```