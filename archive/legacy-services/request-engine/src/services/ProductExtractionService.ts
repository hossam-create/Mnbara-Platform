import { Product, ProductExtractionResult, CreateProductData } from '../models/Product';

export class ProductExtractionService {
  constructor(private db: any) {}

  async extractFromUrl(url: string): Promise<ProductExtractionResult> {
    try {
      // Validate URL
      if (!this.isValidUrl(url)) {
        return {
          success: false,
          error: 'Invalid URL format'
        };
      }

      // Check if product already exists
      const existingProduct = await this.getProductByUrl(url);
      if (existingProduct) {
        return {
          success: true,
          product: existingProduct,
          metadata: {
            source: 'database',
            extractionTime: 0,
            confidence: 1.0
          }
        };
      }

      // Extract product data (mock implementation)
      const extractedData = await this.mockExtraction(url);
      
      // Save product to database
      const product = await this.createProduct(extractedData);

      return {
        success: true,
        product,
        metadata: {
          source: 'web_extraction',
          extractionTime: 1000,
          confidence: 0.85
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    const result = await this.db.query('SELECT * FROM products WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbProductToModel(result.rows[0]);
  }

  async getProductByUrl(url: string): Promise<Product | null> {
    const result = await this.db.query('SELECT * FROM products WHERE url = $1', [url]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbProductToModel(result.rows[0]);
  }

  private async createProduct(data: CreateProductData): Promise<Product> {
    const result = await this.db.query(`
      INSERT INTO products (
        url, title, description, image, price, currency, original_price,
        seller_name, seller_rating, seller_url, specifications,
        extraction_source, extraction_confidence
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      data.url,
      data.title,
      data.description,
      data.image,
      data.price,
      data.currency,
      data.originalPrice,
      data.seller?.name,
      data.seller?.rating,
      data.seller?.url,
      JSON.stringify(data.specifications),
      'web_extraction',
      0.85
    ]);

    return this.mapDbProductToModel(result.rows[0]);
  }

  private async mockExtraction(url: string): Promise<CreateProductData> {
    // Mock product extraction - in real implementation, this would:
    // 1. Use web scraping libraries (puppeteer, cheerio)
    // 2. Call product extraction APIs (Amazon, eBay, etc.)
    // 3. Use ML models for structured data extraction
    
    // Simulate extraction delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock data based on URL patterns
    if (url.includes('amazon')) {
      return {
        url,
        title: 'iPhone 15 Pro Max 256GB Natural Titanium',
        description: 'iPhone 15 Pro Max features a new titanium design, A17 Pro chip with GPU, and pro camera system',
        image: 'https://example.com/iphone-image.jpg',
        price: 1199.99,
        currency: 'USD',
        originalPrice: 1299.99,
        seller: {
          name: 'Amazon',
          rating: 4.5,
          url: 'https://amazon.com/stores'
        },
        specifications: {
          brand: 'Apple',
          model: 'iPhone 15 Pro Max',
          storage: '256GB',
          color: 'Natural Titanium',
          display: '6.7-inch Super Retina XDR',
          camera: '48MP Main camera',
          processor: 'A17 Pro chip'
        }
      };
    } else if (url.includes('ebay')) {
      return {
        url,
        title: 'Samsung Galaxy S24 Ultra 512GB Titanium Violet',
        description: 'Samsung Galaxy S24 Ultra with S Pen, 512GB storage, and advanced camera system',
        image: 'https://example.com/galaxy-image.jpg',
        price: 1099.99,
        currency: 'USD',
        seller: {
          name: 'Samsung Official Store',
          rating: 4.8,
          url: 'https://ebay.com/str/samsung'
        },
        specifications: {
          brand: 'Samsung',
          model: 'Galaxy S24 Ultra',
          storage: '512GB',
          color: 'Titanium Violet',
          display: '6.8-inch Dynamic AMOLED 2X',
          camera: '200MP Main camera',
          processor: 'Snapdragon 8 Gen 3'
        }
      };
    } else {
      // Generic mock data
      return {
        url,
        title: 'Premium Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation and premium sound',
        image: 'https://example.com/headphones-image.jpg',
        price: 299.99,
        currency: 'USD',
        seller: {
          name: 'Electronics Store',
          rating: 4.2,
          url: 'https://example.com/store'
        },
        specifications: {
          brand: 'AudioTech',
          model: 'Wireless Pro X',
          connectivity: 'Bluetooth 5.0',
          battery: '30 hours',
          features: ['Noise Cancellation', 'Voice Assistant', 'Fast Charging']
        }
      };
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private mapDbProductToModel(row: any): Product {
    return {
      id: row.id,
      url: row.url,
      title: row.title,
      description: row.description,
      image: row.image,
      price: parseFloat(row.price),
      currency: row.currency,
      originalPrice: row.original_price ? parseFloat(row.original_price) : undefined,
      availability: row.availability,
      seller: {
        name: row.seller_name,
        rating: row.seller_rating ? parseFloat(row.seller_rating) : undefined,
        url: row.seller_url
      },
      specifications: row.specifications ? JSON.parse(row.specifications) : undefined,
      extractedAt: row.created_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
