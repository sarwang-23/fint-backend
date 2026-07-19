import { Injectable, NotFoundException } from '@nestjs/common';
import { FinancialGoalRepository } from './financial-goal.repository';
import { CreateFinancialGoalDto, UpdateFinancialGoalDto, FinancialGoalFilterDto } from './financial-goal.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class FinancialGoalService {
  constructor(private readonly repository: FinancialGoalRepository) {}

  async create(userId: string, dto: CreateFinancialGoalDto) {
    return this.repository.executeInTransaction(async (tx) => {
      const created = await tx.financialGoal.create({
        data: { ...dto, userId },
      });
      await tx.financeAuditLog.create({
        data: {
          userId,
          module: 'FinancialGoal',
          action: 'CREATE',
          recordId: created.id,
          newData: JSON.parse(JSON.stringify(created)),
        }
      });
      return created;
    });
  }

  async findAll(userId: string, filter: FinancialGoalFilterDto) {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.FinancialGoalWhereInput = { userId };
    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } }, { notes: { contains: filter.search, mode: 'insensitive' } }
      ];
    }

    const orderBy: Prisma.FinancialGoalOrderByWithRelationInput = {};
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
      throw new NotFoundException('FinancialGoal not found');
    }
    return record;
  }

  async update(id: string, userId: string, dto: UpdateFinancialGoalDto) {
    const record = await this.findOne(id, userId);
    
    return this.repository.executeInTransaction(async (tx) => {
      const updated = await tx.financialGoal.update({
        where: { id },
        data: dto,
      });
      await tx.financeAuditLog.create({
        data: {
          userId,
          module: 'FinancialGoal',
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
      const deleted = await tx.financialGoal.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      await tx.financeAuditLog.create({
        data: {
          userId,
          module: 'FinancialGoal',
          action: 'DELETE',
          recordId: id,
          oldData: JSON.parse(JSON.stringify(record)),
        }
      });
      return { message: 'FinancialGoal deleted successfully' };
    });
  }
}
