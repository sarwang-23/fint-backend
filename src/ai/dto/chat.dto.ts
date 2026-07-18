import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatDto {
  @ApiProperty({ description: 'User message', example: 'Should I buy a car worth ₹12 lakh?' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ description: 'Optional conversation ID to continue a multi-turn session', required: false })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiProperty({ description: 'Preferred response language', example: 'en', required: false })
  @IsOptional()
  @IsString()
  language?: string;
}
