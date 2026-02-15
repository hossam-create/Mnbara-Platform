import express from 'express';
import cors from 'cors';
import productRoutes from './routes/product.routes';
import cartRoutes from './routes/cart.routes';
import orderRoutes from './routes/order.routes';
import vendorRoutes from './routes/vendor.routes';
import adminVendorRoutes from './routes/admin-vendor.routes';

const app = express();
const PORT = process.env.PORT || 3022;

app.use(cors());
app.use(express.json());

// Store routes
app.use('/api/store/products', productRoutes);
app.use('/api/store/carts', cartRoutes);
app.use('/api/store/orders', orderRoutes);

// Vendor routes
app.use('/api/vendors', vendorRoutes);

// Admin routes
app.use('/api/admin/products', productRoutes);
app.use('/api/admin/orders', orderRoutes);
app.use('/api/admin/vendors', adminVendorRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'medusa-adapter', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Medusa Adapter Service running on port ${PORT}`);
  console.log(`📦 Product catalog, cart, and order management`);
  console.log(`🏪 Multi-vendor marketplace (Mercur extension)`);
});

export default app;
