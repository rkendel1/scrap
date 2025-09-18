import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { EmbeddableForm } from './EmbeddableForm';

interface FormBuilderProps {
  onFormGenerated: (form: any) => void;
  user?: any;
  guestToken?: string;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({ 
  onFormGenerated, 
  user,
  guestToken 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedForm, setGeneratedForm] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const formPurposes = [
    'Lead Generation',
    'Contact Form',
    'Newsletter Signup',
    'Survey/Feedback',
    'Event Registration',
    'Support Request',
    'Quote Request',
    'Demo Request',
    'Consultation Booking',
    'Custom Purpose'
  ];

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
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
        setShowPreview(true);
        onFormGenerated(result.form);
      } else {
        alert(result.error || 'Failed to generate form');
        
        if (result.upgradeRequired) {
          // Show upgrade prompt
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

  const handlePreviewSubmit = (data: any) => {
    console.log('Preview form submission:', data);
    alert('This is a preview - form data logged to console');
  };

  if (showPreview && generatedForm) {
    return (
      <div className="card">
        <div style={{ marginBottom: '24px' }}>
          <h2>🎉 Your AI-Generated Form is Ready!</h2>
          <p>Here's how your form will look to visitors:</p>
        </div>

        <div style={{ 
          border: '2px dashed #e1e5e9',
          borderRadius: '8px',
          padding: '24px',
          backgroundColor: '#f8f9fa',
          marginBottom: '24px'
        }}>
          <EmbeddableForm 
            form={generatedForm} 
            embedCode="preview-mode"
            showBranding={user?.subscription_tier !== 'paid'}
            onSubmit={handlePreviewSubmit}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button 
            onClick={() => setShowPreview(false)}
            className="btn btn-secondary"
          >
            ← Create Another Form
          </button>
          <button 
            onClick={() => {
              // Navigate to dashboard or show embed code
              console.log('Navigating to dashboard...');
            }}
            className="btn btn-primary"
          >
            Go to Dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>🚀 Create Your AI-Powered Form</h2>
      <p>Generate a custom form that perfectly matches any website's design and tone using AI.</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label htmlFor="url" className="form-label">
            Target Website URL
          </label>
          <input
            id="url"
            type="url"
            className={`form-input ${errors.url ? 'error' : ''}`}
            placeholder="https://example.com"
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
          <small style={{ color: '#666', fontSize: '12px' }}>
            We'll analyze this website to match your form's design and tone
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="formPurpose" className="form-label">
            Form Purpose
          </label>
          <select
            id="formPurpose"
            className={`form-input ${errors.formPurpose ? 'error' : ''}`}
            {...register('formPurpose', {
              required: 'Please select a form purpose'
            })}
          >
            <option value="">Select purpose for your form</option>
            {formPurposes.map((purpose) => (
              <option key={purpose} value={purpose}>
                {purpose}
              </option>
            ))}
          </select>
          {errors.formPurpose && (
            <span className="error-message">{errors.formPurpose.message as string}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="formName" className="form-label">
            Form Name
          </label>
          <input
            id="formName"
            type="text"
            className="form-input"
            placeholder="e.g., Contact Form, Lead Capture"
            {...register('formName')}
          />
          <small style={{ color: '#666', fontSize: '12px' }}>
            Optional - AI will generate a name if left blank
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="formDescription" className="form-label">
            Form Description (Optional)
          </label>
          <textarea
            id="formDescription"
            className="form-input"
            placeholder="Additional context about what this form is for..."
            rows={3}
            {...register('formDescription')}
          />
        </div>

        {!user && (
          <div style={{
            padding: '16px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            marginBottom: '16px'
          }}>
            <div style={{ fontWeight: '500', marginBottom: '4px' }}>
              🎯 Creating as Guest
            </div>
            <div style={{ fontSize: '14px', color: '#856404' }}>
              Sign up after creating your form to manage it, get analytics, and unlock premium features.
            </div>
          </div>
        )}

        {user?.subscription_tier === 'free' && (
          <div style={{
            padding: '16px',
            backgroundColor: '#e3f2fd',
            border: '1px solid #bbdefb',
            borderRadius: '4px',
            marginBottom: '16px'
          }}>
            <div style={{ fontWeight: '500', marginBottom: '4px' }}>
              📊 Free Tier - 1 Live Form
            </div>
            <div style={{ fontSize: '14px', color: '#1565c0' }}>
              Upgrade to Pro for unlimited forms, premium connectors, and analytics.
            </div>
          </div>
        )}

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isLoading}
          style={{ width: '100%' }}
        >
          {isLoading ? (
            <>
              <span>🤖 AI is analyzing website and generating form...</span>
            </>
          ) : (
            'Generate AI Form ✨'
          )}
        </button>
      </form>

      <div style={{ 
        marginTop: '24px', 
        padding: '16px', 
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        <div style={{ fontWeight: '500', marginBottom: '8px' }}>
          🎨 What our AI does:
        </div>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#666' }}>
          <li>Analyzes the target website's design tokens and brand colors</li>
          <li>Extracts voice, tone, and messaging patterns</li>
          <li>Generates form fields optimized for your purpose</li>
          <li>Creates copy that matches the website's personality</li>
          <li>Applies consistent styling and branding</li>
        </ul>
      </div>
    </div>
  );
};