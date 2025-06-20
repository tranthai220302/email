// src/entities/site.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Keyword } from './keyword.entity';

@Entity('sites')
export class Site {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @OneToMany(() => Keyword, keyword => keyword.site, { cascade: true })
    keywords: Keyword[];
}
