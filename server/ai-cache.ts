// Simple in-memory cache for AI analysis results
class AICache {
  private cache: Map<string, { data: any; timestamp: number }>;
  private ttl: number; // Time to live in milliseconds

  constructor(ttl: number = 30 * 60 * 1000) { // Default 30 minutes
    this.cache = new Map();
    this.ttl = ttl;
  }

  // Generate a cache key from image data
  private generateKey(imageData: string): string {
    // For simplicity, we'll use the first 32 characters of the image data as the key
    // In a production environment, you might want to use a proper hashing function
    return imageData.substring(0, 32);
  }

  // Get cached data
  get(imageData: string): any | null {
    const key = this.generateKey(imageData);
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    // Check if cache entry is still valid
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  // Set cached data
  set(imageData: string, data: any): void {
    const key = this.generateKey(imageData);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Clear expired entries
  clearExpired(): void {
    const now = Date.now();
    // Use forEach instead of for...of to avoid TypeScript compilation issues
    this.cache.forEach((value, key) => {
      if (now - value.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    });
  }

  // Get cache size
  size(): number {
    return this.cache.size;
  }

  // Clear all entries
  clear(): void {
    this.cache.clear();
  }
}

// Export a singleton instance
export const aiCache = new AICache();