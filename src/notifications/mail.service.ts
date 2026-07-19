import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * Thin wrapper around nodemailer. In local dev, if SMTP_HOST isn't set in
 * .env, this falls back to Mailhog (already in docker-compose.yml —
 * localhost:1025, no auth needed). Emails "sent" during dev land in
 * Mailhog's web UI at http://localhost:8025 instead of a real inbox.
 * In production, set SMTP_HOST/PORT/USER/PASSWORD in .env (e.g. Gmail SMTP,
 * SendGrid, etc.) and this same service sends real email — no code change.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST') ?? 'localhost';
    const port = Number(this.config.get<string>('SMTP_PORT') ?? 1025);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASSWORD');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async send(to: string, subject: string, text: string, html?: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('SMTP_USER') ?? 'no-reply@fint.app',
        to,
        subject,
        text,
        html,
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to send email to ${to}: ${message}`);
      return false;
    }
  }
}
