// AI Configuration

export interface AIProviderConfig {
  provider: 'openai' | 'anthropic';
  model: string;
  temperature: number;
  maxTokens: number;
  apiKey?: string;
}

export const aiConfig: AIProviderConfig = {
  provider: (process.env.AI_PROVIDER as 'openai' | 'anthropic') || 'openai',
  model: process.env.AI_MODEL || 'gpt-4',
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '1000', 10)
};

export const openAIConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL || 'gpt-4',
  temperature: 0.7,
  maxTokens: 1000
};

export const anthropicConfig = {
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
  temperature: 0.7,
  maxTokens: 1000
};
