const axios = require('axios');

// Example usage of the Design System & Voice Extraction API
const API_BASE_URL = 'http://localhost:3000';

async function extractWebsiteData(url) {
  try {
    console.log(`🔍 Extracting design system and voice for: ${url}`);
    
    const response = await axios.post(`${API_BASE_URL}/extract`, {
      url: url
    });

    const { designSystem, voice } = response.data;

    console.log('\n📊 DESIGN SYSTEM ANALYSIS');
    console.log('========================');
    
    if (designSystem.colors && designSystem.colors.palette.length > 0) {
      console.log(`🎨 Colors Found: ${designSystem.colors.palette.slice(0, 5).join(', ')}`);
    }
    
    if (designSystem.typography && designSystem.typography.headings.length > 0) {
      console.log(`📝 Main Heading: "${designSystem.typography.headings[0].text}"`);
    }
    
    if (designSystem.components && designSystem.components.buttons.length > 0) {
      console.log(`🔘 Button Examples: ${designSystem.components.buttons.slice(0, 3).map(b => `"${b.text}"`).join(', ')}`);
    }

    console.log('\n🗣️  VOICE & TONE ANALYSIS');
    console.log('=========================');
    
    if (voice.tone) {
      console.log(`🎭 Primary Tone: ${voice.tone.primary}`);
    }
    
    if (voice.personality && voice.personality.dominantTraits.length > 0) {
      console.log(`👤 Personality Traits: ${voice.personality.dominantTraits.join(', ')}`);
    }
    
    if (voice.messaging && voice.messaging.themes.length > 0) {
      console.log(`🎯 Key Themes: ${voice.messaging.themes.join(', ')}`);
    }
    
    if (voice.audience) {
      console.log(`👥 Target Audience: ${voice.audience.primary} (${voice.audience.complexity} complexity)`);
    }

    console.log('\n✅ Analysis complete!');
    return response.data;

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.error || error.message);
    return null;
  }
}

// Example usage
async function main() {
  console.log('🚀 Design System & Voice Extraction API Example\n');
  
  // Test health endpoint first
  try {
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ API is healthy:', healthResponse.data.status);
  } catch (error) {
    console.error('❌ API is not accessible. Make sure the server is running on port 3000.');
    return;
  }

  // Example URLs to test (these would work if network access was available)
  const testUrls = [
    'https://stripe.com',
    'https://github.com',
    'https://apple.com'
  ];

  console.log('\n📝 Note: In this sandboxed environment, actual URL extraction will fail.');
  console.log('However, the API structure is complete and ready for use.\n');

  // Show the API documentation instead
  try {
    const docsResponse = await axios.get(API_BASE_URL);
    console.log('📚 API Documentation:');
    console.log(JSON.stringify(docsResponse.data, null, 2));
  } catch (error) {
    console.error('Error fetching docs:', error.message);
  }
}

// Run the example
if (require.main === module) {
  main();
}

module.exports = { extractWebsiteData };