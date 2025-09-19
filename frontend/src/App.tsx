import React, { useState, useEffect } from 'react';
import './App.css';
import { UrlForm } from './components/UrlForm';
import { RecordsTable } from './components/RecordsTable';
import { ConversationalFormBuilder } from './components/ConversationalFormBuilder'; // Updated import
import { LoginForm, RegisterForm } from './components/AuthForms';
import { ConnectorManager } from './components/ConnectorManager';
import { LiveFormPreview } from './components/LiveFormPreview';
import { EmbedCodeDisplay } from './components/EmbedCodeDisplay'; // New import
import { FormAnalytics } from './components/FormAnalytics'; // New import
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
  const [currentView, setCurrentView] = useState<'builder' | 'legacy' | 'dashboard' | 'form-manage' | 'embed-code' | 'analytics'>('builder');
  const [selectedForm, setSelectedForm] = useState<SaaSForm | null>(null); // Changed from selectedFormId to selectedForm

  // State for the conversational builder's internal data, passed to LiveFormPreview
  const [builderState, setBuilderState] = useState<{ 
    formData: Partial<FormData>; 
    generatedForm: GeneratedForm | null; 
    createdForm: SaaSForm | null;
    extractedDesignTokens: any | null;
    extractedVoiceAnalysis: any | null;
    isDestinationConfigured: boolean; // Added
  }>({
    formData: {},
    generatedForm: null,
    createdForm: null,
    extractedDesignTokens: null,
    extractedVoiceAnalysis: null,
    isDestinationConfigured: false, // Initialize
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

  const handleShowEmbedCode = (form: SaaSForm) => {
    setSelectedForm(form);
    setCurrentView('embed-code');
  };

  const handleShowAnalytics = (form: SaaSForm) => {
    setSelectedForm(form);
    setCurrentView('analytics');
  };

  const handleEditForm = (form: SaaSForm) => {
    // For now, redirect to connector management as a starting point for editing
    // A full form editor would be more complex
    setSelectedForm(form);
    setCurrentView('form-manage');
    setError('The "Edit" function currently leads to connector management. A full form editor is coming soon!');
  };

  const handleBackToDashboard = () => {
    setSelectedForm(null);
    setCurrentView('dashboard');
    setError(null); // Clear any previous errors when navigating back
    fetchUserForms(); // Refresh forms list after returning to dashboard
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

  // New handler for the "Sign in to get embed code" button in LiveFormPreview
  const handleGetEmbedCodeClick = (form: SaaSForm) => {
    // Always navigate to the embed code display, regardless of user login status
    handleShowEmbedCode(form);
  };

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
      const result: ApiResponse<any> = await response.json();

      if (result.success) {
        setForms(prevForms => 
          prevForms.map(form => 
            form.id === formId ? { ...form, is_live: result.isLive } : form
          )
        );
        setError(null); // Clear any previous errors
      } else {
        setError(result.message || 'Failed to toggle form status.');
      }
    } catch (err: any) {
      console.error('Toggle form live error:', err);
      setError(err.message || 'Failed to toggle form status. Please try again.');
    }
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="logo">
              <div className="logo-icon">F</div>
              FormCraft AI
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {user ? (
                <>
                  <button 
                    onClick={() => setCurrentView('builder')} 
                    className="btn btn-secondary btn-header-small"
                  >
                    ✨ New Form
                  </button>
                  <button 
                    onClick={() => setCurrentView('dashboard')} 
                    className="btn btn-secondary btn-header-small"
                  >
                    📊 My Forms
                  </button>
                  <a 
                    href="/test-embed.html" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-secondary btn-header-small"
                  >
                    🧪 Test Embed Page
                  </a>
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
                <>
                  <a 
                    href="/test-embed.html" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-secondary btn-header-small"
                  >
                    🧪 Test Embed Page
                  </a>
                  <button onClick={() => setShowAuth(true)} className="btn btn-secondary btn-header-small">
                    Sign In / Register
                  </button>
                </>
              )}
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
          <>
            <div style={{ flex: 1, height: '100%' }}> {/* Left column for builder */}
              <ConversationalFormBuilder 
                onFormGenerated={handleFormGenerated}
                user={user}
                guestToken={guestToken || undefined}
                onStateChange={setBuilderState} // Pass state update callback
                onGetEmbedCodeClick={handleGetEmbedCodeClick} // Pass the new handler
              />
            </div>
            <div style={{ flex: 1, height: '100%' }}> {/* Right column for live preview */}
              <LiveFormPreview
                formData={builderState.formData}
                generatedForm={builderState.generatedForm}
                createdForm={builderState.createdForm}
                user={user}
                extractedDesignTokens={builderState.extractedDesignTokens} // Pass new state
                extractedVoiceAnalysis={builderState.extractedVoiceAnalysis} // Pass new state
                onGetEmbedCodeClick={handleGetEmbedCodeClick} // Pass the new handler
                isDestinationConfigured={builderState.isDestinationConfigured} // Pass new state
              />
            </div>
          </>
        ) : currentView === 'dashboard' && user ? (
          <div>
            <div className="card">
              <h2>📊 Your Forms Dashboard</h2>
              <p>Manage your AI-generated forms, view analytics, and get embed codes.</p>
              
              {forms.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p>No forms yet. Create your first AI-powered form!</p>
                  <button 
                    onClick={() => setCurrentView('builder')}
                    className="btn btn-primary"
                  >
                    Create Form
                  </button>
                </div>
              ) : (
                <div>
                  {forms.map((form) => (
                    <div key={form.id} style={{
                      border: '1px solid #e9edf5',
                      borderRadius: '12px',
                      padding: '18px',
                      marginBottom: '16px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#1a202c' }}>{form.form_name}</h4>
                          <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px' }}>
                            {form.form_description}
                          </p>
                          <div style={{ fontSize: '12px', color: '#888' }}>
                            <span>📊 {form.submissions_count} submissions</span>
                            <span style={{ margin: '0 12px' }}>•</span>
                            <span>{form.is_live ? '🟢 Live' : '🔴 Draft'}</span>
                            <span style={{ margin: '0 12px' }}>•</span>
                            <span>📅 {new Date(form.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button 
                            onClick={() => handleToggleFormLive(form.id)}
                            className={`btn ${form.is_live ? 'btn-danger' : 'btn-primary'}`}
                            style={{ fontSize: '12px' }}
                          >
                            {form.is_live ? '🔴 Deactivate' : '🟢 Activate'}
                          </button>
                          <button 
                            onClick={() => handleManageForm(form)} // Pass full form object
                            className="btn btn-secondary" 
                            style={{ fontSize: '12px' }}
                          >
                            🔌 Connectors
                          </button>
                          <button 
                            onClick={() => handleEditForm(form)} // Pass full form object
                            className="btn btn-secondary" 
                            style={{ fontSize: '12px' }}
                          >
                            ⚙️ Edit
                          </button>
                          <button 
                            onClick={() => handleShowEmbedCode(form)} // Pass full form object
                            className="btn btn-secondary" 
                            style={{ fontSize: '12px' }}
                          >
                            📋 Embed Code
                          </button>
                          <button 
                            onClick={() => handleShowAnalytics(form)} // Pass full form object
                            className="btn btn-secondary" 
                            style={{ fontSize: '12px' }}
                          >
                            📈 Analytics
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
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
                onSave={() => {
                  // Optionally refresh forms list or show success message
                  console.log('Connectors saved successfully');
                }}
              />
            </div>
          </div>
        ) : currentView === 'embed-code' && selectedForm ? ( // Removed user check here
          <EmbedCodeDisplay 
            form={selectedForm} 
            user={user} 
            onBack={handleBackToDashboard} 
          />
        ) : currentView === 'analytics' && user && selectedForm ? (
          <FormAnalytics 
            form={selectedForm} 
            user={user} 
            onBack={handleBackToDashboard} 
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

      {/* Removed the footer from here */}

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