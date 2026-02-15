import { registerAs } from '@nestjs/config';

export default registerAs('blockchain', () => ({
  // Main network configuration
  rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545',
  chainId: parseInt(process.env.BLOCKCHAIN_CHAIN_ID || '1337'),
  privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY,
  
  // Contract addresses (will be populated after deployment)
  contracts: {
    mnbToken: process.env.MNB_TOKEN_ADDRESS || '',
    mnbWallet: process.env.MNB_WALLET_ADDRESS || '',
    mnbExchange: process.env.MNB_EXCHANGE_ADDRESS || '',
    mnbGovernance: process.env.MNB_GOVERNANCE_ADDRESS || '',
    mnbStaking: process.env.MNB_STAKING_ADDRESS || '',
  },

  // Deployment settings
  deployment: {
    autoDeploy: process.env.AUTO_DEPLOY_CONTRACTS === 'true',
    verifyContracts: process.env.VERIFY_CONTRACTS === 'true',
    deploymentFile: process.env.DEPLOYMENT_FILE || 'deployment-results.json',
  },

  // Gas settings
  gas: {
    maxFeePerGas: process.env.MAX_FEE_PER_GAS || '100', // gwei
    maxPriorityFeePerGas: process.env.MAX_PRIORITY_FEE_PER_GAS || '2', // gwei
    gasLimitMultiplier: parseFloat(process.env.GAS_LIMIT_MULTIPLIER || '1.2'),
  },

  // Network settings
  networks: {
    localhost: {
      chainId: 1337,
      name: 'Local Development',
      explorer: '',
    },
    sepolia: {
      chainId: 11155111,
      name: 'Sepolia Testnet',
      explorer: 'https://sepolia.etherscan.io',
    },
    mainnet: {
      chainId: 1,
      name: 'Ethereum Mainnet',
      explorer: 'https://etherscan.io',
    },
  },

  // Default contract settings
  defaultSettings: {
    // MNBToken
    token: {
      name: 'MNBara Token',
      symbol: 'MNB',
      initialSupply: '1000000000', // 1 billion tokens
      decimals: 18,
    },
    
    // MNBWallet
    wallet: {
      withdrawalLimit: '1000', // 1000 tokens
    },
    
    // MNBExchange
    exchange: {
      feeRate: 30, // 0.3%
      minTradeAmount: '1', // 1 token
    },
    
    // MNBGovernance
    governance: {
      votingDelay: 1, // 1 block
      votingPeriod: 100, // 100 blocks
      proposalThreshold: '10000', // 10,000 tokens
      quorumVotes: '100000', // 100,000 tokens
    },
    
    // MNBStaking
    staking: {
      pools: [
        {
          lockDuration: 30 * 24 * 60 * 60, // 30 days
          minStake: '100', // 100 tokens
          maxStake: '100000', // 100,000 tokens
          apy: 10, // 10% APY
        },
        {
          lockDuration: 90 * 24 * 60 * 60, // 90 days
          minStake: '500', // 500 tokens
          maxStake: '500000', // 500,000 tokens
          apy: 20, // 20% APY
        },
        {
          lockDuration: 180 * 24 * 60 * 60, // 180 days
          minStake: '1000', // 1000 tokens
          maxStake: '1000000', // 1,000,000 tokens
          apy: 35, // 35% APY
        },
      ],
    },
  },
}));