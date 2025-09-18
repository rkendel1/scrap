# n8n Integration Documentation

## Overview

This document provides comprehensive guidance on deploying and using the n8n workflow automation system integrated with the existing FormCraft AI Docker stack. The integration enables sophisticated form data routing and customer-specific automation workflows.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Deployment Guide](#deployment-guide)
3. [Customer Configuration Management](#customer-configuration-management)
4. [n8n Workflow Setup](#n8n-workflow-setup)
5. [API Endpoints](#api-endpoints)
6. [Testing & Verification](#testing--verification)
7. [Troubleshooting](#troubleshooting)

## Architecture Overview

The n8n integration adds a new layer of workflow automation to the existing form submission pipeline:

```
Form Submission → Backend API → Customer Config Check → n8n Webhook → Customer-Specific Routing
                      ↓
                 Existing Connectors (Email, Slack, etc.)
```

### Components

- **n8n Service**: Workflow automation engine running in Docker
- **Customer Configuration System**: Database-backed customer routing rules
- **n8n Connector**: New connector type in the existing connector system
- **Customer Config API**: REST endpoints for managing customer configurations

## Deployment Guide

### Prerequisites

- Docker & Docker Compose installed
- Existing FormCraft AI stack deployed and running

### 1. Start the Enhanced Stack

The n8n service is already configured in `docker-compose.yml`. Start all services:

```bash
# From the project root
docker compose up -d

# Verify all services are running
docker compose ps
```

### 2. Service Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React application |
| Backend API | http://localhost:3001 | Express API |
| n8n Interface | http://localhost:5678 | n8n workflow editor |

### 3. n8n Initial Setup

1. **Access n8n**: Navigate to http://localhost:5678
2. **Login Credentials**:
   - Username: `admin`
   - Password: `admin123`
3. **Database**: n8n is configured to use the same PostgreSQL database with schema `n8n`

### 4. Database Migration

Run the database migration to create customer configuration tables:

```bash
# Connect to the backend container and run migration
docker compose exec backend npm run migrate

# Or manually run the SQL migration
docker compose exec db psql -U scrap_user -d scrap_db -f /docker-entrypoint-initdb.d/006_add_customer_config_tables.sql
```

## Customer Configuration Management

### Configuration Schema

Customer configurations define how form submissions are routed. Each customer has:

```json
{
  "customer_id": "unique-customer-identifier",
  "customer_name": "Human-readable name",
  "routing_config": {
    "routing_rules": [
      {
        "condition": "all_forms",
        "action": "webhook",
        "target": "https://customer-endpoint.com/webhook",
        "priority": 1,
        "headers": {
          "Authorization": "Bearer token",
          "Content-Type": "application/json"
        }
      },
      {
        "condition": "form_type == 'contact'",
        "action": "email",
        "target": "customer@example.com",
        "template": "New contact: {{name}} - {{email}}"
      }
    ]
  }
}
```

### Supported Actions

- **webhook**: HTTP POST to external endpoint
- **email**: Send email notification
- **slack**: Post to Slack channel
- **n8n**: Route through specific n8n workflow

### Default Configuration

A default customer configuration is created during migration:

- **Customer ID**: `default`
- **Webhook URL**: `http://n8n:5678/webhook/form-submission`
- **Action**: Routes all forms to the default n8n workflow

## n8n Workflow Setup

### Default Workflow: Form Data Router

A pre-configured workflow template is provided at `/n8n/workflows/form-data-router.json`. This workflow:

1. **Receives webhook data** from form submissions
2. **Reads customer configuration** from the mounted config file
3. **Routes data** based on customer-specific rules
4. **Responds** with success/failure status

### Workflow Components

1. **Webhook Trigger**: Receives POST data at `/webhook/form-submission`
2. **Code Node**: Processes customer configuration and routing logic
3. **Conditional Nodes**: Route based on action type (webhook, email, etc.)
4. **HTTP Request Nodes**: Send data to external endpoints
5. **Response Node**: Confirms successful processing

### Importing the Workflow

1. Access n8n at http://localhost:5678
2. Click "Import from file"
3. Select `/n8n/workflows/form-data-router.json`
4. Activate the workflow

### Custom Workflows

Create custom workflows for specific customers:

1. **Duplicate** the base workflow
2. **Modify** routing logic for customer needs
3. **Update** customer configuration to point to new workflow
4. **Test** with sample data

## API Endpoints

### Customer Configuration Management

#### Get All Customer Configurations
```bash
GET /api/customer-configs
Authorization: Bearer <jwt-token>
```

#### Get Specific Customer Configuration
```bash
GET /api/customer-configs/{customerId}
Authorization: Bearer <jwt-token>
```

#### Create Customer Configuration
```bash
POST /api/customer-configs
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "customer_id": "customer-001",
  "customer_name": "Example Customer",
  "routing_config": {
    "routing_rules": [...]
  }
}
```

#### Update Customer Configuration
```bash
PUT /api/customer-configs/{customerId}
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "customer_name": "Updated Name",
  "routing_config": {...}
}
```

#### Map Form to Customer
```bash
POST /api/forms/{formId}/customer-mapping
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "customer_id": "customer-001"
}
```

### n8n Workflow Management

#### Get All n8n Workflows
```bash
GET /api/n8n-workflows
Authorization: Bearer <jwt-token>
```

#### Create n8n Workflow
```bash
POST /api/n8n-workflows
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "workflow_name": "Custom Customer Workflow",
  "workflow_id": "custom-workflow-001",
  "webhook_url": "http://n8n:5678/webhook/custom-workflow",
  "description": "Custom routing for specific customer"
}
```

## Testing & Verification

### 1. Test n8n Service

```bash
# Check n8n health
curl -I http://localhost:5678

# Expected: HTTP/1.1 200 OK
```

### 2. Test Backend Integration

```bash
# Get connector definitions (should include n8n)
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/connector-definitions

# Get customer configurations
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/customer-configs
```

### 3. Test Webhook Endpoint

```bash
# Test n8n webhook directly
curl -X POST http://localhost:5678/webhook/form-submission \
  -H "Content-Type: application/json" \
  -d '{
    "form_data": {
      "name": "Test User",
      "email": "test@example.com",
      "message": "Test message"
    },
    "customer_id": "default",
    "timestamp": "2024-01-01T00:00:00Z"
  }'
```

### 4. End-to-End Form Submission Test

1. **Create a test form** in the frontend (http://localhost:5173)
2. **Map the form** to a customer configuration
3. **Submit test data** through the form
4. **Verify routing** in n8n execution logs
5. **Check destination** endpoints received data

## Troubleshooting

### Common Issues

#### n8n Service Not Starting

**Symptoms**: n8n container fails to start or exits immediately

**Solutions**:
```bash
# Check n8n logs
docker compose logs n8n

# Verify database connection
docker compose exec n8n n8n --help

# Reset n8n data volume
docker compose down
docker volume rm scrap_n8n_data
docker compose up -d
```

#### Database Connection Issues

**Symptoms**: Customer configuration APIs return database errors

**Solutions**:
```bash
# Check database status
docker compose exec db pg_isready -U scrap_user -d scrap_db

# Verify migration ran
docker compose exec db psql -U scrap_user -d scrap_db -c "\dt"

# Re-run migration
docker compose exec backend npm run migrate
```

#### Webhook Not Receiving Data

**Symptoms**: Form submissions not reaching n8n

**Solutions**:
1. **Check form-to-customer mapping** exists
2. **Verify customer configuration** has correct webhook URL
3. **Check n8n workflow** is active and webhook trigger enabled
4. **Test webhook directly** with curl (see testing section)

#### Custom Workflow Issues

**Symptoms**: Custom workflows not executing correctly

**Solutions**:
1. **Check workflow syntax** in n8n editor
2. **Verify customer configuration** points to correct workflow
3. **Test workflow manually** in n8n interface
4. **Check execution logs** in n8n

### Debug Commands

```bash
# View all service logs
docker compose logs -f

# View specific service logs
docker compose logs -f n8n
docker compose logs -f backend

# Check container status
docker compose ps

# Access n8n container
docker compose exec n8n sh

# Access database
docker compose exec db psql -U scrap_user -d scrap_db

# Test network connectivity between services
docker compose exec backend curl http://n8n:5678
```

### Log Monitoring

Key log locations and what to monitor:

1. **Backend Logs**: Form submission processing and connector triggers
2. **n8n Logs**: Workflow execution and webhook processing
3. **Database Logs**: Connection issues and query errors

## Advanced Configuration

### Production Considerations

1. **Change default n8n credentials**
2. **Configure SSL/TLS** for n8n interface
3. **Set up persistent volumes** for production data
4. **Configure backup strategy** for customer configurations
5. **Implement monitoring** and alerting for failed workflows

### Performance Optimization

1. **Database indexing** on customer_id and form_id columns
2. **Connection pooling** for high-volume form submissions
3. **Caching** frequently accessed customer configurations
4. **Workflow optimization** for complex routing rules

### Security

1. **JWT token authentication** for all API endpoints
2. **Validate webhook signatures** from external sources
3. **Sanitize customer configuration** inputs
4. **Network isolation** between services in production
5. **Regular security updates** for all Docker images