import React, { useState, useMemo } from 'react';
import { SaaSForm, User } from '../types/api';
import { FormThumbnail } from './FormThumbnail';
import { ToggleSwitch } from './ToggleSwitch';
import { Plus, Filter, Search, Copy, Tag, Folder, Trash2 } from 'lucide-react';

interface FormDashboardProps {
  forms: SaaSForm[];
  user: User | null;
  onCreateForm: () => void;
  onShowTemplates: () => void;
  onManageForm: (form: SaaSForm) => void;
  onEditForm: (form: SaaSForm) => void;
  onGetEmbedCode: (form: SaaSForm) => void;
  onShowAnalytics: (form: SaaSForm) => void;
  onToggleFormLive: (formId: number) => void;
  onDuplicateForm: (form: SaaSForm) => void;
  onDeleteForm: (form: SaaSForm) => void;
  onUpdateFormTags: (formId: number, tags: string[]) => void;
}

export const FormDashboard: React.FC<FormDashboardProps> = ({
  forms,
  user,
  onCreateForm,
  onShowTemplates,
  onManageForm,
  onEditForm,
  onGetEmbedCode,
  onShowAnalytics,
  onToggleFormLive,
  onDuplicateForm,
  onDeleteForm,
  onUpdateFormTags,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'submissions'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showTagModal, setShowTagModal] = useState<{ formId: number; currentTags: string[] } | null>(null);

  // Extract all unique tags/categories from forms
  const allCategories = useMemo(() => {
    const tagSet = new Set<string>();
    forms.forEach(form => {
      const tags = (form as any).tags || [];
      tags.forEach((tag: string) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [forms]);

  // Filter and sort forms
  const filteredAndSortedForms = useMemo(() => {
    let filtered = forms.filter(form => {
      const matchesSearch = form.form_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (form.form_description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          form.url.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || 
                            (selectedCategory === 'untagged' && !(form as any).tags?.length) ||
                            (form as any).tags?.includes(selectedCategory);
      
      return matchesSearch && matchesCategory;
    });

    // Sort forms
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.form_name.localeCompare(b.form_name);
          break;
        case 'created':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'submissions':
          comparison = a.submissions_count - b.submissions_count;
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [forms, searchQuery, selectedCategory, sortBy, sortOrder]);

  const handleDuplicateForm = async (form: SaaSForm) => {
    if (window.confirm(`Duplicate form "${form.form_name}"?`)) {
      onDuplicateForm(form);
    }
  };

  const TagModal = () => {
    const [newTag, setNewTag] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>(showTagModal?.currentTags || []);

    const handleAddTag = () => {
      if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
        setSelectedTags([...selectedTags, newTag.trim()]);
        setNewTag('');
      }
    };

    const handleRemoveTag = (tag: string) => {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    };

    const handleSave = () => {
      if (showTagModal) {
        onUpdateFormTags(showTagModal.formId, selectedTags);
      }
      setShowTagModal(null);
    };

    if (!showTagModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Manage Tags</h3>
          
          <div className="mb-4">
            <label className="form-label">Add New Tag</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="form-input flex-1"
                placeholder="Enter tag name"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <button onClick={handleAddTag} className="btn btn-secondary">
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label">Existing Tags</label>
            <div className="flex flex-wrap gap-2">
              {allCategories.map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    if (selectedTags.includes(tag)) {
                      handleRemoveTag(tag);
                    } else {
                      setSelectedTags([...selectedTags, tag]);
                    }
                  }}
                  className={`px-2 py-1 rounded text-sm ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label">Selected Tags</label>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm flex items-center gap-1">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="text-blue-600 hover:text-blue-800">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowTagModal(null)} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleSave} className="btn btn-primary">
              Save Tags
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">📊 Your Forms Dashboard</h2>
            <p className="text-gray-600">Manage your AI-generated forms, view analytics, and get embed codes.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onCreateForm} className="btn btn-primary flex items-center gap-2">
              <Plus size={16} />
              Create Form
            </button>
            <button onClick={onShowTemplates} className="btn btn-secondary flex items-center gap-2">
              📋 Templates
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search forms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-10"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="form-input"
          >
            <option value="all">All Categories</option>
            <option value="untagged">Untagged</option>
            {allCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as any);
              setSortOrder(order as any);
            }}
            className="form-input"
          >
            <option value="created-desc">Newest First</option>
            <option value="created-asc">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="submissions-desc">Most Submissions</option>
            <option value="submissions-asc">Least Submissions</option>
          </select>

          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-300 rounded-l-md`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === 'grid'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border-t border-r border-b border-gray-300 rounded-r-md -ml-px`}
            >
              Grid
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{forms.length}</div>
            <div className="text-sm text-blue-500">Total Forms</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {forms.filter(f => f.is_live).length}
            </div>
            <div className="text-sm text-green-500">Live Forms</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {forms.reduce((acc, f) => acc + f.submissions_count, 0)}
            </div>
            <div className="text-sm text-purple-500">Total Submissions</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{allCategories.length}</div>
            <div className="text-sm text-orange-500">Categories</div>
          </div>
        </div>
      </div>

      {/* Forms Display */}
      {filteredAndSortedForms.length === 0 ? (
        <div className="card text-center py-12">
          {forms.length === 0 ? (
            <>
              <Folder className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No forms yet</h3>
              <p className="text-gray-500 mb-4">Create your first AI-powered form to get started!</p>
              <button onClick={onCreateForm} className="btn btn-primary">
                Create Your First Form
              </button>
            </>
          ) : (
            <>
              <Filter className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No forms match your filters</h3>
              <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="btn btn-secondary"
              >
                Clear Filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredAndSortedForms.map((form) => (
            <div key={form.id} className={`card ${viewMode === 'grid' ? 'p-6' : ''}`}>
              <div className={viewMode === 'grid' ? 'space-y-4' : 'flex gap-4 items-start'}>
                {/* Thumbnail */}
                <div className={viewMode === 'grid' ? 'w-full' : 'flex-shrink-0'}>
                  <FormThumbnail form={form} />
                </div>

                {/* Form details */}
                <div className="flex-1 min-w-0">
                  <div className={`flex justify-between items-start ${viewMode === 'grid' ? 'mb-3' : 'mb-2'}`}>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold text-gray-900 ${viewMode === 'grid' ? 'text-lg' : 'text-base'} truncate`}>
                        {form.form_name}
                      </h3>
                      {(form as any).tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(form as any).tags.slice(0, 3).map((tag: string) => (
                            <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                          {(form as any).tags.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              +{(form as any).tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <ToggleSwitch
                      isOn={form.is_live}
                      onToggle={() => onToggleFormLive(form.id)}
                      label={form.is_live ? 'Live' : 'Draft'}
                      disabled={!user}
                    />
                  </div>

                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {form.form_description}
                  </p>

                  <a
                    href={form.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 truncate block mb-3"
                  >
                    {form.url.length > 50 ? form.url.substring(0, 47) + '...' : form.url}
                  </a>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span>📊 {form.submissions_count} submissions</span>
                    <span>•</span>
                    <span>Created: {new Date(form.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* Action buttons */}
                  <div className={`grid ${viewMode === 'grid' ? 'grid-cols-2' : 'grid-cols-3 md:grid-cols-7'} gap-2`}>
                    <button
                      onClick={() => onEditForm(form)}
                      className="btn btn-secondary text-xs"
                      title="Edit Form"
                    >
                      ⚙️ Edit
                    </button>
                    <button
                      onClick={() => onManageForm(form)}
                      className="btn btn-secondary text-xs"
                      title="Manage Connectors"
                    >
                      🔌 Connect
                    </button>
                    <button
                      onClick={() => onGetEmbedCode(form)}
                      className="btn btn-secondary text-xs"
                      title="Get Embed Code"
                    >
                      📋 Embed
                    </button>
                    <button
                      onClick={() => onShowAnalytics(form)}
                      className="btn btn-secondary text-xs"
                      title="View Analytics"
                    >
                      📈 Stats
                    </button>
                    <button
                      onClick={() => setShowTagModal({ formId: form.id, currentTags: (form as any).tags || [] })}
                      className="btn btn-secondary text-xs"
                      title="Manage Tags"
                    >
                      <Tag size={12} /> Tags
                    </button>
                    <button
                      onClick={() => handleDuplicateForm(form)}
                      className="btn btn-secondary text-xs"
                      title="Duplicate Form"
                    >
                      <Copy size={12} /> Copy
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete "${form.form_name}"? This action cannot be undone.`)) {
                          onDeleteForm(form);
                        }
                      }}
                      className="btn btn-secondary text-xs hover:bg-red-50 hover:text-red-600"
                      title="Delete Form"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TagModal />
    </div>
  );
};