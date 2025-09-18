import React, { useState, useEffect } from 'react';

interface ConnectorFieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'email' | 'url' | 'password' | 'select' | 'textarea';
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: string[];
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

interface ConnectorDefinition {
  type: string;
  label: string;
  description: string;
  icon?: string;
  isPremium: boolean;
  fields: ConnectorFieldDefinition[];
}

interface ConnectorConfig {
  type: string;
  settings: Record<string, any>;
}

interface ConnectorConfigProps {
  connectorType: string;
  initialConfig?: ConnectorConfig;
  onChange: (config: ConnectorConfig) => void;
  onValidation?: (isValid: boolean, errors: string[]) => void;
}

export const ConnectorConfig: React.FC<ConnectorConfigProps> = ({
  connectorType,
  initialConfig,
  onChange,
  onValidation
}) => {
  const [definition, setDefinition] = useState<ConnectorDefinition | null>(null);
  const [settings, setSettings] = useState<Record<string, any>>(
    initialConfig?.settings || {}
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Fetch connector definition
  useEffect(() => {
    const fetchDefinition = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/connector-definitions', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          const connectorDef = result.data.find((def: ConnectorDefinition) => def.type === connectorType);
          setDefinition(connectorDef || null);
        }
      } catch (error) {
        console.error('Failed to fetch connector definitions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDefinition();
  }, [connectorType]);

  // Validate field value
  const validateField = (field: ConnectorFieldDefinition, value: any): string | null => {
    // Check required fields
    if (field.required && (!value || value.toString().trim() === '')) {
      return `${field.label} is required`;
    }

    // Skip validation for empty optional fields
    if (!value || value.toString().trim() === '') {
      return null;
    }

    // Type-specific validation
    if (field.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return `${field.label} must be a valid email address`;
      }
    }

    if (field.type === 'url') {
      try {
        new URL(value);
      } catch {
        return `${field.label} must be a valid URL`;
      }
    }

    // Custom validation rules
    if (field.validation) {
      if (field.validation.pattern) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(value)) {
          return `${field.label} format is invalid`;
        }
      }

      if (field.validation.minLength && value.length < field.validation.minLength) {
        return `${field.label} must be at least ${field.validation.minLength} characters`;
      }

      if (field.validation.maxLength && value.length > field.validation.maxLength) {
        return `${field.label} must not exceed ${field.validation.maxLength} characters`;
      }
    }

    return null;
  };

  // Handle field change
  const handleFieldChange = (fieldName: string, value: any) => {
    const newSettings = { ...settings, [fieldName]: value };
    setSettings(newSettings);

    // Validate the field
    const field = definition?.fields.find(f => f.name === fieldName);
    if (field) {
      const error = validateField(field, value);
      setErrors(prev => ({
        ...prev,
        [fieldName]: error || ''
      }));
    }

    // Create new config
    const newConfig: ConnectorConfig = {
      type: connectorType,
      settings: newSettings
    };

    onChange(newConfig);

    // Run overall validation
    if (definition) {
      const allErrors: string[] = [];
      const newErrorState: Record<string, string> = { ...errors };

      definition.fields.forEach(field => {
        const fieldError = validateField(field, newSettings[field.name]);
        if (fieldError) {
          allErrors.push(fieldError);
          newErrorState[field.name] = fieldError;
        } else {
          newErrorState[field.name] = '';
        }
      });

      setErrors(newErrorState);
      onValidation?.(allErrors.length === 0, allErrors);
    }
  };

  // Render field input
  const renderField = (field: ConnectorFieldDefinition) => {
    const value = settings[field.name] || '';
    const error = errors[field.name];

    const baseClasses = `w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      error ? 'border-red-500' : 'border-gray-300'
    }`;

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={`${baseClasses} resize-vertical min-h-[100px]`}
            required={field.required}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={baseClasses}
            required={field.required}
          >
            <option value="">Select an option</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={baseClasses}
            required={field.required}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!definition) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">
          Unknown connector type: {connectorType}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connector Header */}
      <div className="flex items-center space-x-3">
        <div className="text-2xl">{definition.icon}</div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {definition.label}
            {definition.isPremium && (
              <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                Premium
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-600">{definition.description}</p>
        </div>
      </div>

      {/* Configuration Fields */}
      <div className="space-y-4">
        {definition.fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {renderField(field)}
            
            {field.description && (
              <p className="text-sm text-gray-500">{field.description}</p>
            )}
            
            {errors[field.name] && (
              <p className="text-sm text-red-600">{errors[field.name]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};