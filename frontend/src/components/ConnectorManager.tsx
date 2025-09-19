import React, { useState, useEffect } from 'react';
import { ConnectorConfig } from './ConnectorConfig';
import { ConnectorTestButton } from './ConnectorTestButton';

interface ConnectorDefinition {
  type: string;
  label: string;
  description: string;
  icon?: string;
  isPremium: boolean;
  fields: any[];
}

interface ConnectorConfig {
  type: string;
  settings: Record<string, any>;
}

interface ConnectorManagerProps {
  formId: number;
  onSave?: (connectors: ConnectorConfig[]) => void;
}

export const ConnectorManager: React.FC<ConnectorManagerProps> = ({
  formId,
  onSave
}) => {
  const [definitions, setDefinitions] = useState<ConnectorDefinition[]>([]);
  const [connectors, setConnectors] = useState<ConnectorConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddConnector, setShowAddConnector] = useState(false);
  const [selectedConnectorType, setSelectedConnectorType] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});

  // Fetch connector definitions and current connectors
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch definitions
        const definitionsResponse = await fetch('/api/connector-definitions', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        if (definitionsResponse.ok) {
          const definitionsResult = await definitionsResponse.json();
          setDefinitions(definitionsResult.data);
        }

        // Fetch current connectors
        const connectorsResponse = await fetch(`/api/forms/${formId}/connectors`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        if (connectorsResponse.ok) {
          const connectorsResult = await connectorsResponse.json();
          setConnectors(connectorsResult.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch connector data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [formId]);

  // Save connectors to backend
  const saveConnectors = async () => {
    setSaving(true);
    
    try {
      const response = await fetch(`/api/forms/${formId}/connectors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ connectors })
      });

      if (response.ok) {
        onSave?.(connectors);
        // Show success message
        alert('Connectors saved successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to save connectors: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to save connectors:', error);
      alert('Failed to save connectors. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Add new connector
  const addConnector = () => {
    if (!selectedConnectorType) return;
    
    const newConnector: ConnectorConfig = {
      type: selectedConnectorType,
      settings: {}
    };
    
    setConnectors([...connectors, newConnector]);
    setShowAddConnector(false);
    setSelectedConnectorType('');
  };

  // Remove connector
  const removeConnector = (index: number) => {
    const newConnectors = connectors.filter((_, i) => i !== index);
    setConnectors(newConnectors);
    
    // Remove validation errors for this connector
    const newValidationErrors = { ...validationErrors };
    delete newValidationErrors[index];
    setValidationErrors(newValidationErrors);
  };

  // Update connector config
  const updateConnector = (index: number, config: ConnectorConfig) => {
    const newConnectors = [...connectors];
    newConnectors[index] = config;
    setConnectors(newConnectors);
  };

  // Handle validation
  const handleValidation = (index: number, isValid: boolean, errors: string[]) => {
    setValidationErrors(prev => ({
      ...prev,
      [index]: isValid ? [] : errors
    }));
  };

  // Check if any connector has validation errors
  const hasValidationErrors = Object.values(validationErrors).some(errors => errors.length > 0);

  // Get available connector types (excluding already added ones)
  const availableTypes = definitions.filter(def => 
    !connectors.some(conn => conn.type === def.type)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading connectors...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Form Connectors</h2>
          <p className="text-sm text-gray-600">
            Configure where form submissions should be sent
          </p>
        </div>
        
        <div className="flex space-x-3">
          {availableTypes.length > 0 && (
            <button
              onClick={() => setShowAddConnector(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <span className="mr-1">+</span>
              Add Connector
            </button>
          )}
          
          {connectors.length > 0 && (
            <button
              onClick={saveConnectors}
              disabled={saving || hasValidationErrors}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                saving || hasValidationErrors
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
              }`}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>💾 Save Connectors</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Add Connector Modal */}
      {showAddConnector && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Connector</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {availableTypes.map((def) => (
              <button
                key={def.type}
                onClick={() => setSelectedConnectorType(def.type)}
                className={`p-3 border rounded-lg text-left hover:bg-white hover:shadow-sm transition-all ${
                  selectedConnectorType === def.type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{def.icon}</span>
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      {def.label}
                      {def.isPremium && (
                        <span className="ml-1 px-1 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">
                          Pro
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600">{def.description}</div>
                  </div>
                </div> {/* Added missing closing div here */}
              </button>
            ))}
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setShowAddConnector(false);
                setSelectedConnectorType('');
              }}
              className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={addConnector}
              disabled={!selectedConnectorType}
              className={`px-3 py-2 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                selectedConnectorType
                  ? 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                  : 'text-gray-500 bg-gray-300 cursor-not-allowed'
              }`}
            >
              Add Connector
            </button>
          </div>
        </div>
      )}

      {/* Configured Connectors */}
      {connectors.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-4xl mb-4">🔌</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No connectors configured</h3>
          <p className="text-gray-600 mb-4">
            Add connectors to automatically send form submissions to external services
          </p>
          {availableTypes.length > 0 && (
            <button
              onClick={() => setShowAddConnector(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <span className="mr-1">+</span>
              Add Your First Connector
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {connectors.map((connector, index) => {
            const definition = definitions.find(def => def.type === connector.type);
            
            return (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {definition?.icon} {definition?.label || connector.type}
                  </h3>
                  <button
                    onClick={() => removeConnector(index)}
                    className="text-red-600 hover:text-red-800 focus:outline-none"
                    title="Remove connector"
                  >
                    🗑️
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <ConnectorConfig
                      connectorType={connector.type}
                      initialConfig={connector}
                      onChange={(config) => updateConnector(index, config)}
                      onValidation={(isValid, errors) => handleValidation(index, isValid, errors)}
                    />
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Test Connector</h4>
                    <ConnectorTestButton
                      formId={formId}
                      connectorType={connector.type}
                      settings={connector.settings}
                      disabled={validationErrors[index]?.length > 0}
                    />
                  </div>
                </div>
                
                {validationErrors[index]?.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <h4 className="text-sm font-medium text-red-800 mb-1">Configuration Errors:</h4>
                    <ul className="text-sm text-red-700 list-disc list-inside">
                      {validationErrors[index].map((error, errorIndex) => (
                        <li key={errorIndex}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Save Status */}
      {hasValidationErrors && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-600">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Configuration Issues
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                Please fix the configuration errors above before saving your connectors.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};