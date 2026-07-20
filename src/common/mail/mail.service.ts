import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'localhost',
      port: this.configService.get<number>('SMTP_PORT') || 1025,
      // Only include auth if credentials are actually configured
      ...(smtpUser ? { auth: { user: smtpUser, pass: smtpPass || '' } } : {}),
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
