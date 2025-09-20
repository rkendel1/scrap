# Profile Settings and Subscription Management Documentation

This implementation provides comprehensive profile settings and subscription management features for the FormCraft AI application.

## Features Implemented

### 1. User Profile Management

#### Backend Endpoints
- `PATCH /api/profile` - Update user profile information
- `PATCH /api/profile/password` - Update user password
- `POST /api/profile/forgot-password` - Request password reset
- `POST /api/profile/reset-password` - Reset password with token
- `POST /api/profile/deactivate` - Deactivate user account

#### Frontend Components
- `ProfileSettings` - Complete profile management interface
- `ForgotPassword` - Password reset flow
- `AuthModal` - Enhanced authentication modal

### 2. Notification System

#### Backend Endpoints
- `GET /api/profile/notifications` - Get notification preferences
- `PATCH /api/profile/notifications` - Update notification preferences
- `GET /api/profile/notifications/events` - Get user notifications
- `PATCH /api/profile/notifications/events/:id/read` - Mark notification as read

#### Features
- Email notifications for subscription events
- Customizable notification preferences
- In-app notification management
- Automatic notifications for payment failures, renewals, cancellations

### 3. Enhanced Subscription Management

#### Backend Endpoints
- `GET /api/subscription/billing-history` - Get billing history
- `GET /api/subscription/upcoming-billing` - Get upcoming billing information

#### Features
- Complete billing history display
- Upcoming billing information
- Enhanced webhook handling with user notifications
- Automatic subscription event tracking

### 4. Security Features

#### Password Management
- Password strength validation (minimum 8 characters, uppercase, lowercase, number, special character)
- Secure password reset with time-limited tokens
- Current password verification for updates

#### Account Security
- Email uniqueness validation
- Account deactivation/reactivation
- Session tracking preparation
- Secure token-based authentication

## Database Schema

### New Tables Added (Migration 008)

```sql
-- Profile picture and notification preferences
ALTER TABLE users ADD COLUMN profile_picture_url VARCHAR(255);
ALTER TABLE users ADD COLUMN notification_preferences JSONB DEFAULT '{"email_notifications": true, "marketing_emails": false, "billing_alerts": true, "subscription_updates": true}';

-- Account status management
ALTER TABLE users ADD COLUMN account_status VARCHAR(20) DEFAULT 'active';
ALTER TABLE users ADD COLUMN deactivated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN deactivation_reason TEXT;

-- Password reset tokens
CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP WITH TIME ZONE
);

-- Notification events
CREATE TABLE notification_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    sent_via_email BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

-- User sessions (for future enhancement)
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Setup Instructions

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Email Configuration (for password reset and notifications)
SMTP_HOST=smtp.your-email-provider.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password
FROM_EMAIL=noreply@formcraft.ai

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:3000
```

### 2. Database Migration

Run the migration to add the new tables:

```bash
cd backend
npm run migrate
```

### 3. Frontend Integration

#### Basic Usage

```tsx
import React, { useState } from 'react';
import { ProfileSettings } from './components/ProfileSettings';
import { AuthModal } from './components/AuthModal';

export const App = () => {
  const [user, setUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div>
      {user && (
        <ProfileSettings 
          user={user} 
          onUserUpdate={setUser} 
        />
      )}
    </div>
  );
};
```

#### With Modal Integration

```tsx
import { ProfileModal, AuthModal } from './components/AuthModal';

// Use ProfileModal for overlay display
<ProfileModal
  isOpen={showProfile}
  onClose={() => setShowProfile(false)}
  user={user}
  onUserUpdate={handleUserUpdate}
/>
```

## API Usage Examples

### Update Profile

```javascript
import { apiService } from './services/api';

// Update user profile
const updateProfile = async () => {
  try {
    const response = await apiService.updateProfile({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      profile_picture_url: 'https://example.com/photo.jpg'
    });
    
    if (response.success) {
      console.log('Profile updated:', response.user);
    }
  } catch (error) {
    console.error('Profile update failed:', error);
  }
};
```

### Password Reset Flow

```javascript
// Request password reset
const forgotPassword = async (email) => {
  try {
    const response = await apiService.forgotPassword(email);
    if (response.success) {
      // Email sent successfully
      console.log('Reset email sent');
    }
  } catch (error) {
    console.error('Failed to send reset email:', error);
  }
};

// Reset password with token
const resetPassword = async (token, newPassword) => {
  try {
    const response = await apiService.resetPassword(token, newPassword);
    if (response.success) {
      // Password reset successful
      console.log('Password reset successful');
    }
  } catch (error) {
    console.error('Password reset failed:', error);
  }
};
```

### Notification Management

```javascript
// Get notifications
const getNotifications = async () => {
  try {
    const response = await apiService.getNotifications();
    if (response.success) {
      console.log('Notifications:', response.notifications);
    }
  } catch (error) {
    console.error('Failed to get notifications:', error);
  }
};

// Update notification preferences
const updateNotificationPrefs = async () => {
  try {
    const response = await apiService.updateNotificationPreferences({
      email_notifications: true,
      marketing_emails: false,
      billing_alerts: true,
      subscription_updates: true
    });
    
    if (response.success) {
      console.log('Preferences updated');
    }
  } catch (error) {
    console.error('Failed to update preferences:', error);
  }
};
```

## Customization

### Styling

The components use inline styles for maximum compatibility, but you can easily customize them:

```tsx
// Override styles by passing custom styles
<ProfileSettings 
  user={user} 
  onUserUpdate={setUser}
  customStyles={{
    container: { backgroundColor: '#f5f5f5' },
    sidebar: { backgroundColor: '#white' },
    // ... other style overrides
  }}
/>
```

### Notification Events

Add custom notification events in your application:

```javascript
// In your backend service
await profileService.createNotificationEvent(
  userId,
  'custom_event',
  'Custom Notification',
  'This is a custom notification message',
  true // Send email
);
```

## Security Considerations

1. **Password Strength**: Enforced minimum requirements (8+ characters, mixed case, numbers, special characters)
2. **Email Validation**: Server-side email format and uniqueness validation
3. **Token Security**: Password reset tokens expire in 1 hour and are single-use
4. **Account Protection**: Account deactivation prevents access while preserving data
5. **Notification Privacy**: Users can control which notifications they receive

## Testing

### Backend Testing

```bash
# Test profile endpoints
curl -X PATCH http://localhost:3001/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"first_name": "John", "last_name": "Doe"}'

# Test password reset
curl -X POST http://localhost:3001/api/profile/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### Frontend Testing

Test the components in isolation:

```tsx
// Test ProfileSettings component
import { ProfileSettings } from './components/ProfileSettings';

const TestApp = () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User'
  };

  return (
    <ProfileSettings 
      user={mockUser}
      onUserUpdate={(user) => console.log('User updated:', user)}
    />
  );
};
```

## Future Enhancements

1. **Two-Factor Authentication**: Add 2FA support to the profile settings
2. **Social Login**: Integrate OAuth providers (Google, GitHub, etc.)
3. **Profile Picture Upload**: Direct file upload instead of URL-based
4. **Advanced Notifications**: Push notifications, SMS notifications
5. **Account Export**: Allow users to export their data
6. **Session Management**: Active session management and logout from other devices
7. **Privacy Settings**: Granular privacy controls
8. **Account Deletion**: Complete account deletion with data removal

## Troubleshooting

### Common Issues

1. **Email not sending**: Check SMTP configuration in environment variables
2. **Password reset token expired**: Tokens expire after 1 hour, request a new one
3. **Profile update fails**: Check email uniqueness and validation requirements
4. **Notifications not appearing**: Verify notification preferences are enabled

### Debug Mode

Enable debug logging for troubleshooting:

```javascript
// Add to your environment variables
DEBUG=profile-service,stripe-service,notification-service
```