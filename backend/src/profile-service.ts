import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import pool from './database';
import { User } from './auth-service';

export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  email?: string;
  profile_picture_url?: string;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  marketing_emails: boolean;
  billing_alerts: boolean;
  subscription_updates: boolean;
}

export interface PasswordUpdateData {
  current_password: string;
  new_password: string;
}

export interface NotificationEvent {
  id: number;
  user_id: number;
  event_type: string;
  title: string;
  message: string;
  read: boolean;
  sent_via_email: boolean;
  created_at: Date;
  read_at?: Date;
}

export class ProfileService {
  private emailTransporter: nodemailer.Transporter;

  constructor() {
    // Initialize email transporter for password reset emails
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Update user profile information
   */
  async updateProfile(userId: number, updateData: ProfileUpdateData): Promise<User | null> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if email is being updated and if it's unique
      if (updateData.email) {
        const emailCheck = await client.query(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [updateData.email, userId]
        );
        
        if (emailCheck.rows.length > 0) {
          throw new Error('Email address is already in use');
        }
      }

      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // Build dynamic update query
      for (const [key, value] of Object.entries(updateData)) {
        if (value !== undefined) {
          setClauses.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      if (setClauses.length === 0) {
        throw new Error('No fields to update');
      }

      setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(userId);

      const query = `
        UPDATE users 
        SET ${setClauses.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, email, first_name, last_name, subscription_tier, subscription_status, 
                  profile_picture_url, notification_preferences, account_status,
                  created_at, updated_at, last_login
      `;

      const result = await client.query(query, values);
      
      await client.query('COMMIT');
      
      return result.rows[0] || null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update user password
   */
  async updatePassword(userId: number, passwordData: PasswordUpdateData): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      // Get current password hash
      const userQuery = 'SELECT password_hash FROM users WHERE id = $1';
      const userResult = await client.query(userQuery, [userId]);
      
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const currentPasswordHash = userResult.rows[0].password_hash;
      
      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(passwordData.current_password, currentPasswordHash);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(passwordData.new_password, saltRounds);

      // Update password
      const updateQuery = `
        UPDATE users 
        SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;
      
      await client.query(updateQuery, [newPasswordHash, userId]);
      
      return true;
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(userId: number, preferences: NotificationPreferences): Promise<boolean> {
    const query = `
      UPDATE users 
      SET notification_preferences = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
    
    await pool.query(query, [JSON.stringify(preferences), userId]);
    return true;
  }

  /**
   * Get user notification preferences
   */
  async getNotificationPreferences(userId: number): Promise<NotificationPreferences | null> {
    const query = 'SELECT notification_preferences FROM users WHERE id = $1';
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].notification_preferences || {
      email_notifications: true,
      marketing_emails: false,
      billing_alerts: true,
      subscription_updates: true,
    };
  }

  /**
   * Deactivate user account
   */
  async deactivateAccount(userId: number, reason?: string): Promise<boolean> {
    const query = `
      UPDATE users 
      SET account_status = 'deactivated', 
          deactivated_at = CURRENT_TIMESTAMP,
          deactivation_reason = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    
    await pool.query(query, [userId, reason]);
    return true;
  }

  /**
   * Reactivate user account
   */
  async reactivateAccount(userId: number): Promise<boolean> {
    const query = `
      UPDATE users 
      SET account_status = 'active',
          deactivated_at = NULL,
          deactivation_reason = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    
    await pool.query(query, [userId]);
    return true;
  }

  /**
   * Generate password reset token
   */
  async generatePasswordResetToken(email: string): Promise<string | null> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if user exists
      const userQuery = 'SELECT id FROM users WHERE email = $1 AND account_status = \'active\'';
      const userResult = await client.query(userQuery, [email]);
      
      if (userResult.rows.length === 0) {
        // Don't reveal if email exists or not for security
        return null;
      }

      const userId = userResult.rows[0].id;
      
      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Invalidate any existing tokens for this user
      await client.query(
        'UPDATE password_reset_tokens SET used = true WHERE user_id = $1 AND used = false',
        [userId]
      );

      // Insert new token
      const tokenQuery = `
        INSERT INTO password_reset_tokens (user_id, token, expires_at)
        VALUES ($1, $2, $3)
      `;
      
      await client.query(tokenQuery, [userId, token, expiresAt]);
      
      await client.query('COMMIT');
      
      return token;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Reset password using token
   */
  async resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Validate token
      const tokenQuery = `
        SELECT user_id FROM password_reset_tokens 
        WHERE token = $1 AND used = false AND expires_at > CURRENT_TIMESTAMP
      `;
      
      const tokenResult = await client.query(tokenQuery, [token]);
      
      if (tokenResult.rows.length === 0) {
        throw new Error('Invalid or expired reset token');
      }

      const userId = tokenResult.rows[0].user_id;
      
      // Hash new password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await client.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [passwordHash, userId]
      );

      // Mark token as used
      await client.query(
        'UPDATE password_reset_tokens SET used = true, used_at = CURRENT_TIMESTAMP WHERE token = $1',
        [token]
      );

      await client.query('COMMIT');
      
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@formcraft.ai',
      to: email,
      subject: 'Password Reset Request - FormCraft AI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You have requested to reset your password for your FormCraft AI account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you did not request this password reset, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">FormCraft AI - Intelligent Form Builder</p>
        </div>
      `,
    };

    try {
      await this.emailTransporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }

  /**
   * Create notification event
   */
  async createNotificationEvent(
    userId: number, 
    eventType: string, 
    title: string, 
    message: string, 
    sendEmail: boolean = false
  ): Promise<NotificationEvent> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO notification_events (user_id, event_type, title, message, sent_via_email)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const result = await client.query(query, [userId, eventType, title, message, sendEmail]);
      
      const notificationEvent = result.rows[0];

      // Send email if requested and user has email notifications enabled
      if (sendEmail) {
        const prefsResult = await client.query(
          'SELECT notification_preferences, email FROM users WHERE id = $1',
          [userId]
        );
        
        if (prefsResult.rows.length > 0) {
          const { notification_preferences, email } = prefsResult.rows[0];
          const prefs = notification_preferences || {};
          
          if (prefs.email_notifications !== false) {
            await this.sendNotificationEmail(email, title, message);
          }
        }
      }

      await client.query('COMMIT');
      
      return notificationEvent;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: number, limit: number = 20, offset: number = 0): Promise<NotificationEvent[]> {
    const query = `
      SELECT * FROM notification_events 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(userId: number, notificationId: number): Promise<boolean> {
    const query = `
      UPDATE notification_events 
      SET read = true, read_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
    `;
    
    const result = await pool.query(query, [notificationId, userId]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * Send notification email
   */
  private async sendNotificationEmail(email: string, title: string, message: string): Promise<void> {
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@formcraft.ai',
      to: email,
      subject: `FormCraft AI - ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${title}</h2>
          <p>${message}</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">FormCraft AI - Intelligent Form Builder</p>
        </div>
      `,
    };

    try {
      await this.emailTransporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send notification email:', error);
    }
  }

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  isValidPassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export const profileService = new ProfileService();