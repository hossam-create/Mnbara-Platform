const { ethers, upgrades } = require('hardhat');

async function main() {
  console.log('🚀 Starting MNBToken deployment...');

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deploying contracts with account: ${deployer.address}`);

  // Deploy MNBToken
  const MNBToken = await ethers.getContractFactory('MNBToken');
  
  console.log('📦 Deploying MNBToken...');
  
  const mnbToken = await upgrades.deployProxy(
    MNBToken,
    [
      'MNBara Token',      // name
      'MNB',               // symbol
      deployer.address,    // default admin
      deployer.address,    // compliance admin
      1000000000           // initial supply (1 billion tokens)
    ],
    { 
      initializer: 'initialize',
      kind: 'uups'
    }
  );

  await mnbToken.waitForDeployment();
  
  const tokenAddress = await mnbToken.getAddress();
  console.log(`✅ MNBToken deployed to: ${tokenAddress}`);
  
  // Grant roles
  console.log('🔑 Setting up roles...');
  
  const MINTER_BURNER_ROLE = await mnbToken.MINTER_BURNER_ROLE();
  const PAUSER_ROLE = await mnbToken.PAUSER_ROLE();
  const UPGRADER_ROLE = await mnbToken.UPGRADER_ROLE();
  const COMPLIANCE_ROLE = await mnbToken.COMPLIANCE_ROLE();
  
  // Grant roles to deployer for testing
  await mnbToken.grantRole(MINTER_BURNER_ROLE, deployer.address);
  await mnbToken.grantRole(PAUSER_ROLE, deployer.address);
  await mnbToken.grantRole(UPGRADER_ROLE, deployer.address);
  await mnbToken.grantRole(COMPLIANCE_ROLE, deployer.address);
  
  console.log('✅ Roles granted to deployer');
  
  // Set up initial tiers
  console.log('🏷️ Setting up compliance tiers...');
  
  await mnbToken.setTierDailyLimit(1, ethers.parseEther('1000'));    // Tier 1: 1000 tokens/day
  await mnbToken.setTierDailyLimit(2, ethers.parseEther('5000'));    // Tier 2: 5000 tokens/day
  await mnbToken.setTierDailyLimit(3, ethers.parseEther('20000'));   // Tier 3: 20000 tokens/day
  await mnbToken.setTierDailyLimit(4, ethers.parseEther('100000'));  // Tier 4: 100000 tokens/day
  
  console.log('✅ Compliance tiers configured');
  
  // Verify deployment
  const name = await mnbToken.name();
  const symbol = await mnbToken.symbol();
  const totalSupply = await mnbToken.totalSupply();
  
  console.log('\n📊 Deployment Summary:');
  console.log(`   Token Name: ${name}`);
  console.log(`   Token Symbol: ${symbol}`);
  console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} ${symbol}`);
  console.log(`   Admin: ${deployer.address}`);
  console.log('\n🎉 MNBToken deployment completed successfully!');
  
  return {
    mnbToken: tokenAddress,
    deployer: deployer.address
  };
}

main().catch((error) => {
  console.error('❌ Deployment failed:', error);
  process.exitCode = 1;
});