import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { Site } from 'src/entities/site.entity';
import { Keyword } from 'src/entities/keyword.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Site, Keyword])], 
  providers: [EmailService],
  controllers: [EmailController],
})
export class EmailModule {}
