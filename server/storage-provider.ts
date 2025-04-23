import { IStorage, MemStorage } from './storage';
import { DatabaseStorage } from './database-storage';

// Create and export the appropriate storage implementation
export const storage: IStorage = process.env.DATABASE_URL 
  ? new DatabaseStorage() 
  : new MemStorage();