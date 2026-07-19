import { Injectable, NotFoundException } from '@nestjs/common';
import { AssetRepository } from './asset.repository';
import { CreateAssetDto, UpdateAssetDto, AssetFilterDto } from './asset.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AssetService {
  constructor(private readonly repository: AssetRepository) {}

  async create(userId: string, dto: CreateAssetDto) {
    return this.repository.executeInTransaction(async (tx) => {
      const created = await tx.asset.create({
        data: { ...dto, userId },
      });
      await tx.financeAuditLog.create({
        data: {
          userId,
          module: 'Asset',
          action: 'CREATE',
          recordId: created.id,
          newData: JSON.parse(JSON.stringify(created)),
        }
      });
      return created;
    });
  }

  async findAll(userId: string, filter: AssetFilterDto) {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.AssetWhereInput = { userId };
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } }, { description: { contains: filter.search, mode: 'insensitive' } }
      ];
    }

    const orderBy: Prisma.AssetOrderByWithRelationInput = {};
    if (filter.sortBy) {
      orderBy[filter.sortBy] = filter.sortOrder || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    return this.repository.findAll({ skip, take: limit, where, orderBy });
  }

  async findOne(id: string, userId: string) {
    const record = await this.repository.findById(id);
    if (!record || record.userId !== userId) {
      throw new NotFoundException('Asset not found');
    }
    return record;
  }

  async update(id: string, userId: string, dto: UpdateAssetDto) {
    const record = await this.findOne(id, userId);
    
    return this.repository.executeInTransaction(async (tx) => {
      const updated = await tx.asset.update({
        where: { id },
        data: dto,
      });
      await tx.financeAuditLog.create({
        data: {
          userId,
          module: 'Asset',
          action: 'UPDATE',
          recordId: id,
          oldData: JSON.parse(JSON.stringify(record)),
          newData: JSON.parse(JSON.stringify(updated)),
        }
      });
      return updated;
    });
  }

  async remove(id: string, userId: string) {
    const record = await this.findOne(id, userId);
    
    return this.repository.executeInTransaction(async (tx) => {
      const deleted = await tx.asset.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      await tx.financeAuditLog.create({
        data: {
          userId,
          module: 'Asset',
          action: 'DELETE',
          recordId: id,
          oldData: JSON.parse(JSON.stringify(record)),
        }
      });
      return { message: 'Asset deleted successfully' };
    });
  }
}
