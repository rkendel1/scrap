import React, { useState } from 'react';

interface ConnectorTestButtonProps {
  formId: number;
  connectorType: string;
  settings: Record<string, any>;
  disabled?: boolean;
}

interface TestResult {
  success: boolean;
  message: string;
  errors?: string[];
  error?: string;
}

export const ConnectorTestButton: React.FC<ConnectorTestButtonProps> = ({
  formId,
  connectorType,
  settings,
  disabled = false
}) => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const testConnector = async () => {
    setTesting(true);
    setResult(null);

    try {
      const response = await fetch(`/api/forms/${formId}/test-connector`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          connectorType,
          settings
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data.data);
      } else {
        setResult({
          success: false,
          message: data.message || 'Test failed',
          error: data.error
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Network error occurred while testing connector',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = () => {
    if (testing) {
      return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>;
    }
    
    if (result === null) {
      return '🧪';
    }
    
    return result.success ? '✅' : '❌';
  };

  const getStatusText = () => {
    if (testing) {
      return 'Testing...';
    }
    
    if (result === null) {
      return 'Test Connector';
    }
    
    return result.success ? 'Test Successful' : 'Test Failed';
  };

  const getButtonStyle = () => {
    const baseStyle = 'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors';
    
    if (disabled || testing) {
      return `${baseStyle} bg-gray-300 text-gray-500 cursor-not-allowed`;
    }
    
    if (result === null) {
      return `${baseStyle} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`;
    }
    
    if (result.success) {
      return `${baseStyle} bg-green-600 text-white hover:bg-green-700 focus:ring-green-500`;
    }
    
    return `${baseStyle} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;
  };

  return (
    <div className="space-y-3">
      <button
        onClick={testConnector}
        disabled={disabled || testing}
        className={getButtonStyle()}
      >
        <span className="mr-2">{getStatusIcon()}</span>
        {getStatusText()}
      </button>

      {result && (
        <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-lg">{result.success ? '✅' : '❌'}</span>
            </div>
            <div className="ml-3 flex-1">
              <h4 className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.success ? 'Test Successful' : 'Test Failed'}
              </h4>
              <p className={`mt-1 text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                {result.message}
              </p>
              
              {result.errors && result.errors.length > 0 && (
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                  {result.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              )}
              
              {result.error && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
                    Show technical details
                  </summary>
                  <pre className="mt-1 text-xs text-red-600 bg-red-100 p-2 rounded overflow-x-auto">
                    {result.error}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )}

      {result && result.success && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            💡 <strong>Test Data Used:</strong> This test sent mock form submission data including 
            fields like "name: John Doe", "email: john.doe@example.com", and a test message. 
            When your form goes live, it will send actual submission data in the same format.
          </p>
        </div>
      )}
    </div>
  );
};