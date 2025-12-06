import { BigNumberish } from 'ethers';

export interface MNBTokenConfig {
  name: string;
  symbol: string;
  initialSupply: BigNumberish;
  defaultAdmin: string;
  complianceAdmin: string;
}

export interface MNBWalletConfig {
  tokenAddress: string;
  defaultAdmin: string;
  withdrawalLimit: BigNumberish;
}

export interface MNBExchangeConfig {
  tokenAddress: string;
  defaultAdmin: string;
  initialPairs: ExchangePairConfig[];
}

export interface ExchangePairConfig {
  baseToken: string;
  quoteToken: string;
  initialPrice: BigNumberish;
  feeRate: number;
  minTradeAmount: BigNumberish;
}

export interface MNBGovernanceConfig {
  tokenAddress: string;
  defaultAdmin: string;
  name: string;
  votingDelay: number;
  votingPeriod: number;
  proposalThreshold: BigNumberish;
  quorumVotes: BigNumberish;
}

export interface MNBStakingConfig {
  tokenAddress: string;
  defaultAdmin: string;
  rewardTokenAddress: string;
  initialPools: StakingPoolConfig[];
}

export interface StakingPoolConfig {
  lockDuration: number; // in seconds
  minStakeAmount: BigNumberish;
  maxStakeAmount: BigNumberish;
  apyRate: number; // APY percentage
  penaltyRate: number; // Early withdrawal penalty percentage
}

export interface ContractAddresses {
  mnbToken: string;
  mnbWallet: string;
  mnbExchange: string;
  mnbGovernance: string;
  mnbStaking: string;
}

export interface DeploymentResult {
  contractName: string;
  address: string;
  transactionHash: string;
  blockNumber: number;
  implementationAddress?: string;
}

export interface ContractCallOptions {
  gasLimit?: number;
  gasPrice?: string;
  value?: string;
  from?: string;
}

export interface ContractEvent {
  eventName: string;
  args: any[];
  address: string;
  transactionHash: string;
  blockNumber: number;
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  balance?: string;
}

export interface WalletBalance {
  address: string;
  tokenBalance: string;
  ethBalance: string;
  totalValue: string;
}

export interface TransactionStatus {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed' | 'replaced';
  blockNumber?: number;
  confirmations: number;
  gasUsed?: bigint;
}

export interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  estimatedCost: string;
}

export interface ContractFunctionCall {
  contractAddress: string;
  functionName: string;
  args: any[];
  options?: ContractCallOptions;
}

export interface ContractReadResult {
  success: boolean;
  result?: any;
  error?: string;
}

export interface ContractWriteResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  gasUsed?: bigint;
}

export interface UpgradeableContractConfig {
  address: string;
  implementationAddress: string;
  version: string;
  upgradeTimestamp: number;
}