import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConversationRepository } from '../repositories/conversation.repository';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly conversationRepo: ConversationRepository,
  ) {}

  async save(data: { userId: string; question: string; answer: string; tokens?: number; provider?: string }) {
    return this.conversationRepo.create({
      userId: data.userId,
      question: data.question,
      answer: data.answer,
      tokens: data.tokens ?? 0,
      provider: data.provider ?? 'gemini',
    });
  }

  async getHistory(userId: string, page = 1, limit = 20) {
    return this.conversationRepo.history(userId, page, limit);
  }

  async getById(id: string) {
    return this.prisma.aIConversation.findFirst({ where: { id, deletedAt: null } });
  }

  async delete(id: string) {
    return this.conversationRepo.delete(id);
  }
}
