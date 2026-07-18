
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateRetirementDto } from './retirement.dto';

@Injectable()
export class RetirementRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsert(userId: string, data: CreateRetirementDto) {
    return this.prisma.retirement.upsert({
      where: { userId },
      create: {
        ...data,
        userId,
      },
      update: {
        ...data,
      },
    });
  }

  findByUser(userId: string) {
    return this.prisma.retirement.findUnique({
      where: { userId },
    });
  }

  remove(userId: string) {
    return this.prisma.retirement.delete({
      where: { userId },
    });
  }
}