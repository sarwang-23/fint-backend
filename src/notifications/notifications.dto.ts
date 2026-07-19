import { IsString, IsOptional, IsEnum } from 'class-validator';
import { NotificationType } from '@prisma/client';

// Internal shape used when other modules (auth, score, etc.) trigger a
// notification — not exposed as a public "create notification" endpoint,
// since notifications are system-generated, not user-authored.
export class CreateNotificationDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsString()
  title: string;

  @IsString()
  message: string;
}
