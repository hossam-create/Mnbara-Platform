const { ethers } = require('hardhat');

async function main() {
  console.log('🚀 Starting local blockchain network...');
  
  // Get the default provider (Hardhat Network)
  const provider = ethers.provider;
  
  // Get accounts
  const accounts = await provider.send('eth_accounts', []);
  const [owner] = await ethers.getSigners();
  
  console.log('✅ Local network started successfully!');
  console.log('📋 Network Info:');
  console.log('   - RPC URL: http://localhost:8545');
  console.log('   - Chain ID: 1337');
  console.log('   - Network Name: localhost');
  
  console.log('\n👤 Accounts:');
  for (let i = 0; i < Math.min(accounts.length, 5); i++) {
    const balance = await provider.getBalance(accounts[i]);
    console.log(`   ${i}: ${accounts[i]} (${ethers.formatEther(balance)} ETH)`);
  }
  
  if (accounts.length > 5) {
    console.log(`   ... and ${accounts.length - 5} more accounts`);
  }
  
  console.log('\n🔑 Default Account (Owner):');
  console.log(`   Address: ${owner.address}`);
  console.log(`   Balance: ${ethers.formatEther(await owner.getBalance())} ETH`);
  
  console.log('\n💡 Use this network for development and testing');
  console.log('   Set these environment variables:');
  console.log('   BLOCKCHAIN_RPC_URL=http://localhost:8545');
  console.log('   BLOCKCHAIN_CHAIN_ID=1337');
  console.log('   BLOCKCHAIN_PRIVATE_KEY=<private_key_of_account_0>');
}

main().catch((error) => {
  console.error('❌ Failed to start local network:', error);
  process.exitCode = 1;
});