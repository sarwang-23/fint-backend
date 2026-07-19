import { Injectable, NotFoundException } from '@nestjs/common';
import { ExpenseRepository } from './expense.repository';
import { CreateExpenseDto, UpdateExpenseDto, ExpenseFilterDto } from './expense.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExpenseService {
  constructor(private readonly repository: ExpenseRepository) {}

  async create(userId: string, dto: CreateExpenseDto) {
    return this.repository.executeInTransaction(async (tx) => {
      const created = await tx.expense.create({
        data: { ...dto, userId },
      });
      await tx.financeAuditLog.create({
        data: {
          userId,
          module: 'Expense',
          action: 'CREATE',
          recordId: created.id,
          newData: JSON.parse(JSON.stringify(created)),
        }
      });
      return created;
    });
  }

  async findAll(userId: string, filter: ExpenseFilterDto) {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ExpenseWhereInput = { userId };
    if (filter.search) {
      where.OR = [
        { accountId: { contains: filter.search, mode: 'insensitive' } }, { title: { contains: filter.search, mode: 'insensitive' } }, { notes: { contains: filter.search, mode: 'insensitive' } }
      ];
    }

    const orderBy: Prisma.ExpenseOrderByWithRelationInput = {};
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
      throw new NotFoundException('Expense not found');
    }
    return record;
  }

  async update(id: string, userId: string, dto: UpdateExpenseDto) {
    const record = await this.findOne(id, userId);
    
    return this.repository.executeInTransaction(async (tx) => {
      const updated = await tx.expense.update({
        where: { id },
        data: dto,
      });
      await tx.financeAuditLog.create({
        data: {
          userId,
          module: 'Expense',
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
      const deleted = await tx.expense.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      await tx.financeAuditLog.create({
        data: {
          userId,
          module: 'Expense',
          action: 'DELETE',
          recordId: id,
          oldData: JSON.parse(JSON.stringify(record)),
        }
      });
      return { message: 'Expense deleted successfully' };
    });
  }
}
