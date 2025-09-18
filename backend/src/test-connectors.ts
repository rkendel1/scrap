#!/usr/bin/env node

// Simple test to verify the connector system works
import { dispatchToConnectors } from './connectors/dispatcher';

async function testConnectors() {
  console.log('🧪 Testing Modular Connector System\n');

  const submission = {
    name: "Jane Doe",
    email: "jane@example.com",
    company: "Test Corp",
    message: "This is a test form submission"
  };

  // Test Free Tier connectors
  const freeConnectors = [
    {
      type: "email",
      settings: { to: "owner@example.com", subject: "New Contact Form" }
    },
    {
      type: "slack",
      settings: { 
        webhookUrl: "https://hooks.slack.com/test",
        channel: "#notifications"
      }
    },
    {
      type: "webhook",
      settings: { url: "https://example.com/webhook" }
    }
  ];

  console.log('Testing Free Tier Connectors:');
  const freeResults = await dispatchToConnectors(submission, freeConnectors);
  
  freeResults.forEach((result, index) => {
    const connector = freeConnectors[index];
    const status = result.success ? '✅' : '❌';
    console.log(`  ${status} ${connector.type}: ${result.message}`);
  });

  // Test Premium Tier connectors
  const premiumConnectors = [
    {
      type: "hubspot",
      credentials: { apiKey: "test-key" },
      settings: { portalId: "12345", objectType: "contact" }
    },
    {
      type: "salesforce",
      credentials: { instanceUrl: "https://test.salesforce.com", accessToken: "test-token" },
      settings: { objectType: "Lead" }
    }
  ];

  console.log('\nTesting Premium Tier Connectors:');
  const premiumResults = await dispatchToConnectors(submission, premiumConnectors);
  
  premiumResults.forEach((result, index) => {
    const connector = premiumConnectors[index];
    const status = result.success ? '✅' : '❌';
    console.log(`  ${status} ${connector.type}: ${result.message}`);
  });

  console.log('\n🎉 Connector test completed!');
}

testConnectors().catch(console.error);