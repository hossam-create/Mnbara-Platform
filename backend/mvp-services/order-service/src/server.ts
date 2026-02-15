import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🎯 MVP Order System running on port ${PORT}`);
  console.log(`🛒 Create order: POST /orders`);
  console.log(`📋 View orders: GET /orders`);
  console.log(`✅ Accept order: POST /orders/:id/accept`);
  console.log(`💳 Process payment: POST /payments`);
});