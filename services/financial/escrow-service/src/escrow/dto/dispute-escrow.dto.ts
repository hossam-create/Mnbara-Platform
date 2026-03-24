import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DisputeEscrowDto {
  @ApiProperty({ description: 'Dispute reason' })
  @IsString()
  @MinLength(1)
  reason: string;

  @ApiProperty({ description: 'Dispute description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Evidence URL or details', required: false })
  @IsString()
  @IsOptional()
  evidence?: string;
}
