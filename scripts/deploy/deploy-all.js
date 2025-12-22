const { ethers, upgrades } = require('hardhat');

async function main() {
  console.log('🚀 Starting complete MNBara platform deployment...');
  console.log('=' .repeat(60));

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deploying all contracts with account: ${deployer.address}`);
  console.log(`💰 Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  const deploymentResults = {};

  // 1. Deploy MNBToken first
  console.log('1️⃣ Deploying MNBToken...');
  const MNBToken = await ethers.getContractFactory('MNBToken');
  
  const mnbToken = await upgrades.deployProxy(
    MNBToken,
    [
      'MNBara Token',
      'MNB',
      deployer.address,
      deployer.address,
      ethers.parseEther('1000000000') // 1 billion tokens
    ],
    { initializer: 'initialize', kind: 'uups' }
  );

  await mnbToken.waitForDeployment();
  deploymentResults.mnbToken = await mnbToken.getAddress();
  console.log(`✅ MNBToken deployed: ${deploymentResults.mnbToken}`);

  // Setup MNBToken roles and configuration
  console.log('   ⚙️ Configuring MNBToken...');
  const MINTER_BURNER_ROLE = await mnbToken.MINTER_BURNER_ROLE();
  const PAUSER_ROLE = await mnbToken.PAUSER_ROLE();
  const UPGRADER_ROLE = await mnbToken.UPGRADER_ROLE();
  const COMPLIANCE_ROLE = await mnbToken.COMPLIANCE_ROLE();
  
  await mnbToken.grantRole(MINTER_BURNER_ROLE, deployer.address);
  await mnbToken.grantRole(PAUSER_ROLE, deployer.address);
  await mnbToken.grantRole(UPGRADER_ROLE, deployer.address);
  await mnbToken.grantRole(COMPLIANCE_ROLE, deployer.address);
  
  await mnbToken.setTierDailyLimit(1, ethers.parseEther('1000'));
  await mnbToken.setTierDailyLimit(2, ethers.parseEther('5000'));
  await mnbToken.setTierDailyLimit(3, ethers.parseEther('20000'));
  await mnbToken.setTierDailyLimit(4, ethers.parseEther('100000'));
  console.log('   ✅ MNBToken configured\n');

  // 2. Deploy MNBWallet
  console.log('2️⃣ Deploying MNBWallet...');
  const MNBWallet = await ethers.getContractFactory('MNBWallet');
  
  const mnbWallet = await upgrades.deployProxy(
    MNBWallet,
    [deploymentResults.mnbToken, deployer.address],
    { initializer: 'initialize', kind: 'uups' }
  );

  await mnbWallet.waitForDeployment();
  deploymentResults.mnbWallet = await mnbWallet.getAddress();
  console.log(`✅ MNBWallet deployed: ${deploymentResults.mnbWallet}`);

  // Setup MNBWallet
  console.log('   ⚙️ Configuring MNBWallet...');
  const WALLET_ADMIN_ROLE = await mnbWallet.WALLET_ADMIN_ROLE();
  const TREASURY_MANAGER_ROLE = await mnbWallet.TREASURY_MANAGER_ROLE();
  
  await mnbWallet.grantRole(WALLET_ADMIN_ROLE, deployer.address);
  await mnbWallet.grantRole(TREASURY_MANAGER_ROLE, deployer.address);
  await mnbWallet.setWithdrawalLimit(ethers.parseEther('10000'));
  console.log('   ✅ MNBWallet configured\n');

  // 3. Deploy MNBExchange
  console.log('3️⃣ Deploying MNBExchange...');
  const MNBExchange = await ethers.getContractFactory('MNBExchange');
  
  const mnbExchange = await upgrades.deployProxy(
    MNBExchange,
    [deploymentResults.mnbToken, deployer.address],
    { initializer: 'initialize', kind: 'uups' }
  );

  await mnbExchange.waitForDeployment();
  deploymentResults.mnbExchange = await mnbExchange.getAddress();
  console.log(`✅ MNBExchange deployed: ${deploymentResults.mnbExchange}`);

  // Setup MNBExchange
  console.log('   ⚙️ Configuring MNBExchange...');
  const EXCHANGE_ADMIN_ROLE = await mnbExchange.EXCHANGE_ADMIN_ROLE();
  const LIQUIDITY_PROVIDER_ROLE = await mnbExchange.LIQUIDITY_PROVIDER_ROLE();
  
  await mnbExchange.grantRole(EXCHANGE_ADMIN_ROLE, deployer.address);
  await mnbExchange.grantRole(LIQUIDITY_PROVIDER_ROLE, deployer.address);
  
  // Create a mock USDC pair for testing
  const USDC_MOCK = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';
  await mnbExchange.createExchangePair(
    USDC_MOCK,
    'USDC',
    ethers.parseEther('0.001'),
    1000000,
    true
  );
  console.log('   ✅ MNBExchange configured\n');

  // 4. Deploy MNBGovernance
  console.log('4️⃣ Deploying MNBGovernance...');
  const MNBGovernance = await ethers.getContractFactory('MNBGovernance');
  
  const mnbGovernance = await upgrades.deployProxy(
    MNBGovernance,
    [deploymentResults.mnbToken, deployer.address, 'MNBara Governance'],
    { initializer: 'initialize', kind: 'uups' }
  );

  await mnbGovernance.waitForDeployment();
  deploymentResults.mnbGovernance = await mnbGovernance.getAddress();
  console.log(`✅ MNBGovernance deployed: ${deploymentResults.mnbGovernance}`);

  // Setup MNBGovernance
  console.log('   ⚙️ Configuring MNBGovernance...');
  const GOVERNANCE_ADMIN_ROLE = await mnbGovernance.GOVERNANCE_ADMIN_ROLE();
  const PROPOSAL_CREATOR_ROLE = await mnbGovernance.PROPOSAL_CREATOR_ROLE();
  
  await mnbGovernance.grantRole(GOVERNANCE_ADMIN_ROLE, deployer.address);
  await mnbGovernance.grantRole(PROPOSAL_CREATOR_ROLE, deployer.address);
  
  await mnbGovernance.setVotingDelay(1);
  await mnbGovernance.setVotingPeriod(100);
  await mnbGovernance.setProposalThreshold(ethers.parseEther('10000'));
  await mnbGovernance.setQuorumVotes(ethers.parseEther('100000'));
  await mnbGovernance.addGovernor(deployer.address);
  console.log('   ✅ MNBGovernance configured\n');

  // 5. Deploy MNBStaking
  console.log('5️⃣ Deploying MNBStaking...');
  const MNBStaking = await ethers.getContractFactory('MNBStaking');
  
  const mnbStaking = await upgrades.deployProxy(
    MNBStaking,
    [deploymentResults.mnbToken, deploymentResults.mnbToken, deployer.address],
    { initializer: 'initialize', kind: 'uups' }
  );

  await mnbStaking.waitForDeployment();
  deploymentResults.mnbStaking = await mnbStaking.getAddress();
  console.log(`✅ MNBStaking deployed: ${deploymentResults.mnbStaking}`);

  // Setup MNBStaking
  console.log('   ⚙️ Configuring MNBStaking...');
  const STAKING_ADMIN_ROLE = await mnbStaking.STAKING_ADMIN_ROLE();
  const REWARD_MANAGER_ROLE = await mnbStaking.REWARD_MANAGER_ROLE();
  
  await mnbStaking.grantRole(STAKING_ADMIN_ROLE, deployer.address);
  await mnbStaking.grantRole(REWARD_MANAGER_ROLE, deployer.address);
  
  // Create staking pools
  await mnbStaking.createStakingPool(
    '30-Day Staking',
    30 * 24 * 60 * 60,
    ethers.parseEther('100'),
    ethers.parseEther('100000'),
    ethers.parseEther('0.000000031709792')
  );
  
  await mnbStaking.createStakingPool(
    '90-Day Staking',
    90 * 24 * 60 * 60,
    ethers.parseEther('500'),
    ethers.parseEther('500000'),
    ethers.parseEther('0.000000063419583')
  );
  
  await mnbStaking.createStakingPool(
    '180-Day Staking',
    180 * 24 * 60 * 60,
    ethers.parseEther('1000'),
    ethers.parseEther('1000000'),
    ethers.parseEther('0.000000095129375')
  );
  console.log('   ✅ MNBStaking configured\n');

  // Deployment Summary
  console.log('=' .repeat(60));
  console.log('🎉 MNBara Platform Deployment Complete!');
  console.log('=' .repeat(60));
  
  console.log('📊 Contract Addresses:');
  console.log(`   MNBToken: ${deploymentResults.mnbToken}`);
  console.log(`   MNBWallet: ${deploymentResults.mnbWallet}`);
  console.log(`   MNBExchange: ${deploymentResults.mnbExchange}`);
  console.log(`   MNBGovernance: ${deploymentResults.mnbGovernance}`);
  console.log(`   MNBStaking: ${deploymentResults.mnbStaking}`);
  
  console.log('\n👤 Admin: ${deployer.address}');
  console.log(`💰 Remaining ETH: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))}`);
  
  console.log('\n📝 Next Steps:');
  console.log('   1. Fund the staking contract with rewards tokens');
  console.log('   2. Test contract interactions');
  console.log('   3. Deploy to testnet/mainnet');
  console.log('   4. Update environment variables');
  
  return deploymentResults;
}

main().catch((error) => {
  console.error('❌ Deployment failed:', error);
  process.exitCode = 1;
});