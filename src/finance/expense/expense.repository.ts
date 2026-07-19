import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, Expense } from '@prisma/client';

@Injectable()
export class ExpenseRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ExpenseUncheckedCreateInput): Promise<Expense> {
    return this.prisma.expense.create({ data });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.ExpenseWhereInput;
    orderBy?: Prisma.ExpenseOrderByWithRelationInput;
  }): Promise<{ data: Expense[]; total: number }> {
    const { skip, take, where, orderBy } = params;
    const [data, total] = await Promise.all([
      this.prisma.expense.findMany({
        skip,
        take,
        where: { ...where, deletedAt: null },
        orderBy,
      }),
      this.prisma.expense.count({ where: { ...where, deletedAt: null } }),
    ]);
    return { data, total };
  }

  async findById(id: string): Promise<Expense | null> {
    return this.prisma.expense.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async update(id: string, data: Prisma.ExpenseUpdateInput): Promise<Expense> {
    return this.prisma.expense.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<Expense> {
    return this.prisma.expense.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async auditLog(userId: string, action: string, recordId: string, oldData: any, newData: any) {
    return this.prisma.financeAuditLog.create({
      data: {
        userId,
        module: 'Expense',
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
