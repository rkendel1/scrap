import axios, { AxiosError } from 'axios';
import * as cheerio from 'cheerio';
import * as csstree from 'css-tree';

export interface DesignTokens {
  colorPalette: string[];
  primaryColors: string[];
  colorUsage: Record<string, number>;
  fontFamilies: string[];
  headings: Array<{ tag: string; text: string; level: number }>;
  textSamples: string[];
  margins: string[];
  paddings: string[];
  spacingScale: Array<{ value: number; unit: string }>;
  layoutStructure: Record<string, any>;
  gridSystem: Record<string, any>;
  breakpoints: string[];
  buttons: Array<{ text: string; type: string; classes: string }>;
  formFields: Array<{ type: string; name: string; placeholder?: string }>;
  cards: Array<{ hasImage: boolean; hasTitle: boolean; hasDescription: boolean }>;
  navigation: Array<Record<string, any>>;
  images: Array<{ src: string; alt: string; dimensions: { width?: string; height?: string } }>;
  cssVariables: Record<string, string>;
  rawCSS: string;
  formSchema: Array<{ fields: Array<{ type: string; name: string; placeholder?: string; required?: boolean }> }>;
  logoUrl: string;
  brandColors: string[];
  icons: Array<{ type: string; classes: string }>;
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

export class WebsiteExtractor {
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY_MS = 1000; // 1 second

  /**
   * Helper function to make an Axios request with retries and exponential backoff.
   * It will not retry on 403 Forbidden or 401 Unauthorized errors.
   */
  private async makeRequestWithRetries<T>(
    requestFn: () => Promise<T>,
    url: string,
    retriesLeft: number = this.MAX_RETRIES,
    delay: number = this.INITIAL_RETRY_DELAY_MS
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        
        // Do NOT retry on 403 Forbidden or 401 Unauthorized
        if (status === 403 || status === 401) {
          throw new Error(`Failed to extract website data: The website (${url}) blocked the request (${status} Forbidden/Unauthorized). Please try a different URL.`);
        }
        
        // Retry on network errors (status undefined), 429 Too Many Requests, or 5xx server errors
        if (retriesLeft > 0 && (status === undefined || status === 429 || (status >= 500 && status < 600))) {
          console.warn(`Request to ${url} failed with status ${status || 'network error'}. Retrying in ${delay / 1000}s... (${retriesLeft} retries left)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.makeRequestWithRetries(requestFn, url, retriesLeft - 1, delay * 2); // Exponential backoff
        }
      }
      // If not an Axios error, or not a retriable status, or no retries left, re-throw
      throw error;
    }
  }

  /**
   * Extracts design tokens, voice analysis, and other metadata from a given URL.
   * Note: Some websites employ anti-bot measures (e.g., Cloudflare) that may block scraping requests,
   * resulting in a 403 Forbidden error. In such cases, try a different URL.
   */
  async extractWebsiteData(url: string): Promise<ExtractedData> {
    try {
      // Fetch the HTML content with retries
      const response = await this.makeRequestWithRetries(
        () => axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 10000
        }),
        url
      );

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

    } catch (error) {
      // Re-throw specific 403/401 errors from makeRequestWithRetries
      if (error instanceof Error && error.message.includes('blocked the request')) {
        throw error;
      }
      console.error('Website extraction error:', error);
      throw new Error(`Failed to extract website data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractStyles($: cheerio.CheerioAPI, baseUrl: string): Promise<string[]> {
    const styles: string[] = [];
    
    // Extract inline styles
    $('style').each((_, elem) => {
      const styleContent = $(elem).html();
      if (styleContent) {
        styles.push(styleContent);
      }
    });

    // Extract linked stylesheets (first 5 to avoid performance issues)
    const linkPromises: Promise<string>[] = [];
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

  private async fetchStylesheet(url: string): Promise<string> {
    try {
      // Fetch stylesheet with retries
      const response = await this.makeRequestWithRetries(
        () => axios.get(url, { timeout: 5000 }),
        url
      );
      return response.data;
    } catch (error) {
      console.warn(`Failed to fetch stylesheet: ${url}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return '';
    }
  }

  private parseCSS(styles: string[]): any {
    const allCSS = styles.join('\n');
    try {
      return csstree.parse(allCSS);
    } catch (error) {
      console.warn('CSS parsing error, using fallback:', error);
      return null;
    }
  }

  private extractDesignTokens($: cheerio.CheerioAPI, parsedCSS: any): DesignTokens {
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

  private extractColors($: cheerio.CheerioAPI, parsedCSS: any): string[] {
    const colors = new Set<string>();
    
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
      csstree.walk(parsedCSS, (node: any) => {
        if (node.type === 'HexColor') {
          colors.add('#' + node.value);
        } else if (node.type === 'Function' && ['rgb', 'rgba', 'hsl', 'hsla'].includes(node.name)) {
          colors.add(csstree.generate(node));
        }
      });
    }

    return Array.from(colors).slice(0, 20); // Limit to 20 colors
  }

  private extractPrimaryColors($: cheerio.CheerioAPI, parsedCSS: any): string[] {
    const colors = this.extractColors($, parsedCSS);
    // Return first 5 colors as "primary" - in a real implementation, 
    // this would use more sophisticated analysis
    return colors.slice(0, 5);
  }

  private analyzeColorUsage($: cheerio.CheerioAPI): Record<string, number> {
    const usage: Record<string, number> = {};
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

  private extractFontFamilies($: cheerio.CheerioAPI, parsedCSS: any): string[] {
    const fonts = new Set<string>();
    
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

  private extractHeadings($: cheerio.CheerioAPI): Array<{ tag: string; text: string; level: number }> {
    const headings: Array<{ tag: string; text: string; level: number }> = [];
    
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

  private extractTextSamples($: cheerio.CheerioAPI): string[] {
    const samples: string[] = [];
    
    $('p').each((_, elem) => {
      const text = $(elem).text().trim();
      if (text && text.length > 20 && samples.length < 5) {
        samples.push(text.substring(0, 200));
      }
    });
    
    return samples;
  }

  private extractSpacingValues($: cheerio.CheerioAPI, property: string): string[] {
    const values = new Set<string>();
    
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

  private extractSpacingScale($: cheerio.CheerioAPI, parsedCSS: any): Array<{ value: number; unit: string }> {
    // Mock implementation - would normally parse CSS for spacing patterns
    return [
      { value: 8, unit: 'px' },
      { value: 16, unit: 'px' },
      { value: 24, unit: 'px' },
      { value: 32, unit: 'px' }
    ];
  }

  private analyzeLayoutStructure($: cheerio.CheerioAPI): Record<string, any> {
    return {
      hasHeader: $('header, .header').length > 0,
      hasFooter: $('footer, .footer').length > 0,
      hasSidebar: $('aside, .sidebar').length > 0,
      mainContent: $('main, .main').length > 0,
      sections: $('section').length
    };
  }

  private analyzeGridSystem($: cheerio.CheerioAPI): Record<string, any> {
    return {
      containers: $('.container, .wrapper, .grid').length,
      columns: $('[class*="col-"], [class*="column"]').length,
      flexboxUsage: $('[style*="display: flex"], [style*="display:flex"]').length
    };
  }

  private extractBreakpoints(parsedCSS: any): string[] {
    // Mock implementation - would normally parse CSS media queries
    return ['768px', '992px', '1200px'];
  }

  private extractButtons($: cheerio.CheerioAPI): Array<{ text: string; type: string; classes: string }> {
    const buttons: Array<{ text: string; type: string; classes: string }> = [];
    
    $('button, .btn, .button, input[type="submit"], input[type="button"]').each((_, elem) => {
      const text = $(elem).text().trim() || $(elem).val() as string || '';
      const type = elem.tagName.toLowerCase();
      const classes = $(elem).attr('class') || '';
      
      if (buttons.length < 10) {
        buttons.push({ text, type, classes });
      }
    });
    
    return buttons;
  }

  private extractFormFields($: cheerio.CheerioAPI): Array<{ type: string; name: string; placeholder?: string }> {
    const fields: Array<{ type: string; name: string; placeholder?: string }> = [];
    
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

  private extractCards($: cheerio.CheerioAPI): Array<{ hasImage: boolean; hasTitle: boolean; hasDescription: boolean }> {
    const cards: Array<{ hasImage: boolean; hasTitle: boolean; hasDescription: boolean }> = [];
    
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

  private extractNavigation($: cheerio.CheerioAPI): Array<Record<string, any>> {
    const navigation: Array<Record<string, any>> = [];
    
    $('nav, .nav, .navigation').each((_, elem) => {
      const links: Array<{ text: string; href: string }> = [];
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

  private extractImages($: cheerio.CheerioAPI): Array<{ src: string; alt: string; dimensions: { width?: string; height?: string } }> {
    const images: Array<{ src: string; alt: string; dimensions: { width?: string; height?: string } }> = [];
    
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

  private extractCSSVariables($: cheerio.CheerioAPI, parsedCSS: any): Record<string, string> {
    const variables: Record<string, string> = {};
    
    // Extract CSS custom properties
    if (parsedCSS) {
      csstree.walk(parsedCSS, (node: any) => {
        if (node.type === 'Declaration' && node.property.startsWith('--')) {
          variables[node.property] = csstree.generate(node.value);
        }
      });
    }
    
    return variables;
  }

  private getRawCSS($: cheerio.CheerioAPI): string {
    let css = '';
    $('style').each((_, elem) => {
      css += $(elem).html() + '\n';
    });
    return css.substring(0, 10000); // Limit to first 10KB
  }

  private extractFormSchema($: cheerio.CheerioAPI): Array<{ fields: Array<{ type: string; name: string; placeholder?: string; required?: boolean }> }> {
    const forms: Array<{ fields: Array<{ type: string; name: string; placeholder?: string; required?: boolean }> }> = [];
    
    $('form').each((_, form) => {
      const fields: Array<{ type: string; name: string; placeholder?: string; required?: boolean }> = [];
      
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

  private extractLogo($: cheerio.CheerioAPI): string {
    return $('img[src*="logo"], .logo img, #logo img').attr('src') || '';
  }

  private extractBrandColors($: cheerio.CheerioAPI): string[] {
    // This would normally involve more sophisticated brand color detection
    const colors = this.extractColors($, null);
    return colors.slice(0, 3); // Return top 3 as brand colors
  }

  private extractIcons($: cheerio.CheerioAPI): Array<{ type: string; classes: string }> {
    const icons: Array<{ type: string; classes: string }> = [];
    
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

  private extractMessaging($: cheerio.CheerioAPI): string[] {
    const messages: string[] = [];
    
    $('h1, .hero, .tagline, .slogan').each((_, elem) => {
      const text = $(elem).text().trim();
      if (text && text.length < 200 && messages.length < 5) {
        messages.push(text);
      }
    });
    
    return messages;
  }

  private extractVoiceAnalysis($: cheerio.CheerioAPI): VoiceAnalysis {
    const text = $('body').text();
    
    // Simple tone analysis - in reality this would be more sophisticated
    const words = text.toLowerCase();
    const tones = {
      professional: (words.match(/professional|business|enterprise|solution/g) || []).length,
      friendly: (words.match(/welcome|hello|thanks|love|enjoy/g) || []).length,
      authoritative: (words.match(/leading|expert|proven|trusted|established/g) || []).length
    };
    
    const dominantTone = Object.entries(tones).reduce((a, b) => tones[a[0] as keyof typeof tones] > tones[b[0] as keyof typeof tones] ? a : b)[0];
    
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

  private generatePreviewHTML($: cheerio.CheerioAPI): string {
    // Extract first few elements as preview
    const preview = $('body').children().slice(0, 3);
    return preview.toString().substring(0, 1000); // Limit to 1KB
  }
}