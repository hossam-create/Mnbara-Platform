/**
 * Dispute DTOs
 * Requirements: 12.3, 12.4, 17.3 - Dispute resolution data transfer objects
 */

import { IsString, IsEnum, IsNumber, IsOptional, Min, Max, IsNotEmpty } from 'class-validator';

export enum DisputeStatus {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  ESCALATED = 'escalated',
  RESOLVED = 'resolved',
}

export enum DisputePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum ResolutionOutcome {
  REFUND_BUYER = 'refund_buyer',
  RELEASE_SELLER = 'release_seller',
  PARTIAL_REFUND = 'partial_refund',
  NO_ACTION = 'no_action',
}

export class UpdateDisputeStatusDto {
  @IsEnum(DisputeStatus)
  status: DisputeStatus;
}

export class ResolveDisputeDto {
  @IsEnum(ResolutionOutcome)
  outcome: ResolutionOutcome;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsString()
  @IsNotEmpty()
  notes: string;
}

export class AddMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class DisputeFiltersDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;

  @IsOptional()
  @IsEnum(DisputePriority)
  priority?: DisputePriority;

  @IsOptional()
  @IsString()
  search?: string;
}

export class EscrowReleaseDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;
}

export class EscrowRefundDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;
}
