import React, { useState } from 'react';
import { LoginForm, RegisterForm } from './AuthForms';
import { ForgotPassword } from './ForgotPassword';
import { ProfileSettings } from './ProfileSettings';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any, token: string) => void;
}

type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [error, setError] = useState<string | null>(null);
  
  // Check if we're in reset password mode (token in URL)
  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('token');
  
  React.useEffect(() => {
    if (resetToken) {
      setAuthMode('reset-password');
    }
  }, [resetToken]);

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  };

  const handleSuccess = (user: any, token: string) => {
    setError(null);
    onSuccess(user, token);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '0',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666',
            zIndex: 1001,
          }}
        >
          ×
        </button>

        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            margin: '16px',
            marginBottom: '0',
          }}>
            {error}
          </div>
        )}

        <div style={{ padding: '20px' }}>
          {authMode === 'login' && (
            <LoginForm
              onSuccess={handleSuccess}
              onSwitchToRegister={() => setAuthMode('register')}
              onSwitchToForgotPassword={() => setAuthMode('forgot-password')}
              onError={handleError}
            />
          )}

          {authMode === 'register' && (
            <RegisterForm
              onSuccess={handleSuccess}
              onSwitchToLogin={() => setAuthMode('login')}
              onError={handleError}
            />
          )}

          {(authMode === 'forgot-password' || authMode === 'reset-password') && (
            <ForgotPassword
              onBackToLogin={() => setAuthMode('login')}
              resetToken={resetToken || undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Example of how to integrate ProfileSettings into your main app
interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onUserUpdate: (user: any) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  user, 
  onUserUpdate 
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '0',
        maxWidth: '95vw',
        maxHeight: '95vh',
        overflow: 'auto',
        position: 'relative',
        width: '100%',
        maxWidth: '900px',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666',
            zIndex: 1001,
          }}
        >
          ×
        </button>

        <ProfileSettings user={user} onUserUpdate={onUserUpdate} />
      </div>
    </div>
  );
};

// Example usage in your main app component:
/*
export const App = () => {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleAuthSuccess = (userData: any, token: string) => {
    setUser(userData);
    // Store token in localStorage or state management
    localStorage.setItem('authToken', token);
  };

  const handleUserUpdate = (updatedUser: any) => {
    setUser(updatedUser);
  };

  return (
    <div>
      <header>
        {user ? (
          <div>
            <span>Welcome, {user.first_name}!</span>
            <button onClick={() => setShowProfile(true)}>Settings</button>
            <button onClick={() => {
              setUser(null);
              localStorage.removeItem('authToken');
            }}>Logout</button>
          </div>
        ) : (
          <button onClick={() => setShowAuth(true)}>Sign In</button>
        )}
      </header>

      <main>
        // Your main app content
      </main>

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={handleAuthSuccess}
      />

      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={user}
        onUserUpdate={handleUserUpdate}
      />
    </div>
  );
};
*/