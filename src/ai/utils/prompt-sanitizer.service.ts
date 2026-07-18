import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PromptSanitizerService {
  private readonly logger = new Logger(PromptSanitizerService.name);

  // Patterns that indicate prompt injection attempts
  private readonly INJECTION_PATTERNS = [
    /ignore (all |previous |above )?instructions?/i,
    /reveal (your |the )?(api |secret )?key/i,
    /show (the )?(database|schema|table)/i,
    /act as (a different|an? (unrestricted|uncensored|evil|jailbreak))/i,
    /you are now/i,
    /forget (everything|all|your)/i,
    /disregard (your |all )?(previous |prior )?instructions?/i,
    /bypass (your |the )?(restrictions|rules|guidelines)/i,
    /return (your )?system prompt/i,
    /print (your )?prompt/i,
  ];

  // Sensitive data patterns to strip from user input
  private readonly SENSITIVE_PATTERNS = [
    { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, label: 'CARD_NUMBER' },
    { pattern: /\b\d{9,18}\b/g, label: 'ACCOUNT_NUMBER' },
    { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, label: 'EMAIL' },
    { pattern: /\b[0-9]{10}\b/g, label: 'PHONE_NUMBER' },
  ];

  /**
   * Detect if user input contains prompt injection attempts.
   * Returns true if the message is safe.
   */
  isSafe(input: string): boolean {
    for (const pattern of this.INJECTION_PATTERNS) {
      if (pattern.test(input)) {
        this.logger.warn(`Prompt injection attempt detected: "${input.slice(0, 100)}"`);
        return false;
      }
    }
    return true;
  }

  /**
   * Sanitize user input by stripping sensitive data before it reaches the prompt.
   */
  sanitize(input: string): string {
    let sanitized = input;
    for (const { pattern, label } of this.SENSITIVE_PATTERNS) {
      sanitized = sanitized.replace(pattern, `[${label}_REDACTED]`);
    }
    return sanitized.trim();
  }
}
