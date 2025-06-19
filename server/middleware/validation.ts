import { Request, Response, NextFunction } from "express";
import { z } from "zod";

export function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Check session first
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Check Authorization header for API testing tools
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const parts = decoded.split(':');
      
      if (parts.length === 3) {
        const [userId, email, timestamp] = parts;
        
        if (userId && !isNaN(parseInt(userId))) {
          const { storage } = require('../storage');
          storage.getUser(parseInt(userId)).then((user: any) => {
            if (user && user.email === email) {
              req.user = user;
              return next();
            }
            return res.status(401).json({ message: "Invalid token" });
          }).catch(() => {
            return res.status(401).json({ message: "Invalid token" });
          });
          return; // Prevent further execution
        }
      }
    } catch (error) {
      // Token decode failed
    }
  }
  
  return res.status(401).json({ message: "Authentication required" });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user?.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}
