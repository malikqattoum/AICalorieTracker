import { IStorage, MemStorage } from './storage';
import { DatabaseStorage } from './database-storage';
import { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } from './config';

// Create and export the appropriate storage implementation
// Use DatabaseStorage if database configuration is available, otherwise use MemStorage
export const storage: IStorage = (DB_HOST && DB_USER && DB_NAME)
  ? new DatabaseStorage()
  : new MemStorage();