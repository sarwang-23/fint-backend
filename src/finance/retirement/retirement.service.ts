
import { Injectable, NotFoundException } from '@nestjs/common';
import { RetirementRepository } from './retirement.repository';
import { CreateRetirementDto } from './retirement.dto';

@Injectable()
export class RetirementService {
  constructor(private readonly retirementRepository: RetirementRepository) {}

  save(userId: string, dto: CreateRetirementDto) {
    return this.retirementRepository.upsert(userId, dto);
  }

  async find(userId: string) {
    const retirement = await this.retirementRepository.findByUser(userId);
    if (!retirement) {
      throw new NotFoundException(`No retirement plan found for this user`);
    }
    return retirement;
  }

  async remove(userId: string) {
    await this.find(userId);
    return this.retirementRepository.remove(userId);
  }
}