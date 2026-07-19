import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, FinancialAccount } from '@prisma/client';

@Injectable()
export class FinancialAccountRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.FinancialAccountUncheckedCreateInput): Promise<FinancialAccount> {
    return this.prisma.financialAccount.create({ data });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.FinancialAccountWhereInput;
    orderBy?: Prisma.FinancialAccountOrderByWithRelationInput;
  }): Promise<{ data: FinancialAccount[]; total: number }> {
    const { skip, take, where, orderBy } = params;
    const [data, total] = await Promise.all([
      this.prisma.financialAccount.findMany({
        skip,
        take,
        where: { ...where, deletedAt: null },
        orderBy,
      }),
      this.prisma.financialAccount.count({ where: { ...where, deletedAt: null } }),
    ]);
    return { data, total };
  }

  async findById(id: string): Promise<FinancialAccount | null> {
    return this.prisma.financialAccount.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async update(id: string, data: Prisma.FinancialAccountUpdateInput): Promise<FinancialAccount> {
    return this.prisma.financialAccount.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<FinancialAccount> {
    return this.prisma.financialAccount.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async auditLog(userId: string, action: string, recordId: string, oldData: any, newData: any) {
    return this.prisma.financeAuditLog.create({
      data: {
        userId,
        module: 'FinancialAccount',
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
