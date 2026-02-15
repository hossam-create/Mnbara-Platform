import { TransactionResponse, TransactionReceipt } from 'ethers';

export interface BlockchainConfig {
  rpcUrl: string;
  chainId: number;
  privateKey?: string;
  contractAddress?: string;
}

export interface TransactionRequest {
  to: string;
  value?: string;
  data?: string;
  gasLimit?: number;
  gasPrice?: string;
  nonce?: number;
}

export interface BlockchainTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasLimit: bigint;
  gasPrice?: bigint;
  nonce: number;
  data?: string;
  chainId: number;
}

export interface TransactionReceiptWithStatus extends TransactionReceipt {
  status: number;
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;
  confirmations: number;
}

export interface BlockchainBalance {
  address: string;
  balance: string; // in ETH
  balanceWei: bigint; // in Wei
  formattedBalance: string; // formatted string
}

export interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  estimatedCost: string; // in ETH
  estimatedCostWei: bigint; // in Wei
}

export interface BlockchainNetworkInfo {
  chainId: number;
  networkName: string;
  blockNumber: number;
  gasPrice: string;
  isTestnet: boolean;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface WalletInfo {
  address: string;
  publicKey?: string;
  privateKey?: string; // Should be handled with extreme care
  mnemonic?: string; // Should be handled with extreme care
  balance: BlockchainBalance;
  nonce: number;
  isConnected: boolean;
}

export interface SmartContractCall {
  contractAddress: string;
  functionName: string;
  args: any[];
  value?: string;
  gasLimit?: number;
}

export interface SmartContractCallResult {
  success: boolean;
  result?: any;
  error?: string;
  gasUsed?: bigint;
  transactionHash?: string;
}

export interface EventFilter {
  address?: string;
  topics?: string[];
  fromBlock?: number | string;
  toBlock?: number | string;
}

export interface BlockchainEvent {
  eventName: string;
  args: any;
  address: string;
  transactionHash: string;
  blockNumber: number;
  blockHash: string;
  logIndex: number;
  transactionIndex: number;
}

export interface TransactionStatus {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed' | 'replaced';
  blockNumber?: number;
  confirmations: number;
  timestamp?: number;
  gasUsed?: bigint;
  effectiveGasPrice?: bigint;
}

export interface FeeData {
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  lastBaseFeePerGas?: bigint;
}

export interface BlockchainHealth {
  isConnected: boolean;
  latestBlock: number;
  peerCount?: number;
  syncStatus?: {
    currentBlock: number;
    highestBlock: number;
    startingBlock: number;
  };
  chainId: number;
  networkName: string;
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  balance?: string;
}

export interface TokenTransfer {
  from: string;
  to: string;
  value: string;
  tokenAddress: string;
  tokenSymbol: string;
  decimals: number;
}

export interface BlockchainError extends Error {
  code?: string;
  reason?: string;
  transaction?: {
    hash?: string;
    from?: string;
    to?: string;
    value?: string;
  };
  receipt?: TransactionReceipt;
  action?: string;
}

export type NetworkType = 'mainnet' | 'testnet' | 'local' | 'custom';

export interface NetworkConfig {
  type: NetworkType;
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  isTestnet: boolean;
}

export const NETWORKS: Record<string, NetworkConfig> = {
  mainnet: {
    type: 'mainnet',
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: 'https://mainnet.infura.io/v3/',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: false,
  },
  sepolia: {
    type: 'testnet',
    name: 'Sepolia Testnet',
    chainId: 11155111,
    rpcUrl: 'https://sepolia.infura.io/v3/',
    explorerUrl: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: true,
  },
  local: {
    type: 'local',
    name: 'Local Development',
    chainId: 1337,
    rpcUrl: 'http://localhost:8545',
    explorerUrl: '',
    nativeCurrency: {
      name: 'Local Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    isTestnet: true,
  },
} as const;