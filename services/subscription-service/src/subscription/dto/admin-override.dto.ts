import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminOverrideDto {
  @ApiProperty({ example: 'user-uuid-123', description: 'User ID to override' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'activate', enum: ['activate', 'deactivate'] })
  @IsString()
  @IsIn(['activate', 'deactivate'])
  action: 'activate' | 'deactivate';

  @ApiPropertyOptional({
    example: 'seller-basic',
    description: 'Plan to activate (only for activate action)',
    enum: ['free', 'basic', 'seller-basic', 'seller-pro', 'premium'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['free', 'basic', 'seller-basic', 'seller-pro', 'premium'])
  plan?: string;
}
