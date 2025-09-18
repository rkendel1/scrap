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

  googleSheets: {
    type: 'googleSheets',
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

  n8n: {
    type: 'n8n',
    label: 'n8n Workflow Automation',
    description: 'Route form submissions through n8n workflows for advanced automation and customer-specific routing',
    icon: '🔄',
    isPremium: false,
    fields: [
      {
        name: 'webhookUrl',
        label: 'n8n Webhook URL',
        type: 'url',
        required: true,
        placeholder: 'http://localhost:5678/webhook/form-submission',
        description: 'n8n webhook endpoint URL'
      },
      {
        name: 'customerId',
        label: 'Customer ID',
        type: 'text',
        required: false,
        placeholder: 'customer-001',
        description: 'Customer identifier for routing configuration'
      },
      {
        name: 'workflowId',
        label: 'Workflow ID',
        type: 'text',
        required: false,
        placeholder: 'form-data-router',
        description: 'Specific n8n workflow to trigger (optional)'
      },
      {
        name: 'authToken',
        label: 'Authorization Token',
        type: 'password',
        required: false,
        placeholder: 'Bearer token...',
        description: 'Optional authentication token for secure webhook access'
      }
    ]
  }
};

export function getConnectorDefinition(type: string): ConnectorDefinition | undefined {
  return connectorDefinitions[type];
}

export function getAllConnectorDefinitions(): ConnectorDefinition[] {
  return Object.values(connectorDefinitions);
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