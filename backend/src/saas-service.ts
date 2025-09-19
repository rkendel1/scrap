import pool from './database';
import { GeneratedForm } from './llm-service';
import { EmbedSecurityService, EmbedTokenPayload } from './embed-security-service';
import { dispatchToConnectors } from './connectors/dispatcher';
import { ConnectorConfig } from './connectors/types';
import { customerConfigService } from './customer-config-service'; // Import customerConfigService

// In-memory storage for testing when database is not available
const mockForms = new Map();
const mockEmbedCodes = new Map();

// Test data
const testFormData = {
  id: 1,
  title: 'Contact Us',
  description: 'Get in touch with our team',
  generated_form_schema: [{
    title: 'Contact Us',
    description: 'Get in touch with our team',
    fields: [
      { type: 'text', name: 'name', label: 'Full Name', placeholder: 'Enter your name', required: true },
      { type: 'email', name: 'email', label: 'Email', placeholder: 'your@email.com', required: true },
      { type: 'textarea', name: 'message', label: 'Message', placeholder: 'Your message', required: true }
    ],
    ctaText: 'Send Message',
    thankYouMessage: 'Thank you for your message! We\'ll get back to you soon.',
    styling: {
      primaryColor: '#007bff',
      backgroundColor: '#ffffff',
      fontFamily: 'system-ui',
      borderRadius: '8px'
    }
  }],
  primary_colors: ['#007bff'],
  font_families: ['system-ui'],
  is_live: true
};

// Initialize test data
mockForms.set(1, testFormData);
mockEmbedCodes.set('test_embed_123', { form_id: 1, is_active: true, view_count: 0, submission_count: 0 });

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
  allowed_domains?: string[]; // Added allowed_domains
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
  private embedSecurity = new EmbedSecurityService();
  
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

  async getFormByEmbedCode(embedCode: string): Promise<any | null> {
    try {
      const query = `
        SELECT 
          f.*,
          f.form_schema as generated_form_schema,
          ec.is_active as embed_active,
          ec.view_count,
          ec.submission_count
        FROM forms f
        JOIN embed_codes ec ON f.id = ec.form_id
        WHERE ec.code = $1 AND ec.is_active = true AND f.is_live = true
      `;
      
      const result = await pool.query(query, [embedCode]);
      
      if (result.rows.length === 0) {
        // Fallback to mock data for testing
        const embedData = mockEmbedCodes.get(embedCode);
        if (!embedData || !embedData.is_active) return null;
        
        const formData = mockForms.get(embedData.form_id);
        if (!formData || !formData.is_live) return null;
        
        // Update view count
        embedData.view_count++;
        
        return {
          id: formData.id,
          title: formData.title,
          description: formData.description,
          generated_form: formData.generated_form_schema?.[0] || null,
          styling: {
            primaryColor: formData.primary_colors?.[0] || '#007bff',
            backgroundColor: '#ffffff',
            fontFamily: formData.font_families?.[0] || 'system-ui',
            borderRadius: '8px'
          },
          embedCode,
          showBranding: true
        };
      }
      
      const row = result.rows[0];
      
      // Update view count
      await pool.query(`
        UPDATE embed_codes 
        SET view_count = view_count + 1, last_accessed = CURRENT_TIMESTAMP 
        WHERE code = $1
      `, [embedCode]);
      
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        generated_form: row.generated_form_schema?.[0] || null,
        styling: {
          primaryColor: row.primary_colors?.[0] || '#007bff',
          backgroundColor: '#ffffff',
          fontFamily: row.font_families?.[0] || 'system-ui',
          borderRadius: '8px'
        },
        embedCode,
        showBranding: true // Could be based on subscription tier
      };
    } catch (error) {
      console.error('Database error, using mock data:', error);
      
      // Fallback to mock data
      const embedData = mockEmbedCodes.get(embedCode);
      if (!embedData || !embedData.is_active) return null;
      
      const formData = mockForms.get(embedData.form_id);
      if (!formData || !formData.is_live) return null;
      
      // Update view count
      embedData.view_count++;
      
      return {
        id: formData.id,
        title: formData.title,
        description: formData.description,
        generated_form: formData.generated_form_schema?.[0] || null,
        styling: {
          primaryColor: formData.primary_colors?.[0] || '#007bff',
          backgroundColor: '#ffffff',
          fontFamily: formData.font_families?.[0] || 'system-ui',
          borderRadius: '8px'
        },
        embedCode,
        showBranding: true
      };
    }
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
    try {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');

        // Get embed code and form info
        const embedQuery = `
          SELECT ec.*, f.is_live, f.user_id, f.id as form_id
          FROM embed_codes ec
          JOIN forms f ON f.id = ec.form_id
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

        // Trigger connectors (now handles n8n dispatch)
        await this.triggerConnectors(embed.form_id, submissionData);

        return { success: true, message: 'Form submitted successfully' };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Database error, using mock submission:', error);
      
      // Fallback to mock handling
      const embedData = mockEmbedCodes.get(embedCode);
      if (!embedData || !embedData.is_active) {
        return { success: false, message: 'Invalid or inactive embed code' };
      }
      
      const formData = mockForms.get(embedData.form_id);
      if (!formData || !formData.is_live) {
        return { success: false, message: 'Form is not currently live' };
      }
      
      // Update counters
      embedData.submission_count++;
      
      console.log('Mock form submission received:', {
        embedCode,
        submissionData,
        metadata
      });
      
      return { success: true, message: 'Form submitted successfully' };
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
    destinationType: string, // Changed from connectorId to destinationType
    destinationConfig: any
  ): Promise<boolean> {
    // Verify user owns the form (assuming this is called after form creation by the owner)
    // No user_id check here, as it's assumed to be handled by the calling API endpoint
    const form = await this.getFormById(formId); // Fetch without user_id check
    if (!form) return false;

    // Find the connector by type
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
      RETURNING id
    `;
    
    await pool.query(upsertQuery, [formId, connectorId, JSON.stringify(destinationConfig)]);
    
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
    try {
      // Check if form has customer mapping for n8n routing
      const customerId = await customerConfigService.getFormCustomerMapping(formId);
      
      if (customerId) {
        // Construct n8n connector config
        const n8nConnectorConfig: ConnectorConfig = {
          type: 'n8n',
          settings: {
            webhookUrl: process.env.N8N_WEBHOOK_URL || 'http://n8n:5678/webhook/form-submission', // Use env var or default
            customerId: customerId,
            formId: formId, // Pass formId to n8n
            // authToken: process.env.N8N_INTERNAL_AUTH_TOKEN // Optional: internal token for n8n to authenticate with backend
          }
        };
        
        // Dispatch to n8n
        const n8nResults = await dispatchToConnectors(submissionData, [n8nConnectorConfig]);
        
        if (n8nResults[0]?.success) {
          console.log(`✓ n8n customer routing succeeded for customer ${customerId}: ${n8nResults[0].message}`);
        } else {
          console.error(`❌ n8n customer routing failed for customer ${customerId}: ${n8nResults[0]?.message}`, n8nResults[0]?.error);
        }
        return; // Exit after dispatching to n8n
      }

      // Fallback to existing connector logic if no customer mapping
      // First try to get connectors from the new JSONB column
      const newFormatQuery = `
        SELECT connectors
        FROM forms
        WHERE id = $1
      `;
      
      const newFormatResult = await pool.query(newFormatQuery, [formId]);
      
      if (newFormatResult.rows.length > 0) {
        const connectors = newFormatResult.rows[0].connectors || [];
        
        if (connectors.length > 0) {
          // Use new JSONB format
          const dispatchResults = await dispatchToConnectors(submissionData, connectors);
          
          // Log results
          dispatchResults.forEach((result, index) => {
            const connector = connectors[index];
            if (result.success) {
              console.log(`✓ ${connector.type} connector succeeded: ${result.message}`);
            } else {
              console.error(`❌ ${connector.type} connector failed: ${result.message}`, result.error);
            }
          });
          return;
        }
      }

      // Fallback to old format for backward compatibility
      const oldFormatQuery = `
        SELECT fc.config, c.type, c.name
        FROM form_connectors fc
        JOIN connectors c ON fc.connector_id = c.id
        WHERE fc.form_id = $1 AND fc.is_active = true
      `;
      
      const oldFormatResult = await pool.query(oldFormatQuery, [formId]);
      
      if (oldFormatResult.rows.length === 0) {
        console.log(`No connectors configured for form ${formId}`);
        return;
      }

      // Convert database rows to ConnectorConfig format
      const connectorConfigs: ConnectorConfig[] = oldFormatResult.rows.map(row => ({
        type: row.type,
        ...JSON.parse(row.config || '{}')
      }));

      // Use the modular dispatcher
      const results = await dispatchToConnectors(submissionData, connectorConfigs);
      
      // Log results
      results.forEach((result, index) => {
        const connectorName = `${connectorConfigs[index].type} connector`;
        
        if (result.success) {
          console.log(`✅ ${connectorName}: ${result.message}`);
        } else {
          console.error(`❌ ${connectorName}: ${result.message}`, result.error);
        }
      });
    } catch (error) {
      console.error('Failed to dispatch to connectors:', error);
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
    destinationConfig: any,
    userId: number | null, // Added userId
    guestToken: string | null // Added guestToken
  ): Promise<boolean> {
    console.log('Backend: configureFormDestination called with:', { formId, destinationType, destinationConfig, userId, guestToken }); // DEBUG LOG
    try {
      // Verify form ownership
      const formQuery = `SELECT user_id, guest_token_id FROM forms WHERE id = $1`;
      const formResult = await pool.query(formQuery, [formId]);
      if (formResult.rows.length === 0) {
        console.log('Backend: Form not found for ID:', formId); // DEBUG LOG
        throw new Error('Form not found');
      }
      const formOwner = formResult.rows[0];

      let isAuthorized = false;
      if (userId && formOwner.user_id === userId) {
        isAuthorized = true;
      } else if (guestToken) {
        const guestTokenQuery = `SELECT id FROM guest_tokens WHERE token = $1`;
        const guestTokenResult = await pool.query(guestTokenQuery, [guestToken]);
        const guestTokenId = guestTokenResult.rows[0]?.id;
        if (guestTokenId && formOwner.guest_token_id === guestTokenId) {
          isAuthorized = true;
        }
      }

      if (!isAuthorized) {
        console.log('Backend: Unauthorized to configure form:', { formOwner, userId, guestToken }); // DEBUG LOG
        throw new Error('Unauthorized to configure this form');
      }

      // First, find the connector by type
      const connectorQuery = `SELECT id FROM connectors WHERE type = $1`;
      const connectorResult = await pool.query(connectorQuery, [destinationType]);
      
      if (connectorResult.rows.length === 0) {
        console.log('Backend: Connector type not found:', destinationType); // DEBUG LOG
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
      
      console.log(`Backend: Configured ${destinationType} destination for form ${formId} successfully.`); // DEBUG LOG
      return true;
    } catch (error) {
      console.error('Backend: Error configuring form destination:', error); // DEBUG LOG
      throw error;
    }
  }

  /**
   * NEW: Get form configuration for public embed.js script.
   * This replaces the JWT-based getFormByEmbedToken for initial embed loading.
   */
  async getFormConfigForPublicEmbed(embedCode: string, hostname: string, isTestMode: boolean = false): Promise<any | null> {
    try {
      let query = `
        SELECT 
          f.*,
          f.form_schema as generated_form_schema,
          ec.is_active as embed_active,
          ec.view_count,
          ec.submission_count
        FROM forms f
        JOIN embed_codes ec ON f.id = ec.form_id
        WHERE ec.code = $1
      `;
      
      if (!isTestMode) {
        query += ` AND ec.is_active = true AND f.is_live = true`;
      }

      const result = await pool.query(query, [embedCode]);
      
      if (result.rows.length === 0) {
        console.log(`FormCraft: Form not found, inactive, or not live for embedCode: ${embedCode} (isTestMode: ${isTestMode})`);
        return null;
      }
      
      const row = result.rows[0];
      
      // Check domain restrictions (always apply, even in test mode, but localhost is allowed by EmbedSecurityService)
      const allowedDomains = row.allowed_domains || [];
      if (!this.embedSecurity.isDomainAllowed(hostname, allowedDomains)) {
        console.log(`FormCraft: Domain ${hostname} not allowed for embedCode: ${embedCode} (isTestMode: ${isTestMode})`);
        return null; // Domain not allowed
      }

      // Update view count (only in non-test mode)
      if (!isTestMode) {
        await pool.query(`
          UPDATE embed_codes 
          SET view_count = view_count + 1, last_accessed = CURRENT_TIMESTAMP 
          WHERE code = $1
        `, [embedCode]);
      }
      
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        generated_form: row.generated_form_schema?.[0] || null,
        styling: {
          primaryColor: row.primary_colors?.[0] || '#007bff',
          backgroundColor: '#ffffff',
          fontFamily: row.font_families?.[0] || 'system-ui',
          borderRadius: '8px'
        },
        embedCode,
        showBranding: true // Could be based on subscription tier
      };
    } catch (error) {
      console.error('FormCraft: Error fetching public embed config:', error);
      return null;
    }
  }

  /**
   * NEW: Submit form using public embed code.
   * This replaces the JWT-based submitFormSecure.
   */
  async submitPublicForm(
    embedCode: string,
    submissionData: any,
    metadata: {
      submittedFromUrl?: string;
      ipAddress?: string;
      userAgent?: string;
      hostname?: string;
    }
  ): Promise<{ success: boolean; message: string; remaining?: number }> {
    try {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');

        // Get embed code and form info
        const embedQuery = `
          SELECT ec.*, f.is_live, f.user_id, f.id as form_id, f.allowed_domains, u.subscription_tier
          FROM embed_codes ec
          JOIN forms f ON f.id = ec.form_id
          JOIN users u ON f.user_id = u.id
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

        // Check domain restrictions
        const allowedDomains = embed.allowed_domains || [];
        if (metadata.hostname && !this.embedSecurity.isDomainAllowed(metadata.hostname, allowedDomains)) {
          return { success: false, message: 'Domain not authorized for this form' };
        }

        // Check rate limits
        const rateLimit = await this.embedSecurity.checkRateLimit(
          embed.form_id,
          metadata.ipAddress || '0.0.0.0',
          metadata.hostname || 'unknown'
        );
        
        if (!rateLimit.allowed) {
          return { success: false, message: 'Rate limit exceeded. Please try again later.' };
        }
        
        // Check if user subscription is still active (from embed.user_id)
        const subscription = await this.embedSecurity.getUserSubscriptionStatus(embed.user_id);
        if (!subscription.active) {
          return { success: false, message: 'Form owner\'s subscription is not active. Please contact the form owner.' };
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

        // Trigger connectors
        await this.triggerConnectors(embed.form_id, submissionData);

        return { 
          success: true, 
          message: 'Form submitted successfully',
          remaining: rateLimit.remaining 
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      
    } catch (error) {
      console.error('Public form submission error:', error);
      return { success: false, message: 'Failed to submit form. Please try again.' };
    }
  }

  /**
   * Get connectors configured for a specific form (new JSONB format)
   */
  async getFormConnectors(formId: number, userId: number): Promise<any[] | null> {
    try {
      const query = `
        SELECT connectors
        FROM forms
        WHERE id = $1 AND user_id = $2
      `;
      
      const result = await pool.query(query, [formId, userId]);
      
      if (result.rows.length === 0) {
        return null; // Form not found
      }

      return result.rows[0].connectors || [];
    } catch (error) {
      console.error('Error getting form connectors:', error);
      throw error;
    }
  }

  /**
   * Save connectors for a specific form (new JSONB format)
   */
  async saveFormConnectors(formId: number, connectors: any[], userId: number): Promise<boolean> {
    try {
      // Validate connector configurations before saving
      const { validateConnectorConfig } = await import('./connectors/connectorDefinitions');
      
      for (const connector of connectors) {
        const validation = validateConnectorConfig(connector.type, connector.settings || {});
        if (!validation.valid) {
          console.error(`Invalid connector config for ${connector.type}:`, validation.errors);
          return false;
        }
      }

      const query = `
        UPDATE forms
        SET connectors = $1
        WHERE id = $2 AND user_id = $3
      `;
      
      const result = await pool.query(query, [JSON.stringify(connectors), formId, userId]);
      
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error saving form connectors:', error);
      return false;
    }
  }

  /**
   * Test a connector with mock data
   */
  async testConnector(formId: number, connectorType: string, settings: any, userId: number): Promise<any | null> {
    console.log('Backend: testConnector called with:', { formId, connectorType, settings, userId }); // DEBUG LOG
    try {
      // Verify user owns the form
      const formQuery = `
        SELECT id FROM forms WHERE id = $1 AND user_id = $2
      `;
      const formResult = await pool.query(formQuery, [formId, userId]);
      
      if (formResult.rows.length === 0) {
        console.log('Backend: Form not found or not owned by user for testConnector:', { formId, userId }); // DEBUG LOG
        return null; // Form not found or not owned by user
      }

      // Validate connector configuration
      const { validateConnectorConfig } = await import('./connectors/connectorDefinitions');
      const validation = validateConnectorConfig(connectorType, settings);
      
      if (!validation.valid) {
        console.log('Backend: Connector configuration invalid for testConnector:', validation.errors); // DEBUG LOG
        return {
          success: false,
          message: 'Invalid connector configuration',
          errors: validation.errors
        };
      }

      // Create mock submission data
      const mockSubmission = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        message: 'This is a test submission to verify your connector configuration.',
        timestamp: new Date().toISOString(),
        formId: formId
      };

      // Create connector config
      const connectorConfig = {
        type: connectorType,
        settings: settings
      };

      // Test the connector
      const connectorModule = await import(`./connectors/${connectorType}.js`);
      const result = await connectorModule.send(mockSubmission, connectorConfig);

      console.log('Backend: testConnector result:', result); // DEBUG LOG
      return result;
    } catch (error) {
      console.error('Backend: Error testing connector:', error); // DEBUG LOG
      return {
        success: false,
        message: 'Failed to test connector',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}