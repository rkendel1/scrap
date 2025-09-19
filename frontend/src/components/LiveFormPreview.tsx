import React, { useState, useEffect, useRef } from 'react';
import { EmbeddableForm } from './EmbeddableForm';
import { FormData, GeneratedForm, SaaSForm, FormField } from '../types/api';
import { CheckCircle, Lock } from 'lucide-react'; // Import CheckCircle and Lock icon

// Helper to determine if a color is light (simplified for demo)
const isLightColor = (color: string): boolean => {
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

interface LiveFormPreviewProps {
  formData: Partial<FormData>;
  generatedForm: GeneratedForm | null;
  createdForm: SaaSForm | null;
  user?: any;
  extractedDesignTokens: any | null;
  extractedVoiceAnalysis: any | null;
  onGetEmbedCodeClick: (form: SaaSForm) => void;
  isDestinationConfigured: boolean; // New prop
}

export const LiveFormPreview: React.FC<LiveFormPreviewProps> = ({
  formData,
  generatedForm,
  createdForm,
  user,
  extractedDesignTokens,
  extractedVoiceAnalysis,
  onGetEmbedCodeClick,
  isDestinationConfigured, // Destructure new prop
}) => {
  const { url, purpose, destinationType } = formData;

  const getPreviewForm = (): GeneratedForm => {
    if (generatedForm) {
      return generatedForm;
    }

    const defaultStyling = {
      primaryColor: extractedDesignTokens?.primaryColors?.[0] || '#007bff', /* Blue */
      backgroundColor: extractedDesignTokens?.colorPalette?.find(color => isLightColor(color)) || '#ffffff', /* White */
      fontFamily: extractedDesignTokens?.fontFamilies?.[0] || 'Inter, system-ui, -apple-system, sans-serif',
      borderRadius: '8px',
      buttonStyle: 'solid',
      maxWidth: '500px', // Ensure maxWidth is always set for the mock form
    };

    let mockFields: FormField[] = [
      { type: 'email', name: 'email', label: 'Email Address', placeholder: 'Enter your email', required: true },
      { type: 'text', name: 'name', label: 'Name', placeholder: 'Your name', required: false },
    ];

    if (purpose?.toLowerCase().includes('feedback') || purpose?.toLowerCase().includes('message')) {
      mockFields.push({ type: 'textarea', name: 'message', label: 'Message', placeholder: 'Your message', required: true });
    } else if (purpose?.toLowerCase().includes('lead')) {
      mockFields.push({ type: 'text', name: 'company', label: 'Company', placeholder: 'Your company', required: false });
    }

    const descriptionText = extractedDesignTokens?.messaging?.[0] || 
                            (url ? `This form will adapt to the style of ${url}` : 'Start by entering a website URL.');

    return {
      title: purpose ? `AI Form: ${purpose}` : 'Customer feedback', // Default title for preview
      description: descriptionText,
      fields: mockFields,
      ctaText: purpose?.toLowerCase().includes('subscribe') ? 'Subscribe' : 'Submit',
      thankYouMessage: 'Thank you for your submission!',
      styling: defaultStyling,
    };
  };

  const previewForm = getPreviewForm();

  const formContent = (
    <EmbeddableForm
      form={previewForm}
      embedCode={createdForm?.embed_code || "preview-mode"}
      showBranding={false}
      onSubmit={(data) => console.log('Preview submission:', data)}
    />
  );

  const getDestinationText = () => {
    if (!formData.destinationType) return '';
    switch (formData.destinationType) {
      case 'email': return 'Email';
      case 'googlesheets': return 'Google Sheets';
      case 'slack': return 'Slack';
      case 'webhook': return 'Webhook';
      case 'zapier': return 'Zapier'; // Added Zapier
      default: return '';
    }
  };

  return (
    <div className="card live-preview-card">
      <div className="preview-header">
        <h3>Live Form Preview</h3>
        {url && <p>Styled with design tokens from: {url}</p>}
      </div>
      
      <div className="live-preview-content-wrapper">
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexShrink: 0,
            flexDirection: 'column',
            width: '100%',
            padding: '20px'
          }}
        >
          {url || purpose || generatedForm ? (
            <>
              {formContent}
              {isDestinationConfigured && ( // Show status only if configured
                <div className="form-submit-status">
                  <CheckCircle size={16} /> Data will be sent to: {getDestinationText()}
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              <div className="sparkle-icon">✨</div>
              <h4 style={{ fontSize: '18px', marginBottom: '8px', color: '#333' }}>Your AI-Powered Form</h4>
              <p className="placeholder-text">
                Start by entering a website URL in the chat to the left to generate your form!
              </p>
            </div>
          )}
        </div>
      </div>
      {generatedForm && (
        <div className="ai-generated-badge">
          ✅ AI-generated form preview.
        </div>
      )}

      {generatedForm && createdForm && (
        <div className="ready-to-embed-card">
          <h3>Ready to embed?</h3>
          <p>
            Your form is configured and ready to use. Get the embed code
            to add it to your website.
          </p>
          <button 
            onClick={() => onGetEmbedCodeClick(createdForm)}
            className="btn-embed-code"
            disabled={!user || !isDestinationConfigured} // Disable if not logged in or destination not configured
          >
            <Lock size={18} />
            {!user ? 'Sign in to get embed code' : (!isDestinationConfigured ? 'Configure Destination First' : 'Get Embed Code')}
          </button>
        </div>
      )}
    </div>
  );
};