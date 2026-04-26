import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'favorites',
})
export class FavoriteEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 120,
  })
  location: string;

  @Column({
    type: 'date',
  })
  date: string;

  @Column({
    name: 'weather_summary',
    length: 120,
  })
  weatherSummary: string;

  @Column({
    name: 'temperature_min',
    type: 'float',
  })
  temperatureMin: number;

  @Column({
    name: 'temperature_max',
    type: 'float',
  })
  temperatureMax: number;

  @Column({
    type: 'text',
  })
  breakfast: string;

  @Column({
    type: 'text',
  })
  lunch: string;

  @Column({
    type: 'text',
  })
  dinner: string;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;
}
