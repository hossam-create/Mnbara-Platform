import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMResponse {
  content: string;
  tokens: number;
  model: string;
}

export class LLMService {
  private openai: OpenAI;
  private anthropic: Anthropic;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }

  // Generate completion with OpenAI
  async generateOpenAI(
    messages: LLMMessage[],
    model: string = 'gpt-4',
    temperature: number = 0.7,
    maxTokens: number = 2000
  ): Promise<LLMResponse> {
    try {
      const completion = await this.openai.chat.completions.create({
        model,
        messages: messages as any[],
        temperature,
        max_tokens: maxTokens
      });

      const content = completion.choices[0]?.message?.content || '';
      const tokens = completion.usage?.total_tokens || 0;

      logger.info(`OpenAI completion generated: ${tokens} tokens`);

      return {
        content,
        tokens,
        model
      };
    } catch (error) {
      logger.error('OpenAI generation error:', error);
      throw error;
    }
  }

  // Generate completion with Anthropic Claude
  async generateClaude(
    messages: LLMMessage[],
    model: string = 'claude-3-sonnet-20240229',
    temperature: number = 0.7,
    maxTokens: number = 2000
  ): Promise<LLMResponse> {
    try {
      // Extract system message
      const systemMessage = messages.find(m => m.role === 'system');
      const conversationMessages = messages.filter(m => m.role !== 'system');

      const response = await this.anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemMessage?.content,
        messages: conversationMessages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }))
      });

      const content = response.content[0]?.type === 'text' 
        ? response.content[0].text 
        : '';
      
      const tokens = response.usage.input_tokens + response.usage.output_tokens;

      logger.info(`Claude completion generated: ${tokens} tokens`);

      return {
        content,
        tokens,
        model
      };
    } catch (error) {
      logger.error('Claude generation error:', error);
      throw error;
    }
  }

  // Generate completion (auto-select provider)
  async generate(
    messages: LLMMessage[],
    model: string,
    temperature: number = 0.7,
    maxTokens: number = 2000
  ): Promise<LLMResponse> {
    if (model.startsWith('gpt-')) {
      return this.generateOpenAI(messages, model, temperature, maxTokens);
    } else if (model.startsWith('claude-')) {
      return this.generateClaude(messages, model, temperature, maxTokens);
    } else {
      throw new Error(`Unsupported model: ${model}`);
    }
  }

  // Stream completion (OpenAI)
  async *streamOpenAI(
    messages: LLMMessage[],
    model: string = 'gpt-4',
    temperature: number = 0.7,
    maxTokens: number = 2000
  ): AsyncGenerator<string> {
    try {
      const stream = await this.openai.chat.completions.create({
        model,
        messages: messages as any[],
        temperature,
        max_tokens: maxTokens,
        stream: true
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      logger.error('OpenAI streaming error:', error);
      throw error;
    }
  }

  // Generate embeddings
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text
      });

      return response.data[0].embedding;
    } catch (error) {
      logger.error('Embedding generation error:', error);
      throw error;
    }
  }
}
