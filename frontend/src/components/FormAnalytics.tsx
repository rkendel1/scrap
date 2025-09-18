import React, { useState, useEffect } from 'react';
import { SaaSForm, User } from '../types/api';

interface FormAnalyticsProps {
  form: SaaSForm;
  user: User;
  onBack: () => void;
}

export const FormAnalytics: React.FC<FormAnalyticsProps> = ({ form, user, onBack }) => {
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE}/api/forms/${form.id}/analytics`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        const result = await response.json();
        if (result.success) {
          setAnalyticsData(result.data);
        } else {
          throw new Error(result.message || 'Failed to fetch analytics');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [form.id, user.id]);

  if (loading) {
    return (
      <div className="card">
        <div className="loading">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="error-message">{error}</div>
        <button onClick={onBack} className="btn btn-secondary" style={{ marginTop: '16px' }}>
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="card">
        <p>No analytics data available for this form yet.</p>
        <button onClick={onBack} className="btn btn-secondary" style={{ marginTop: '16px' }}>
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const { overview, embeds } = analyticsData;

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <button onClick={onBack} className="btn btn-secondary" style={{ marginRight: '16px' }}>
          ← Back to Dashboard
        </button>
        <div>
          <h2>📈 Analytics for "{form.form_name}"</h2>
          <p style={{ margin: 0, color: '#666' }}>
            Overview of your form's performance and submission data.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '16px' }}>Overall Performance</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div style={{ padding: '20px', border: '1px solid #e1e5e9', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total Submissions</p>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#007bff' }}>{overview.total_submissions || 0}</p>
          </div>
          <div style={{ padding: '20px', border: '1px solid #e1e5e9', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Active Days</p>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#28a745' }}>{overview.active_days || 0}</p>
          </div>
          <div style={{ padding: '20px', border: '1px solid #e1e5e9', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Avg. Time Between Submissions</p>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#ffc107' }}>
              {overview.avg_time_between_submissions ? `${Math.round(overview.avg_time_between_submissions / 60)} min` : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: '16px' }}>Embed Code Performance</h3>
        {embeds && embeds.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Embed Code</th>
                  <th>Domain</th>
                  <th>Views</th>
                  <th>Submissions</th>
                  <th>Conversion Rate</th>
                </tr>
              </thead>
              <tbody>
                {embeds.map((embed: any) => (
                  <tr key={embed.code}>
                    <td>{embed.code.substring(0, 10)}...</td>
                    <td>{embed.domain || 'Any'}</td>
                    <td>{embed.view_count || 0}</td>
                    <td>{embed.submission_count || 0}</td>
                    <td>{embed.conversion_rate || 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#666' }}>No embed code performance data available yet.</p>
        )}
      </div>
    </div>
  );
};