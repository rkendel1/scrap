import pool from './database';
import { ExtractedData } from './extractor';

export interface FormRecord {
  id: number;
  url: string;
  title: string;
  description: string;
  favicon: string;
  color_palette: any[];
  primary_colors: any[];
  color_usage: Record<string, any>;
  font_families: any[];
  headings: any[];
  text_samples: any[];
  margins: any[];
  paddings: any[];
  spacing_scale: any[];
  layout_structure: Record<string, any>;
  grid_system: Record<string, any>;
  breakpoints: any[];
  buttons: any[];
  form_fields: any[];
  cards: any[];
  navigation: any[];
  images: any[];
  css_variables: Record<string, any>;
  raw_css: string;
  -- REMOVED: form_schema: any[]; -- This column was dropped
  logo_url: string;
  brand_colors: any[];
  icons: any[];
  messaging: any[];
  preview_html: string;
  voice_tone: Record<string, any>;
  personality_traits: any[];
  audience_analysis: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  extracted_at: Date;
  live_version_id?: number; -- Added after migration 007
  draft_version_id?: number; -- Added after migration 007
}

export class DatabaseService {
  async saveExtractedData(data: ExtractedData): Promise<FormRecord> {
    const query = `
      INSERT INTO forms (
        url, title, description, favicon,
        color_palette, primary_colors, color_usage,
        font_families, headings, text_samples,
        margins, paddings, spacing_scale,
        layout_structure, grid_system, breakpoints,
        buttons, form_fields, cards, navigation, images,
        css_variables, raw_css, -- REMOVED: form_schema,
        logo_url, brand_colors, icons, messaging,
        preview_html, voice_tone, personality_traits, audience_analysis,
        extracted_at
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7,
        $8, $9, $10,
        $11, $12, $13,
        $14, $15, $16,
        $17, $18, $19, $20, $21,
        $22, $23, -- REMOVED: $24,
        $24, $25, $26, $27,
        $28, $29, $30, $31,
        $32
      ) RETURNING *`;

    const values = [
      data.url,
      data.title,
      data.description,
      data.favicon,
      JSON.stringify(data.designTokens.colorPalette),
      JSON.stringify(data.designTokens.primaryColors),
      JSON.stringify(data.designTokens.colorUsage),
      JSON.stringify(data.designTokens.fontFamilies),
      JSON.stringify(data.designTokens.headings),
      JSON.stringify(data.designTokens.textSamples),
      JSON.stringify(data.designTokens.margins),
      JSON.stringify(data.designTokens.paddings),
      JSON.stringify(data.designTokens.spacingScale),
      JSON.stringify(data.designTokens.layoutStructure),
      JSON.stringify(data.designTokens.gridSystem),
      JSON.stringify(data.designTokens.breakpoints),
      JSON.stringify(data.designTokens.buttons),
      JSON.stringify(data.designTokens.formFields),
      JSON.stringify(data.designTokens.cards),
      JSON.stringify(data.designTokens.navigation),
      JSON.stringify(data.designTokens.images),
      JSON.stringify(data.designTokens.cssVariables),
      data.designTokens.rawCSS,
      -- REMOVED: JSON.stringify(data.designTokens.formSchema),
      data.designTokens.logoUrl,
      JSON.stringify(data.designTokens.brandColors),
      JSON.stringify(data.designTokens.icons),
      JSON.stringify(data.designTokens.messaging),
      data.designTokens.previewHTML,
      JSON.stringify(data.voiceAnalysis.tone),
      JSON.stringify(data.voiceAnalysis.personalityTraits),
      JSON.stringify(data.voiceAnalysis.audienceAnalysis),
      data.extractedAt
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Database save error:', error);
      throw new Error(`Failed to save extracted data: ${error}`);
    }
  }

  async getAllRecords(): Promise<FormRecord[]> {
    const query = `
      SELECT * FROM forms 
      ORDER BY created_at DESC
    `;

    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Database fetch error:', error);
      throw new Error(`Failed to fetch records: ${error}`);
    }
  }

  async getRecordById(id: number): Promise<FormRecord | null> {
    const query = `
      SELECT * FROM forms 
      WHERE id = $1
    `;

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Database fetch error:', error);
      throw new Error(`Failed to fetch record: ${error}`);
    }
  }

  async deleteRecord(id: number): Promise<boolean> {
    const query = `
      DELETE FROM forms 
      WHERE id = $1
      RETURNING id
    `;

    try {
      const result = await pool.query(query, [id]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Database delete error:', error);
      throw new Error(`Failed to delete record: ${error}`);
    }
  }

  async searchRecords(searchTerm: string): Promise<FormRecord[]> {
    const query = `
      SELECT * FROM forms 
      WHERE title ILIKE $1 OR url ILIKE $1 OR description ILIKE $1
      ORDER BY created_at DESC
    `;

    try {
      const result = await pool.query(query, [`%${searchTerm}%`]);
      return result.rows;
    } catch (error) {
      console.error('Database search error:', error);
      throw new Error(`Failed to search records: ${error}`);
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}