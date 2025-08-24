import { User as DbUser } from '../models/user';

declare namespace Express {
  export interface User {
    id: string;
    email: string;
    role: string;
  }

  export interface Request {
    user?: User;
    dbUser?: DbUser; // For full user object when needed
  }
}