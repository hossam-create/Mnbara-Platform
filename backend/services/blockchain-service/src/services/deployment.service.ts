import { Injectable, Logger } from '@nestjs/common';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ContractsService } from './contracts.service';
import { BlockchainService } from './blockchain.service';
import { DeploymentResult, ContractAddresses } from '../types/contracts.types';

@Injectable()
export class DeploymentService {
  private readonly logger = new Logger(DeploymentService.name);
  private deploymentResults: DeploymentResult[] = [];
  private contractAddresses: ContractAddresses;

  constructor(
    private contractsService: ContractsService,
    private blockchainService: BlockchainService
  ) {}

  /**
   * Deploy all contracts in sequence
   */
  async deployAllContracts(): Promise<ContractAddresses> {
    this.logger.log('Starting deployment of all MNBara smart contracts...');

    try {
      // Run the comprehensive deployment script
      const deploymentScriptPath = join(process.cwd(), 'scripts', 'deploy', 'deploy-all.js');
      
      if (!existsSync(deploymentScriptPath)) {
        throw new Error('Deployment script not found');
      }

      // Execute deployment script using Hardhat
      const command = `npx hardhat run ${deploymentScriptPath} --network localhost`;
      
      this.logger.log('Executing deployment command:', command);
      
      const output = execSync(command, { 
        encoding: 'utf-8',
        cwd: process.cwd(),
        stdio: 'pipe'
      });

      this.logger.log('Deployment output:', output);

      // Parse deployment results from output
      this.parseDeploymentResults(output);

      // Initialize contracts service with deployed addresses
      this.contractsService.initializeContracts(this.contractAddresses);

      this.logger.log('All contracts deployed successfully');
      return this.contractAddresses;

    } catch (error) {
      this.logger.error('Deployment failed:', error);
      throw new Error(`Failed to deploy contracts: ${error.message}`);
    }
  }

  /**
   * Deploy individual contract
   */
  async deployContract(contractName: string): Promise<DeploymentResult> {
    const scriptMap = {
      MNBToken: 'deploy-mnb-token.js',
      MNBWallet: 'deploy-mnb-wallet.js',
      MNBExchange: 'deploy-mnb-exchange.js',
      MNBGovernance: 'deploy-mnb-governance.js',
      MNBStaking: 'deploy-mnb-staking.js'
    };

    const scriptName = scriptMap[contractName];
    if (!scriptName) {
      throw new Error(`No deployment script found for contract: ${contractName}`);
    }

    const scriptPath = join(process.cwd(), 'scripts', 'deploy', scriptName);
    
    if (!existsSync(scriptPath)) {
      throw new Error(`Deployment script not found: ${scriptPath}`);
    }

    try {
      const command = `npx hardhat run ${scriptPath} --network localhost`;
      this.logger.log(`Deploying ${contractName}:`, command);
      
      const output = execSync(command, { 
        encoding: 'utf-8',
        cwd: process.cwd(),
        stdio: 'pipe'
      });

      this.logger.log(`${contractName} deployment output:`, output);

      const result = this.parseSingleDeploymentResult(contractName, output);
      this.deploymentResults.push(result);

      // Update contract addresses
      this.updateContractAddresses(contractName, result.address);

      return result;

    } catch (error) {
      this.logger.error(`Failed to deploy ${contractName}:`, error);
      throw new Error(`Failed to deploy ${contractName}: ${error.message}`);
    }
  }

  /**
   * Parse deployment results from script output
   */
  private parseDeploymentResults(output: string): void {
    const lines = output.split('\n');
    const addresses: ContractAddresses = {
      mnbToken: '',
      mnbWallet: '',
      mnbExchange: '',
      mnbGovernance: '',
      mnbStaking: ''
    };

    const results: DeploymentResult[] = [];

    lines.forEach(line => {
      // Parse MNBToken deployment
      if (line.includes('MNBToken deployed to:')) {
        const address = line.split(':')[1]?.trim();
        if (address) {
          addresses.mnbToken = address;
          results.push({
            contractName: 'MNBToken',
            address: address,
            transactionHash: this.extractTxHash(line),
            blockNumber: this.extractBlockNumber(line)
          });
        }
      }

      // Parse MNBWallet deployment
      if (line.includes('MNBWallet deployed to:')) {
        const address = line.split(':')[1]?.trim();
        if (address) {
          addresses.mnbWallet = address;
          results.push({
            contractName: 'MNBWallet',
            address: address,
            transactionHash: this.extractTxHash(line),
            blockNumber: this.extractBlockNumber(line)
          });
        }
      }

      // Parse MNBExchange deployment
      if (line.includes('MNBExchange deployed to:')) {
        const address = line.split(':')[1]?.trim();
        if (address) {
          addresses.mnbExchange = address;
          results.push({
            contractName: 'MNBExchange',
            address: address,
            transactionHash: this.extractTxHash(line),
            blockNumber: this.extractBlockNumber(line)
          });
        }
      }

      // Parse MNBGovernance deployment
      if (line.includes('MNBGovernance deployed to:')) {
        const address = line.split(':')[1]?.trim();
        if (address) {
          addresses.mnbGovernance = address;
          results.push({
            contractName: 'MNBGovernance',
            address: address,
            transactionHash: this.extractTxHash(line),
            blockNumber: this.extractBlockNumber(line)
          });
        }
      }

      // Parse MNBStaking deployment
      if (line.includes('MNBStaking deployed to:')) {
        const address = line.split(':')[1]?.trim();
        if (address) {
          addresses.mnbStaking = address;
          results.push({
            contractName: 'MNBStaking',
            address: address,
            transactionHash: this.extractTxHash(line),
            blockNumber: this.extractBlockNumber(line)
          });
        }
      }
    });

    this.contractAddresses = addresses;
    this.deploymentResults = results;
  }

  /**
   * Parse single contract deployment result
   */
  private parseSingleDeploymentResult(contractName: string, output: string): DeploymentResult {
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('deployed to:')) {
        const address = line.split(':')[1]?.trim();
        if (address) {
          return {
            contractName,
            address,
            transactionHash: this.extractTxHash(line),
            blockNumber: this.extractBlockNumber(line)
          };
        }
      }
    }

    throw new Error(`Could not parse deployment result for ${contractName}`);
  }

  /**
   * Extract transaction hash from output line
   */
  private extractTxHash(line: string): string {
    const txHashMatch = line.match(/0x[a-fA-F0-9]{64}/);
    return txHashMatch ? txHashMatch[0] : 'unknown';
  }

  /**
   * Extract block number from output line
   */
  private extractBlockNumber(line: string): number {
    const blockMatch = line.match(/block (#|number:?)\s*(\d+)/i);
    return blockMatch ? parseInt(blockMatch[2]) : 0;
  }

  /**
   * Update contract addresses
   */
  private updateContractAddresses(contractName: string, address: string): void {
    if (!this.contractAddresses) {
      this.contractAddresses = {
        mnbToken: '',
        mnbWallet: '',
        mnbExchange: '',
        mnbGovernance: '',
        mnbStaking: ''
      };
    }

    switch (contractName) {
      case 'MNBToken':
        this.contractAddresses.mnbToken = address;
        break;
      case 'MNBWallet':
        this.contractAddresses.mnbWallet = address;
        break;
      case 'MNBExchange':
        this.contractAddresses.mnbExchange = address;
        break;
      case 'MNBGovernance':
        this.contractAddresses.mnbGovernance = address;
        break;
      case 'MNBStaking':
        this.contractAddresses.mnbStaking = address;
        break;
    }
  }

  /**
   * Get deployment results
   */
  getDeploymentResults(): DeploymentResult[] {
    return this.deploymentResults;
  }

  /**
   * Get contract addresses
   */
  getContractAddresses(): ContractAddresses {
    return this.contractAddresses;
  }

  /**
   * Save deployment results to file
   */
  saveDeploymentResults(filePath: string = 'deployment-results.json'): void {
    const results = {
      timestamp: new Date().toISOString(),
      network: 'localhost',
      contracts: this.contractAddresses,
      deployments: this.deploymentResults
    };

    writeFileSync(filePath, JSON.stringify(results, null, 2));
    this.logger.log(`Deployment results saved to ${filePath}`);
  }

  /**
   * Load deployment results from file
   */
  loadDeploymentResults(filePath: string = 'deployment-results.json'): boolean {
    if (!existsSync(filePath)) {
      return false;
    }

    try {
      const data = JSON.parse(readFileSync(filePath, 'utf-8'));
      this.contractAddresses = data.contracts;
      this.deploymentResults = data.deployments;
      
      // Initialize contracts service
      this.contractsService.initializeContracts(this.contractAddresses);
      
      this.logger.log(`Deployment results loaded from ${filePath}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to load deployment results:', error);
      return false;
    }
  }

  /**
   * Verify contract deployment
   */
  async verifyContract(contractName: string): Promise<boolean> {
    const address = this.contractAddresses[this.getAddressKey(contractName)];
    if (!address) {
      return false;
    }

    try {
      const command = `npx hardhat verify ${address} --network localhost`;
      execSync(command, { 
        encoding: 'utf-8',
        cwd: process.cwd(),
        stdio: 'pipe'
      });

      this.logger.log(`${contractName} verified successfully`);
      return true;
    } catch (error) {
      this.logger.warn(`Verification failed for ${contractName}:`, error.message);
      return false;
    }
  }

  /**
   * Get address key for contract name
   */
  private getAddressKey(contractName: string): keyof ContractAddresses {
    const keyMap = {
      MNBToken: 'mnbToken',
      MNBWallet: 'mnbWallet',
      MNBExchange: 'mnbExchange',
      MNBGovernance: 'mnbGovernance',
      MNBStaking: 'mnbStaking'
    };

    return keyMap[contractName] as keyof ContractAddresses;
  }

  /**
   * Check if all contracts are deployed
   */
  areAllContractsDeployed(): boolean {
    if (!this.contractAddresses) {
      return false;
    }

    return Object.values(this.contractAddresses).every(address => 
      address && address !== '' && address !== '0x0000000000000000000000000000000000000000'
    );
  }
}