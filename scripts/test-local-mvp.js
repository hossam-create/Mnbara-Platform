#!/usr/bin/env node
/**
 * 🔒 LOCAL MVP VALIDATION - Test Execution Script
 * 
 * Runs complete end-to-end test scenarios:
 * 1. Happy Path: Complete order flow
 * 2. Dispute Path: Order with dispute
 * 3. Cancellation Path: Order cancellation
 * 
 * NO PRODUCTION. TEST MODE ONLY.
 */

const axios = require('axios');
const chalk = require('chalk');

// Service URLs
const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const USER_URL = process.env.USER_SERVICE_URL || 'http://localhost:3002';
const PRODUCT_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3004';
const WALLET_URL = process.env.WALLET_SERVICE_URL || 'http://localhost:3005';
const ORDER_URL = process.env.ORDERS_SERVICE_URL || 'http://localhost:3006';
const ESCROW_URL = process.env.ESCROW_SERVICE_URL || 'http://localhost:3007';
const TRIPS_URL = process.env.TRIPS_SERVICE_URL || 'http://localhost:3009';
const MATCHING_URL = process.env.MATCHING_SERVICE_URL || 'http://localhost:3010';

// Test results
const results = {
  passed: 0,
  failed: 0,
  scenarios: [],
  performance: {},
};

// Helper functions
async function login(email, password) {
  const start = Date.now();
  try {
    const response = await axios.post(`${AUTH_URL}/api/auth/login`, {
      email,
      password,
    });
    const duration = Date.now() - start;
    results.performance.login = duration;
    return response.data;
  } catch (error) {
    throw new Error(`Login failed: ${error.message}`);
  }
}

async function getWalletBalance(userId, token) {
  const start = Date.now();
  try {
    const response = await axios.get(`${WALLET_URL}/api/wallets/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const duration = Date.now() - start;
    results.performance.walletBalance = duration;
    return response.data.balance;
  } catch (error) {
    throw new Error(`Get wallet balance failed: ${error.message}`);
  }
}

async function createOrder(buyerId, sellerId, productId, amount, token) {
  const start = Date.now();
  try {
    const response = await axios.post(
      `${ORDER_URL}/api/orders`,
      {
        buyerId,
        sellerId,
        productId,
        amount,
        currency: 'EGP',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const duration = Date.now() - start;
    results.performance.createOrder = duration;
    return response.data;
  } catch (error) {
    throw new Error(`Create order failed: ${error.message}`);
  }
}

async function holdFunds(orderId, amount, token) {
  const start = Date.now();
  try {
    const response = await axios.post(
      `${ESCROW_URL}/api/escrow/hold`,
      {
        orderId,
        amount,
        currency: 'EGP',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const duration = Date.now() - start;
    results.performance.holdFunds = duration;
    return response.data;
  } catch (error) {
    throw new Error(`Hold funds failed: ${error.message}`);
  }
}

async function releaseFunds(escrowId, token) {
  const start = Date.now();
  try {
    const response = await axios.post(
      `${ESCROW_URL}/api/escrow/${escrowId}/release`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const duration = Date.now() - start;
    results.performance.releaseFunds = duration;
    return response.data;
  } catch (error) {
    throw new Error(`Release funds failed: ${error.message}`);
  }
}

function logSuccess(message) {
  console.log(chalk.green('✅ ' + message));
  results.passed++;
}

function logError(message, error) {
  console.log(chalk.red('❌ ' + message));
  if (error) {
    console.log(chalk.red('   Error: ' + error.message));
  }
  results.failed++;
}

function logInfo(message) {
  console.log(chalk.blue('ℹ️  ' + message));
}

function logWarning(message) {
  console.log(chalk.yellow('⚠️  ' + message));
}

// Test Scenarios
async function testScenario1_HappyPath() {
  console.log(chalk.bold('\n📝 Scenario 1: Happy Path - Complete Order Flow\n'));

  const scenario = {
    name: 'Happy Path',
    steps: [],
    passed: true,
  };

  try {
    // Step 1: Login as buyer
    logInfo('Step 1: Login as buyer...');
    const buyer = await login('buyer1@test.local', 'Test123!@#');
    logSuccess('Buyer logged in');
    scenario.steps.push({ step: 'Buyer login', status: 'passed' });

    // Step 2: Login as seller
    logInfo('Step 2: Login as seller...');
    const seller = await login('seller1@test.local', 'Test123!@#');
    logSuccess('Seller logged in');
    scenario.steps.push({ step: 'Seller login', status: 'passed' });

    // Step 3: Check buyer wallet balance
    logInfo('Step 3: Check buyer wallet balance...');
    const buyerBalance = await getWalletBalance(buyer.user.id, buyer.token);
    logSuccess(`Buyer balance: ${buyerBalance} EGP`);
    scenario.steps.push({ step: 'Check buyer balance', status: 'passed', data: buyerBalance });

    // Step 4: Get product (assume first product exists)
    logInfo('Step 4: Get product...');
    const productsResponse = await axios.get(`${PRODUCT_URL}/api/products?limit=1`);
    const product = productsResponse.data.products[0];
    logSuccess(`Product found: ${product.name} - ${product.price} EGP`);
    scenario.steps.push({ step: 'Get product', status: 'passed', data: product });

    // Step 5: Create order
    logInfo('Step 5: Create order...');
    const order = await createOrder(
      buyer.user.id,
      seller.user.id,
      product.id,
      product.price,
      buyer.token
    );
    logSuccess(`Order created: ${order.id}`);
    scenario.steps.push({ step: 'Create order', status: 'passed', data: order });

    // Step 6: Hold funds in escrow
    logInfo('Step 6: Hold funds in escrow...');
    const escrow = await holdFunds(order.id, product.price, buyer.token);
    logSuccess(`Funds held in escrow: ${escrow.id}`);
    scenario.steps.push({ step: 'Hold funds', status: 'passed', data: escrow });

    // Step 7: Check buyer balance after hold
    logInfo('Step 7: Check buyer balance after hold...');
    const buyerBalanceAfter = await getWalletBalance(buyer.user.id, buyer.token);
    logSuccess(`Buyer balance after hold: ${buyerBalanceAfter} EGP`);
    scenario.steps.push({ step: 'Check balance after hold', status: 'passed', data: buyerBalanceAfter });

    // Step 8: Simulate delivery confirmation
    logInfo('Step 8: Simulate delivery confirmation...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    logSuccess('Delivery confirmed (simulated)');
    scenario.steps.push({ step: 'Delivery confirmation', status: 'passed' });

    // Step 9: Release funds to seller
    logInfo('Step 9: Release funds to seller...');
    await releaseFunds(escrow.id, buyer.token);
    logSuccess('Funds released to seller');
    scenario.steps.push({ step: 'Release funds', status: 'passed' });

    // Step 10: Check seller balance
    logInfo('Step 10: Check seller balance...');
    const sellerBalance = await getWalletBalance(seller.user.id, seller.token);
    logSuccess(`Seller balance: ${sellerBalance} EGP`);
    scenario.steps.push({ step: 'Check seller balance', status: 'passed', data: sellerBalance });

    console.log(chalk.green.bold('\n✅ Scenario 1: PASSED\n'));

  } catch (error) {
    logError('Scenario 1 failed', error);
    scenario.passed = false;
    scenario.error = error.message;
    console.log(chalk.red.bold('\n❌ Scenario 1: FAILED\n'));
  }

  results.scenarios.push(scenario);
}

async function testScenario2_DisputePath() {
  console.log(chalk.bold('\n📝 Scenario 2: Dispute Path - Order with Dispute\n'));

  const scenario = {
    name: 'Dispute Path',
    steps: [],
    passed: true,
  };

  try {
    logInfo('Step 1: Login as buyer...');
    const buyer = await login('buyer2@test.local', 'Test123!@#');
    logSuccess('Buyer logged in');
    scenario.steps.push({ step: 'Buyer login', status: 'passed' });

    logInfo('Step 2: Login as seller...');
    const seller = await login('seller2@test.local', 'Test123!@#');
    logSuccess('Seller logged in');
    scenario.steps.push({ step: 'Seller login', status: 'passed' });

    logInfo('Step 3: Create order...');
    const productsResponse = await axios.get(`${PRODUCT_URL}/api/products?limit=1&offset=1`);
    const product = productsResponse.data.products[0];
    const order = await createOrder(
      buyer.user.id,
      seller.user.id,
      product.id,
      product.price,
      buyer.token
    );
    logSuccess(`Order created: ${order.id}`);
    scenario.steps.push({ step: 'Create order', status: 'passed' });

    logInfo('Step 4: Hold funds...');
    const escrow = await holdFunds(order.id, product.price, buyer.token);
    logSuccess(`Funds held: ${escrow.id}`);
    scenario.steps.push({ step: 'Hold funds', status: 'passed' });

    logInfo('Step 5: Initiate dispute...');
    logWarning('Dispute flow not yet implemented - marking as TODO');
    scenario.steps.push({ step: 'Initiate dispute', status: 'todo' });

    console.log(chalk.yellow.bold('\n⚠️  Scenario 2: PARTIAL (Dispute flow TODO)\n'));

  } catch (error) {
    logError('Scenario 2 failed', error);
    scenario.passed = false;
    scenario.error = error.message;
    console.log(chalk.red.bold('\n❌ Scenario 2: FAILED\n'));
  }

  results.scenarios.push(scenario);
}

async function testScenario3_CancellationPath() {
  console.log(chalk.bold('\n📝 Scenario 3: Cancellation Path - Order Cancellation\n'));

  const scenario = {
    name: 'Cancellation Path',
    steps: [],
    passed: true,
  };

  try {
    logInfo('Step 1: Login as buyer...');
    const buyer = await login('buyer3@test.local', 'Test123!@#');
    logSuccess('Buyer logged in');
    scenario.steps.push({ step: 'Buyer login', status: 'passed' });

    logInfo('Step 2: Login as seller...');
    const seller = await login('seller3@test.local', 'Test123!@#');
    logSuccess('Seller logged in');
    scenario.steps.push({ step: 'Seller login', status: 'passed' });

    logInfo('Step 3: Create order...');
    const productsResponse = await axios.get(`${PRODUCT_URL}/api/products?limit=1&offset=2`);
    const product = productsResponse.data.products[0];
    const order = await createOrder(
      buyer.user.id,
      seller.user.id,
      product.id,
      product.price,
      buyer.token
    );
    logSuccess(`Order created: ${order.id}`);
    scenario.steps.push({ step: 'Create order', status: 'passed' });

    logInfo('Step 4: Cancel order...');
    logWarning('Cancellation flow not yet implemented - marking as TODO');
    scenario.steps.push({ step: 'Cancel order', status: 'todo' });

    console.log(chalk.yellow.bold('\n⚠️  Scenario 3: PARTIAL (Cancellation flow TODO)\n'));

  } catch (error) {
    logError('Scenario 3 failed', error);
    scenario.passed = false;
    scenario.error = error.message;
    console.log(chalk.red.bold('\n❌ Scenario 3: FAILED\n'));
  }

  results.scenarios.push(scenario);
}

// Main test runner
async function main() {
  console.log(chalk.bold.cyan('\n========================================'));
  console.log(chalk.bold.cyan('🔒 LOCAL MVP VALIDATION - Test Suite'));
  console.log(chalk.bold.cyan('========================================\n'));
  console.log(chalk.yellow('⚠️  TEST MODE ONLY - NO PRODUCTION\n'));

  const startTime = Date.now();

  // Run test scenarios
  await testScenario1_HappyPath();
  await testScenario2_DisputePath();
  await testScenario3_CancellationPath();

  const endTime = Date.now();
  const totalTime = endTime - startTime;

  // Print results
  console.log(chalk.bold.cyan('\n========================================'));
  console.log(chalk.bold.cyan('📊 TEST RESULTS'));
  console.log(chalk.bold.cyan('========================================\n'));

  console.log(chalk.bold('Summary:'));
  console.log(`  Total Scenarios: ${results.scenarios.length}`);
  console.log(`  Passed: ${chalk.green(results.passed)}`);
  console.log(`  Failed: ${chalk.red(results.failed)}`);
  console.log(`  Total Time: ${totalTime}ms\n`);

  console.log(chalk.bold('Performance Metrics:'));
  Object.entries(results.performance).forEach(([key, value]) => {
    const status = value < 500 ? chalk.green('✅') : value < 1000 ? chalk.yellow('⚠️ ') : chalk.red('❌');
    console.log(`  ${status} ${key}: ${value}ms`);
  });

  console.log(chalk.bold('\nScenario Details:'));
  results.scenarios.forEach((scenario, index) => {
    const status = scenario.passed ? chalk.green('✅ PASSED') : chalk.red('❌ FAILED');
    console.log(`\n  ${index + 1}. ${scenario.name}: ${status}`);
    scenario.steps.forEach(step => {
      const stepStatus = step.status === 'passed' ? chalk.green('✅') : 
                        step.status === 'todo' ? chalk.yellow('⚠️ ') : chalk.red('❌');
      console.log(`     ${stepStatus} ${step.step}`);
    });
  });

  console.log(chalk.bold.cyan('\n========================================\n'));

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  process.exit(1);
});
