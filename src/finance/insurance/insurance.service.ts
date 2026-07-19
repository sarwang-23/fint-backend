import { Injectable, NotFoundException } from '@nestjs/common';
import { InsuranceRepository } from './insurance.repository';
import { CreateInsuranceDto, UpdateInsuranceDto, InsuranceFilterDto } from './insurance.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class InsuranceService {
  constructor(private readonly repository: InsuranceRepository) {}

  async create(userId: string, dto: CreateInsuranceDto) {
    return this.repository.executeInTransaction(async (tx) => {
      const created = await tx.insurance.create({
        data: { ...dto, userId },
      });
      await tx.financeAuditLog.create({
        data: {
          userId,
          module: 'Insurance',
          action: 'CREATE',
          recordId: created.id,
          newData: JSON.parse(JSON.stringify(created)),
        }
      });
      return created;
    });
  }

  async findAll(userId: string, filter: InsuranceFilterDto) {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.InsuranceWhereInput = { userId };
    if (filter.search) {
      where.OR = [
        { provider: { contains: filter.search, mode: 'insensitive' } }, { policyNumber: { contains: filter.search, mode: 'insensitive' } }, { notes: { contains: filter.search, mode: 'insensitive' } }
      ];
    }

    const orderBy: Prisma.InsuranceOrderByWithRelationInput = {};
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
      throw new NotFoundException('Insurance not found');
    }
    return record;
  }

  async update(id: string, userId: string, dto: UpdateInsuranceDto) {
    const record = await this.findOne(id, userId);
    
    return this.repository.executeInTransaction(async (tx) => {
      const updated = await tx.insurance.update({
        where: { id },
        data: dto,
      });
      await tx.financeAuditLog.create({
        data: {
          userId,
          module: 'Insurance',
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
      const deleted = await tx.insurance.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      await tx.financeAuditLog.create({
        data: {
          userId,
          module: 'Insurance',
          action: 'DELETE',
          recordId: id,
          oldData: JSON.parse(JSON.stringify(record)),
        }
      });
      return { message: 'Insurance deleted successfully' };
    });
  }
}
