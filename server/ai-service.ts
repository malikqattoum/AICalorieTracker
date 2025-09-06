import { storage } from './storage-provider';
import { analyzeFoodImage as analyzeWithOpenAI, analyzeMultiFoodImage as analyzeMultiWithOpenAI } from './openai';
import { analyzeWithGemini, analyzeMultiFoodWithGemini, initializeGemini } from './gemini';
import { AIConfig } from '@shared/schema';
import crypto from 'crypto';

// Simple encryption/decryption for API keys
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here'; // In production, use environment variable
const ALGORITHM = 'aes-256-cbc';

function encrypt(text: string): string {
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = textParts.join(':');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
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
      console.log(`AI Config Debug: Found ${configs.length} configs`);
      const activeConfig = configs.find(config => config.isActive) || null;
      console.log(`AI Config Debug: Active config: ${activeConfig ? activeConfig.provider : 'none'}`);
      return activeConfig;
    } catch (error) {
      console.error('Error getting AI config:', error);
      return null;
    }
  }

  private async setupProvider(config: AIConfig): Promise<void> {
    // Only Gemini requires decrypting an API key stored in DB.
    if (config.provider === 'gemini') {
      if (!config.apiKeyEncrypted) {
        throw new Error('No API key configured for gemini');
      }
      let apiKey: string;
      try {
        apiKey = decrypt(config.apiKeyEncrypted);
      } catch (e) {
        throw new Error('Failed to decrypt Gemini API key. Ensure ENCRYPTION_KEY matches the one used for encryption.');
      }
      initializeGemini(apiKey);
      return;
    }

    // OpenAI uses environment variables only; do not decrypt or require apiKeyEncrypted
    if (config.provider === 'openai') {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set');
      }
      return;
    }
  }

  async refreshConfig(): Promise<void> {
    this.currentConfig = await this.getActiveConfig();
    if (this.currentConfig) {
      await this.setupProvider(this.currentConfig);
    }
  }

  async analyzeFoodImage(imageData: string, prompt?: string): Promise<any> {
    console.log(`AI Service Debug: Initialized: ${this.initialized}, Current Config: ${this.currentConfig ? this.currentConfig.provider : 'null'}`);
    if (!this.initialized) {
      console.log('AI Service Debug: Initializing service...');
      await this.initialize();
      console.log(`AI Service Debug: After init - Initialized: ${this.initialized}, Current Config: ${this.currentConfig ? this.currentConfig.provider : 'null'}`);
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

    const finalPrompt = prompt || this.currentConfig.promptTemplate || `
      Analyze this food image and identify all food items with their nutritional information.
      For each food item, provide:
      - Name
      - Estimated portion size in grams
      - Reference object for size comparison (e.g., "similar to a baseball")
      - Calories
      - Macronutrients (protein, carbs, fat)
      - Micronutrients (vitamins, minerals)
      - Density score (1-100) based on nutrient density
      - Allergens present
      - Health impact rating (1-5)
    `;

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

interface FoodAnalysis {
  foods: Array<{
    name: string;
    boundingBox: [number, number, number, number];
    dimensions?: { width: number; height: number; depth?: number };
    estimatedWeight?: number;
  }>;
  referenceObject?: {
    type: string;
    confidence: number;
    dimensions: { width: number; height: number };
  };
}