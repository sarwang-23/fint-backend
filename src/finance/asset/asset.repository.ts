
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAssetDto } from './asset.dto';

@Injectable()
export class AssetRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, data: CreateAssetDto) {
    return this.prisma.asset.create({
      data: {
        ...data,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
        userId,
      },
    });
  }

  findAllByUser(userId: string) {
    return this.prisma.asset.findMany({
      where: { userId },
    });
  }

  findOne(id: string) {
    return this.prisma.asset.findUnique({
      where: { id },
    });
  }

  update(id: string, data: Partial<CreateAssetDto>) {
    return this.prisma.asset.update({
      where: { id },
      data: {
        ...data,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
      },
    });
  }

  remove(id: string) {
    return this.prisma.asset.delete({
      where: { id },
    });
  }
}