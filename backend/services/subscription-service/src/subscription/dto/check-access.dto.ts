import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckAccessDto {
  @ApiProperty({ example: 'user-uuid-123', description: 'User ID to check access for' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'create-product', description: 'Feature name to check' })
  @IsString()
  @IsNotEmpty()
  featureName: string;
}
