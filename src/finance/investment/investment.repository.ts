
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateInvestmentDto } from './investment.dto';

@Injectable()
export class InvestmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, data: CreateInvestmentDto) {
    return this.prisma.investment.create({
      data: {
        ...data,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
        userId,
      },
    });
  }

  findAllByUser(userId: string) {
    return this.prisma.investment.findMany({
      where: { userId },
    });
  }

  findOne(id: string) {
    return this.prisma.investment.findUnique({
      where: { id },
    });
  }

  update(id: string, data: Partial<CreateInvestmentDto>) {
    return this.prisma.investment.update({
      where: { id },
      data: {
        ...data,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
      },
    });
  }

  remove(id: string) {
    return this.prisma.investment.delete({
      where: { id },
    });
  }
}