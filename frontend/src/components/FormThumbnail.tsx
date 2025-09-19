import React from 'react';
import { SaaSForm } from '../types/api';

interface FormThumbnailProps {
  form: SaaSForm;
}

export const FormThumbnail: React.FC<FormThumbnailProps> = ({ form }) => {
  const { generated_form } = form;
  if (!generated_form) {
    return (
      <div
        style={{
          width: '100px',
          height: '80px',
          backgroundColor: '#e9ecef',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          color: '#6c757d',
          flexShrink: 0,
          overflow: 'hidden',
          border: '1px solid #dee2e6',
        }}
      >
        No Preview
      </div>
    );
  }

  const { title, fields, styling } = generated_form;
  const primaryColor = styling?.primaryColor || '#007bff';
  const backgroundColor = styling?.backgroundColor || '#ffffff';
  const borderRadius = styling?.borderRadius || '4px';
  const fontFamily = styling?.fontFamily || 'system-ui';

  const firstField = fields?.[0];

  return (
    <div
      style={{
        width: '100px',
        height: '80px',
        backgroundColor: backgroundColor,
        borderRadius: borderRadius,
        border: '1px solid #e1e5e9',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        padding: '8px',
        fontSize: '8px',
        fontFamily: fontFamily,
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontSize: '9px',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '4px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {title || 'Form Title'}
      </div>
      {firstField && (
        <div style={{ marginBottom: '4px' }}>
          <div style={{ fontSize: '7px', color: '#666', marginBottom: '2px' }}>
            {firstField.label || 'Field Label'}
          </div>
          <div
            style={{
              backgroundColor: '#f0f2f5',
              border: '1px solid #ced4da',
              borderRadius: '2px',
              height: '10px',
              width: '100%',
            }}
          ></div>
        </div>
      )}
      <button
        style={{
          backgroundColor: primaryColor,
          color: 'white',
          padding: '3px 6px',
          borderRadius: '2px',
          fontSize: '7px',
          fontWeight: 'bold',
          border: 'none',
          position: 'absolute',
          bottom: '8px',
          left: '8px',
          right: '8px',
          textAlign: 'center',
        }}
      >
        {generated_form.ctaText || 'Submit'}
      </button>
    </div>
  );
};