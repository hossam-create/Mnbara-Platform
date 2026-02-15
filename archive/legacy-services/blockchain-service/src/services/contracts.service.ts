import { Injectable, Logger } from '@nestjs/common';
import { ethers, Contract, JsonRpcProvider, Wallet, TransactionResponse } from 'ethers';
import { BlockchainService } from './blockchain.service';
import {
  ContractAddresses,
  ContractCallOptions,
  ContractFunctionCall,
  ContractReadResult,
  ContractWriteResult,
  DeploymentResult,
  GasEstimate,
  TransactionStatus,
  ContractEvent
} from '../types/contracts.types';

// Import ABI definitions (we'll generate these from the compiled contracts)
import MNB_TOKEN_ABI from '../../contracts/artifacts/MNBToken.json';
import MNB_WALLET_ABI from '../../contracts/artifacts/MNBWallet.json';
import MNB_EXCHANGE_ABI from '../../contracts/artifacts/MNBExchange.json';
import MNB_GOVERNANCE_ABI from '../../contracts/artifacts/MNBGovernance.json';
import MNB_STAKING_ABI from '../../contracts/artifacts/MNBStaking.json';

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);
  private contracts: Map<string, Contract> = new Map();
  private addresses: ContractAddresses;

  constructor(private blockchainService: BlockchainService) {}

  /**
   * Initialize contract instances with their addresses
   */
  initializeContracts(addresses: ContractAddresses): void {
    this.addresses = addresses;
    
    // Initialize MNBToken contract
    if (addresses.mnbToken) {
      this.contracts.set('MNBToken', new Contract(
        addresses.mnbToken,
        MNB_TOKEN_ABI.abi,
        this.blockchainService.getProvider()
      ));
    }

    // Initialize MNBWallet contract
    if (addresses.mnbWallet) {
      this.contracts.set('MNBWallet', new Contract(
        addresses.mnbWallet,
        MNB_WALLET_ABI.abi,
        this.blockchainService.getProvider()
      ));
    }

    // Initialize MNBExchange contract
    if (addresses.mnbExchange) {
      this.contracts.set('MNBExchange', new Contract(
        addresses.mnbExchange,
        MNB_EXCHANGE_ABI.abi,
        this.blockchainService.getProvider()
      ));
    }

    // Initialize MNBGovernance contract
    if (addresses.mnbGovernance) {
      this.contracts.set('MNBGovernance', new Contract(
        addresses.mnbGovernance,
        MNB_GOVERNANCE_ABI.abi,
        this.blockchainService.getProvider()
      ));
    }

    // Initialize MNBStaking contract
    if (addresses.mnbStaking) {
      this.contracts.set('MNBStaking', new Contract(
        addresses.mnbStaking,
        MNB_STAKING_ABI.abi,
        this.blockchainService.getProvider()
      ));
    }

    this.logger.log('All smart contracts initialized successfully');
  }

  /**
   * Get contract instance by name
   */
  getContract(contractName: string): Contract | null {
    const contract = this.contracts.get(contractName);
    if (!contract) {
      this.logger.warn(`Contract ${contractName} not found`);
      return null;
    }
    return contract;
  }

  /**
   * Read from a contract function
   */
  async readContract(
    contractName: string,
    functionName: string,
    args: any[] = []
  ): Promise<ContractReadResult> {
    try {
      const contract = this.getContract(contractName);
      if (!contract) {
        return { success: false, error: `Contract ${contractName} not found` };
      }

      const result = await contract[functionName](...args);
      return { success: true, result };
    } catch (error) {
      this.logger.error(
        `Failed to read from contract ${contractName}.${functionName}`,
        error
      );
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Write to a contract function (send transaction)
   */
  async writeContract(
    contractName: string,
    functionName: string,
    args: any[] = [],
    options: ContractCallOptions = {}
  ): Promise<ContractWriteResult> {
    try {
      const contract = this.getContract(contractName);
      if (!contract) {
        return { success: false, error: `Contract ${contractName} not found` };
      }

      // Connect wallet if available
      const signer = this.blockchainService.getSigner();
      if (!signer) {
        return { success: false, error: 'No signer available' };
      }

      const connectedContract = contract.connect(signer);
      
      const txOptions = {
        gasLimit: options.gasLimit,
        gasPrice: options.gasPrice ? ethers.parseUnits(options.gasPrice, 'gwei') : undefined,
        value: options.value ? ethers.parseEther(options.value) : undefined
      };

      const transaction = await connectedContract[functionName](...args, txOptions);
      
      return {
        success: true,
        transactionHash: transaction.hash,
        gasUsed: await transaction.wait().then(receipt => receipt.gasUsed)
      };
    } catch (error) {
      this.logger.error(
        `Failed to write to contract ${contractName}.${functionName}`,
        error
      );
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Estimate gas for a contract call
   */
  async estimateGas(
    contractName: string,
    functionName: string,
    args: any[] = [],
    options: ContractCallOptions = {}
  ): Promise<GasEstimate> {
    try {
      const contract = this.getContract(contractName);
      if (!contract) {
        throw new Error(`Contract ${contractName} not found`);
      }

      const signer = this.blockchainService.getSigner();
      if (!signer) {
        throw new Error('No signer available');
      }

      const connectedContract = contract.connect(signer);
      
      const txOptions = {
        value: options.value ? ethers.parseEther(options.value) : undefined
      };

      const gasLimit = await connectedContract[functionName].estimateGas(...args, txOptions);
      const gasPrice = await this.blockchainService.getProvider().getGasPrice();
      
      const estimatedCost = ethers.formatEther(gasLimit * gasPrice);

      return {
        gasLimit,
        gasPrice,
        estimatedCost
      };
    } catch (error) {
      this.logger.error(
        `Failed to estimate gas for ${contractName}.${functionName}`,
        error
      );
      throw error;
    }
  }

  /**
   * Listen to contract events
   */
  onContractEvent(
    contractName: string,
    eventName: string,
    callback: (event: ContractEvent) => void
  ): void {
    const contract = this.getContract(contractName);
    if (!contract) {
      this.logger.warn(`Contract ${contractName} not found for event listening`);
      return;
    }

    contract.on(eventName, (...args) => {
      const event = args[args.length - 1]; // Last argument is the event object
      
      const contractEvent: ContractEvent = {
        eventName,
        args: args.slice(0, -1),
        address: event.address,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber
      };

      callback(contractEvent);
    });
  }

  /**
   * Get all contract addresses
   */
  getContractAddresses(): ContractAddresses {
    return this.addresses;
  }

  /**
   * Get contract ABI
   */
  getContractABI(contractName: string): any[] | null {
    const abiMap = {
      MNBToken: MNB_TOKEN_ABI?.abi,
      MNBWallet: MNB_WALLET_ABI?.abi,
      MNBExchange: MNB_EXCHANGE_ABI?.abi,
      MNBGovernance: MNB_GOVERNANCE_ABI?.abi,
      MNBStaking: MNB_STAKING_ABI?.abi
    };

    return abiMap[contractName] || null;
  }

  /**
   * Check if contract is initialized
   */
  isInitialized(contractName: string): boolean {
    return this.contracts.has(contractName);
  }

  /**
   * Get contract deployment info
   */
  async getContractInfo(contractName: string): Promise<any> {
    const contract = this.getContract(contractName);
    if (!contract) {
      return null;
    }

    try {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.name?.().catch(() => null),
        contract.symbol?.().catch(() => null),
        contract.decimals?.().catch(() => null),
        contract.totalSupply?.().catch(() => null)
      ]);

      return {
        name: name || contractName,
        symbol: symbol || '',
        decimals: decimals || 18,
        totalSupply: totalSupply ? ethers.formatUnits(totalSupply, decimals || 18) : '0',
        address: contract.address
      };
    } catch (error) {
      this.logger.error(`Failed to get info for contract ${contractName}`, error);
      return {
        name: contractName,
        address: contract.address,
        error: error.message
      };
    }
  }

  /**
   * Get all deployed contracts info
   */
  async getAllContractsInfo(): Promise<Record<string, any>> {
    const contractsInfo: Record<string, any> = {};
    
    for (const [name, contract] of this.contracts.entries()) {
      contractsInfo[name] = await this.getContractInfo(name);
    }

    return contractsInfo;
  }
}