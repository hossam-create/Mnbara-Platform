const { ethers, upgrades } = require('hardhat');

async function main() {
  console.log('🚀 Starting MNBGovernance deployment...');

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deploying with account: ${deployer.address}`);

  // Load MNBToken address (assuming it's already deployed)
  const MNB_TOKEN_ADDRESS = process.env.MNB_TOKEN_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  
  console.log(`📦 Using MNBToken at: ${MNB_TOKEN_ADDRESS}`);

  // Deploy MNBGovernance
  const MNBGovernance = await ethers.getContractFactory('MNBGovernance');
  
  console.log('📦 Deploying MNBGovernance...');
  
  const mnbGovernance = await upgrades.deployProxy(
    MNBGovernance,
    [
      MNB_TOKEN_ADDRESS,   // governance token address
      deployer.address,    // default admin
      'MNBara Governance'  // name
    ],
    { 
      initializer: 'initialize',
      kind: 'uups'
    }
  );

  await mnbGovernance.waitForDeployment();
  
  const governanceAddress = await mnbGovernance.getAddress();
  console.log(`✅ MNBGovernance deployed to: ${governanceAddress}`);
  
  // Grant roles
  console.log('🔑 Setting up roles...');
  
  const GOVERNANCE_ADMIN_ROLE = await mnbGovernance.GOVERNANCE_ADMIN_ROLE();
  const PROPOSAL_CREATOR_ROLE = await mnbGovernance.PROPOSAL_CREATOR_ROLE();
  
  // Grant roles to deployer for testing
  await mnbGovernance.grantRole(GOVERNANCE_ADMIN_ROLE, deployer.address);
  await mnbGovernance.grantRole(PROPOSAL_CREATOR_ROLE, deployer.address);
  
  console.log('✅ Roles granted to deployer');
  
  // Set governance parameters
  console.log('⚙️ Setting governance parameters...');
  
  await mnbGovernance.setVotingDelay(1); // 1 block voting delay
  await mnbGovernance.setVotingPeriod(100); // 100 blocks voting period
  await mnbGovernance.setProposalThreshold(ethers.parseEther('10000')); // 10,000 tokens to create proposal
  await mnbGovernance.setQuorumVotes(ethers.parseEther('100000')); // 100,000 tokens quorum
  
  console.log('✅ Governance parameters configured');
  
  // Add initial governors
  console.log('👥 Adding initial governors...');
  
  // Add deployer as governor
  await mnbGovernance.addGovernor(deployer.address);
  
  console.log('✅ Initial governors added');
  
  // Verify deployment
  const governanceToken = await mnbGovernance.token();
  const votingDelay = await mnbGovernance.votingDelay();
  const votingPeriod = await mnbGovernance.votingPeriod();
  const proposalThreshold = await mnbGovernance.proposalThreshold();
  const quorumVotes = await mnbGovernance.quorumVotes();
  
  console.log('\n📊 Deployment Summary:');
  console.log(`   Governance Contract: ${governanceAddress}`);
  console.log(`   Governance Token: ${governanceToken}`);
  console.log(`   Voting Delay: ${votingDelay} blocks`);
  console.log(`   Voting Period: ${votingPeriod} blocks`);
  console.log(`   Proposal Threshold: ${ethers.formatEther(proposalThreshold)} tokens`);
  console.log(`   Quorum Votes: ${ethers.formatEther(quorumVotes)} tokens`);
  console.log(`   Admin: ${deployer.address}`);
  console.log('\n🎉 MNBGovernance deployment completed successfully!');
  
  return {
    mnbGovernance: governanceAddress,
    governanceToken: governanceToken,
    deployer: deployer.address
  };
}

main().catch((error) => {
  console.error('❌ Deployment failed:', error);
  process.exitCode = 1;
});