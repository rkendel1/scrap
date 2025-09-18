import { ExtractedData } from './extractor';
import { FormRecord } from './database-service';

// Mock database for testing without PostgreSQL
class MockDatabaseService {
  private records: FormRecord[] = [];
  private nextId = 1;

  async saveExtractedData(data: ExtractedData): Promise<FormRecord> {
    const record: FormRecord = {
      id: this.nextId++,
      url: data.url,
      title: data.title,
      description: data.description,
      favicon: data.favicon,
      color_palette: data.designTokens.colorPalette,
      primary_colors: data.designTokens.primaryColors,
      color_usage: data.designTokens.colorUsage,
      font_families: data.designTokens.fontFamilies,
      headings: data.designTokens.headings,
      text_samples: data.designTokens.textSamples,
      margins: data.designTokens.margins,
      paddings: data.designTokens.paddings,
      spacing_scale: data.designTokens.spacingScale,
      layout_structure: data.designTokens.layoutStructure,
      grid_system: data.designTokens.gridSystem,
      breakpoints: data.designTokens.breakpoints,
      buttons: data.designTokens.buttons,
      form_fields: data.designTokens.formFields,
      cards: data.designTokens.cards,
      navigation: data.designTokens.navigation,
      images: data.designTokens.images,
      css_variables: data.designTokens.cssVariables,
      raw_css: data.designTokens.rawCSS,
      form_schema: data.designTokens.formSchema,
      logo_url: data.designTokens.logoUrl,
      brand_colors: data.designTokens.brandColors,
      icons: data.designTokens.icons,
      messaging: data.designTokens.messaging,
      preview_html: data.designTokens.previewHTML,
      voice_tone: data.voiceAnalysis.tone,
      personality_traits: data.voiceAnalysis.personalityTraits,
      audience_analysis: data.voiceAnalysis.audienceAnalysis,
      created_at: new Date(),
      updated_at: new Date(),
      extracted_at: new Date(data.extractedAt)
    };

    this.records.push(record);
    return record;
  }

  async getAllRecords(): Promise<FormRecord[]> {
    return [...this.records].reverse(); // Most recent first
  }

  async getRecordById(id: number): Promise<FormRecord | null> {
    return this.records.find(r => r.id === id) || null;
  }

  async deleteRecord(id: number): Promise<boolean> {
    const index = this.records.findIndex(r => r.id === id);
    if (index !== -1) {
      this.records.splice(index, 1);
      return true;
    }
    return false;
  }

  async searchRecords(searchTerm: string): Promise<FormRecord[]> {
    const term = searchTerm.toLowerCase();
    return this.records.filter(record => 
      record.title.toLowerCase().includes(term) ||
      record.url.toLowerCase().includes(term) ||
      record.description.toLowerCase().includes(term)
    );
  }

  async checkHealth(): Promise<boolean> {
    return true; // Mock always healthy
  }
}

export { MockDatabaseService };