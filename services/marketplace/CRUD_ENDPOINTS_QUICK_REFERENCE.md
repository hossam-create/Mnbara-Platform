# CRUD Endpoints Quick Reference
## Marketplace Services - Task 4.2.6

---

## Product Service ✅ FULLY FUNCTIONAL

**Base URL:** `http://localhost:3004`  
**Framework:** NestJS  
**Docs:** `http://localhost:3004/api`

### Endpoints

#### List Products
```bash
GET /api/products?page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

**Query Parameters:**
- `sellerId` - Filter by seller
- `categoryId` - Filter by category
- `status` - active, paused, archived, sold
- `condition` - new, used, refurbished
- `minPrice` / `maxPrice` - Price range
- `city` / `country` - Location
- `isAuction` - true/false
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `sortBy` - Field to sort by (default: createdAt)
- `sortOrder` - asc or desc (default: desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "product-123",
      "name": "Product Name",
      "price": 99.99,
      "status": "active"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

#### Get Product Details
```bash
GET /api/products/:id?incrementViews=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "product-123",
    "name": "Product Name",
    "description": "Description",
    "price": 99.99,
    "status": "active",
    "views": 42,
    "createdAt": "2026-03-02T10:00:00Z"
  }
}
```

---

#### Create Product
```bash
POST /api/products
Content-Type: application/json
x-seller-id: seller-123

{
  "name": "Product Name",
  "description": "Product Description",
  "price": 99.99,
  "categoryId": "category-123",
  "status": "active",
  "condition": "new",
  "sellerId": "seller-123"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "product-123",
    "name": "Product Name",
    "price": 99.99,
    "status": "active",
    "createdAt": "2026-03-02T10:00:00Z"
  }
}
```

---

#### Update Product
```bash
PUT /api/products/:id
Content-Type: application/json
x-seller-id: seller-123

{
  "name": "Updated Name",
  "price": 89.99,
  "description": "Updated Description"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "product-123",
    "name": "Updated Name",
    "price": 89.99,
    "updatedAt": "2026-03-02T11:00:00Z"
  }
}
```

---

#### Delete Product
```bash
DELETE /api/products/:id
x-seller-id: seller-123
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

#### Publish Product
```bash
POST /api/products/:id/publish
x-seller-id: seller-123
```

---

#### Pause Product
```bash
POST /api/products/:id/pause
x-seller-id: seller-123
```

---

#### Archive Product
```bash
POST /api/products/:id/archive
x-seller-id: seller-123
```

---

#### Mark as Sold
```bash
POST /api/products/:id/sold
x-buyer-id: buyer-123
```

---

#### Like Product
```bash
POST /api/products/:id/like
```

---

## Order Service ⚠️ PARTIALLY FUNCTIONAL

**Base URL:** `http://localhost:3003`  
**Framework:** Express.js  
**Status:** Basic endpoints, no database integration

### Endpoints

#### Health Check
```bash
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "service": "order-service",
  "timestamp": "2026-03-02T10:00:00.000Z"
}
```

---

#### List Orders
```bash
GET /api/orders
```

**Response:** (Currently returns empty)
```json
{
  "message": "Order service - order listing endpoint",
  "orders": []
}
```

---

#### Create Order
```bash
POST /api/orders
Content-Type: application/json

{
  "items": [
    {
      "productId": "product-123",
      "quantity": 1,
      "price": 99.99
    }
  ],
  "userId": "user-123"
}
```

**Response:**
```json
{
  "message": "Order service - order creation endpoint",
  "orderId": "order-1709462400000"
}
```

---

#### Get Order
```bash
GET /api/orders/:id
```

**Response:**
```json
{
  "message": "Order service - order detail endpoint",
  "orderId": "order-123"
}
```

---

#### Update Order
```bash
PUT /api/orders/:id
Content-Type: application/json

{
  "status": "shipped"
}
```

**Response:**
```json
{
  "message": "Order service - order update endpoint",
  "orderId": "order-123"
}
```

---

#### Delete Order
```bash
DELETE /api/orders/:id
```

**Response:**
```json
{
  "message": "Order service - order deletion endpoint",
  "orderId": "order-123"
}
```

---

## Cart Service ❌ NOT IMPLEMENTED

**Base URL:** `http://localhost:3005`  
**Framework:** NestJS  
**Status:** Scaffolded, no endpoints available

### Expected Endpoints (Not Yet Implemented)

```
POST   /api/carts              - Create cart
GET    /api/carts              - List carts
GET    /api/carts/:id          - Get cart details
PUT    /api/carts/:id          - Update cart
DELETE /api/carts/:id          - Delete cart
POST   /api/carts/:id/items    - Add item to cart
DELETE /api/carts/:id/items/:itemId - Remove item
```

---

## Testing with cURL

### Product Service

```bash
# List products
curl http://localhost:3004/api/products

# Get product
curl http://localhost:3004/api/products/test-id

# Create product
curl -X POST http://localhost:3004/api/products \
  -H "Content-Type: application/json" \
  -H "x-seller-id: seller-123" \
  -d '{
    "name": "Test Product",
    "price": 99.99,
    "categoryId": "cat-123",
    "status": "active"
  }'

# Update product
curl -X PUT http://localhost:3004/api/products/test-id \
  -H "Content-Type: application/json" \
  -H "x-seller-id: seller-123" \
  -d '{"name": "Updated Name", "price": 89.99}'

# Delete product
curl -X DELETE http://localhost:3004/api/products/test-id \
  -H "x-seller-id: seller-123"
```

### Order Service

```bash
# Health check
curl http://localhost:3003/health

# List orders
curl http://localhost:3003/api/orders

# Create order
curl -X POST http://localhost:3003/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "prod-123", "quantity": 1}],
    "userId": "user-123"
  }'

# Get order
curl http://localhost:3003/api/orders/order-123

# Update order
curl -X PUT http://localhost:3003/api/orders/order-123 \
  -H "Content-Type: application/json" \
  -d '{"status": "shipped"}'

# Delete order
curl -X DELETE http://localhost:3003/api/orders/order-123
```

---

## Testing with Postman

### Import Collection

1. Create new collection: "Marketplace Services"
2. Add requests for each endpoint
3. Set variables:
   - `product_service_url`: http://localhost:3004
   - `order_service_url`: http://localhost:3003
   - `cart_service_url`: http://localhost:3005
   - `seller_id`: seller-123
   - `product_id`: test-id

### Example Request

**Name:** Get Products  
**Method:** GET  
**URL:** `{{product_service_url}}/api/products?page=1&limit=20`

---

## Common Issues & Solutions

### Product Service Not Responding

**Issue:** Connection refused on port 3004

**Solution:**
```bash
# Check if service is running
lsof -i :3004

# Start the service
cd services/marketplace/product-service
npm run dev
```

### Order Service Not Responding

**Issue:** Connection refused on port 3003

**Solution:**
```bash
# Check if service is running
lsof -i :3003

# Start the service
cd services/marketplace/order-service
npm run dev
```

### Cart Service Not Responding

**Issue:** Service not implemented

**Solution:**
- Cart service needs to be implemented
- See TASK_4_2_6_VERIFICATION_SUMMARY.md for details

---

## Performance Tips

### Product Service

1. **Use pagination** - Always specify `page` and `limit`
2. **Filter early** - Use query parameters to reduce data
3. **Sort efficiently** - Sort by indexed fields (createdAt, price)
4. **Cache results** - Cache product details on client side

### Order Service

1. **Batch operations** - Create multiple orders in one request
2. **Use filtering** - Filter by status, date range
3. **Implement pagination** - Once database integration is complete

---

## Security Considerations

### Authentication

- Product Service: Seller ID required in header (`x-seller-id`)
- Order Service: User ID should be verified (not yet implemented)
- Cart Service: User authentication needed (not yet implemented)

### Validation

- Product Service: ✅ Input validation implemented
- Order Service: ⚠️ Validation needed
- Cart Service: ❌ Not implemented

### Rate Limiting

- All services: ⚠️ Rate limiting recommended
- Implement in API Gateway or service middleware

---

## Monitoring

### Health Checks

```bash
# Product Service
curl http://localhost:3004/health

# Order Service
curl http://localhost:3003/health

# Cart Service
curl http://localhost:3005/health
```

### Logs

```bash
# Product Service logs
docker logs product-service

# Order Service logs
docker logs order-service

# Cart Service logs
docker logs cart-service
```

---

## Related Documentation

- [CRUD_ENDPOINTS_VERIFICATION.md](./CRUD_ENDPOINTS_VERIFICATION.md) - Detailed verification report
- [TASK_4_2_6_VERIFICATION_SUMMARY.md](./TASK_4_2_6_VERIFICATION_SUMMARY.md) - Executive summary
- [verify-crud-endpoints.ts](./verify-crud-endpoints.ts) - Automated verification script

---

**Last Updated:** March 2, 2026  
**Status:** Ready for Use  
**Maintenance:** Update as services are enhanced
