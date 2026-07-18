
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateFinancialGoalDto } from './financial-goal.dto';

@Injectable()
export class FinancialGoalRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, data: CreateFinancialGoalDto) {
    return this.prisma.financialGoal.create({
      data: {
        ...data,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        userId,
      },
    });
  }

  findAllByUser(userId: string) {
    return this.prisma.financialGoal.findMany({
      where: { userId },
    });
  }

  findOne(id: string) {
    return this.prisma.financialGoal.findUnique({
      where: { id },
    });
  }

  update(id: string, data: Partial<CreateFinancialGoalDto>) {
    return this.prisma.financialGoal.update({
      where: { id },
      data: {
        ...data,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
      },
    });
  }

  remove(id: string) {
    return this.prisma.financialGoal.delete({
      where: { id },
    });
  }
}