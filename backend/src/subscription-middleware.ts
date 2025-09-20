import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth-service';
import { StripeService } from './stripe-service';
import pool from './database';

export class SubscriptionMiddleware {
  private stripeService: StripeService;

  constructor() {
    this.stripeService = new StripeService();
  }

  /**
   * Middleware to check if user can create forms based on their plan limits
   */
  checkFormCreationLimit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const limits = await this.stripeService.getUserLimits(req.user.id);
      
      // If unlimited forms (-1), allow creation
      if (limits.formLimit === -1) {
        return next();
      }

      // Check current form count
      const client = await pool.connect();
      try {
        const result = await client.query(
          'SELECT COUNT(*) as form_count FROM forms WHERE user_id = $1',
          [req.user.id]
        );

        const currentFormCount = parseInt(result.rows[0].form_count);

        if (currentFormCount >= limits.formLimit) {
          res.status(403).json({
            error: 'Form limit exceeded',
            message: `Your current plan allows up to ${limits.formLimit} forms. Upgrade to create more forms.`,
            upgradeRequired: true,
            currentCount: currentFormCount,
            limit: limits.formLimit
          });
          return;
        }

        next();
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Form limit check error:', error);
      res.status(500).json({ error: 'Failed to check form limits' });
    }
  };

  /**
   * Middleware to check if user can receive more submissions this month
   */
  checkSubmissionLimit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const limits = await this.stripeService.getUserLimits(req.user.id);
      const currentMonth = new Date().toISOString().substring(0, 7); // 'YYYY-MM'

      const client = await pool.connect();
      try {
        // Get or create usage record for current month
        await client.query(`
          INSERT INTO user_usage (user_id, month_year, submissions_received)
          VALUES ($1, $2, 0)
          ON CONFLICT (user_id, month_year) DO NOTHING
        `, [req.user.id, currentMonth]);

        // Check current submission count
        const result = await client.query(`
          SELECT submissions_received FROM user_usage 
          WHERE user_id = $1 AND month_year = $2
        `, [req.user.id, currentMonth]);

        const currentSubmissions = result.rows[0]?.submissions_received || 0;

        if (currentSubmissions >= limits.submissionLimit) {
          res.status(403).json({
            error: 'Submission limit exceeded',
            message: `Your current plan allows up to ${limits.submissionLimit} submissions per month. Upgrade to receive more submissions.`,
            upgradeRequired: true,
            currentCount: currentSubmissions,
            limit: limits.submissionLimit
          });
          return;
        }

        next();
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Submission limit check error:', error);
      res.status(500).json({ error: 'Failed to check submission limits' });
    }
  };

  /**
   * Middleware to check if user can access premium connectors
   */
  checkPremiumConnectorAccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const limits = await this.stripeService.getUserLimits(req.user.id);

      if (!limits.premiumConnectors) {
        res.status(403).json({
          error: 'Premium feature required',
          message: 'Premium connectors are only available on paid plans. Please upgrade your subscription.',
          upgradeRequired: true
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Premium connector check error:', error);
      res.status(500).json({ error: 'Failed to check premium access' });
    }
  };

  /**
   * Update usage counters after successful operations
   */
  trackFormCreation = async (userId: number): Promise<void> => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const client = await pool.connect();

    try {
      await client.query(`
        INSERT INTO user_usage (user_id, month_year, forms_created)
        VALUES ($1, $2, 1)
        ON CONFLICT (user_id, month_year) DO UPDATE SET
          forms_created = user_usage.forms_created + 1,
          updated_at = NOW()
      `, [userId, currentMonth]);
    } finally {
      client.release();
    }
  };

  trackSubmission = async (userId: number): Promise<void> => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const client = await pool.connect();

    try {
      await client.query(`
        INSERT INTO user_usage (user_id, month_year, submissions_received)
        VALUES ($1, $2, 1)
        ON CONFLICT (user_id, month_year) DO UPDATE SET
          submissions_received = user_usage.submissions_received + 1,
          updated_at = NOW()
      `, [userId, currentMonth]);
    } finally {
      client.release();
    }
  };

  /**
   * Get user's current usage for the month
   */
  getUserUsage = async (userId: number): Promise<{ formsCreated: number; submissionsReceived: number; limits: any }> => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const client = await pool.connect();

    try {
      const result = await client.query(`
        SELECT forms_created, submissions_received FROM user_usage 
        WHERE user_id = $1 AND month_year = $2
      `, [userId, currentMonth]);

      const usage = result.rows[0] || { forms_created: 0, submissions_received: 0 };
      const limits = await this.stripeService.getUserLimits(userId);

      return {
        formsCreated: usage.forms_created || 0,
        submissionsReceived: usage.submissions_received || 0,
        limits
      };
    } finally {
      client.release();
    }
  };
}