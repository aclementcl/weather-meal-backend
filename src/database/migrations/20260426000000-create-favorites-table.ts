import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateFavoritesTable20260426000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'favorites',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'location',
            type: 'varchar',
            length: '120',
          },
          {
            name: 'date',
            type: 'date',
          },
          {
            name: 'weather_summary',
            type: 'varchar',
            length: '120',
          },
          {
            name: 'temperature_min',
            type: 'double precision',
          },
          {
            name: 'temperature_max',
            type: 'double precision',
          },
          {
            name: 'breakfast',
            type: 'text',
          },
          {
            name: 'lunch',
            type: 'text',
          },
          {
            name: 'dinner',
            type: 'text',
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('favorites');
  }
}
