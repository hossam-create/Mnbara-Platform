// Knowledge Service - Product & Travel Knowledge Base
// خدمة المعرفة - قاعدة معرفة المنتجات والسفر

import { PrismaClient, DataCategory, TravelKnowledgeType } from '@prisma/client';
import { HfInference } from '@huggingface/inference';

const prisma = new PrismaClient();
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export class KnowledgeService {
  // Add product knowledge
  async addProductKnowledge(data: {
    productId?: string;
    categoryId?: string;
    name: string;
    nameAr?: string;
    description: string;
    descriptionAr?: string;
    attributes: any;
    specifications?: any;
  }) {
    // Generate embedding
    const embedding = await this.generateEmbedding(
      `${data.name} ${data.description}`
    );

    return prisma.productKnowledge.create({
      data: {
        ...data,
        embedding
      }
    });
  }

  // Add travel knowledge
  async addTravelKnowledge(data: {
    country: string;
    city?: string;
    type: TravelKnowledgeType;
    title: string;
    titleAr?: string;
    content: string;
    contentAr?: string;
    tags?: string[];
  }) {
    // Generate embedding
    const embedding = await this.generateEmbedding(
      `${data.title} ${data.content}`
    );

    return prisma.travelKnowledge.create({
      data: {
        ...data,
        tags: data.tags || [],
        embedding
      }
    });
  }

  // Search relevant knowledge
  async searchRelevantKnowledge(query: string, category: DataCategory, limit = 5) {
    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query);

    // Search based on category
    if (['SHOPPING_ASSISTANT', 'PRODUCT_SEARCH', 'PRICE_NEGOTIATION'].includes(category)) {
      return this.searchProductKnowledge(queryEmbedding, limit);
    } else if (['TRAVEL_PLANNING', 'CUSTOMS_INFO', 'SHIPPING_HELP'].includes(category)) {
      return this.searchTravelKnowledge(queryEmbedding, limit);
    }

    // Search both for general queries
    const [products, travel] = await Promise.all([
      this.searchProductKnowledge(queryEmbedding, Math.floor(limit / 2)),
      this.searchTravelKnowledge(queryEmbedding, Math.floor(limit / 2))
    ]);

    return [...products, ...travel];
  }

  // Search product knowledge
  private async searchProductKnowledge(queryEmbedding: number[], limit: number) {
    // In production, use vector database like Pinecone or pgvector
    // For now, fetch all and compute similarity
    const products = await prisma.productKnowledge.findMany({
      take: 100
    });

    const scored = products.map(p => ({
      ...p,
      score: this.cosineSimilarity(queryEmbedding, p.embedding)
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(p => ({
        type: 'product',
        id: p.id,
        name: p.name,
        nameAr: p.nameAr,
        content: p.description,
        contentAr: p.descriptionAr,
        score: p.score
      }));
  }

  // Search travel knowledge
  private async searchTravelKnowledge(queryEmbedding: number[], limit: number) {
    const travel = await prisma.travelKnowledge.findMany({
      take: 100
    });

    const scored = travel.map(t => ({
      ...t,
      score: this.cosineSimilarity(queryEmbedding, t.embedding)
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(t => ({
        type: 'travel',
        id: t.id,
        title: t.title,
        titleAr: t.titleAr,
        content: t.content,
        contentAr: t.contentAr,
        country: t.country,
        knowledgeType: t.type,
        score: t.score
      }));
  }

  // Generate embedding
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await hf.featureExtraction({
        model: 'sentence-transformers/all-MiniLM-L6-v2',
        inputs: text
      });
      return response as number[];
    } catch (error) {
      console.error('Embedding error:', error);
      // Return zero vector as fallback
      return new Array(384).fill(0);
    }
  }

  // Cosine similarity
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Get customs info for country
  async getCustomsInfo(country: string) {
    return prisma.travelKnowledge.findMany({
      where: {
        country: { contains: country, mode: 'insensitive' },
        type: { in: ['CUSTOMS_REGULATIONS', 'PROHIBITED_ITEMS', 'TAX_INFO'] }
      }
    });
  }

  // Get shopping tips for country
  async getShoppingTips(country: string) {
    return prisma.travelKnowledge.findMany({
      where: {
        country: { contains: country, mode: 'insensitive' },
        type: { in: ['SHOPPING_TIPS', 'LOCAL_MARKETS', 'CURRENCY_INFO'] }
      }
    });
  }

  // Add training data
  async addTrainingData(data: {
    category: DataCategory;
    subcategory?: string;
    inputText: string;
    inputTextAr?: string;
    outputText: string;
    outputTextAr?: string;
    context?: any;
    source?: string;
  }) {
    return prisma.trainingData.create({
      data: {
        ...data,
        quality: 'UNVERIFIED'
      }
    });
  }

  // Get training data for category
  async getTrainingData(category: DataCategory, quality?: string) {
    return prisma.trainingData.findMany({
      where: {
        category,
        ...(quality ? { quality: quality as any } : {})
      }
    });
  }

  // Verify training data
  async verifyTrainingData(id: string, verifiedBy: string, quality: string) {
    return prisma.trainingData.update({
      where: { id },
      data: {
        quality: quality as any,
        verifiedBy
      }
    });
  }

  // Bulk import knowledge
  async bulkImportProductKnowledge(products: any[]) {
    const results = [];
    for (const product of products) {
      try {
        const result = await this.addProductKnowledge(product);
        results.push({ success: true, id: result.id });
      } catch (error: any) {
        results.push({ success: false, error: error.message });
      }
    }
    return results;
  }

  // Bulk import travel knowledge
  async bulkImportTravelKnowledge(items: any[]) {
    const results = [];
    for (const item of items) {
      try {
        const result = await this.addTravelKnowledge(item);
        results.push({ success: true, id: result.id });
      } catch (error: any) {
        results.push({ success: false, error: error.message });
      }
    }
    return results;
  }

  // Get knowledge stats
  async getKnowledgeStats() {
    const [productCount, travelCount, trainingCount] = await Promise.all([
      prisma.productKnowledge.count(),
      prisma.travelKnowledge.count(),
      prisma.trainingData.count()
    ]);

    const travelByType = await prisma.travelKnowledge.groupBy({
      by: ['type'],
      _count: true
    });

    const trainingByCategory = await prisma.trainingData.groupBy({
      by: ['category'],
      _count: true
    });

    return {
      products: productCount,
      travel: travelCount,
      trainingData: trainingCount,
      travelByType: travelByType.map(t => ({ type: t.type, count: t._count })),
      trainingByCategory: trainingByCategory.map(t => ({ category: t.category, count: t._count }))
    };
  }
}

export const knowledgeService = new KnowledgeService();
