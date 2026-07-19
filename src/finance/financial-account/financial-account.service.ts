import { Injectable, NotFoundException } from '@nestjs/common';
import { FinancialAccountRepository } from './financial-account.repository';
import { CreateFinancialAccountDto, UpdateFinancialAccountDto, FinancialAccountFilterDto } from './financial-account.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class FinancialAccountService {
  constructor(private readonly repository: FinancialAccountRepository) {}

  async create(userId: string, dto: CreateFinancialAccountDto) {
    return this.repository.executeInTransaction(async (tx) => {
      const created = await tx.financialAccount.create({
        data: { ...dto, userId },
      });
      await tx.financeAuditLog.create({
        data: {
          userId,
          module: 'FinancialAccount',
          action: 'CREATE',
          recordId: created.id,
          newData: JSON.parse(JSON.stringify(created)),
        }
      });
      return created;
    });
  }

  async findAll(userId: string, filter: FinancialAccountFilterDto) {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.FinancialAccountWhereInput = { userId };
    if (filter.search) {
      where.OR = [
        { bankName: { contains: filter.search, mode: 'insensitive' } }, { accountName: { contains: filter.search, mode: 'insensitive' } }, { accountNumber: { contains: filter.search, mode: 'insensitive' } }, { currency: { contains: filter.search, mode: 'insensitive' } }
      ];
    }

    const orderBy: Prisma.FinancialAccountOrderByWithRelationInput = {};
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
      throw new NotFoundException('FinancialAccount not found');
    }
    return record;
  }

  async update(id: string, userId: string, dto: UpdateFinancialAccountDto) {
    const record = await this.findOne(id, userId);
    
    return this.repository.executeInTransaction(async (tx) => {
      const updated = await tx.financialAccount.update({
        where: { id },
        data: dto,
      });
      await tx.financeAuditLog.create({
        data: {
          userId,
          module: 'FinancialAccount',
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
      const deleted = await tx.financialAccount.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      await tx.financeAuditLog.create({
        data: {
          userId,
          module: 'FinancialAccount',
          action: 'DELETE',
          recordId: id,
          oldData: JSON.parse(JSON.stringify(record)),
        }
      });
      return { message: 'FinancialAccount deleted successfully' };
    });
  }
}
