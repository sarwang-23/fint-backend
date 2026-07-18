import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ConversationRepository {
  private readonly logger = new Logger(ConversationRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    question: string;
    answer: string;
    tokens?: number;
    provider: string;
  }) {
    return this.prisma.aIConversation.create({
      data: { ...data, tokens: data.tokens ?? 0 },
    });
  }

  async history(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return this.prisma.aIConversation.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }

  async delete(id: string) {
    return this.prisma.aIConversation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
