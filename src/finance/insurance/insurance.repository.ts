import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, Insurance } from '@prisma/client';

@Injectable()
export class InsuranceRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.InsuranceUncheckedCreateInput): Promise<Insurance> {
    return this.prisma.insurance.create({ data });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.InsuranceWhereInput;
    orderBy?: Prisma.InsuranceOrderByWithRelationInput;
  }): Promise<{ data: Insurance[]; total: number }> {
    const { skip, take, where, orderBy } = params;
    const [data, total] = await Promise.all([
      this.prisma.insurance.findMany({
        skip,
        take,
        where: { ...where, deletedAt: null },
        orderBy,
      }),
      this.prisma.insurance.count({ where: { ...where, deletedAt: null } }),
    ]);
    return { data, total };
  }

  async findById(id: string): Promise<Insurance | null> {
    return this.prisma.insurance.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async update(id: string, data: Prisma.InsuranceUpdateInput): Promise<Insurance> {
    return this.prisma.insurance.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<Insurance> {
    return this.prisma.insurance.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async auditLog(userId: string, action: string, recordId: string, oldData: any, newData: any) {
    return this.prisma.financeAuditLog.create({
      data: {
        userId,
        module: 'Insurance',
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
