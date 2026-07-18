import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SimulationRepository {
  private readonly logger = new Logger(SimulationRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    scenarioType: string;
    oldScore: number;
    newScore: number;
    scenario: any;
    summary: string;
    impact: string;
  }) {
    return this.prisma.aISimulation.create({ data });
  }

  async history(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return this.prisma.aISimulation.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }

  async delete(id: string) {
    return this.prisma.aISimulation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
