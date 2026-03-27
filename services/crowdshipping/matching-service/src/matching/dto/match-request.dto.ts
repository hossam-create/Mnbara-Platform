import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MatchRequestDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  orderId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  tripId: number;
}
