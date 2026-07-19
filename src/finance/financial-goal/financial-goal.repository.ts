import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, FinancialGoal } from '@prisma/client';

@Injectable()
export class FinancialGoalRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.FinancialGoalUncheckedCreateInput): Promise<FinancialGoal> {
    return this.prisma.financialGoal.create({ data });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.FinancialGoalWhereInput;
    orderBy?: Prisma.FinancialGoalOrderByWithRelationInput;
  }): Promise<{ data: FinancialGoal[]; total: number }> {
    const { skip, take, where, orderBy } = params;
    const [data, total] = await Promise.all([
      this.prisma.financialGoal.findMany({
        skip,
        take,
        where: { ...where, deletedAt: null },
        orderBy,
      }),
      this.prisma.financialGoal.count({ where: { ...where, deletedAt: null } }),
    ]);
    return { data, total };
  }

  async findById(id: string): Promise<FinancialGoal | null> {
    return this.prisma.financialGoal.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async update(id: string, data: Prisma.FinancialGoalUpdateInput): Promise<FinancialGoal> {
    return this.prisma.financialGoal.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<FinancialGoal> {
    return this.prisma.financialGoal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async auditLog(userId: string, action: string, recordId: string, oldData: any, newData: any) {
    return this.prisma.financeAuditLog.create({
      data: {
        userId,
        module: 'FinancialGoal',
        action,
        recordId,
        oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
        newData: newData ? JSON.parse(JSON.stringify(newData)) : null,
      },
    });
  }

  async executeInTransaction<T>(fn: (prisma: any) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
