import React, { useState, useEffect } from 'react';
import './App.css';
import { UrlForm } from './components/UrlForm';
import { RecordsTable } from './components/RecordsTable';
import { ConversationalFormBuilder } from './components/ConversationalFormBuilder';
import { LoginForm, RegisterForm } from './components/AuthForms';
import { apiService } from './services/api';
import { FormRecord, User, SaaSForm } from './types/api';

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
  const [currentView, setCurrentView] = useState<'builder' | 'legacy' | 'dashboard'>('builder');

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
      
      if (result.success) {
        setForms(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch forms:', error);
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (searchQuery.trim()) {
        response = await apiService.searchRecords(searchQuery.trim());
      } else {
        response = await apiService.getAllRecords();
      }
      
      if (response.success && response.data) {
        setRecords(response.data);
      } else {
        setError(response.error || 'Failed to fetch records');
      }
    } catch (error: any) {
      console.error('Fetch error:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch records');
    } finally {
      setLoading(false);
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
    createGuestToken(); // Create new guest token
    setShowAuth(false);
  };

  const handleAuthError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleFormGenerated = (form: SaaSForm) => {
    setForms(prev => [form, ...prev]);
    if (user) {
      setCurrentView('dashboard');
    }
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
            <div>
              <h1>FormCraft AI</h1>
              <p>Create AI-powered forms that match any website's design and tone</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {user ? (
                <>
                  <span style={{ fontSize: '14px', color: '#666' }}>
                    Welcome, {user.first_name || user.email}
                    {user.subscription_tier === 'paid' && (
                      <span style={{ 
                        marginLeft: '8px', 
                        padding: '2px 8px', 
                        backgroundColor: '#28a745', 
                        color: 'white', 
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        PRO
                      </span>
                    )}
                  </span>
                  <button onClick={handleLogout} className="btn btn-secondary">
                    Sign Out
                  </button>
                </>
              ) : (
                <button onClick={() => setShowAuth(true)} className="btn btn-primary">
                  Sign In / Register
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container">
        {/* Navigation */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '24px',
          borderBottom: '1px solid #e1e5e9',
          paddingBottom: '16px'
        }}>
          <button
            onClick={() => setCurrentView('builder')}
            className={`btn ${currentView === 'builder' ? 'btn-primary' : 'btn-secondary'}`}
          >
            🚀 Form Builder
          </button>
          {user && (
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`btn ${currentView === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
            >
              📊 My Forms ({forms.length})
            </button>
          )}
          <button
            onClick={() => setCurrentView('legacy')}
            className={`btn ${currentView === 'legacy' ? 'btn-primary' : 'btn-secondary'}`}
          >
            🔧 Design Extractor
          </button>
        </div>

        {/* Auth Modal */}
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
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
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

        {/* Error Message */}
        {error && (
          <div className="card">
            <div className="error-message" style={{ fontSize: '16px', textAlign: 'center' }}>
              {error}
              <button 
                onClick={() => setError(null)}
                style={{ marginLeft: '12px' }}
                className="btn btn-secondary"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        {currentView === 'builder' && (
          <ConversationalFormBuilder 
            onFormGenerated={handleFormGenerated}
            user={user}
            guestToken={guestToken || undefined}
          />
        )}

        {currentView === 'dashboard' && user && (
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
                      border: '1px solid #e1e5e9',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <h4 style={{ margin: '0 0 8px 0' }}>{form.form_name}</h4>
                          <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>
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
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-secondary" style={{ fontSize: '12px' }}>
                            ⚙️ Edit
                          </button>
                          <button className="btn btn-secondary" style={{ fontSize: '12px' }}>
                            📋 Embed Code
                          </button>
                          <button className="btn btn-secondary" style={{ fontSize: '12px' }}>
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
        )}

        {currentView === 'legacy' && (
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
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '40px 20px', color: '#6c757d' }}>
        <div className="container">
          <p>FormCraft AI - Create AI-powered forms that perfectly match any website's design and tone</p>
        </div>
      </footer>
    </div>
  );
}

export default App;