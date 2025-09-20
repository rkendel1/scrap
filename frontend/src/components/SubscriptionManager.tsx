import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  formLimit: number;
  submissionLimit: number;
  premiumConnectors: boolean;
}

interface UserSubscription {
  id: number;
  plan_id: string;
  status: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
}

interface SubscriptionData {
  subscription: UserSubscription | null;
  usage: {
    formLimit: number;
    submissionLimit: number;
    premiumConnectors: boolean;
  };
  currentUsage: {
    formsCreated: number;
    submissionsReceived: number;
  };
}

export const SubscriptionManager: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load subscription plans
      const plansResponse = await apiService.getSubscriptionPlans();
      if (plansResponse.success && plansResponse.data) {
        setPlans(plansResponse.data);
      }

      // Load current subscription
      const subscriptionResponse = await apiService.getCurrentSubscription();
      if (subscriptionResponse.success && subscriptionResponse.data) {
        setSubscriptionData(subscriptionResponse.data);
      }
    } catch (err) {
      console.error('Failed to load subscription data:', err);
      setError('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    try {
      setUpgrading(planId);
      setError(null);

      const response = await apiService.createCheckoutSession(planId);
      
      if (response.success && response.data?.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = response.data.checkoutUrl;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (err) {
      console.error('Upgrade error:', err);
      setError('Failed to initiate upgrade. Please try again.');
      setUpgrading(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      setError(null);
      const response = await apiService.createBillingPortalSession();
      
      if (response.success && response.data?.portalUrl) {
        window.location.href = response.data.portalUrl;
      } else {
        throw new Error('Failed to create billing portal session');
      }
    } catch (err) {
      console.error('Billing portal error:', err);
      setError('Failed to open billing portal. Please try again.');
    }
  };

  const formatPrice = (price: number, interval: string) => {
    return `$${price}/${interval}`;
  };

  const getCurrentPlan = (): SubscriptionPlan | null => {
    if (!subscriptionData?.subscription) {
      return plans.find(p => p.id === 'free') || null;
    }
    return plans.find(p => p.id === subscriptionData.subscription?.plan_id) || null;
  };

  const isCurrentPlan = (planId: string): boolean => {
    const currentPlan = getCurrentPlan();
    return currentPlan?.id === planId;
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading subscription data...</div>
      </div>
    );
  }

  const currentPlan = getCurrentPlan();

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2>Subscription Management</h2>
      
      {error && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#fee', 
          border: '1px solid #fcc', 
          borderRadius: '4px',
          marginBottom: '20px',
          color: '#c33'
        }}>
          {error}
        </div>
      )}

      {/* Current Subscription Status */}
      {subscriptionData && (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <h3>Current Plan: {currentPlan?.name || 'Unknown'}</h3>
          
          {subscriptionData.subscription && (
            <div style={{ marginTop: '12px' }}>
              <p><strong>Status:</strong> {subscriptionData.subscription.status}</p>
              {subscriptionData.subscription.current_period_end && (
                <p>
                  <strong>Next billing:</strong> {new Date(subscriptionData.subscription.current_period_end).toLocaleDateString()}
                </p>
              )}
              {subscriptionData.subscription.cancel_at_period_end && (
                <p style={{ color: '#f56565' }}>
                  <strong>Subscription will cancel at the end of the current period</strong>
                </p>
              )}
            </div>
          )}

          {/* Usage Information */}
          <div style={{ marginTop: '16px' }}>
            <h4>Current Usage</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '8px' }}>
              <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '6px' }}>
                <div><strong>Forms Created</strong></div>
                <div>
                  {subscriptionData.currentUsage.formsCreated} / {subscriptionData.usage.formLimit === -1 ? '∞' : subscriptionData.usage.formLimit}
                </div>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '6px' }}>
                <div><strong>Submissions This Month</strong></div>
                <div>
                  {subscriptionData.currentUsage.submissionsReceived} / {subscriptionData.usage.submissionLimit}
                </div>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '6px' }}>
                <div><strong>Premium Connectors</strong></div>
                <div>{subscriptionData.usage.premiumConnectors ? '✅ Available' : '❌ Not Available'}</div>
              </div>
            </div>
          </div>

          {subscriptionData.subscription && (
            <div style={{ marginTop: '16px' }}>
              <button
                onClick={handleManageBilling}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Manage Billing
              </button>
            </div>
          )}
        </div>
      )}

      {/* Available Plans */}
      <div>
        <h3>Available Plans</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '20px',
          marginTop: '16px'
        }}>
          {plans.map((plan) => (
            <div 
              key={plan.id}
              style={{
                border: isCurrentPlan(plan.id) ? '2px solid #007bff' : '1px solid #ddd',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: isCurrentPlan(plan.id) ? '#f8f9ff' : 'white',
                position: 'relative'
              }}
            >
              {isCurrentPlan(plan.id) && (
                <div style={{
                  position: 'absolute',
                  top: '-1px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#007bff',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '0 0 4px 4px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  CURRENT PLAN
                </div>
              )}

              <h4 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>{plan.name}</h4>
              
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>
                {plan.price === 0 ? 'Free' : formatPrice(plan.price, plan.interval)}
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0' }}>
                {plan.features.map((feature, index) => (
                  <li key={index} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px' }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              {!isCurrentPlan(plan.id) && plan.id !== 'free' && (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={upgrading === plan.id}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: upgrading === plan.id ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: upgrading === plan.id ? 'default' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  {upgrading === plan.id ? 'Processing...' : 'Upgrade'}
                </button>
              )}

              {plan.id === 'free' && !isCurrentPlan(plan.id) && subscriptionData?.subscription && (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#6c757d',
                  fontSize: '14px',
                  fontStyle: 'italic'
                }}>
                  Downgrade through billing portal
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};