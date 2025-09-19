import React, { useState } from 'react';
import { GeneratedForm, FormField } from '../types/api';
import { LinkInterceptorModal } from './LinkInterceptorModal'; // New import
import { autoLinkText } from '../utils/autoLinkText'; // New import

interface EmbeddableFormProps {
  form: GeneratedForm;
  embedCode: string;
  showBranding?: boolean;
  onSubmit?: (data: any) => void;
}

export const EmbeddableForm: React.FC<EmbeddableFormProps> = ({ 
  form, 
  embedCode, 
  showBranding = true,
  onSubmit 
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for link interception modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [modalLinkHref, setModalLinkHref] = useState('');

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (onSubmit) {
        onSubmit(formData);
      } else {
        // Submit to API
        const response = await fetch(`/api/forms/submit/${embedCode}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const result = await response.json();
        
        if (result.success) {
          setSubmitted(true);
        } else {
          setError(result.message || 'Failed to submit form');
        }
      }
    } catch (err) {
      setError('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const fieldId = `field-${field.name}`;
    const value = formData[field.name] || '';

    const baseStyles = {
      width: '100%',
      padding: '10px',
      border: `1px solid #ddd`,
      borderRadius: form.styling.borderRadius || '4px',
      fontSize: '14px',
      fontFamily: form.styling.fontFamily || 'inherit',
      marginBottom: '6px',
      color: form.styling.textColor || '#333', // Use textColor
    };

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={fieldId}
            name={field.name}
            placeholder={field.placeholder}
            required={field.required}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            style={{
              ...baseStyles,
              minHeight: '80px',
              resize: 'vertical'
            }}
          />
        );

      case 'select':
        return (
          <select
            id={fieldId}
            name={field.name}
            required={field.required}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            style={baseStyles}
          >
            <option value="">{field.placeholder || 'Select an option'}</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div style={{ marginBottom: '6px' }}>
            {field.options?.map((option, index) => (
              <label key={index} style={{ display: 'block', marginBottom: '3px', color: form.styling.textColor || '#333' }}>
                <input
                  type="checkbox"
                  name={field.name}
                  value={option}
                  checked={(value as string[])?.includes(option) || false}
                  onChange={(e) => {
                    const currentValues = (value as string[]) || [];
                    if (e.target.checked) {
                      handleInputChange(field.name, [...currentValues, option]);
                    } else {
                      handleInputChange(field.name, currentValues.filter(v => v !== option));
                    }
                  }}
                  style={{ marginRight: '8px' }}
                />
                {option}
              </label>
            ))}
          </div>
        );

      case 'radio':
        return (
          <div style={{ marginBottom: '6px' }}>
            {field.options?.map((option, index) => (
              <label key={index} style={{ display: 'block', marginBottom: '3px', color: form.styling.textColor || '#333' }}>
                <input
                  type="radio"
                  name={field.name}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  style={{ marginRight: '8px' }}
                />
                {option}
              </label>
            ))}
          </div>
        );

      default:
        return (
          <input
            id={fieldId}
            type={field.type}
            name={field.name}
            placeholder={field.placeholder}
            required={field.required}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            style={baseStyles}
          />
        );
    }
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A' && target.classList.contains('preview-link')) {
      e.preventDefault(); // Prevent actual navigation
      setModalLinkHref(target.getAttribute('href') || '');
      setShowLinkModal(true);
    }
  };

  if (submitted) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: form.styling.backgroundColor || '#fff',
        borderRadius: form.styling.borderRadius || '8px',
        fontFamily: form.styling.fontFamily || 'system-ui',
        textAlign: 'center' as const,
        border: '1px solid #e1e5e9',
        maxWidth: form.styling.maxWidth || '250px', // Changed from '100%' to '250px'
        width: '100%',
        margin: '0 auto',
        maxHeight: '100%',
        overflowY: 'auto',
        color: form.styling.textColor || '#333', // Use textColor
      }}>
        <div style={{ 
          color: form.styling.primaryColor || '#28a745',
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '6px'
        }}>
          ✓ Thank You!
        </div>
        <p 
          style={{ margin: 0, color: form.styling.textColor || '#666', fontSize: '13px' }} // Use textColor
          dangerouslySetInnerHTML={{ __html: autoLinkText(form.thankYouMessage) }}
          onClick={handleLinkClick}
        />
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: form.styling.backgroundColor || '#fff',
      padding: '16px',
      borderRadius: form.styling.borderRadius || '8px',
      fontFamily: form.styling.fontFamily || 'system-ui',
      border: '1px solid #e1e5e9',
      maxWidth: form.styling.maxWidth || '250px', // Changed from '100%' to '250px'
      width: '100%',
      margin: '0 auto',
      maxHeight: '100%',
      overflowY: 'auto',
      color: form.styling.textColor || '#333', // Use textColor
    }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ 
          margin: '0 0 6px 0',
          color: form.styling.textColor || '#333', // Use textColor
          fontSize: '18px'
        }}>
          {form.title}
        </h3>
        {form.description && (
          <p 
            style={{ 
              margin: 0,
              color: form.styling.textColor || '#666', // Use textColor
              fontSize: '13px'
            }}
            dangerouslySetInnerHTML={{ __html: autoLinkText(form.description) }}
            onClick={handleLinkClick}
          />
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {form.fields.map((field, index) => (
          <div key={index} style={{ marginBottom: '12px' }}>
            <label 
              htmlFor={`field-${field.name}`}
              style={{
                display: 'block',
                marginBottom: '3px',
                fontSize: '13px',
                fontWeight: '500',
                color: form.styling.textColor || '#333' // Use textColor
              }}
            >
              {field.label}
              {field.required && (
                <span style={{ color: '#dc3545', marginLeft: '2px' }}>*</span>
              )}
            </label>
            {renderField(field)}
          </div>
        ))}

        {error && (
          <div style={{
            padding: '10px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '4px',
            marginBottom: '12px',
            fontSize: '13px'
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            backgroundColor: form.styling.buttonBackgroundColor || form.styling.primaryColor || '#007bff', // Use buttonBackgroundColor
            color: form.styling.buttonTextColor || 'white', // Use buttonTextColor
            padding: '10px 20px',
            border: form.styling.buttonBorder || 'none', // Use buttonBorder
            borderRadius: form.styling.borderRadius || '4px',
            fontSize: '15px',
            fontWeight: '500',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1,
            width: '100%',
            fontFamily: form.styling.fontFamily || 'inherit'
          }}
        >
          {isSubmitting ? 'Submitting...' : form.ctaText}
        </button>
      </form>

      

      <LinkInterceptorModal
        show={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        linkHref={modalLinkHref}
      />
    </div>
  );
};