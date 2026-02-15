import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// بدء تفاوض صوتي
// Start a voice negotiation
router.post('/start', async (req, res) => {
  try {
    const {
      userId,
      sellerId,
      productId,
      productName,
      originalPrice,
      buyerMinPrice,
    } = req.body;

    // AI suggests a fair price based on market data (simplified)
    const aiSuggestedPrice = originalPrice * (0.85 + Math.random() * 0.1);

    const negotiation = await prisma.voiceNegotiation.create({
      data: {
        userId,
        sellerId,
        productId,
        productName,
        originalPrice,
        buyerMinPrice,
        aiSuggestedPrice,
        status: 'INITIATED',
        messages: {
          create: {
            sender: 'AI_ASSISTANT',
            type: 'GREETING',
            text: `Hello! I'll help you negotiate the price for ${productName}. The current price is $${originalPrice}. I suggest a fair price would be around $${aiSuggestedPrice.toFixed(2)}. Would you like to make an offer?`,
            textAr: `مرحباً! سأساعدك في التفاوض على سعر ${productName}. السعر الحالي هو ${originalPrice} دولار. أقترح سعراً عادلاً حوالي ${aiSuggestedPrice.toFixed(2)} دولار. هل تريد تقديم عرض؟`,
          },
        },
      },
      include: { messages: true },
    });

    res.status(201).json({
      success: true,
      message: 'بدأ التفاوض! 🤝',
      data: negotiation,
    });
  } catch (error) {
    console.error('Error starting negotiation:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// تقديم عرض من المشتري
// Submit buyer's offer
router.post('/:id/offer', async (req, res) => {
  try {
    const { id } = req.params;
    const { offer, message } = req.body;

    const negotiation = await prisma.voiceNegotiation.findUnique({
      where: { id },
      include: { messages: true },
    });

    if (!negotiation) {
      return res.status(404).json({ success: false, message: 'التفاوض غير موجود' });
    }

    if (negotiation.status === 'AGREED' || negotiation.status === 'REJECTED') {
      return res.status(400).json({ success: false, message: 'التفاوض منتهي' });
    }

    // Add buyer's offer message
    await prisma.negotiationMessage.create({
      data: {
        negotiationId: id,
        sender: 'BUYER',
        type: 'OFFER',
        text: message || `My offer is $${offer}`,
        textAr: message || `عرضي هو ${offer} دولار`,
        priceOffer: offer,
      },
    });

    // AI mediates and suggests response
    const sellerMin = negotiation.sellerMinPrice || negotiation.originalPrice * 0.8;
    let aiResponse: string;
    let aiResponseAr: string;
    let newStatus: string;

    if (offer >= sellerMin) {
      // Offer is acceptable
      aiResponse = `Great offer! The seller is likely to accept $${offer}. Let me check...`;
      aiResponseAr = `عرض رائع! من المرجح أن يقبل البائع ${offer} دولار. دعني أتحقق...`;
      newStatus = 'AI_MEDIATING';
    } else {
      // Offer too low, suggest counter
      const suggestedCounter = (offer + negotiation.originalPrice) / 2;
      aiResponse = `That's a bit low. I suggest we counter with $${suggestedCounter.toFixed(2)} to reach an agreement.`;
      aiResponseAr = `هذا منخفض قليلاً. أقترح أن نقدم عرضاً مضاداً بـ ${suggestedCounter.toFixed(2)} دولار للوصول لاتفاق.`;
      newStatus = 'AI_MEDIATING';
    }

    // Add AI response
    await prisma.negotiationMessage.create({
      data: {
        negotiationId: id,
        sender: 'AI_ASSISTANT',
        type: 'SUGGESTION',
        text: aiResponse,
        textAr: aiResponseAr,
      },
    });

    const updated = await prisma.voiceNegotiation.update({
      where: { id },
      data: {
        buyerOffer: offer,
        status: newStatus as any,
        round: { increment: 1 },
      },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 5 } },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error submitting offer:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// رد البائع
// Seller's response
router.post('/:id/respond', async (req, res) => {
  try {
    const { id } = req.params;
    const { accept, counterOffer, message } = req.body;

    const negotiation = await prisma.voiceNegotiation.findUnique({ where: { id } });

    if (!negotiation) {
      return res.status(404).json({ success: false, message: 'التفاوض غير موجود' });
    }

    if (accept) {
      // Seller accepts the offer
      const finalPrice = negotiation.buyerOffer || negotiation.originalPrice;
      const savedAmount = negotiation.originalPrice - finalPrice;

      await prisma.negotiationMessage.create({
        data: {
          negotiationId: id,
          sender: 'SELLER',
          type: 'ACCEPTANCE',
          text: message || `Deal! I accept $${finalPrice}`,
          textAr: message || `موافق! أقبل ${finalPrice} دولار`,
          priceOffer: finalPrice,
        },
      });

      const updated = await prisma.voiceNegotiation.update({
        where: { id },
        data: {
          status: 'AGREED',
          finalPrice,
          savedAmount,
          outcome: 'DEAL_MADE',
          completedAt: new Date(),
        },
        include: { messages: true },
      });

      res.json({
        success: true,
        message: `🎉 تم الاتفاق على ${finalPrice} دولار! وفرت ${savedAmount.toFixed(2)} دولار`,
        data: updated,
      });
    } else if (counterOffer) {
      // Seller counters
      await prisma.negotiationMessage.create({
        data: {
          negotiationId: id,
          sender: 'SELLER',
          type: 'COUNTER_OFFER',
          text: message || `My counter offer is $${counterOffer}`,
          textAr: message || `عرضي المضاد هو ${counterOffer} دولار`,
          priceOffer: counterOffer,
        },
      });

      const updated = await prisma.voiceNegotiation.update({
        where: { id },
        data: {
          sellerCounter: counterOffer,
          status: 'SELLER_COUNTERED',
          round: { increment: 1 },
        },
        include: { messages: { orderBy: { createdAt: 'desc' }, take: 5 } },
      });

      res.json({
        success: true,
        message: 'تم استلام العرض المضاد',
        data: updated,
      });
    } else {
      // Seller rejects
      await prisma.negotiationMessage.create({
        data: {
          negotiationId: id,
          sender: 'SELLER',
          type: 'REJECTION',
          text: message || 'Sorry, I cannot accept this offer.',
          textAr: message || 'عذراً، لا أستطيع قبول هذا العرض.',
        },
      });

      const updated = await prisma.voiceNegotiation.update({
        where: { id },
        data: {
          status: 'REJECTED',
          outcome: 'NO_DEAL',
          completedAt: new Date(),
        },
        include: { messages: true },
      });

      res.json({
        success: true,
        message: 'تم رفض العرض',
        data: updated,
      });
    }
  } catch (error) {
    console.error('Error responding:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// الحصول على تفاوض
// Get negotiation details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const negotiation = await prisma.voiceNegotiation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!negotiation) {
      return res.status(404).json({ success: false, message: 'التفاوض غير موجود' });
    }

    res.json({
      success: true,
      data: negotiation,
    });
  } catch (error) {
    console.error('Error fetching negotiation:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

// تفاوضات المستخدم
// Get user's negotiations
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role = 'buyer' } = req.query;

    const negotiations = await prisma.voiceNegotiation.findMany({
      where: role === 'buyer' ? { userId } : { sellerId: userId },
      orderBy: { createdAt: 'desc' },
      include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } },
    });

    res.json({
      success: true,
      data: negotiations,
    });
  } catch (error) {
    console.error('Error fetching negotiations:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ' });
  }
});

export default router;
