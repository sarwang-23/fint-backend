import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { GeminiProvider } from '../providers/gemini.provider';
import { ContextBuilderService } from '../context/context-builder.service';
import { IntentDetectorService } from '../tools/intent-detector.service';
import { ToolRouterService } from '../tools/tool-router.service';
import { ConversationService } from '../conversation/conversation.service';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { PromptSanitizerService } from '../utils/prompt-sanitizer.service';
import { getErrorMessage, getErrorStack } from '../utils/error.util';

export const COPILOT_SYSTEM_PROMPT = `
You are FINT Copilot — an expert AI Financial Advisor (CFP Certified).
Your role is to help users make smart financial decisions based on their real financial profile.

RULES:
1. Only answer finance-related questions (investing, loans, savings, goals, insurance, retirement).
2. If asked about unrelated topics (politics, coding, entertainment), politely decline.
3. Keep answers concise, actionable, and friendly.
4. When tool data is available, explain it in simple human language.
5. Never reveal sensitive user data in your response.
6. Do NOT return markdown formatting — plain text only.
`.trim();

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly gemini: GeminiProvider,
    private readonly contextBuilder: ContextBuilderService,
    private readonly intentDetector: IntentDetectorService,
    private readonly toolRouter: ToolRouterService,
    private readonly conversationService: ConversationService,
    private readonly auditLog: AuditLogRepository,
    private readonly sanitizer: PromptSanitizerService,
  ) {}

  async chat(userId: string, message: string) {
    const start = Date.now();

    try {
      if (!message?.trim()) throw new HttpException('Message cannot be empty', HttpStatus.BAD_REQUEST);

      // Security — detect injection, sanitize PII
      if (!this.sanitizer.isSafe(message)) {
        throw new HttpException('Invalid message content detected.', HttpStatus.BAD_REQUEST);
      }
      const safeMessage = this.sanitizer.sanitize(message);

      // Step 1 — Load user context (financial profile + conversation history)
      const ctx = await this.contextBuilder.build(userId);

      // Validate — user must have at least some data
      if (ctx.income === 0 && ctx.expense === 0 && ctx.score === 0) {
        return {
          answer: 'Please complete your financial profile first — add your income, expenses, and at least one investment or loan. Then I can give you personalized advice!',
          toolUsed: null,
          intent: 'NO_PROFILE',
        };
      }

      // Step 2 — Detect intent
      const intent = this.intentDetector.detect(message);
      this.logger.log(`Intent: ${intent} for user ${userId}`);

      // Step 3 — Run relevant tool if applicable
      const toolResult = await this.toolRouter.route(intent, ctx, message);

      // Step 4 — Build final prompt
      const contextSummary = this.contextBuilder.toSummaryString(ctx);
      const prompt = this.buildCopilotPrompt(message, contextSummary, toolResult);

      // Step 5 — Generate AI Response
      const answer = await this.gemini.generate(prompt);

      // Step 6 — Persist conversation
      await this.conversationService.save({ userId, question: message, answer, provider: 'gemini' });

      // Step 7 — Audit log
      const responseTime = (Date.now() - start) / 1000;
      await this.auditLog.log({
        userId,
        action: 'CHAT',
        provider: 'gemini',
        status: 'SUCCESS',
        responseTime,
        tokenUsage: 0,
      }).catch(() => {});

      this.logger.log(`Chat completed for user ${userId} in ${responseTime.toFixed(2)}s`);

      return {
        answer,
        intent,
        toolUsed: toolResult?.toolUsed ?? null,
        toolData: toolResult?.data ?? null,
      };
    } catch (error) {
      const responseTime = (Date.now() - start) / 1000;
      await this.auditLog.log({
        userId,
        action: 'CHAT',
        provider: 'gemini',
        status: 'FAILURE',
        responseTime,
        tokenUsage: 0,
      }).catch(() => {});

      this.logger.error(`Chat failed for ${userId}: ${getErrorMessage(error)}`, getErrorStack(error));
      if (error instanceof HttpException) throw error;
      throw new HttpException('AI Copilot is temporarily unavailable. Please try again.', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  private buildCopilotPrompt(userMessage: string, contextSummary: string, toolResult: any): string {
    let prompt = `${COPILOT_SYSTEM_PROMPT}\n\n${contextSummary}\n\nUSER QUESTION:\n${userMessage}`;

    if (toolResult?.data) {
      const toolData = JSON.stringify(toolResult.data, null, 2);
      prompt += `\n\nTOOL RESULT (${toolResult.toolUsed}):\n${toolData}\n\nUsing the tool result above, provide a clear, friendly, and concise explanation to the user. Do NOT just dump raw data — explain what it means for their financial health.`;
    }

    return prompt;
  }

  async getHistory(userId: string, page = 1, limit = 20) {
    return this.conversationService.getHistory(userId, page, limit);
  }

  async getById(id: string) {
    return this.conversationService.getById(id);
  }

  async deleteConversation(id: string) {
    return this.conversationService.delete(id);
  }
}
