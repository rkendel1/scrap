import pool from './database';

export interface CustomerConfig {
  id?: number;
  customer_id: string;
  customer_name: string;
  routing_config: any;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface N8nWorkflow {
  id?: number;
  workflow_name: string;
  workflow_id: string;
  webhook_url: string;
  description?: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class CustomerConfigService {
  
  async getCustomerConfig(customerId: string): Promise<CustomerConfig | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM customer_configs WHERE customer_id = $1 AND is_active = true',
        [customerId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting customer config:', error);
      throw error;
    }
  }

  async createCustomerConfig(config: Omit<CustomerConfig, 'id' | 'created_at' | 'updated_at'>): Promise<CustomerConfig> {
    try {
      const result = await pool.query(
        `INSERT INTO customer_configs (customer_id, customer_name, routing_config, is_active)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [config.customer_id, config.customer_name, JSON.stringify(config.routing_config), config.is_active]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating customer config:', error);
      throw error;
    }
  }

  async updateCustomerConfig(customerId: string, updates: Partial<CustomerConfig>): Promise<CustomerConfig | null> {
    try {
      const setParts: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.customer_name !== undefined) {
        setParts.push(`customer_name = $${paramIndex}`);
        values.push(updates.customer_name);
        paramIndex++;
      }

      if (updates.routing_config !== undefined) {
        setParts.push(`routing_config = $${paramIndex}`);
        values.push(JSON.stringify(updates.routing_config));
        paramIndex++;
      }

      if (updates.is_active !== undefined) {
        setParts.push(`is_active = $${paramIndex}`);
        values.push(updates.is_active);
        paramIndex++;
      }

      setParts.push(`updated_at = CURRENT_TIMESTAMP`);

      values.push(customerId);

      const result = await pool.query(
        `UPDATE customer_configs 
         SET ${setParts.join(', ')}
         WHERE customer_id = $${paramIndex}
         RETURNING *`,
        values
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating customer config:', error);
      throw error;
    }
  }

  async deleteCustomerConfig(customerId: string): Promise<boolean> {
    try {
      const result = await pool.query(
        'UPDATE customer_configs SET is_active = false WHERE customer_id = $1',
        [customerId]
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting customer config:', error);
      throw error;
    }
  }

  async getAllCustomerConfigs(): Promise<CustomerConfig[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM customer_configs WHERE is_active = true ORDER BY created_at DESC'
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting all customer configs:', error);
      throw error;
    }
  }

  async mapFormToCustomer(formId: number, customerId: string): Promise<boolean> {
    try {
      await pool.query(
        `INSERT INTO form_customer_mappings (form_id, customer_id)
         VALUES ($1, $2)
         ON CONFLICT (form_id, customer_id) DO NOTHING`,
        [formId, customerId]
      );
      return true;
    } catch (error) {
      console.error('Error mapping form to customer:', error);
      throw error;
    }
  }

  async getFormCustomerMapping(formId: number): Promise<string | null> {
    try {
      const result = await pool.query(
        'SELECT customer_id FROM form_customer_mappings WHERE form_id = $1',
        [formId]
      );
      return result.rows[0]?.customer_id || null;
    } catch (error) {
      console.error('Error getting form customer mapping:', error);
      throw error;
    }
  }

  // n8n workflow management
  async getN8nWorkflow(workflowId: string): Promise<N8nWorkflow | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM n8n_workflows WHERE workflow_id = $1 AND is_active = true',
        [workflowId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting n8n workflow:', error);
      throw error;
    }
  }

  async createN8nWorkflow(workflow: Omit<N8nWorkflow, 'id' | 'created_at' | 'updated_at'>): Promise<N8nWorkflow> {
    try {
      const result = await pool.query(
        `INSERT INTO n8n_workflows (workflow_name, workflow_id, webhook_url, description, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [workflow.workflow_name, workflow.workflow_id, workflow.webhook_url, workflow.description, workflow.is_active]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating n8n workflow:', error);
      throw error;
    }
  }

  async getAllN8nWorkflows(): Promise<N8nWorkflow[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM n8n_workflows WHERE is_active = true ORDER BY created_at DESC'
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting all n8n workflows:', error);
      throw error;
    }
  }
}

export const customerConfigService = new CustomerConfigService();