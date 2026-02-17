import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LedgerReason, ReferenceType } from '../types';

export enum EscrowStatus {
  CREATED = 'CREATED',
  FUNDED = 'FUNDED',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED',
  CANCELLED = 'CANCELLED',
}

export enum EscrowReferenceType {
  ORDER = 'ORDER',
  AUCTION = 'AUCTION',
  DISPUTE = 'DISPUTE',
  SYSTEM = 'SYSTEM',
}

// Base DTO for all escrow operations
export class BaseEscrowDto {
  @ApiProperty({ description: 'Unique identifier for the escrow' })
  @IsUUID()
  @IsNotEmpty()
  escrowId!: string;
}

// Create Escrow Request DTO
export class CreateEscrowRequestDto {
  @ApiProperty({ description: 'Buyer wallet ID' })
  @IsUUID()
  @IsNotEmpty()
  buyerWalletId!: string;

  @ApiProperty({ description: 'Seller wallet ID' })
  @IsUUID()
  @IsNotEmpty()
  sellerWalletId!: string;

  @ApiProperty({ description: 'Escrow amount' })
  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @ApiProperty({ description: 'Currency code' })
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @ApiProperty({ description: 'Reference type for the escrow' })
  @IsEnum(EscrowReferenceType)
  @IsNotEmpty()
  referenceType!: EscrowReferenceType;

  @ApiProperty({ description: 'Reference ID (e.g., order ID)' })
  @IsString()
  @IsNotEmpty()
  referenceId!: string;

  @ApiProperty({ description: 'Description of the escrow' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'System wallet ID for holding funds' })
  @IsUUID()
  @IsNotEmpty()
  systemWalletId!: string;
}

// Create and Fund Escrow Request DTO
export class CreateAndFundEscrowRequestDto extends CreateEscrowRequestDto {
  @ApiProperty({ description: 'Reason for the transfer' })
  @IsEnum(LedgerReason)
  @IsOptional()
  reason?: LedgerReason;

  @ApiProperty({ description: 'User ID creating the escrow' })
  @IsUUID()
  @IsNotEmpty()
  createdBy!: string;
}

// Fund Escrow Request DTO
export class FundEscrowRequestDto extends BaseEscrowDto {
  @ApiProperty({ description: 'User ID funding the escrow' })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ description: 'Reason for funding' })
  @IsEnum(LedgerReason)
  @IsOptional()
  reason?: LedgerReason;

  @ApiProperty({ description: 'Description of the funding' })
  @IsString()
  @IsOptional()
  description?: string;
}

// Release Escrow Request DTO
export class ReleaseEscrowRequestDto extends BaseEscrowDto {
  @ApiProperty({ description: 'User ID releasing the escrow' })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ description: 'Reason for release' })
  @IsEnum(LedgerReason)
  @IsOptional()
  reason?: LedgerReason;

  @ApiProperty({ description: 'Description of the release' })
  @IsString()
  @IsOptional()
  description?: string;
}

// Refund Escrow Request DTO
export class RefundEscrowRequestDto extends BaseEscrowDto {
  @ApiProperty({ description: 'User ID requesting refund' })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ description: 'Reason for refund' })
  @IsEnum(LedgerReason)
  @IsOptional()
  reason?: LedgerReason;

  @ApiProperty({ description: 'Description of the refund' })
  @IsString()
  @IsOptional()
  description?: string;
}

// Dispute Escrow Request DTO
export class DisputeEscrowRequestDto extends BaseEscrowDto {
  @ApiProperty({ description: 'User ID disputing the escrow' })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ description: 'Reason for the dispute' })
  @IsString()
  @IsNotEmpty()
  disputeReason!: string;

  @ApiProperty({ description: 'Description of the dispute' })
  @IsString()
  @IsOptional()
  description?: string;
}

// Escrow Response DTOs
export class EscrowResponseDto {
  @ApiProperty({ description: 'Escrow ID' })
  escrowId!: string;

  @ApiProperty({ description: 'Buyer wallet ID' })
  buyerWalletId!: string;

  @ApiProperty({ description: 'Seller wallet ID' })
  sellerWalletId!: string;

  @ApiProperty({ description: 'System wallet ID holding funds' })
  systemWalletId!: string;

  @ApiProperty({ description: 'Escrow amount' })
  amount!: string;

  @ApiProperty({ description: 'Currency code' })
  currency!: string;

  @ApiProperty({ description: 'Current escrow status' })
  status!: EscrowStatus;

  @ApiProperty({ description: 'Reference type' })
  referenceType!: EscrowReferenceType;

  @ApiProperty({ description: 'Reference ID' })
  referenceId!: string;

  @ApiProperty({ description: 'Description' })
  description?: string;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt!: Date;

  @ApiProperty({ description: 'Dispute reason (if disputed)' })
  disputeReason?: string;

  @ApiProperty({ description: 'Dispute details (if disputed)' })
  disputeDetails?: string;
}

// Transfer Response DTO (for fund/release operations)
export class EscrowTransferResponseDto {
  @ApiProperty({ description: 'Transfer ID' })
  transferId!: string;

  @ApiProperty({ description: 'From entry details' })
  fromEntry!: {
    entryId: string;
    walletId: string;
    balanceBefore: string;
    balanceAfter: string;
  };

  @ApiProperty({ description: 'To entry details' })
  toEntry!: {
    entryId: string;
    walletId: string;
    balanceBefore: string;
    balanceAfter: string;
  };

  @ApiProperty({ description: 'Transfer amount' })
  amount!: string;

  @ApiProperty({ description: 'Currency code' })
  currency!: string;

  @ApiProperty({ description: 'Transfer reason' })
  reason!: string;

  @ApiProperty({ description: 'Reference type' })
  referenceType!: string;

  @ApiProperty({ description: 'Reference ID' })
  referenceId?: string;

  @ApiProperty({ description: 'Idempotency key' })
  idempotencyKey!: string;

  @ApiProperty({ description: 'Transfer timestamp' })
  createdAt!: string;

  @ApiProperty({ description: 'Whether this was idempotent' })
  isIdempotent!: boolean;
}