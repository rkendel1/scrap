import React, { useState } from 'react';
import { GeneratedForm, FormField } from '../types/api';
import { FileText, Users, Mail, Calendar, MessageSquare, Star, ArrowRight } from 'lucide-react';

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'personal' | 'event' | 'survey';
  icon: React.ReactNode;
  popularity: number;
  fields: FormField[];
  styling: GeneratedForm['styling'];
  ctaText: string;
  thankYouMessage: string;
}

interface FormTemplatesProps {
  onSelectTemplate: (template: GeneratedForm) => void;
  onBack: () => void;
}

const templates: FormTemplate[] = [
  {
    id: 'contact',
    name: 'Contact Form',
    description: 'Simple contact form for customer inquiries',
    category: 'business',
    icon: <Mail className="w-6 h-6" />,
    popularity: 95,
    fields: [
      { type: 'text', name: 'name', label: 'Full Name', required: true, placeholder: 'Enter your full name' },
      { type: 'email', name: 'email', label: 'Email Address', required: true, placeholder: 'Enter your email' },
      { type: 'text', name: 'subject', label: 'Subject', required: true, placeholder: 'What is this about?' },
      { type: 'textarea', name: 'message', label: 'Message', required: true, placeholder: 'Tell us more...' }
    ],
    styling: {
      primaryColor: '#2563eb',
      backgroundColor: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
      borderRadius: '8px',
      textColor: '#374151',
      buttonTextColor: '#ffffff',
      buttonBackgroundColor: '#2563eb'
    },
    ctaText: 'Send Message',
    thankYouMessage: 'Thank you for your message! We\'ll get back to you soon.'
  },
  {
    id: 'lead-generation',
    name: 'Lead Generation',
    description: 'Capture leads with essential business information',
    category: 'business',
    icon: <Users className="w-6 h-6" />,
    popularity: 88,
    fields: [
      { type: 'text', name: 'first_name', label: 'First Name', required: true, placeholder: 'John' },
      { type: 'text', name: 'last_name', label: 'Last Name', required: true, placeholder: 'Doe' },
      { type: 'email', name: 'email', label: 'Business Email', required: true, placeholder: 'john@company.com' },
      { type: 'text', name: 'company', label: 'Company Name', required: true, placeholder: 'Your Company' },
      { type: 'text', name: 'job_title', label: 'Job Title', required: false, placeholder: 'Your role' },
      { type: 'phone', name: 'phone', label: 'Phone Number', required: false, placeholder: '+1 (555) 123-4567' },
      { type: 'select', name: 'company_size', label: 'Company Size', required: false, options: ['1-10 employees', '11-50 employees', '51-200 employees', '201+ employees'] }
    ],
    styling: {
      primaryColor: '#10b981',
      backgroundColor: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
      borderRadius: '12px',
      textColor: '#374151',
      buttonTextColor: '#ffffff',
      buttonBackgroundColor: '#10b981'
    },
    ctaText: 'Get Started',
    thankYouMessage: 'Thanks for your interest! Our team will contact you within 24 hours.'
  },
  {
    id: 'newsletter',
    name: 'Newsletter Signup',
    description: 'Simple email capture for newsletters',
    category: 'business',
    icon: <FileText className="w-6 h-6" />,
    popularity: 82,
    fields: [
      { type: 'email', name: 'email', label: 'Email Address', required: true, placeholder: 'Enter your email' },
      { type: 'text', name: 'first_name', label: 'First Name', required: false, placeholder: 'Your first name' },
      { type: 'checkbox', name: 'preferences', label: 'Email Preferences', required: false, options: ['Weekly newsletter', 'Product updates', 'Special offers'] }
    ],
    styling: {
      primaryColor: '#8b5cf6',
      backgroundColor: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
      borderRadius: '8px',
      textColor: '#374151',
      buttonTextColor: '#ffffff',
      buttonBackgroundColor: '#8b5cf6'
    },
    ctaText: 'Subscribe',
    thankYouMessage: 'Welcome! You\'ve been subscribed to our newsletter.'
  },
  {
    id: 'event-registration',
    name: 'Event Registration',
    description: 'Registration form for events and webinars',
    category: 'event',
    icon: <Calendar className="w-6 h-6" />,
    popularity: 76,
    fields: [
      { type: 'text', name: 'name', label: 'Full Name', required: true, placeholder: 'Enter your full name' },
      { type: 'email', name: 'email', label: 'Email Address', required: true, placeholder: 'Enter your email' },
      { type: 'text', name: 'company', label: 'Company/Organization', required: false, placeholder: 'Your company' },
      { type: 'text', name: 'job_title', label: 'Job Title', required: false, placeholder: 'Your role' },
      { type: 'radio', name: 'attendance', label: 'Attendance Type', required: true, options: ['In-person', 'Virtual'] },
      { type: 'textarea', name: 'dietary_requirements', label: 'Dietary Requirements', required: false, placeholder: 'Any dietary restrictions or allergies?' }
    ],
    styling: {
      primaryColor: '#f59e0b',
      backgroundColor: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
      borderRadius: '12px',
      textColor: '#374151',
      buttonTextColor: '#ffffff',
      buttonBackgroundColor: '#f59e0b'
    },
    ctaText: 'Register Now',
    thankYouMessage: 'Registration successful! You\'ll receive a confirmation email shortly.'
  },
  {
    id: 'customer-feedback',
    name: 'Customer Feedback',
    description: 'Gather feedback and ratings from customers',
    category: 'survey',
    icon: <MessageSquare className="w-6 h-6" />,
    popularity: 71,
    fields: [
      { type: 'text', name: 'name', label: 'Your Name', required: false, placeholder: 'Optional' },
      { type: 'email', name: 'email', label: 'Email Address', required: false, placeholder: 'Optional' },
      { type: 'radio', name: 'rating', label: 'Overall Rating', required: true, options: ['Excellent', 'Good', 'Average', 'Poor'] },
      { type: 'textarea', name: 'feedback', label: 'Your Feedback', required: true, placeholder: 'Tell us about your experience...' },
      { type: 'radio', name: 'recommend', label: 'Would you recommend us?', required: true, options: ['Yes, definitely', 'Probably', 'Not sure', 'Probably not', 'No'] }
    ],
    styling: {
      primaryColor: '#06b6d4',
      backgroundColor: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
      borderRadius: '8px',
      textColor: '#374151',
      buttonTextColor: '#ffffff',
      buttonBackgroundColor: '#06b6d4'
    },
    ctaText: 'Submit Feedback',
    thankYouMessage: 'Thank you for your valuable feedback!'
  },
  {
    id: 'job-application',
    name: 'Job Application',
    description: 'Application form for job openings',
    category: 'business',
    icon: <FileText className="w-6 h-6" />,
    popularity: 68,
    fields: [
      { type: 'text', name: 'first_name', label: 'First Name', required: true, placeholder: 'Your first name' },
      { type: 'text', name: 'last_name', label: 'Last Name', required: true, placeholder: 'Your last name' },
      { type: 'email', name: 'email', label: 'Email Address', required: true, placeholder: 'your.email@example.com' },
      { type: 'phone', name: 'phone', label: 'Phone Number', required: true, placeholder: '+1 (555) 123-4567' },
      { type: 'text', name: 'position', label: 'Position Applied For', required: true, placeholder: 'Job title' },
      { type: 'select', name: 'experience', label: 'Years of Experience', required: true, options: ['0-1 years', '2-5 years', '6-10 years', '10+ years'] },
      { type: 'textarea', name: 'cover_letter', label: 'Cover Letter', required: true, placeholder: 'Tell us why you\'re a great fit...' }
    ],
    styling: {
      primaryColor: '#dc2626',
      backgroundColor: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
      borderRadius: '8px',
      textColor: '#374151',
      buttonTextColor: '#ffffff',
      buttonBackgroundColor: '#dc2626'
    },
    ctaText: 'Apply Now',
    thankYouMessage: 'Application submitted! We\'ll review it and get back to you soon.'
  },
  {
    id: 'support-request',
    name: 'Support Request',
    description: 'Customer support and help desk form',
    category: 'business',
    icon: <MessageSquare className="w-6 h-6" />,
    popularity: 65,
    fields: [
      { type: 'text', name: 'name', label: 'Your Name', required: true, placeholder: 'Enter your name' },
      { type: 'email', name: 'email', label: 'Email Address', required: true, placeholder: 'Enter your email' },
      { type: 'select', name: 'priority', label: 'Priority Level', required: true, options: ['Low', 'Medium', 'High', 'Urgent'] },
      { type: 'select', name: 'category', label: 'Issue Category', required: true, options: ['Technical Issue', 'Billing Question', 'Feature Request', 'Bug Report', 'Other'] },
      { type: 'text', name: 'subject', label: 'Subject', required: true, placeholder: 'Brief description of your issue' },
      { type: 'textarea', name: 'description', label: 'Detailed Description', required: true, placeholder: 'Please provide as much detail as possible...' }
    ],
    styling: {
      primaryColor: '#7c3aed',
      backgroundColor: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
      borderRadius: '8px',
      textColor: '#374151',
      buttonTextColor: '#ffffff',
      buttonBackgroundColor: '#7c3aed'
    },
    ctaText: 'Submit Request',
    thankYouMessage: 'Support request submitted! Our team will respond within 24 hours.'
  }
];

export const FormTemplates: React.FC<FormTemplatesProps> = ({ onSelectTemplate, onBack }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', name: 'All Templates', count: templates.length },
    { id: 'business', name: 'Business', count: templates.filter(t => t.category === 'business').length },
    { id: 'personal', name: 'Personal', count: templates.filter(t => t.category === 'personal').length },
    { id: 'event', name: 'Events', count: templates.filter(t => t.category === 'event').length },
    { id: 'survey', name: 'Surveys', count: templates.filter(t => t.category === 'survey').length }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelectTemplate = (template: FormTemplate) => {
    const generatedForm: GeneratedForm = {
      title: template.name,
      description: template.description,
      fields: template.fields,
      ctaText: template.ctaText,
      thankYouMessage: template.thankYouMessage,
      styling: template.styling
    };
    onSelectTemplate(generatedForm);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={onBack} className="btn btn-secondary">
            ← Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Form Templates</h1>
            <p className="text-gray-600">Choose from our collection of professionally designed form templates</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input w-full"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="card p-6 hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => handleSelectTemplate(template)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    {template.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {template.name}
                    </h3>
                    <span className="text-xs text-gray-500 capitalize">
                      {template.category}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {template.popularity}%
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {template.description}
              </p>

              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-2">
                  {template.fields.length} fields
                </div>
                <div className="flex flex-wrap gap-1">
                  {template.fields.slice(0, 3).map((field, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                    >
                      {field.label}
                    </span>
                  ))}
                  {template.fields.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      +{template.fields.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div
                  className="w-8 h-8 rounded border-2"
                  style={{ backgroundColor: template.styling.primaryColor }}
                  title="Primary color"
                />
                <div className="flex items-center gap-1 text-blue-600 text-sm font-medium group-hover:gap-2 transition-all">
                  Use Template
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};