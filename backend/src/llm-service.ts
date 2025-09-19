import OpenAI from 'openai';
import { VoiceAnalysis } from './extractor';

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
    maxWidth?: string;
  };
  // Removed formLayout
}

export class LLMService {
  private openai: OpenAI | null;
  private isEnabled: boolean;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    this.isEnabled = !!apiKey;
    
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
    } else {
      this.openai = null;
      console.warn('⚠️  OPENAI_API_KEY not configured - AI form generation disabled (development mode)');
    }
  }

  async generateFormFromWebsite(
    websiteData: {
      url: string;
      title: string;
      description: string;
      voiceAnalysis: VoiceAnalysis;
      designTokens: any;
      messaging: string[];
    },
    formPurpose: string
  ): Promise<GeneratedForm> {
    if (!this.isEnabled || !this.openai) {
      console.log('📝 OpenAI not available - returning mock form for development');
      return this.generateMockForm(websiteData, formPurpose);
    }

    const prompt = this.buildFormGenerationPrompt(websiteData, formPurpose);

    try {
      if (!this.openai) {
        throw new Error('OpenAI client is not initialized');
      }
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert form designer and UX specialist. Generate optimized forms that match the website's brand, tone, and design aesthetic."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const response = completion.choices?.[0]?.message?.content ?? null;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      return this.parseFormResponse(response, websiteData.designTokens);
    } catch (error) {
      console.error('LLM form generation error:', error);
      throw new Error('Failed to generate form with AI');
    }
  }

  async adaptFormToWebsite(
    formData: GeneratedForm,
    websiteData: {
      voiceAnalysis: VoiceAnalysis;
      designTokens: any;
      primaryColors: string[];
      fontFamilies: string[];
    }
  ): Promise<GeneratedForm> {
    const prompt = `
Adapt this form to better match the website's design and tone:

Current Form:
${JSON.stringify(formData, null, 2)}

Website Analysis:
- Voice/Tone: ${JSON.stringify(websiteData.voiceAnalysis)}
- Primary Colors: ${websiteData.primaryColors.join(', ')}
- Font Families: ${websiteData.fontFamilies.join(', ')}

Please modify the form to:
1. Match the website's tone and voice in all copy
2. Use the website's color palette and typography
3. Adapt field labels and messaging to match the brand voice
4. Ensure the form feels native to the website

Return the adapted form as JSON with the same structure.
`;

    try {
      if (!this.openai) {
        throw new Error('OpenAI client is not initialized');
      }
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are a brand-aware form designer. Adapt forms to match specific website aesthetics and brand voice perfectly."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 1500,
      });

      const response = completion.choices?.[0]?.message?.content ?? null;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      return this.parseFormResponse(response, websiteData.designTokens);
    } catch (error) {
      console.error('LLM form adaptation error:', error);
      return formData; // Return original form if adaptation fails
    }
  }

  private buildFormGenerationPrompt(websiteData: any, formPurpose: string): string {
    const primaryColor = websiteData.designTokens.primaryColors?.[0] || '#007bff';
    const fontFamily = websiteData.designTokens.fontFamilies?.[0] || 'system-ui';
    const backgroundColor = websiteData.designTokens.colorPalette?.find((color: string) => this.isLightColor(color)) || '#ffffff';

    return `
Generate a high-converting form for this website based on the following analysis:

Website URL: ${websiteData.url}
Website Title: ${websiteData.title}
Website Description: ${websiteData.description}

Form Purpose: ${formPurpose}

Voice & Tone Analysis:
${JSON.stringify(websiteData.voiceAnalysis, null, 2)}

Design Tokens:
- Primary Colors: ${websiteData.designTokens.primaryColors?.slice(0, 3).join(', ')}
- Font Families: ${websiteData.designTokens.fontFamilies?.slice(0, 3).join(', ')}
- Extracted Background Color (lightest available): ${backgroundColor}

Messaging Samples:
${websiteData.messaging.slice(0, 5).join('\n')}

Requirements:
1. Create a form with **3-5 fields** appropriate for "${formPurpose}"
2. Match the website's tone and personality in all copy
3. **Crucially, use the provided design tokens for the form's styling. Specifically, set 'primaryColor' to '${primaryColor}', 'backgroundColor' to '${backgroundColor}', 'fontFamily' to '${fontFamily}', and set 'maxWidth' to a reasonable value like '400px' or '75%' in the 'styling' object.**
4. Include validation rules where appropriate
5. Create compelling CTA text that matches the brand voice
6. Generate a personalized thank you message
7. **The form should be designed for inline embedding.**

Return a JSON object with this structure:
{
  "title": "Form title",
  "description": "Brief form description",
  "fields": [
    {
      "type": "email|text|phone|textarea|select|checkbox|radio",
      "name": "field_name",
      "label": "Field Label",
      "placeholder": "Placeholder text",
      "required": true|false,
      "options": ["option1", "option2"] // only for select/radio/checkbox,
      "validation": {
        "pattern": "regex pattern if needed",
        "min": minimum_length,
        "max": maximum_length
      }
    }
  ],
  "ctaText": "Submit button text",
  "thankYouMessage": "Thank you message",
  "styling": {
    "primaryColor": "hex color",
    "backgroundColor": "hex color", 
    "fontFamily": "font family name",
    "borderRadius": "border radius value",
    "buttonStyle": "button styling description",
    "maxWidth": "e.g., 500px, 75%"
  }
}
`;
  }

  private parseFormResponse(response: string, designTokens: any): GeneratedForm {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      // Ensure jsonMatch is not null and has at least one element
      if (!jsonMatch || jsonMatch.length === 0) {
        throw new Error('No valid JSON string found in response');
      }

      // Use non-null assertion here as we've checked for existence
      const jsonString: string = jsonMatch[0]!; 
      const parsed = JSON.parse(jsonString);
      
      // Validate and set defaults
      return {
        title: parsed.title || 'Contact Form',
        description: parsed.description || 'Please fill out this form',
        fields: this.validateFields(parsed.fields || []),
        ctaText: parsed.ctaText || 'Submit',
        thankYouMessage: parsed.thankYouMessage || 'Thank you for your submission!',
        styling: {
          primaryColor: parsed.styling?.primaryColor || designTokens.primaryColors?.[0] || '#007bff',
          backgroundColor: parsed.styling?.backgroundColor || designTokens.colorPalette?.find((color: string) => this.isLightColor(color)) || '#ffffff',
          fontFamily: parsed.styling?.fontFamily || designTokens.fontFamilies?.[0] || 'system-ui',
          borderRadius: parsed.styling?.borderRadius || '8px',
          buttonStyle: parsed.styling?.buttonStyle || 'solid',
          maxWidth: parsed.styling?.maxWidth || '400px' // Default to 400px if not provided
        },
        // Removed formLayout
      };
    } catch (error) {
      console.error('Error parsing form response:', error);
      
      // Return fallback form
      return {
        title: 'Contact Form',
        description: 'Get in touch with us',
        fields: [
          { type: 'text', name: 'name', label: 'Full Name', required: true },
          { type: 'email', name: 'email', label: 'Email Address', required: true },
          { type: 'textarea', name: 'message', label: 'Message', required: true }
        ],
        ctaText: 'Send Message',
        thankYouMessage: 'Thank you for your message! We\'ll get back to you soon.',
        styling: {
          primaryColor: designTokens.primaryColors?.[0] || '#007bff',
          backgroundColor: designTokens.colorPalette?.find((color: string) => this.isLightColor(color)) || '#ffffff',
          fontFamily: designTokens.fontFamilies?.[0] || 'system-ui',
          borderRadius: '8px',
          buttonStyle: 'solid',
          maxWidth: '400px' // Default to 400px for fallback
        },
        // Removed formLayout for fallback
      };
    }
  }

  private validateFields(fields: any[]): FormField[] {
    const validTypes = ['text', 'email', 'phone', 'textarea', 'select', 'checkbox', 'radio'];
    
    return fields.filter(field => 
      field.name && 
      field.label && 
      validTypes.includes(field.type)
    ).map(field => ({
      type: field.type,
      name: field.name,
      label: field.label,
      placeholder: field.placeholder,
      required: Boolean(field.required),
      options: field.options,
      validation: field.validation
    }));
  }

  async generateFormVariations(originalForm: GeneratedForm, count: number = 3): Promise<GeneratedForm[]> {
    if (!this.isEnabled || !this.openai) {
      console.log('📝 OpenAI not available - returning original form only');
      return [originalForm];
    }

    const prompt = `
Create ${count} variations of this form for A/B testing:

Original Form:
${JSON.stringify(originalForm, null, 2)}

Generate variations by:
1. Changing the headline and description tone
2. Modifying field labels and placeholders  
3. Adjusting CTA button text
4. Varying the thank you message
5. Keep the same fields but improve copy

Return an array of ${count} JSON objects with the same structure as the original.
`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are a conversion optimization expert. Create form variations that test different psychological approaches and copy strategies."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2500,
      });

      const response = completion.choices?.[0]?.message?.content ?? null;
      if (!response) {
        return [originalForm];
      }

      // Try to parse multiple variations
      const jsonMatches = response.match(/\{[\s\S]*?\}(?=\s*(?:\{|$))/g);
      
      if (jsonMatches) {
        const variations: GeneratedForm[] = []; 
        for (const match of jsonMatches.slice(0, count)) {
          try {
            const parsed = JSON.parse(match);
            variations.push(this.parseFormResponse(JSON.stringify(parsed), originalForm.styling));
          } catch (error) {
            console.warn('Failed to parse form variation:', error);
          }
        }
        return variations.length > 0 ? variations : [originalForm];
      }

      return [originalForm];
    } catch (error) {
      console.error('LLM variation generation error:', error);
      return [originalForm];
    }
  }

  private generateMockForm(websiteData: any, formPurpose: string): GeneratedForm {
    const purposeFields = {
      'contact': [
        { type: 'text' as const, name: 'name', label: 'Full Name', placeholder: 'Enter your name', required: true },
        { type: 'email' as const, name: 'email', label: 'Email Address', placeholder: 'your@email.com', required: true },
        { type: 'phone' as const, name: 'phone', label: 'Phone Number', placeholder: '(555) 123-4567', required: false },
        { type: 'textarea' as const, name: 'message', label: 'Message', placeholder: 'How can we help you?', required: true }
      ],
      'newsletter': [
        { type: 'text' as const, name: 'firstName', label: 'First Name', placeholder: 'Enter your first name', required: true },
        { type: 'email' as const, name: 'email', label: 'Email Address', placeholder: 'your@email.com', required: true }
      ],
      'quote': [
        { type: 'text' as const, name: 'name', label: 'Full Name', placeholder: 'Enter your name', required: true },
        { type: 'email' as const, name: 'email', label: 'Email Address', placeholder: 'your@email.com', required: true },
        { type: 'text' as const, name: 'company', label: 'Company Name', placeholder: 'Your company', required: false },
        { type: 'select' as const, name: 'service', label: 'Service Interest', required: true, options: ['Consulting', 'Development', 'Support', 'Training'] },
        { type: 'textarea' as const, name: 'requirements', label: 'Project Requirements', placeholder: 'Describe your project needs', required: true }
      ]
    };

    const fields = purposeFields[formPurpose as keyof typeof purposeFields] || purposeFields.contact;

    const primaryColor = websiteData.designTokens.primaryColors?.[0] || '#007bff';
    const fontFamily = websiteData.designTokens.fontFamilies?.[0] || 'system-ui, -apple-system, sans-serif';
    const backgroundColor = websiteData.designTokens.colorPalette?.find((color: string) => this.isLightColor(color)) || '#ffffff';

    return {
      title: `${formPurpose.charAt(0).toUpperCase() + formPurpose.slice(1)} Form`,
      description: `Get in touch with us through this ${formPurpose} form.`,
      fields,
      ctaText: formPurpose === 'newsletter' ? 'Subscribe' : 'Submit',
      thankYouMessage: `Thank you for your ${formPurpose} submission! We'll get back to you soon.`,
      styling: {
        primaryColor: primaryColor,
        backgroundColor: backgroundColor,
        fontFamily: fontFamily,
        borderRadius: '8px',
        buttonStyle: 'solid',
        maxWidth: '400px' // Default to 400px for mock
      },
      // Removed formLayout for mock
    };
  }

  // Helper to determine if a color is light (simplified for demo)
  private isLightColor = (color: string): boolean => {
    if (!color) return false;
    let r, g, b;

    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 3) { // #rgb
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      } else if (hex.length === 6) { // #rrggbb
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
      } else {
        return false;
      }
    } 
    // Handle rgb/rgba colors
    else if (color.startsWith('rgb')) {
      const parts = color.match(/\d+/g)?.map(Number);
      if (parts && parts.length >= 3) {
        [r, g, b] = parts;
      } else {
        return false;
      }
    }
    // Handle hsl/hsla colors
    else if (color.startsWith('hsl')) {
      // For simplicity, treat HSL as dark if lightness is low
      const lightnessMatch = color.match(/hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*(\d+)%\s*(?:,\s*\d*\.?\d+)?\)/);
      if (lightnessMatch && lightnessMatch[1]) {
        const lightness = parseInt(lightnessMatch[1]);
        return lightness > 70; // Arbitrary threshold for light HSL
      }
      return false;
    }
    else {
      return false; // Not a recognized color format
    }

    // Calculate luminance (simplified)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.7; // Threshold for "light"
  };
}