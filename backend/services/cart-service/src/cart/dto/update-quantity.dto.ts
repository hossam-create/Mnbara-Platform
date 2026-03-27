import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateQuantityDto {
  @ApiProperty({ example: 2, minimum: 0, description: 'Set to 0 to remove item' })
  @IsInt()
  @Min(0)
  quantity: number;
}
