/**
 * Wallet Integration Types
 * 
 * Type definitions for wallet integration in MNBara plugins
 */

/**
 * Supported blockchain chains
 */
export type SupportedChain = 
  | 'ethereum'
  | 'polygon'
  | 'arbitrum'
  | 'optimism'
  | 'binance-smart-chain'
  | 'avalanche'
  | 'fantom'
  | 'solana'
  | 'bitcoin'
  | 'litecoin'
  | 'dogecoin'
  | 'cardano'
  | 'polkadot'
  | 'cosmos'
  | 'terra'
  | 'near'
  | 'algorand'
  | 'tezos'
  | 'flow'
  | 'hedera'
  | 'stellar'
  | 'ripple'
  | 'tron'
  | 'eos'
  | 'other';

/**
 * Transaction types
 */
export type TransactionType = 
  | 'transfer'
  | 'contract-interaction'
  | 'token-transfer'
  | 'nft-transfer'
  | 'swap'
  | 'stake'
  | 'unstake'
  | 'claim'
  | 'mint'
  | 'burn'
  | 'approve'
  | 'revoke'
  | 'other';

/**
 * Wallet features
 */
export type WalletFeature =
  | 'connect'
  | 'disconnect'
  | 'sign-message'
  | 'sign-transaction'
  | 'send-transaction'
  | 'get-balance'
  | 'get-address'
  | 'switch-chain'
  | 'add-chain'
  | 'watch-asset'
  | 'get-ens-name'
  | 'resolve-ens'
  | 'get-nfts'
  | 'get-tokens'
  | 'stake'
  | 'unstake'
  | 'swap'
  | 'bridge'
  | 'other';

/**
 * Wallet provider information
 */
export interface WalletProvider {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  homepage?: string;
  chains: SupportedChain[];
  features: WalletFeature[];
  isInstalled: () => boolean;
  isConnected: () => boolean;
  installUrl?: string;
  deepLink?: string;
  mobile?: {
    native?: string;
    universal?: string;
  };
  desktop?: {
    native?: string;
    universal?: string;
  };
}

/**
 * Base wallet event
 */
export interface WalletEvent {
  type: string;
  timestamp: Date;
  walletId: string;
  chain: SupportedChain;
  data: Record<string, any>;
}

/**
 * Transaction event
 */
export interface TransactionEvent extends WalletEvent {
  type: 'transaction';
  transaction: {
    hash: string;
    from: string;
    to?: string;
    value?: string;
    data?: string;
    gas?: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    nonce?: number;
    chainId: number;
    type: TransactionType;
    status: 'pending' | 'confirmed' | 'failed' | 'dropped';
    blockNumber?: number;
    blockHash?: string;
    confirmations: number;
  };
}

/**
 * Balance event
 */
export interface BalanceEvent extends WalletEvent {
  type: 'balance';
  balance: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    value: string;
    formatted: string;
    usdValue?: string;
    chain: SupportedChain;
    contractAddress?: string;
    tokenId?: string;
    type: 'native' | 'token' | 'nft';
  };
}

/**
 * Chain change event
 */
export interface ChainEvent extends WalletEvent {
  type: 'chain-change';
  chain: SupportedChain;
  chainInfo: {
    from: SupportedChain;
    to: SupportedChain;
    chainId: number | string;
    rpcUrl?: string;
    blockExplorer?: string;
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
  };
}

/**
 * Wallet connection event
 */
export interface ConnectionEvent extends WalletEvent {
  type: 'connect' | 'disconnect';
  connection: {
    address: string;
    chainId: number;
    provider: WalletProvider;
    isReconnected: boolean;
  };
}

/**
 * Transaction request
 */
export interface TransactionRequest {
  to?: string;
  from?: string;
  value?: string;
  data?: string;
  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: number;
  chainId?: number;
  type?: number;
}

/**
 * Transaction response
 */
export interface TransactionResponse {
  hash: string;
  from: string;
  to?: string;
  value: string;
  data: string;
  gas: string;
  gasPrice: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce: number;
  chainId: number;
  type: number;
  confirmations: number;
  blockNumber?: number;
  blockHash?: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
}

/**
 * Balance request
 */
export interface BalanceRequest {
  address: string;
  chain: SupportedChain;
  contractAddress?: string;
  tokenId?: string;
  type: 'native' | 'token' | 'nft';
}

/**
 * Balance response
 */
export interface BalanceResponse {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  value: string;
  formatted: string;
  usdValue?: string;
  chain: SupportedChain;
  contractAddress?: string;
  tokenId?: string;
  type: 'native' | 'token' | 'nft';
}

/**
 * Wallet context for plugin development
 */
export interface WalletContext {
  provider: WalletProvider;
  chain: SupportedChain;
  address: string;
  isConnected: boolean;
  features: WalletFeature[];
  
  // Methods
  connect: (chain?: SupportedChain) => Promise<void>;
  disconnect: () => Promise<void>;
  switchChain: (chain: SupportedChain) => Promise<void>;
  getBalance: (request: BalanceRequest) => Promise<BalanceResponse>;
  sendTransaction: (request: TransactionRequest) => Promise<TransactionResponse>;
  signMessage: (message: string) => Promise<string>;
  signTransaction: (request: TransactionRequest) => Promise<string>;
  getAddress: () => Promise<string>;
  watchAsset: (asset: {
    type: 'ERC20' | 'ERC721' | 'ERC1155';
    options: {
      address: string;
      symbol?: string;
      decimals?: number;
      image?: string;
      tokenId?: string;
    };
  }) => Promise<boolean>;
  
  // Events
  on: (event: string, handler: (event: WalletEvent) => void) => void;
  off: (event: string, handler: (event: WalletEvent) => void) => void;
  emit: (event: string, data: WalletEvent) => void;
}

/**
 * Supported chains configuration
 */
export const SUPPORTED_CHAINS: Record<SupportedChain, {
  chainId: number | string;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  iconUrls?: string[];
}> = {
  ethereum: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://mainnet.infura.io/v3/${INFURA_API_KEY}'],
    blockExplorerUrls: ['https://etherscan.io']
  },
  polygon: {
    chainId: 137,
    name: 'Polygon Mainnet',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com']
  },
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum One',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io']
  },
  optimism: {
    chainId: 10,
    name: 'Optimism',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://mainnet.optimism.io'],
    blockExplorerUrls: ['https://optimistic.etherscan.io']
  },
  'binance-smart-chain': {
    chainId: 56,
    name: 'Binance Smart Chain',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    },
    rpcUrls: ['https://bsc-dataseed.binance.org'],
    blockExplorerUrls: ['https://bscscan.com']
  },
  avalanche: {
    chainId: 43114,
    name: 'Avalanche C-Chain',
    nativeCurrency: {
      name: 'AVAX',
      symbol: 'AVAX',
      decimals: 18
    },
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
    blockExplorerUrls: ['https://snowtrace.io']
  },
  fantom: {
    chainId: 250,
    name: 'Fantom Opera',
    nativeCurrency: {
      name: 'FTM',
      symbol: 'FTM',
      decimals: 18
    },
    rpcUrls: ['https://rpc.ftm.tools'],
    blockExplorerUrls: ['https://ftmscan.com']
  },
  solana: {
    chainId: 101,
    name: 'Solana Mainnet',
    nativeCurrency: {
      name: 'SOL',
      symbol: 'SOL',
      decimals: 9
    },
    rpcUrls: ['https://api.mainnet-beta.solana.com'],
    blockExplorerUrls: ['https://explorer.solana.com']
  },
  bitcoin: {
    chainId: 0,
    name: 'Bitcoin',
    nativeCurrency: {
      name: 'Bitcoin',
      symbol: 'BTC',
      decimals: 8
    },
    rpcUrls: ['https://blockchain.info'],
    blockExplorerUrls: ['https://blockchain.info']
  },
  litecoin: {
    chainId: 2,
    name: 'Litecoin',
    nativeCurrency: {
      name: 'Litecoin',
      symbol: 'LTC',
      decimals: 8
    },
    rpcUrls: ['https://litecoin.info'],
    blockExplorerUrls: ['https://blockchair.com/litecoin']
  },
  dogecoin: {
    chainId: 3,
    name: 'Dogecoin',
    nativeCurrency: {
      name: 'Dogecoin',
      symbol: 'DOGE',
      decimals: 8
    },
    rpcUrls: ['https://dogechain.info'],
    blockExplorerUrls: ['https://dogechain.info']
  },
  cardano: {
    chainId: 1,
    name: 'Cardano',
    nativeCurrency: {
      name: 'ADA',
      symbol: 'ADA',
      decimals: 6
    },
    rpcUrls: ['https://cardano-mainnet.blockfrost.io'],
    blockExplorerUrls: ['https://cardanoscan.io']
  },
  polkadot: {
    chainId: 0,
    name: 'Polkadot',
    nativeCurrency: {
      name: 'DOT',
      symbol: 'DOT',
      decimals: 10
    },
    rpcUrls: ['https://rpc.polkadot.io'],
    blockExplorerUrls: ['https://polkadot.subscan.io']
  },
  cosmos: {
    chainId: 'cosmoshub-4',
    name: 'Cosmos Hub',
    nativeCurrency: {
      name: 'ATOM',
      symbol: 'ATOM',
      decimals: 6
    },
    rpcUrls: ['https://rpc.cosmos.network'],
    blockExplorerUrls: ['https://atomscan.com']
  },
  terra: {
    chainId: 'phoenix-1',
    name: 'Terra',
    nativeCurrency: {
      name: 'LUNA',
      symbol: 'LUNA',
      decimals: 6
    },
    rpcUrls: ['https://phoenix-lcd.terra.dev'],
    blockExplorerUrls: ['https://finder.terra.money']
  },
  near: {
    chainId: 1313161554,
    name: 'NEAR Protocol',
    nativeCurrency: {
      name: 'NEAR',
      symbol: 'NEAR',
      decimals: 24
    },
    rpcUrls: ['https://rpc.mainnet.near.org'],
    blockExplorerUrls: ['https://explorer.near.org']
  },
  algorand: {
    chainId: 4160,
    name: 'Algorand',
    nativeCurrency: {
      name: 'ALGO',
      symbol: 'ALGO',
      decimals: 6
    },
    rpcUrls: ['https://mainnet-api.algonode.cloud'],
    blockExplorerUrls: ['https://algoexplorer.io']
  },
  tezos: {
    chainId: 0,
    name: 'Tezos',
    nativeCurrency: {
      name: 'Tezos',
      symbol: 'XTZ',
      decimals: 6
    },
    rpcUrls: ['https://mainnet.api.tez.ie'],
    blockExplorerUrls: ['https://tzkt.io']
  },
  flow: {
    chainId: 0,
    name: 'Flow',
    nativeCurrency: {
      name: 'Flow',
      symbol: 'FLOW',
      decimals: 8
    },
    rpcUrls: ['https://rest-mainnet.onflow.org'],
    blockExplorerUrls: ['https://flowscan.org']
  },
  hedera: {
    chainId: 295,
    name: 'Hedera',
    nativeCurrency: {
      name: 'HBAR',
      symbol: 'HBAR',
      decimals: 8
    },
    rpcUrls: ['https://mainnet-public.mirrornode.hedera.com'],
    blockExplorerUrls: ['https://hashscan.io']
  },
  stellar: {
    chainId: 0,
    name: 'Stellar',
    nativeCurrency: {
      name: 'Lumens',
      symbol: 'XLM',
      decimals: 7
    },
    rpcUrls: ['https://horizon.stellar.org'],
    blockExplorerUrls: ['https://stellar.expert']
  },
  ripple: {
    chainId: 0,
    name: 'Ripple',
    nativeCurrency: {
      name: 'XRP',
      symbol: 'XRP',
      decimals: 6
    },
    rpcUrls: ['https://s1.ripple.com:51234'],
    blockExplorerUrls: ['https://xrpscan.com']
  },
  tron: {
    chainId: 728126428,
    name: 'Tron',
    nativeCurrency: {
      name: 'TRON',
      symbol: 'TRX',
      decimals: 6
    },
    rpcUrls: ['https://api.trongrid.io'],
    blockExplorerUrls: ['https://tronscan.org']
  },
  eos: {
    chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
    name: 'EOS',
    nativeCurrency: {
      name: 'EOS',
      symbol: 'EOS',
      decimals: 4
    },
    rpcUrls: ['https://eos.greymass.com'],
    blockExplorerUrls: ['https://bloks.io']
  },
  other: {
    chainId: 0,
    name: 'Other',
    nativeCurrency: {
      name: 'Token',
      symbol: 'TOKEN',
      decimals: 18
    },
    rpcUrls: [],
    blockExplorerUrls: []
  }
} as const;

/**
 * Wallet account information
 */
export interface WalletAccount {
  address: string;
  chain: SupportedChain;
  chainId: number | string;
  balance: string;
  provider: string;
}

/**
 * Wallet permissions
 */
export interface WalletPermissions {
  read: boolean;
  write: boolean;
  sign: boolean;
  admin: boolean;
}

/**
 * Chain information
 */
export interface ChainInfo {
  chainId: number | string;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  iconUrls?: string[];
}

/**
 * Signature request
 */
export interface SignatureRequest {
  message: string;
  address: string;
  chain: SupportedChain;
  chainId: number | string;
  provider?: string;
}

/**
 * Signature response
 */
export interface SignatureResponse {
  signature: string;
  address: string;
  message: string;
  chain: SupportedChain;
  chainId: number | string;
  provider: string;
}

/**
 * Wallet state
 */
export interface WalletState {
  account: WalletAccount | null;
  chain: SupportedChain;
  chainId: number | string;
  connectionStatus: ConnectionStatus;
  permissions: WalletPermissions;
  lastError: WalletError | null;
}

/**
 * Connection status
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Wallet error
 */
export interface WalletError {
  code: string;
  message: string;
  details?: any;
}