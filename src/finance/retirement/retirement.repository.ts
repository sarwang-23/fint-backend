import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, Retirement } from '@prisma/client';

@Injectable()
export class RetirementRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.RetirementUncheckedCreateInput): Promise<Retirement> {
    return this.prisma.retirement.create({ data });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.RetirementWhereInput;
    orderBy?: Prisma.RetirementOrderByWithRelationInput;
  }): Promise<{ data: Retirement[]; total: number }> {
    const { skip, take, where, orderBy } = params;
    const [data, total] = await Promise.all([
      this.prisma.retirement.findMany({
        skip,
        take,
        where: { ...where, deletedAt: null },
        orderBy,
      }),
      this.prisma.retirement.count({ where: { ...where, deletedAt: null } }),
    ]);
    return { data, total };
  }

  async findById(id: string): Promise<Retirement | null> {
    return this.prisma.retirement.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async update(id: string, data: Prisma.RetirementUpdateInput): Promise<Retirement> {
    return this.prisma.retirement.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<Retirement> {
    return this.prisma.retirement.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async auditLog(userId: string, action: string, recordId: string, oldData: any, newData: any) {
    return this.prisma.financeAuditLog.create({
      data: {
        userId,
        module: 'Retirement',
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
