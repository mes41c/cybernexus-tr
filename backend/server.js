const express = require('express');
const cors = require('cors');
const db = require('./database.js');
let Parser = require('rss-parser');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require('openai');
const cheerio = require('cheerio');
const axios = require('axios');
require('dotenv').config();

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
app.use(cors());
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
    'https://www.zdnet.com/topic/security/rss.xml', // ZDNet Security
    
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


// --- YENİ YARDIMCI SOHBET FONKSİYONLARI ---

/**
 * Gemini modeli ile bir sohbet oturumu başlatır ve yanıtı stream eder.
 */
async function streamChatGeminiResponse(apiKey, messages, res) {
    const genAI = new GoogleGenerativeAI(apiKey);

    // 1. DÜZELTME: Sistem talimatını ayrı bir değişken olarak tanımlıyoruz.
    const systemInstructionText = `You are "Nexus", an expert Cybersecurity Mentor. Your student is from Turkey and is learning to improve their technical English and cybersecurity skills. 
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
        content: `You are "Nexus", an expert Cybersecurity Mentor. Your student is from Turkey and is learning to improve their technical English and cybersecurity skills. 
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
