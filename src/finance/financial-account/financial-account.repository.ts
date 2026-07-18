
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateFinancialAccountDto } from './financial-account.dto';

@Injectable()
export class FinancialAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, data: CreateFinancialAccountDto) {
    return this.prisma.financialAccount.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  findAllByUser(userId: string) {
    return this.prisma.financialAccount.findMany({
      where: { userId },
    });
  }

  findOne(id: string) {
    return this.prisma.financialAccount.findUnique({
      where: { id },
    });
  }

  update(id: string, data: Partial<CreateFinancialAccountDto>) {
    return this.prisma.financialAccount.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.financialAccount.delete({
      where: { id },
    });
  }
}