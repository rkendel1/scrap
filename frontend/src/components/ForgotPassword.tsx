import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, ArrowLeft, Check } from 'lucide-react';
import { apiService } from '../services/api';

interface ForgotPasswordFormData {
  email: string;
}

interface ResetPasswordFormData {
  new_password: string;
  confirm_password: string;
}

interface ForgotPasswordProps {
  onBackToLogin: () => void;
  resetToken?: string; // Optional token for reset password flow
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin, resetToken }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
  } = useForm<ForgotPasswordFormData>();

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: resetErrors },
    watch,
  } = useForm<ResetPasswordFormData>();

  const newPassword = watch('new_password');

  const onForgotPassword = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.forgotPassword(data.email);
      if (response.success) {
        setEmailSent(true);
      } else {
        setError(response.message || 'Failed to send reset email');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const onResetPassword = async (data: ResetPasswordFormData) => {
    if (!resetToken) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.resetPassword(resetToken, data.new_password);
      if (response.success) {
        setResetComplete(true);
      } else {
        setError(response.message || 'Failed to reset password');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to reset password');
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

  if (resetComplete) {
    return (
      <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            backgroundColor: '#dcfce7', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Check size={24} style={{ color: '#16a34a' }} />
          </div>
          <h2>Password Reset Complete</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
        </div>

        <button
          onClick={onBackToLogin}
          className="btn btn-primary"
          style={{ width: '100%' }}
        >
          Sign In
        </button>
      </div>
    );
  }

  if (emailSent && !resetToken) {
    return (
      <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            backgroundColor: '#dbeafe', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Mail size={24} style={{ color: '#2563eb' }} />
          </div>
          <h2>Check Your Email</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            We've sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.
          </p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Didn't receive the email? Check your spam folder or try again.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onBackToLogin}
            className="btn"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <ArrowLeft size={16} />
            Back to Sign In
          </button>
          <button
            onClick={() => setEmailSent(false)}
            className="btn btn-primary"
            style={{ flex: 1 }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (resetToken) {
    return (
      <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h2>Reset Your Password</h2>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          Enter your new password below.
        </p>

        {error && (
          <div className="error-message" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmitReset(onResetPassword)}>
          <div className="form-group">
            <label htmlFor="new_password" className="form-label">
              New Password
            </label>
            <input
              id="new_password"
              type="password"
              className={`form-input ${resetErrors.new_password ? 'error' : ''}`}
              placeholder="Enter your new password"
              {...registerReset('new_password', {
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
            />
            {resetErrors.new_password && (
              <span className="error-message">{resetErrors.new_password.message}</span>
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

          <div className="form-group">
            <label htmlFor="confirm_password" className="form-label">
              Confirm New Password
            </label>
            <input
              id="confirm_password"
              type="password"
              className={`form-input ${resetErrors.confirm_password ? 'error' : ''}`}
              placeholder="Confirm your new password"
              {...registerReset('confirm_password', {
                required: 'Please confirm your new password',
                validate: (value) => value === newPassword || 'Passwords do not match',
              })}
            />
            {resetErrors.confirm_password && (
              <span className="error-message">{resetErrors.confirm_password.message}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{ width: '100%', marginBottom: '16px' }}
          >
            {isLoading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onBackToLogin}
            className="btn-link"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '0 auto' }}
          >
            <ArrowLeft size={16} />
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2>Forgot Your Password?</h2>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        Enter your email address and we'll send you a link to reset your password.
      </p>

      {error && (
        <div className="error-message" style={{ marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmitEmail(onForgotPassword)}>
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            className={`form-input ${emailErrors.email ? 'error' : ''}`}
            placeholder="your@email.com"
            {...registerEmail('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
          />
          {emailErrors.email && (
            <span className="error-message">{emailErrors.email.message}</span>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
          style={{ width: '100%', marginBottom: '16px' }}
        >
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <div style={{ textAlign: 'center' }}>
        <button
          onClick={onBackToLogin}
          className="btn-link"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '0 auto' }}
        >
          <ArrowLeft size={16} />
          Back to Sign In
        </button>
      </div>
    </div>
  );
};