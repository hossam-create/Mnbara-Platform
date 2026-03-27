/**
 * CRUD Endpoints Verification Script
 * Task 4.2.6: Verify existing CRUD endpoints work
 * 
 * This script verifies that the marketplace services can start
 * and respond to basic CRUD requests.
 */

import axios, { AxiosError } from 'axios';

interface ServiceConfig {
  name: string;
  port: number;
  baseUrl: string;
  endpoints: EndpointTest[];
}

interface EndpointTest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  expectedStatus?: number;
  data?: any;
}

interface VerificationResult {
  service: string;
  status: 'success' | 'partial' | 'failed';
  endpoints: EndpointResult[];
  summary: string;
}

interface EndpointResult {
  endpoint: string;
  method: string;
  status: 'pass' | 'fail' | 'skip';
  statusCode?: number;
  error?: string;
  response?: any;
}

// Service configurations
const services: ServiceConfig[] = [
  {
    name: 'Product Service',
    port: 3004,
    baseUrl: 'http://localhost:3004',
    endpoints: [
      {
        method: 'GET',
        path: '/health',
        description: 'Health check',
        expectedStatus: 200,
      },
      {
        method: 'GET',
        path: '/api/products',
        description: 'List products',
        expectedStatus: 200,
      },
      {
        method: 'POST',
        path: '/api/products',
        description: 'Create product',
        expectedStatus: 201,
        data: {
          name: 'Test Product',
          description: 'Test Description',
          price: 99.99,
          sellerId: 'test-seller-123',
          categoryId: 'test-category-123',
          status: 'active',
          condition: 'new',
        },
      },
      {
        method: 'GET',
        path: '/api/products/test-id-123',
        description: 'Get product by ID',
        expectedStatus: 200,
      },
      {
        method: 'PUT',
        path: '/api/products/test-id-123',
        description: 'Update product',
        expectedStatus: 200,
        data: {
          name: 'Updated Product',
          price: 89.99,
          sellerId: 'test-seller-123',
        },
      },
      {
        method: 'DELETE',
        path: '/api/products/test-id-123',
        description: 'Delete product',
        expectedStatus: 200,
      },
    ],
  },
  {
    name: 'Order Service',
    port: 3003,
    baseUrl: 'http://localhost:3003',
    endpoints: [
      {
        method: 'GET',
        path: '/health',
        description: 'Health check',
        expectedStatus: 200,
      },
      {
        method: 'GET',
        path: '/api/orders',
        description: 'List orders',
        expectedStatus: 200,
      },
      {
        method: 'POST',
        path: '/api/orders',
        description: 'Create order',
        expectedStatus: 200,
        data: {
          items: [
            {
              productId: 'product-123',
              quantity: 1,
              price: 99.99,
            },
          ],
          userId: 'user-123',
        },
      },
      {
        method: 'GET',
        path: '/api/orders/order-123',
        description: 'Get order by ID',
        expectedStatus: 200,
      },
      {
        method: 'PUT',
        path: '/api/orders/order-123',
        description: 'Update order',
        expectedStatus: 200,
        data: {
          status: 'shipped',
        },
      },
      {
        method: 'DELETE',
        path: '/api/orders/order-123',
        description: 'Delete order',
        expectedStatus: 200,
      },
    ],
  },
  {
    name: 'Cart Service',
    port: 3005,
    baseUrl: 'http://localhost:3005',
    endpoints: [
      {
        method: 'GET',
        path: '/health',
        description: 'Health check',
        expectedStatus: 200,
      },
      {
        method: 'GET',
        path: '/api/carts',
        description: 'List carts',
        expectedStatus: 200,
      },
      {
        method: 'POST',
        path: '/api/carts',
        description: 'Create cart',
        expectedStatus: 201,
        data: {
          userId: 'user-123',
        },
      },
    ],
  },
];

/**
 * Test a single endpoint
 */
async function testEndpoint(
  baseUrl: string,
  test: EndpointTest,
): Promise<EndpointResult> {
  const url = `${baseUrl}${test.path}`;
  const endpoint = `${test.method} ${test.path}`;

  try {
    let response;

    switch (test.method) {
      case 'GET':
        response = await axios.get(url, { validateStatus: () => true });
        break;
      case 'POST':
        response = await axios.post(url, test.data || {}, {
          validateStatus: () => true,
        });
        break;
      case 'PUT':
        response = await axios.put(url, test.data || {}, {
          validateStatus: () => true,
        });
        break;
      case 'DELETE':
        response = await axios.delete(url, { validateStatus: () => true });
        break;
    }

    const statusMatch =
      !test.expectedStatus || response.status === test.expectedStatus;

    return {
      endpoint,
      method: test.method,
      status: statusMatch ? 'pass' : 'fail',
      statusCode: response.status,
      response: response.data,
    };
  } catch (error) {
    const axiosError = error as AxiosError;
    return {
      endpoint,
      method: test.method,
      status: 'fail',
      error: axiosError.message,
      statusCode: axiosError.response?.status,
    };
  }
}

/**
 * Test all endpoints for a service
 */
async function testService(
  config: ServiceConfig,
): Promise<VerificationResult> {
  console.log(`\n🔍 Testing ${config.name}...`);

  const results: EndpointResult[] = [];

  for (const endpoint of config.endpoints) {
    const result = await testEndpoint(config.baseUrl, endpoint);
    results.push(result);

    const icon = result.status === 'pass' ? '✅' : '❌';
    console.log(
      `  ${icon} ${result.endpoint} - ${result.statusCode || 'No response'}`,
    );

    if (result.error) {
      console.log(`     Error: ${result.error}`);
    }
  }

  const passCount = results.filter((r) => r.status === 'pass').length;
  const totalCount = results.length;
  const status =
    passCount === totalCount ? 'success' : passCount > 0 ? 'partial' : 'failed';

  const summary = `${passCount}/${totalCount} endpoints responding`;

  return {
    service: config.name,
    status,
    endpoints: results,
    summary,
  };
}

/**
 * Main verification function
 */
async function verifyAllServices(): Promise<void> {
  console.log('🚀 Starting CRUD Endpoints Verification');
  console.log('=====================================\n');

  const results: VerificationResult[] = [];

  for (const service of services) {
    const result = await testService(service);
    results.push(result);
  }

  // Print summary
  console.log('\n\n📊 Verification Summary');
  console.log('=======================\n');

  for (const result of results) {
    const icon =
      result.status === 'success'
        ? '✅'
        : result.status === 'partial'
          ? '⚠️'
          : '❌';
    console.log(`${icon} ${result.service}: ${result.summary}`);
  }

  // Overall status
  const allSuccess = results.every((r) => r.status === 'success');
  const someSuccess = results.some((r) => r.status !== 'failed');

  console.log('\n' + '='.repeat(40));
  if (allSuccess) {
    console.log('✅ All services verified successfully!');
  } else if (someSuccess) {
    console.log('⚠️  Some services have issues');
  } else {
    console.log('❌ All services failed verification');
  }
  console.log('='.repeat(40));

  // Detailed results
  console.log('\n\n📋 Detailed Results');
  console.log('===================\n');

  for (const result of results) {
    console.log(`\n${result.service}`);
    console.log('-'.repeat(result.service.length));

    for (const endpoint of result.endpoints) {
      const icon = endpoint.status === 'pass' ? '✅' : '❌';
      console.log(`${icon} ${endpoint.endpoint}`);

      if (endpoint.statusCode) {
        console.log(`   Status: ${endpoint.statusCode}`);
      }

      if (endpoint.error) {
        console.log(`   Error: ${endpoint.error}`);
      }

      if (endpoint.response && endpoint.status === 'pass') {
        console.log(`   Response: ${JSON.stringify(endpoint.response).substring(0, 100)}...`);
      }
    }
  }
}

// Run verification
verifyAllServices().catch((error) => {
  console.error('Verification failed:', error);
  process.exit(1);
});
