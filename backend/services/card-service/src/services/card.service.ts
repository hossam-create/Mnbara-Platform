import { prisma } from '../index';

export class CardService {
  
  // Simulate Card Issuance (Mocking Stripe Issuing)
  async issueCard(userId: string, walletId: string, type: 'VIRTUAL' | 'PHYSICAL' = 'VIRTUAL') {
    
    // 1. Generate Fake Pan
    const bankPrefix = "4111"; // Visa Test
    const random = Math.floor(Math.random() * 100000000000).toString().padStart(12, '0');
    const pan = bankPrefix + random;
    const last4 = pan.slice(-4);
    
    // 2. Generate CVV and Expiry
    const cvv = Math.floor(Math.random() * 900 + 100).toString();
    const expiryMonth = new Date().getMonth() + 1;
    const expiryYear = new Date().getFullYear() + 3; // +3 years
    
    // 3. Create Record
    const card = await prisma.card.create({
      data: {
        userId,
        walletId,
        cardholderName: "MNBARA USER", // Should fetch from Auth
        last4,
        encryptedPan: pan, // MOCKED ENCRYPTION
        encryptedCvv: cvv, // MOCKED ENCRYPTION
        expiryMonth,
        expiryYear,
        brand: 'VISA',
        type,
        status: 'ACTIVE'
      }
    });
    
    return card;
  }
  
  async attemptPurchase(cardId: string, amount: number, merchantName: string) {
    // 1. Get Card
    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) throw new Error("Card not found");
    if (card.status !== 'ACTIVE') throw new Error("Card is not active");
    
    // 2. Check Wallet Balance (Mocking Inter-Service Communication)
    // Real implementation: Call Wallet-Service gRPC/HTTP
    // For now, we assume APPROVED if under limit.
    console.log(`Checking Balance for Wallet ${card.walletId}...`);
    
    // 3. Create Transaction
    const tx = await prisma.cardTransaction.create({
      data: {
        cardId,
        amount,
        currency: card.currency,
        merchantName,
        status: 'APPROVED',
        type: 'PURCHASE'
      }
    });
    
    // 4. In Real World: Call Wallet-Service to Deduct Balance
    // await axios.post(`${WALLET_SERVICE_URL}/deduct`, { amount, ... })
    
    return tx;
  }
}
