import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateLoanDto } from './loan.dto';

@Injectable()
export class LoanRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, data: CreateLoanDto) {
    return this.prisma.loan.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        nextEmiDate: data.nextEmiDate ? new Date(data.nextEmiDate) : undefined,
        userId,
      },
    });
  }

  findAllByUser(userId: string) {
    return this.prisma.loan.findMany({
      where: { userId },
    });
  }

  findOne(id: string) {
    return this.prisma.loan.findUnique({
      where: { id },
    });
  }

  update(id: string, data: Partial<CreateLoanDto>) {
    return this.prisma.loan.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        nextEmiDate: data.nextEmiDate ? new Date(data.nextEmiDate) : undefined,
      },
    });
  }

  remove(id: string) {
    return this.prisma.loan.delete({
      where: { id },
    });
  }
}