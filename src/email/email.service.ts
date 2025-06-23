import { Injectable, NotFoundException } from '@nestjs/common';
import * as imaps from 'imap-simple';
import * as dotenv from 'dotenv';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from 'src/entities/site.entity';
import { Keyword } from 'src/entities/keyword.entity';
import { simpleParser } from 'mailparser';

dotenv.config();

@Injectable()
export class EmailService {
  constructor(
    @InjectRepository(Site)
    private siteRepository: Repository<Site>,

    @InjectRepository(Keyword)
    private keywordRepository: Repository<Keyword>,
  ) {}

  private async extractKeyValues(
    content: string,
    siteId: number,
  ): Promise<Record<string, string>> {
    const keyValues: Record<string, string> = {};
    const lines = content.split(/\r?\n/);

    const site: any = await this.siteRepository.findOne({
      where: { id: siteId },
    });
    const siteName = site?.email;

    for (const line of lines) {
      let match: RegExpMatchArray | null = null;

      if (siteName === 'statdemand.notifications@gmail.com') {
        match = line.match(/\[([^\]]+)\]:\s*(.*)/);
      } else if (siteName === 'thaitq@htplus.software') {
        match = line.match(/・(.+?):\s*(.*)/);
      } else if (siteName === 'hoangleduy27901@gmail.com') {
      match = line.match('/■\s*(.+?)(?:\s*[:：]\s*|\s+)(.+)/g');
      }
      

      if (match) {
        const key = match[1]?.trim();
        const value = match[2]?.trim();
        keyValues[key] = value;
      }
    }

    return keyValues;
  }

  async fetchEmailBySiteId(
    siteId: number,
  ): Promise<{ key: string; value: string; updateTime: Date | null }[]> {
    const site = await this.siteRepository.findOne({ where: { id: siteId } });
    if (!site) throw new NotFoundException('Site not found');

    const keywords = await this.keywordRepository.find({
      where: { site: { id: siteId } },
      relations: ['site'],
    });

    const keywordMap = new Map<string, Keyword>();
    keywords.forEach((k) => keywordMap.set(k.key, k));

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
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}-${
      [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ][today.getMonth()]
    }-${today.getFullYear()}`;

    const searchCriteria = [
      ['FROM', site.email],
      ['ON', formattedDate],
    ];
    const fetchOptions = { bodies: [''], struct: true };

    const messages = await connection.search(searchCriteria, fetchOptions);

    if (!messages.length) {
      await connection.end();
      return Array.from(keywordMap.values()).map((k) => ({
        key: k.key,
        value: k.value,
        updateTime: k.updateTime || null,
      }));
    }

    const latestMessage = messages.reduce((prev, curr) =>
      curr.attributes.uid > prev.attributes.uid ? curr : prev,
    );

    const parts = imaps.getParts(latestMessage.attributes.struct);

    const bodyPart = parts.find(
      (p) =>
        p.type === 'text' &&
        (p.subtype === 'plain' || p.subtype === 'html') &&
        !p.disposition,
    );

    if (!bodyPart) {
      await connection.end();
      return [];
    }

    const raw = await connection.getPartData(latestMessage, bodyPart);

    const parsed = await simpleParser(raw);

    const content = parsed.text || parsed.html || '';

    const allData = await this.extractKeyValues(content, siteId);

    const toUpdate: Keyword[] = [];

    for (const [key, keywordEntity] of keywordMap.entries()) {
      const newValue = allData[key];
      if (newValue && newValue !== keywordEntity.value) {
        keywordEntity.value = newValue;
        keywordEntity.updateTime = new Date();
        toUpdate.push(keywordEntity);
      }
    }

    if (toUpdate.length > 0) {
      await this.keywordRepository.save(toUpdate);
    }

    await connection.end();

    return Array.from(keywordMap.values()).map((k) => ({
      key: k.key,
      value: k.value,
      updateTime: k.updateTime || null,
    }));
  }

  async findAll(): Promise<Site[]> {
    return this.siteRepository.find();
  }

  async findOneWithKeywords(siteId: number): Promise<Keyword[]> {
    return this.keywordRepository.find({
      where: { site: { id: siteId } },
      relations: ['site'],
    });
  }
}
