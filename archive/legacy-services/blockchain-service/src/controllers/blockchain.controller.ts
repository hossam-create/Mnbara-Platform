import { Controller, Get, Post, Body, Param, Query, Logger } from '@nestjs/common';
import { BlockchainService } from '../services/blockchain.service';
import { ContractsService } from '../services/contracts.service';
import { DeploymentService } from '../services/deployment.service';
import {
  ContractFunctionCall,
  ContractCallOptions,
  DeploymentResult,
  ContractAddresses
} from '../types/contracts.types';

@Controller('blockchain')
export class BlockchainController {
  private readonly logger = new Logger(BlockchainController.name);

  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly contractsService: ContractsService,
    private readonly deploymentService: DeploymentService
  ) {}

  @Get('health')
  async healthCheck() {
    const isHealthy = await this.blockchainService.healthCheck();
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      network: await this.getNetworkInfo()
    };
  }

  @Get('network')
  async getNetworkInfo() {
    try {
      const blockNumber = await this.blockchainService.getBlockNumber();
      const walletAddress = this.blockchainService.getWalletAddress();
      
      return {
        blockNumber,
        walletAddress,
        isConnected: this.blockchainService.isConnected(),
        chainId: this.blockchainService.getChainId(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get network info', error);
      throw error;
    }
  }

  @Get('balance/:address')
  async getBalance(@Param('address') address: string) {
    try {
      const balance = await this.blockchainService.getBalance(address);
      return {
        address,
        balance,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to get balance for address ${address}`, error);
      throw error;
    }
  }

  @Get('contracts')
  async getContractsInfo() {
    try {
      const contractsInfo = await this.contractsService.getAllContractsInfo();
      const addresses = this.contractsService.getContractAddresses();
      
      return {
        addresses,
        contracts: contractsInfo,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get contracts info', error);
      throw error;
    }
  }

  @Get('contracts/:contractName')
  async getContractInfo(@Param('contractName') contractName: string) {
    try {
      const info = await this.contractsService.getContractInfo(contractName);
      return {
        contractName,
        ...info,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to get info for contract ${contractName}`, error);
      throw error;
    }
  }

  @Post('contracts/read')
  async readContract(@Body() call: ContractFunctionCall) {
    try {
      const result = await this.contractsService.readContract(
        call.contractAddress,
        call.functionName,
        call.args
      );
      
      return {
        success: result.success,
        result: result.result,
        error: result.error,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to read from contract', error);
      throw error;
    }
  }

  @Post('contracts/write')
  async writeContract(
    @Body() call: ContractFunctionCall,
    @Body('options') options?: ContractCallOptions
  ) {
    try {
      const result = await this.contractsService.writeContract(
        call.contractAddress,
        call.functionName,
        call.args,
        options
      );
      
      return {
        success: result.success,
        transactionHash: result.transactionHash,
        gasUsed: result.gasUsed,
        error: result.error,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to write to contract', error);
      throw error;
    }
  }

  @Post('contracts/estimate-gas')
  async estimateGas(
    @Body() call: ContractFunctionCall,
    @Body('options') options?: ContractCallOptions
  ) {
    try {
      const estimate = await this.contractsService.estimateGas(
        call.contractAddress,
        call.functionName,
        call.args,
        options
      );
      
      return {
        gasLimit: estimate.gasLimit.toString(),
        gasPrice: estimate.gasPrice.toString(),
        estimatedCost: estimate.estimatedCost,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to estimate gas', error);
      throw error;
    }
  }

  @Post('deploy/all')
  async deployAllContracts() {
    try {
      this.logger.log('Starting deployment of all contracts...');
      
      const addresses = await this.deploymentService.deployAllContracts();
      const results = this.deploymentService.getDeploymentResults();
      
      // Save deployment results
      this.deploymentService.saveDeploymentResults();
      
      return {
        success: true,
        addresses,
        deployments: results,
        timestamp: new Date().toISOString(),
        message: 'All contracts deployed successfully'
      };
    } catch (error) {
      this.logger.error('Failed to deploy all contracts', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('deploy/:contractName')
  async deployContract(@Param('contractName') contractName: string) {
    try {
      this.logger.log(`Starting deployment of ${contractName}...`);
      
      const result = await this.deploymentService.deployContract(contractName);
      
      // Save deployment results
      this.deploymentService.saveDeploymentResults();
      
      return {
        success: true,
        deployment: result,
        timestamp: new Date().toISOString(),
        message: `${contractName} deployed successfully`
      };
    } catch (error) {
      this.logger.error(`Failed to deploy ${contractName}`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('deployment/results')
  async getDeploymentResults() {
    try {
      const results = this.deploymentService.getDeploymentResults();
      const addresses = this.deploymentService.getContractAddresses();
      
      return {
        results,
        addresses,
        allDeployed: this.deploymentService.areAllContractsDeployed(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get deployment results', error);
      throw error;
    }
  }

  @Post('deployment/load')
  async loadDeploymentResults(@Body('filePath') filePath?: string) {
    try {
      const success = this.deploymentService.loadDeploymentResults(filePath);
      
      return {
        success,
        message: success ? 'Deployment results loaded successfully' : 'Failed to load deployment results',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to load deployment results', error);
      throw error;
    }
  }

  @Get('transaction/:hash')
  async getTransactionStatus(@Param('hash') hash: string) {
    try {
      const receipt = await this.blockchainService.getTransactionReceipt(hash);
      const confirmations = receipt ? await this.calculateConfirmations(receipt.blockNumber) : 0;
      
      return {
        hash,
        status: receipt ? 'confirmed' : 'pending',
        blockNumber: receipt?.blockNumber,
        confirmations,
        gasUsed: receipt?.gasUsed?.toString(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to get transaction status for ${hash}`, error);
      throw error;
    }
  }

  private async calculateConfirmations(blockNumber: number): Promise<number> {
    try {
      const currentBlock = await this.blockchainService.getBlockNumber();
      return currentBlock - blockNumber;
    } catch (error) {
      return 0;
    }
  }

  @Get('wallet/address')
  async getWalletAddress() {
    try {
      const address = this.blockchainService.getWalletAddress();
      
      return {
        address,
        hasWallet: !!address,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get wallet address', error);
      throw error;
    }
  }
}