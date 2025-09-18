"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const database_1 = __importDefault(require("./database"));
class DatabaseService {
    async saveExtractedData(data) {
        const query = `
      INSERT INTO forms (
        url, title, description, favicon,
        color_palette, primary_colors, color_usage,
        font_families, headings, text_samples,
        margins, paddings, spacing_scale,
        layout_structure, grid_system, breakpoints,
        buttons, form_fields, cards, navigation, images,
        css_variables, raw_css, form_schema,
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
        $22, $23, $24,
        $25, $26, $27, $28,
        $29, $30, $31, $32,
        $33
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
            JSON.stringify(data.designTokens.formSchema),
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
            const result = await database_1.default.query(query, values);
            return result.rows[0];
        }
        catch (error) {
            console.error('Database save error:', error);
            throw new Error(`Failed to save extracted data: ${error}`);
        }
    }
    async getAllRecords() {
        const query = `
      SELECT * FROM forms 
      ORDER BY created_at DESC
    `;
        try {
            const result = await database_1.default.query(query);
            return result.rows;
        }
        catch (error) {
            console.error('Database fetch error:', error);
            throw new Error(`Failed to fetch records: ${error}`);
        }
    }
    async getRecordById(id) {
        const query = `
      SELECT * FROM forms 
      WHERE id = $1
    `;
        try {
            const result = await database_1.default.query(query, [id]);
            return result.rows[0] || null;
        }
        catch (error) {
            console.error('Database fetch error:', error);
            throw new Error(`Failed to fetch record: ${error}`);
        }
    }
    async deleteRecord(id) {
        const query = `
      DELETE FROM forms 
      WHERE id = $1
      RETURNING id
    `;
        try {
            const result = await database_1.default.query(query, [id]);
            return result.rows.length > 0;
        }
        catch (error) {
            console.error('Database delete error:', error);
            throw new Error(`Failed to delete record: ${error}`);
        }
    }
    async searchRecords(searchTerm) {
        const query = `
      SELECT * FROM forms 
      WHERE title ILIKE $1 OR url ILIKE $1 OR description ILIKE $1
      ORDER BY created_at DESC
    `;
        try {
            const result = await database_1.default.query(query, [`%${searchTerm}%`]);
            return result.rows;
        }
        catch (error) {
            console.error('Database search error:', error);
            throw new Error(`Failed to search records: ${error}`);
        }
    }
    async checkHealth() {
        try {
            await database_1.default.query('SELECT 1');
            return true;
        }
        catch (error) {
            console.error('Database health check failed:', error);
            return false;
        }
    }
}
exports.DatabaseService = DatabaseService;
//# sourceMappingURL=database-service.js.map