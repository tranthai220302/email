import { Controller, Get, Param } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get(':siteId/crawl')
  async getEmailData(@Param('siteId') siteId: number) {
    return await this.emailService.fetchEmailBySiteId(siteId);
  }

  @Get()
  async getSites() {
    return this.emailService.findAll();
  }

  @Get(":id")
  async getKeyWords(@Param('id') id: number) {
    return this.emailService.findOneWithKeywords(id);
  }
}
