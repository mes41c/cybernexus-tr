import React, { useState, useRef } from 'react';
import { streamSimplifyText } from '../services/api'; 

function SandboxView({ article, onBack, userSettings }) {
  const [contentBlocks, setContentBlocks] = useState([]); // Orijinal yapıyı tutar: { type, content/src }
  const [simplifiedBlocks, setSimplifiedBlocks] = useState([]); // Basitleştirilmiş sonuçları tutar
  
  const [isLoading, setIsLoading] = useState(false);
  const [currentLevel, setCurrentLevel] = useState('');
  
  const pasteAreaRef = useRef(null);

  const handlePaste = (event) => {
    event.preventDefault();
    const pastedHtml = event.clipboardData.getData('text/html');
    const pastedText = event.clipboardData.getData('text/plain');
    const parser = new DOMParser();
    const doc = parser.parseFromString(pastedHtml, 'text/html');
    
    const blocks = [];
    // 1. GÜNCELLEME: Arayacağımız etiket listesini genişletiyoruz.
    const selector = 'p, h2, h3, h4, img, ul, ol, li, blockquote';
    doc.body.querySelectorAll(selector).forEach(node => {
      if (node.parentElement.tagName === 'LI' || (node.tagName === 'LI' && node.closest('ul, ol') !== null)) {
        return;
      }

      // YENİ: Metin içeriğinden '#' işaretini kaldırıyoruz
      const cleanContent = node.textContent.replace(/#/g, '').trim();

      switch (node.tagName) {
        case 'P':
        case 'BLOCKQUOTE':
          if (cleanContent !== '') {
            blocks.push({ type: 'p', content: cleanContent }); // cleanContent kullanıldı
          }
          break;
        case 'H2':
          blocks.push({ type: 'h2', content: cleanContent }); // cleanContent kullanıldı
          break;
        case 'H3':
          blocks.push({ type: 'h3', content: cleanContent }); // cleanContent kullanıldı
          break;
        case 'H4':
          blocks.push({ type: 'h4', content: cleanContent }); // cleanContent kullanıldı
          break;
        case 'IMG':
          if (node.src) {
            blocks.push({ type: 'image', src: node.src, alt: node.alt || 'article image' });
          }
          break;
        case 'UL':
        case 'OL':
          const items = Array.from(node.querySelectorAll('li'))
                             .map(li => li.textContent.replace(/#/g, '').trim()) // YENİ: Liste elemanlarından da kaldır
                             .filter(item => item);
          if (items.length > 0) {
            blocks.push({ type: 'list', items: items });
          }
          break;
      }
    });

    if (blocks.length === 0 && pastedText) {
        pastedText.split('\n').forEach(line => {
            const cleanLine = line.replace(/#/g, '').trim(); // YENİ: Düz metin satırlarından da kaldır
            if(cleanLine !== '') {
                blocks.push({ type: 'p', content: cleanLine });
            }
        });
    }

    console.log("Ayrıştırılan Gelişmiş İçerik Blokları:", blocks);
    setContentBlocks(blocks);
    setSimplifiedBlocks([]);
  };

  /**
   * YENİDEN AKTİVE EDİLDİ VE GÜNCELLENDİ
   * 1. Orijinal metinleri birleştirir ve AI'a gönderir.
   * 2. Gelen basitleştirilmiş metinleri, görselleri koruyarak iskelete enjekte eder.
   */
  const handleSimplify = async (level) => {
    // 1. ÖNBELLEK KONTROLÜ
    const cacheKey = `cache_${article.link}_${level}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      console.log(`Veri önbellekten yüklendi: ${cacheKey}`);
      setSimplifiedBlocks(JSON.parse(cachedData));
      setCurrentLevel(level.toUpperCase());
      return; 
    }
    
    // 2. AKILLI METİN TOPLAMA
    const separator = '|||---|||';
    const textParts = [];
    contentBlocks.forEach(block => {
      switch (block.type) {
        case 'p':
        case 'h2':
        case 'h3':
        case 'h4':
          if (block.content) textParts.push(block.content);
          break;
        case 'list':
          if (block.items && block.items.length > 0) textParts.push(block.items.join('\n'));
          break;
      }
    });
    const originalText = textParts.join(separator);

    if (textParts.length === 0) {
      alert('Lütfen pratik yapmak için metin içeren bir içerik yapıştırın.');
      return;
    }
    
    // 3. API İSTEĞİ VE YANIT İŞLEME
    const findAvailableProvider = (settings) => {
        if (!settings) return null;
        const preferredProvider = settings.provider;
        const fallbackOrder = ['gemini', 'openai', 'deepseek'];
        if (settings[`${preferredProvider}ApiKey`]) return settings;
        for (const provider of fallbackOrder) {
            if (settings[`${provider}ApiKey`]) {
                return { ...settings, provider: provider };
            }
        }
        return null;
    };
    const activeSettings = findAvailableProvider(userSettings);
    if (!activeSettings) {
        alert("Lütfen devam etmeden önce Ayarlar menüsünden geçerli bir API anahtarı girin.");
        return;
    }

    setIsLoading(true);
    setCurrentLevel(level.toUpperCase());
    setSimplifiedBlocks([]);

    try {
      const response = await streamSimplifyText(activeSettings, originalText, level, article.link);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullSimplifiedText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullSimplifiedText += decoder.decode(value, { stream: true });
      }
      
      // 4. YEDEK AYRIŞTIRMA MANTIĞI
      let simplifiedParagraphs = fullSimplifiedText.split(separator);
      if (simplifiedParagraphs.length <= 2 && fullSimplifiedText.includes('\n')) {
          console.log("Özel ayıraç bulunamadı, yeni satıra göre bölme deneniyor...");
          simplifiedParagraphs = fullSimplifiedText.split(/\n\s*\n/).map(p => p.trim()).filter(p => p);
          if (simplifiedParagraphs.length <= 2) {
            simplifiedParagraphs = fullSimplifiedText.split('\n').map(p => p.trim()).filter(p => p);
          }
      } else {
        simplifiedParagraphs = simplifiedParagraphs.map(p => p.trim()).filter(p => p);
      }
      
      let paragraphIndex = 0;
      const finalBlocks = contentBlocks.map(block => {
        if (['p', 'h2', 'h3', 'h4', 'list'].includes(block.type)) {
          const newContent = simplifiedParagraphs[paragraphIndex] || "";
          paragraphIndex++;
          if (block.type === 'list') {
              // --- YENİ VE DAHA AKILLI LİSTE AYRIŞTIRMA ---
              // Gelen metni yeni satırlara göre böl,
              // başındaki -, *, • gibi işaretleri temizle,
              // ve boş satırları kaldır.
              const items = newContent.split('\n')
                                    .map(item => item.replace(/^[-*•]\s*/, '').trim())
                                    .filter(item => item);
              return { ...block, items: items };
          }
          return { ...block, content: newContent };
        }
        return block;
      });

      setSimplifiedBlocks(finalBlocks);
      
      try {
        localStorage.setItem(cacheKey, JSON.stringify(finalBlocks));
        console.log(`Veri önbelleğe kaydedildi: ${cacheKey}`);
      } catch (e) {
        console.error("Önbelleğe yazma hatası (muhtemelen depolama alanı dolu):", e);
      }
    } catch (error) {
      console.error("Streaming hatası:", error);
      alert(`Metin basitleştirilirken bir hata oluştu: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Gösterilecek olan içeriği belirle: Eğer basitleştirilmiş içerik varsa onu, yoksa orijinali göster.
  const blocksToDisplay = simplifiedBlocks.length > 0 ? simplifiedBlocks : contentBlocks;

  return (
    <div id="sandbox-view">
      <div className="reading-mode-header">
        <button id="back-to-main-btn" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i> Haber Listesine Geri Dön
        </button>
      </div>
      
      <article id="reading-mode-content">
        <h1>{article.title}</h1>
        <p style={{color: 'var(--secondary-text-color)', marginBottom: '1.5rem'}}>
          Orijinal haber sayfasından metin ve görselleri içeren bölümü kopyalayıp aşağıdaki alana yapıştırın.
        </p>

        <div
          ref={pasteAreaRef}
          className="sandbox-paste-area"
          contentEditable={!isLoading}
          onPaste={handlePaste}
          data-placeholder="İçeriği buraya yapıştırın..."
        />

         <div className="sandbox-controls" style={{ flexWrap: 'wrap', margin: '1rem 0' }}>
            <button className="read-more-btn" onClick={() => handleSimplify('a2')} disabled={isLoading}>Seviye A2</button>
            <button className="read-more-btn" onClick={() => handleSimplify('b1')} disabled={isLoading}>Seviye B1</button>
            <button className="read-more-btn" onClick={() => handleSimplify('b1-b2')} disabled={isLoading}>Seviye B1-B2</button>
            <button className="read-more-btn" onClick={() => handleSimplify('b2')} disabled={isLoading}>Seviye B2</button>
            <button className="read-more-btn" onClick={() => handleSimplify('c1')} disabled={isLoading}>Seviye C1</button>
            <button className="read-more-btn" onClick={() => handleSimplify('c2')} disabled={isLoading}>Seviye C2</button>

            {/* Orijinal Metne Dön Butonu */}
            {simplifiedBlocks.length > 0 && !isLoading && (
              <button 
                className="read-more-btn secondary" 
                onClick={() => setSimplifiedBlocks([])}
              >
                Orijinal Metne Dön
              </button>
            )}
        </div>
        
        {isLoading && <p><b>{currentLevel}</b> seviyesinde metin oluşturuluyor, lütfen bekleyin...</p>}
        
        <div className="content-display-area">
          {blocksToDisplay.map((block, index) => {
            switch (block.type) {
              case 'p':
                return <p key={index}>{block.content}</p>;
              case 'h2':
                return <h2 key={index}>{block.content}</h2>;
              case 'h3':
                return <h3 key={index}>{block.content}</h3>;
              case 'h4':
                return <h4 key={index}>{block.content}</h4>;
              case 'image':
                return <img key={index} src={block.src} alt={block.alt} style={{maxWidth: '100%', borderRadius: '8px', margin: '1rem 0'}} />;
              case 'list':
                return (
                  <ul key={index} style={{paddingLeft: '2rem'}}>
                    {block.items.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                );
              default:
                return null;
            }
          })}
        </div>
      </article>
    </div>
  );
}

export default SandboxView;