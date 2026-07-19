import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'localhost',
      port: this.configService.get<number>('SMTP_PORT') || 1025,
      auth: {
        user: this.configService.get<string>('SMTP_USER') || '',
        pass: this.configService.get<string>('SMTP_PASS') || '',
      },
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: '"Fint" <noreply@fint.com>',
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to} for "${subject}"`);
    } catch (e: any) {
      this.logger.warn(`Failed to send email to ${to}: ${e.message}`);
    }
  }
}
