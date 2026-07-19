import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { AIProvider } from '../interfaces/ai-provider.interface';

// Retry delay helper with exponential backoff
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

@Injectable()
export class GeminiProvider implements AIProvider, OnModuleInit {
  private readonly logger = new Logger(GeminiProvider.name);
  private client: GoogleGenAI;
  private readonly model = 'gemini-2.0-flash';
  private readonly maxRetries = 3;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not set. AI features will be unavailable.');
      return;
    }
    this.client = new GoogleGenAI({ apiKey });
    this.logger.log(`GeminiProvider initialized (model: ${this.model})`);
  }

  private ensureClient() {
    if (!this.client) {
      throw new Error('GEMINI_API_KEY is not configured. Please add it to your .env file.');
    }
  }

  /**
   * Generate a plain text response from Gemini.
   * Used for: Chat / Advisor responses.
   */
  async generate(prompt: string): Promise<string> {
    this.ensureClient();
    return this.withRetry(async () => {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: prompt,
      });
      const text = response.text ?? '';
      if (!text) throw new Error('Gemini returned empty text response');
      return text;
    });
  }

  /**
   * Generate a structured JSON response from Gemini.
   * Used for: Recommendation, Forecast, Simulation services.
   *
   * Gemini sometimes wraps JSON in markdown (```json ... ```) despite
   * instructions. This method strips that automatically before parsing.
   */
  async generateJSON<T>(prompt: string): Promise<T> {
    this.ensureClient();
    return this.withRetry(async () => {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          // Force JSON mode — Gemini 2.0 supports responseMimeType
          responseMimeType: 'application/json',
        },
      });

      const raw = response.text ?? '';
      if (!raw) throw new Error('Gemini returned empty JSON response');

      const cleaned = this.stripMarkdown(raw);
      const parsed = JSON.parse(cleaned) as T;
      return parsed;
    });
  }

  /**
   * Retry wrapper with exponential backoff.
   * Attempt 1: immediate
   * Attempt 2: wait 1s
   * Attempt 3: wait 2s
   */
  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const start = Date.now();
        const result = await fn();
        this.logger.log(`Gemini response received (attempt ${attempt}, ${Date.now() - start}ms)`);
        return result;
      } catch (error) {
        lastError = error;
        this.logger.warn(`Gemini attempt ${attempt}/${this.maxRetries} failed: ${error instanceof Error ? error.message : String(error)}`);
        if (attempt < this.maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          this.logger.log(`Retrying in ${delay}ms...`);
          await sleep(delay);
        }
      }
    }
    this.logger.error(`Gemini failed after ${this.maxRetries} attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
    throw lastError;
  }

  /**
   * Strip markdown code fences that Gemini sometimes adds despite JSON mode.
   * e.g.  ```json\n{...}\n```  →  {...}
   */
  private stripMarkdown(raw: string): string {
    return raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  }
}
