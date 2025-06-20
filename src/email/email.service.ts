import { Injectable, Logger } from '@nestjs/common';
import * as imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly dataPath = path.join(__dirname, '../../data.json');

  private loadSites(): any[] {
    const raw = fs.readFileSync(this.dataPath, 'utf8');
    return JSON.parse(raw);
  }

  private saveSites(sites: any[]) {
    fs.writeFileSync(this.dataPath, JSON.stringify(sites, null, 2), 'utf8');
  }

  async fetchEmails() {
    const config = {
      imap: {
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        tls: true,
        authTimeout: 3000,
        tlsOptions: {
          rejectUnauthorized: false,
        },
      },
    };

    const connection = await imaps.connect(config);
    await connection.openBox('INBOX');

    const searchCriteria = ['UNSEEN'];
    const fetchOptions = {
      bodies: [''],
      struct: true,
    };

    const messages = await connection.search(searchCriteria, fetchOptions);

    const senders: string[] = [];

    for (const message of messages.slice(0, 10)) {
      const parts = imaps.getParts(message.attributes.struct);
      const part = parts.find(
        (p) => p.type === 'text' && p.subtype === 'plain',
      );
      const raw = await connection.getPartData(message, part);
      const parsed = await simpleParser(raw);
      console.log(parsed);

      senders.push(parsed.from?.text || '[Unknown Sender]');
    }

    await connection.end();
    return senders;
  }
}
