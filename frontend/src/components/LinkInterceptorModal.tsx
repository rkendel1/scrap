import React from 'react';

interface LinkInterceptorModalProps {
  show: boolean;
  onClose: () => void;
  linkHref: string;
}

export const LinkInterceptorModal: React.FC<LinkInterceptorModalProps> = ({ show, onClose, linkHref }) => {
  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        textAlign: 'center'
      }}>
        <h3 style={{ marginBottom: '16px', color: '#333' }}>Preview Mode Link</h3>
        <p style={{ marginBottom: '24px', color: '#666' }}>
          In this preview, links are intercepted. When your form is live, this link will navigate to:
          <br />
          <strong style={{ wordBreak: 'break-all' }}>{linkHref}</strong>
        </p>
        <button
          onClick={onClose}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Got It
        </button>
      </div>
    </div>
  );
};