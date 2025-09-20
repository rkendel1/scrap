CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    subscription_tier VARCHAR(50) DEFAULT 'free' NOT NULL,
    subscription_status VARCHAR(50) DEFAULT 'active' NOT NULL,
    profile_picture_url VARCHAR(255),
    notification_preferences JSONB DEFAULT '{"email_notifications": true, "marketing_emails": false, "billing_alerts": true, "subscription_updates": true}',
    account_status VARCHAR(20) DEFAULT 'active',
    deactivated_at TIMESTAMP WITH TIME ZONE,
    deactivation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS guest_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    associated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);