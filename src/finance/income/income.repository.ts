import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateIncomeDto } from './income.dto';

@Injectable()
export class IncomeRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, data: CreateIncomeDto) {
    return this.prisma.income.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  findAllByUser(userId: string) {
    return this.prisma.income.findMany({
      where: { userId },
    });
  }

  findOne(id: string) {
    return this.prisma.income.findUnique({
      where: { id },
    });
  }

  update(id: string, data: Partial<CreateIncomeDto>) {
    return this.prisma.income.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.income.delete({
      where: { id },
    });
  }
}