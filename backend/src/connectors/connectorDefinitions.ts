export interface ConnectorFieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'email' | 'url' | 'password' | 'select' | 'textarea';
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: string[]; // For select fields
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

export interface ConnectorDefinition {
  type: string;
  label: string;
  description: string;
  icon?: string;
  isPremium: boolean;
  fields: ConnectorFieldDefinition[];
}

export const connectorDefinitions: Record<string, ConnectorDefinition> = {
  email: {
    type: 'email',
    label: 'Email Notifications',
    description: 'Send form submissions via email',
    icon: '📧',
    isPremium: false,
    fields: [
      {
        name: 'to',
        label: 'To Email',
        type: 'email',
        required: true,
        placeholder: 'recipient@example.com',
        description: 'Email address to receive form submissions'
      },
      {
        name: 'subject',
        label: 'Email Subject',
        type: 'text',
        required: false,
        placeholder: 'New Form Submission',
        description: 'Subject line for the email notification'
      },
      {
        name: 'template',
        label: 'Email Template',
        type: 'textarea',
        required: false,
        placeholder: 'New submission from {{name}} ({{email}}): {{message}}',
        description: 'Custom email template. Use {{fieldName}} for dynamic values'
      }
    ]
  },
  
  slack: {
    type: 'slack',
    label: 'Slack Notifications', 
    description: 'Send form submissions to Slack channels',
    icon: '💬',
    isPremium: false,
    fields: [
      {
        name: 'webhookUrl',
        label: 'Webhook URL',
        type: 'url',
        required: true,
        placeholder: 'https://hooks.slack.com/services/...',
        description: 'Slack webhook URL for your channel'
      },
      {
        name: 'channel',
        label: 'Channel',
        type: 'text',
        required: false,
        placeholder: '#notifications',
        description: 'Target Slack channel (optional)'
      },
      {
        name: 'template',
        label: 'Message Template',
        type: 'textarea',
        required: false,
        placeholder: '🚀 New lead: {{name}} from {{company}} - {{email}}',
        description: 'Custom message template. Use {{fieldName}} for dynamic values'
      }
    ]
  },

  googlesheets: { // Changed type to 'googlesheets'
    type: 'googlesheets',
    label: 'Google Sheets',
    description: 'Add form submissions as rows in Google Sheets',
    icon: '📊',
    isPremium: false,
    fields: [
      {
        name: 'spreadsheetId',
        label: 'Spreadsheet ID',
        type: 'text',
        required: true,
        placeholder: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
        description: 'Google Sheets spreadsheet ID from the URL'
      },
      {
        name: 'sheetName',
        label: 'Sheet Name',
        type: 'text',
        required: false,
        placeholder: 'Sheet1',
        description: 'Name of the specific sheet tab (defaults to Sheet1)'
      }
    ]
  },

  webhook: { // Added generic webhook as a user-facing option
    type: 'webhook',
    label: 'Generic Webhook',
    description: 'Send form submissions to any custom webhook URL',
    icon: '🔗',
    isPremium: false,
    fields: [
      {
        name: 'url',
        label: 'Webhook URL',
        type: 'url',
        required: true,
        placeholder: 'https://api.yourdomain.com/webhook',
        description: 'The URL where the form data will be sent'
      },
      {
        name: 'method',
        label: 'HTTP Method',
        type: 'select',
        required: false,
        options: ['POST', 'GET', 'PUT', 'PATCH'],
        placeholder: 'POST',
        description: 'HTTP method to use for the webhook request (defaults to POST)'
      },
      {
        name: 'headers',
        label: 'Custom Headers (JSON)',
        type: 'textarea',
        required: false,
        placeholder: '{"Authorization": "Bearer your_token", "X-Custom-Header": "value"}',
        description: 'Optional custom headers in JSON format'
      }
    ]
  },
  zapier: { // Added Zapier connector definition
    type: 'zapier',
    label: 'Zapier Webhook',
    description: 'Send form submissions to a Zapier Catch Hook',
    icon: '⚡',
    isPremium: true, // Zapier is often considered a premium integration
    fields: [
      {
        name: 'webhookUrl',
        label: 'Zapier Catch Hook URL',
        type: 'url',
        required: true,
        placeholder: 'https://hooks.zapier.com/hooks/catch/...',
        description: 'The URL of your Zapier Catch Hook'
      }
    ]
  }
};

export function getConnectorDefinition(type: string): ConnectorDefinition | undefined {
  return connectorDefinitions[type];
}

export function getAllConnectorDefinitions(): ConnectorDefinition[] {
  // Filter out internal connectors like 'n8n' if it were in the map
  return Object.values(connectorDefinitions).filter(def => def.type !== 'n8n');
}

export function validateConnectorConfig(type: string, settings: Record<string, any>): { valid: boolean; errors: string[] } {
  const definition = getConnectorDefinition(type);
  if (!definition) {
    return { valid: false, errors: [`Unknown connector type: ${type}`] };
  }

  const errors: string[] = [];

  for (const field of definition.fields) {
    const value = settings[field.name];

    // Check required fields
    if (field.required && (!value || value.toString().trim() === '')) {
      errors.push(`${field.label} is required`);
      continue;
    }

    // Skip validation for empty optional fields
    if (!value || value.toString().trim() === '') {
      continue;
    }

    // Type-specific validation
    if (field.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.push(`${field.label} must be a valid email address`);
      }
    }

    if (field.type === 'url') {
      try {
        new URL(value);
      } catch {
        errors.push(`${field.label} must be a valid URL`);
      }
    }

    // Validation rules
    if (field.validation) {
      if (field.validation.pattern) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(value)) {
          errors.push(`${field.label} format is invalid`);
        }
      }

      if (field.validation.minLength && value.length < field.validation.minLength) {
        errors.push(`${field.label} must be at least ${field.validation.minLength} characters`);
      }

      if (field.validation.maxLength && value.length > field.validation.maxLength) {
        errors.push(`${field.label} must not exceed ${field.validation.maxLength} characters`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}