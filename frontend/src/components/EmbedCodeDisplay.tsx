import React, { useState, useEffect } from 'react';
import { SaaSForm, User } from '../types/api';

interface EmbedCodeDisplayProps {
  form: SaaSForm;
  user: User;
  onBack: () => void;
}

export const EmbedCodeDisplay: React.FC<EmbedCodeDisplayProps> = ({ form, user, onBack }) => {
  // Removed embedToken and expiresIn states as they are no longer used for the script tag
  const [allowedDomains, setAllowedDomains] = useState<string[]>(form.allowed_domains || []);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [domainSaving, setDomainSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  // Fetch initial domains
  useEffect(() => {
    const fetchEmbedData = async () => {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      console.log('EmbedCodeDisplay: Initializing fetchEmbedData for form', form.id);
      try {
        // Fetch form again to get latest allowed_domains and is_live status
        const formResponse = await fetch(`${API_BASE}/api/forms/${form.id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        const formResult = await formResponse.json();
        if (formResult.success) {
          const fetchedForm = formResult.data;
          setAllowedDomains(fetchedForm.allowed_domains || []);
        } else {
          throw new Error(formResult.message || 'Failed to fetch form details');
        }
      } catch (err: any) {
        console.error('EmbedCodeDisplay: Error in fetchEmbedData:', err);
        setError(err.message || 'Failed to load embed data.');
      } finally {
        setLoading(false);
      }
    };

    fetchEmbedData();
  }, [form.id, user.id, user.subscription_status]);

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;
    const domainToAdd = newDomain.trim().toLowerCase();
    if (allowedDomains.includes(domainToAdd)) {
      setError('Domain already added.');
      return;
    }

    const updatedDomains = [...allowedDomains, domainToAdd];
    await updateAllowedDomains(updatedDomains);
    setNewDomain('');
  };

  const handleRemoveDomain = async (domainToRemove: string) => {
    const updatedDomains = allowedDomains.filter(d => d !== domainToRemove);
    await updateAllowedDomains(updatedDomains);
  };

  const updateAllowedDomains = async (domains: string[]) => {
    setDomainSaving(true);
    setError(null);
    setSuccessMessage(null);
    console.log('EmbedCodeDisplay: Updating allowed domains for form', form.id, 'to:', domains);
    try {
      const response = await fetch(`${API_BASE}/api/forms/${form.id}/allowed-domains`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ allowedDomains: domains })
      });
      const result = await response.json();
      if (result.success) {
        setAllowedDomains(domains);
        setSuccessMessage('Allowed domains updated successfully!');
        console.log('EmbedCodeDisplay: Allowed domains updated successfully.');
      } else {
        throw new Error(result.message || 'Failed to update domains');
      }
    } catch (err: any) {
      console.error('EmbedCodeDisplay: Error updating allowed domains:', err);
      setError(err.message || 'Failed to update allowed domains.');
    } finally {
      setDomainSaving(false);
    }
  };

  // New simplified script embed code
  const scriptEmbedCode = form.embed_code
    ? `<script src="${API_BASE}/embed.js" data-form="${form.embed_code}"></script>`
    : '<!-- Form embed code not available. -->';

  const iframeEmbedCode = `<iframe src="${API_BASE}/embed.html?code=${form.embed_code}" width="100%" height="500" frameborder="0" style="border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"></iframe>`;

  // The button to regenerate token is removed as there's no token in the script tag anymore.
  // The logic for `canGenerateToken` is also simplified as it's not directly tied to the script tag.

  if (loading) {
    return (
      <div className="card">
        <div className="loading">Loading embed details...</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <button onClick={onBack} className="btn btn-secondary" style={{ marginRight: '16px' }}>
          ← Back to Dashboard
        </button>
        <div>
          <h2>📋 Embed Code for "{form.form_name}"</h2>
          <p style={{ margin: 0, color: '#666' }}>
            Integrate your AI-generated form seamlessly into any website.
          </p>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '16px' }}>
          {error}
        </div>
      )}
      {successMessage && (
        <div className="success-message" style={{ marginBottom: '16px' }}>
          {successMessage}
        </div>
      )}

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '16px' }}>JavaScript Embed (Recommended)</h3>
        <p style={{ color: '#666', marginBottom: '12px' }}>
          This method loads your form dynamically and applies domain restrictions.
        </p>
        <div className="code-block" style={{ marginBottom: '16px' }}>
          {scriptEmbedCode}
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(scriptEmbedCode)}
          className="btn btn-secondary"
          disabled={!form.embed_code}
        >
          Copy Code
        </button>
        {!form.is_live && (
          <p className="error-message" style={{ marginTop: '8px' }}>
            This form is not live. Please activate it in the dashboard for the embed code to function.
          </p>
        )}
        {user.subscription_status !== 'active' && (
          <p className="error-message" style={{ marginTop: '8px' }}>
            Your subscription is not active. Please reactivate it for the embed code to function.
          </p>
        )}
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '16px' }}>Allowed Domains</h3>
        <p style={{ color: '#666', marginBottom: '12px' }}>
          Specify which domains are permitted to embed this form. Use `*.example.com` for subdomains.
          If no domains are listed, the form can be embedded anywhere.
        </p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Add new domain (e.g., example.com or *.sub.com)"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddDomain();
              }
            }}
            disabled={domainSaving}
          />
          <button onClick={handleAddDomain} disabled={domainSaving} className="btn btn-primary">
            {domainSaving ? 'Adding...' : 'Add Domain'}
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {allowedDomains.length === 0 ? (
            <p style={{ color: '#888' }}>No domain restrictions currently. Form can be embedded anywhere.</p>
          ) : (
            allowedDomains.map((domain, index) => (
              <span
                key={index}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: '#e9ecef',
                  borderRadius: '4px',
                  padding: '6px 10px',
                  fontSize: '14px',
                  color: '#333'
                }}
              >
                {domain}
                <button
                  onClick={() => handleRemoveDomain(domain)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc3545',
                    marginLeft: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    lineHeight: '1',
                    padding: 0
                  }}
                  disabled={domainSaving}
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      <details style={{ marginBottom: '24px', border: '1px solid #e1e5e9', borderRadius: '8px', padding: '16px', backgroundColor: '#f8f9fa' }}>
        <summary style={{ fontWeight: 'bold', cursor: 'pointer', color: '#dc3545' }}>
          Legacy Iframe Embed (Not Recommended)
        </summary>
        <div style={{ marginTop: '16px' }}>
          <p style={{ color: '#666', marginBottom: '12px' }}>
            This method is less secure as it does not support domain restrictions or token expiration. Use with caution.
          </p>
          <div className="code-block" style={{ marginBottom: '16px' }}>
            {iframeEmbedCode}
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(iframeEmbedCode)}
            className="btn btn-secondary"
          >
            Copy Code
          </button>
        </div>
      </details>
    </div>
  );
};