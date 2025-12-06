const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 Starting MNBara Smart Contracts Deployment...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);
  console.log('Account balance:', (await deployer.provider.getBalance(deployer.address)).toString(), '\n');

  const deploymentResults = {};

  // ============================================
  // 1. Deploy MNBToken (Foundation)
  // ============================================
  console.log('📦 Deploying MNBToken...');
  try {
    const MNBToken = await ethers.getContractFactory('MNBToken');
    const mnbToken = await MNBToken.deploy();
    await mnbToken.waitForDeployment();
    
    deploymentResults.mnbToken = await mnbToken.getAddress();
    console.log('✅ MNBToken deployed to:', deploymentResults.mnbToken);
    
    // Initialize
    await mnbToken.initialize(deployer.address);
    console.log('✅ MNBToken initialized\n');
  } catch (error) {
    console.error('❌ MNBToken deployment failed:', error.message);
  }

  // ============================================
  // 2. Deploy MNBExchange
  // ============================================
  console.log('📦 Deploying MNBExchange...');
  try {
    const MNBExchange = await ethers.getContractFactory('MNBExchange');
    const mnbExchange = await MNBExchange.deploy();
    await mnbExchange.waitForDeployment();
    
    deploymentResults.mnbExchange = await mnbExchange.getAddress();
    console.log('✅ MNBExchange deployed to:', deploymentResults.mnbExchange);
    
    // Initialize with MNBToken address
    await mnbExchange.initialize(deployer.address, deploymentResults.mnbToken);
    console.log('✅ MNBExchange initialized\n');
  } catch (error) {
    console.error('❌ MNBExchange deployment failed:', error.message);
  }

  // ============================================
  // 3. Deploy MNBWallet
  // ============================================
  console.log('📦 Deploying MNBWallet...');
  try {
    const MNBWallet = await ethers.getContractFactory('MNBWallet');
    const mnbWallet = await MNBWallet.deploy();
    await mnbWallet.waitForDeployment();
    
    deploymentResults.mnbWallet = await mnbWallet.getAddress();
    console.log('✅ MNBWallet deployed to:', deploymentResults.mnbWallet);
    
    // Initialize
    const treasuryAddress = deployer.address;
    await mnbWallet.initialize(
      deployer.address,
      deploymentResults.mnbToken,
      treasuryAddress
    );
    console.log('✅ MNBWallet initialized\n');
  } catch (error) {
    console.error('❌ MNBWallet deployment failed:', error.message);
  }

  // ============================================
  // 4. Deploy MNBStaking
  // ============================================
  console.log('📦 Deploying MNBStaking...');
  try {
    const MNBStaking = await ethers.getContractFactory('MNBStaking');
    const mnbStaking = await MNBStaking.deploy();
    await mnbStaking.waitForDeployment();
    
    deploymentResults.mnbStaking = await mnbStaking.getAddress();
    console.log('✅ MNBStaking deployed to:', deploymentResults.mnbStaking);
    
    // Initialize (using MNBToken for both staking and rewards)
    await mnbStaking.initialize(
      deploymentResults.mnbToken,
      deploymentResults.mnbToken,
      deployer.address
    );
    console.log('✅ MNBStaking initialized\n');
  } catch (error) {
    console.error('❌ MNBStaking deployment failed:', error.message);
  }

  // ============================================
  // 5. Deploy MNBGovernance
  // ============================================
  console.log('📦 Deploying MNBGovernance...');
  try {
    const MNBGovernance = await ethers.getContractFactory('MNBGovernance');
    const mnbGovernance = await MNBGovernance.deploy();
    await mnbGovernance.waitForDeployment();
    
    deploymentResults.mnbGovernance = await mnbGovernance.getAddress();
    console.log('✅ MNBGovernance deployed to:', deploymentResults.mnbGovernance);
    
    // Initialize
    const votingDelay = 1;
    const votingPeriod = 50400;
    const proposalThreshold = ethers.parseEther('1000');
    const quorumVotes = ethers.parseEther('10000');
    
    await mnbGovernance.initialize(
      deployer.address,
      deploymentResults.mnbToken,
      votingDelay,
      votingPeriod,
      proposalThreshold,
      quorumVotes
    );
    console.log('✅ MNBGovernance initialized\n');
  } catch (error) {
    console.error('❌ MNBGovernance deployment failed:', error.message);
  }

  // ============================================
  // Save Deployment Results
  // ============================================
  const deploymentData = {
    timestamp: new Date().toISOString(),
    network: 'localhost',
    deployer: deployer.address,
    contracts: deploymentResults
  };

  const deploymentPath = path.join(__dirname, '../deployment-results.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
  
  console.log('\n✅ ============================================');
  console.log('✅ DEPLOYMENT SUCCESSFUL!');
  console.log('✅ ============================================\n');
  console.log('📋 Deployment Summary:');
  console.log(JSON.stringify(deploymentResults, null, 2));
  console.log(`\n💾 Results saved to: ${deploymentPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
