import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiService } from '../services/api';
import { ExtractRequest } from '../types/api';

interface UrlFormProps {
  onExtractSuccess: () => void;
}

export const UrlForm: React.FC<UrlFormProps> = ({ onExtractSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ExtractRequest>();

  const onSubmit = async (data: ExtractRequest) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await apiService.extractWebsite(data);
      if (response.success) {
        setMessage({ type: 'success', text: 'Website data extracted and saved successfully!' });
        reset();
        onExtractSuccess();
      } else {
        setMessage({ type: 'error', text: response.error || 'Failed to extract website data' });
      }
    } catch (error: any) {
      console.error('Extraction error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || error.message || 'Failed to extract website data' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Extract Website Design Tokens</h2>
      <p>Enter a URL to extract design tokens, CSS variables, form schemas, and metadata.</p>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label htmlFor="url" className="form-label">
            Website URL
          </label>
          <input
            id="url"
            type="url"
            className={`form-input ${errors.url ? 'error' : ''}`}
            placeholder="https://example.com"
            {...register('url', {
              required: 'URL is required',
              pattern: {
                value: /^https?:\/\/.+/,
                message: 'Please enter a valid URL starting with http:// or https://'
              }
            })}
          />
          {errors.url && (
            <div className="error-message">{errors.url.message}</div>
          )}
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Extracting...' : 'Extract Design Tokens'}
        </button>
      </form>

      {message && (
        <div className={`${message.type}-message`} style={{ marginTop: '20px' }}>
          {message.text}
        </div>
      )}
    </div>
  );
};