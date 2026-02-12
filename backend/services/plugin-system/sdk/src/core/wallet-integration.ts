/**
 * Wallet Integration
 * 
 * Wallet integration utilities for MNBara plugins
 */

import { 
  WalletProvider, 
  WalletAccount, 
  WalletEvent, 
  SupportedChain, 
  ChainEvent,
  WalletPermissions,
  ChainInfo,
  TransactionRequest,
  TransactionResponse,
  SignatureRequest,
  SignatureResponse,
  WalletState,
  ConnectionStatus,
  WalletError
} from '../types/wallet-types';
import { HookSystem, HookType } from './hook-system';
import { PluginContext } from '../types/plugin-types';

export interface WalletIntegration {
  // Connection management
  connect: (provider?: WalletProvider) => Promise<WalletAccount>;
  disconnect: () => Promise<void>;
  isConnected: () => boolean;
  getConnectionStatus: () => ConnectionStatus;
  
  // Account management
  getAccount: () => WalletAccount | null;
  getAccounts: () => WalletAccount[];
  switchAccount: (address: string) => Promise<WalletAccount>;
  
  // Chain management
  getChain: () => SupportedChain;
  getChainId: () => number | string;
  getChainInfo: () => ChainInfo;
  switchChain: (chain: SupportedChain) => Promise<void>;
  
  // Balance management
  getBalance: (tokenAddress?: string) => Promise<string>;
  getBalances: (tokenAddresses?: string[]) => Promise<Record<string, string>>;
  
  // Transaction management
  sendTransaction: (request: TransactionRequest) => Promise<TransactionResponse>;
  signTransaction: (request: TransactionRequest) => Promise<string>;
  estimateGas: (request: TransactionRequest) => Promise<string>;
  
  // Message signing
  signMessage: (message: string) => Promise<SignatureResponse>;
  signTypedData: (data: any) => Promise<SignatureResponse>;
  
  // Event handling
  on: (event: WalletEvent | string, handler: (event: any) => void) => void;
  off: (event: WalletEvent | string, handler?: (event: any) => void) => void;
  emit: (event: WalletEvent | string, data?: any) => void;
  
  // Permissions
  requestPermissions: (permissions: WalletPermissions) => Promise<boolean>;
  getPermissions: () => WalletPermissions;
  hasPermission: (permission: string) => boolean;
  
  // State management
  getState: () => WalletState;
  subscribe: (callback: (state: WalletState) => void) => () => void;
  
  // Error handling
  getLastError: () => WalletError | null;
  clearError: () => void;
}

export interface WalletIntegrationOptions {
  hookSystem?: HookSystem;
  autoConnect?: boolean;
  preferredProvider?: WalletProvider;
  enableEventEmission?: boolean;
  enableHookIntegration?: boolean;
  enableStatePersistence?: boolean;
  permissions?: WalletPermissions;
}

export class DefaultWalletIntegration implements WalletIntegration {
  private id: string;
  private account: WalletAccount | null = null;
  private chain: SupportedChain = 'ethereum';
  private chainId: number | string = 1;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private hookSystem?: HookSystem;
  private eventHandlers: Map<string, Set<(event: any) => void>> = new Map();
  private stateSubscribers: Set<(state: WalletState) => void> = new Set();
  private lastError: WalletError | null = null;
  private permissions: WalletPermissions = {
    read: true,
    write: false,
    sign: false,
    admin: false
  };

  constructor(
    private pluginContext: PluginContext,
    private options: WalletIntegrationOptions = {}
  ) {
    this.id = pluginContext.id || 'default-wallet';
    this.hookSystem = options.hookSystem;
    
    if (options.enableHookIntegration && this.hookSystem) {
      this.setupHookIntegration();
    }
    
    if (options.autoConnect) {
      this.autoConnect();
    }
  }

  async connect(provider?: WalletProvider): Promise<WalletAccount> {
    try {
      this.connectionStatus = 'connecting';
      this.emitStateChange();
      
      // Simulate wallet connection
      const account: WalletAccount = {
        address: '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        chain: this.chain,
        chainId: Number(this.chainId),
        balance: '0',
        provider: provider?.id || 'metamask'
      };
      
      this.account = account;
      this.connectionStatus = 'connected';
      
      // Emit events
      this.emit('connected', { account });
      
      if (this.hookSystem && this.options.enableHookIntegration) {
        await this.hookSystem.emit(HookType.WALLET_CONNECTED, { account });
      }
      
      this.emitStateChange();
      return account;
      
    } catch (error) {
      this.connectionStatus = 'disconnected';
      this.lastError = {
        code: 'CONNECTION_FAILED',
        message: error instanceof Error ? error.message : 'Connection failed',
        details: error
      };
      
      this.emitStateChange();
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected()) {
      return;
    }
    
    const previousAccount = this.account;
    this.account = null;
    this.connectionStatus = 'disconnected';
    
    // Emit events
    this.emit('disconnected', { account: previousAccount });
    
    if (this.hookSystem && this.options.enableHookIntegration) {
      await this.hookSystem.emit(HookType.WALLET_DISCONNECTED, { account: previousAccount });
    }
    
    this.emitStateChange();
  }

  isConnected(): boolean {
    return this.connectionStatus === 'connected' && this.account !== null;
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  getAccount(): WalletAccount | null {
    return this.account;
  }

  getAccounts(): WalletAccount[] {
    return this.account ? [this.account] : [];
  }

  async switchAccount(address: string): Promise<WalletAccount> {
    if (!this.isConnected()) {
      throw new Error('Wallet not connected');
    }
    
    const newAccount: WalletAccount = {
      ...this.account!,
      address
    };
    
    this.account = newAccount;
    
    // Emit events
    this.emit('account-changed', { account: newAccount });
    
    if (this.hookSystem && this.options.enableHookIntegration) {
      await this.hookSystem.emit(HookType.WALLET_ACCOUNT_CHANGED, { 
        previousAccount: this.account,
        newAccount 
      });
    }
    
    this.emitStateChange();
    return newAccount;
  }

  getChain(): SupportedChain {
    return this.chain;
  }

  getChainId(): number | string {
    return this.chainId;
  }

  getChainInfo(): ChainInfo {
    return {
      chainId: Number(this.chainId),
      name: this.getChainName(this.chain),
      nativeCurrency: this.getNativeCurrency(this.chain),
      rpcUrls: this.getRpcUrls(this.chain),
      blockExplorerUrls: this.getBlockExplorerUrls(this.chain)
    };
  }

  async switchChain(chain: SupportedChain): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Wallet not connected');
    }
    
    const previousChain = this.chain;
    const previousChainId = this.chainId;
    
    this.chain = chain;
    this.chainId = this.getChainIdForChain(chain);
    
    if (this.account) {
      this.account.chain = chain;
      this.account.chainId = this.chainId;
    }
    
    // Emit events
    this.emit('chain-changed', { 
      previousChain, 
      newChain: chain,
      previousChainId,
      newChainId: this.chainId
    });
    
    if (this.hookSystem && this.options.enableHookIntegration) {
      const chainEvent: ChainEvent = {
        type: 'chain-change',
        timestamp: new Date(),
        walletId: this.id,
        chain: this.chain,
        data: {
          from: previousChain,
          to: this.chain,
          chainId: this.chainId
        },
        chainInfo: {
          from: previousChain,
          to: this.chain,
          chainId: Number(this.chainId),
          nativeCurrency: this.getNativeCurrency(this.chain)
        }
      };
      
      await this.hookSystem.emit(HookType.WALLET_CHAIN_CHANGED, chainEvent);
    }
    
    this.emitStateChange();
  }

  async getBalance(tokenAddress?: string): Promise<string> {
    if (!this.isConnected()) {
      throw new Error('Wallet not connected');
    }
    
    // Simulate balance fetch
    const balance = Math.random() * 100;
    return balance.toFixed(18);
  }

  async getBalances(tokenAddresses?: string[]): Promise<Record<string, string>> {
    if (!this.isConnected()) {
      throw new Error('Wallet not connected');
    }
    
    const balances: Record<string, string> = {};
    
    // Native token balance
    balances['native'] = await this.getBalance();
    
    // Token balances
    if (tokenAddresses) {
      for (const tokenAddress of tokenAddresses) {
        balances[tokenAddress] = await this.getBalance(tokenAddress);
      }
    }
    
    return balances;
  }

  async sendTransaction(request: TransactionRequest): Promise<TransactionResponse> {
    if (!this.isConnected()) {
      throw new Error('Wallet not connected');
    }
    
    if (!this.hasPermission('write')) {
      throw new Error('Insufficient permissions to send transactions');
    }
    
    // Simulate transaction
    const response: TransactionResponse = {
      hash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      from: this.account!.address,
      to: request.to,
      value: request.value || '0',
      data: request.data || '0x',
      gasPrice: request.gasPrice || '20000000000',
      gas: request.gas || '21000',
      nonce: Math.floor(Math.random() * 1000),
      chainId: Number(this.chainId),
      type: 0,
      confirmations: 0,
      timestamp: Date.now(),
      status: 'pending'
    };
    
    // Emit events
    this.emit('transaction-sent', { transaction: response });
    
    if (this.hookSystem && this.options.enableHookIntegration) {
      await this.hookSystem.emit(HookType.WALLET_TRANSACTION_SENT, { transaction: response });
    }
    
    // Simulate confirmation after delay
    setTimeout(async () => {
      response.status = 'confirmed';
      response.blockNumber = Math.floor(Math.random() * 1000000);
      response.blockHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
      
      this.emit('transaction-confirmed', { transaction: response });
      
      if (this.hookSystem && this.options.enableHookIntegration) {
        await this.hookSystem.emit(HookType.WALLET_TRANSACTION_CONFIRMED, { transaction: response });
      }
    }, 2000);
    
    return response;
  }

  async signTransaction(request: TransactionRequest): Promise<string> {
    if (!this.isConnected()) {
      throw new Error('Wallet not connected');
    }
    
    if (!this.hasPermission('sign')) {
      throw new Error('Insufficient permissions to sign transactions');
    }
    
    // Simulate transaction signing
    return '0x' + Array.from({length: 130}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  async estimateGas(request: TransactionRequest): Promise<string> {
    if (!this.isConnected()) {
      throw new Error('Wallet not connected');
    }
    
    // Simulate gas estimation
    return '21000';
  }

  async signMessage(message: string): Promise<SignatureResponse> {
    if (!this.isConnected()) {
      throw new Error('Wallet not connected');
    }
    
    if (!this.hasPermission('sign')) {
      throw new Error('Insufficient permissions to sign messages');
    }
    
    // Simulate message signing
    const signature: SignatureResponse = {
      signature: '0x' + Array.from({length: 130}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      address: this.account!.address,
      message: message,
      chain: this.chain,
      chainId: this.chainId,
      provider: this.account!.provider
    };
    
    return signature;
  }

  async signTypedData(data: any): Promise<SignatureResponse> {
    if (!this.isConnected()) {
      throw new Error('Wallet not connected');
    }
    
    if (!this.hasPermission('sign')) {
      throw new Error('Insufficient permissions to sign typed data');
    }
    
    // Simulate typed data signing
    return this.signMessage(JSON.stringify(data));
  }

  on(event: WalletEvent | string, handler: (event: any) => void): void {
    const eventKey = typeof event === 'string' ? event : event.type;
    if (!this.eventHandlers.has(eventKey)) {
      this.eventHandlers.set(eventKey, new Set());
    }
    this.eventHandlers.get(eventKey)!.add(handler);
  }

  off(event: WalletEvent | string, handler?: (event: any) => void): void {
    const eventKey = typeof event === 'string' ? event : event.type;
    if (!handler) {
      this.eventHandlers.delete(eventKey);
      return;
    }
    
    const handlers = this.eventHandlers.get(eventKey);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(eventKey);
      }
    }
  }

  emit(event: WalletEvent | string, data?: any): void {
    const eventKey = typeof event === 'string' ? event : event.type;
    const handlers = this.eventHandlers.get(eventKey);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in wallet event handler:', error);
        }
      }
    }
  }

  async requestPermissions(permissions: WalletPermissions): Promise<boolean> {
    // Simulate permission request
    this.permissions = { ...this.permissions, ...permissions };
    return true;
  }

  getPermissions(): WalletPermissions {
    return { ...this.permissions };
  }

  hasPermission(permission: string): boolean {
    return this.permissions[permission as keyof WalletPermissions] === true;
  }

  getState(): WalletState {
    return {
      account: this.account,
      chain: this.chain,
      chainId: this.chainId,
      connectionStatus: this.connectionStatus,
      permissions: this.permissions,
      lastError: this.lastError
    };
  }

  subscribe(callback: (state: WalletState) => void): () => void {
    this.stateSubscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.stateSubscribers.delete(callback);
    };
  }

  getLastError(): WalletError | null {
    return this.lastError;
  }

  clearError(): void {
    this.lastError = null;
  }

  private setupHookIntegration(): void {
    if (!this.hookSystem) return;
    
    // Listen for wallet-related hooks and emit corresponding events
    this.hookSystem.on(HookType.WALLET_CONNECTED, async (event) => {
      this.emit('connected', event.payload);
    });
    
    this.hookSystem.on(HookType.WALLET_DISCONNECTED, async (event) => {
      this.emit('disconnected', event.payload);
    });
    
    this.hookSystem.on(HookType.WALLET_ACCOUNT_CHANGED, async (event) => {
      this.emit('account-changed', event.payload);
    });
    
    this.hookSystem.on(HookType.WALLET_CHAIN_CHANGED, async (event) => {
      this.emit('chain-changed', event.payload);
    });
  }

  private async autoConnect(): Promise<void> {
    try {
      await this.connect(this.options.preferredProvider);
    } catch (error) {
      console.warn('Auto-connect failed:', error);
    }
  }

  private emitStateChange(): void {
    const state = this.getState();
    for (const subscriber of this.stateSubscribers) {
      try {
        subscriber(state);
      } catch (error) {
        console.error('Error in wallet state subscriber:', error);
      }
    }
  }

  private getChainName(chain: SupportedChain): string {
    const chainNames: Record<SupportedChain, string> = {
      ethereum: 'Ethereum',
      polygon: 'Polygon',
      arbitrum: 'Arbitrum',
      optimism: 'Optimism',
      'binance-smart-chain': 'Binance Smart Chain',
      avalanche: 'Avalanche',
      fantom: 'Fantom',
      solana: 'Solana',
      bitcoin: 'Bitcoin',
      litecoin: 'Litecoin',
      dogecoin: 'Dogecoin',
      cardano: 'Cardano',
      polkadot: 'Polkadot',
      cosmos: 'Cosmos',
      terra: 'Terra',
      near: 'Near',
      algorand: 'Algorand',
      tezos: 'Tezos',
      flow: 'Flow',
      hedera: 'Hedera',
      stellar: 'Stellar',
      ripple: 'Ripple',
      tron: 'Tron',
      eos: 'EOS',
      other: 'Other'
    };
    
    return chainNames[chain] || chain;
  }

  private getNativeCurrency(chain: SupportedChain) {
    const currencies: Record<SupportedChain, { name: string; symbol: string; decimals: number }> = {
      ethereum: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      polygon: { name: 'Matic', symbol: 'MATIC', decimals: 18 },
      arbitrum: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      optimism: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      'binance-smart-chain': { name: 'Binance Coin', symbol: 'BNB', decimals: 18 },
      avalanche: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
      fantom: { name: 'Fantom', symbol: 'FTM', decimals: 18 },
      solana: { name: 'Solana', symbol: 'SOL', decimals: 9 },
      bitcoin: { name: 'Bitcoin', symbol: 'BTC', decimals: 8 },
      litecoin: { name: 'Litecoin', symbol: 'LTC', decimals: 8 },
      dogecoin: { name: 'Dogecoin', symbol: 'DOGE', decimals: 8 },
      cardano: { name: 'Cardano', symbol: 'ADA', decimals: 6 },
      polkadot: { name: 'Polkadot', symbol: 'DOT', decimals: 10 },
      cosmos: { name: 'Cosmos', symbol: 'ATOM', decimals: 6 },
      terra: { name: 'Terra', symbol: 'LUNA', decimals: 6 },
      near: { name: 'Near', symbol: 'NEAR', decimals: 24 },
      algorand: { name: 'Algorand', symbol: 'ALGO', decimals: 6 },
      tezos: { name: 'Tezos', symbol: 'XTZ', decimals: 6 },
      flow: { name: 'Flow', symbol: 'FLOW', decimals: 8 },
      hedera: { name: 'Hedera', symbol: 'HBAR', decimals: 8 },
      stellar: { name: 'Stellar', symbol: 'XLM', decimals: 7 },
      ripple: { name: 'Ripple', symbol: 'XRP', decimals: 6 },
      tron: { name: 'Tron', symbol: 'TRX', decimals: 6 },
      eos: { name: 'EOS', symbol: 'EOS', decimals: 4 },
      other: { name: 'Unknown', symbol: 'UNKNOWN', decimals: 18 }
    };
    
    return currencies[chain] || { name: 'Unknown', symbol: 'UNKNOWN', decimals: 18 };
  }

  private getRpcUrls(chain: SupportedChain): string[] {
    const rpcUrls: Record<SupportedChain, string[]> = {
      ethereum: ['https://eth-mainnet.g.alchemy.com/v2/demo'],
      polygon: ['https://polygon-rpc.com'],
      arbitrum: ['https://arb1.arbitrum.io/rpc'],
      optimism: ['https://mainnet.optimism.io'],
      'binance-smart-chain': ['https://bsc-dataseed.binance.org'],
      avalanche: ['https://api.avax.network/ext/bc/C/rpc'],
      fantom: ['https://rpc.ftm.tools'],
      solana: ['https://api.mainnet-beta.solana.com'],
      bitcoin: ['https://blockstream.info/api'],
      litecoin: ['https://litecoinspace.org/api'],
      dogecoin: ['https://dogechain.info/api'],
      cardano: ['https://cardano-mainnet.blockfrost.io/api/v0'],
      polkadot: ['https://rpc.polkadot.io'],
      cosmos: ['https://rpc.cosmos.network'],
      terra: ['https://terra-rpc.publicnode.com'],
      near: ['https://rpc.mainnet.near.org'],
      algorand: ['https://mainnet-api.algonode.cloud'],
      tezos: ['https://mainnet.api.tez.ie'],
      flow: ['https://rest-mainnet.onflow.org'],
      hedera: ['https://mainnet.hashio.io/api'],
      stellar: ['https://horizon.stellar.org'],
      ripple: ['https://s1.ripple.com:51234'],
      tron: ['https://api.trongrid.io'],
      eos: ['https://eos.greymass.com'],
      other: ['https://api.example.com']
    };
    
    return rpcUrls[chain] || [];
  }

  private getBlockExplorerUrls(chain: SupportedChain): string[] {
    const explorerUrls: Record<SupportedChain, string[]> = {
      ethereum: ['https://etherscan.io'],
      polygon: ['https://polygonscan.com'],
      arbitrum: ['https://arbiscan.io'],
      optimism: ['https://optimistic.etherscan.io'],
      'binance-smart-chain': ['https://bscscan.com'],
      avalanche: ['https://snowtrace.io'],
      fantom: ['https://ftmscan.com'],
      solana: ['https://explorer.solana.com'],
      bitcoin: ['https://blockstream.info'],
      litecoin: ['https://litecoinspace.org'],
      dogecoin: ['https://dogechain.info'],
      cardano: ['https://cardanoscan.io'],
      polkadot: ['https://polkadot.subscan.io'],
      cosmos: ['https://mintscan.io/cosmos'],
      terra: ['https://finder.terra.money'],
      near: ['https://explorer.near.org'],
      algorand: ['https://algoexplorer.io'],
      tezos: ['https://tzstats.com'],
      flow: ['https://flowscan.org'],
      hedera: ['https://hashscan.io'],
      stellar: ['https://stellar.expert'],
      ripple: ['https://xrpscan.com'],
      tron: ['https://tronscan.org'],
      eos: ['https://eosauthority.com'],
      other: ['https://explorer.example.com']
    };
    
    return explorerUrls[chain] || [];
  }

  private getChainIdForChain(chain: SupportedChain): number | string {
    const chainIds: Record<SupportedChain, number | string> = {
      ethereum: 1,
      polygon: 137,
      arbitrum: 42161,
      optimism: 10,
      'binance-smart-chain': 56,
      avalanche: 43114,
      fantom: 250,
      solana: 'mainnet-beta',
      bitcoin: 'mainnet',
      litecoin: 'mainnet',
      dogecoin: 'mainnet',
      cardano: 'mainnet',
      polkadot: 'polkadot',
      cosmos: 'cosmoshub-4',
      terra: 'phoenix-1',
      near: 'mainnet',
      algorand: 'mainnet-v1.0',
      tezos: 'mainnet',
      flow: 'mainnet',
      hedera: 'mainnet',
      stellar: 'public',
      ripple: 'mainnet',
      tron: 'mainnet',
      eos: 'mainnet',
      other: 'unknown'
    };
    
    return chainIds[chain] || 1;
  }
}