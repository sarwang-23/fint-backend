import { IsString, IsEnum, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';
import { AssetType } from '@prisma/client';

export class CreateAssetDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(AssetType)
  assetType?: AssetType;

  @IsNumber()
  @Min(0)
  purchaseValue: number;

  @IsNumber()
  @Min(0)
  currentValue: number;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

