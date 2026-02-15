// Simple integration test for WalletService and ContractsService
import { WalletService } from '../wallet.service';
import { ContractsService } from '../contracts.service';
import { DeploymentService } from '../deployment.service';

async function testWalletContractIntegration() {
  console.log('Starting WalletService <-> ContractsService integration test...');
  
  try {
    // Initialize services
    const deploymentService = new DeploymentService();
    const contractsService = new ContractsService();
    
    // Load deployment results to initialize contracts
    console.log('Loading deployment results...');
    await deploymentService.loadDeploymentResults();
    
    // Create wallet service
    const walletService = new WalletService(contractsService);
    
    console.log('Services initialized successfully');
    
    // Test address from Hardhat node
    const userAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    
    console.log(`Fetching MNBToken balance for address: ${userAddress}`);
    
    // Get balance
    const balance = await walletService.getBalance(userAddress);
    
    console.log(`✅ Success! MNBToken balance: ${balance}`);
    console.log(`Balance type: ${typeof balance}`);
    console.log(`Numeric value: ${parseFloat(balance)}`);
    
    // Verify the balance is a valid number
    if (typeof balance === 'string' && !isNaN(parseFloat(balance))) {
      console.log('✅ Test passed: Balance is a valid numeric string');
    } else {
      console.log('❌ Test failed: Balance is not a valid numeric string');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error(error.stack);
  }
}

// Run the test
if (require.main === module) {
  testWalletContractIntegration();
}

export { testWalletContractIntegration };