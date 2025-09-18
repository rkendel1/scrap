# n8n Integration - Customer Configuration Examples

This file contains example customer configurations demonstrating various routing scenarios.

## Example 1: Basic Webhook Routing

```json
{
  "customer_id": "basic-webhook-customer",
  "customer_name": "Basic Webhook Customer",
  "routing_config": {
    "routing_rules": [
      {
        "condition": "all_forms",
        "action": "webhook",
        "target": "https://api.customer.com/webhook/forms",
        "priority": 1,
        "headers": {
          "Authorization": "Bearer customer-api-key",
          "Content-Type": "application/json",
          "X-Source": "scrap-forms"
        }
      }
    ]
  }
}
```

## Example 2: Multi-Channel Routing

```json
{
  "customer_id": "multi-channel-customer",
  "customer_name": "Multi-Channel Customer",
  "routing_config": {
    "routing_rules": [
      {
        "condition": "form_type == 'contact'",
        "action": "webhook",
        "target": "https://crm.customer.com/api/leads",
        "priority": 1,
        "headers": {
          "Authorization": "Bearer crm-token"
        }
      },
      {
        "condition": "form_type == 'support'",
        "action": "webhook", 
        "target": "https://support.customer.com/api/tickets",
        "priority": 1,
        "headers": {
          "Authorization": "Bearer support-token"
        }
      },
      {
        "condition": "all_forms",
        "action": "slack",
        "target": "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX",
        "priority": 2,
        "template": "New form submission from {{name}} ({{email}}): {{message}}"
      }
    ]
  }
}
```

## Example 3: Enterprise Customer with Complex Routing

```json
{
  "customer_id": "enterprise-customer-001",
  "customer_name": "Enterprise Customer Inc",
  "routing_config": {
    "routing_rules": [
      {
        "condition": "lead_score > 80",
        "action": "webhook",
        "target": "https://enterprise.customer.com/api/high-value-leads",
        "priority": 1,
        "headers": {
          "Authorization": "Bearer high-priority-token",
          "X-Priority": "high",
          "X-Route": "sales-team"
        }
      },
      {
        "condition": "form_type == 'demo_request'",
        "action": "webhook",
        "target": "https://scheduling.customer.com/api/book-demo",
        "priority": 1,
        "headers": {
          "Authorization": "Bearer demo-booking-token"
        }
      },
      {
        "condition": "all_forms",
        "action": "webhook",
        "target": "https://analytics.customer.com/api/form-data",
        "priority": 3,
        "headers": {
          "Authorization": "Bearer analytics-token",
          "X-Event-Type": "form_submission"
        }
      }
    ]
  }
}
```

## Example 4: Testing Customer Configuration

```json
{
  "customer_id": "test-customer",
  "customer_name": "Test Customer for Development",
  "routing_config": {
    "routing_rules": [
      {
        "condition": "all_forms",
        "action": "webhook",
        "target": "https://webhook.site/your-unique-url",
        "priority": 1,
        "headers": {
          "Content-Type": "application/json",
          "X-Test": "true"
        }
      }
    ]
  }
}
```

## Usage Instructions

### Creating Configurations via API

```bash
# Create a customer configuration
curl -X POST http://localhost:3001/api/customer-configs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "your-customer-id",
    "customer_name": "Your Customer Name", 
    "routing_config": {
      "routing_rules": [...]
    }
  }'
```

### Mapping Forms to Customers

```bash
# Map a form to a customer configuration
curl -X POST http://localhost:3001/api/forms/FORM_ID/customer-mapping \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "your-customer-id"
  }'
```

### Testing Configuration

1. **Set up webhook.site**: Go to https://webhook.site and get a unique URL
2. **Update test configuration**: Replace target URL with your webhook.site URL
3. **Create test configuration**: Use API to create the test customer config
4. **Map a form**: Connect an existing form to the test customer
5. **Submit test data**: Fill out the form and verify data appears on webhook.site

## Condition Syntax

The `condition` field supports various expressions:

- `all_forms` - Matches all form submissions
- `form_type == 'contact'` - Matches forms with specific type
- `lead_score > 80` - Numeric comparisons (requires lead scoring implementation)
- `email.endsWith('@enterprise.com')` - String methods
- `country == 'US' && state == 'CA'` - Logical operators

## Action Types

### webhook
Routes data to external HTTP endpoints
- **Required**: `target` (URL)
- **Optional**: `headers` (object), `method` (default: POST)

### slack  
Posts messages to Slack channels
- **Required**: `target` (webhook URL)
- **Optional**: `template` (message template), `channel`

### email
Sends email notifications
- **Required**: `target` (email address)
- **Optional**: `template` (email template), `subject`

### n8n
Routes through specific n8n workflows
- **Required**: `target` (n8n webhook URL)
- **Optional**: `workflow_id`, `auth_token`

## Priority Handling

- **Lower numbers** = higher priority
- **Same priority** = executed in parallel
- **Different priorities** = executed in order
- **Failed rules** don't block subsequent rules