import Stripe from 'stripe';
import pool from './database';
import { profileService } from './profile-service';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  formLimit: number;
  submissionLimit: number;
  premiumConnectors: boolean;
}

export interface UserSubscription {
  id: number;
  user_id: number;
  stripe_customer_id: string;
  stripe_subscription_id?: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing';
  current_period_start?: Date;
  current_period_end?: Date;
  cancel_at_period_end: boolean;
  created_at: Date;
  updated_at: Date;
}

export class StripeService {
  private stripe: Stripe;
  
  // Subscription plans configuration
  private readonly PLANS: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      interval: 'month',
      features: ['Up to 3 forms', '100 submissions/month', 'Basic connectors'],
      formLimit: 3,
      submissionLimit: 100,
      premiumConnectors: false
    },
    {
      id: 'pro_monthly',
      name: 'Pro',
      price: 29,
      interval: 'month',
      features: ['Unlimited forms', '10,000 submissions/month', 'Premium connectors', 'Advanced analytics'],
      formLimit: -1, // unlimited
      submissionLimit: 10000,
      premiumConnectors: true
    },
    {
      id: 'pro_yearly',
      name: 'Pro (Yearly)',
      price: 290,
      interval: 'year',
      features: ['Unlimited forms', '10,000 submissions/month', 'Premium connectors', 'Advanced analytics', '2 months free'],
      formLimit: -1, // unlimited
      submissionLimit: 10000,
      premiumConnectors: true
    }
  ];

  constructor() {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20', // Updated to a valid Stripe API version
    });
  }

  /**
   * Get available subscription plans
   */
  getPlans(): SubscriptionPlan[] {
    return this.PLANS;
  }

  /**
   * Get a specific plan by ID
   */
  getPlan(planId: string): SubscriptionPlan | null {
    return this.PLANS.find(plan => plan.id === planId) || null;
  }

  /**
   * Create or retrieve Stripe customer for user
   */
  async createOrGetCustomer(userId: number, email: string, name?: string): Promise<string> {
    const client = await pool.connect();
    
    try {
      // Check if customer already exists in our database
      const existingResult = await client.query(
        'SELECT stripe_customer_id FROM user_subscriptions WHERE user_id = $1',
        [userId]
      );

      if (existingResult.rows.length > 0) {
        return existingResult.rows[0].stripe_customer_id;
      }

      // Create new Stripe customer
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          userId: userId.toString()
        }
      });

      return customer.id;
    } finally {
      client.release();
    }
  }

  /**
   * Create checkout session for subscription
   */
  async createCheckoutSession(
    userId: number,
    planId: string,
    customerId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<string> {
    const plan = this.getPlan(planId);
    if (!plan || plan.id === 'free') {
      throw new Error('Invalid plan selected');
    }

    // Get or create Stripe price for the plan
    const priceId = await this.getOrCreatePrice(plan);

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId.toString(),
        planId: planId
      }
    });

    return session.url!;
  }

  /**
   * Create billing portal session
   */
  async createBillingPortalSession(customerId: string, returnUrl: string): Promise<string> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  }

  /**
   * Get or create Stripe price for a plan
   */
  private async getOrCreatePrice(plan: SubscriptionPlan): Promise<string> {
    // In production, you'd typically create these prices once and store the IDs
    // For this implementation, we'll create them dynamically
    const price = await this.stripe.prices.create({
      unit_amount: plan.price * 100, // Convert to cents
      currency: 'usd',
      recurring: {
        interval: plan.interval,
      },
      product_data: {
        name: plan.name,
        metadata: {
          features: plan.features.join(', ')
        }
      },
      metadata: {
        planId: plan.id
      }
    });

    return price.id;
  }

  /**
   * Handle subscription created webhook
   */
  async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    const client = await pool.connect();
    
    try {
      const userId = parseInt(subscription.metadata.userId || '0');
      const planId = subscription.metadata.planId;
      
      if (!userId || !planId) {
        throw new Error('Missing userId or planId in subscription metadata');
      }

      await client.query('BEGIN');

      // Insert or update subscription record
      await client.query(`
        INSERT INTO user_subscriptions (
          user_id, stripe_customer_id, stripe_subscription_id, plan_id, status,
          current_period_start, current_period_end, cancel_at_period_end,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          stripe_subscription_id = $3,
          plan_id = $4,
          status = $5,
          current_period_start = $6,
          current_period_end = $7,
          cancel_at_period_end = $8,
          updated_at = NOW()
      `, [
        userId,
        subscription.customer as string,
        subscription.id,
        planId,
        subscription.status,
        new Date(((subscription as any).current_period_start as number) * 1000),
        new Date(((subscription as any).current_period_end as number) * 1000),
        subscription.cancel_at_period_end
      ]);

      // Update user subscription tier
      await client.query(`
        UPDATE users 
        SET subscription_tier = 'paid', subscription_status = 'active', updated_at = NOW()
        WHERE id = $1
      `, [userId]);

      await client.query('COMMIT');

      // Send notification about successful subscription
      const plan = this.getPlan(planId);
      if (plan) {
        await profileService.createNotificationEvent(
          userId,
          'subscription_created',
          'Subscription Activated',
          `Your ${plan.name} subscription has been successfully activated! Welcome to premium features.`,
          true
        );
      }
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Handle subscription updated webhook
   */
  async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get user ID for notifications
      const userResult = await client.query(`
        SELECT user_id FROM user_subscriptions 
        WHERE stripe_subscription_id = $1
      `, [subscription.id]);

      const userId = userResult.rows[0]?.user_id;

      await client.query(`
        UPDATE user_subscriptions 
        SET 
          status = $1,
          current_period_start = $2,
          current_period_end = $3,
          cancel_at_period_end = $4,
          updated_at = NOW()
        WHERE stripe_subscription_id = $5
      `, [
        subscription.status,
        new Date(((subscription as any).current_period_start as number) * 1000),
        new Date(((subscription as any).current_period_end as number) * 1000),
        subscription.cancel_at_period_end,
        subscription.id
      ]);

      // Update user status based on subscription status
      const subscriptionTier = subscription.status === 'active' ? 'paid' : 'free';
      const subscriptionStatus = subscription.status === 'active' ? 'active' : 
                               subscription.status === 'canceled' ? 'cancelled' : 'inactive';

      await client.query(`
        UPDATE users 
        SET 
          subscription_tier = $1, 
          subscription_status = $2, 
          updated_at = NOW()
        WHERE id = (
          SELECT user_id FROM user_subscriptions 
          WHERE stripe_subscription_id = $3
        )
      `, [subscriptionTier, subscriptionStatus, subscription.id]);

      await client.query('COMMIT');

      // Send notifications based on subscription status changes
      if (userId) {
        if (subscription.status === 'past_due') {
          await profileService.createNotificationEvent(
            userId,
            'payment_failed',
            'Payment Failed',
            'Your last payment failed. Please update your payment method to avoid service interruption.',
            true
          );
        } else if (subscription.cancel_at_period_end) {
          const periodEnd = new Date(((subscription as any).current_period_end as number) * 1000);
          await profileService.createNotificationEvent(
            userId,
            'subscription_will_cancel',
            'Subscription Will Cancel',
            `Your subscription is set to cancel at the end of your billing period (${periodEnd.toLocaleDateString()}). You can reactivate it anytime before then.`,
            true
          );
        } else if (subscription.status === 'active') {
          // Check if this is a renewal
          const currentPeriodStart = new Date(((subscription as any).current_period_start as number) * 1000);
          const now = new Date();
          const timeDiff = now.getTime() - currentPeriodStart.getTime();
          
          // If the period started recently (within 24 hours), it's likely a renewal
          if (timeDiff < 24 * 60 * 60 * 1000) {
            await profileService.createNotificationEvent(
              userId,
              'subscription_renewed',
              'Subscription Renewed',
              'Your subscription has been successfully renewed. Thank you for continuing with us!',
              true
            );
          }
        }
      }
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Handle subscription deleted webhook
   */
  async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get user ID for notifications
      const userResult = await client.query(`
        SELECT user_id FROM user_subscriptions 
        WHERE stripe_subscription_id = $1
      `, [subscription.id]);

      const userId = userResult.rows[0]?.user_id;

      // Update subscription status
      await client.query(`
        UPDATE user_subscriptions 
        SET status = 'canceled', updated_at = NOW()
        WHERE stripe_subscription_id = $1
      `, [subscription.id]);

      // Downgrade user to free tier
      await client.query(`
        UPDATE users 
        SET subscription_tier = 'free', subscription_status = 'cancelled', updated_at = NOW()
        WHERE id = (
          SELECT user_id FROM user_subscriptions 
          WHERE stripe_subscription_id = $1
        )
      `, [subscription.id]);

      await client.query('COMMIT');

      // Send cancellation notification
      if (userId) {
        await profileService.createNotificationEvent(
          userId,
          'subscription_cancelled',
          'Subscription Cancelled',
          'Your subscription has been cancelled. You can resubscribe anytime to regain access to premium features.',
          true
        );
      }
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: number): Promise<UserSubscription | null> {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT * FROM user_subscriptions WHERE user_id = $1
      `, [userId]);

      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      client.release();
    }
  }

  /**
   * Check if user can access premium features
   */
  async canAccessPremiumFeatures(userId: number): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    return subscription?.status === 'active' && subscription.plan_id !== 'free';
  }

  /**
   * Get user's usage limits based on their plan
   */
  async getUserLimits(userId: number): Promise<{ formLimit: number; submissionLimit: number; premiumConnectors: boolean }> {
    const subscription = await this.getUserSubscription(userId);
    let planId = 'free';
    
    if (subscription?.status === 'active' && subscription.plan_id) {
      planId = subscription.plan_id;
    }

    const plan = this.getPlan(planId);
    if (!plan) {
      // Fallback to free plan
      const freePlan = this.getPlan('free')!;
      return {
        formLimit: freePlan.formLimit,
        submissionLimit: freePlan.submissionLimit,
        premiumConnectors: freePlan.premiumConnectors
      };
    }

    return {
      formLimit: plan.formLimit,
      submissionLimit: plan.submissionLimit,
      premiumConnectors: plan.premiumConnectors
    };
  }
}