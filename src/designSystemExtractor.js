const axios = require('axios');
const cheerio = require('cheerio');
const cssTree = require('css-tree');

async function extractDesignSystem(url) {
  try {
    // Fetch the HTML content
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);

    // Extract CSS from various sources
    const styles = await extractStyles($, url);
    
    // Parse and analyze the CSS
    const parsedCSS = parseCSS(styles);
    
    // Extract design system components
    const designSystem = {
      colors: extractColors(parsedCSS, $),
      typography: extractTypography(parsedCSS, $),
      spacing: extractSpacing(parsedCSS),
      layout: extractLayout(parsedCSS, $),
      components: extractComponents($),
      branding: extractBranding($),
      metadata: {
        title: $('title').text(),
        description: $('meta[name="description"]').attr('content') || '',
        favicon: $('link[rel="icon"], link[rel="shortcut icon"]').attr('href') || '',
        extractedAt: new Date().toISOString()
      }
    };

    return designSystem;

  } catch (error) {
    console.error('Design system extraction error:', error);
    throw new Error(`Failed to extract design system: ${error.message}`);
  }
}

async function extractStyles($, baseUrl) {
  const styles = [];
  
  // Extract inline styles
  $('style').each((i, elem) => {
    styles.push($(elem).html());
  });

  // Extract external stylesheets (simplified - in production you'd fetch these)
  const externalStylesheets = [];
  $('link[rel="stylesheet"]').each((i, elem) => {
    const href = $(elem).attr('href');
    if (href) {
      externalStylesheets.push(href);
    }
  });

  // For now, we'll work with inline styles and analyze the HTML structure
  return styles.join('\n');
}

function parseCSS(cssText) {
  const rules = [];
  
  try {
    if (cssText.trim()) {
      const ast = cssTree.parse(cssText);
      cssTree.walk(ast, function(node) {
        if (node.type === 'Rule') {
          rules.push(node);
        }
      });
    }
  } catch (error) {
    console.warn('CSS parsing error:', error.message);
  }
  
  return rules;
}

function extractColors(parsedCSS, $) {
  const colors = new Set();
  const colorPattern = /#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)/g;

  // Extract from CSS
  parsedCSS.forEach(rule => {
    const cssText = cssTree.generate(rule);
    const matches = cssText.match(colorPattern);
    if (matches) {
      matches.forEach(color => colors.add(color));
    }
  });

  // Extract from inline styles
  $('[style]').each((i, elem) => {
    const style = $(elem).attr('style');
    const matches = style.match(colorPattern);
    if (matches) {
      matches.forEach(color => colors.add(color));
    }
  });

  return {
    palette: Array.from(colors),
    primary: Array.from(colors).slice(0, 5), // Top 5 as primary colors
    usage: analyzeColorUsage(Array.from(colors), $)
  };
}

function extractTypography(parsedCSS, $) {
  const fontFamilies = new Set();
  const fontSizes = new Set();
  const fontWeights = new Set();

  // Extract from computed styles and common elements
  const headings = [];
  $('h1, h2, h3, h4, h5, h6').each((i, elem) => {
    const tagName = elem.tagName.toLowerCase();
    headings.push({
      tag: tagName,
      text: $(elem).text().trim().substring(0, 100),
      level: parseInt(tagName.charAt(1))
    });
  });

  // Extract font families from CSS
  parsedCSS.forEach(rule => {
    const cssText = cssTree.generate(rule);
    const fontFamilyMatch = cssText.match(/font-family:\s*([^;]+)/g);
    const fontSizeMatch = cssText.match(/font-size:\s*([^;]+)/g);
    const fontWeightMatch = cssText.match(/font-weight:\s*([^;]+)/g);

    if (fontFamilyMatch) {
      fontFamilyMatch.forEach(match => {
        const family = match.replace('font-family:', '').trim();
        fontFamilies.add(family);
      });
    }
    if (fontSizeMatch) {
      fontSizeMatch.forEach(match => {
        const size = match.replace('font-size:', '').trim();
        fontSizes.add(size);
      });
    }
    if (fontWeightMatch) {
      fontWeightMatch.forEach(match => {
        const weight = match.replace('font-weight:', '').trim();
        fontWeights.add(weight);
      });
    }
  });

  return {
    fontFamilies: Array.from(fontFamilies),
    fontSizes: Array.from(fontSizes),
    fontWeights: Array.from(fontWeights),
    headings: headings,
    textSamples: extractTextSamples($)
  };
}

function extractSpacing(parsedCSS) {
  const margins = new Set();
  const paddings = new Set();

  parsedCSS.forEach(rule => {
    const cssText = cssTree.generate(rule);
    const marginMatch = cssText.match(/margin(-\w+)?:\s*([^;]+)/g);
    const paddingMatch = cssText.match(/padding(-\w+)?:\s*([^;]+)/g);

    if (marginMatch) {
      marginMatch.forEach(match => {
        const value = match.split(':')[1].trim();
        margins.add(value);
      });
    }
    if (paddingMatch) {
      paddingMatch.forEach(match => {
        const value = match.split(':')[1].trim();
        paddings.add(value);
      });
    }
  });

  return {
    margins: Array.from(margins),
    paddings: Array.from(paddings),
    scale: generateSpacingScale(Array.from(margins).concat(Array.from(paddings)))
  };
}

function extractLayout($) {
  const layoutInfo = {
    structure: analyzePageStructure($),
    navigation: extractNavigation($),
    grid: analyzeGridSystem($),
    breakpoints: inferBreakpoints($)
  };

  return layoutInfo;
}

function extractComponents($) {
  const components = {
    buttons: extractButtons($),
    forms: extractForms($),
    cards: extractCards($),
    navigation: extractNavigationComponents($),
    images: extractImagePatterns($)
  };

  return components;
}

function extractBranding($) {
  return {
    logo: $('img[src*="logo"], .logo img, #logo img').attr('src') || '',
    icons: extractIcons($),
    imagery: analyzeBrandImagery($),
    messaging: extractKeyMessages($)
  };
}

// Helper functions
function analyzeColorUsage(colors, $) {
  // Simplified color usage analysis
  return colors.reduce((usage, color) => {
    const occurrences = $(`[style*="${color}"]`).length;
    usage[color] = occurrences;
    return usage;
  }, {});
}

function extractTextSamples($) {
  const samples = [];
  $('p, span, div, a').each((i, elem) => {
    const text = $(elem).text().trim();
    if (text.length > 10 && text.length < 200) {
      samples.push(text);
    }
  });
  return samples.slice(0, 10); // Return first 10 samples
}

function generateSpacingScale(spacingValues) {
  // Extract numeric values and create a scale
  const numericValues = spacingValues
    .map(val => {
      const match = val.match(/(\d+(?:\.\d+)?)(px|rem|em|%)/);
      return match ? { value: parseFloat(match[1]), unit: match[2] } : null;
    })
    .filter(val => val !== null)
    .sort((a, b) => a.value - b.value);

  return numericValues.slice(0, 10); // Return top 10 spacing values
}

function analyzePageStructure($) {
  return {
    hasHeader: $('header, .header, #header').length > 0,
    hasFooter: $('footer, .footer, #footer').length > 0,
    hasSidebar: $('aside, .sidebar, #sidebar').length > 0,
    mainContent: $('main, .main, #main').length > 0,
    sectionsCount: $('section').length
  };
}

function extractNavigation($) {
  const navElements = [];
  $('nav, .nav, .navigation').each((i, elem) => {
    const links = [];
    $(elem).find('a').each((j, link) => {
      links.push({
        text: $(link).text().trim(),
        href: $(link).attr('href')
      });
    });
    navElements.push({ links });
  });
  return navElements;
}

function analyzeGridSystem($) {
  // Basic grid analysis
  return {
    containers: $('.container, .wrapper, .grid').length,
    columns: $('[class*="col-"], [class*="column"]').length,
    flexboxUsage: $('[style*="display: flex"], [style*="display:flex"]').length
  };
}

function inferBreakpoints($) {
  // This would typically analyze CSS media queries
  // For now, return common breakpoints
  return ['768px', '992px', '1200px'];
}

function extractButtons($) {
  const buttons = [];
  $('button, .btn, .button, input[type="submit"], input[type="button"]').each((i, elem) => {
    buttons.push({
      text: $(elem).text().trim() || $(elem).val(),
      type: elem.tagName.toLowerCase(),
      classes: $(elem).attr('class') || ''
    });
  });
  return buttons.slice(0, 10);
}

function extractForms($) {
  const forms = [];
  $('form').each((i, form) => {
    const fields = [];
    $(form).find('input, textarea, select').each((j, field) => {
      fields.push({
        type: $(field).attr('type') || field.tagName.toLowerCase(),
        name: $(field).attr('name'),
        placeholder: $(field).attr('placeholder')
      });
    });
    forms.push({ fields });
  });
  return forms;
}

function extractCards($) {
  const cards = [];
  $('.card, .post, .item, .product').each((i, elem) => {
    const cardInfo = {
      hasImage: $(elem).find('img').length > 0,
      hasTitle: $(elem).find('h1, h2, h3, h4, h5, h6').length > 0,
      hasDescription: $(elem).find('p').length > 0
    };
    cards.push(cardInfo);
  });
  return cards.slice(0, 5);
}

function extractNavigationComponents($) {
  return {
    breadcrumbs: $('.breadcrumb, .breadcrumbs').length > 0,
    pagination: $('.pagination, .pager').length > 0,
    tabs: $('.tabs, .tab-container').length > 0,
    dropdown: $('.dropdown, .select').length > 0
  };
}

function extractImagePatterns($) {
  const images = [];
  $('img').each((i, img) => {
    if (i < 5) { // Limit to first 5 images
      images.push({
        src: $(img).attr('src'),
        alt: $(img).attr('alt'),
        dimensions: {
          width: $(img).attr('width'),
          height: $(img).attr('height')
        }
      });
    }
  });
  return images;
}

function extractIcons($) {
  const icons = [];
  $('i[class*="fa-"], i[class*="icon-"], .icon, svg').each((i, elem) => {
    if (i < 10) {
      icons.push({
        type: elem.tagName.toLowerCase(),
        classes: $(elem).attr('class') || ''
      });
    }
  });
  return icons;
}

function analyzeBrandImagery($) {
  return {
    totalImages: $('img').length,
    backgroundImages: $('[style*="background-image"]').length,
    logos: $('img[src*="logo"], .logo').length
  };
}

function extractKeyMessages($) {
  const messages = [];
  $('h1, .hero, .banner, .tagline').each((i, elem) => {
    const text = $(elem).text().trim();
    if (text.length > 5 && text.length < 200) {
      messages.push(text);
    }
  });
  return messages.slice(0, 5);
}

module.exports = { extractDesignSystem };