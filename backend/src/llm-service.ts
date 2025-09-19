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
    maxWidth?: string;
    textColor?: string; // New: General text color for the form
    buttonTextColor?: string; // New: Text color for the CTA button
    buttonBackgroundColor?: string; // New: Background color for the CTA button
    buttonBorder?: string; // New: Border for the CTA button
  };
}

// Enhanced interfaces for structured flow
export interface FlowState {
  step: FormFlowStep;
  data: {
    websiteUrl?: string;
    extractedDesignTokens?: any;
    selectedFormType?: string;
    generatedForm?: GeneratedForm;
    embedCode?: string;
    embedExpiration?: Date;
    deliveryConfig?: DeliveryConfiguration;
    isAuthenticated?: boolean;
    userRole?: 'guest' | 'free' | 'paid';
  };
  guidance: string;
  nextActions: string[];
  validationErrors?: string[];
}

export type FormFlowStep = 
  | 'input_website'
  | 'extracting_design'
  | 'select_form_type'
  | 'generating_form'
  | 'preview_form'
  | 'configure_styling'
  | 'configure_delivery'
  | 'publish_form'
  | 'live_form'
  | 'expired_form';

export interface DeliveryConfiguration {
  type: 'email' | 'webhook' | 'google_sheets' | 'zapier';
  settings: {
    email?: string;
    webhookUrl?: string;
    spreadsheetId?: string;
    zapierHookUrl?: string;
  };
}

export interface UserGuidance {
  message: string;
  actions: string[];
  warnings?: string[];
  tips?: string[];
}

export interface FormTypeOption {
  id: string;
  name: string;
  description: string;
  suggestedFields: string[];
  useCases: string[];
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

  // ====== STRUCTURED FLOW GUIDANCE METHODS ======

  /**
   * Initialize the form creation flow and provide guidance for the first step
   */
  initializeFormFlow(): FlowState {
    return {
      step: 'input_website',
      data: {},
      guidance: "Welcome to FormCraft AI! Let's create a beautiful form that matches your website's design. Start by entering your website URL below.",
      nextActions: [
        "Enter your website URL (e.g., https://example.com)",
        "We'll extract design tokens and analyze your brand"
      ]
    };
  }

  /**
   * Process website URL input and guide user through design extraction
   */
  processWebsiteInput(url: string): FlowState {
    try {
      new URL(url); // Validate URL format
      return {
        step: 'extracting_design',
        data: { websiteUrl: url },
        guidance: `Great! We're analyzing ${url} to extract design tokens, colors, fonts, and brand voice. This usually takes 10-30 seconds.`,
        nextActions: [
          "Extracting color palette and typography",
          "Analyzing brand voice and messaging",
          "Preparing form type recommendations"
        ]
      };
    } catch (error) {
      return {
        step: 'input_website',
        data: {},
        guidance: "Please provide a valid website URL to get started.",
        nextActions: ["Enter a valid URL starting with http:// or https://"],
        validationErrors: ["Invalid URL format. Please include http:// or https://"]
      };
    }
  }

  /**
   * After design extraction, guide user to select form type
   */
  processDesignExtraction(extractedData: any): FlowState {
    const formTypes = this.getFormTypeOptions(extractedData);
    
    return {
      step: 'select_form_type',
      data: { 
        extractedDesignTokens: extractedData,
        websiteUrl: extractedData.url 
      },
      guidance: `Perfect! We've analyzed your website and extracted ${extractedData.designTokens?.colorPalette?.length || 0} colors, ${extractedData.designTokens?.fontFamilies?.length || 0} fonts, and your brand voice. Now, what type of form would you like to create?`,
      nextActions: formTypes.map(type => `${type.name}: ${type.description}`)
    };
  }

  /**
   * Get available form type options based on website analysis
   */
  getFormTypeOptions(extractedData?: any): FormTypeOption[] {
    const baseTypes: FormTypeOption[] = [
      {
        id: 'contact',
        name: 'Contact Form',
        description: 'Let visitors get in touch with you',
        suggestedFields: ['name', 'email', 'message'],
        useCases: ['Customer inquiries', 'Support requests', 'General contact']
      },
      {
        id: 'newsletter',
        name: 'Newsletter Signup',
        description: 'Build your email list',
        suggestedFields: ['email', 'firstName'],
        useCases: ['Email marketing', 'Updates', 'Newsletters']
      },
      {
        id: 'feedback',
        name: 'Feedback Form',
        description: 'Collect user feedback and reviews',
        suggestedFields: ['name', 'email', 'rating', 'feedback'],
        useCases: ['Product feedback', 'Service reviews', 'Suggestions']
      },
      {
        id: 'quote',
        name: 'Quote Request',
        description: 'Generate leads for your services',
        suggestedFields: ['name', 'email', 'company', 'projectDetails'],
        useCases: ['Service inquiries', 'Project requests', 'Consultations']
      },
      {
        id: 'signup',
        name: 'User Registration',
        description: 'Sign up new users for your platform',
        suggestedFields: ['name', 'email', 'password', 'company'],
        useCases: ['User onboarding', 'Account creation', 'Platform access']
      }
    ];

    // Could enhance with AI-based recommendations based on website content
    return baseTypes;
  }

  /**
   * Process form type selection and start form generation
   */
  processFormTypeSelection(formType: string, extractedData: any): FlowState {
    const selectedType = this.getFormTypeOptions().find(type => type.id === formType);
    
    if (!selectedType) {
      return {
        step: 'select_form_type',
        data: { extractedDesignTokens: extractedData },
        guidance: "Please select a valid form type from the options provided.",
        nextActions: this.getFormTypeOptions().map(type => `${type.name}: ${type.description}`),
        validationErrors: ["Invalid form type selected"]
      };
    }

    return {
      step: 'generating_form',
      data: { 
        extractedDesignTokens: extractedData,
        selectedFormType: formType 
      },
      guidance: `Excellent choice! We're now generating a ${selectedType.name} that matches your website's design. The AI is creating custom copy, styling, and field layout.`,
      nextActions: [
        "Generating form fields and labels",
        "Applying your brand colors and fonts",
        "Creating personalized copy that matches your voice"
      ]
    };
  }

  /**
   * After form generation, provide preview and configuration options
   */
  processFormGeneration(generatedForm: GeneratedForm, isAuthenticated: boolean = false, userRole: 'guest' | 'free' | 'paid' = 'guest'): FlowState {
    const embedExpiration = isAuthenticated ? undefined : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours for guests
    
    return {
      step: 'preview_form',
      data: { 
        generatedForm,
        isAuthenticated,
        userRole,
        embedExpiration
      },
      guidance: `Your form is ready! Preview it below and test it out. ${!isAuthenticated ? "As a guest, your embed code will expire in 24 hours. Sign up for a permanent solution." : ""}`,
      nextActions: [
        "Preview and test your form",
        "Make styling adjustments (optional)",
        "Configure where form submissions should be sent",
        ...(isAuthenticated ? [] : ["Sign up for permanent embed codes"])
      ]
    };
  }

  /**
   * Guide user through styling configuration
   */
  processStylingConfiguration(currentForm: GeneratedForm, userChanges: string): FlowState {
    return {
      step: 'configure_styling',
      data: { generatedForm: currentForm },
      guidance: "Perfect! You can now fine-tune the form's appearance. Describe what you'd like to change, and our AI will adjust the styling while maintaining your brand consistency.",
      nextActions: [
        "Describe styling changes (e.g., 'make the button larger', 'use a darker background')",
        "AI will maintain brand consistency automatically",
        "Continue to delivery configuration when satisfied"
      ]
    };
  }

  /**
   * Guide user through delivery configuration
   */
  processDeliveryConfiguration(): FlowState {
    return {
      step: 'configure_delivery',
      data: {},
      guidance: "Now let's set up where form submissions should be sent. Choose your preferred delivery method below.",
      nextActions: [
        "Email: Get submissions directly in your inbox",
        "Webhook: Send to your own system or API",
        "Google Sheets: Automatically save to a spreadsheet (coming soon)",
        "Zapier: Connect to thousands of apps (coming soon)"
      ]
    };
  }

  /**
   * Process delivery configuration selection
   */
  processDeliverySelection(deliveryType: string, settings: any): FlowState {
    const deliveryConfig: DeliveryConfiguration = {
      type: deliveryType as any,
      settings
    };

    let guidance = "";
    let nextActions: string[] = [];

    switch (deliveryType) {
      case 'email':
        guidance = `Great! Form submissions will be sent to ${settings.email}. You can add multiple email addresses later.`;
        nextActions = [
          "Test the email delivery",
          "Proceed to publish your form",
          "Add multiple recipients (upgrade feature)"
        ];
        break;
      case 'webhook':
        guidance = `Perfect! Submissions will be posted to ${settings.webhookUrl}. Make sure your endpoint can handle POST requests.`;
        nextActions = [
          "Test the webhook integration",
          "Verify your endpoint is ready",
          "Proceed to publish your form"
        ];
        break;
      default:
        guidance = `${deliveryType} integration is coming soon! For now, let's set up email delivery.`;
        nextActions = ["Set up email delivery instead"];
    }

    return {
      step: 'configure_delivery',
      data: { deliveryConfig },
      guidance,
      nextActions
    };
  }

  /**
   * Guide user through publishing process
   */
  processPublishFlow(isAuthenticated: boolean, userRole: 'guest' | 'free' | 'paid', existingLiveFormsCount: number = 0): FlowState {
    if (!isAuthenticated) {
      return {
        step: 'publish_form',
        data: { isAuthenticated: false, userRole: 'guest' },
        guidance: "To publish your form and get a permanent embed code, please sign up or log in. Guest forms expire after 24 hours.",
        nextActions: [
          "Sign up for a free account",
          "Log in to your existing account",
          "Continue with temporary embed code (expires in 24 hours)"
        ]
      };
    }

    if (userRole === 'free' && existingLiveFormsCount > 0) {
      return {
        step: 'publish_form',
        data: { isAuthenticated: true, userRole: 'free' },
        guidance: `You already have ${existingLiveFormsCount} live form(s). Free accounts can only have 1 active form at a time. You'll need to deactivate your current form or upgrade to Pro.`,
        nextActions: [
          "Deactivate your current live form",
          "Upgrade to Pro for unlimited forms",
          "Save as draft for later"
        ],
        validationErrors: ["Free account limit reached"]
      };
    }

    return {
      step: 'publish_form',
      data: { isAuthenticated: true, userRole },
      guidance: `Ready to publish! ${userRole === 'paid' ? 'As a Pro user, you can have unlimited live forms.' : 'Your form will go live immediately.'}`,
      nextActions: [
        "Publish form and get embed code",
        "Set up domain restrictions (recommended)",
        "Download embed code for your website"
      ]
    };
  }

  /**
   * Process successful form publishing
   */
  processFormPublished(embedCode: string, isAuthenticated: boolean, userRole: 'guest' | 'free' | 'paid'): FlowState {
    const isPermanent = isAuthenticated;
    const expiration = isPermanent ? undefined : new Date(Date.now() + 24 * 60 * 60 * 1000);

    return {
      step: 'live_form',
      data: { 
        embedCode, 
        isAuthenticated, 
        userRole, 
        embedExpiration: expiration 
      },
      guidance: `🎉 Congratulations! Your form is now live. ${isPermanent ? 'Your embed code is permanent and ready to use.' : 'Your guest embed code will expire in 24 hours.'}`,
      nextActions: [
        "Copy embed code to your website",
        "Set up domain restrictions for security",
        "View form analytics and submissions",
        ...(isPermanent ? [] : ["Sign up for permanent embed codes"])
      ]
    };
  }

  /**
   * Handle form expiration for guest users
   */
  processFormExpiration(): FlowState {
    return {
      step: 'expired_form',
      data: {},
      guidance: "Your guest form has expired. Sign up for a free account to create permanent forms that never expire.",
      nextActions: [
        "Sign up for a free account",
        "Create a new form",
        "Log in to your existing account"
      ]
    };
  }

  /**
   * Provide contextual guidance based on current flow state
   */
  getContextualGuidance(currentStep: FormFlowStep, data: any): UserGuidance {
    switch (currentStep) {
      case 'input_website':
        return {
          message: "Enter your website URL to begin. We'll analyze your design and create a matching form.",
          actions: ["Enter website URL"],
          tips: ["Use your main website URL for best results", "We support any public website"]
        };

      case 'select_form_type':
        return {
          message: "Choose the type of form that best fits your needs. Each type is optimized for different goals.",
          actions: ["Select form type"],
          tips: ["Contact forms work well for most websites", "Newsletter forms help build your email list"]
        };

      case 'preview_form':
        return {
          message: "Test your form and make any adjustments before publishing.",
          actions: ["Test form", "Adjust styling", "Configure delivery"],
          tips: ["Test the form yourself first", "Check that all fields work correctly"]
        };

      case 'configure_delivery':
        return {
          message: "Set up where form submissions should be sent. Email is the most popular option.",
          actions: ["Choose delivery method", "Configure settings"],
          warnings: data?.isAuthenticated ? [] : ["Guest accounts have limited delivery options"]
        };

      case 'publish_form':
        return {
          message: "Ready to go live! Your form will be accessible via embed code.",
          actions: ["Publish form"],
          warnings: data?.userRole === 'free' ? ["Free accounts limited to 1 live form"] : []
        };

      default:
        return {
          message: "Continue with the form creation process.",
          actions: ["Next step"]
        };
    }
  }

  // ====== ACCOUNT RULES AND VALIDATION ======

  /**
   * Validate if user can create a new form based on their account type
   */
  validateFormCreationRules(
    userRole: 'guest' | 'free' | 'paid', 
    existingLiveFormsCount: number
  ): { canCreate: boolean; message: string; suggestedActions: string[] } {
    if (userRole === 'guest') {
      return {
        canCreate: true,
        message: "Guest users can create forms with 24-hour expiration.",
        suggestedActions: ["Create temporary form", "Sign up for permanent forms"]
      };
    }

    if (userRole === 'free' && existingLiveFormsCount >= 1) {
      return {
        canCreate: false,
        message: "Free accounts are limited to 1 active live form. Deactivate your current form or upgrade to Pro.",
        suggestedActions: [
          "Deactivate current live form",
          "Upgrade to Pro for unlimited forms",
          "Save new form as draft"
        ]
      };
    }

    if (userRole === 'free') {
      return {
        canCreate: true,
        message: "You can create 1 live form with your free account.",
        suggestedActions: ["Create form", "Upgrade to Pro for unlimited forms"]
      };
    }

    // Paid users
    return {
      canCreate: true,
      message: "Pro users can create unlimited live forms.",
      suggestedActions: ["Create form"]
    };
  }

  /**
   * Generate embed code with appropriate expiration based on user type
   */
  generateEmbedCodeWithExpiration(
    formId: number,
    userRole: 'guest' | 'free' | 'paid',
    isAuthenticated: boolean
  ): { embedCode: string; expires?: Date; isPermanent: boolean } {
    const baseEmbedCode = `<script src="${process.env.FRONTEND_URL || 'http://localhost:3001'}/embed.js" data-form-id="${formId}"></script>`;
    
    if (!isAuthenticated || userRole === 'guest') {
      // Guest users get temporary embed codes
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      return {
        embedCode: baseEmbedCode,
        expires,
        isPermanent: false
      };
    }

    // Authenticated users (free and paid) get permanent embed codes
    return {
      embedCode: baseEmbedCode,
      isPermanent: true
    };
  }

  /**
   * Check if embed code has expired
   */
  isEmbedCodeExpired(expirationDate?: Date): boolean {
    if (!expirationDate) return false; // Permanent codes never expire
    return new Date() > expirationDate;
  }

  /**
   * Get user-friendly expiration warning message
   */
  getExpirationWarning(expirationDate?: Date): string | null {
    if (!expirationDate) return null;
    
    const now = new Date();
    const timeLeft = expirationDate.getTime() - now.getTime();
    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
    
    if (timeLeft <= 0) {
      return "Your embed code has expired. Please sign up for a permanent solution.";
    }
    
    if (hoursLeft <= 1) {
      const minutesLeft = Math.floor(timeLeft / (1000 * 60));
      return `Your embed code expires in ${minutesLeft} minutes. Sign up now to keep your form active.`;
    }
    
    if (hoursLeft <= 6) {
      return `Your embed code expires in ${hoursLeft} hours. Consider signing up for a permanent solution.`;
    }
    
    return `Your guest embed code expires in ${hoursLeft} hours.`;
  }

  // ====== ENHANCED FORM GENERATION WITH FLOW AWARENESS ======

  /**
   * Enhanced form generation that includes flow state tracking
   */
  async generateFormWithFlow(
    websiteData: {
      url: string;
      title: string;
      description: string;
      voiceAnalysis: VoiceAnalysis;
      designTokens: any;
      messaging: string[];
    },
    formPurpose: string,
    userRole: 'guest' | 'free' | 'paid' = 'guest',
    isAuthenticated: boolean = false
  ): Promise<{ form: GeneratedForm; flowState: FlowState }> {
    // Generate the form using existing logic
    const generatedForm = await this.generateFormFromWebsite(websiteData, formPurpose);
    
    // Create flow state for the generated form
    const flowState = this.processFormGeneration(generatedForm, isAuthenticated, userRole);
    
    return {
      form: generatedForm,
      flowState
    };
  }

  /**
   * Provide smart recommendations based on website analysis
   */
  getSmartRecommendations(extractedData: any): { 
    recommendedFormType: string; 
    reasoning: string; 
    alternativeOptions: string[] 
  } {
    // Analyze website content to suggest best form type
    const messaging = extractedData.messaging || [];
    const hasEcommerce = messaging.some((msg: string) => 
      /shop|buy|cart|price|product/i.test(msg)
    );
    const hasServices = messaging.some((msg: string) => 
      /service|consult|quote|hire|work with/i.test(msg)
    );
    const hasBlog = messaging.some((msg: string) => 
      /blog|article|news|subscribe|newsletter/i.test(msg)
    );
    
    if (hasServices) {
      return {
        recommendedFormType: 'quote',
        reasoning: "Your website mentions services, making a quote request form ideal for generating leads.",
        alternativeOptions: ['contact', 'feedback']
      };
    }
    
    if (hasEcommerce) {
      return {
        recommendedFormType: 'newsletter',
        reasoning: "E-commerce sites benefit from newsletter signups to drive repeat sales.",
        alternativeOptions: ['feedback', 'contact']
      };
    }
    
    if (hasBlog) {
      return {
        recommendedFormType: 'newsletter',
        reasoning: "Blog content works well with newsletter signups to build your audience.",
        alternativeOptions: ['contact', 'feedback']
      };
    }
    
    // Default recommendation
    return {
      recommendedFormType: 'contact',
      reasoning: "A contact form is the most versatile option and works well for any website.",
      alternativeOptions: ['newsletter', 'feedback', 'quote']
    };
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
    },
    userChanges: string
  ): Promise<GeneratedForm> {
    if (!this.isEnabled || !this.openai) {
      console.log('📝 OpenAI not available - returning original form for adaptation');
      return formData;
    }

    const prompt = `
Adapt this form to better match the website's design and tone, incorporating the user's requested changes.

Current Form:
${JSON.stringify(formData, null, 2)}

Website Analysis:
- Voice/Tone: ${JSON.stringify(websiteData.voiceAnalysis)}
- Design Tokens:
  - Primary Colors: ${websiteData.designTokens.primaryColors?.slice(0, 3).join(', ')}
  - Font Families: ${websiteData.designTokens.fontFamilies?.slice(0, 3).join(', ')}
  - Extracted Background Color (lightest available): ${websiteData.designTokens.colorPalette?.find((color: string) => this.isLightColor(color)) || '#ffffff'}

User's Requested Changes: "${userChanges}"

Please modify the form to:
1. Incorporate the user's requested changes.
2. Maintain consistency with the website's tone and voice in all copy.
3. Use the website's color palette and typography, ensuring high contrast.
4. Ensure buttons have a visible background, contrasting text, and a subtle border if needed for clarity.
5. Keep the form designed for inline embedding with a max-width of 250px.

Return the adapted form as JSON with the exact same structure as the Current Form.
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
            content: "You are a brand-aware form designer and UX specialist. Adapt forms to match specific website aesthetics and brand voice perfectly, incorporating user feedback."
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
    const textColor = this.isLightColor(backgroundColor) ? '#333333' : '#ffffff'; // Default contrasting text color
    const buttonTextColor = this.isLightColor(primaryColor) ? '#333333' : '#ffffff'; // Default contrasting button text color

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
3. **Crucially, use the provided design tokens for the form's styling. Specifically, set 'primaryColor' to '${primaryColor}', 'backgroundColor' to '${backgroundColor}', 'fontFamily' to '${fontFamily}', and set 'maxWidth' to '250px' in the 'styling' object.**
4. **Ensure high contrast for all text elements:**
   - Set 'textColor' to a color that contrasts well with 'backgroundColor'.
   - Set 'buttonTextColor' to a color that contrasts well with 'buttonBackgroundColor' (which should be 'primaryColor').
5. **Ensure buttons are clearly visible and interactive:**
   - Set 'buttonBackgroundColor' to '${primaryColor}'.
   - Add 'buttonBorder' (e.g., '1px solid #ccc') if the button's background color is very similar to the form's background or the button text color.
6. Include validation rules where appropriate
7. Generate a personalized thank you message
8. **The form should be designed for inline embedding.**

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
    "maxWidth": "e.g., 250px",
    "textColor": "hex color for general text",
    "buttonTextColor": "hex color for button text",
    "buttonBackgroundColor": "hex color for button background",
    "buttonBorder": "e.g., 1px solid #ccc"
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
      
      // Determine default colors for robust fallbacks
      const defaultPrimaryColor = designTokens.primaryColors?.[0] || '#007bff';
      const defaultBackgroundColor = designTokens.colorPalette?.find((color: string) => this.isLightColor(color)) || '#ffffff';
      const defaultTextColor = this.isLightColor(defaultBackgroundColor) ? '#333333' : '#ffffff';
      const defaultButtonTextColor = this.isLightColor(defaultPrimaryColor) ? '#333333' : '#ffffff';

      // Validate and set defaults
      return {
        title: parsed.title || 'Contact Form',
        description: parsed.description || 'Please fill out this form',
        fields: this.validateFields(parsed.fields || []),
        ctaText: parsed.ctaText || 'Submit',
        thankYouMessage: parsed.thankYouMessage || 'Thank you for your submission!',
        styling: {
          primaryColor: parsed.styling?.primaryColor || defaultPrimaryColor,
          backgroundColor: parsed.styling?.backgroundColor || defaultBackgroundColor,
          fontFamily: parsed.styling?.fontFamily || designTokens.fontFamilies?.[0] || 'system-ui',
          borderRadius: parsed.styling?.borderRadius || '8px',
          maxWidth: '250px', // Enforce 250px regardless of LLM output
          textColor: parsed.styling?.textColor || defaultTextColor,
          buttonTextColor: parsed.styling?.buttonTextColor || defaultButtonTextColor,
          buttonBackgroundColor: parsed.styling?.buttonBackgroundColor || defaultPrimaryColor,
          buttonBorder: parsed.styling?.buttonBorder || '1px solid #ccc', // Default visible border
        },
      };
    } catch (error) {
      console.error('Error parsing form response:', error);
      
      // Return fallback form with enforced styling
      const fallbackPrimaryColor = designTokens.primaryColors?.[0] || '#007bff';
      const fallbackBackgroundColor = designTokens.colorPalette?.find((color: string) => this.isLightColor(color)) || '#ffffff';
      const fallbackTextColor = this.isLightColor(fallbackBackgroundColor) ? '#333333' : '#ffffff';
      const fallbackButtonTextColor = this.isLightColor(fallbackPrimaryColor) ? '#333333' : '#ffffff';

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
          primaryColor: fallbackPrimaryColor,
          backgroundColor: fallbackBackgroundColor,
          fontFamily: designTokens.fontFamilies?.[0] || 'system-ui',
          borderRadius: '8px',
          maxWidth: '250px', // Default to 250px for fallback
          textColor: fallbackTextColor,
          buttonTextColor: fallbackButtonTextColor,
          buttonBackgroundColor: fallbackPrimaryColor,
          buttonBorder: '1px solid #ccc', // Default visible border for fallback
        },
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
6. Maintain the styling, ensuring high contrast for all elements.

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
    const textColor = this.isLightColor(backgroundColor) ? '#333333' : '#ffffff';
    const buttonTextColor = this.isLightColor(primaryColor) ? '#333333' : '#ffffff';

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
        maxWidth: '250px', // Default to 250px for mock
        textColor: textColor,
        buttonTextColor: buttonTextColor,
        buttonBackgroundColor: primaryColor,
        buttonBorder: '1px solid #ccc', // Default visible border for mock
      },
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