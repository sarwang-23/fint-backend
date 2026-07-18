
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateInsuranceDto } from './insurance.dto';

@Injectable()
export class InsuranceRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, data: CreateInsuranceDto) {
    return this.prisma.insurance.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        userId,
      },
    });
  }

  findAllByUser(userId: string) {
    return this.prisma.insurance.findMany({
      where: { userId },
    });
  }

  findOne(id: string) {
    return this.prisma.insurance.findUnique({
      where: { id },
    });
  }

  update(id: string, data: Partial<CreateInsuranceDto>) {
    return this.prisma.insurance.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      },
    });
  }

  remove(id: string) {
    return this.prisma.insurance.delete({
      where: { id },
    });
  }
}