import React, { useState, useEffect } from 'react';
import { ConnectorConfig as ConnectorConfigComponent } from './ConnectorConfig'; // Renamed to avoid conflict
import { ConnectorTestButton } from './ConnectorTestButton';
import { Plus, X } from 'lucide-react'; // Import icons

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
  userEmail?: string; // New prop for user's email
  onSave?: (connectors: ConnectorConfig[]) => void;
}

export const ConnectorManager: React.FC<ConnectorManagerProps> = ({
  formId,
  userEmail, // Destructure new prop
  onSave
}) => {
  const [definitions, setDefinitions] = useState<ConnectorDefinition[]>([]);
  const [connectors, setConnectors] = useState<ConnectorConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingNewConnector, setAddingNewConnector] = useState(false); // State for wizard flow
  const [selectedConnectorType, setSelectedConnectorType] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);


  // Fetch connector definitions and current connectors
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setGlobalError(null);
        
        // Fetch definitions
        const definitionsResponse = await fetch('/api/connector-definitions', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        if (definitionsResponse.ok) {
          const definitionsResult = await definitionsResponse.json();
          setDefinitions(definitionsResult.data);
        } else {
          throw new Error(definitionsResponse.statusText);
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
        } else {
          throw new Error(connectorsResponse.statusText);
        }
      } catch (error: any) {
        console.error('Failed to fetch connector data:', error);
        setGlobalError(`Failed to load connectors: ${error.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [formId]);

  // Save connectors to backend
  const saveConnectors = async () => {
    setSaving(true);
    setGlobalError(null);
    setGlobalSuccess(null);
    
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
        setGlobalSuccess('Connectors saved successfully!');
        setAddingNewConnector(false); // Exit wizard mode after saving
        setSelectedConnectorType('');
      } else {
        const error = await response.json();
        setGlobalError(`Failed to save connectors: ${error.message}`);
      }
    } catch (error: any) {
      console.error('Failed to save connectors:', error);
      setGlobalError(`Failed to save connectors: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  // Add new connector (wizard step 2: type selected)
  const handleSelectConnectorType = (type: string) => {
    setSelectedConnectorType(type);
    
    // Automatically add a new connector to the list for configuration
    const newConnector: ConnectorConfig = {
      type: type,
      settings: {}
    };

    // Pre-populate email 'to' field if it's an email connector and userEmail is available
    if (type === 'email' && userEmail) {
      newConnector.settings.to = userEmail;
    }

    setConnectors([...connectors, newConnector]);
    setAddingNewConnector(false); // Exit the type selection phase
  };

  // Remove connector
  const removeConnector = (index: number) => {
    const newConnectors = connectors.filter((_, i) => i !== index);
    setConnectors(newConnectors);
    
    // Remove validation errors for this connector
    const newValidationErrors = { ...validationErrors };
    delete newValidationErrors[index];
    setValidationErrors(newValidationErrors);
    setGlobalSuccess(null); // Clear success message on change
  };

  // Update connector config
  const updateConnector = (index: number, config: ConnectorConfig) => {
    const newConnectors = [...connectors];
    newConnectors[index] = config;
    setConnectors(newConnectors);
    setGlobalSuccess(null); // Clear success message on change
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
      {globalError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 flex items-center">
          <X size={20} className="mr-2" /> {globalError}
        </div>
      )}
      {globalSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 flex items-center">
          <Plus size={20} className="mr-2" /> {globalSuccess}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Form Destinations</h2>
          <p className="text-sm text-gray-600">
            Configure where form submissions should be sent
          </p>
        </div>
        
        {connectors.length > 0 && !addingNewConnector && (
          <div className="flex space-x-3">
            {availableTypes.length > 0 && (
              <button
                onClick={() => setAddingNewConnector(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus size={16} className="mr-1" />
                Add New Destination
              </button>
            )}
            
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
                <>💾 Save Destinations</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Wizard Step 1: Choose first destination / Add new destination */}
      {(connectors.length === 0 || addingNewConnector) && availableTypes.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {connectors.length === 0 ? 'Choose your first destination' : 'Select a new destination'}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {availableTypes.map((def) => (
              <button
                key={def.type}
                onClick={() => handleSelectConnectorType(def.type)}
                className={`p-4 border rounded-lg text-left hover:bg-white hover:shadow-sm transition-all flex items-center space-x-3 ${
                  selectedConnectorType === def.type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <span className="text-2xl">{def.icon}</span>
                <div>
                  <div className="font-medium text-base text-gray-900">
                    {def.label}
                    {def.isPremium && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full">
                        Pro
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">{def.description}</div>
                </div>
              </button>
            ))}
          </div>
          
          {(connectors.length > 0 && addingNewConnector) && (
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setAddingNewConnector(false);
                  setSelectedConnectorType('');
                }}
                className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Configured Connectors */}
      {connectors.length === 0 && !addingNewConnector ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-4xl mb-4">🔌</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No destinations configured</h3>
          <p className="text-gray-600 mb-4">
            Add your first destination to automatically send form submissions to external services.
          </p>
          {availableTypes.length > 0 && (
            <button
              onClick={() => setAddingNewConnector(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus size={16} className="mr-1" />
              Add Your First Destination
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
                    title="Remove destination"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <ConnectorConfigComponent
                      connectorType={connector.type}
                      initialConfig={connector}
                      onChange={(config) => updateConnector(index, config)}
                      onValidation={(isValid, errors) => handleValidation(index, isValid, errors)}
                    />
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Test Destination</h4>
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

      {/* Save button at the bottom if there are connectors and not in adding mode */}
      {connectors.length > 0 && !addingNewConnector && (
        <div className="flex justify-end">
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
              <>💾 Save Destinations</>
            )}
          </button>
        </div>
      )}

      {/* Global Validation Summary */}
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
                Please fix the configuration errors above before saving your destinations.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};