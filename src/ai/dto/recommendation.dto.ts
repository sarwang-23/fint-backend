import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecommendationDto {
  @ApiProperty({ description: 'ID of the user', example: 'cuid123456789' })
  @IsString()
  @IsOptional()
  userId?: string;
}
