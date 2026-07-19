import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, Asset } from '@prisma/client';

@Injectable()
export class AssetRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.AssetUncheckedCreateInput): Promise<Asset> {
    return this.prisma.asset.create({ data });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.AssetWhereInput;
    orderBy?: Prisma.AssetOrderByWithRelationInput;
  }): Promise<{ data: Asset[]; total: number }> {
    const { skip, take, where, orderBy } = params;
    const [data, total] = await Promise.all([
      this.prisma.asset.findMany({
        skip,
        take,
        where: { ...where, deletedAt: null },
        orderBy,
      }),
      this.prisma.asset.count({ where: { ...where, deletedAt: null } }),
    ]);
    return { data, total };
  }

  async findById(id: string): Promise<Asset | null> {
    return this.prisma.asset.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async update(id: string, data: Prisma.AssetUpdateInput): Promise<Asset> {
    return this.prisma.asset.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<Asset> {
    return this.prisma.asset.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async auditLog(userId: string, action: string, recordId: string, oldData: any, newData: any) {
    return this.prisma.financeAuditLog.create({
      data: {
        userId,
        module: 'Asset',
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
