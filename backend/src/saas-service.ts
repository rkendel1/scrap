import pool from './database';
import { GeneratedForm } from './llm-service';

export interface SaaSForm {
  id: number;
  user_id?: number;
  guest_token_id?: number;
  url: string;
  form_name: string;
  form_description?: string;
  is_live: boolean;
  embed_code?: string;
  submissions_count: number;
  last_submission_at?: Date;
  created_at: Date;
  updated_at: Date;
  // Original design token fields
  title: string;
  description: string;
  favicon: string;
  // Form-specific fields
  generated_form: GeneratedForm;
}

export interface EmbedCode {
  id: number;
  form_id: number;
  code: string;
  domain?: string;
  is_active: boolean;
  view_count: number;
  submission_count: number;
  created_at: Date;
  last_accessed?: Date;
}

export interface FormSubmission {
  id: number;
  form_id: number;
  embed_code_id?: number;
  submission_data: any;
  submitted_from_url?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface Connector {
  id: number;
  name: string;
  type: string;
  is_premium: boolean;
  config_schema: any;
}

export class SaaSService {
  
  async createForm(
    userId: number | null,
    guestTokenId: number | null,
    url: string,
    formName: string,
    formDescription: string,
    generatedForm: GeneratedForm,
    extractedData: any
  ): Promise<SaaSForm> {
    const embedCode = this.generateEmbedCode();
    
    const query = `
      INSERT INTO forms (
        user_id, guest_token_id, url, form_name, form_description, 
        is_live, embed_code, title, description, favicon,
        color_palette, primary_colors, color_usage, font_families, 
        headings, text_samples, margins, paddings, spacing_scale,
        layout_structure, grid_system, breakpoints, buttons, 
        form_fields, cards, navigation, images, css_variables, 
        raw_css, form_schema, logo_url, brand_colors, icons, 
        messaging, preview_html, voice_tone, personality_traits, 
        audience_analysis, extracted_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25, $26, $27, $28,
        $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39
      )
      RETURNING *
    `;

    const values = [
      userId, guestTokenId, url, formName, formDescription,
      false, embedCode, extractedData.title, extractedData.description, extractedData.favicon,
      JSON.stringify(extractedData.designTokens.colorPalette),
      JSON.stringify(extractedData.designTokens.primaryColors),
      JSON.stringify(extractedData.designTokens.colorUsage),
      JSON.stringify(extractedData.designTokens.fontFamilies),
      JSON.stringify(extractedData.designTokens.headings),
      JSON.stringify(extractedData.designTokens.textSamples),
      JSON.stringify(extractedData.designTokens.margins),
      JSON.stringify(extractedData.designTokens.paddings),
      JSON.stringify(extractedData.designTokens.spacingScale),
      JSON.stringify(extractedData.designTokens.layoutStructure),
      JSON.stringify(extractedData.designTokens.gridSystem),
      JSON.stringify(extractedData.designTokens.breakpoints),
      JSON.stringify(extractedData.designTokens.buttons),
      JSON.stringify(generatedForm.fields), // Store generated form fields
      JSON.stringify(extractedData.designTokens.cards),
      JSON.stringify(extractedData.designTokens.navigation),
      JSON.stringify(extractedData.designTokens.images),
      JSON.stringify(extractedData.designTokens.cssVariables),
      extractedData.designTokens.rawCSS,
      JSON.stringify([generatedForm]), // Store generated form schema
      extractedData.designTokens.logoUrl,
      JSON.stringify(extractedData.designTokens.brandColors),
      JSON.stringify(extractedData.designTokens.icons),
      JSON.stringify(extractedData.designTokens.messaging),
      extractedData.designTokens.previewHTML,
      JSON.stringify(extractedData.voiceAnalysis),
      JSON.stringify(extractedData.voiceAnalysis.personalityTraits),
      JSON.stringify(extractedData.voiceAnalysis.audienceAnalysis),
      new Date().toISOString()
    ];

    const result = await pool.query(query, values);
    const formRecord = result.rows[0];

    // Create embed code record
    await this.createEmbedCode(formRecord.id, embedCode);

    return {
      ...formRecord,
      generated_form: generatedForm
    };
  }

  async getUserForms(userId: number): Promise<SaaSForm[]> {
    const query = `
      SELECT *, form_schema as generated_form_schema
      FROM forms 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows.map(row => ({
      ...row,
      generated_form: row.generated_form_schema?.[0] || null
    }));
  }

  async getFormById(formId: number, userId?: number): Promise<SaaSForm | null> {
    let query = `
      SELECT *, form_schema as generated_form_schema
      FROM forms 
      WHERE id = $1
    `;
    const params = [formId];

    if (userId) {
      query += ` AND user_id = $2`;
      params.push(userId);
    }

    const result = await pool.query(query, params);
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      ...row,
      generated_form: row.generated_form_schema?.[0] || null
    };
  }

  async toggleFormLive(formId: number, userId: number): Promise<boolean> {
    // Check user's subscription tier and form limits
    const user = await this.getUserById(userId);
    if (!user) return false;

    if (user.subscription_tier === 'free') {
      // Check if user already has a live form
      const liveFormCount = await this.getUserLiveFormCount(userId);
      if (liveFormCount >= 1) {
        throw new Error('Free tier users are limited to 1 live form. Upgrade to Pro for unlimited forms.');
      }
    }

    const query = `
      UPDATE forms 
      SET is_live = NOT is_live, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND user_id = $2
      RETURNING is_live
    `;
    
    const result = await pool.query(query, [formId, userId]);
    return result.rows[0]?.is_live || false;
  }

  async createEmbedCode(formId: number, code: string, domain?: string): Promise<EmbedCode> {
    const query = `
      INSERT INTO embed_codes (form_id, code, domain)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await pool.query(query, [formId, code, domain]);
    return result.rows[0];
  }

  async getEmbedCodes(formId: number): Promise<EmbedCode[]> {
    const query = `
      SELECT * FROM embed_codes 
      WHERE form_id = $1 
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [formId]);
    return result.rows;
  }

  async submitForm(
    embedCode: string, 
    submissionData: any, 
    metadata: {
      submittedFromUrl?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get embed code and form info
      const embedQuery = `
        SELECT ec.*, f.is_live, f.user_id, f.id as form_id
        FROM embed_codes ec
        JOIN forms f ON ec.form_id = f.id
        WHERE ec.code = $1 AND ec.is_active = true
      `;
      
      const embedResult = await client.query(embedQuery, [embedCode]);
      
      if (embedResult.rows.length === 0) {
        return { success: false, message: 'Invalid or inactive embed code' };
      }

      const embed = embedResult.rows[0];
      
      if (!embed.is_live) {
        return { success: false, message: 'Form is not currently live' };
      }

      // Create submission record
      const submissionQuery = `
        INSERT INTO form_submissions (
          form_id, embed_code_id, submission_data, 
          submitted_from_url, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;
      
      await client.query(submissionQuery, [
        embed.form_id,
        embed.id,
        JSON.stringify(submissionData),
        metadata.submittedFromUrl,
        metadata.ipAddress,
        metadata.userAgent
      ]);

      // Update counters
      await client.query(`
        UPDATE embed_codes 
        SET submission_count = submission_count + 1, last_accessed = CURRENT_TIMESTAMP 
        WHERE id = $1
      `, [embed.id]);

      await client.query(`
        UPDATE forms 
        SET submissions_count = submissions_count + 1, last_submission_at = CURRENT_TIMESTAMP 
        WHERE id = $1
      `, [embed.form_id]);

      await client.query('COMMIT');

      // TODO: Trigger connectors (email, Slack, etc.)
      await this.triggerConnectors(embed.form_id, submissionData);

      return { success: true, message: 'Form submitted successfully' };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Form submission error:', error);
      return { success: false, message: 'Failed to submit form' };
    } finally {
      client.release();
    }
  }

  async getAvailableConnectors(userId: number): Promise<Connector[]> {
    const user = await this.getUserById(userId);
    if (!user) return [];

    let query = `SELECT * FROM connectors WHERE is_premium = false`;
    
    if (user.subscription_tier === 'paid') {
      query = `SELECT * FROM connectors`; // Include premium connectors
    }

    query += ` ORDER BY name`;
    
    const result = await pool.query(query);
    return result.rows;
  }

  async connectFormToService(
    formId: number, 
    connectorId: number, 
    config: any, 
    userId: number
  ): Promise<boolean> {
    // Verify user owns the form
    const form = await this.getFormById(formId, userId);
    if (!form) return false;

    // Verify connector is available to user
    const connectors = await this.getAvailableConnectors(userId);
    const connector = connectors.find(c => c.id === connectorId);
    if (!connector) return false;

    const query = `
      INSERT INTO form_connectors (form_id, connector_id, config)
      VALUES ($1, $2, $3)
      ON CONFLICT (form_id, connector_id) 
      DO UPDATE SET config = $3, is_active = true
      RETURNING id
    `;
    
    const result = await pool.query(query, [formId, connectorId, JSON.stringify(config)]);
    return result.rows.length > 0;
  }

  async getFormAnalytics(formId: number, userId: number): Promise<any> {
    const form = await this.getFormById(formId, userId);
    if (!form) return null;

    const analyticsQuery = `
      SELECT 
        COUNT(*) as total_submissions,
        COUNT(DISTINCT DATE(created_at)) as active_days,
        AVG(EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (ORDER BY created_at)))) as avg_time_between_submissions
      FROM form_submissions 
      WHERE form_id = $1
    `;
    
    const embedAnalyticsQuery = `
      SELECT 
        ec.code, 
        ec.domain, 
        ec.view_count, 
        ec.submission_count,
        ROUND((ec.submission_count::float / NULLIF(ec.view_count, 0)) * 100, 2) as conversion_rate
      FROM embed_codes ec 
      WHERE ec.form_id = $1
    `;

    const [analyticsResult, embedResult] = await Promise.all([
      pool.query(analyticsQuery, [formId]),
      pool.query(embedAnalyticsQuery, [formId])
    ]);

    return {
      overview: analyticsResult.rows[0],
      embeds: embedResult.rows
    };
  }

  private async triggerConnectors(formId: number, submissionData: any): Promise<void> {
    // Get active connectors for this form
    const query = `
      SELECT fc.config, c.type, c.name
      FROM form_connectors fc
      JOIN connectors c ON fc.connector_id = c.id
      WHERE fc.form_id = $1 AND fc.is_active = true
    `;
    
    const result = await pool.query(query, [formId]);
    
    for (const connector of result.rows) {
      try {
        await this.executeConnector(connector.type, connector.config, submissionData);
      } catch (error) {
        console.error(`Connector ${connector.name} failed:`, error);
      }
    }
  }

  private async executeConnector(type: string, config: any, data: any): Promise<void> {
    // Basic connector implementations
    switch (type) {
      case 'email':
        // TODO: Implement email sending
        console.log('Email connector triggered:', { config, data });
        break;
      case 'google_sheets':
        // TODO: Implement Google Sheets integration
        console.log('Google Sheets connector triggered:', { config, data });
        break;
      case 'slack':
        // TODO: Implement Slack webhook
        console.log('Slack connector triggered:', { config, data });
        break;
      // Add more connectors as needed
    }
  }

  private async getUserById(userId: number): Promise<any> {
    const query = `SELECT * FROM users WHERE id = $1`;
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  private async getUserLiveFormCount(userId: number): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM forms WHERE user_id = $1 AND is_live = true`;
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  private generateEmbedCode(): string {
    return 'embed_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  async configureFormDestination(
    formId: number, 
    destinationType: string, 
    destinationConfig: any
  ): Promise<void> {
    try {
      // First, find the connector by type
      const connectorQuery = `SELECT id FROM connectors WHERE type = $1`;
      const connectorResult = await pool.query(connectorQuery, [destinationType]);
      
      if (connectorResult.rows.length === 0) {
        throw new Error(`Connector type ${destinationType} not found`);
      }
      
      const connectorId = connectorResult.rows[0].id;
      
      // Insert or update the form connector configuration
      const upsertQuery = `
        INSERT INTO form_connectors (form_id, connector_id, config, is_active)
        VALUES ($1, $2, $3, true)
        ON CONFLICT (form_id, connector_id) 
        DO UPDATE SET 
          config = EXCLUDED.config,
          is_active = EXCLUDED.is_active
      `;
      
      await pool.query(upsertQuery, [formId, connectorId, JSON.stringify(destinationConfig)]);
      
      console.log(`Configured ${destinationType} destination for form ${formId}`);
    } catch (error) {
      console.error('Error configuring form destination:', error);
      throw error;
    }
  }
}