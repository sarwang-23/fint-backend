import { Module } from '@nestjs/common';
import { AssetService } from './asset.service';
import { AssetController } from './asset.controller';
import { AssetRepository } from './asset.repository';

@Module({
  controllers: [AssetController],
  providers: [AssetService, AssetRepository],
  exports: [AssetService],
})
export class AssetModule {}
