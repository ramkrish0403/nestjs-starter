import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.NJS_POSTGRES_HOST || 'njs_postgres_db',
  port: parseInt(process.env.NJS_POSTGRES_PORT || '5432', 10),
  username: process.env.NJS_POSTGRES_USER || 'postgres',
  password: process.env.NJS_POSTGRES_PASSWORD || 'postgres',
  database: process.env.NJS_POSTGRES_DB || 'nestjs_starter',
  autoLoadEntities: true,
  synchronize: true, // Set to false in production
};
