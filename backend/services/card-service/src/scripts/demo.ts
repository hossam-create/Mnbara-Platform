import { CardService } from '../services/card.service';
import { prisma } from '../index';

async function runSimulation() {
  console.log('🚀 Starting Full Buyer Journey Simulation...');
  console.log('-------------------------------------------');

  const cardService = new CardService();
  const userId = 'user_simulation_001';
  const walletId = 'wallet_simulation_999'; // Assumed to have funds

  try {
    // 1. Issue Virtual Card
    console.log(`\n💳 Step 1: Requesting Virtual Visa for User [${userId}]...`);
    const card = await cardService.issueCard(userId, walletId, 'VIRTUAL');
    console.log(`✅ Card Issued Successfully!`);
    console.log(`   - Card Brand: ${card.brand}`);
    console.log(`   - PAN: ${card.encryptedPan.substring(0, 4)}********${card.last4}`); // Mock decryption
    console.log(`   - CVV: ***`);
    console.log(`   - Expiry: ${card.expiryMonth}/${card.expiryYear}`);
    console.log(`   - Linked Wallet: ${card.walletId}`);

    // 2. Simulate Online Purchase
    const purchaseAmount = 49.99;
    const merchant = "Netflix Subscription";
    console.log(`\n🛍️ Step 2: Attempting Purchase of $${purchaseAmount} at ${merchant}...`);
    
    // In a real app, this comes from the Payment Gateway (Stripe/Visa Network) webhook
    const tx = await cardService.attemptPurchase(card.id, purchaseAmount, merchant);
    
    console.log(`✅ Transaction Result: ${tx.status}`);
    console.log(`   - Tx ID: ${tx.id}`);
    console.log(`   - Amount: $${tx.amount} ${tx.currency}`);
    console.log(`   - Merchant: ${tx.merchantName}`);
    
    console.log('\n🎉 Simulation Complete: Buyer successfully used virtual card!');
    
  } catch (error) {
    console.error('❌ Simulation Failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute logic
if (require.main === module) {
  runSimulation();
}
