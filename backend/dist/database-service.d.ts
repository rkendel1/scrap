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
    form_schema: any[];
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
}
export declare class DatabaseService {
    saveExtractedData(data: ExtractedData): Promise<FormRecord>;
    getAllRecords(): Promise<FormRecord[]>;
    getRecordById(id: number): Promise<FormRecord | null>;
    deleteRecord(id: number): Promise<boolean>;
    searchRecords(searchTerm: string): Promise<FormRecord[]>;
    checkHealth(): Promise<boolean>;
}
//# sourceMappingURL=database-service.d.ts.map