import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, Loan } from '@prisma/client';

@Injectable()
export class LoanRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.LoanUncheckedCreateInput): Promise<Loan> {
    return this.prisma.loan.create({ data });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.LoanWhereInput;
    orderBy?: Prisma.LoanOrderByWithRelationInput;
  }): Promise<{ data: Loan[]; total: number }> {
    const { skip, take, where, orderBy } = params;
    const [data, total] = await Promise.all([
      this.prisma.loan.findMany({
        skip,
        take,
        where: { ...where, deletedAt: null },
        orderBy,
      }),
      this.prisma.loan.count({ where: { ...where, deletedAt: null } }),
    ]);
    return { data, total };
  }

  async findById(id: string): Promise<Loan | null> {
    return this.prisma.loan.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async update(id: string, data: Prisma.LoanUpdateInput): Promise<Loan> {
    return this.prisma.loan.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<Loan> {
    return this.prisma.loan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async auditLog(userId: string, action: string, recordId: string, oldData: any, newData: any) {
    return this.prisma.financeAuditLog.create({
      data: {
        userId,
        module: 'Loan',
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
