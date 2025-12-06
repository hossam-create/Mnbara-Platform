const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("🚀 Starting MNBWallet deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deploying with account: ${deployer.address}`);

  // Load MNBToken address (assuming it's already deployed)
  const MNB_TOKEN_ADDRESS = process.env.MNB_TOKEN_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  console.log(`📦 Using MNBToken at: ${MNB_TOKEN_ADDRESS}`);

  // Deploy MNBWallet
  const MNBWallet = await ethers.getContractFactory("MNBWallet");
  
  console.log("📦 Deploying MNBWallet...");
  
  const mnbWallet = await upgrades.deployProxy(
    MNBWallet,
    [
      MNB_TOKEN_ADDRESS,   // token address
      deployer.address     // default admin
    ],
    { 
      initializer: "initialize",
      kind: "uups"
    }
  );

  await mnbWallet.waitForDeployment();
  
  const walletAddress = await mnbWallet.getAddress();
  console.log(`✅ MNBWallet deployed to: ${walletAddress}`);
  
  // Grant roles
  console.log("🔑 Setting up roles...");
  
  const WALLET_ADMIN_ROLE = await mnbWallet.WALLET_ADMIN_ROLE();
  const TREASURY_MANAGER_ROLE = await mnbWallet.TREASURY_MANAGER_ROLE();
  
  // Grant roles to deployer for testing
  await mnbWallet.grantRole(WALLET_ADMIN_ROLE, deployer.address);
  await mnbWallet.grantRole(TREASURY_MANAGER_ROLE, deployer.address);
  
  console.log("✅ Roles granted to deployer");
  
  // Set withdrawal limits
  console.log("💰 Setting withdrawal limits...");
  
  await mnbWallet.setWithdrawalLimit(ethers.parseEther("10000")); // 10,000 tokens max withdrawal
  
  console.log("✅ Withdrawal limits configured");
  
  // Verify deployment
  const token = await mnbWallet.token();
  const withdrawalLimit = await mnbWallet.withdrawalLimit();
  
  console.log(`\n📊 Deployment Summary:`);
  console.log(`   Wallet Contract: ${walletAddress}`);
  console.log(`   Token Address: ${token}`);
  console.log(`   Withdrawal Limit: ${ethers.formatEther(withdrawalLimit)} tokens`);
  console.log(`   Admin: ${deployer.address}`);
  console.log(`\n🎉 MNBWallet deployment completed successfully!`);
  
  return {
    mnbWallet: walletAddress,
    token: token,
    deployer: deployer.address
  };
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});