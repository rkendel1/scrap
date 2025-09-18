"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsiteExtractor = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const csstree = __importStar(require("css-tree"));
class WebsiteExtractor {
    async extractWebsiteData(url) {
        try {
            // Fetch the HTML content
            const response = await axios_1.default.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 10000
            });
            const $ = cheerio.load(response.data);
            // Extract basic metadata
            const title = $('title').text() || '';
            const description = $('meta[name="description"]').attr('content') || '';
            const favicon = $('link[rel="icon"], link[rel="shortcut icon"]').attr('href') || '';
            // Extract CSS from various sources
            const styles = await this.extractStyles($, url);
            const parsedCSS = this.parseCSS(styles);
            // Extract design tokens
            const designTokens = this.extractDesignTokens($, parsedCSS);
            // Extract voice analysis
            const voiceAnalysis = this.extractVoiceAnalysis($);
            // Generate preview HTML
            const previewHTML = this.generatePreviewHTML($);
            return {
                url,
                title,
                description,
                favicon,
                designTokens,
                voiceAnalysis,
                extractedAt: new Date().toISOString()
            };
        }
        catch (error) {
            console.error('Website extraction error:', error);
            throw new Error(`Failed to extract website data: ${error}`);
        }
    }
    async extractStyles($, baseUrl) {
        const styles = [];
        // Extract inline styles
        $('style').each((_, elem) => {
            const styleContent = $(elem).html();
            if (styleContent) {
                styles.push(styleContent);
            }
        });
        // Extract linked stylesheets (first 5 to avoid performance issues)
        const linkPromises = [];
        $('link[rel="stylesheet"]').slice(0, 5).each((_, elem) => {
            const href = $(elem).attr('href');
            if (href) {
                const absoluteUrl = new URL(href, baseUrl).toString();
                linkPromises.push(this.fetchStylesheet(absoluteUrl));
            }
        });
        const linkedStyles = await Promise.allSettled(linkPromises);
        linkedStyles.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                styles.push(result.value);
            }
        });
        return styles;
    }
    async fetchStylesheet(url) {
        try {
            const response = await axios_1.default.get(url, { timeout: 5000 });
            return response.data;
        }
        catch (error) {
            console.warn(`Failed to fetch stylesheet: ${url}`);
            return '';
        }
    }
    parseCSS(styles) {
        const allCSS = styles.join('\n');
        try {
            return csstree.parse(allCSS);
        }
        catch (error) {
            console.warn('CSS parsing error, using fallback:', error);
            return null;
        }
    }
    extractDesignTokens($, parsedCSS) {
        const previewHTML = this.generatePreviewHTML($);
        return {
            colorPalette: this.extractColors($, parsedCSS),
            primaryColors: this.extractPrimaryColors($, parsedCSS),
            colorUsage: this.analyzeColorUsage($),
            fontFamilies: this.extractFontFamilies($, parsedCSS),
            headings: this.extractHeadings($),
            textSamples: this.extractTextSamples($),
            margins: this.extractSpacingValues($, 'margin'),
            paddings: this.extractSpacingValues($, 'padding'),
            spacingScale: this.extractSpacingScale($, parsedCSS),
            layoutStructure: this.analyzeLayoutStructure($),
            gridSystem: this.analyzeGridSystem($),
            breakpoints: this.extractBreakpoints(parsedCSS),
            buttons: this.extractButtons($),
            formFields: this.extractFormFields($),
            cards: this.extractCards($),
            navigation: this.extractNavigation($),
            images: this.extractImages($),
            cssVariables: this.extractCSSVariables($, parsedCSS),
            rawCSS: this.getRawCSS($),
            formSchema: this.extractFormSchema($),
            logoUrl: this.extractLogo($),
            brandColors: this.extractBrandColors($),
            icons: this.extractIcons($),
            messaging: this.extractMessaging($),
            previewHTML
        };
    }
    extractColors($, parsedCSS) {
        const colors = new Set();
        // Extract from inline styles
        $('[style]').each((_, elem) => {
            const style = $(elem).attr('style') || '';
            const colorMatches = style.match(/#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)/g);
            if (colorMatches) {
                colorMatches.forEach(color => colors.add(color));
            }
        });
        // Extract from CSS if parsed successfully
        if (parsedCSS) {
            csstree.walk(parsedCSS, (node) => {
                if (node.type === 'HexColor') {
                    colors.add('#' + node.value);
                }
                else if (node.type === 'Function' && ['rgb', 'rgba', 'hsl', 'hsla'].includes(node.name)) {
                    colors.add(csstree.generate(node));
                }
            });
        }
        return Array.from(colors).slice(0, 20); // Limit to 20 colors
    }
    extractPrimaryColors($, parsedCSS) {
        const colors = this.extractColors($, parsedCSS);
        // Return first 5 colors as "primary" - in a real implementation, 
        // this would use more sophisticated analysis
        return colors.slice(0, 5);
    }
    analyzeColorUsage($) {
        const usage = {};
        $('[style]').each((_, elem) => {
            const style = $(elem).attr('style') || '';
            const colorMatches = style.match(/#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)/g);
            if (colorMatches) {
                colorMatches.forEach(color => {
                    usage[color] = (usage[color] || 0) + 1;
                });
            }
        });
        return usage;
    }
    extractFontFamilies($, parsedCSS) {
        const fonts = new Set();
        $('[style]').each((_, elem) => {
            const style = $(elem).attr('style') || '';
            const fontMatch = style.match(/font-family:\s*([^;]+)/);
            if (fontMatch) {
                fonts.add(fontMatch[1].replace(/['"]/g, '').trim());
            }
        });
        // Add some common system fonts as defaults
        fonts.add('system-ui');
        fonts.add('Arial');
        return Array.from(fonts).slice(0, 10);
    }
    extractHeadings($) {
        const headings = [];
        $('h1, h2, h3, h4, h5, h6').each((_, elem) => {
            const tag = elem.tagName.toLowerCase();
            const text = $(elem).text().trim();
            const level = parseInt(tag.charAt(1));
            if (text && headings.length < 10) {
                headings.push({ tag, text, level });
            }
        });
        return headings;
    }
    extractTextSamples($) {
        const samples = [];
        $('p').each((_, elem) => {
            const text = $(elem).text().trim();
            if (text && text.length > 20 && samples.length < 5) {
                samples.push(text.substring(0, 200));
            }
        });
        return samples;
    }
    extractSpacingValues($, property) {
        const values = new Set();
        $('[style]').each((_, elem) => {
            const style = $(elem).attr('style') || '';
            const regex = new RegExp(`${property}:\\s*([^;]+)`, 'g');
            let match;
            while ((match = regex.exec(style)) !== null) {
                values.add(match[1].trim());
            }
        });
        return Array.from(values).slice(0, 10);
    }
    extractSpacingScale($, parsedCSS) {
        // Mock implementation - would normally parse CSS for spacing patterns
        return [
            { value: 8, unit: 'px' },
            { value: 16, unit: 'px' },
            { value: 24, unit: 'px' },
            { value: 32, unit: 'px' }
        ];
    }
    analyzeLayoutStructure($) {
        return {
            hasHeader: $('header, .header').length > 0,
            hasFooter: $('footer, .footer').length > 0,
            hasSidebar: $('aside, .sidebar').length > 0,
            mainContent: $('main, .main').length > 0,
            sections: $('section').length
        };
    }
    analyzeGridSystem($) {
        return {
            containers: $('.container, .wrapper, .grid').length,
            columns: $('[class*="col-"], [class*="column"]').length,
            flexboxUsage: $('[style*="display: flex"], [style*="display:flex"]').length
        };
    }
    extractBreakpoints(parsedCSS) {
        // Mock implementation - would normally parse CSS media queries
        return ['768px', '992px', '1200px'];
    }
    extractButtons($) {
        const buttons = [];
        $('button, .btn, .button, input[type="submit"], input[type="button"]').each((_, elem) => {
            const text = $(elem).text().trim() || $(elem).val() || '';
            const type = elem.tagName.toLowerCase();
            const classes = $(elem).attr('class') || '';
            if (buttons.length < 10) {
                buttons.push({ text, type, classes });
            }
        });
        return buttons;
    }
    extractFormFields($) {
        const fields = [];
        $('input, textarea, select').each((_, elem) => {
            const type = $(elem).attr('type') || elem.tagName.toLowerCase();
            const name = $(elem).attr('name') || '';
            const placeholder = $(elem).attr('placeholder');
            if (fields.length < 20) {
                fields.push({ type, name, placeholder });
            }
        });
        return fields;
    }
    extractCards($) {
        const cards = [];
        $('.card, .post, .item, .product').each((_, elem) => {
            if (cards.length < 5) {
                cards.push({
                    hasImage: $(elem).find('img').length > 0,
                    hasTitle: $(elem).find('h1, h2, h3, h4, h5, h6').length > 0,
                    hasDescription: $(elem).find('p').length > 0
                });
            }
        });
        return cards;
    }
    extractNavigation($) {
        const navigation = [];
        $('nav, .nav, .navigation').each((_, elem) => {
            const links = [];
            $(elem).find('a').each((_, link) => {
                const text = $(link).text().trim();
                const href = $(link).attr('href') || '';
                if (text && links.length < 10) {
                    links.push({ text, href });
                }
            });
            if (links.length > 0) {
                navigation.push({ links });
            }
        });
        return navigation;
    }
    extractImages($) {
        const images = [];
        $('img').each((_, elem) => {
            if (images.length < 5) {
                images.push({
                    src: $(elem).attr('src') || '',
                    alt: $(elem).attr('alt') || '',
                    dimensions: {
                        width: $(elem).attr('width'),
                        height: $(elem).attr('height')
                    }
                });
            }
        });
        return images;
    }
    extractCSSVariables($, parsedCSS) {
        const variables = {};
        // Extract CSS custom properties
        if (parsedCSS) {
            csstree.walk(parsedCSS, (node) => {
                if (node.type === 'Declaration' && node.property.startsWith('--')) {
                    variables[node.property] = csstree.generate(node.value);
                }
            });
        }
        return variables;
    }
    getRawCSS($) {
        let css = '';
        $('style').each((_, elem) => {
            css += $(elem).html() + '\n';
        });
        return css.substring(0, 10000); // Limit to first 10KB
    }
    extractFormSchema($) {
        const forms = [];
        $('form').each((_, form) => {
            const fields = [];
            $(form).find('input, textarea, select').each((_, field) => {
                fields.push({
                    type: $(field).attr('type') || field.tagName.toLowerCase(),
                    name: $(field).attr('name') || '',
                    placeholder: $(field).attr('placeholder'),
                    required: $(field).attr('required') !== undefined
                });
            });
            if (fields.length > 0) {
                forms.push({ fields });
            }
        });
        return forms;
    }
    extractLogo($) {
        return $('img[src*="logo"], .logo img, #logo img').attr('src') || '';
    }
    extractBrandColors($) {
        // This would normally involve more sophisticated brand color detection
        const colors = this.extractColors($, null);
        return colors.slice(0, 3); // Return top 3 as brand colors
    }
    extractIcons($) {
        const icons = [];
        $('i, .icon, svg').each((_, elem) => {
            if (icons.length < 10) {
                icons.push({
                    type: elem.tagName.toLowerCase(),
                    classes: $(elem).attr('class') || ''
                });
            }
        });
        return icons;
    }
    extractMessaging($) {
        const messages = [];
        $('h1, .hero, .tagline, .slogan').each((_, elem) => {
            const text = $(elem).text().trim();
            if (text && text.length < 200 && messages.length < 5) {
                messages.push(text);
            }
        });
        return messages;
    }
    extractVoiceAnalysis($) {
        const text = $('body').text();
        // Simple tone analysis - in reality this would be more sophisticated
        const words = text.toLowerCase();
        const tones = {
            professional: (words.match(/professional|business|enterprise|solution/g) || []).length,
            friendly: (words.match(/welcome|hello|thanks|love|enjoy/g) || []).length,
            authoritative: (words.match(/leading|expert|proven|trusted|established/g) || []).length
        };
        const dominantTone = Object.entries(tones).reduce((a, b) => tones[a[0]] > tones[b[0]] ? a : b)[0];
        return {
            tone: {
                primary: dominantTone,
                scores: Object.entries(tones).map(([tone, score]) => ({ tone, score }))
            },
            personalityTraits: ['innovative', 'trustworthy', 'professional'], // Mock data
            audienceAnalysis: {
                primary: 'business',
                complexity: 'medium'
            }
        };
    }
    generatePreviewHTML($) {
        // Extract first few elements as preview
        const preview = $('body').children().slice(0, 3);
        return preview.toString().substring(0, 1000); // Limit to 1KB
    }
}
exports.WebsiteExtractor = WebsiteExtractor;
//# sourceMappingURL=extractor.js.map