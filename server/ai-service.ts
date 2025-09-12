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
      const configs = await storage.getAIConfigs().catch(() => [] as any[]);
      if (Array.isArray(configs)) {
        console.log(`AI Config Debug: Found ${configs.length} configs`);
        const activeConfig = configs.find((config: any) => config.isActive) || null;
        console.log(`AI Config Debug: Active config: ${activeConfig ? activeConfig.provider : 'none'}`);
        if (activeConfig) return activeConfig as AIConfig;
      }
      // Fallback: if no DB config found, but OPENAI_API_KEY exists, use OpenAI as default provider
      if (process.env.OPENAI_API_KEY) {
        console.warn('AI Config Debug: No active AI config found in DB. Falling back to OpenAI via environment variable.');
        const now = new Date();
        return {
          id: 0,
          provider: 'openai',
          apiKeyEncrypted: null,
          modelName: 'gpt-4o',
          promptTemplate: null,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        } as AIConfig;
      }
      return null;
    } catch (error) {
      console.error('Error getting AI config:', error);
      // Same fallback on error
      if (process.env.OPENAI_API_KEY) {
        const now = new Date();
        return {
          id: 0,
          provider: 'openai',
          apiKeyEncrypted: null,
          modelName: 'gpt-4o',
          promptTemplate: null,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        } as AIConfig;
      }
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

  async analyzeFoodImage(imageData: string, prompt?: string, userId?: number): Promise<any> {
    console.log(`AI Service Debug: Initialized: ${this.initialized}, Current Config: ${this.currentConfig ? this.currentConfig.provider : 'null'}`);
    if (!this.initialized) {
      console.log('AI Service Debug: Initializing service...');
      await this.initialize();
      console.log(`AI Service Debug: After init - Initialized: ${this.initialized}, Current Config: ${this.currentConfig ? this.currentConfig.provider : 'null'}`);
    }

    if (!this.currentConfig) {
      throw new Error('No AI provider configured. Please configure an AI provider in the admin panel.');
    }

    // Convert base64 to buffer for hashing
    let imageBuffer: Buffer;
    try {
      imageBuffer = Buffer.from(imageData, 'base64');
    } catch (error) {
      throw new Error('Invalid base64 image data');
    }

    const finalPrompt = prompt || this.currentConfig.promptTemplate || 'Analyze this food image and provide nutritional information.';

    try {
      let result;

      if (this.currentConfig.provider === 'gemini') {
        result = await analyzeWithGemini(imageData, finalPrompt, this.currentConfig.modelName!);
      } else {
        // Default to OpenAI
        result = await analyzeWithOpenAI(imageData);
      }

      // Validate and sanitize result
      const sanitizedResult = this.sanitizeAnalysisResult(result);

      // Ensure result can be properly JSON serialized
      try {
        JSON.stringify(sanitizedResult);
      } catch (jsonError) {
        console.error('Analysis result is not JSON serializable:', jsonError);
        throw new Error('Analysis result contains non-serializable data');
      }

      return sanitizedResult;
    } catch (error) {
      console.error(`${this.currentConfig.provider} analysis failed:`, error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          throw new Error('AI service rate limit exceeded. Please try again later.');
        } else if (error.message.includes('quota')) {
          throw new Error('AI service quota exceeded. Please contact support.');
        } else if (error.message.includes('timeout')) {
          throw new Error('AI service request timed out. Please try again.');
        }
      }

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
    if (!this.currentConfig) return false;

    // For OpenAI, check environment variable
    if (this.currentConfig.provider === 'openai') {
      return !!process.env.OPENAI_API_KEY;
    }

    // For other providers, check encrypted API key
    return this.currentConfig.apiKeyEncrypted !== null;
  }

  /**
   * Sanitize and validate analysis result
   */
  private sanitizeAnalysisResult(result: any): any {
    try {
      // Validate result structure
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid analysis result: expected object');
      }

      // Ensure required fields are present and valid
      const sanitized = { ...result };

      // Validate and sanitize foodName
      if (!result.foodName || typeof result.foodName !== 'string') {
        throw new Error('Invalid analysis result: missing or invalid foodName');
      }
      sanitized.foodName = result.foodName.trim();

      // Validate and sanitize calories
      if (typeof result.calories !== 'number' || result.calories < 0 || result.calories > 10000) {
        throw new Error('Invalid analysis result: missing or invalid calories');
      }
      sanitized.calories = Math.round(result.calories);

      // Validate and sanitize macronutrients
      const macros = ['protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium'];
      for (const macro of macros) {
        if (result[macro] !== undefined) {
          const value = parseFloat(result[macro]);
          if (isNaN(value) || value < 0) {
            sanitized[macro] = 0;
          } else {
            sanitized[macro] = Math.round(value * 100) / 100; // Round to 2 decimal places
          }
        }
      }

      // Validate confidence score
      if (result.confidence !== undefined) {
        const confidence = parseFloat(result.confidence);
        if (isNaN(confidence) || confidence < 0 || confidence > 1) {
          sanitized.confidence = 0.5; // Default confidence
        } else {
          sanitized.confidence = Math.round(confidence * 100) / 100;
        }
      }

      // Sanitize portion size
      if (result.portionSize && typeof result.portionSize === 'string') {
        sanitized.portionSize = result.portionSize.trim();
      }

      // Sanitize tags array
      if (result.tags && Array.isArray(result.tags)) {
        sanitized.tags = result.tags
          .filter((tag: any) => typeof tag === 'string')
          .map((tag: string) => tag.trim())
          .slice(0, 10); // Limit to 10 tags
      }

      return sanitized;
    } catch (error) {
      console.error('Error sanitizing analysis result:', error);
      throw error;
    }
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