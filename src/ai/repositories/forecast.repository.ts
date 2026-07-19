import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ForecastRepository {
  private readonly logger = new Logger(ForecastRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    futureValue: number;
    retirementCorpus: number;
    savingRate: number;
    debtRatio: number;
    summary: string;
    risk: string;
  }) {
    return this.prisma.aIForecast.create({ data });
  }

  async history(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return this.prisma.aIForecast.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }

  async latest(userId: string) {
    return this.prisma.aIForecast.findFirst({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(id: string) {
    return this.prisma.aIForecast.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
