const API_URL = 'cybernexus-tr-production.up.railway.app/api';

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

  // --- DÜZELTME BURADA ---
  // Sabit localhost adresi yerine dinamik API_URL kullanılıyor.
  const response = await fetch(`${API_URL}/simplify`, {
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

  // --- DÜZELTME BURADA ---
  // Sabit localhost adresi yerine dinamik API_URL kullanılıyor.
  const response = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: settings.provider,
      apiKey: apiKey,
      messages: messages,
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

export const fetchAllConcepts = async () => {
  try {
    const response = await fetch(`${API_URL}/concepts/all`);
    if (!response.ok) throw new Error('Tüm kavramlar alınamadı.');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Tüm kavramları çekme hatası:", error);
    return [];
  }
};

/**
 * Cyber Detective modülü için backend'e ipucu sorgusu gönderir.
 * @param {string} caseId - Sorgulanan vakanın ID'si (örn: "case-01").
 * @param {string} query - Kullanıcının sorduğu soru.
 * @param {string} language - Mevcut dil ('tr' veya 'en').
 * @returns {Promise<string>} - MentorNet'in cevabını içeren bir string.
 */
export const askMentorNet = async (caseId, messages, language, userSettings) => { 
  try {
    const response = await fetch(`${API_URL}/cases/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId, messages, language, userSettings }), 
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.reply || 'Sunucudan bir hata yanıtı alındı.');
    }

    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error("MentorNet'e soru sorma hatası:", error);
    return "MentorNet ile iletişim kurulamadı. Lütfen API anahtarınızı kontrol edin veya daha sonra tekrar deneyin.";
  }
};

/**
 * Belirli bir vakanın başlık ve brifing gibi detaylarını çeker.
 * @param {string} caseId - Detayları alınacak vakanın ID'si.
 * @returns {Promise<object>} - Vaka detaylarını içeren bir nesne.
 */
export const fetchCaseDetails = async (caseId, anonymousUserId) => {
  try {
    // API isteğine anonymousUserId'yi query parametresi olarak ekliyoruz
    const response = await fetch(`${API_URL}/cases/${caseId}?anonymousUserId=${anonymousUserId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Vaka bulunamadı.');
      }
      throw new Error('Vaka detayları sunucudan alınamadı.');
    }
    return await response.json();
  } catch (error) {
    console.error("Vaka detayı çekme hatası:", error);
    throw error; // Hatayı bileşenin yakalaması için yeniden fırlat
  }
};

/**
 * AI kullanarak yeni bir Cyber Detective vakası oluşturur.
 * @param {string} articleText - Vaka oluşturulacak haber metni.
 * @param {object} userSettings - Kullanıcının AI ayarları.
 * @returns {Promise<object>} - Oluşturulan vaka verisini içeren bir nesne.
 */
export const createCaseWithAi = async (articleText, userSettings, difficulty, caseType, anonymousUserId) => {
  try {
    const response = await fetch(`${API_URL}/cases/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        articleText,
        userSettings,
        difficulty,
        caseType, 
        anonymousUserId 
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Bilinmeyen bir sunucu hatası.');
    }
    return await response.json();
  } catch (error) {
    console.error("AI ile vaka oluşturma hatası:", error);
    throw error;
  }
};

export const fetchAllCases = async (anonymousUserId, page = 1, limit = 12) => {
  try {
    // anonymousUserId varsa, onu query parametresi olarak ekliyoruz
    const userQueryParam = anonymousUserId ? `&anonymousUserId=${anonymousUserId}` : '';
    
    const response = await fetch(`${API_URL}/cases?page=${page}&limit=${limit}${userQueryParam}`);
    
    if (!response.ok) {
      throw new Error('Vaka listesi sunucudan alınamadı.');
    }
    return await response.json();
  } catch (error) {
    console.error("Tüm vakaları çekerken hata:", error);
    // Hata durumunda, uygulamanın çökmemesi için beklenen formatta bir nesne döndür
    return { cases: [], currentPage: 1, totalPages: 1 };
  }
};

export const deleteCaseById = async (caseId, anonymousUserId) => {
  try {
    // API isteğine anonymousUserId'yi query parametresi olarak ekliyoruz
    const response = await fetch(`${API_URL}/cases/${caseId}?anonymousUserId=${anonymousUserId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Vaka silinirken bir hata oluştu.');
    }
    return await response.json();
  } catch (error) {
    console.error("Vaka silme hatası:", error);
    throw error;
  }
};

export const evaluateCaseReport = async (caseId, reportData, userSettings, language, anonymousUserId) => { // anonymousUserId parametresi eklendi
  try {
    const response = await fetch(`${API_URL}/cases/${caseId}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        report: reportData,
        userSettings: userSettings,
        language: language,
        anonymousUserId: anonymousUserId, // <-- YENİ EKLENEN SATIR
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Değerlendirme alınamadı.');
    }

    return await response.json();
  } catch (error) {
    console.error("Vaka raporu değerlendirme hatası:", error);
    throw error;
  }
};

// frontend/src/services/api.js dosyasının sonuna ekleyin
export const clearLearningHistory = async (anonymousUserId) => {
  try {
    const response = await fetch(`${API_URL}/solutions/${anonymousUserId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Geçmiş silinirken bir sunucu hatası oluştu.');
    return await response.json();
  } catch (error) {
    console.error("Öğrenme geçmişi silme hatası:", error);
    throw error;
  }
};

export const rateCaseById = async (caseId, anonymousUserId, rating) => {
  try {
    const response = await fetch(`${API_URL}/cases/${caseId}/rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ anonymousUserId, rating }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Oylama sırasında bir hata oluştu.');
    }
    return await response.json();
  } catch (error) {
    console.error("Vaka oylama hatası:", error);
    throw error;
  }
};