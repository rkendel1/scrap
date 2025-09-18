import { ConnectorConfig, ConnectorResult, Submission } from './types';

export interface N8nConnectorConfig extends ConnectorConfig {
  type: 'n8n';
  settings: {
    webhookUrl: string;
    customerId?: string;
    workflowId?: string;
    authToken?: string;
  };
}

export class N8nConnector {
  async send(submission: Submission, config: N8nConnectorConfig): Promise<ConnectorResult> {
    try {
      const { webhookUrl, customerId, workflowId, authToken } = config.settings;
      
      // Prepare payload for n8n webhook
      const payload = {
        form_data: submission,
        customer_id: customerId || 'default',
        workflow_id: workflowId,
        timestamp: new Date().toISOString(),
        source: 'scrap-form-system'
      };

      // Set up headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Scrap-Form-System/1.0'
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      // Send to n8n webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`n8n webhook failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        message: `Successfully sent to n8n webhook. Response: ${JSON.stringify(result)}`
      };

    } catch (error) {
      console.error('n8n connector error:', error);
      return {
        success: false,
        message: `n8n connector failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      };
    }
  }
}

export const n8nConnector = new N8nConnector();