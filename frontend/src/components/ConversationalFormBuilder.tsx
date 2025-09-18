import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FormData, GeneratedForm, SaaSForm, FormField, ExtractedDesignTokensData } from '../types/api';

interface ConversationalFormBuilderProps {
  onFormGenerated: (form: SaaSForm) => void;
  user?: any;
  guestToken?: string;
  onStateChange: (state: { 
    formData: Partial<FormData>; 
    generatedForm: GeneratedForm | null; 
    createdForm: SaaSForm | null;
    extractedDesignTokens: any | null;
    extractedVoiceAnalysis: any | null;
  }) => void;
}

interface StepProps {
  formData: Partial<FormData>;
  onNext: (data: Partial<FormData>) => void;
  onBack?: () => void;
  extractedDesignTokens?: any;
  extractedVoiceAnalysis?: any;
  createdForm?: SaaSForm | null;
  generatedForm?: GeneratedForm | null;
}

// Step 1: Where will this live?
const Step1UrlInput: React.FC<StepProps> = ({ formData, onNext }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { url: formData.url || '' }
  });
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: { url: string }) => {
    setIsLoading(true);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (localStorage.getItem('authToken')) {
        headers['Authorization'] = `Bearer ${localStorage.getItem('authToken')}`;
      } else if (localStorage.getItem('guestToken')) {
        // Guest token is not directly used for this endpoint, but good to have auth context
      }

      const response = await fetch('/api/forms/extract-design-tokens', {
        method: 'POST',
        headers,
        body: JSON.stringify({ url: data.url }),
      });

      const result = await response.json();
      
      if (result.success) {
        onNext({ 
          url: data.url, 
          extractedRecordId: result.data.id,
          extractedDesignTokens: result.data.designTokens,
          extractedVoiceAnalysis: result.data.voiceAnalysis,
        });
      } else {
        alert(result.error || 'Failed to analyze website. Please check the URL.');
      }
    } catch (error: any) {
      console.error('URL extraction error:', error);
      alert(error.message || 'Failed to analyze website. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h2>🌐 Where will this live?</h2>
        <p style={{ fontSize: '18px', color: '#666', margin: '16px 0' }}>
          First, let's see the website where you want to embed this form. 
          We'll analyze its design to make your form blend in perfectly.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label htmlFor="url" className="form-label" style={{ fontSize: '16px', fontWeight: '500' }}>
            Website URL
          </label>
          <input
            id="url"
            type="url"
            className={`form-input ${errors.url ? 'error' : ''}`}
            placeholder="https://example.com"
            style={{ fontSize: '16px', padding: '16px' }}
            {...register('url', {
              required: 'Website URL is required',
              pattern: {
                value: /^https?:\/\/.+/,
                message: 'Please enter a valid URL starting with http:// or https://'
              }
            })}
          />
          {errors.url && (
            <span className="error-message">{errors.url.message as string}</span>
          )}
          <small style={{ color: '#666', fontSize: '14px', marginTop: '8px', display: 'block' }}>
            💡 We'll extract colors, fonts, and styling to match your form perfectly
          </small>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isLoading}
          style={{ width: '100%', fontSize: '16px', padding: '16px' }}
        >
          {isLoading ? (
            <>🔍 Analyzing website...</>
          ) : (
            'Analyze Website →'
          )}
        </button>
      </form>
    </div>
  );
};

// Step 2: What do you want to capture?
const Step2PurposeInput: React.FC<StepProps> = ({ formData, onNext, onBack, extractedDesignTokens, extractedVoiceAnalysis }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { purpose: formData.purpose || '' }
  });
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: { purpose: string }) => {
    setIsLoading(true);
    try {
      const payload = {
        extractedRecordId: formData.extractedRecordId,
        formPurpose: data.purpose,
        formName: formData.formName,
        formDescription: formData.formDescription,
        ...(localStorage.getItem('guestToken') && !localStorage.getItem('authToken') && { guestToken: localStorage.getItem('guestToken') })
      };

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (localStorage.getItem('authToken')) {
        headers['Authorization'] = `Bearer ${localStorage.getItem('authToken')}`;
      }

      const response = await fetch('/api/forms/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (result.success) {
        onNext({ 
          purpose: data.purpose,
          generatedForm: result.generatedForm,
          createdForm: result.form,
        });
      } else {
        alert(result.error || 'Failed to generate form');
        
        if (result.upgradeRequired) {
          console.log('Upgrade required for more forms');
        }
      }
    } catch (error: any) {
      console.error('Form generation error:', error);
      alert(error.message || 'Failed to generate form');
    } finally {
      setIsLoading(false);
    }
  };

  const commonPurposes = [
    'Collect leads for our sales team',
    'Get feedback on our product',
    'Allow customers to contact support',
    'Capture newsletter signups',
    'Register people for events',
    'Request quotes or consultations',
    'Gather survey responses'
  ];

  return (
    <div className="card">
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h2>📝 What do you want to capture?</h2>
        <p style={{ fontSize: '18px', color: '#666', margin: '16px 0' }}>
          Describe what you want this form to do in plain English. 
          Our AI will figure out the best fields and wording.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label htmlFor="purpose" className="form-label" style={{ fontSize: '16px', fontWeight: '500' }}>
            Form Purpose
          </label>
          <textarea
            id="purpose"
            className={`form-input ${errors.purpose ? 'error' : ''}`}
            placeholder="e.g., I want to collect leads from potential customers interested in our consulting services. I need their name, email, company, and what they're looking for help with."
            rows={4}
            style={{ fontSize: '16px', padding: '16px', lineHeight: '1.5' }}
            {...register('purpose', {
              required: 'Please describe what you want to capture',
              minLength: {
                value: 20,
                message: 'Please provide more detail about your form purpose'
              }
            })}
          />
          {errors.purpose && (
            <span className="error-message">{errors.purpose.message as string}</span>
          )}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
            💡 Need inspiration? Try one of these:
          </p>
          <div style={{ display: 'grid', gap: '8px' }}>
            {commonPurposes.map((example, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  const textarea = document.getElementById('purpose') as HTMLTextAreaElement;
                  textarea.value = example;
                  textarea.focus();
                }}
                style={{
                  padding: '12px',
                  border: '1px solid #e1e5e9',
                  borderRadius: '6px',
                  backgroundColor: '#f8f9fa',
                  textAlign: 'left',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e9ecef';
                  e.currentTarget.style.borderColor = '#007bff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                  e.currentTarget.style.borderColor = '#e1e5e9';
                }}
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            type="button" 
            onClick={onBack}
            className="btn btn-secondary"
            style={{ flex: '1', fontSize: '16px', padding: '16px' }}
          >
            ← Back
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading}
            style={{ flex: '2', fontSize: '16px', padding: '16px' }}
          >
            {isLoading ? (
              <>🤖 Generating form...</>
            ) : (
              'Generate Form Fields →'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Step 3: Configure Destination (now with preview)
const Step3ConfigureDestination: React.FC<StepProps> = ({ formData, onNext, onBack, createdForm, generatedForm }) => {
  const [selectedType, setSelectedType] = useState<string>(formData.destinationType || '');
  const [config, setConfig] = useState(formData.destinationConfig || {});
  const [isSaving, setIsSaving] = useState(false);

  const destinations = [
    {
      id: 'email',
      name: 'Email',
      icon: '📧',
      description: 'Send submissions to your email inbox',
      fields: ['email']
    },
    {
      id: 'google_sheets',
      name: 'Google Sheets',
      icon: '📊',
      description: 'Add submissions to a Google Sheets spreadsheet',
      fields: ['sheet_url']
    },
    {
      id: 'slack',
      name: 'Slack',
      icon: '💬',
      description: 'Send notifications to a Slack channel',
      fields: ['webhook_url']
    },
    {
      id: 'webhook',
      name: 'Webhook',
      icon: '🔗',
      description: 'Send data to your custom endpoint',
      fields: ['webhook_url']
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedType) {
      alert('Please select a destination for your form data');
      return;
    }

    // Validate configuration based on destination type
    const destination = destinations.find(d => d.id === selectedType);
    if (destination) {
      const missingFields = destination.fields.filter(field => !config[field]);
      if (missingFields.length > 0) {
        alert(`Please fill in the required field: ${missingFields[0]}`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      };

      const response = await fetch(`/api/forms/${createdForm?.id}/configure-destination`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          destinationType: selectedType,
          destinationConfig: config,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onNext({ 
          destinationType: selectedType as any,
          destinationConfig: config 
        });
      } else {
        alert(result.error || 'Failed to save destination');
      }
    } catch (error: any) {
      console.error('Save destination error:', error);
      alert(error.message || 'Failed to save destination. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="card">
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h2>📤 Where should the data go?</h2>
        <p style={{ fontSize: '18px', color: '#666', margin: '16px 0' }}>
          Choose where you want to receive form submissions.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
          {destinations.map((dest) => (
            <div
              key={dest.id}
              onClick={() => setSelectedType(dest.id)}
              style={{
                padding: '20px',
                border: selectedType === dest.id ? '2px solid #007bff' : '1px solid #e1e5e9',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: selectedType === dest.id ? '#f8f9ff' : '#fff',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '24px', marginRight: '12px' }}>{dest.icon}</span>
                <h3 style={{ margin: 0, fontSize: '18px' }}>{dest.name}</h3>
              </div>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{dest.description}</p>
            </div>
          ))}
        </div>

        {/* Configuration fields for selected destination */}
        {selectedType && (
          <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 16px 0' }}>Configuration</h4>
            
            {selectedType === 'email' && (
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={config.email || ''}
                  onChange={(e) => setConfig({...config, email: e.target.value})}
                />
              </div>
            )}

            {selectedType === 'google_sheets' && (
              <div className="form-group">
                <label className="form-label">Google Sheets URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={config.sheet_url || ''}
                  onChange={(e) => setConfig({...config, sheet_url: e.target.value})}
                />
                <small style={{ color: '#666', fontSize: '12px' }}>
                  Make sure the sheet is shared with edit permissions
                </small>
              </div>
            )}

            {(selectedType === 'slack' || selectedType === 'webhook') && (
              <div className="form-group">
                <label className="form-label">
                  {selectedType === 'slack' ? 'Slack Webhook URL' : 'Webhook URL'}
                </label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://hooks.slack.com/services/..."
                  value={config.webhook_url || ''}
                  onChange={(e) => setConfig({...config, webhook_url: e.target.value})}
                />
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            type="button" 
            onClick={onBack}
            className="btn btn-secondary"
            style={{ flex: '1', fontSize: '16px', padding: '16px' }}
          >
            ← Back
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isSaving}
            style={{ flex: '2', fontSize: '16px', padding: '16px' }}
          >
            {isSaving ? 'Saving Destination...' : 'Save Destination →'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Step 4: Confirmation
const Step4Confirmation: React.FC<{ 
  generatedForm: GeneratedForm; 
  createdForm: SaaSForm;
  onGoToDashboard: () => void;
}> = ({ generatedForm, createdForm, onGoToDashboard }) => {
  return (
    <div className="card">
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h2>🎉 Your Form is Ready!</h2>
        <p style={{ fontSize: '18px', color: '#666', margin: '16px 0' }}>
          Your AI-generated form has been created. You can now manage it in your dashboard.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button 
          onClick={onGoToDashboard}
          className="btn btn-primary"
          style={{ fontSize: '16px', padding: '12px 24px' }}
        >
          Go to Dashboard →
        </button>
      </div>
    </div>
  );
};

export const ConversationalFormBuilder: React.FC<ConversationalFormBuilderProps> = ({ 
  onFormGenerated, 
  user,
  guestToken,
  onStateChange
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<FormData>>({});
  const [generatedForm, setGeneratedForm] = useState<GeneratedForm | null>(null);
  const [createdForm, setCreatedForm] = useState<SaaSForm | null>(null);
  const [extractedDesignTokens, setExtractedDesignTokens] = useState<any | null>(null);
  const [extractedVoiceAnalysis, setExtractedVoiceAnalysis] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    onStateChange({ 
      formData, 
      generatedForm, 
      createdForm,
      extractedDesignTokens,
      extractedVoiceAnalysis,
    });
  }, [formData, generatedForm, createdForm, extractedDesignTokens, extractedVoiceAnalysis, onStateChange]);

  const handleNext = async (stepData: Partial<FormData>) => {
    const newFormData = { ...formData, ...stepData };
    setFormData(newFormData);

    if (stepData.extractedRecordId) {
      setExtractedDesignTokens(stepData.extractedDesignTokens);
      setExtractedVoiceAnalysis(stepData.extractedVoiceAnalysis);
    }
    if (stepData.generatedForm) {
      setGeneratedForm(stepData.generatedForm);
    }
    if (stepData.createdForm) {
      setCreatedForm(stepData.createdForm);
    }

    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      if (currentStep === 4) { // If going back from final preview, clear generated form
        setGeneratedForm(null);
        setCreatedForm(null);
      }
    }
  };

  const handleGoToDashboard = () => {
    if (createdForm) {
      onFormGenerated(createdForm); // This will trigger App.tsx to update forms and switch view
    }
  };

  // Progress indicator
  const ProgressIndicator = () => (
    <div style={{ marginBottom: '32px', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        {/* Progress line */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '0',
          right: '0',
          height: '2px',
          backgroundColor: '#e1e5e9',
          zIndex: 1
        }}>
          <div style={{
            height: '100%',
            backgroundColor: '#007bff',
            width: `${((currentStep - 1) / 3) * 100}%`,
            transition: 'width 0.3s ease'
          }}></div>
        </div>

        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: currentStep >= step ? '#007bff' : '#e1e5e9',
              color: currentStep >= step ? 'white' : '#666',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '16px',
              zIndex: 2,
              position: 'relative',
              transition: 'all 0.3s ease'
            }}
          >
            {step}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#666' }}>
        <span>Website</span>
        <span>Purpose</span>
        <span>Destination</span>
        <span>Confirmation</span>
      </div>
    </div>
  );

  return (
    <div>
      <ProgressIndicator />
      
      {currentStep === 1 && (
        <Step1UrlInput formData={formData} onNext={handleNext} />
      )}
      
      {currentStep === 2 && (
        <Step2PurposeInput 
          formData={formData} 
          onNext={handleNext} 
          onBack={handleBack} 
          extractedDesignTokens={extractedDesignTokens}
          extractedVoiceAnalysis={extractedVoiceAnalysis}
        />
      )}
      
      {currentStep === 3 && (
        <Step3ConfigureDestination 
          formData={formData} 
          onNext={handleNext} 
          onBack={handleBack} 
          createdForm={createdForm}
          generatedForm={generatedForm}
        />
      )}
      
      {currentStep === 4 && generatedForm && createdForm && (
        <Step4Confirmation 
          generatedForm={generatedForm}
          createdForm={createdForm}
          onGoToDashboard={handleGoToDashboard}
        />
      )}
    </div>
  );
};