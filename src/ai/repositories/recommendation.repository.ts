import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RecommendationRepository {
  private readonly logger = new Logger(RecommendationRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    summary: string;
    riskLevel: string;
    recommendations: any[];
    nextSteps: string[];
    score?: number;
  }) {
    return this.prisma.aIRecommendation.create({ data });
  }

  async findByUser(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return this.prisma.aIRecommendation.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }

  async findLatest(userId: string) {
    return this.prisma.aIRecommendation.findFirst({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: Partial<{ summary: string; riskLevel: string; recommendations: any; nextSteps: any; score: number }>) {
    return this.prisma.aIRecommendation.update({ where: { id }, data });
  }

  // Soft delete — never actually removes data
  async delete(id: string) {
    return this.prisma.aIRecommendation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
