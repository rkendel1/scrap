import jwt from 'jsonwebtoken'; // Still needed for other JWTs, but not for embed.js
import pool from './database';

export interface EmbedTokenPayload {
  formId: number;
  userId: number;
  subscriptionTier: 'free' | 'paid';
  allowedDomains: string[];
  exp?: number; // expiry timestamp
}

export class EmbedSecurityService {
  private readonly JWT_SECRET = process.env.EMBED_JWT_SECRET || process.env.JWT_SECRET || 'embed-secret-change-in-production';
  // Removed TOKEN_EXPIRES_IN as it's no longer relevant for the public embed script

  // Removed generateEmbedToken method
  // Removed verifyEmbedToken method

  /**
   * Check if a domain is allowed to embed the form
   */
  isDomainAllowed(hostname: string, allowedDomains: string[]): boolean {
    // Always allow localhost and 127.0.0.1 for development/testing
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true;
    }

    if (!allowedDomains || allowedDomains.length === 0) {
      return true; // No restrictions if no domains specified
    }

    // Normalize hostname
    const normalizedHostname = hostname.toLowerCase().replace(/^www\./, '');
    
    return allowedDomains.some(domain => {
      const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
      
      // Exact match
      if (normalizedHostname === normalizedDomain) {
        return true;
      }
      
      // Wildcard subdomain support (*.example.com)
      if (domain.startsWith('*.')) {
        const baseDomain = normalizedDomain.substring(2);
        return normalizedHostname.endsWith('.' + baseDomain) || normalizedHostname === baseDomain;
      }
      
      return false;
    });
  }

  /**
   * Check rate limits for form submissions
   */
  async checkRateLimit(formId: number, ipAddress: string, domain: string): Promise<{ allowed: boolean; remaining: number }> {
    const client = await pool.connect();
    
    try {
      // Get rate limit settings based on form's user subscription
      const formQuery = `
        SELECT f.user_id, u.subscription_tier
        FROM forms f
        JOIN users u ON f.user_id = u.id
        WHERE f.id = $1
      `;
      const formResult = await client.query(formQuery, [formId]);
      
      if (formResult.rows.length === 0) {
        return { allowed: false, remaining: 0 };
      }

      const { subscription_tier } = formResult.rows[0];
      
      // Rate limits: Free tier = 10 per hour, Paid tier = 100 per hour
      const maxSubmissions = subscription_tier === 'paid' ? 100 : 10;
      const windowMinutes = 60;
      
      // Clean old entries
      await client.query(`
        DELETE FROM form_submission_rate_limits
        WHERE window_start < NOW() - INTERVAL '${windowMinutes} minutes'
      `);
      
      // Check current rate
      const checkQuery = `
        SELECT submission_count
        FROM form_submission_rate_limits
        WHERE form_id = $1 AND ip_address = $2 AND domain = $3
        AND window_start > NOW() - INTERVAL '${windowMinutes} minutes'
      `;
      
      const rateResult = await client.query(checkQuery, [formId, ipAddress, domain]);
      
      if (rateResult.rows.length === 0) {
        // First submission in this window
        await client.query(`
          INSERT INTO form_submission_rate_limits (form_id, ip_address, domain, submission_count)
          VALUES ($1, $2, $3, 1)
          ON CONFLICT (form_id, ip_address, domain) DO UPDATE SET
            submission_count = 1,
            window_start = CURRENT_TIMESTAMP
        `, [formId, ipAddress, domain]);
        
        return { allowed: true, remaining: maxSubmissions - 1 };
      }
      
      const currentCount = rateResult.rows[0].submission_count;
      
      if (currentCount >= maxSubmissions) {
        return { allowed: false, remaining: 0 };
      }
      
      // Increment counter
      await client.query(`
        UPDATE form_submission_rate_limits
        SET submission_count = submission_count + 1
        WHERE form_id = $1 AND ip_address = $2 AND domain = $3
      `, [formId, ipAddress, domain]);
      
      return { allowed: true, remaining: maxSubmissions - currentCount - 1 };
      
    } catch (error) {
      console.error('Rate limit check error:', error);
      return { allowed: false, remaining: 0 };
    } finally {
      client.release();
    }
  }

  /**
   * Get user's subscription status
   */
  async getUserSubscriptionStatus(userId: number): Promise<{ tier: 'free' | 'paid'; active: boolean }> {
    try {
      const query = `
        SELECT subscription_tier, subscription_status
        FROM users
        WHERE id = $1
      `;
      
      const result = await pool.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return { tier: 'free', active: false };
      }
      
      const { subscription_tier, subscription_status } = result.rows[0];
      
      return {
        tier: subscription_tier,
        active: subscription_status === 'active'
      };
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return { tier: 'free', active: false };
    }
  }
}