export const autoLinkText = (text: string): string => {
  if (!text) return '';

  // Regex to find URLs (http/https, www, or just domain.tld) and basic email addresses.
  // This regex is designed to be reasonably comprehensive for common URL patterns.
  const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])|(\bwww\.[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])|(\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b)/ig;

  return text.replace(urlRegex, (match) => {
    let href = match;
    if (match.startsWith('www.')) {
      href = `http://${match}`;
    } else if (match.includes('@') && !match.startsWith('http')) { // Basic email detection
      href = `mailto:${match}`;
    }
    // Add a specific class to identify these links for interception
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="preview-link">${match}</a>`;
  });
};