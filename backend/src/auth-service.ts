import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import pool from './database';

export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  subscription_tier: 'free' | 'paid';
  subscription_status: 'active' | 'inactive' | 'cancelled';
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export interface AuthRequest extends Request {
  user?: User | null; // Allow user to be null for optional auth
}

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  generateToken(userId: number): string {
    return jwt.sign({ userId }, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN } as jwt.SignOptions);
  }

  verifyToken(token: string): { userId: number } | null {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: number };
      return decoded;
    } catch (error) {
      return null;
    }
  }

  async createUser(email: string, password: string, firstName?: string, lastName?: string): Promise<User> {
    const hashedPassword = await this.hashPassword(password);
    
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, first_name, last_name, subscription_tier, subscription_status, created_at, updated_at, last_login
    `;
    
    const result = await pool.query(query, [email, hashedPassword, firstName, lastName]);
    return result.rows[0];
  }

  async getUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
    const query = `
      SELECT id, email, password_hash, first_name, last_name, subscription_tier, subscription_status, 
             created_at, updated_at, last_login
      FROM users 
      WHERE email = $1
    `;
    
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  async getUserById(id: number): Promise<User | null> {
    const query = `
      SELECT id, email, first_name, last_name, subscription_tier, subscription_status, 
             created_at, updated_at, last_login
      FROM users 
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async updateLastLogin(userId: number): Promise<void> {
    const query = `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1`;
    await pool.query(query, [userId]);
  }

  async authenticateUser(email: string, password: string): Promise<{ user: User; token: string } | null> {
    const userWithPassword = await this.getUserByEmail(email);
    
    if (!userWithPassword) {
      return null;
    }

    const isValidPassword = await this.comparePassword(password, userWithPassword.password_hash);
    
    if (!isValidPassword) {
      return null;
    }

    await this.updateLastLogin(userWithPassword.id);
    
    const token = this.generateToken(userWithPassword.id);
    
    // Remove password hash from user object
    const { password_hash, ...user } = userWithPassword;
    
    return { user, token };
  }

  async createGuestToken(): Promise<string> {
    const token = this.generateRandomToken();
    
    const query = `INSERT INTO guest_tokens (token) VALUES ($1) RETURNING token`;
    const result = await pool.query(query, [token]);
    
    return result.rows[0].token;
  }

  async associateGuestWithUser(guestToken: string, userId: number): Promise<void> {
    const query = `
      UPDATE guest_tokens 
      SET user_id = $1, associated_at = CURRENT_TIMESTAMP 
      WHERE token = $2
    `;
    await pool.query(query, [userId, guestToken]);

    // Transfer guest forms to user
    const transferQuery = `
      UPDATE forms 
      SET user_id = $1, guest_token_id = NULL 
      WHERE guest_token_id = (SELECT id FROM guest_tokens WHERE token = $2)
    `;
    await pool.query(transferQuery, [userId, guestToken]);
  }

  async getUserFormCount(userId: number): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM forms WHERE user_id = $1 AND is_live = true`;
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  async canUserCreateForm(userId: number): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) return false;

    if (user.subscription_tier === 'paid') {
      return true; // Unlimited forms for paid users
    }

    // Free users limited to 1 live form
    const formCount = await getUserFormCount(userId);
    return formCount < 1;
  }

  private generateRandomToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Middleware for protecting routes
  authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = this.verifyToken(token);
    if (!decoded) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    const user = await this.getUserById(decoded.userId);
    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  };

  // Optional authentication - allows both authenticated and guest users
  optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    req.user = null; // Initialize req.user to null for optional auth

    if (token) {
      try {
        const decoded = this.verifyToken(token);
        if (decoded) {
          const user = await this.getUserById(decoded.userId);
          if (user) {
            req.user = user;
          }
        }
      } catch (error) {
        console.warn('Optional auth: Invalid or expired token, proceeding as guest.');
        // req.user remains null
      }
    }
    next();
  };
}

// Helper function for form count check
async function getUserFormCount(userId: number): Promise<number> {
  const query = `SELECT COUNT(*) as count FROM forms WHERE user_id = $1 AND is_live = true`;
  const result = await pool.query(query, [userId]);
  return parseInt(result.rows[0].count);
}