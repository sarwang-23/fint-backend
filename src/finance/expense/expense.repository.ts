import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateExpenseDto } from './expense.dto';

@Injectable()
export class ExpenseRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, data: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  findAllByUser(userId: string) {
    return this.prisma.expense.findMany({
      where: { userId },
    });
  }

  findOne(id: string) {
    return this.prisma.expense.findUnique({
      where: { id },
    });
  }

  update(id: string, data: Partial<CreateExpenseDto>) {
    return this.prisma.expense.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.expense.delete({
      where: { id },
    });
  }
}