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

// New SaaS-related interfaces
export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  subscription_tier: 'free' | 'paid';
  subscription_status: 'active' | 'inactive' | 'cancelled';
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface FormField {
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'radio';
  name: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select, radio, checkbox
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
  };
}

export interface GeneratedForm {
  title: string;
  description: string;
  fields: FormField[];
  ctaText: string;
  thankYouMessage: string;
  styling: {
    primaryColor: string;
    backgroundColor: string;
    fontFamily: string;
    borderRadius: string;
    buttonStyle: string;
  };
}

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
  last_submission_at?: string;
  created_at: string;
  updated_at: string;
  // Original design token fields
  title: string;
  description: string;
  favicon: string;
  // Form-specific fields
  generated_form: GeneratedForm;
}

// Interface for the conversational form builder's internal state
export interface FormData {
  url: string;
  purpose: string;
  destinationType?: 'email' | 'google_sheets' | 'slack' | 'webhook';
  destinationConfig?: any;
}

export interface ExtractedDesignTokensData {
  id: number;
  url: string;
  designTokens: {
    colorPalette: string[];
    primaryColors: string[];
    fontFamilies: string[];
    messaging: string[];
  };
  voiceAnalysis: Record<string, any>;
}

export interface Connector {
  id: number;
  name: string;
  type: string;
  is_premium: boolean;
  config_schema: any;
}

export interface ExtractRequest {
  url: string;
}

export interface FormGenerationRequest {
  extractedRecordId: number; // Changed from url to extractedRecordId
  formPurpose: string;
  formName?: string;
  formDescription?: string;
  guestToken?: string;
}

export interface AuthRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  guestToken?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
  upgradeRequired?: boolean;
}