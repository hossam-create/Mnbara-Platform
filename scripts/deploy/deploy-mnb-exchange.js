const { ethers, upgrades } = require('hardhat');

async function main() {
  console.log('🚀 Starting MNBExchange deployment...');

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deploying with account: ${deployer.address}`);

  // Load MNBToken address (assuming it's already deployed)
  const MNB_TOKEN_ADDRESS = process.env.MNB_TOKEN_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  
  console.log(`📦 Using MNBToken at: ${MNB_TOKEN_ADDRESS}`);

  // Deploy MNBExchange
  const MNBExchange = await ethers.getContractFactory('MNBExchange');
  
  console.log('📦 Deploying MNBExchange...');
  
  const mnbExchange = await upgrades.deployProxy(
    MNBExchange,
    [
      MNB_TOKEN_ADDRESS,   // base token address
      deployer.address     // default admin
    ],
    { 
      initializer: 'initialize',
      kind: 'uups'
    }
  );

  await mnbExchange.waitForDeployment();
  
  const exchangeAddress = await mnbExchange.getAddress();
  console.log(`✅ MNBExchange deployed to: ${exchangeAddress}`);
  
  // Grant roles
  console.log('🔑 Setting up roles...');
  
  const EXCHANGE_ADMIN_ROLE = await mnbExchange.EXCHANGE_ADMIN_ROLE();
  const LIQUIDITY_PROVIDER_ROLE = await mnbExchange.LIQUIDITY_PROVIDER_ROLE();
  
  // Grant roles to deployer for testing
  await mnbExchange.grantRole(EXCHANGE_ADMIN_ROLE, deployer.address);
  await mnbExchange.grantRole(LIQUIDITY_PROVIDER_ROLE, deployer.address);
  
  console.log('✅ Roles granted to deployer');
  
  // Create initial exchange pairs
  console.log('🔄 Creating initial exchange pairs...');
  
  // USDC mock address (for testing)
  const USDC_MOCK = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';
  
  // Create MNB/USDC pair
  await mnbExchange.createExchangePair(
    USDC_MOCK,
    'USDC',
    ethers.parseEther('0.001'), // initial price: 0.001 USDC per MNB
    1000000, // fee basis points: 0.3% (30 bps)
    true // active
  );
  
  console.log('✅ MNB/USDC exchange pair created');
  
  // Verify deployment
  const baseToken = await mnbExchange.baseToken();
  const pairCount = await mnbExchange.getExchangePairsCount();
  
  console.log('\n📊 Deployment Summary:');
  console.log(`   Exchange Contract: ${exchangeAddress}`);
  console.log(`   Base Token: ${baseToken}`);
  console.log(`   Total Pairs: ${pairCount}`);
  console.log(`   Admin: ${deployer.address}`);
  console.log('\n🎉 MNBExchange deployment completed successfully!');
  
  return {
    mnbExchange: exchangeAddress,
    baseToken: baseToken,
    deployer: deployer.address
  };
}

main().catch((error) => {
  console.error('❌ Deployment failed:', error);
  process.exitCode = 1;
});