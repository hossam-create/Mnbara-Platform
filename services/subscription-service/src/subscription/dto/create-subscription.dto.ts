import { IsNotEmpty, IsString, IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({ example: 'user-uuid-123', description: 'User ID' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    example: 'seller-basic',
    description: 'Subscription plan',
    enum: ['free', 'basic', 'seller-basic', 'seller-pro', 'premium'],
  })
  @IsString()
  @IsIn(['free', 'basic', 'seller-basic', 'seller-pro', 'premium'])
  plan: string;

  @ApiPropertyOptional({ example: 1, description: 'Duration in months (1-12)', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  durationMonths?: number = 1;
}
