// Model Service - Manage Open Source AI Models
// خدمة النماذج - إدارة نماذج الذكاء الاصطناعي مفتوحة المصدر

import { PrismaClient, ModelStatus, TrainingType, JobStatus } from '@prisma/client';
import { HfInference } from '@huggingface/inference';
import axios from 'axios';

const prisma = new PrismaClient();
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Available Open Source Models
const AVAILABLE_MODELS = {
  // Large Language Models
  'mistral-7b': {
    name: 'Mistral 7B',
    huggingfaceId: 'mistralai/Mistral-7B-Instruct-v0.2',
    parameters: 7_000_000_000,
    contextLength: 8192,
    description: 'Powerful 7B model, great for chat and reasoning',
    descriptionAr: 'نموذج قوي 7 مليار، ممتاز للمحادثة والتفكير'
  },
  'llama-2-7b': {
    name: 'Llama 2 7B',
    huggingfaceId: 'meta-llama/Llama-2-7b-chat-hf',
    parameters: 7_000_000_000,
    contextLength: 4096,
    description: 'Meta\'s open source LLM, excellent for conversations',
    descriptionAr: 'نموذج ميتا مفتوح المصدر، ممتاز للمحادثات'
  },
  'falcon-7b': {
    name: 'Falcon 7B',
    huggingfaceId: 'tiiuae/falcon-7b-instruct',
    parameters: 7_000_000_000,
    contextLength: 2048,
    description: 'TII\'s Falcon model, trained on high-quality data',
    descriptionAr: 'نموذج فالكون من TII، مدرب على بيانات عالية الجودة'
  },
  'phi-2': {
    name: 'Phi-2',
    huggingfaceId: 'microsoft/phi-2',
    parameters: 2_700_000_000,
    contextLength: 2048,
    description: 'Microsoft\'s small but powerful model',
    descriptionAr: 'نموذج مايكروسوفت الصغير لكن القوي'
  },
  'gemma-7b': {
    name: 'Gemma 7B',
    huggingfaceId: 'google/gemma-7b-it',
    parameters: 7_000_000_000,
    contextLength: 8192,
    description: 'Google\'s open model, great for instructions',
    descriptionAr: 'نموذج جوجل المفتوح، ممتاز للتعليمات'
  },
  // Arabic-focused models
  'jais-13b': {
    name: 'Jais 13B',
    huggingfaceId: 'core42/jais-13b-chat',
    parameters: 13_000_000_000,
    contextLength: 2048,
    description: 'Arabic-English bilingual model from UAE',
    descriptionAr: 'نموذج ثنائي اللغة عربي-إنجليزي من الإمارات'
  },
  'aragpt2': {
    name: 'AraGPT2',
    huggingfaceId: 'aubmindlab/aragpt2-mega',
    parameters: 1_500_000_000,
    contextLength: 1024,
    description: 'Arabic GPT-2 model',
    descriptionAr: 'نموذج GPT-2 عربي'
  }
};

// Embedding Models
const EMBEDDING_MODELS = {
  'all-minilm': {
    name: 'all-MiniLM-L6-v2',
    huggingfaceId: 'sentence-transformers/all-MiniLM-L6-v2',
    dimensions: 384
  },
  'multilingual-e5': {
    name: 'multilingual-e5-large',
    huggingfaceId: 'intfloat/multilingual-e5-large',
    dimensions: 1024
  },
  'arabic-bert': {
    name: 'Arabic BERT',
    huggingfaceId: 'aubmindlab/bert-base-arabertv2',
    dimensions: 768
  }
};

export class ModelService {
  // List available models
  async listAvailableModels() {
    return {
      llm: Object.entries(AVAILABLE_MODELS).map(([key, model]) => ({
        id: key,
        ...model
      })),
      embedding: Object.entries(EMBEDDING_MODELS).map(([key, model]) => ({
        id: key,
        ...model
      }))
    };
  }

  // Initialize a model
  async initializeModel(modelKey: string) {
    const modelConfig = AVAILABLE_MODELS[modelKey as keyof typeof AVAILABLE_MODELS];
    if (!modelConfig) {
      throw new Error(`Model ${modelKey} not found`);
    }

    // Check if already exists
    const existing = await prisma.aIModel.findUnique({
      where: { name: modelKey }
    });

    if (existing) {
      return existing;
    }

    // Create model record
    const model = await prisma.aIModel.create({
      data: {
        name: modelKey,
        version: '1.0.0',
        baseModel: modelConfig.huggingfaceId,
        parameters: BigInt(modelConfig.parameters),
        contextLength: modelConfig.contextLength,
        status: 'INITIALIZING',
        description: modelConfig.description,
        descriptionAr: modelConfig.descriptionAr
      }
    });

    // Start download in background
    this.downloadModel(model.id, modelConfig.huggingfaceId);

    return model;
  }

  // Download model from Hugging Face
  private async downloadModel(modelId: string, huggingfaceId: string) {
    try {
      await prisma.aIModel.update({
        where: { id: modelId },
        data: { status: 'DOWNLOADING', trainingProgress: 0 }
      });

      // In production, this would download the model files
      // For now, we'll use the Hugging Face Inference API
      console.log(`Downloading model: ${huggingfaceId}`);

      // Simulate download progress
      for (let i = 0; i <= 100; i += 10) {
        await prisma.aIModel.update({
          where: { id: modelId },
          data: { trainingProgress: i }
        });
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      await prisma.aIModel.update({
        where: { id: modelId },
        data: { 
          status: 'READY',
          trainingProgress: 100,
          modelPath: `/models/${huggingfaceId.replace('/', '_')}`
        }
      });

      console.log(`Model ${huggingfaceId} ready!`);
    } catch (error) {
      await prisma.aIModel.update({
        where: { id: modelId },
        data: { status: 'ERROR' }
      });
      throw error;
    }
  }

  // Get model status
  async getModelStatus(modelId: string) {
    return prisma.aIModel.findUnique({
      where: { id: modelId },
      include: {
        trainingJobs: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });
  }

  // List all models
  async listModels() {
    return prisma.aIModel.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  // Create fine-tuning job
  async createFineTuningJob(data: {
    modelId: string;
    datasetName: string;
    datasetSize: number;
    type?: TrainingType;
    epochs?: number;
    batchSize?: number;
    learningRate?: number;
    loraRank?: number;
  }) {
    const model = await prisma.aIModel.findUnique({
      where: { id: data.modelId }
    });

    if (!model) {
      throw new Error('Model not found');
    }

    const job = await prisma.trainingJob.create({
      data: {
        modelId: data.modelId,
        type: data.type || 'LORA',
        datasetName: data.datasetName,
        datasetSize: data.datasetSize,
        epochs: data.epochs || 3,
        batchSize: data.batchSize || 8,
        learningRate: data.learningRate || 0.0001,
        loraRank: data.loraRank || 8,
        status: 'PENDING'
      }
    });

    // Start training in background
    this.runTrainingJob(job.id);

    return job;
  }


  // Run training job
  private async runTrainingJob(jobId: string) {
    try {
      const job = await prisma.trainingJob.update({
        where: { id: jobId },
        data: { 
          status: 'RUNNING',
          startedAt: new Date()
        },
        include: { model: true }
      });

      await prisma.aIModel.update({
        where: { id: job.modelId },
        data: { status: 'FINE_TUNING' }
      });

      console.log(`Starting ${job.type} training for model ${job.model.name}`);

      // Simulate training epochs
      for (let epoch = 1; epoch <= job.epochs; epoch++) {
        await prisma.trainingJob.update({
          where: { id: jobId },
          data: {
            currentEpoch: epoch,
            progress: (epoch / job.epochs) * 100,
            trainLoss: 2.5 - (epoch * 0.5), // Simulated decreasing loss
            validationLoss: 2.7 - (epoch * 0.45),
            logs: {
              push: `Epoch ${epoch}/${job.epochs} completed - Loss: ${(2.5 - epoch * 0.5).toFixed(4)}`
            }
          }
        });

        // Simulate epoch time
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Complete training
      await prisma.trainingJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          progress: 100,
          completedAt: new Date()
        }
      });

      await prisma.aIModel.update({
        where: { id: job.modelId },
        data: {
          status: 'READY',
          trainedAt: new Date(),
          version: `${job.model.version}-ft-${Date.now()}`
        }
      });

      console.log(`Training completed for job ${jobId}`);
    } catch (error: any) {
      await prisma.trainingJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          errorMessage: error.message
        }
      });
      throw error;
    }
  }

  // Get training job status
  async getTrainingJob(jobId: string) {
    return prisma.trainingJob.findUnique({
      where: { id: jobId },
      include: { model: true }
    });
  }

  // List training jobs
  async listTrainingJobs(modelId?: string) {
    return prisma.trainingJob.findMany({
      where: modelId ? { modelId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { model: true }
    });
  }

  // Generate text using model
  async generateText(modelName: string, prompt: string, options?: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
  }) {
    const model = await prisma.aIModel.findUnique({
      where: { name: modelName }
    });

    if (!model || model.status !== 'READY') {
      throw new Error('Model not ready');
    }

    const startTime = Date.now();

    try {
      // Use Hugging Face Inference API
      const response = await hf.textGeneration({
        model: model.baseModel,
        inputs: prompt,
        parameters: {
          max_new_tokens: options?.maxTokens || 512,
          temperature: options?.temperature || 0.7,
          top_p: options?.topP || 0.95,
          return_full_text: false
        }
      });

      const latency = Date.now() - startTime;

      // Log inference
      await prisma.aIInference.create({
        data: {
          modelId: model.id,
          inputType: 'TEXT',
          inputText: prompt,
          outputText: response.generated_text,
          latency,
          tokensUsed: response.generated_text.split(' ').length
        }
      });

      return {
        text: response.generated_text,
        latency,
        model: modelName
      };
    } catch (error) {
      console.error('Generation error:', error);
      throw error;
    }
  }

  // Generate embeddings
  async generateEmbedding(text: string, modelKey = 'all-minilm') {
    const embeddingModel = EMBEDDING_MODELS[modelKey as keyof typeof EMBEDDING_MODELS];
    if (!embeddingModel) {
      throw new Error(`Embedding model ${modelKey} not found`);
    }

    const response = await hf.featureExtraction({
      model: embeddingModel.huggingfaceId,
      inputs: text
    });

    return {
      embedding: response as number[],
      dimensions: embeddingModel.dimensions,
      model: embeddingModel.name
    };
  }

  // Get model metrics
  async getModelMetrics(modelId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const inferences = await prisma.aIInference.findMany({
      where: {
        modelId,
        createdAt: { gte: startDate }
      }
    });

    const totalInferences = inferences.length;
    const avgLatency = totalInferences 
      ? inferences.reduce((sum, i) => sum + i.latency, 0) / totalInferences 
      : 0;
    const avgTokens = totalInferences
      ? inferences.reduce((sum, i) => sum + i.tokensUsed, 0) / totalInferences
      : 0;
    const ratings = inferences.filter(i => i.userRating !== null);
    const avgRating = ratings.length
      ? ratings.reduce((sum, i) => sum + (i.userRating || 0), 0) / ratings.length
      : 0;

    return {
      period: `${days} days`,
      totalInferences,
      avgLatency: Math.round(avgLatency),
      avgTokens: Math.round(avgTokens),
      avgRating: avgRating.toFixed(2),
      ratedInferences: ratings.length
    };
  }
}

export const modelService = new ModelService();
