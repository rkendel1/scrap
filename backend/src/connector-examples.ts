// Example usage of the modular connector system
import { dispatchToConnectors } from './connectors/dispatcher';

// Example: Contact form submission
const contactSubmission = {
  name: "John Smith",
  email: "john@company.com",
  company: "Tech Solutions Inc",
  phone: "555-0123",
  message: "Interested in your enterprise package. Please contact me.",
  source: "website-contact-form"
};

// Example connector configurations for different use cases
export const exampleConfigurations = {
  // Basic notification setup (Free tier)
  basicNotifications: [
    {
      type: "email",
      settings: {
        to: "sales@mycompany.com",
        subject: "New Contact Form Submission",
        template: "New inquiry from {{name}} at {{company}}: {{message}}"
      }
    },
    {
      type: "slack",
      settings: {
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: "#sales-leads",
        template: "🚀 New lead: {{name}} from {{company}} - {{email}}"
      }
    }
  ],

  // Lead generation with CRM integration (Premium)
  crmIntegration: [
    {
      type: "hubspot",
      credentials: {
        apiKey: process.env.HUBSPOT_API_KEY
      },
      settings: {
        portalId: "12345",
        objectType: "contact"
      }
    },
    {
      type: "salesforce",
      credentials: {
        instanceUrl: process.env.SALESFORCE_INSTANCE_URL,
        accessToken: process.env.SALESFORCE_ACCESS_TOKEN
      },
      settings: {
        objectType: "Lead",
        recordTypeId: "01234567890ABCD"
      }
    }
  ],

  // Support ticket creation
  supportTickets: [
    {
      type: "zendesk",
      credentials: {
        email: process.env.ZENDESK_EMAIL,
        token: process.env.ZENDESK_TOKEN
      },
      settings: {
        subdomain: "mycompany",
        priority: "normal",
        tags: ["website", "contact-form"]
      }
    },
    {
      type: "teams",
      settings: {
        webhookUrl: process.env.TEAMS_WEBHOOK_URL,
        title: "New Support Request"
      }
    }
  ],

  // Data collection and backup
  dataCollection: [
    {
      type: "googleSheets",
      credentials: {
        // Google service account credentials would go here
      },
      settings: {
        spreadsheetId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
        sheetName: "Contact Submissions"
      }
    },
    {
      type: "airtable",
      credentials: {
        apiKey: process.env.AIRTABLE_API_KEY
      },
      settings: {
        baseId: "appXXXXXXXXXXXXXX",
        tableId: "tblXXXXXXXXXXXXXX"
      }
    }
  ]
};

// Usage example function
export async function handleContactFormSubmission(submission: any, tier: 'free' | 'premium') {
  let connectors = [];

  if (tier === 'free') {
    // Free tier gets basic notifications
    connectors = exampleConfigurations.basicNotifications;
  } else {
    // Premium tier gets CRM integration + notifications
    connectors = [
      ...exampleConfigurations.basicNotifications,
      ...exampleConfigurations.crmIntegration,
      ...exampleConfigurations.dataCollection
    ];
  }

  try {
    const results = await dispatchToConnectors(submission, connectors);
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`📊 Dispatch Summary: ${successful} successful, ${failed} failed`);
    
    // Log any failures for debugging
    results.forEach((result, index) => {
      if (!result.success) {
        console.error(`❌ ${connectors[index].type} failed:`, result.message);
      }
    });

    return {
      success: successful > 0,
      summary: { successful, failed, total: results.length },
      results
    };
  } catch (error) {
    console.error('Failed to dispatch to connectors:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      results: []
    };
  }
}

// Example of how this integrates with the existing SaaS service
export function integrateWithSaaSService() {
  /*
  In saas-service.ts, the triggerConnectors method now:
  
  1. Queries database for active connectors on this form
  2. Converts config from database format to ConnectorConfig
  3. Calls dispatchToConnectors(submission, configs)
  4. Logs results for monitoring
  
  This maintains backward compatibility while enabling the new modular system.
  */
}