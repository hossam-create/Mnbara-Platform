import app from './app';

const PORT = process.env.PORT || 3006;

app.listen(PORT, () => {
  console.log(`🛍️ Product Service running on port ${PORT}`);
  console.log(`📦 Create Product: POST /products (requires seller subscription)`);
  console.log(`🚀 Publish Product: POST /products/:id/publish (requires seller subscription)`);
  console.log(`📋 Get Products: GET /products (public)`);
  console.log(`🏪 Seller Products: GET /seller/products`);
});