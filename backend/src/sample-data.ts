import { MockDatabaseService } from './mock-database-service';
import { ExtractedData } from './extractor';

// Create mock database service with sample data
export function createMockDatabaseWithSampleData(): MockDatabaseService {
  const mockDb = new MockDatabaseService();
  
  // Add some sample extracted data
  const sampleData1: ExtractedData = {
    url: 'https://react.dev',
    title: 'React - The Library for Web and Native User Interfaces',
    description: 'React is the library for web and native user interfaces. Build user interfaces out of individual pieces called components written in JavaScript.',
    favicon: 'https://react.dev/favicon.ico',
    designTokens: {
      colorPalette: ['#087ea4', '#149eca', '#58c4dc', '#f1f8ff', '#f7fafc', '#1a202c'],
      primaryColors: ['#087ea4', '#149eca'],
      colorUsage: { '#087ea4': 15, '#149eca': 8, '#58c4dc': 5 },
      fontFamilies: ['Source Sans Pro', 'ui-sans-serif', 'system-ui', 'Arial'],
      headings: [
        { tag: 'h1', text: 'React', level: 1 },
        { tag: 'h2', text: 'The library for web and native user interfaces', level: 2 },
        { tag: 'h3', text: 'Create user interfaces from components', level: 3 }
      ],
      textSamples: [
        'React is the library for web and native user interfaces.',
        'Build user interfaces out of individual pieces called components.',
        'Write components with code and markup that\'s easy to read and maintain.'
      ],
      margins: ['0', '8px', '16px', '24px', '32px'],
      paddings: ['4px', '8px', '12px', '16px', '24px'],
      spacingScale: [
        { value: 4, unit: 'px' },
        { value: 8, unit: 'px' },
        { value: 16, unit: 'px' },
        { value: 24, unit: 'px' }
      ],
      layoutStructure: {
        hasHeader: true,
        hasFooter: true,
        hasSidebar: false,
        mainContent: true,
        sections: 5
      },
      gridSystem: {
        containers: 3,
        columns: 12,
        flexboxUsage: 25
      },
      breakpoints: ['640px', '768px', '1024px', '1280px'],
      buttons: [
        { text: 'Learn React', type: 'button', classes: 'btn-primary' },
        { text: 'API Reference', type: 'button', classes: 'btn-secondary' },
        { text: 'Tutorial', type: 'button', classes: 'btn-outline' }
      ],
      formFields: [
        { type: 'email', name: 'email', placeholder: 'Enter your email' },
        { type: 'text', name: 'name', placeholder: 'Your name' }
      ],
      cards: [
        { hasImage: true, hasTitle: true, hasDescription: true },
        { hasImage: false, hasTitle: true, hasDescription: true }
      ],
      navigation: [
        {
          links: [
            { text: 'Learn', href: '/learn' },
            { text: 'Reference', href: '/reference' },
            { text: 'Community', href: '/community' }
          ]
        }
      ],
      images: [
        { src: '/logo.svg', alt: 'React Logo', dimensions: { width: '100', height: '100' } }
      ],
      cssVariables: {
        '--color-brand': '#087ea4',
        '--color-brand-secondary': '#149eca',
        '--font-family-text': 'Source Sans Pro',
        '--spacing-xs': '4px',
        '--spacing-sm': '8px'
      },
      rawCSS: ':root { --color-brand: #087ea4; --color-brand-secondary: #149eca; } body { font-family: var(--font-family-text); }',
      formSchema: [
        {
          fields: [
            { type: 'email', name: 'email', placeholder: 'Enter your email', required: true },
            { type: 'text', name: 'name', placeholder: 'Your name', required: false }
          ]
        }
      ],
      logoUrl: 'https://react.dev/logo.svg',
      brandColors: ['#087ea4', '#149eca', '#58c4dc'],
      icons: [
        { type: 'svg', classes: 'icon-react' },
        { type: 'i', classes: 'fas fa-code' }
      ],
      messaging: [
        'The library for web and native user interfaces',
        'Build user interfaces out of individual pieces called components'
      ],
      previewHTML: '<div class="hero"><h1>React</h1><p>The library for web and native user interfaces</p></div>'
    },
    voiceAnalysis: {
      tone: {
        primary: 'professional',
        scores: [
          { tone: 'professional', score: 9 },
          { tone: 'friendly', score: 7 },
          { tone: 'authoritative', score: 8 }
        ]
      },
      personalityTraits: ['innovative', 'technical', 'approachable'],
      audienceAnalysis: {
        primary: 'developers',
        complexity: 'high'
      }
    },
    extractedAt: new Date().toISOString()
  };

  const sampleData2: ExtractedData = {
    url: 'https://tailwindcss.com',
    title: 'Tailwind CSS - Rapidly build modern websites without ever leaving your HTML',
    description: 'A utility-first CSS framework packed with classes that can be composed to build any design, directly in your markup.',
    favicon: 'https://tailwindcss.com/favicon.ico',
    designTokens: {
      colorPalette: ['#0f172a', '#1e293b', '#334155', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0', '#f1f5f9', '#f8fafc'],
      primaryColors: ['#0f172a', '#3b82f6'],
      colorUsage: { '#0f172a': 12, '#3b82f6': 8 },
      fontFamilies: ['Inter', 'ui-sans-serif', 'system-ui'],
      headings: [
        { tag: 'h1', text: 'Rapidly build modern websites without ever leaving your HTML', level: 1 },
        { tag: 'h2', text: 'Utility-first fundamentals', level: 2 }
      ],
      textSamples: [
        'A utility-first CSS framework packed with classes like flex, pt-4, text-center and rotate-90.',
        'Build any design, directly in your markup.'
      ],
      margins: ['0', '0.25rem', '0.5rem', '1rem', '1.5rem', '2rem'],
      paddings: ['0.25rem', '0.5rem', '0.75rem', '1rem', '1.25rem'],
      spacingScale: [
        { value: 4, unit: 'px' },
        { value: 8, unit: 'px' },
        { value: 12, unit: 'px' },
        { value: 16, unit: 'px' }
      ],
      layoutStructure: {
        hasHeader: true,
        hasFooter: true,
        hasSidebar: true,
        mainContent: true,
        sections: 8
      },
      gridSystem: {
        containers: 5,
        columns: 0,
        flexboxUsage: 40
      },
      breakpoints: ['640px', '768px', '1024px', '1280px', '1536px'],
      buttons: [
        { text: 'Get started', type: 'button', classes: 'bg-blue-500 text-white' },
        { text: 'Documentation', type: 'button', classes: 'border border-slate-300' }
      ],
      formFields: [],
      cards: [
        { hasImage: true, hasTitle: true, hasDescription: true },
        { hasImage: true, hasTitle: true, hasDescription: false }
      ],
      navigation: [
        {
          links: [
            { text: 'Docs', href: '/docs' },
            { text: 'Components', href: '/components' },
            { text: 'Blog', href: '/blog' }
          ]
        }
      ],
      images: [
        { src: '/logo.svg', alt: 'Tailwind CSS', dimensions: { width: '40', height: '40' } }
      ],
      cssVariables: {},
      rawCSS: '.bg-blue-500 { background-color: #3b82f6; } .text-white { color: #ffffff; }',
      formSchema: [],
      logoUrl: 'https://tailwindcss.com/logo.svg',
      brandColors: ['#0f172a', '#3b82f6', '#06b6d4'],
      icons: [
        { type: 'svg', classes: 'w-6 h-6' }
      ],
      messaging: [
        'Rapidly build modern websites without ever leaving your HTML',
        'A utility-first CSS framework'
      ],
      previewHTML: '<div class="bg-white"><h1 class="text-4xl font-bold">Tailwind CSS</h1></div>'
    },
    voiceAnalysis: {
      tone: {
        primary: 'modern',
        scores: [
          { tone: 'modern', score: 10 },
          { tone: 'professional', score: 8 },
          { tone: 'innovative', score: 9 }
        ]
      },
      personalityTraits: ['efficient', 'modern', 'developer-focused'],
      audienceAnalysis: {
        primary: 'frontend-developers',
        complexity: 'medium'
      }
    },
    extractedAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  };

  // Add the sample data to the mock database
  mockDb.saveExtractedData(sampleData1);
  mockDb.saveExtractedData(sampleData2);

  return mockDb;
}