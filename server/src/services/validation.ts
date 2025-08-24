import { Request, Response, NextFunction } from 'express';

interface ValidationRule {
  required?: boolean;
  type?: 'email' | 'string' | 'number' | 'boolean';
  minLength?: number;
  min?: number;
}

export default {
  validate(schema: Record<string, ValidationRule>) {
    return (req: Request, res: Response, next: NextFunction) => {
      for (const [field, rules] of Object.entries(schema)) {
        const value = req.body[field];
        
        // Check required fields
        if (rules.required && !value) {
          return res.status(400).json({ error: `${field} is required` });
        }
        
        if (value) {
          // Check email format
          if (rules.type === 'email' && !/^\S+@\S+\.\S+$/.test(value)) {
            return res.status(400).json({ error: 'Invalid email format' });
          }
          
          // Check minimum length
          if (rules.minLength && value.length < rules.minLength) {
            return res.status(400).json({
              error: `${field} must be at least ${rules.minLength} characters`
            });
          }
          
          // Check string type
          if (rules.type === 'string' && typeof value !== 'string') {
            return res.status(400).json({ error: `${field} must be a string` });
          }
          
          // Check number type
          if (rules.type === 'number' && typeof value !== 'number') {
            return res.status(400).json({ error: `${field} must be a number` });
          }
          
          // Check minimum value
          if (rules.min !== undefined && value < rules.min) {
            return res.status(400).json({
              error: `${field} must be at least ${rules.min}`
            });
          }
          
          // Check boolean type
          if (rules.type === 'boolean' && typeof value !== 'boolean') {
            return res.status(400).json({ error: `${field} must be a boolean` });
          }
        }
      }
      
      next();
    };
  }
};