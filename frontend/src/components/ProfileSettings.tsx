import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, Eye, EyeOff, Bell, Shield, Trash2, Save, Mail, Lock } from 'lucide-react';
import { apiService } from '../services/api';

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  profile_picture_url?: string;
}

interface PasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

interface NotificationPreferences {
  email_notifications: boolean;
  marketing_emails: boolean;
  billing_alerts: boolean;
  subscription_updates: boolean;
}

interface NotificationEvent {
  id: number;
  event_type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface ProfileSettingsProps {
  user: any;
  onUserUpdate: (user: any) => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onUserUpdate }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'notifications' | 'billing' | 'account'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    email_notifications: true,
    marketing_emails: false,
    billing_alerts: true,
    subscription_updates: true,
  });
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileData>({
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      profile_picture_url: user?.profile_picture_url || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch: watchPassword,
  } = useForm<PasswordData>();

  const newPassword = watchPassword('new_password');

  useEffect(() => {
    if (activeTab === 'notifications') {
      loadNotificationPreferences();
      loadNotifications();
    } else if (activeTab === 'billing') {
      loadBillingHistory();
    }
  }, [activeTab]);

  useEffect(() => {
    resetProfile({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      profile_picture_url: user?.profile_picture_url || '',
    });
  }, [user, resetProfile]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const onUpdateProfile = async (data: ProfileData) => {
    setIsLoading(true);
    try {
      const response = await apiService.updateProfile(data);
      if (response.success) {
        onUserUpdate(response.user);
        showMessage('success', 'Profile updated successfully!');
      } else {
        showMessage('error', response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const onUpdatePassword = async (data: PasswordData) => {
    setIsLoading(true);
    try {
      const response = await apiService.updatePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      });
      if (response.success) {
        resetPassword();
        showMessage('success', 'Password updated successfully!');
      } else {
        showMessage('error', response.message || 'Failed to update password');
      }
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotificationPreferences = async () => {
    try {
      const response = await apiService.getNotificationPreferences();
      if (response.success) {
        setNotificationPrefs(response.preferences);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await apiService.getNotifications();
      if (response.success) {
        setNotifications(response.notifications);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const loadBillingHistory = async () => {
    try {
      const response = await apiService.getBillingHistory();
      if (response.success) {
        setBillingHistory(response.data);
      }
    } catch (error) {
      console.error('Failed to load billing history:', error);
    }
  };

  const updateNotificationPreferences = async (key: keyof NotificationPreferences, value: boolean) => {
    const updatedPrefs = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(updatedPrefs);
    
    try {
      const response = await apiService.updateNotificationPreferences(updatedPrefs);
      if (response.success) {
        showMessage('success', 'Notification preferences updated!');
      } else {
        showMessage('error', 'Failed to update preferences');
        // Revert on failure
        setNotificationPrefs(notificationPrefs);
      }
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to update preferences');
      // Revert on failure
      setNotificationPrefs(notificationPrefs);
    }
  };

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      const response = await apiService.markNotificationAsRead(notificationId);
      if (response.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const deactivateAccount = async () => {
    if (!confirm('Are you sure you want to deactivate your account? This action can be reversed by contacting support.')) {
      return;
    }

    const reason = prompt('Please provide a reason for deactivation (optional):');
    
    setIsLoading(true);
    try {
      const response = await apiService.deactivateAccount(reason || undefined);
      if (response.success) {
        showMessage('success', 'Account deactivated successfully');
        // Could trigger logout here
      } else {
        showMessage('error', 'Failed to deactivate account');
      }
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to deactivate account');
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string): string => {
    if (!password) return '';
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password)) score++;

    if (score <= 2) return 'weak';
    if (score <= 3) return 'medium';
    if (score <= 4) return 'good';
    return 'strong';
  };

  const passwordStrength = getPasswordStrength(newPassword || '');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing', icon: Mail },
    { id: 'account', label: 'Account', icon: Shield },
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>Account Settings</h1>
        <p style={{ color: '#666' }}>Manage your profile, security, and preferences</p>
      </div>

      {message && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '20px',
            backgroundColor: message.type === 'success' ? '#f0f9ff' : '#fef2f2',
            color: message.type === 'success' ? '#1e40af' : '#dc2626',
            border: `1px solid ${message.type === 'success' ? '#e0f2fe' : '#fecaca'}`,
          }}
        >
          {message.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Sidebar */}
        <div style={{ width: '200px', flexShrink: 0 }}>
          <nav style={{ 
            backgroundColor: '#f8fafc', 
            borderRadius: '8px', 
            padding: '8px',
            border: '1px solid #e2e8f0'
          }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    textAlign: 'left',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: activeTab === tab.id ? '#007bff' : 'transparent',
                    color: activeTab === tab.id ? 'white' : '#374151',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                    fontSize: '14px',
                    fontWeight: activeTab === tab.id ? '500' : 'normal',
                  }}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1 }}>
          {activeTab === 'profile' && (
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Profile Information</h2>
              
              <form onSubmit={handleSubmitProfile(onUpdateProfile)}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      First Name
                    </label>
                    <input
                      type="text"
                      {...registerProfile('first_name')}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      {...registerProfile('last_name')}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    {...registerProfile('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${profileErrors.email ? '#dc2626' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  />
                  {profileErrors.email && (
                    <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {profileErrors.email.message}
                    </span>
                  )}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                    Profile Picture URL (optional)
                  </label>
                  <input
                    type="url"
                    {...registerProfile('profile_picture_url')}
                    placeholder="https://example.com/your-photo.jpg"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Save size={16} />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Change Password</h2>
              
              <form onSubmit={handleSubmitPassword(onUpdatePassword)}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                    Current Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      {...registerPassword('current_password', {
                        required: 'Current password is required',
                      })}
                      style={{
                        width: '100%',
                        padding: '10px 40px 10px 12px',
                        border: `1px solid ${passwordErrors.current_password ? '#dc2626' : '#d1d5db'}`,
                        borderRadius: '6px',
                        fontSize: '14px',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: '#6b7280',
                      }}
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordErrors.current_password && (
                    <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {passwordErrors.current_password.message}
                    </span>
                  )}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      {...registerPassword('new_password', {
                        required: 'New password is required',
                        minLength: {
                          value: 8,
                          message: 'Password must be at least 8 characters',
                        },
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?])/,
                          message: 'Password must contain uppercase, lowercase, number, and special character',
                        },
                      })}
                      style={{
                        width: '100%',
                        padding: '10px 40px 10px 12px',
                        border: `1px solid ${passwordErrors.new_password ? '#dc2626' : '#d1d5db'}`,
                        borderRadius: '6px',
                        fontSize: '14px',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: '#6b7280',
                      }}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordErrors.new_password && (
                    <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {passwordErrors.new_password.message}
                    </span>
                  )}
                  {newPassword && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Password strength:</span>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: '500',
                            color: 
                              passwordStrength === 'weak' ? '#dc2626' :
                              passwordStrength === 'medium' ? '#f59e0b' :
                              passwordStrength === 'good' ? '#3b82f6' : '#10b981',
                          }}
                        >
                          {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px', marginTop: '4px' }}>
                        <div
                          style={{
                            height: '100%',
                            borderRadius: '2px',
                            width: 
                              passwordStrength === 'weak' ? '25%' :
                              passwordStrength === 'medium' ? '50%' :
                              passwordStrength === 'good' ? '75%' : '100%',
                            backgroundColor: 
                              passwordStrength === 'weak' ? '#dc2626' :
                              passwordStrength === 'medium' ? '#f59e0b' :
                              passwordStrength === 'good' ? '#3b82f6' : '#10b981',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    {...registerPassword('confirm_password', {
                      required: 'Please confirm your new password',
                      validate: (value) => value === newPassword || 'Passwords do not match',
                    })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${passwordErrors.confirm_password ? '#dc2626' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  />
                  {passwordErrors.confirm_password && (
                    <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {passwordErrors.confirm_password.message}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Lock size={16} />
                  {isLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Notification Preferences</h2>
              
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>Email Notifications</h3>
                
                {Object.entries(notificationPrefs).map(([key, value]) => {
                  const labels = {
                    email_notifications: 'General email notifications',
                    marketing_emails: 'Marketing and promotional emails',
                    billing_alerts: 'Billing and payment alerts',
                    subscription_updates: 'Subscription updates and changes',
                  };
                  
                  return (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '14px' }}>{labels[key as keyof typeof labels]}</span>
                      <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => updateNotificationPreferences(key as keyof NotificationPreferences, e.target.checked)}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: value ? '#007bff' : '#ccc',
                            borderRadius: '24px',
                            transition: '0.4s',
                          }}
                        >
                          <span
                            style={{
                              position: 'absolute',
                              content: '""',
                              height: '18px',
                              width: '18px',
                              left: value ? '23px' : '3px',
                              bottom: '3px',
                              backgroundColor: 'white',
                              borderRadius: '50%',
                              transition: '0.4s',
                            }}
                          />
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>

              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>Recent Notifications</h3>
                {notifications.length === 0 ? (
                  <p style={{ color: '#6b7280', fontSize: '14px' }}>No notifications yet</p>
                ) : (
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => !notification.read && markNotificationAsRead(notification.id)}
                        style={{
                          padding: '12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          marginBottom: '8px',
                          backgroundColor: notification.read ? '#f9fafb' : '#f0f9ff',
                          cursor: notification.read ? 'default' : 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '4px' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: '500', margin: 0 }}>{notification.title}</h4>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>
                            {new Date(notification.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p style={{ fontSize: '13px', color: '#374151', margin: 0 }}>{notification.message}</p>
                        {!notification.read && (
                          <span style={{ 
                            fontSize: '12px', 
                            color: '#007bff', 
                            fontWeight: '500',
                            marginTop: '4px',
                            display: 'block'
                          }}>
                            Click to mark as read
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Billing History</h2>
              
              {billingHistory.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: '14px' }}>No billing history available</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Date</th>
                        <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Description</th>
                        <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Amount</th>
                        <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingHistory.map((bill) => (
                        <tr key={bill.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '12px', fontSize: '14px' }}>
                            {new Date(bill.date).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px' }}>
                            {bill.description || `${bill.plan} Plan`}
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px' }}>
                            ${bill.amount.toFixed(2)} {bill.currency}
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px' }}>
                            <span
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '500',
                                backgroundColor: 
                                  bill.status === 'succeeded' ? '#dcfce7' :
                                  bill.status === 'failed' ? '#fef2f2' : '#fef3c7',
                                color: 
                                  bill.status === 'succeeded' ? '#166534' :
                                  bill.status === 'failed' ? '#dc2626' : '#92400e',
                              }}
                            >
                              {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'account' && (
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Account Management</h2>
              
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>Account Status</h3>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                  Your account is currently <strong style={{ color: '#10b981' }}>active</strong>
                </p>
              </div>

              <div style={{ 
                border: '1px solid #fecaca', 
                borderRadius: '8px', 
                padding: '20px', 
                backgroundColor: '#fef2f2'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px', color: '#dc2626' }}>
                  Danger Zone
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                  Deactivating your account will temporarily disable access to all features. 
                  You can contact support to reactivate your account.
                </p>
                <button
                  onClick={deactivateAccount}
                  disabled={isLoading}
                  style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Trash2 size={16} />
                  {isLoading ? 'Deactivating...' : 'Deactivate Account'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};