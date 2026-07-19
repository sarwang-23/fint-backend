import { Injectable, NotFoundException } from '@nestjs/common';
import { RetirementRepository } from './retirement.repository';
import { CreateRetirementDto, UpdateRetirementDto, RetirementFilterDto } from './retirement.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class RetirementService {
  constructor(private readonly repository: RetirementRepository) {}

  async create(userId: string, dto: CreateRetirementDto) {
    return this.repository.executeInTransaction(async (tx) => {
      const created = await tx.retirement.create({
        data: { ...dto, userId },
      });
      await tx.financeAuditLog.create({
        data: {
          userId,
          module: 'Retirement',
          action: 'CREATE',
          recordId: created.id,
          newData: JSON.parse(JSON.stringify(created)),
        }
      });
      return created;
    });
  }

  async findAll(userId: string, filter: RetirementFilterDto) {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.RetirementWhereInput = { userId };
    if (filter.search) {
      where.OR = [
        { notes: { contains: filter.search, mode: 'insensitive' } }
      ];
    }

    const orderBy: Prisma.RetirementOrderByWithRelationInput = {};
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
      throw new NotFoundException('Retirement not found');
    }
    return record;
  }

  async update(id: string, userId: string, dto: UpdateRetirementDto) {
    const record = await this.findOne(id, userId);
    
    return this.repository.executeInTransaction(async (tx) => {
      const updated = await tx.retirement.update({
        where: { id },
        data: dto,
      });
      await tx.financeAuditLog.create({
        data: {
          userId,
          module: 'Retirement',
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
      const deleted = await tx.retirement.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      await tx.financeAuditLog.create({
        data: {
          userId,
          module: 'Retirement',
          action: 'DELETE',
          recordId: id,
          oldData: JSON.parse(JSON.stringify(record)),
        }
      });
      return { message: 'Retirement deleted successfully' };
    });
  }
}
