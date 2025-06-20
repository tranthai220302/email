import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as imaps from 'imap-simple';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from 'src/entities/site.entity';
import { Keyword } from 'src/entities/keyword.entity';

dotenv.config();

@Injectable()
export class EmailService {
  constructor(
    @InjectRepository(Site)
    private siteRepository: Repository<Site>,

    @InjectRepository(Keyword)
    private keywordRepository: Repository<Keyword>,
  ) { }

  private extractKeyValues(content: string): Record<string, string> {
    const keyValues: Record<string, string> = {};
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      let match: RegExpMatchArray | null;
      match = line.match(/^\s*\[(.+?)\]\s*[:：]+\s*(.+)$/);
      if (match) {
        keyValues[match[1].trim()] = match[2].trim();
        continue;
      }

      match = line.match(/^■?\s*(.+?)\s*[:：]+\s*(.+)$/);
      if (match) {
        keyValues[match[1].trim()] = match[2].trim();
      }
    }
    return keyValues;
  }

  async fetchEmailBySiteId(siteId: number): Promise<Record<string, string>> {
    const site = await this.siteRepository.findOne({ where: { id: siteId } });
    if (!site) throw new NotFoundException('Site not found');

    const keywords = await this.keywordRepository.find({
      where: { site: { id: siteId } },
      relations: ['site'],
    });

    const keywordMap = new Map<string, Keyword>();
    keywords.forEach(k => keywordMap.set(k.key, k));

    const connection = await imaps.connect({
      imap: {
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        tls: true,
        authTimeout: 3000,
        tlsOptions: { rejectUnauthorized: false },
      },
    });

    await connection.openBox('INBOX');

    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}-${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][today.getMonth()]}-${today.getFullYear()}`;

    const searchCriteria = [['FROM', site.email], ['ON', formattedDate]];
    const fetchOptions = { bodies: [''], struct: true };

    const messages = await connection.search(searchCriteria, fetchOptions);

    for (const message of messages.reverse()) {
      const parts = imaps.getParts(message.attributes.struct);
      for (const part of parts) {
        if (`${part.type}/${part.subtype}` === 'text/plain') {
          const raw = await connection.getPartData(message, part);
          const allData = this.extractKeyValues(raw);

          const extracted: Record<string, string> = {};

          for (const [key, keywordEntity] of keywordMap.entries()) {
            if (allData[key]) {
              extracted[key] = allData[key];
              keywordEntity.value = allData[key]; 
            }
          }

          await this.keywordRepository.save(Array.from(keywordMap.values()));

          await connection.end();
          return extracted;
        }
      }
    }

    await connection.end();
    return {};
  }

}

