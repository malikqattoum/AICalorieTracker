import { storage } from './storage-provider';
import { analyzeFoodImage as analyzeWithOpenAI, analyzeMultiFoodImage as analyzeMultiWithOpenAI } from './openai';
import { analyzeWithGemini, analyzeMultiFoodWithGemini, initializeGemini } from './gemini';
import { AIConfig } from '@shared/schema';
import crypto from 'crypto';

// Simple encryption/decryption for API keys
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here'; // In production, use environment variable
const ALGORITHM = 'aes-256-cbc';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = textParts.join(':');
  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export class AIService {
  private static instance: AIService;
  private currentConfig: AIConfig | null = null;
  private initialized = false;

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      this.currentConfig = await this.getActiveConfig();
      if (this.currentConfig) {
        await this.setupProvider(this.currentConfig);
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
    }
  }

  private async getActiveConfig(): Promise<AIConfig | null> {
    try {
      const configs = await storage.getAIConfigs();
      return configs.find(config => config.isActive) || null;
    } catch (error) {
      console.error('Error getting AI config:', error);
      return null;
    }
  }

  private async setupProvider(config: AIConfig): Promise<void> {
    if (!config.apiKeyEncrypted) {
      throw new Error(`No API key configured for ${config.provider}`);
    }

    const apiKey = decrypt(config.apiKeyEncrypted);
    
    if (config.provider === 'gemini') {
      initializeGemini(apiKey);
    }
    // OpenAI is initialized in openai.ts with environment variables
  }

  async refreshConfig(): Promise<void> {
    this.currentConfig = await this.getActiveConfig();
    if (this.currentConfig) {
      await this.setupProvider(this.currentConfig);
    }
  }

  async analyzeFoodImage(imageData: string, prompt?: string): Promise<any> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.currentConfig) {
      throw new Error('No AI provider configured. Please configure an AI provider in the admin panel.');
    }

    const finalPrompt = prompt || this.currentConfig.promptTemplate || 'Analyze this food image and provide nutritional information.';

    try {
      if (this.currentConfig.provider === 'gemini') {
        return await analyzeWithGemini(imageData, finalPrompt, this.currentConfig.modelName!);
      } else {
        // Default to OpenAI
        return await analyzeWithOpenAI(imageData);
      }
    } catch (error) {
      console.error(`${this.currentConfig.provider} analysis failed:`, error);
      throw error;
    }
  }

  async analyzeMultiFoodImage(imageData: string, prompt?: string): Promise<any> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.currentConfig) {
      throw new Error('No AI provider configured. Please configure an AI provider in the admin panel.');
    }

    const finalPrompt = prompt || this.currentConfig.promptTemplate || 'Analyze this food image and identify all food items with their nutritional information.';

    try {
      if (this.currentConfig.provider === 'gemini') {
        return await analyzeMultiFoodWithGemini(imageData, finalPrompt, this.currentConfig.modelName!);
      } else {
        // Default to OpenAI
        return await analyzeMultiWithOpenAI(imageData);
      }
    } catch (error) {
      console.error(`${this.currentConfig.provider} multi-food analysis failed:`, error);
      throw error;
    }
  }

  getCurrentProvider(): string {
    return this.currentConfig?.provider || 'none';
  }

  isConfigured(): boolean {
    return this.currentConfig !== null && this.currentConfig.apiKeyEncrypted !== null;
  }
}

// Storage methods for AI config
export const AIConfigService = {
  async getConfigs(): Promise<AIConfig[]> {
    return await storage.getAIConfigs();
  },

  async updateConfig(id: number, config: Partial<AIConfig & { apiKey?: string }>): Promise<void> {
    const updateData: any = { ...config };
    
    // Encrypt API key if provided
    if (config.apiKey) {
      updateData.apiKeyEncrypted = encrypt(config.apiKey);
      delete updateData.apiKey;
    }

    await storage.updateAIConfig(id, updateData);
    
    // Refresh the AI service configuration
    await AIService.getInstance().refreshConfig();
  },

  async setActiveProvider(providerId: number): Promise<void> {
    // First, deactivate all providers
    await storage.deactivateAllAIConfigs();
    
    // Then activate the selected provider
    await storage.updateAIConfig(providerId, { isActive: true });
    
    // Refresh the AI service configuration
    await AIService.getInstance().refreshConfig();
  },

  encryptApiKey: encrypt,
  decryptApiKey: decrypt
};

export const aiService = AIService.getInstance();