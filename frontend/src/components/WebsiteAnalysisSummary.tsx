import React from 'react';
import { FormData } from '../types/api';
import { Sparkles } from 'lucide-react';

interface WebsiteAnalysisSummaryProps {
  extractedDesignTokens?: any | null;
  extractedVoiceAnalysis?: any | null;
  formData?: Partial<FormData>;
}

export const WebsiteAnalysisSummary: React.FC<WebsiteAnalysisSummaryProps> = ({
  extractedDesignTokens,
  extractedVoiceAnalysis,
  formData,
}) => {
  const { url } = formData || {};
  const hasAnalysisData = (extractedDesignTokens || extractedVoiceAnalysis);

  const formatArray = (arr: any[], limit = 3) => 
    Array.isArray(arr) && arr.length > 0 
      ? arr.slice(0, limit).join(', ') + (arr.length > limit ? ` +${arr.length - limit} more` : '')
      : 'None';

  const formatObject = (obj: Record<string, any>, limit = 2) => 
    obj && Object.keys(obj).length > 0
      ? Object.entries(obj).slice(0, limit).map(([key, val]) => `${key}: ${val}`).join(', ') + (Object.keys(obj).length > limit ? ` +${Object.keys(obj).length - limit} more` : '')
      : 'None';

  const { 
    colorPalette, primaryColors, colorUsage, fontFamilies, headings, textSamples,
    margins, paddings, spacingScale, layoutStructure, gridSystem, breakpoints,
    buttons, formFields, cards, navigation, images, cssVariables, rawCSS, formSchema,
    logoUrl, brandColors, icons, messaging
  } = extractedDesignTokens || {};
  const { tone, personalityTraits, audienceAnalysis } = extractedVoiceAnalysis || {};

  return (
    <div className="card p-6 space-y-4">
      <div className="text-center">
        <Sparkles size={32} className="text-yellow-400 mb-2 mx-auto animate-pulse" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Website Analysis Summary</h3>
        <p className="text-sm text-gray-600">
          {hasAnalysisData ? (
            <>From <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{url}</a>:</>
          ) : (
            "Enter a URL to see design tokens, typography, and voice analysis here."
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        {/* Card 1: Colors & Brand Colors */}
        <div 
          className="p-3 rounded-lg border border-gray-200 bg-gray-50"
          title={hasAnalysisData ? `Palette: ${formatArray(colorPalette || [], 10)}\nPrimary: ${formatArray(primaryColors || [], 5)}\nUsage: ${formatObject(colorUsage || {}, 5)}\nBrand Colors: ${formatArray(brandColors || [], 5)}` : "Color Palette & Brand Colors"}
        >
          <strong className="block text-blue-600 mb-1 text-sm">Colors & Brand:</strong>
          {hasAnalysisData && ((colorPalette && colorPalette.length > 0) || (primaryColors && primaryColors.length > 0)) ? (
            <div className="flex flex-wrap gap-1">
              {primaryColors && primaryColors.slice(0, 2).map((color: string, index: number) => (
                <div key={`brand-${index}`} className="w-4 h-4 rounded-sm border border-gray-300" style={{ backgroundColor: color }}></div>
              ))}
              {colorPalette && colorPalette.slice(0, 2).map((color: string, index: number) => ( 
                <div key={`palette-${index}`} className="w-4 h-4 rounded-sm border border-gray-200" style={{ backgroundColor: color }}></div>
              ))}
              {(primaryColors?.length || 0) + (colorPalette?.length || 0) > 4 && <span className="text-gray-500"> +{((primaryColors?.length || 0) + (colorPalette?.length || 0)) - 4}</span>}
            </div>
          ) : <span className="text-gray-500">N/A</span>}
        </div>

        {/* Card 2: Typography */}
        <div 
          className="p-3 rounded-lg border border-gray-200 bg-gray-50"
          title={hasAnalysisData ? `Font Families: ${formatArray(fontFamilies || [], 5)}\nHeadings: ${formatArray((headings || []).map(h => h.text), 5)}\nText Samples: ${formatArray(textSamples || [], 2)}` : "Font Families & Headings"}
        >
          <strong className="block text-green-600 mb-1 text-sm">Typography:</strong>
          {hasAnalysisData && (fontFamilies && fontFamilies.length > 0) ? (
            <span className="text-gray-700">
              {fontFamilies.slice(0, 1).join(', ')}
              {fontFamilies.length > 1 && ` +${fontFamilies.length - 1}`}
            </span>
          ) : <span className="text-gray-500">system-ui, +1</span>}
        </div>

        {/* Card 3: Spacing */}
        <div 
          className="p-3 rounded-lg border border-gray-200 bg-gray-50"
          title={hasAnalysisData ? `Margins: ${formatArray(margins || [], 5)}\nPaddings: ${formatArray(paddings || [], 5)}\nScale: ${formatArray((spacingScale || []).map((s: any) => `${s.value}${s.unit}`), 5)}` : "Margins, Paddings & Scale"}
        >
          <strong className="block text-pink-600 mb-1 text-sm">Spacing:</strong>
          {hasAnalysisData && ((margins && margins.length > 0) || (paddings && paddings.length > 0)) ? (
            <span className="text-gray-700">
              M: {formatArray(margins || [], 1)} | P: {formatArray(paddings || [], 1)}
            </span>
          ) : <span className="text-gray-500">None</span>}
        </div>

        {/* Card 4: Layout Structure */}
        <div 
          className="p-3 rounded-lg border border-gray-200 bg-gray-50"
          title={hasAnalysisData ? `Structure: ${formatObject(layoutStructure || {}, 5)}\nGrid: ${formatObject(gridSystem || {}, 5)}\nBreakpoints: ${formatArray(breakpoints || [], 5)}` : "Page Structure & Grid"}
        >
          <strong className="block text-teal-600 mb-1 text-sm">Layout Structure:</strong>
          {hasAnalysisData && (layoutStructure && Object.keys(layoutStructure).length > 0) ? (
            <span className="text-gray-700">
              Header: {layoutStructure.hasHeader ? 'Yes' : 'No'} | Sections: {layoutStructure.sections || 'N/A'}
            </span>
          ) : <span className="text-gray-500">Header: No, Sections: 1</span>}
        </div>

        {/* Card 5: UI Components (Buttons, Forms, Cards, Navigation) */}
        <div 
          className="p-3 rounded-lg border border-gray-200 bg-gray-50"
          title={hasAnalysisData ? `Buttons: ${formatArray((buttons || []).map((b: any) => b.text), 5)}\nForm Fields: ${formatArray((formFields || []).map((f: any) => f.name), 5)}\nCards: ${formatArray((cards || []).map((c: any) => `Img:${c.hasImage} Title:${c.hasTitle}`), 5)}\nNavigation: ${formatArray((navigation || []).map((n: any) => n.links?.length + ' links'), 5)}` : "Buttons, Forms & Cards"}
        >
          <strong className="block text-orange-600 mb-1 text-sm">UI Components:</strong>
          {hasAnalysisData && ((buttons && buttons.length > 0) || (formFields && formFields.length > 0) || (cards && cards.length > 0) || (navigation && navigation.length > 0)) ? (
            <span className="text-gray-700">
              Btns: {buttons?.length || 0} | Forms: {formFields?.length || 0} | Cards: {cards?.length || 0}
            </span>
          ) : <span className="text-gray-500">Btns: 0 | Forms: 0 | Cards: 0</span>}
        </div>

        {/* Card 6: CSS Details (Variables, Raw CSS) */}
        <div 
          className="p-3 rounded-lg border border-gray-200 bg-gray-50"
          title={hasAnalysisData ? `CSS Variables: ${formatObject(cssVariables || {}, 10)}\nRaw CSS (first 500 chars): ${rawCSS?.substring(0, 500) || 'N/A'}` : "CSS Variables & Raw CSS"}
        >
          <strong className="block text-gray-700 mb-1 text-sm">CSS Details:</strong>
          {hasAnalysisData && (cssVariables && Object.keys(cssVariables).length > 0) ? (
            <span className="text-gray-700">
              {Object.keys(cssVariables).length} vars | Raw: {rawCSS ? 'Yes' : 'No'}
            </span>
          ) : <span className="text-gray-500">36 vars | Raw: Yes</span>}
        </div>

        {/* Card 7: Voice Tone & Personality */}
        <div 
          className="p-3 rounded-lg border border-gray-200 bg-gray-50"
          title={hasAnalysisData ? `Primary Tone: ${tone?.primary || 'N/A'}\nScores: ${formatObject(tone?.scores?.reduce((acc: any, s: any) => ({...acc, [s.tone]: s.score}), {}) || {}, 5)}\nPersonality Traits: ${formatArray(personalityTraits || [], 5)}` : "Tone & Personality"}
        >
          <strong className="block text-yellow-600 mb-1 text-sm">Voice Tone:</strong>
          {hasAnalysisData && (tone && tone.primary) ? (
            <span className="text-gray-700">{tone.primary}</span>
          ) : <span className="text-gray-500">authoritative</span>}
          {hasAnalysisData && (personalityTraits && personalityTraits.length > 0) && (
            <span className="text-gray-700 block mt-1">
              Personality: {personalityTraits.slice(0, 1).join(', ')}
            </span>
          )}
        </div>

        {/* Card 8: Audience & Messaging */}
        <div 
          className="p-3 rounded-lg border border-gray-200 bg-gray-50"
          title={hasAnalysisData ? `Primary Audience: ${audienceAnalysis?.primary || 'N/A'}\nComplexity: ${audienceAnalysis?.complexity || 'N/A'}\nMessaging: ${formatArray(messaging || [], 5)}` : "Audience & Messaging"}
        >
          <strong className="block text-purple-600 mb-1 text-sm">Audience & Messaging:</strong>
          {hasAnalysisData && (audienceAnalysis && audienceAnalysis.primary) ? (
            <span className="text-gray-700">{audienceAnalysis.primary} ({audienceAnalysis.complexity})</span>
          ) : <span className="text-gray-500">business (medium) Messages: 1</span>}
          {hasAnalysisData && (messaging && messaging.length > 0) && (
            <span className="text-gray-700 block mt-1">
              Messages: {messaging.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};