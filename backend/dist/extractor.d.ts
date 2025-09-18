export interface DesignTokens {
    colorPalette: string[];
    primaryColors: string[];
    colorUsage: Record<string, number>;
    fontFamilies: string[];
    headings: Array<{
        tag: string;
        text: string;
        level: number;
    }>;
    textSamples: string[];
    margins: string[];
    paddings: string[];
    spacingScale: Array<{
        value: number;
        unit: string;
    }>;
    layoutStructure: Record<string, any>;
    gridSystem: Record<string, any>;
    breakpoints: string[];
    buttons: Array<{
        text: string;
        type: string;
        classes: string;
    }>;
    formFields: Array<{
        type: string;
        name: string;
        placeholder?: string;
    }>;
    cards: Array<{
        hasImage: boolean;
        hasTitle: boolean;
        hasDescription: boolean;
    }>;
    navigation: Array<Record<string, any>>;
    images: Array<{
        src: string;
        alt: string;
        dimensions: {
            width?: string;
            height?: string;
        };
    }>;
    cssVariables: Record<string, string>;
    rawCSS: string;
    formSchema: Array<{
        fields: Array<{
            type: string;
            name: string;
            placeholder?: string;
            required?: boolean;
        }>;
    }>;
    logoUrl: string;
    brandColors: string[];
    icons: Array<{
        type: string;
        classes: string;
    }>;
    messaging: string[];
    previewHTML: string;
}
export interface VoiceAnalysis {
    tone: Record<string, any>;
    personalityTraits: string[];
    audienceAnalysis: Record<string, any>;
}
export interface ExtractedData {
    url: string;
    title: string;
    description: string;
    favicon: string;
    designTokens: DesignTokens;
    voiceAnalysis: VoiceAnalysis;
    extractedAt: string;
}
export declare class WebsiteExtractor {
    extractWebsiteData(url: string): Promise<ExtractedData>;
    private extractStyles;
    private fetchStylesheet;
    private parseCSS;
    private extractDesignTokens;
    private extractColors;
    private extractPrimaryColors;
    private analyzeColorUsage;
    private extractFontFamilies;
    private extractHeadings;
    private extractTextSamples;
    private extractSpacingValues;
    private extractSpacingScale;
    private analyzeLayoutStructure;
    private analyzeGridSystem;
    private extractBreakpoints;
    private extractButtons;
    private extractFormFields;
    private extractCards;
    private extractNavigation;
    private extractImages;
    private extractCSSVariables;
    private getRawCSS;
    private extractFormSchema;
    private extractLogo;
    private extractBrandColors;
    private extractIcons;
    private extractMessaging;
    private extractVoiceAnalysis;
    private generatePreviewHTML;
}
//# sourceMappingURL=extractor.d.ts.map