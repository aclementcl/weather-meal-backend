import 'dotenv/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { FavoriteEntity } from '../favorites/entities/favorite.entity';
import { CreateFavoritesTable20260426000000 } from './migrations/20260426000000-create-favorites-table';

const entities = [FavoriteEntity];
const migrations = [CreateFavoritesTable20260426000000];

function isTruthy(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}

function buildSqlJsOptions(
  env: NodeJS.ProcessEnv,
): TypeOrmModuleOptions & DataSourceOptions {
  return {
    type: 'sqljs',
    autoSave: false,
    location: env.DB_SQLJS_LOCATION,
    entities,
    synchronize: true,
    logging: isTruthy(env.DB_LOGGING),
  };
}

function buildPostgresOptions(
  env: NodeJS.ProcessEnv,
): TypeOrmModuleOptions & DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST ?? 'localhost',
    port: Number(env.DB_PORT ?? '5432'),
    username: env.DB_USERNAME ?? 'postgres',
    password: env.DB_PASSWORD ?? 'postgres',
    database: env.DB_NAME ?? 'weathermeal',
    entities,
    migrations,
    synchronize: false,
    logging: isTruthy(env.DB_LOGGING),
  };
}

export function buildTypeOrmOptions(
  env: NodeJS.ProcessEnv,
): TypeOrmModuleOptions & DataSourceOptions {
  return env.DB_TYPE === 'sqljs'
    ? buildSqlJsOptions(env)
    : buildPostgresOptions(env);
}

const dataSource = new DataSource(buildTypeOrmOptions(process.env));

export default dataSource;
