const axios = require('axios');
const cheerio = require('cheerio');

async function extractVoice(url) {
  try {
    // Fetch the HTML content
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);

    // Extract text content from various elements
    const textContent = extractTextContent($);
    
    // Analyze the voice and tone
    const voiceAnalysis = {
      tone: analyzeTone(textContent),
      style: analyzeWritingStyle(textContent),
      vocabulary: analyzeVocabulary(textContent),
      messaging: analyzeMessaging(textContent, $),
      personality: analyzePersonality(textContent),
      audience: inferAudience(textContent),
      brandVoice: extractBrandVoice($),
      contentStrategy: analyzeContentStrategy($),
      metadata: {
        totalWordCount: textContent.totalWords,
        averageSentenceLength: textContent.averageSentenceLength,
        extractedAt: new Date().toISOString()
      }
    };

    return voiceAnalysis;

  } catch (error) {
    console.error('Voice extraction error:', error);
    throw new Error(`Failed to extract voice: ${error.message}`);
  }
}

function extractTextContent($) {
  const content = {
    headings: [],
    paragraphs: [],
    navigation: [],
    buttons: [],
    forms: [],
    metadata: []
  };

  // Extract headings
  $('h1, h2, h3, h4, h5, h6').each((i, elem) => {
    const text = $(elem).text().trim();
    if (text) {
      content.headings.push({
        level: parseInt(elem.tagName.charAt(1)),
        text: text
      });
    }
  });

  // Extract paragraphs and main content
  $('p, .content p, main p, article p').each((i, elem) => {
    const text = $(elem).text().trim();
    if (text && text.length > 20) {
      content.paragraphs.push(text);
    }
  });

  // Extract navigation text
  $('nav a, .nav a, .menu a').each((i, elem) => {
    const text = $(elem).text().trim();
    if (text) {
      content.navigation.push(text);
    }
  });

  // Extract button text
  $('button, .btn, .button, input[type="submit"]').each((i, elem) => {
    const text = $(elem).text().trim() || $(elem).val();
    if (text) {
      content.buttons.push(text);
    }
  });

  // Extract form labels
  $('label, .label').each((i, elem) => {
    const text = $(elem).text().trim();
    if (text) {
      content.forms.push(text);
    }
  });

  // Extract meta information
  const title = $('title').text();
  const description = $('meta[name="description"]').attr('content');
  
  if (title) content.metadata.push(title);
  if (description) content.metadata.push(description);

  // Combine all text for analysis
  const allText = [
    ...content.headings.map(h => h.text),
    ...content.paragraphs,
    ...content.navigation,
    ...content.buttons,
    ...content.forms,
    ...content.metadata
  ].join(' ');

  const words = allText.split(/\s+/).filter(word => word.length > 0);
  const sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 0);

  return {
    ...content,
    allText,
    totalWords: words.length,
    totalSentences: sentences.length,
    averageSentenceLength: sentences.length > 0 ? Math.round(words.length / sentences.length) : 0,
    wordFrequency: calculateWordFrequency(words)
  };
}

function analyzeTone(textContent) {
  const { allText, headings, paragraphs } = textContent;
  
  // Define tone indicators
  const toneIndicators = {
    formal: {
      keywords: ['furthermore', 'therefore', 'consequently', 'respectively', 'professional', 'enterprise'],
      score: 0
    },
    casual: {
      keywords: ['hey', 'awesome', 'cool', 'great', 'love', 'super', 'amazing'],
      score: 0
    },
    friendly: {
      keywords: ['welcome', 'hello', 'thanks', 'please', 'help', 'support', 'community'],
      score: 0
    },
    authoritative: {
      keywords: ['expert', 'proven', 'industry', 'leader', 'certified', 'professional', 'trusted'],
      score: 0
    },
    playful: {
      keywords: ['fun', 'exciting', 'adventure', 'discover', 'explore', 'enjoy'],
      score: 0
    },
    urgent: {
      keywords: ['now', 'today', 'limited', 'urgent', 'immediate', 'act fast', 'don\'t wait'],
      score: 0
    }
  };

  const lowerText = allText.toLowerCase();

  // Calculate tone scores
  Object.keys(toneIndicators).forEach(tone => {
    toneIndicators[tone].keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        toneIndicators[tone].score += matches.length;
      }
    });
  });

  // Determine primary tone
  const toneScores = Object.entries(toneIndicators)
    .map(([tone, data]) => ({ tone, score: data.score }))
    .sort((a, b) => b.score - a.score);

  return {
    primary: toneScores[0]?.tone || 'neutral',
    scores: toneScores,
    analysis: {
      exclamationCount: (allText.match(/!/g) || []).length,
      questionCount: (allText.match(/\?/g) || []).length,
      averageWordsPerSentence: textContent.averageSentenceLength
    }
  };
}

function analyzeWritingStyle(textContent) {
  const { allText, totalWords, totalSentences } = textContent;
  
  // Analyze sentence structure
  const sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const shortSentences = sentences.filter(s => s.split(' ').length <= 10).length;
  const longSentences = sentences.filter(s => s.split(' ').length > 20).length;

  // Analyze word complexity
  const complexWords = allText.split(/\s+/).filter(word => word.length > 8).length;
  const simpleWords = allText.split(/\s+/).filter(word => word.length <= 5).length;

  // Analyze punctuation usage
  const commaCount = (allText.match(/,/g) || []).length;
  const semicolonCount = (allText.match(/;/g) || []).length;
  const dashCount = (allText.match(/—|–|-/g) || []).length;

  return {
    sentenceStyle: {
      averageLength: textContent.averageSentenceLength,
      shortSentenceRatio: totalSentences > 0 ? shortSentences / totalSentences : 0,
      longSentenceRatio: totalSentences > 0 ? longSentences / totalSentences : 0,
      variability: analyzeSentenceVariability(sentences)
    },
    wordChoice: {
      complexityRatio: totalWords > 0 ? complexWords / totalWords : 0,
      simplicityRatio: totalWords > 0 ? simpleWords / totalWords : 0,
      averageWordLength: calculateAverageWordLength(allText)
    },
    punctuation: {
      commaFrequency: totalWords > 0 ? commaCount / totalWords : 0,
      semicolonUsage: semicolonCount > 0,
      dashUsage: dashCount > 0
    }
  };
}

function analyzeVocabulary(textContent) {
  const { wordFrequency, totalWords } = textContent;
  
  // Get most common words (excluding stop words)
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);
  
  const meaningfulWords = Object.entries(wordFrequency)
    .filter(([word]) => !stopWords.has(word.toLowerCase()) && word.length > 3)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 20);

  // Analyze vocabulary diversity
  const uniqueWords = Object.keys(wordFrequency).length;
  const vocabularyDiversity = totalWords > 0 ? uniqueWords / totalWords : 0;

  // Identify domain-specific terms
  const technicalTerms = identifyTechnicalTerms(meaningfulWords);
  const businessTerms = identifyBusinessTerms(meaningfulWords);

  return {
    mostFrequentWords: meaningfulWords.slice(0, 10),
    vocabularyDiversity,
    uniqueWordCount: uniqueWords,
    totalWordCount: totalWords,
    domainTerms: {
      technical: technicalTerms,
      business: businessTerms
    }
  };
}

function analyzeMessaging(textContent, $) {
  const { headings, paragraphs } = textContent;
  
  // Extract value propositions (usually in headings or hero sections)
  const valuePropositions = [];
  $('.hero h1, .banner h1, .value-prop, .tagline').each((i, elem) => {
    const text = $(elem).text().trim();
    if (text) valuePropositions.push(text);
  });

  // Add main headings as potential value props
  headings.filter(h => h.level <= 2).forEach(h => {
    if (h.text.length > 10 && h.text.length < 100) {
      valuePropositions.push(h.text);
    }
  });

  // Extract call-to-actions
  const ctas = [];
  $('button, .btn, .cta, a[class*="button"]').each((i, elem) => {
    const text = $(elem).text().trim();
    if (text && text.length > 2 && text.length < 50) {
      ctas.push(text);
    }
  });

  // Analyze messaging themes
  const themes = identifyMessagingThemes([...valuePropositions, ...paragraphs.slice(0, 5)]);

  return {
    valuePropositions: valuePropositions.slice(0, 5),
    callsToAction: ctas.slice(0, 10),
    keyMessages: extractKeyMessages(headings, paragraphs),
    themes,
    messagingStyle: categorizeMessagingStyle(valuePropositions, ctas)
  };
}

function analyzePersonality(textContent) {
  const { allText } = textContent;
  const lowerText = allText.toLowerCase();

  // Define personality traits with keywords
  const personalityTraits = {
    innovative: ['innovative', 'cutting-edge', 'breakthrough', 'revolutionary', 'advanced', 'next-generation'],
    trustworthy: ['trusted', 'reliable', 'secure', 'proven', 'established', 'dependable'],
    approachable: ['friendly', 'welcoming', 'easy', 'simple', 'accessible', 'open'],
    expert: ['expert', 'professional', 'specialist', 'authority', 'experienced', 'skilled'],
    dynamic: ['dynamic', 'energetic', 'fast', 'quick', 'agile', 'responsive'],
    caring: ['care', 'support', 'help', 'service', 'customer', 'community']
  };

  const scores = {};
  Object.entries(personalityTraits).forEach(([trait, keywords]) => {
    let score = 0;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) score += matches.length;
    });
    scores[trait] = score;
  });

  const dominantTraits = Object.entries(scores)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .filter(([,score]) => score > 0);

  return {
    dominantTraits: dominantTraits.map(([trait]) => trait),
    scores,
    personalityProfile: generatePersonalityProfile(dominantTraits)
  };
}

function inferAudience(textContent) {
  const { allText, vocabulary } = textContent;
  const lowerText = allText.toLowerCase();

  // Audience indicators
  const audienceIndicators = {
    business: ['business', 'enterprise', 'company', 'organization', 'corporate', 'professional'],
    consumer: ['you', 'your', 'personal', 'home', 'family', 'lifestyle'],
    technical: ['development', 'api', 'code', 'technical', 'software', 'system'],
    creative: ['design', 'creative', 'art', 'brand', 'visual', 'aesthetic'],
    educational: ['learn', 'education', 'course', 'training', 'knowledge', 'skill']
  };

  const audienceScores = {};
  Object.entries(audienceIndicators).forEach(([audience, keywords]) => {
    let score = 0;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) score += matches.length;
    });
    audienceScores[audience] = score;
  });

  const primaryAudience = Object.entries(audienceScores)
    .sort(([,a], [,b]) => b - a)[0];

  return {
    primary: primaryAudience ? primaryAudience[0] : 'general',
    scores: audienceScores,
    complexity: vocabulary.vocabularyDiversity > 0.7 ? 'high' : vocabulary.vocabularyDiversity > 0.4 ? 'medium' : 'low'
  };
}

function extractBrandVoice($) {
  // Extract brand voice from specific elements
  const brandElements = {
    tagline: '',
    mission: '',
    values: [],
    promises: []
  };

  // Extract tagline
  $('.tagline, .slogan, .motto').each((i, elem) => {
    brandElements.tagline = $(elem).text().trim();
  });

  // Extract mission-like statements
  $('.mission, .about p, .vision').each((i, elem) => {
    const text = $(elem).text().trim();
    if (text.length > 50 && text.length < 500) {
      brandElements.mission = text;
    }
  });

  // Extract values or principles
  $('.values li, .principles li, .why-us li').each((i, elem) => {
    const text = $(elem).text().trim();
    if (text && text.length < 200) {
      brandElements.values.push(text);
    }
  });

  return brandElements;
}

function analyzeContentStrategy($) {
  const strategy = {
    contentTypes: identifyContentTypes($),
    contentLength: analyzeContentLength($),
    mediaUsage: analyzeMediaUsage($),
    interactivity: analyzeInteractivity($)
  };

  return strategy;
}

// Helper functions
function calculateWordFrequency(words) {
  const frequency = {};
  words.forEach(word => {
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
    if (cleanWord) {
      frequency[cleanWord] = (frequency[cleanWord] || 0) + 1;
    }
  });
  return frequency;
}

function analyzeSentenceVariability(sentences) {
  const lengths = sentences.map(s => s.split(' ').length);
  const avg = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avg, 2), 0) / lengths.length;
  return Math.sqrt(variance);
}

function calculateAverageWordLength(text) {
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const totalLength = words.reduce((sum, word) => sum + word.replace(/[^\w]/g, '').length, 0);
  return words.length > 0 ? totalLength / words.length : 0;
}

function identifyTechnicalTerms(meaningfulWords) {
  const technicalKeywords = ['api', 'software', 'platform', 'system', 'technology', 'digital', 'data', 'analytics', 'cloud', 'integration'];
  return meaningfulWords.filter(([word]) => 
    technicalKeywords.some(keyword => word.toLowerCase().includes(keyword))
  ).map(([word]) => word);
}

function identifyBusinessTerms(meaningfulWords) {
  const businessKeywords = ['revenue', 'growth', 'profit', 'sales', 'customer', 'market', 'business', 'enterprise', 'solution', 'service'];
  return meaningfulWords.filter(([word]) => 
    businessKeywords.some(keyword => word.toLowerCase().includes(keyword))
  ).map(([word]) => word);
}

function identifyMessagingThemes(texts) {
  const themes = {
    innovation: 0,
    quality: 0,
    speed: 0,
    trust: 0,
    value: 0
  };

  const themeKeywords = {
    innovation: ['new', 'innovative', 'cutting-edge', 'advanced', 'modern'],
    quality: ['quality', 'premium', 'best', 'excellent', 'superior'],
    speed: ['fast', 'quick', 'instant', 'rapid', 'immediate'],
    trust: ['trusted', 'secure', 'reliable', 'proven', 'safe'],
    value: ['affordable', 'value', 'save', 'cost-effective', 'budget']
  };

  const allText = texts.join(' ').toLowerCase();

  Object.entries(themeKeywords).forEach(([theme, keywords]) => {
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = allText.match(regex);
      if (matches) themes[theme] += matches.length;
    });
  });

  return Object.entries(themes)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .filter(([,score]) => score > 0)
    .map(([theme]) => theme);
}

function extractKeyMessages(headings, paragraphs) {
  const keyMessages = [];
  
  // Get main headings as key messages
  headings.filter(h => h.level <= 2 && h.text.length > 10)
    .slice(0, 3)
    .forEach(h => keyMessages.push(h.text));

  // Get first sentences of paragraphs as potential key messages
  paragraphs.slice(0, 3).forEach(p => {
    const firstSentence = p.split('.')[0];
    if (firstSentence && firstSentence.length > 20 && firstSentence.length < 150) {
      keyMessages.push(firstSentence);
    }
  });

  return keyMessages.slice(0, 5);
}

function categorizeMessagingStyle(valueProps, ctas) {
  const allMessaging = [...valueProps, ...ctas].join(' ').toLowerCase();
  
  if (allMessaging.includes('free') || allMessaging.includes('trial') || allMessaging.includes('demo')) {
    return 'trial-focused';
  } else if (allMessaging.includes('buy') || allMessaging.includes('purchase') || allMessaging.includes('order')) {
    return 'sales-focused';
  } else if (allMessaging.includes('learn') || allMessaging.includes('discover') || allMessaging.includes('explore')) {
    return 'education-focused';
  } else if (allMessaging.includes('contact') || allMessaging.includes('talk') || allMessaging.includes('consultation')) {
    return 'consultation-focused';
  } else {
    return 'general';
  }
}

function generatePersonalityProfile(dominantTraits) {
  if (dominantTraits.length === 0) return 'neutral';
  
  const traitCombinations = {
    'innovative,expert': 'thought-leader',
    'trustworthy,caring': 'supportive-authority',
    'dynamic,innovative': 'disruptor',
    'approachable,caring': 'friendly-helper',
    'expert,trustworthy': 'reliable-authority'
  };

  const traitKey = dominantTraits.map(([trait]) => trait).sort().join(',');
  return traitCombinations[traitKey] || dominantTraits[0][0];
}

function identifyContentTypes($) {
  const types = {
    blog: $('.blog, .post, article').length > 0,
    products: $('.product, .item, .catalog').length > 0,
    services: $('.service, .offering').length > 0,
    portfolio: $('.portfolio, .gallery, .showcase').length > 0,
    documentation: $('.docs, .documentation, .guide').length > 0,
    news: $('.news, .press, .announcement').length > 0
  };

  return Object.entries(types)
    .filter(([,hasType]) => hasType)
    .map(([type]) => type);
}

function analyzeContentLength($) {
  const wordCounts = [];
  $('p, .content').each((i, elem) => {
    const text = $(elem).text().trim();
    const wordCount = text.split(/\s+/).length;
    if (wordCount > 5) wordCounts.push(wordCount);
  });

  if (wordCounts.length === 0) return 'unknown';

  const avgLength = wordCounts.reduce((sum, count) => sum + count, 0) / wordCounts.length;
  
  if (avgLength < 20) return 'short-form';
  if (avgLength < 100) return 'medium-form';
  return 'long-form';
}

function analyzeMediaUsage($) {
  return {
    images: $('img').length,
    videos: $('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length,
    audio: $('audio').length,
    interactive: $('canvas, .interactive, .widget').length
  };
}

function analyzeInteractivity($) {
  return {
    forms: $('form').length,
    buttons: $('button, .btn').length,
    links: $('a').length,
    socialSharing: $('[class*="share"], [class*="social"]').length
  };
}

module.exports = { extractVoice };