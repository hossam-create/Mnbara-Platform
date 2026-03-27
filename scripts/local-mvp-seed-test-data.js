#!/usr/bin/env node
/**
 * 🔒 LOCAL MVP VALIDATION - Test Data Seeding Script
 * 
 * Creates 15 test users for local validation:
 * - 5 Buyers
 * - 5 Sellers (with active subscriptions)
 * - 5 Travelers
 * 
 * NO PRODUCTION DATA. TEST MODE ONLY.
 */

const axios = require('axios');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3002';
const WALLET_SERVICE_URL = process.env.WALLET_SERVICE_URL || 'http://localhost:3005';
const SUBSCRIPTION_SERVICE_URL = process.env.SUBSCRIPTION_SERVICE_URL || 'http://localhost:3012';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3004';
const TRIPS_SERVICE_URL = process.env.TRIPS_SERVICE_URL || 'http://localhost:3009';

// Test user data
const BUYERS = [
  { email: 'buyer1@test.local', name: 'Ahmed Buyer', password: 'Test123!@#' },
  { email: 'buyer2@test.local', name: 'Sara Buyer', password: 'Test123!@#' },
  { email: 'buyer3@test.local', name: 'Mohamed Buyer', password: 'Test123!@#' },
  { email: 'buyer4@test.local', name: 'Fatima Buyer', password: 'Test123!@#' },
  { email: 'buyer5@test.local', name: 'Omar Buyer', password: 'Test123!@#' },
];

const SELLERS = [
  { email: 'seller1@test.local', name: 'Ali Seller', password: 'Test123!@#' },
  { email: 'seller2@test.local', name: 'Layla Seller', password: 'Test123!@#' },
  { email: 'seller3@test.local', name: 'Hassan Seller', password: 'Test123!@#' },
  { email: 'seller4@test.local', name: 'Nour Seller', password: 'Test123!@#' },
  { email: 'seller5@test.local', name: 'Youssef Seller', password: 'Test123!@#' },
];

const TRAVELERS = [
  { email: 'traveler1@test.local', name: 'Karim Traveler', password: 'Test123!@#' },
  { email: 'traveler2@test.local', name: 'Mona Traveler', password: 'Test123!@#' },
  { email: 'traveler3@test.local', name: 'Tarek Traveler', password: 'Test123!@#' },
  { email: 'traveler4@test.local', name: 'Dina Traveler', password: 'Test123!@#' },
  { email: 'traveler5@test.local', name: 'Amr Traveler', password: 'Test123!@#' },
];

// Test products
const PRODUCTS = [
  { name: 'iPhone 15 Pro', price: 1200, category: 'Electronics', description: 'Latest iPhone model' },
  { name: 'Nike Air Max', price: 150, category: 'Fashion', description: 'Premium sneakers' },
  { name: 'Sony Headphones', price: 300, category: 'Electronics', description: 'Noise cancelling' },
  { name: 'Gucci Bag', price: 2000, category: 'Fashion', description: 'Luxury handbag' },
  { name: 'MacBook Pro', price: 2500, category: 'Electronics', description: 'M3 chip laptop' },
];

// Test trips
const TRIPS = [
  { from: 'New York', to: 'Cairo', departureDate: '2026-03-01', arrivalDate: '2026-03-02', capacity: 10 },
  { from: 'London', to: 'Cairo', departureDate: '2026-03-05', arrivalDate: '2026-03-06', capacity: 15 },
  { from: 'Dubai', to: 'Cairo', departureDate: '2026-03-10', arrivalDate: '2026-03-10', capacity: 20 },
  { from: 'Paris', to: 'Cairo', departureDate: '2026-03-15', arrivalDate: '2026-03-16', capacity: 12 },
  { from: 'Istanbul', to: 'Cairo', departureDate: '2026-03-20', arrivalDate: '2026-03-20', capacity: 8 },
];

async function registerUser(userData, role) {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/register`, {
      ...userData,
      role,
    });
    console.log(`✅ Registered ${role}: ${userData.email}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log(`⚠️  User already exists: ${userData.email}`);
      // Login to get token
      const loginResponse = await axios.post(`${AUTH_SERVICE_URL}/api/auth/login`, {
        email: userData.email,
        password: userData.password,
      });
      return loginResponse.data;
    }
    throw error;
  }
}

async function createWallet(userId, token, initialBalance = 10000) {
  try {
    await axios.post(
      `${WALLET_SERVICE_URL}/api/wallets`,
      {
        userId,
        currency: 'EGP',
        balance: initialBalance,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log(`✅ Created wallet for user ${userId} with ${initialBalance} EGP`);
  } catch (error) {
    if (error.response?.status === 409) {
      console.log(`⚠️  Wallet already exists for user ${userId}`);
    } else {
      console.error(`❌ Failed to create wallet: ${error.message}`);
    }
  }
}

async function activateSubscription(userId, token) {
  try {
    await axios.post(
      `${SUBSCRIPTION_SERVICE_URL}/api/subscriptions`,
      {
        userId,
        plan: 'SELLER_BASIC',
        status: 'ACTIVE',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log(`✅ Activated subscription for seller ${userId}`);
  } catch (error) {
    if (error.response?.status === 409) {
      console.log(`⚠️  Subscription already exists for user ${userId}`);
    } else {
      console.error(`❌ Failed to activate subscription: ${error.message}`);
    }
  }
}

async function createProduct(sellerId, token, productData) {
  try {
    const response = await axios.post(
      `${PRODUCT_SERVICE_URL}/api/products`,
      {
        ...productData,
        sellerId,
        status: 'ACTIVE',
        stock: 1,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log(`✅ Created product: ${productData.name}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to create product: ${error.message}`);
  }
}

async function createTrip(travelerId, token, tripData) {
  try {
    const response = await axios.post(
      `${TRIPS_SERVICE_URL}/api/trips`,
      {
        ...tripData,
        travelerId,
        status: 'ACTIVE',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log(`✅ Created trip: ${tripData.from} → ${tripData.to}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to create trip: ${error.message}`);
  }
}

async function main() {
  console.log('🔒 LOCAL MVP VALIDATION - Seeding Test Data\n');
  console.log('⚠️  TEST MODE ONLY - NO PRODUCTION DATA\n');

  try {
    // 1. Create Buyers
    console.log('\n📦 Creating Buyers...');
    const buyers = [];
    for (const buyer of BUYERS) {
      const result = await registerUser(buyer, 'BUYER');
      buyers.push(result);
      await createWallet(result.user.id, result.token, 50000); // 50,000 EGP test balance
      await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
    }

    // 2. Create Sellers
    console.log('\n🏪 Creating Sellers...');
    const sellers = [];
    for (const seller of SELLERS) {
      const result = await registerUser(seller, 'SELLER');
      sellers.push(result);
      await createWallet(result.user.id, result.token, 10000); // 10,000 EGP test balance
      await activateSubscription(result.user.id, result.token);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 3. Create Travelers
    console.log('\n✈️  Creating Travelers...');
    const travelers = [];
    for (const traveler of TRAVELERS) {
      const result = await registerUser(traveler, 'TRAVELER');
      travelers.push(result);
      await createWallet(result.user.id, result.token, 5000); // 5,000 EGP test balance
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 4. Create Products
    console.log('\n📱 Creating Products...');
    for (let i = 0; i < PRODUCTS.length; i++) {
      const seller = sellers[i];
      await createProduct(seller.user.id, seller.token, PRODUCTS[i]);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 5. Create Trips
    console.log('\n🛫 Creating Trips...');
    for (let i = 0; i < TRIPS.length; i++) {
      const traveler = travelers[i];
      await createTrip(traveler.user.id, traveler.token, TRIPS[i]);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n✅ Test Data Seeding Complete!\n');
    console.log('📊 Summary:');
    console.log(`   - ${BUYERS.length} Buyers created (50,000 EGP each)`);
    console.log(`   - ${SELLERS.length} Sellers created (10,000 EGP each, subscriptions active)`);
    console.log(`   - ${TRAVELERS.length} Travelers created (5,000 EGP each)`);
    console.log(`   - ${PRODUCTS.length} Products listed`);
    console.log(`   - ${TRIPS.length} Trips created`);
    console.log('\n🔐 Test Credentials:');
    console.log('   Email: buyer1@test.local (or seller1@test.local, traveler1@test.local)');
    console.log('   Password: Test123!@#\n');

  } catch (error) {
    console.error('\n❌ Error seeding test data:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

main();
