import React, { useState, useEffect } from 'react';
import './App.css';
import { UrlForm } from './components/UrlForm';
import { RecordsTable } from './components/RecordsTable';
import { ConversationalFormBuilder } from './components/ConversationalFormBuilder'; // Updated import
import { LoginForm, RegisterForm } from './components/AuthForms';
import { ConnectorManager } from './components/ConnectorManager';
import { LiveFormPreview } from './components/LiveFormPreview';
import { FormAnalytics } from './components/FormAnalytics'; // New import
import { FormEditor } from './components/FormEditor'; // New import
import { EmbedCodeDisplay } from './components/EmbedCodeDisplay'; // New import
import { SubscriptionManager } from './components/SubscriptionManager'; // New import
import { FormDashboard } from './components/FormDashboard'; // New import
import { FormTemplates } from './components/FormTemplates'; // New import
import { apiService } from './services/api';
import { FormRecord, User, SaaSForm, FormData, GeneratedForm, ApiResponse } from './types/api'; // Import ApiResponse

function App() {
  const [records, setRecords] = useState<FormRecord[]>([]);
  const [forms, setForms] = useState<SaaSForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [currentView, setCurrentView] = useState<'builder' | 'legacy' | 'dashboard' | 'form-manage' | 'analytics' | 'form-editor' | 'embed-code-display' | 'subscription' | 'templates'>('builder'); // Added 'templates'
  const [selectedForm, setSelectedForm] = useState<SaaSForm | null>(null); // Changed from selectedFormId to selectedForm

  // State for the conversational builder's internal data, passed to LiveFormPreview
  const [builderState, setBuilderState] = useState<{ 
    formData: Partial<FormData>; 
    generatedForm: GeneratedForm | null; 
    createdForm: SaaSForm | null;
    extractedDesignTokens: any | null;
    extractedVoiceAnalysis: any | null;
    isDestinationConfigured: boolean;
    isGeneratingForm: boolean; // New: Indicate if form generation is in progress
  }>({
    formData: {},
    generatedForm: null,
    createdForm: null,
    extractedDesignTokens: null,
    extractedVoiceAnalysis: null,
    isDestinationConfigured: false,
    isGeneratingForm: false, // Initialize to false
  });

  // Initialize authentication on app load
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');
    const savedGuestToken = localStorage.getItem('guestToken');

    if (savedToken && savedUser) {
      setAuthToken(savedToken);
      setUser(JSON.parse(savedUser));
    } else if (!savedGuestToken) {
      // Create guest token for anonymous users
      createGuestToken();
    } else {
      setGuestToken(savedGuestToken);
    }

    setLoading(false);
  }, []);

  // Fetch user's forms when authenticated
  useEffect(() => {
    if (user && authToken) {
      fetchUserForms();
    }
  }, [user, authToken]);

  const createGuestToken = async () => {
    try {
      const response = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      
      if (result.success) {
        setGuestToken(result.guestToken);
        localStorage.setItem('guestToken', result.guestToken);
      }
    } catch (error) {
      console.error('Failed to create guest token:', error);
    }
  };

  const fetchUserForms = async () => {
    if (!authToken) return;
    
    try {
      const response = await fetch('/api/forms', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const result = await response.json();
      
      if (response.ok) { // Check response.ok for 2xx status codes
        setForms(result.data);
      } else {
        // If fetching forms fails, it might be due to an expired token.
        // Log out the user in this case.
        if (response.status === 403 || response.status === 401) {
          console.warn('Auth token expired or invalid, logging out.');
          handleLogout();
        }
        setError(result.error || 'Failed to fetch forms');
      }
    } catch (error: any) {
      console.error('Failed to fetch forms:', error);
      setError('Failed to fetch forms. Please try again.');
    }
  };

  const handleLogin = (userData: User, token: string) => {
    setUser(userData);
    setAuthToken(token);
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.removeItem('guestToken'); // Clear guest token
    setShowAuth(false);
  };

  const handleLogout = () => {
    setUser(null);
    setAuthToken(null);
    setForms([]);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    // Preserve existing guest token if it exists, otherwise create a new one.
    const existingGuestToken = localStorage.getItem('guestToken');
    if (existingGuestToken) {
      setGuestToken(existingGuestToken);
    } else {
      createGuestToken(); // This will fetch a new one from the backend and save to localStorage
    }
    setShowAuth(false);
  };

  const handleAuthError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleFormGenerated = (form: SaaSForm) => {
    setForms(prev => [form, ...prev]);
    if (user) {
      setCurrentView('dashboard'); // Switch to dashboard after form generation
    }
  };

  const handleManageForm = (form: SaaSForm) => {
    setSelectedForm(form);
    setCurrentView('form-manage');
  };

  // MODIFIED: This now navigates to the EmbedCodeDisplay component
  const handleGetEmbedCodeClick = (form: SaaSForm) => {
    setSelectedForm(form);
    setCurrentView('embed-code-display'); // Navigate to the new embed code display view
  };

  const handleShowAnalytics = (form: SaaSForm) => {
    setSelectedForm(form);
    setCurrentView('analytics');
  };

  const handleEditForm = (form: SaaSForm) => {
    setSelectedForm(form);
    setCurrentView('form-editor'); // Navigate to the new form editor
  };

  const handleFormEditorSave = (updatedForm: SaaSForm) => {
    setForms(prevForms => 
      prevForms.map(f => f.id === updatedForm.id ? updatedForm : f)
    );
    setSelectedForm(updatedForm); // Update selected form with new config
    setCurrentView('dashboard'); // Go back to dashboard
    setError(null);
  };

  const handleBackToDashboard = () => {
    setSelectedForm(null);
    setCurrentView('dashboard');
    setError(null); // Clear any previous errors when navigating back
    fetchUserForms(); // Refresh forms list after returning to dashboard
  };

  const handleDuplicateForm = async (form: SaaSForm) => {
    if (!authToken) {
      setError('You must be logged in to duplicate forms.');
      return;
    }

    try {
      const response = await fetch(`/api/forms/${form.id}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      const result: ApiResponse<SaaSForm> = await response.json();

      if (result.success && result.data) {
        setForms(prevForms => [result.data!, ...prevForms]);
        setError(null);
      } else {
        setError(result.message || 'Failed to duplicate form.');
      }
    } catch (err: any) {
      console.error('Duplicate form error:', err);
      setError(err.message || 'Failed to duplicate form. Please try again.');
    }
  };

  const handleDeleteForm = async (form: SaaSForm) => {
    if (!authToken) {
      setError('You must be logged in to delete forms.');
      return;
    }

    try {
      const response = await fetch(`/api/forms/${form.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      const result: ApiResponse<void> = await response.json();

      if (result.success) {
        setForms(prevForms => prevForms.filter(f => f.id !== form.id));
        setError(null);
      } else {
        setError(result.message || 'Failed to delete form.');
      }
    } catch (err: any) {
      console.error('Delete form error:', err);
      setError(err.message || 'Failed to delete form. Please try again.');
    }
  };

  const handleUpdateFormTags = async (formId: number, tags: string[]) => {
    if (!authToken) {
      setError('You must be logged in to update form tags.');
      return;
    }

    try {
      const response = await fetch(`/api/forms/${formId}/tags`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tags })
      });
      const result: ApiResponse<{ tags: string[] }> = await response.json();

      if (result.success) {
        setForms(prevForms => 
          prevForms.map(form => 
            form.id === formId ? { ...form, tags } : form
          )
        );
        setError(null);
      } else {
        setError(result.message || 'Failed to update form tags.');
      }
    } catch (err: any) {
      console.error('Update form tags error:', err);
      setError(err.message || 'Failed to update form tags. Please try again.');
    }
  };

  const handleSelectTemplate = (generatedForm: GeneratedForm) => {
    // Set the builder state with the template
    setBuilderState(prev => ({
      ...prev,
      generatedForm,
      isGeneratingForm: false
    }));
    setCurrentView('builder');
  };

  const handleDeleteRecord = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      const response = await apiService.deleteRecord(id);
      if (response.success) {
        setRecords(prev => prev.filter(record => record.id !== id));
      } else {
        alert(response.error || 'Failed to delete record');
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(error.response?.data?.message || error.message || 'Failed to delete record');
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchRecords();
  };

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = searchQuery
        ? await apiService.searchRecords(searchQuery)
        : await apiService.getAllRecords();
      
      if (response.success && response.data) {
        setRecords(response.data);
      } else {
        setError(response.error || 'Failed to fetch records');
      }
    } catch (err: any) {
      console.error('Failed to fetch records:', err);
      setError('Failed to fetch records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentView === 'legacy') {
      fetchRecords();
    }
  }, [currentView]);

  // Debounced search for legacy view
  useEffect(() => {
    if (currentView === 'legacy') {
      const timeoutId = setTimeout(() => {
        fetchRecords();
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, currentView]);

  const handleToggleFormLive = async (formId: number) => {
    if (!authToken) {
      setError('You must be logged in to change form status.');
      return;
    }

    try {
      const response = await fetch(`/api/forms/${formId}/toggle-live`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      const result: ApiResponse<{ isLive: boolean; message?: string }> = await response.json();

      if (result.success) {
        setForms(prevForms => 
          prevForms.map(form => {
            if (form.id === formId) {
              return { ...form, is_live: result.data!.isLive };
            }
            // If a free user activated a new form, other forms might have been deactivated
            // We need to update their status too.
            if (user?.subscription_tier === 'free' && result.data!.isLive && form.is_live) {
              return { ...form, is_live: false };
            }
            return form;
          })
        );
        setError(result.data?.message || null); // Display message from backend
      } else {
        setError(result.message || 'Failed to toggle form status.');
      }
    } catch (err: any) {
      console.error('Toggle form live error:', err);
      setError(err.message || 'Failed to toggle form status. Please try again.');
    }
  };

  const handleShowAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuth(true);
  };

  if (loading) {
    return (
      <div className="App">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="header">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div className="logo">
              <div className="logo-icon">F</div>
              FormCraft AI
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {user ? (
                <>
                  {/* Authenticated user's main actions */}
                  <button 
                    onClick={() => setCurrentView('builder')} 
                    className="btn btn-secondary btn-header-small"
                  >
                    ✨ New Form
                  </button>
                  <button 
                    onClick={() => setCurrentView('templates')} 
                    className="btn btn-secondary btn-header-small"
                  >
                    📋 Templates
                  </button>
                  <button 
                    onClick={() => setCurrentView('dashboard')} 
                    className="btn btn-secondary btn-header-small"
                  >
                    📊 My Forms
                  </button>
                  <button 
                    onClick={() => setCurrentView('subscription')} 
                    className="btn btn-secondary btn-header-small"
                  >
                    💳 Subscription
                  </button>
                  <span style={{ fontSize: '14px', color: '#666' }}>
                    Welcome, {user.first_name || user.email}
                    {user.subscription_tier === 'paid' && (
                      <span style={{ 
                        marginLeft: '8px', 
                        padding: '2px 8px', 
                        backgroundColor: '#10b981', /* Green for PRO */
                        color: 'white', 
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        PRO
                      </span>
                    )}
                  </span>
                  <button onClick={handleLogout} className="btn btn-secondary btn-header-small">
                    Sign Out
                  </button>
                </>
              ) : (
                null // No main actions for guest here, they go to utility
              )}
              {/* Utility actions, always on the far right */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: user ? '12px' : 'auto' }}>
                <a 
                  href="/test-embed.html" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-secondary btn-header-small"
                >
                  🧪 Test Embed Page
                </a>
                {!user && ( // Only show Sign In/Register if not authenticated
                  <button onClick={() => setShowAuth(true)} className="btn btn-secondary btn-header-small">
                    Sign In / Register
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Error Message - now fixed at the top */}
      {error && (
        <div className="fixed-error-alert">
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            className="dismiss-btn"
          >
            Dismiss
          </button>
        </div>
      )}

      <main className="container">
        {/* Main Content */}
        {currentView === 'builder' ? (
          <div className="builder-layout"> {/* New wrapper div */}
            <div className="builder-column"> {/* Left column for builder */}
              <ConversationalFormBuilder 
                onFormGenerated={handleFormGenerated}
                user={user}
                guestToken={guestToken || undefined}
                onStateChange={setBuilderState} // Pass state update callback
                onGetEmbedCodeClick={handleGetEmbedCodeClick} // Pass the new handler
                onShowAuth={handleShowAuth} // Pass the new handler
              />
            </div>
            <div className="preview-column"> {/* Right column for live preview */}
              <LiveFormPreview
                className="card live-preview-card" // Apply card class
                formData={builderState.formData}
                generatedForm={builderState.generatedForm}
                createdForm={builderState.createdForm}
                user={user}
                extractedDesignTokens={builderState.extractedDesignTokens} // Pass new state
                extractedVoiceAnalysis={builderState.extractedVoiceAnalysis} // Pass new state
                onGetEmbedCodeClick={handleGetEmbedCodeClick} // Pass the new handler
                isDestinationConfigured={builderState.isDestinationConfigured} // Pass new state
                isGeneratingForm={builderState.isGeneratingForm} // New: Pass isGeneratingForm
                // The embed code section in LiveFormPreview is now controlled by its internal state
                // and the onGetEmbedCodeClick from builder will trigger a view change instead.
                // So, we don't need to pass showEmbedCodeSection or onToggleEmbedCodeSection here.
              />
            </div>
          </div>
        ) : currentView === 'dashboard' && user ? (
          <FormDashboard
            forms={forms}
            user={user}
            onCreateForm={() => setCurrentView('builder')}
            onShowTemplates={() => setCurrentView('templates')}
            onManageForm={handleManageForm}
            onEditForm={handleEditForm}
            onGetEmbedCode={handleGetEmbedCodeClick}
            onShowAnalytics={handleShowAnalytics}
            onToggleFormLive={handleToggleFormLive}
            onDuplicateForm={handleDuplicateForm}
            onDeleteForm={handleDeleteForm}
            onUpdateFormTags={handleUpdateFormTags}
          />
        ) : currentView === 'form-manage' && user && selectedForm ? (
          <div>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                <button 
                  onClick={handleBackToDashboard}
                  className="btn btn-secondary"
                  style={{ marginRight: '16px' }}
                >
                  ← Back to Dashboard
                </button>
                <div>
                  <h2>🔌 Connector Management</h2>
                  <p style={{ margin: 0, color: '#6b7280' }}>
                    Configure where form submissions should be sent
                  </p>
                </div>
              </div>
              
              <ConnectorManager 
                formId={selectedForm.id} // Use selectedForm.id
                userEmail={user.email} // Pass user's email here
                onSave={() => {
                  // Optionally refresh forms list or show success message
                  console.log('Connectors saved successfully');
                }}
              />
            </div>
          </div>
        ) : currentView === 'analytics' && user && selectedForm ? (
          <FormAnalytics 
            form={selectedForm} 
            user={user} 
            onBack={handleBackToDashboard} 
          />
        ) : currentView === 'form-editor' && user && selectedForm ? (
          <FormEditor
            form={selectedForm}
            onSaveSuccess={handleFormEditorSave}
            onCancel={handleBackToDashboard}
          />
        ) : currentView === 'embed-code-display' && user && selectedForm ? ( // New view for embed code
          <EmbedCodeDisplay
            form={selectedForm}
            user={user}
            onBack={handleBackToDashboard}
          />
        ) : currentView === 'subscription' && user ? ( // New subscription view
          <SubscriptionManager />
        ) : currentView === 'templates' ? ( // New templates view
          <FormTemplates
            onSelectTemplate={handleSelectTemplate}
            onBack={() => setCurrentView(user ? 'dashboard' : 'builder')}
          />
        ) : currentView === 'legacy' ? (
          <>
            {/* URL Input Form */}
            <UrlForm onExtractSuccess={fetchRecords} />

            {/* Search Bar */}
            <div className="card search-bar">
              <form onSubmit={handleSearch}>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label htmlFor="search" className="form-label">
                    Search Records
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input
                      id="search"
                      type="text"
                      className="form-input"
                      placeholder="Search by URL, title, or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary">
                      Search
                    </button>
                    {searchQuery && (
                      <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={() => setSearchQuery('')}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="loading">
                Loading records...
              </div>
            )}

            {/* Records Table */}
            {!loading && !error && (
              <RecordsTable
                records={records}
                onDeleteRecord={handleDeleteRecord}
                onRefresh={fetchRecords}
              />
            )}
          </>
        ) : null}
      </main>

      {/* Auth Modal - Moved outside of <main> */}
      {showAuth && (
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
          zIndex: 9999 // High z-index to cover everything
        }}>
          <div className="card" style={{
            maxWidth: '400px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button 
                onClick={() => setShowAuth(false)}
                style={{ 
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            
            {authMode === 'login' ? (
              <LoginForm
                onSuccess={handleLogin}
                onSwitchToRegister={() => setAuthMode('register')}
                onError={handleAuthError}
              />
            ) : (
              <RegisterForm
                onSuccess={handleLogin}
                onSwitchToLogin={() => setAuthMode('login')}
                onError={handleAuthError}
                guestToken={guestToken || undefined}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;