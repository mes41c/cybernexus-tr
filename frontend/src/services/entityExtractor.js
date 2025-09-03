// frontend/src/services/entityExtractor.js

export const CYBER_REGEX = {
  ip: /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g,
  md5: /\b([a-fA-F0-9]{32})\b/g,
  sha256: /\b([a-fA-F0-9]{64})\b/g,
  url: /\b((https?:\/\/)?[\w.-]+\.[a-zA-Z]{2,6}(\/[^\s]*)?)\b/g,
  cve: /\b(CVE-\d{4}-\d{4,7})\b/gi,
};

export const getWordsToHighlight = (text) => {
  if (!text) return [];
  const matches = new Set();
  Object.values(CYBER_REGEX).forEach(regex => {
    const found = text.match(new RegExp(regex.source, 'g'));
    if (found) {
      found.forEach(match => matches.add(match));
    }
  });
  return Array.from(matches);
};