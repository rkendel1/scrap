import React, { useState, useEffect } from 'react';
import './App.css';
import { UrlForm } from './components/UrlForm';
import { RecordsTable } from './components/RecordsTable';
import { apiService } from './services/api';
import { FormRecord } from './types/api';

function App() {
  const [records, setRecords] = useState<FormRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

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
    fetchRecords();
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchRecords();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <div className="App">
      <header className="header">
        <div className="container">
          <h1>Website Design Token Extractor</h1>
          <p>Extract design tokens, CSS variables, form schemas, and metadata from any website</p>
        </div>
      </header>

      <main className="container">
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

        {/* Error Message */}
        {error && (
          <div className="card">
            <div className="error-message" style={{ fontSize: '16px', textAlign: 'center' }}>
              {error}
            </div>
          </div>
        )}

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
      </main>

      <footer style={{ textAlign: 'center', padding: '40px 20px', color: '#6c757d' }}>
        <div className="container">
          <p>Website Design Token Extractor - Built with React, TypeScript, and Express.js</p>
        </div>
      </footer>
    </div>
  );
}

export default App;