import { Request, Response } from 'express';

// Simple in-memory storage for MVP
interface Order {
  id: string;
  buyerId: string;
  travelerId?: string;
  itemName: string;
  itemPrice?: number;
  serviceFee: number;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  originCountry: string;
  purchaseCountry: string;
  deliveryCountry: string;
  createdAt: Date;
  updatedAt: Date;
  acceptedAt?: Date;
  completedAt?: Date;
}

const orders: Order[] = [];

/**
 * Create a new order request (like eBay "Buy It Now" + Hitchhikers)
 * User says: "I want this item from this country"
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user-' + Math.random().toString(36).substr(2, 9);
    const { itemName, itemPrice, originCountry, purchaseCountry, deliveryCountry } = req.body;

    // Validate input
    if (!itemName || !originCountry) {
      return res.status(400).json({
        success: false,
        error: 'Item name and origin country are required'
      });
    }

    // Create order with simple fee structure
    const serviceFee = 2.99; // Flat fee for now
    const totalAmount = (itemPrice || 0) + serviceFee;

    const order: Order = {
      id: 'order-' + Math.random().toString(36).substr(2, 9),
      buyerId: userId,
      itemName,
      itemPrice: itemPrice || 0,
      serviceFee,
      status: 'pending',
      originCountry,
      purchaseCountry: purchaseCountry || originCountry,
      deliveryCountry: deliveryCountry || 'US',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    orders.push(order);

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order request created successfully',
      fee: `$${serviceFee} service fee applied`
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }
};

/**
 * Get available orders for travelers to see
 */
export const getOrders = async (req: Request, res: Response) => {
  try {
    const { country, status = 'pending', page = 1, limit = 20 } = req.query;

    let filteredOrders = orders;
    
    if (country) {
      filteredOrders = filteredOrders.filter(order => order.originCountry === country);
    }
    
    if (status) {
      filteredOrders = filteredOrders.filter(order => order.status === status);
    }

    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedOrders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredOrders.length,
        totalPages: Math.ceil(filteredOrders.length / Number(limit))
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
};

/**
 * Traveler accepts an order (like Uber driver accepting ride)
 */
export const acceptOrder = async (req: Request, res: Response) => {
  try {
    const travelerId = (req as any).user?.id || 'traveler-' + Math.random().toString(36).substr(2, 9);
    const { orderId } = req.params;
    const { message, estimatedDelivery } = req.body;

    // Find the order
    const orderIndex = orders.findIndex(order => order.id === orderId);
    
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    const order = orders[orderIndex];

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Order is no longer available'
      });
    }

    // Accept the order
    order.status = 'accepted';
    order.travelerId = travelerId;
    order.acceptedAt = new Date();
    order.updatedAt = new Date();

    res.json({
      success: true,
      data: order,
      message: 'Order accepted successfully!',
      nextSteps: [
        'Contact buyer to arrange pickup',
        'Update delivery status',
        'Get paid when delivered'
      ]
    });

  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept order'
    });
  }
};