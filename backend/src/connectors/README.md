# Modular Connector System

## Overview

This directory contains the modular connector system that allows form submissions to be routed to external services.

## Directory Structure

```
/connectors/
  types.ts          # Shared interfaces and types
  dispatcher.ts     # Main dispatcher with dynamic import system
  
  # Free Tier Connectors
  email.ts         # Email sending via SMTP/SendGrid
  googleSheets.ts  # Google Sheets row appending
  airtable.ts      # Airtable record creation
  slack.ts         # Slack webhook messaging
  webhook.ts       # Generic HTTP webhook

  # Premium Tier Connectors
  hubspot.ts       # HubSpot contact/lead creation
  salesforce.ts    # Salesforce lead/opportunity creation
  notion.ts        # Notion database page creation
  teams.ts         # Microsoft Teams messaging
  zendesk.ts       # Zendesk ticket creation
```

## Usage

### Basic Usage

```typescript
import { dispatchToConnectors } from "./connectors/dispatcher";

const submission = { name: "Jane Doe", email: "jane@example.com" };

const connectors = [
  { type: "email", settings: { to: "owner@example.com" } },
  { type: "slack", settings: { webhookUrl: "https://hooks.slack.com/..." } },
];

const results = await dispatchToConnectors(submission, connectors);
console.log(results);
```

### Integration with SaaS Service

The connector system integrates seamlessly with the existing `SaaSService` class:

- `triggerConnectors()` method fetches active connectors from database
- Converts database config to `ConnectorConfig` format
- Uses `dispatchToConnectors()` to send data to all configured services
- Logs results for monitoring and debugging

## Connector Configuration

Each connector accepts:
- `type`: The connector name (e.g., "email", "slack")
- `credentials`: Authentication data (API keys, tokens, etc.)
- `settings`: Connector-specific configuration

### Examples

#### Email Connector
```json
{
  "type": "email",
  "credentials": {
    "smtp": { "host": "smtp.gmail.com", "user": "...", "pass": "..." }
  },
  "settings": {
    "to": "owner@example.com",
    "subject": "New Form Submission"
  }
}
```

#### Slack Connector
```json
{
  "type": "slack",
  "settings": {
    "webhookUrl": "https://hooks.slack.com/services/...",
    "channel": "#notifications"
  }
}
```

#### HubSpot Connector (Premium)
```json
{
  "type": "hubspot",
  "credentials": {
    "apiKey": "your-hubspot-api-key"
  },
  "settings": {
    "portalId": "12345",
    "objectType": "contact"
  }
}
```

## Adding New Connectors

To add a new connector:

1. Create a new file `yourConnector.ts` in this directory
2. Implement the `send()` function following the interface:
   ```typescript
   export async function send(
     submission: Submission,
     config: ConnectorConfig
   ): Promise<ConnectorResult> {
     // Implementation here
   }
   ```
3. The dispatcher will automatically discover and load it

## Testing

Run the test script to verify all connectors:

```bash
npm run build
node dist/test-connectors.js
```

## Notes

- All connectors currently log their operations instead of making real API calls
- To implement real functionality, uncomment the TODO sections in each connector
- Add appropriate dependencies (nodemailer, googleapis, etc.) as needed
- Each connector handles its own error cases and returns standardized results