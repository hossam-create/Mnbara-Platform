const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("🚀 Starting MNBStaking deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deploying with account: ${deployer.address}`);

  // Load MNBToken address (assuming it's already deployed)
  const MNB_TOKEN_ADDRESS = process.env.MNB_TOKEN_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  console.log(`📦 Using MNBToken at: ${MNB_TOKEN_ADDRESS}`);

  // Deploy MNBStaking
  const MNBStaking = await ethers.getContractFactory("MNBStaking");
  
  console.log("📦 Deploying MNBStaking...");
  
  const mnbStaking = await upgrades.deployProxy(
    MNBStaking,
    [
      MNB_TOKEN_ADDRESS,   // staking token address
      MNB_TOKEN_ADDRESS,   // reward token address (same as staking token for simplicity)
      deployer.address     // default admin
    ],
    { 
      initializer: "initialize",
      kind: "uups"
    }
  );

  await mnbStaking.waitForDeployment();
  
  const stakingAddress = await mnbStaking.getAddress();
  console.log(`✅ MNBStaking deployed to: ${stakingAddress}`);
  
  // Grant roles
  console.log("🔑 Setting up roles...");
  
  const STAKING_ADMIN_ROLE = await mnbStaking.STAKING_ADMIN_ROLE();
  const REWARD_MANAGER_ROLE = await mnbStaking.REWARD_MANAGER_ROLE();
  
  // Grant roles to deployer for testing
  await mnbStaking.grantRole(STAKING_ADMIN_ROLE, deployer.address);
  await mnbStaking.grantRole(REWARD_MANAGER_ROLE, deployer.address);
  
  console.log("✅ Roles granted to deployer");
  
  // Create staking pools
  console.log("🏊 Creating staking pools...");
  
  // Pool 1: 30-day lock, 10% APY
  await mnbStaking.createStakingPool(
    "30-Day Staking",
    30 * 24 * 60 * 60, // 30 days in seconds
    ethers.parseEther("100"), // min 100 tokens
    ethers.parseEther("100000"), // max 100,000 tokens
    ethers.parseEther("0.000000031709792") // ~10% APY per second
  );
  
  // Pool 2: 90-day lock, 20% APY
  await mnbStaking.createStakingPool(
    "90-Day Staking",
    90 * 24 * 60 * 60, // 90 days in seconds
    ethers.parseEther("500"), // min 500 tokens
    ethers.parseEther("500000"), // max 500,000 tokens
    ethers.parseEther("0.000000063419583") // ~20% APY per second
  );
  
  // Pool 3: 180-day lock, 30% APY
  await mnbStaking.createStakingPool(
    "180-Day Staking",
    180 * 24 * 60 * 60, // 180 days in seconds
    ethers.parseEther("1000"), // min 1000 tokens
    ethers.parseEther("1000000"), // max 1,000,000 tokens
    ethers.parseEther("0.000000095129375") // ~30% APY per second
  );
  
  console.log("✅ Staking pools created");
  
  // Add initial rewards
  console.log("💰 Adding initial rewards...");
  
  // Fund the staking contract with rewards
  const initialRewards = ethers.parseEther("1000000"); // 1 million tokens for rewards
  
  // Note: In production, you'd need to transfer tokens to the staking contract first
  console.log(`💡 Note: Transfer ${ethers.formatEther(initialRewards)} tokens to ${stakingAddress} for rewards`);
  
  console.log("✅ Rewards setup completed");
  
  // Verify deployment
  const stakingToken = await mnbStaking.stakingToken();
  const rewardToken = await mnbStaking.rewardToken();
  const poolCount = 3; // We created 3 pools
  
  console.log(`\n📊 Deployment Summary:`);
  console.log(`   Staking Contract: ${stakingAddress}`);
  console.log(`   Staking Token: ${stakingToken}`);
  console.log(`   Reward Token: ${rewardToken}`);
  console.log(`   Total Pools: ${poolCount}`);
  console.log(`   Admin: ${deployer.address}`);
  console.log(`\n🎉 MNBStaking deployment completed successfully!`);
  
  return {
    mnbStaking: stakingAddress,
    stakingToken: stakingToken,
    rewardToken: rewardToken,
    deployer: deployer.address
  };
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});