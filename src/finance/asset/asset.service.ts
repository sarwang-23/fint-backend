
import { Injectable, NotFoundException } from '@nestjs/common';
import { AssetRepository } from './asset.repository';
import { CreateAssetDto } from './asset.dto';

@Injectable()
export class AssetService {
  constructor(private readonly assetRepository: AssetRepository) {}

  create(userId: string, dto: CreateAssetDto) {
    return this.assetRepository.create(userId, dto);
  }

  findAll(userId: string) {
    return this.assetRepository.findAllByUser(userId);
  }

  async findOne(id: string) {
    const asset = await this.assetRepository.findOne(id);
    if (!asset) {
      throw new NotFoundException(`Asset with id ${id} not found`);
    }
    return asset;
  }

  async update(id: string, dto: Partial<CreateAssetDto>) {
    await this.findOne(id);
    return this.assetRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.assetRepository.remove(id);
  }
}