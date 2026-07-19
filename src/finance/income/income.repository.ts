import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, Income } from '@prisma/client';

@Injectable()
export class IncomeRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.IncomeUncheckedCreateInput): Promise<Income> {
    return this.prisma.income.create({ data });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.IncomeWhereInput;
    orderBy?: Prisma.IncomeOrderByWithRelationInput;
  }): Promise<{ data: Income[]; total: number }> {
    const { skip, take, where, orderBy } = params;
    const [data, total] = await Promise.all([
      this.prisma.income.findMany({
        skip,
        take,
        where: { ...where, deletedAt: null },
        orderBy,
      }),
      this.prisma.income.count({ where: { ...where, deletedAt: null } }),
    ]);
    return { data, total };
  }

  async findById(id: string): Promise<Income | null> {
    return this.prisma.income.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async update(id: string, data: Prisma.IncomeUpdateInput): Promise<Income> {
    return this.prisma.income.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<Income> {
    return this.prisma.income.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async auditLog(userId: string, action: string, recordId: string, oldData: any, newData: any) {
    return this.prisma.financeAuditLog.create({
      data: {
        userId,
        module: 'Income',
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
