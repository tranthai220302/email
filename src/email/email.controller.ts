import { Controller, Get, Param } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get(':siteId')
  async getEmailData(@Param('siteId') siteId: number) {
    return await this.emailService.fetchEmailBySiteId(siteId);
  }
}
