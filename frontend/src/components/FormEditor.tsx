import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { SaaSForm, GeneratedForm, FormField } from '../types/api';
import { Plus, Trash2, GripVertical, Edit, Check, X } from 'lucide-react';

interface FormEditorProps {
  form: SaaSForm;
  onSaveSuccess: (updatedForm: SaaSForm) => void;
  onCancel: () => void;
}

// Helper to determine if a color is light (simplified for demo)
const isLightColor = (color: string): boolean => {
  if (!color) return false;
  let r, g, b;

  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) { // #rgb
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) { // #rrggbb
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else {
      return false;
    }
  } 
  // Handle rgb/rgba colors
  else if (color.startsWith('rgb')) {
    const parts = color.match(/\d+/g)?.map(Number);
    if (parts && parts.length >= 3) {
      [r, g, b] = parts;
    } else {
      return false;
    }
  }
  // Handle hsl/hsla colors
  else if (color.startsWith('hsl')) {
    const lightnessMatch = color.match(/hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*(\d+)%\s*(?:,\s*\d*\.?\d+)?\)/);
    if (lightnessMatch && lightnessMatch[1]) {
      const lightness = parseInt(lightnessMatch[1]);
      return lightness > 70;
    }
    return false;
  }
  else {
    return false;
  }

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.7;
};

export const FormEditor: React.FC<FormEditorProps> = ({ form, onSaveSuccess, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<number | null>(null); // Index of field being edited

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<GeneratedForm>({
    defaultValues: form.generated_form,
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'fields',
  });

  const watchedFields = watch('fields'); // Watch fields array for conditional rendering

  const onSubmit = async (data: GeneratedForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/forms/${form.id}/config`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        onSaveSuccess({ ...form, generated_form: data });
      } else {
        setError(result.message || 'Failed to save form configuration.');
      }
    } catch (err: any) {
      console.error('Form save error:', err);
      setError(err.message || 'An unexpected error occurred while saving the form.');
    } finally {
      setIsLoading(false);
    }
  };

  const addNewField = () => {
    append({
      type: 'text',
      name: `newField${fields.length + 1}`,
      label: `New Field ${fields.length + 1}`,
      placeholder: 'Enter value',
      required: false,
    });
    setEditingField(fields.length); // Automatically open the new field for editing
  };

  const fieldTypes: FormField['type'][] = ['text', 'email', 'phone', 'textarea', 'select', 'checkbox', 'radio'];

  const renderFieldEditor = (field: FormField, index: number) => {
    const fieldType = watch(`fields.${index}.type`);
    const fieldName = watch(`fields.${index}.name`);

    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-semibold text-gray-800">Edit Field: {field.label}</h4>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setEditingField(null)}
              className="btn btn-secondary btn-header-small"
            >
              <X size={16} /> Cancel
            </button>
            <button
              type="button"
              onClick={() => setEditingField(null)} // Just close, changes are live in form state
              className="btn btn-primary btn-header-small"
            >
              <Check size={16} /> Done
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Field Type</label>
          <select
            {...register(`fields.${index}.type`, { required: true })}
            className="form-input"
          >
            {fieldTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Field Label</label>
          <input
            type="text"
            {...register(`fields.${index}.label`, { required: true })}
            className="form-input"
          />
          {errors.fields?.[index]?.label && <span className="error-message">Label is required</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Field Name (unique identifier)</label>
          <input
            type="text"
            {...register(`fields.${index}.name`, { required: true, pattern: /^[a-zA-Z0-9_]+$/ })}
            className="form-input"
          />
          {errors.fields?.[index]?.name && <span className="error-message">Name is required and must be alphanumeric/underscore</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Placeholder</label>
          <input
            type="text"
            {...register(`fields.${index}.placeholder`)}
            className="form-input"
          />
        </div>

        <div className="form-group flex items-center space-x-2">
          <input
            type="checkbox"
            {...register(`fields.${index}.required`)}
            id={`field-required-${index}`}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <label htmlFor={`field-required-${index}`} className="form-label mb-0">Required</label>
        </div>

        {(fieldType === 'select' || fieldType === 'checkbox' || fieldType === 'radio') && (
          <div className="form-group">
            <label className="form-label">Options (comma-separated)</label>
            <textarea
              {...register(`fields.${index}.options`, {
                setValueAs: (value) => value.split(',').map((s: string) => s.trim()).filter(Boolean),
                valueAsArray: true,
              })}
              defaultValue={Array.isArray(field.options) ? field.options.join(', ') : ''}
              className="form-input"
              rows={3}
            />
          </div>
        )}

        {/* Basic Validation (can be expanded) */}
        <div className="form-group">
          <label className="form-label">Validation Pattern (Regex)</label>
          <input
            type="text"
            {...register(`fields.${index}.validation.pattern`)}
            className="form-input"
            placeholder="e.g., ^[0-9]{5}$ for 5-digit zip"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="card p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onCancel} className="btn btn-secondary btn-header-small">
          ← Back to Dashboard
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Edit Form: "{form.form_name}"</h2>
        <button
          type="submit"
          onClick={handleSubmit(onSubmit)}
          disabled={isLoading}
          className="btn btn-primary btn-header-small"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {error && (
        <div className="error-message p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* General Form Details */}
        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">General Form Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Form Name</label>
              <input type="text" {...register('title', { required: true })} className="form-input" />
              {errors.title && <span className="error-message">Form title is required</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Form Description</label>
              <textarea {...register('description')} className="form-input" rows={3} />
            </div>
            <div className="form-group">
              <label className="form-label">Call-to-Action (CTA) Text</label>
              <input type="text" {...register('ctaText', { required: true })} className="form-input" />
              {errors.ctaText && <span className="error-message">CTA text is required</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Thank You Message</label>
              <textarea {...register('thankYouMessage')} className="form-input" rows={3} />
            </div>
          </div>
        </div>

        {/* Styling */}
        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Form Styling</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Primary Color</label>
              <input type="color" {...register('styling.primaryColor')} className="form-input h-10" />
            </div>
            <div className="form-group">
              <label className="form-label">Background Color</label>
              <input type="color" {...register('styling.backgroundColor')} className="form-input h-10" />
            </div>
            <div className="form-group">
              <label className="form-label">Font Family</label>
              <input type="text" {...register('styling.fontFamily')} className="form-input" placeholder="e.g., Inter, sans-serif" />
            </div>
            <div className="form-group">
              <label className="form-label">Border Radius</label>
              <input type="text" {...register('styling.borderRadius')} className="form-input" placeholder="e.g., 8px, 0.5rem" />
            </div>
            <div className="form-group">
              <label className="form-label">Max Width</label>
              <input type="text" {...register('styling.maxWidth')} className="form-input" placeholder="e.g., 500px, 75%" />
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Form Fields</h3>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <GripVertical size={18} className="text-gray-400 cursor-grab" />
                    <span className="font-medium text-gray-700">{field.label}</span>
                    <span className="text-sm text-gray-500">({field.type})</span>
                    {field.required && <span className="text-red-500 text-xs ml-1">Required</span>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditingField(index)}
                      className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50"
                      title="Edit field"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50"
                      title="Delete field"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                {editingField === index && renderFieldEditor(field, index)}
              </div>
            ))}
            <button
              type="button"
              onClick={addNewField}
              className="btn btn-secondary w-full flex items-center justify-center space-x-2"
            >
              <Plus size={18} />
              <span>Add New Field</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isLoading} className="btn btn-primary">
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};