import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, Investment } from '@prisma/client';

@Injectable()
export class InvestmentRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.InvestmentUncheckedCreateInput): Promise<Investment> {
    return this.prisma.investment.create({ data });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.InvestmentWhereInput;
    orderBy?: Prisma.InvestmentOrderByWithRelationInput;
  }): Promise<{ data: Investment[]; total: number }> {
    const { skip, take, where, orderBy } = params;
    const [data, total] = await Promise.all([
      this.prisma.investment.findMany({
        skip,
        take,
        where: { ...where, deletedAt: null },
        orderBy,
      }),
      this.prisma.investment.count({ where: { ...where, deletedAt: null } }),
    ]);
    return { data, total };
  }

  async findById(id: string): Promise<Investment | null> {
    return this.prisma.investment.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async update(id: string, data: Prisma.InvestmentUpdateInput): Promise<Investment> {
    return this.prisma.investment.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<Investment> {
    return this.prisma.investment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async auditLog(userId: string, action: string, recordId: string, oldData: any, newData: any) {
    return this.prisma.financeAuditLog.create({
      data: {
        userId,
        module: 'Investment',
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
