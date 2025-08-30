const API_URL = 'http://localhost:5000/api';

/**
 * Veritabanından ana siber güvenlik kategorilerini çeker.
 */
export const fetchCategories = async () => {
  try {
    const response = await fetch(`${API_URL}/categories`);
    if (!response.ok) throw new Error('Kategoriler alınamadı.');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Kategori çekme hatası:", error);
    return [];
  }
};

/**
 * Belirli bir kategori ID'sine ait alt kavramları çeker.
 * @param {number} categoryId - Kavramları alınacak kategori ID'si.
 */
export const fetchConceptsByCategory = async (categoryId) => {
  try {
    const response = await fetch(`${API_URL}/categories/${categoryId}/concepts`);
    if (!response.ok) throw new Error('Kavramlar alınamadı.');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Kavram çekme hatası:", error);
    return [];
  }
};

/**
 * Belirli bir İngilizce arama terimiyle ilgili canlı haberleri RSS akışlarından çeker.
 * @param {string} englishSearchTerm - Haberlerde aranacak güvenilir İngilizce anahtar kelime.
 */
export const fetchLiveNews = async (englishSearchTerm, relatedKeywords = '') => {
    if (!englishSearchTerm) return [];
    try {
        const response = await fetch(`${API_URL}/news/search?english_term=${encodeURIComponent(englishSearchTerm)}&related_keywords=${encodeURIComponent(relatedKeywords)}`);
        if (!response.ok) throw new Error('Haberler alınamadı.');
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error("Haber akışı çekme hatası:", error);
        return [];
    }
};

/**
 * Metni, kullanıcının seçtiği AI sağlayıcısı ve ayarlarla basitleştirmek
 * için backend'e bir streaming isteği gönderir.
 * ÖNEMLİ: Bu fonksiyon doğrudan bir veri döndürmez, bir 'Response' nesnesi döndürür
 * ki bu nesnenin body'si bileşen içinde okunabilsin.
 * @param {object} settings - Kullanıcının ayarlar nesnesi ({ provider, geminiApiKey, ... })
 * @param {string} plainText - Basitleştirilecek düz metin.
 * @param {string} level - Hedef CEFR seviyesi (örn: 'b1', 'b2').
 * @param {string} contextUrl - Metnin alındığı kaynak URL.
 * @returns {Promise<Response>} - Fetch API'sinin ham Response nesnesi.
 */
export const streamSimplifyText = async (settings, plainText, level, contextUrl) => {
  // Kullanıcının seçtiği aktif sağlayıcıya göre doğru API anahtarını bul.
  const getApiKeyForProvider = (provider) => {
    switch(provider) {
      case 'gemini': return settings.geminiApiKey;
      case 'openai': return settings.openaiApiKey;
      case 'deepseek': return settings.deepseekApiKey;
      default: return null;
    }
  };

  const apiKey = getApiKeyForProvider(settings.provider);

  if (!apiKey) {
    throw new Error(`Lütfen Ayarlar menüsünden ${settings.provider} için bir API anahtarı girin.`);
  }

  const response = await fetch(`http://localhost:5000/api/simplify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: settings.provider,
      apiKey: apiKey,
      plainText: plainText,
      level: level,
      contextUrl: contextUrl,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sunucu hatası: ${response.status} - ${errorText}`);
  }

  return response;
};

/**
 * AI Mentor ile sohbet etmek için backend'e bir streaming isteği gönderir.
 * @param {object} settings - Kullanıcının AI sağlayıcı ayarları ({ provider, ...ApiKey })
 * @param {Array<object>} messages - Sohbet geçmişini içeren dizi [{ role, content }]
 * @returns {Promise<Response>} - Fetch API'sinin ham Response nesnesi.
 */
export const streamChatResponse = async (settings, messages) => {
  const getApiKeyForProvider = (provider) => {
    switch(provider) {
      case 'gemini': return settings.geminiApiKey;
      case 'openai': return settings.openaiApiKey;
      case 'deepseek': return settings.deepseekApiKey;
      default: return null;
    }
  };

  const apiKey = getApiKeyForProvider(settings.provider);

  if (!apiKey) {
    throw new Error(`Lütfen Ayarlar menüsünden ${settings.provider} için bir API anahtarı girin.`);
  }

  const response = await fetch(`http://localhost:5000/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: settings.provider,
      apiKey: apiKey,
      messages: messages, // Sohbet geçmişini gönderiyoruz
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sunucu hatası: ${response.status} - ${errorText}`);
  }

  return response;
};

/**
 * Belirli bir siber güvenlik kavramı için AI'dan tanım akışı talep eder.
 * @param {object} settings - Kullanıcının AI sağlayıcı ayarları.
 * @param {object} concept - Tanımı yapılacak kavram nesnesi ({ title, english_term_authoritative }).
 * @returns {Promise<Response>} - Fetch API'sinin ham Response nesnesi.
 */
export const fetchAiDefinition = async (settings, concept) => {
  const getApiKeyForProvider = (provider) => {
    switch(provider) {
      case 'gemini': return settings.geminiApiKey;
      case 'openai': return settings.openaiApiKey;
      case 'deepseek': return settings.deepseekApiKey;
      default: return null;
    }
  };
  const apiKey = getApiKeyForProvider(settings.provider);
  if (!apiKey) {
    throw new Error(`${settings.provider} için bir API anahtarı girin.`);
  }

  const response = await fetch(`${API_URL}/concepts/define`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: settings.provider,
      apiKey: apiKey,
      title: concept.title,
      english_term: concept.english_term_authoritative,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sunucu hatası: ${response.status} - ${errorText}`);
  }

  return response;
};

export const fetchNewsSources = async () => {
  try {
    const response = await fetch(`${API_URL}/news/sources`);
    if (!response.ok) throw new Error('Haber kaynakları alınamadı.');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Haber kaynakları çekme hatası:", error);
    return [];
  }
};

/**
 * Backend önbelleğindeki TÜM haberleri tek seferde çeker.
 */
export const fetchAllNews = async () => {
  try {
    // Bu isteğin başarılı olması için, uygulamada daha önce en az bir haber araması
    // yapılmış ve backend önbelleğinin dolmuş olması gerekir.
    const response = await fetch(`${API_URL}/news/all`);
    if (!response.ok) throw new Error('Tüm haberler alınamadı.');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Tüm haberleri çekme hatası:", error);
    return [];
  }
};