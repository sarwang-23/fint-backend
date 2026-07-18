import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditLogRepository {
  private readonly logger = new Logger(AuditLogRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(data: {
    userId: string;
    action: string;
    provider: string;
    status: 'SUCCESS' | 'FAILURE';
    responseTime: number;
    tokenUsage: number;
    cost?: number;
  }) {
    return this.prisma.aIAuditLog.create({ data });
  }

  async findByUser(userId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    return this.prisma.aIAuditLog.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }
}
