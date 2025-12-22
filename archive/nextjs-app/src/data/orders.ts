export type OrderStatus = 'awaiting_delivery' | 'delivered_pending_release' | 'disputed' | 'cancelled';

export type MarketplaceOrder = {
  id: string;
  listingTitle: string;
  buyerName: string;
  travelerName: string;
  status: OrderStatus;
  deliveryDueDate: string; // ISO
  lastBuyerActionAt: string;
  lastTravelerActionAt: string;
  paymentIntentId: string;
  corridorRisk: 'low' | 'medium' | 'high';
};

export const mockOrders: MarketplaceOrder[] = [
  {
    id: 'ORD-1088',
    listingTitle: 'Limited Nike Pegasus release',
    buyerName: 'Mariam Farouk',
    travelerName: 'Hassan Idris',
    status: 'awaiting_delivery',
    deliveryDueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    lastBuyerActionAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    lastTravelerActionAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    paymentIntentId: 'pi_8901',
    corridorRisk: 'medium',
  },
  {
    id: 'ORD-1094',
    listingTitle: 'Tokyo Streetwear drop',
    buyerName: 'Omar El-Naggar',
    travelerName: 'Sana Al-Khalil',
    status: 'delivered_pending_release',
    deliveryDueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    lastBuyerActionAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    lastTravelerActionAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    paymentIntentId: 'pi_9012',
    corridorRisk: 'high',
  },
  {
    id: 'ORD-1102',
    listingTitle: 'Paris artisan chocolates',
    buyerName: 'Layla Yassin',
    travelerName: 'Karim Said',
    status: 'awaiting_delivery',
    deliveryDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastBuyerActionAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    lastTravelerActionAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    paymentIntentId: 'pi_9345',
    corridorRisk: 'low',
  },
];
