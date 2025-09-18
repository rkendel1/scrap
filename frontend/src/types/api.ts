export interface FormRecord {
  id: number;
  url: string;
  title: string;
  description: string;
  favicon: string;
  color_palette: string[];
  primary_colors: string[];
  color_usage: Record<string, number>;
  font_families: string[];
  headings: Array<{ tag: string; text: string; level: number }>;
  text_samples: string[];
  margins: string[];
  paddings: string[];
  spacing_scale: Array<{ value: number; unit: string }>;
  layout_structure: Record<string, any>;
  grid_system: Record<string, any>;
  breakpoints: string[];
  buttons: Array<{ text: string; type: string; classes: string }>;
  form_fields: Array<{ type: string; name: string; placeholder?: string }>;
  cards: Array<{ hasImage: boolean; hasTitle: boolean; hasDescription: boolean }>;
  navigation: Array<Record<string, any>>;
  images: Array<{ src: string; alt: string; dimensions: { width?: string; height?: string } }>;
  css_variables: Record<string, string>;
  raw_css: string;
  form_schema: Array<{ fields: Array<{ type: string; name: string; placeholder?: string; required?: boolean }> }>;
  logo_url: string;
  brand_colors: string[];
  icons: Array<{ type: string; classes: string }>;
  messaging: string[];
  preview_html: string;
  voice_tone: Record<string, any>;
  personality_traits: string[];
  audience_analysis: Record<string, any>;
  created_at: string;
  updated_at: string;
  extracted_at: string;
}

export interface ExtractRequest {
  url: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}