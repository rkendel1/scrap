import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

interface LoginFormProps {
  onSuccess: (user: any, token: string) => void;
  onSwitchToRegister: () => void;
  onError: (error: string) => void;
}

interface RegisterFormProps {
  onSuccess: (user: any, token: string) => void;
  onSwitchToLogin: () => void;
  onError: (error: string) => void;
  guestToken?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ 
  onSuccess, 
  onSwitchToRegister, 
  onError 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (result.success) {
        onSuccess(result.user, result.token);
      } else {
        onError(result.error || 'Login failed');
      }
    } catch (error) {
      onError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Sign In</h2>
      <p>Welcome back! Please sign in to access your forms.</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            className={`form-input ${errors.email ? 'error' : ''}`}
            placeholder="your@email.com"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
          />
          {errors.email && (
            <span className="error-message">{errors.email.message as string}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            className={`form-input ${errors.password ? 'error' : ''}`}
            placeholder="Enter your password"
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters'
              }
            })}
          />
          {errors.password && (
            <span className="error-message">{errors.password.message as string}</span>
          )}
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isLoading}
          style={{ width: '100%', marginBottom: '16px' }}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div style={{ textAlign: 'center' }}>
        <span style={{ color: '#666' }}>Don't have an account? </span>
        <button 
          onClick={onSwitchToRegister}
          className="btn-link"
        >
          Create Account
        </button>
      </div>
    </div>
  );
};

export const RegisterForm: React.FC<RegisterFormProps> = ({ 
  onSuccess, 
  onSwitchToLogin, 
  onError,
  guestToken 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, watch } = useForm();

  const password = watch('password');

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        ...(guestToken && { guestToken })
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (result.success) {
        onSuccess(result.user, result.token);
      } else {
        onError(result.error || 'Registration failed');
      }
    } catch (error) {
      onError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Create Account</h2>
      <p>Join FormCraft AI to create unlimited forms and access premium features.</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="firstName" className="form-label">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              className="form-input"
              placeholder="John"
              {...register('firstName')}
            />
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="lastName" className="form-label">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              className="form-input"
              placeholder="Doe"
              {...register('lastName')}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            className={`form-input ${errors.email ? 'error' : ''}`}
            placeholder="your@email.com"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
          />
          {errors.email && (
            <span className="error-message">{errors.email.message as string}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            className={`form-input ${errors.password ? 'error' : ''}`}
            placeholder="Create a strong password"
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters'
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: 'Password must contain uppercase, lowercase, and number'
              }
            })}
          />
          {errors.password && (
            <span className="error-message">{errors.password.message as string}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
            placeholder="Confirm your password"
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) => value === password || 'Passwords do not match'
            })}
          />
          {errors.confirmPassword && (
            <span className="error-message">{errors.confirmPassword.message as string}</span>
          )}
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isLoading}
          style={{ width: '100%', marginBottom: '16px' }}
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div style={{ textAlign: 'center' }}>
        <span style={{ color: '#666' }}>Already have an account? </span>
        <button 
          onClick={onSwitchToLogin}
          className="btn-link"
        >
          Sign In
        </button>
      </div>

      {guestToken && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#e3f2fd',
          borderRadius: '4px',
          fontSize: '14px',
          color: '#1565c0'
        }}>
          ✨ Your guest forms will be saved to your account after registration
        </div>
      )}
    </div>
  );
};