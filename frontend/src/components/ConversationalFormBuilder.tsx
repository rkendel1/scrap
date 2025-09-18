import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FormData, GeneratedForm, SaaSForm, FormField } from '../types/api';

interface ConversationalFormBuilderProps {
  onFormGenerated: (form: SaaSForm) => void;
  user?: any;
  guestToken?: string;
  onStateChange: (state: { formData: Partial<FormData>; generatedForm: GeneratedForm | null; createdForm: SaaSForm | null }) => void;
}

interface StepProps {
  formData: Partial<FormData>;
  onNext: (data: Partial<FormData>) => void;
  onBack?: () => void;
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
      // For demo purposes, we'll proceed without actual validation
      // In production, this would validate the URL by attempting to scrape it
      setTimeout(() => {
        onNext({ url: data.url });
        setIsLoading(false);
      }, 1000);
    } catch (error: any) {
      console.error('URL validation error:', error);
      alert('Failed to analyze website. Please check the URL.');
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
const Step2PurposeInput: React.FC<StepProps> = ({ formData, onNext, onBack }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { purpose: formData.purpose || '' }
  });

  const onSubmit = (data: { purpose: string }) => {
    onNext({ purpose: data.purpose });
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
            style={{ flex: '2', fontSize: '16px', padding: '16px' }}
          >
            Generate Form Fields →
          </button>
        </div>
      </form>
    </div>
  );
};

// Step 3: Where should the data go?
const Step3DestinationInput: React.FC<StepProps> = ({ formData, onNext, onBack }) => {
  const [selectedType, setSelectedType] = useState<string>(formData.destinationType || '');
  const [config, setConfig] = useState(formData.destinationConfig || {});

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

  const handleSubmit = (e: React.FormEvent) => {
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

    onNext({ 
      destinationType: selectedType as any,
      destinationConfig: config 
    });
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
            style={{ flex: '2', fontSize: '16px', padding: '16px' }}
          >
            Create Form →
          </button>
        </div>
      </form>
    </div>
  );
};

// Step 4: Final Preview and Go to Dashboard
const Step4FinalPreview: React.FC<{ 
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
  const [createdForm, setCreatedForm] = useState<SaaSForm | null>(null); // Store the full form object
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    onStateChange({ formData, generatedForm, createdForm });
  }, [formData, generatedForm, createdForm, onStateChange]);

  const handleNext = async (stepData: Partial<FormData>) => {
    const newFormData = { ...formData, ...stepData };
    setFormData(newFormData);

    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Generate the form
      setIsLoading(true);
      try {
        const payload = {
          url: newFormData.url,
          formPurpose: newFormData.purpose,
          formName: newFormData.formName, // Assuming formName can be passed from a previous step if added
          formDescription: newFormData.formDescription, // Assuming formDescription can be passed
          destinationType: newFormData.destinationType,
          destinationConfig: newFormData.destinationConfig,
          ...(guestToken && !user && { guestToken })
        };

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (user?.token) {
          headers['Authorization'] = `Bearer ${user.token}`;
        }

        const response = await fetch('/api/forms/generate', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        
        if (result.success) {
          setGeneratedForm(result.generatedForm);
          setCreatedForm(result.form); // Store the full form object with embed code
          setCurrentStep(4);
          onFormGenerated(result.form); // Notify parent that a form was generated
        } else {
          alert(result.error || 'Failed to generate form');
        }
      } catch (error: any) {
        console.error('Form generation error:', error);
        alert(error.message || 'Failed to generate form');
      } finally {
        setIsLoading(false);
      }
    }
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

  if (isLoading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 40px' }}>
        <h2>🤖 Creating Your Form...</h2>
        <p style={{ fontSize: '18px', color: '#666', margin: '16px 0 32px 0' }}>
          Our AI is analyzing your website and generating the perfect form.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <span style={{ fontSize: '16px', color: '#666' }}>This usually takes 10-15 seconds...</span>
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

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
        <span>Preview</span>
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
        <Step2PurposeInput formData={formData} onNext={handleNext} onBack={handleBack} />
      )}
      
      {currentStep === 3 && (
        <Step3DestinationInput formData={formData} onNext={handleNext} onBack={handleBack} />
      )}
      
      {currentStep === 4 && generatedForm && createdForm && (
        <Step4FinalPreview 
          generatedForm={generatedForm}
          createdForm={createdForm}
          onGoToDashboard={handleGoToDashboard}
        />
      )}
    </div>
  );
};