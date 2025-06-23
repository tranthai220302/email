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
  console.log('✅ DB connected');

  const rawData = fs.readFileSync('data.json', 'utf8');
  const sitesData = JSON.parse(rawData); // Array of site objects

  const siteRepo = AppDataSource.getRepository(Site);
  const keywordRepo = AppDataSource.getRepository(Keyword);

  for (const siteData of sitesData) {
    const site = siteRepo.create({ email: siteData.name });
    await siteRepo.save(site);

    const keywordEntities: Keyword[] = siteData.keywords.map((kw: any) =>
      keywordRepo.create({
        key: kw.key,
        value: kw.value,
        site: site,
      }),
    );

    await keywordRepo.save(keywordEntities);
    console.log(`✅ Inserted site: ${site.email} with ${keywordEntities.length} keywords`);
  }

  console.log('🎉 All sites seeded successfully');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
