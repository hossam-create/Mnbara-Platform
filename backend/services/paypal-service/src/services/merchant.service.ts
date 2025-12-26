import { PrismaClient, OnboardingStatus } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_PARTNER_ID = process.env.PAYPAL_PARTNER_ID || '';

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await axios.post(
    `${PAYPAL_API_BASE}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );
  
  return response.data.access_token;
}

export const merchantService = {
  // تسجيل تاجر جديد - Register new merchant
  async registerMerchant(data: {
    merchantId: string;
    paypalEmail: string;
    returnUrl: string;
  }) {
    const { merchantId, paypalEmail, returnUrl } = data;

    // Check if already registered
    const existing = await prisma.merchantPayPalAccount.findUnique({
      where: { merchantId }
    });

    if (existing) {
      throw new Error('Merchant already registered');
    }

    try {
      const accessToken = await getAccessToken();

      // Create partner referral for onboarding
      const response = await axios.post(
        `${PAYPAL_API_BASE}/v2/customer/partner-referrals`,
        {
          tracking_id: merchantId,
          partner_config_override: {
            return_url: returnUrl
          },
          operations: [{
            operation: 'API_INTEGRATION',
            api_integration_preference: {
              rest_api_integration: {
                integration_method: 'PAYPAL',
                integration_type: 'THIRD_PARTY',
                third_party_details: {
                  features: ['PAYMENT', 'REFUND']
                }
              }
            }
          }],
          products: ['EXPRESS_CHECKOUT'],
          legal_consents: [{
            type: 'SHARE_DATA_CONSENT',
            granted: true
          }]
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const onboardingLink = response.data.links.find(
        (link: any) => link.rel === 'action_url'
      )?.href;

      // Save merchant account
      const account = await prisma.merchantPayPalAccount.create({
        data: {
          merchantId,
          paypalEmail,
          onboardingStatus: 'IN_PROGRESS',
          onboardingLink
        }
      });

      return {
        merchantId: account.merchantId,
        onboardingLink,
        status: account.onboardingStatus
      };
    } catch (error: any) {
      console.error('PayPal merchant registration error:', error.response?.data || error.message);
      
      // Save with pending status if API fails
      const account = await prisma.merchantPayPalAccount.create({
        data: {
          merchantId,
          paypalEmail,
          onboardingStatus: 'PENDING'
        }
      });

      return {
        merchantId: account.merchantId,
        status: 'PENDING',
        message: 'Manual verification required'
      };
    }
  },

  // التحقق من حالة التسجيل - Check onboarding status
  async checkOnboardingStatus(merchantId: string) {
    const account = await prisma.merchantPayPalAccount.findUnique({
      where: { merchantId }
    });

    if (!account) {
      throw new Error('Merchant not found');
    }

    try {
      const accessToken = await getAccessToken();

      // Get merchant status from PayPal
      const response = await axios.get(
        `${PAYPAL_API_BASE}/v1/customer/partners/${PAYPAL_PARTNER_ID}/merchant-integrations/${merchantId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const merchantData = response.data;
      const isActive = merchantData.payments_receivable && merchantData.primary_email_confirmed;

      // Update account
      const updated = await prisma.merchantPayPalAccount.update({
        where: { merchantId },
        data: {
          paypalMerchantId: merchantData.merchant_id,
          onboardingStatus: isActive ? 'COMPLETED' : 'IN_PROGRESS',
          canReceivePayments: merchantData.payments_receivable || false,
          isVerified: isActive,
          verifiedAt: isActive ? new Date() : null
        }
      });

      return {
        merchantId: updated.merchantId,
        paypalMerchantId: updated.paypalMerchantId,
        status: updated.onboardingStatus,
        canReceivePayments: updated.canReceivePayments,
        isVerified: updated.isVerified
      };
    } catch (error: any) {
      console.error('PayPal status check error:', error.response?.data || error.message);
      return {
        merchantId: account.merchantId,
        status: account.onboardingStatus,
        canReceivePayments: account.canReceivePayments,
        isVerified: account.isVerified
      };
    }
  },

  // الحصول على حساب التاجر - Get merchant account
  async getMerchantAccount(merchantId: string) {
    const account = await prisma.merchantPayPalAccount.findUnique({
      where: { merchantId }
    });

    if (!account) {
      throw new Error('Merchant not found');
    }

    return account;
  },

  // تحديث بريد PayPal - Update PayPal email
  async updatePayPalEmail(merchantId: string, paypalEmail: string) {
    const account = await prisma.merchantPayPalAccount.findUnique({
      where: { merchantId }
    });

    if (!account) {
      throw new Error('Merchant not found');
    }

    const updated = await prisma.merchantPayPalAccount.update({
      where: { merchantId },
      data: {
        paypalEmail,
        isVerified: false,
        verifiedAt: null,
        onboardingStatus: 'PENDING'
      }
    });

    return updated;
  },

  // الحصول على جميع التجار - Get all merchants (admin)
  async getAllMerchants(options: {
    status?: OnboardingStatus;
    limit?: number;
    offset?: number;
  } = {}) {
    const { status, limit = 20, offset = 0 } = options;

    const merchants = await prisma.merchantPayPalAccount.findMany({
      where: {
        ...(status && { onboardingStatus: status })
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await prisma.merchantPayPalAccount.count({
      where: {
        ...(status && { onboardingStatus: status })
      }
    });

    return {
      merchants,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  }
};
