import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  /**
   * Send email notification when an AI recommendation is ready.
   * Currently logs — wire up an email provider (Nodemailer / SendGrid) to activate.
   */
  async sendRecommendationReady(userId: string, email: string, fullName: string) {
    this.logger.log(`[EMAIL] Sending recommendation-ready email to ${email} (User: ${userId})`);

    // TODO: Replace with actual email provider (e.g. Nodemailer / SendGrid)
    const emailContent = {
      to: email,
      subject: 'Your FINT AI Recommendation is Ready 🚀',
      html: `
        <h2>Hi ${fullName},</h2>
        <p>Your monthly AI-powered financial recommendation has been generated.</p>
        <p>Login to your FINT dashboard to view personalized advice based on your latest financial profile.</p>
        <br/>
        <a href="https://fint.app/ai/recommendation" style="background:#6C47FF;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">
          View Recommendation
        </a>
        <br/><br/>
        <small>FINT — Your AI Financial Advisor</small>
      `,
    };

    this.logger.log(`[EMAIL] Payload prepared: ${JSON.stringify({ to: emailContent.to, subject: emailContent.subject })}`);
    return { queued: true };
  }

  /**
   * Send forecast-ready notification.
   */
  async sendForecastReady(userId: string, email: string, fullName: string) {
    this.logger.log(`[EMAIL] Sending forecast-ready email to ${email} (User: ${userId})`);
    // TODO: Implement with actual provider
    return { queued: true };
  }
}
