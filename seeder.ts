// seeder.ts
import { DataSource } from 'typeorm';
import { Site } from './src/entities/site.entity';
import { Keyword } from './src/entities/keyword.entity';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Site, Keyword],
  synchronize: false,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('DB connected');

  const rawData = fs.readFileSync('data.json', 'utf8');
  const data = JSON.parse(rawData);

  const siteRepo = AppDataSource.getRepository(Site);
  const keywordRepo = AppDataSource.getRepository(Keyword);

  const site = siteRepo.create({ email: data.name });
  await siteRepo.save(site);

  for (const kw of data.keywords) {
    const keyword = keywordRepo.create({
      key: kw.key,
      value: kw.value,
      site: site,
    });
    await keywordRepo.save(keyword);
  }

  console.log('✅ Seed completed');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
