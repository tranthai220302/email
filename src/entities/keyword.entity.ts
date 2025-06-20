// src/entities/keyword.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Site } from './site.entity';

@Entity('keywords')
export class Keyword {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'key_name' })
    key: string;

    @Column({ nullable: true })
    value: string;

    @ManyToOne(() => Site, site => site.keywords, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'site_id' })
    site: Site;
}
