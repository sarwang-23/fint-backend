import { Injectable, NotFoundException } from '@nestjs/common';
import { LoanRepository } from './loan.repository';
import { CreateLoanDto, UpdateLoanDto, LoanFilterDto } from './loan.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class LoanService {
  constructor(private readonly repository: LoanRepository) {}

  async create(userId: string, dto: CreateLoanDto) {
    return this.repository.executeInTransaction(async (tx) => {
      const created = await tx.loan.create({
        data: { ...dto, userId },
      });
      await tx.financeAuditLog.create({
        data: {
          userId,
          module: 'Loan',
          action: 'CREATE',
          recordId: created.id,
          newData: JSON.parse(JSON.stringify(created)),
        }
      });
      return created;
    });
  }

  async findAll(userId: string, filter: LoanFilterDto) {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.LoanWhereInput = { userId };
    if (filter.search) {
      where.OR = [
        { lenderName: { contains: filter.search, mode: 'insensitive' } }, { notes: { contains: filter.search, mode: 'insensitive' } }
      ];
    }

    const orderBy: Prisma.LoanOrderByWithRelationInput = {};
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
      throw new NotFoundException('Loan not found');
    }
    return record;
  }

  async update(id: string, userId: string, dto: UpdateLoanDto) {
    const record = await this.findOne(id, userId);
    
    return this.repository.executeInTransaction(async (tx) => {
      const updated = await tx.loan.update({
        where: { id },
        data: dto,
      });
      await tx.financeAuditLog.create({
        data: {
          userId,
          module: 'Loan',
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
      const deleted = await tx.loan.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      await tx.financeAuditLog.create({
        data: {
          userId,
          module: 'Loan',
          action: 'DELETE',
          recordId: id,
          oldData: JSON.parse(JSON.stringify(record)),
        }
      });
      return { message: 'Loan deleted successfully' };
    });
  }
}
