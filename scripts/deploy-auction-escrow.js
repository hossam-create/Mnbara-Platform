const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 Deploying MNBAuctionEscrow Contract...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deploying with account:', deployer.address);
  console.log('Account balance:', (await deployer.provider.getBalance(deployer.address)).toString(), '\n');

  // Read existing deployment results to get MNBToken address
  const deploymentPath = path.join(__dirname, '../deployment-results.json');
  let existingDeployment = {};
  
  if (fs.existsSync(deploymentPath)) {
    existingDeployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    console.log('📋 Found existing deployments');
  }

  const mnbTokenAddress = existingDeployment.contracts?.mnbToken;
  
  if (!mnbTokenAddress) {
    console.error('❌ MNBToken not deployed yet. Please run deploy-all.js first.');
    process.exit(1);
  }

  console.log('Using MNBToken at:', mnbTokenAddress);
  
  // Treasury address (can be updated later)
  const treasuryAddress = deployer.address;
  
  try {
    // Deploy MNBAuctionEscrow
    console.log('\n📦 Deploying MNBAuctionEscrow...');
    const MNBAuctionEscrow = await ethers.getContractFactory('MNBAuctionEscrow');
    const auctionEscrow = await MNBAuctionEscrow.deploy();
    await auctionEscrow.waitForDeployment();
    
    const escrowAddress = await auctionEscrow.getAddress();
    console.log('✅ MNBAuctionEscrow deployed to:', escrowAddress);
    
    // Initialize
    console.log('🔧 Initializing contract...');
    await auctionEscrow.initialize(
      deployer.address,
      mnbTokenAddress,
      treasuryAddress
    );
    console.log('✅ MNBAuctionEscrow initialized');
    
    // Update deployment results
    const updatedDeployment = {
      ...existingDeployment,
      timestamp: new Date().toISOString(),
      contracts: {
        ...existingDeployment.contracts,
        mnbAuctionEscrow: escrowAddress
      }
    };
    
    fs.writeFileSync(deploymentPath, JSON.stringify(updatedDeployment, null, 2));
    console.log('\n💾 Updated deployment-results.json');
    
    console.log('\n✅ ============================================');
    console.log('✅ AUCTION ESCROW DEPLOYMENT SUCCESSFUL!');
    console.log('✅ ============================================\n');
    console.log('📋 Contract Details:');
    console.log('  - MNBAuctionEscrow:', escrowAddress);
    console.log('  - MNBToken:', mnbTokenAddress);
    console.log('  - Treasury:', treasuryAddress);
    console.log('\n💡 Add to your .env:');
    console.log(`AUCTION_ESCROW_ADDRESS=${escrowAddress}`);
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
