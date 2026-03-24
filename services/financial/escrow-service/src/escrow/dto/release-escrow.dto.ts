import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReleaseEscrowDto {
  @ApiProperty({ description: 'Reason for release' })
  @IsString()
  @MinLength(1)
  reason: string;
}
