import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { fetchCategories, fetchConceptsByCategory, fetchLiveNews, fetchNewsSources, fetchAllNews, fetchAiDefinition } from './services/api'; // fetchNewsSources ve fetchAllNews eklendi
import CategoryList from './components/CategoryList';
import ConceptList from './components/ConceptList';
import LiveFeedList from './components/LiveFeedList';
import SandboxView from './components/SandboxView';
import SettingsView from './components/SettingsView'; // SettingsView'i import ediyoruz
import SmartContent from './components/SmartContent';
import ChatView from './components/ChatView';
import './App.css';

function App() {
  // 'chat' görünümünü state'e ekliyoruz.
  const [view, setView] = useState('categories'); // 'categories', 'concepts', 'live_feed', 'sandbox', 'chat'
  const [categories, setCategories] = useState([]);
  const [concepts, setConcepts] = useState([]);
  const [previousView, setPreviousView] = useState('categories');
  const [liveArticles, setLiveArticles] = useState([]);
  const [newsSources, setNewsSources] = useState([]); // YENİ: Haber kaynakları listesi
  const [allNews, setAllNews] = useState([]); // YENİ: Tüm haberlerin önbelleği
  const [selectedSource, setSelectedSource] = useState(null);
  const [isLoadingNews, setIsLoadingNews] = useState(false); // YENİ EKLENEN SATIR
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [practiceArticle, setPracticeArticle] = useState(null);
  const [currentConceptTitle, setCurrentConceptTitle] = useState('');
  const [currentConcept, setCurrentConcept] = useState(null); // YENİ EKLENEN SATIR
  const [aiDefinition, setAiDefinition] = useState('');
  const [isDefiningWithAi, setIsDefiningWithAi] = useState(false);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userSettings, setUserSettings] = useState(null);
  const [isChatFullScreen, setIsChatFullScreen] = useState(false);

  const [chatMessages, setChatMessages] = useState([
    { role: 'model', content: 'Merhaba! Ben Nexus, kişisel siber güvenlik mentorunuz. Okuduğunuz bir makale, bir zafiyet veya genel bir siber güvenlik konsepti hakkında soru sormaktan çekinmeyin.' }
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const [allConcepts, setAllConcepts] = useState([]);

  useEffect(() => {
    // Ana verileri asenkron bir fonksiyon içinde çekiyoruz
    const loadInitialData = async () => {
      // 1. Kategorileri çek
      const categoriesData = await fetchCategories();
      setCategories(categoriesData);

      // 2. Haber Kaynaklarını çek
      fetchNewsSources().then(setNewsSources);
      
      // --- EKSİK OLAN VE GERİ EKLEDİĞİMİZ KISIM ---
      // 3. Arka planda TÜM haberleri çek ve state'i doldur
      fetchAllNews().then(setAllNews);
      // --- BİTİŞ ---

      // 4. Kategoriler başarıyla çekildiyse, her biri için kavramları çek
      if (categoriesData && categoriesData.length > 0) {
        const conceptPromises = categoriesData.map(cat => fetchConceptsByCategory(cat.id));
        const conceptArrays = await Promise.all(conceptPromises);
        const allFetchedConcepts = conceptArrays.flat();
        setAllConcepts(allFetchedConcepts);
      }
    };

    loadInitialData();

    // localStorage'dan kullanıcı ayarlarını yükle
    const storedSettingsJson = localStorage.getItem('userAiSettings');
    if (storedSettingsJson) {
      setUserSettings(JSON.parse(storedSettingsJson));
    }
  }, []);

  // Bu useEffect, 'view' veya 'currentConcept' her DEĞİŞTİĞİNDE çalışır.
  useEffect(() => {
    if (view === 'concept_detail' && currentConcept) {
      setAiDefinition('');
      setIsLoadingNews(true);
      setLiveArticles([]);

      // Fonksiyonu yeni related_keywords parametresiyle çağırıyoruz
      fetchLiveNews(currentConcept.english_term_authoritative, currentConcept.related_keywords)
        .then(newsItems => {
          setLiveArticles(newsItems || []);
        })
        .finally(() => {
          setIsLoadingNews(false);
        });
    }
  }, [view, currentConcept]);

  const handleCategoryClick = async (categoryId) => {
    setPreviousView('categories');
    const conceptsData = await fetchConceptsByCategory(categoryId);
    const categoryData = categories.find(cat => cat.id === categoryId);
    setConcepts(conceptsData);
    setSelectedCategory(categoryData);
    setView('concepts');
  };
  
  const handleConceptClick = (concept) => {
    setPreviousView('concepts');
    setView('concept_detail'); // Artık doğrudan 'concept_detail' görünümüne geçiyoruz.
    setCurrentConcept(concept);
    setCurrentConceptTitle(concept.title);
  };

  // Bu fonksiyon, haber kartındaki "Pratik Yap" butonuna basıldığında çalışır
  const handlePracticeClick = (articleItem) => {
    setPreviousView(view);
    const articleData = {
        title: articleItem.title,
        source: new URL(articleItem.link).hostname.replace('www.',''),
        date: new Date(articleItem.pubDate).toLocaleDateString('tr-TR'),
        link: articleItem.link,
        imageUrl: articleItem.imageUrl || null,
    };
    setPracticeArticle(articleData);
    setView('sandbox');
  };

  // Bu fonksiyon, Sandbox ekranından haber listesine geri dönmek için kullanılır
  const handleBackFromSandbox = () => {
      setView(previousView); // Nereden geldiysek oraya geri dön
      setPracticeArticle(null);
  };
  
  const handleBackToConcepts = () => {
    setView('concepts');
    setLiveArticles([]);
  };

  const handleBackToCategories = () => {
    setView('categories');
    setConcepts([]);
    setSelectedCategory(null);
    setLiveArticles([]);
    setPracticeArticle(null);
    setIsChatFullScreen(false); // Tam ekran modundan çıkarken resetle
  };

  const handleDefineWithAi = async () => {
    if (!currentConcept || !userSettings) {
      alert("Lütfen önce Ayarlar'dan bir AI sağlayıcı ve API anahtarı yapılandırın.");
      return;
    }

    // 1. Her kavram için benzersiz bir önbellek anahtarı oluşturuyoruz.
    const cacheKey = `ai_definition_${currentConcept.id}`;
    
    // 2. API'ye gitmeden ÖNCE önbelleği kontrol et.
    const cachedDefinition = localStorage.getItem(cacheKey);
    if (cachedDefinition) {
      console.log("Tanım önbellekten yüklendi!");
      setAiDefinition(cachedDefinition);
      return; // Önbellekte varsa, fonksiyonu burada bitir.
    }

    // 3. Önbellekte yoksa, API çağrısını başlat.
    console.log("Önbellekte tanım bulunamadı, AI'dan isteniyor...");
    setIsDefiningWithAi(true);
    setAiDefinition('');
    let fullResponseText = ''; // Gelen tüm metni birleştirmek için bir değişken

    try {
      const response = await fetchAiDefinition(userSettings, currentConcept);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const read = async () => {
        const { done, value } = await reader.read();
        if (done) {
          // 4. Akış bittiğinde, birleştirilmiş tam metni localStorage'a kaydet.
          localStorage.setItem(cacheKey, fullResponseText);
          console.log("Yeni tanım önbelleğe kaydedildi.");
          setIsDefiningWithAi(false);
          return;
        }
        const chunk = decoder.decode(value, { stream: true });
        fullResponseText += chunk; // Gelen her parçayı değişkene ekle
        setAiDefinition(prev => prev + chunk); // Ekrana anlık olarak yazdır
        read();
      };
      read();
      
    } catch (error) {
      console.error("AI tanım hatası:", error);
      setAiDefinition(`Tanım getirilirken bir hata oluştu: ${error.message}`);
      setIsDefiningWithAi(false);
    }
  };

  const handleSourceClick = (source) => {
    setPreviousView('categories');
    setSelectedSource(source);
    setSearchTerm(''); // Kaynak değiştirirken aramayı sıfırla
    setView('source_feed');
  };

  const handleConceptLinkClick = (englishTerm) => {
    // Tıklanan İngilizce terime sahip olan kavram nesnesini tüm kavramlar listesinden bul.
    const foundConcept = allConcepts.find(c => c.english_term_authoritative.toLowerCase() === englishTerm.toLowerCase());
    
    if (foundConcept) {
      // Eğer bulunduysa, normal bir kavrama tıklanmış gibi davran.
      handleConceptClick(foundConcept);
    } else {
      console.warn(`Linke tıklandı ama "${englishTerm}" adında bir kavram bulunamadı.`);
    }
  };
  
  const renderContent = () => {
    switch(view) {
      case 'concepts': {
        const filteredConcepts = concepts.filter(concept => 
          concept.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          concept.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return <ConceptList 
                  concepts={filteredConcepts} 
                  onConceptClick={handleConceptClick} 
                  searchTerm={searchTerm} 
                />;
      }
      case 'concept_detail': {
        if (isLoadingNews) return <p>Haberler yükleniyor...</p>;
        if (liveArticles.length > 0) return <LiveFeedList items={liveArticles} onPracticeClick={handlePracticeClick} />;
        return <p>Bu konuyla ilgili güncel bir haber bulunamadı.</p>;
      }
      case 'source_feed': {
        let sourceArticles = allNews.filter(article => new URL(article.link).hostname === selectedSource.id);
        if (searchTerm) {
          sourceArticles = sourceArticles.filter(article =>
            article.title.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        if (sourceArticles.length === 0 && !searchTerm) {
            return <p style={{textAlign: 'center', marginTop: '2rem'}}>Bu kaynaktan haber alınamadı veya bu kaynakta hiç haber bulunmuyor.</p>
        }
        return <LiveFeedList items={sourceArticles} onPracticeClick={handlePracticeClick} />;
      }
      case 'sandbox':
        return <SandboxView article={practiceArticle} onBack={handleBackFromSandbox} userSettings={userSettings} />;
      case 'chat':
        return <ChatView 
                  userSettings={userSettings} isFullScreen={isChatFullScreen} 
                  onToggleFullScreen={() => setIsChatFullScreen(prev => !prev)}
                  onBack={handleBackToCategories} onOpenSettings={() => setIsSettingsOpen(true)}
                  messages={chatMessages} setMessages={setChatMessages} 
               />;
      case 'categories':
      default: {
        let categoriesToDisplay = [];
        let suggestedConcepts = [];
        
        if (searchTerm.trim() !== '') {
          // --- 1. AŞAMA: Doğrudan Arama (Her zaman çalışır) ---
          const searchResults = allConcepts.filter(concept => 
            concept.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            concept.description.toLowerCase().includes(searchTerm.toLowerCase())
          );
          const matchingCategoryIds = new Set(searchResults.map(concept => concept.category_id));
          categoriesToDisplay = categories.filter(category => matchingCategoryIds.has(category.id));

          // --- 2. AŞAMA: Akıllı Öneri Araması (Her zaman çalışır) ---
          suggestedConcepts = allConcepts.filter(concept =>
            concept.related_keywords && concept.related_keywords.toLowerCase().includes(searchTerm.toLowerCase())
          );
        } else {
          // Arama çubuğu boşsa, tüm kategorileri göster
          categoriesToDisplay = categories;
        }
        
        return (
          <>
            {/* 1. Doğrudan Eşleşen Kategorileri Göster */}
            {categoriesToDisplay.length > 0 && (
                <CategoryList categories={categoriesToDisplay} onCategoryClick={handleCategoryClick} />
            )}

            {/* 2. Akıllı Önerileri Göster */}
            {suggestedConcepts.length > 0 && (
              <div className="suggestion-container">
                <h4>İlgili Kavram Önerileri:</h4>
                <ConceptList 
                  concepts={suggestedConcepts} 
                  onConceptClick={handleConceptClick} 
                  searchTerm={searchTerm} 
                />
              </div>
            )}
            
            {/* 3. Hiçbir Sonuç Yoksa Mesaj Göster */}
            {searchTerm.trim() !== '' && categoriesToDisplay.length === 0 && suggestedConcepts.length === 0 && (
                <p style={{textAlign: 'center', marginTop: '2rem'}}>Aradığınız terimle eşleşen bir sonuç bulunamadı.</p>
            )}

            {/* Haber Kaynakları Bölümü her zaman en altta kalır */}
            <div className="source-list-container">
              <h2>Haber Kaynakları</h2>
              <p>Güvenilir bir kaynaktan gelen en son haberleri keşfedin.</p>
              <div className="source-list">
                {newsSources.map(source => (
                  <button key={source.id} onClick={() => handleSourceClick(source)} className="source-button">
                    {source.name}
                  </button>
                ))}
              </div>
            </div>
          </>
        );
      }
    } // <-- EKSİK OLAN VE ŞİMDİ EKLENEN KAPANIŞ PARANTEZİ BUYDU
  }
  
  const renderHeaderAndNav = () => {
    // Ana sayfa için arama çubuğunu buraya taşıdık
    if (view === 'categories') {
        return (
            <div className="search-container" style={{ margin: '1rem 0 2rem 0' }}>
                <input 
                    type="search" 
                    placeholder="Tüm kavramlar içinde ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <i className="fa-solid fa-search"></i>
            </div>
        );
    }
    if (view === 'concepts') {
        return (
           <div>
              <button className="read-more-btn" onClick={handleBackToCategories} style={{ marginBottom: '1rem' }}>
                &larr; Tüm Kategorilere Geri Dön
              </button>
              <div className="list-header">
                <div className="list-header-title">
                  <h2>{selectedCategory?.title}</h2>
                  <p>{selectedCategory?.description}</p>
                </div>
                <div className="search-container">
                  <input 
                    type="search" 
                    placeholder="Bu kategorideki kavramlarda ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <i className="fa-solid fa-search"></i>
                </div>
              </div>
          </div>
        );
    }
    if (view === 'concept_detail') {
        const nistTerm = currentConcept?.english_term_authoritative.toLowerCase().replace(/ /g, '-');
        const nistLink = `https://csrc.nist.gov/glossary/term/${nistTerm}`;
        const sansLink = `https://www.sans.org/security-resources/glossary-of-terms`;

        return (
           <div>
              <button className="read-more-btn" onClick={handleBackToConcepts} style={{ marginBottom: '1rem' }}>
                  &larr; Kavramlara Geri Dön
              </button>
              <div className="list-header" style={{ alignItems: 'flex-start' }}>
                  <div className="list-header-title">
                      <h2>{currentConceptTitle}</h2>
                      <p style={{color: 'var(--secondary-text-color)', marginBottom: '1.5rem'}}>Resmi Kaynaklar ve İlgili Haberler:</p>
                  </div>
                  <div className="official-sources">
                      <h4>Resmi Tanımlar</h4>
                      <a href={nistLink} target="_blank" rel="noopener noreferrer" className="read-more-btn secondary"><i className="fa-solid fa-scroll"></i> NIST Sözlüğü</a>
                      <a href={sansLink} target="_blank" rel="noopener noreferrer" className="read-more-btn secondary"><i className="fa-solid fa-book-open"></i> SANS Sözlüğü</a>
                      <button className="read-more-btn secondary" onClick={handleDefineWithAi} disabled={isDefiningWithAi}><i className="fa-solid fa-microchip"></i> {isDefiningWithAi ? 'Tanımlanıyor...' : 'AI ile Tanımla'}</button>
                  </div>
              </div>
              {(isDefiningWithAi || aiDefinition) && (
                  <div className="ai-definition-box">
                      {isDefiningWithAi && !aiDefinition && <p>Lütfen bekleyin, tanım oluşturuluyor...</p>}
                     
                      {/* YENİ KODU EKLE: */}
                      <SmartContent 
                        text={aiDefinition}
                        concepts={allConcepts}
                        onConceptLinkClick={handleConceptLinkClick}
                      />

                  </div>
              )}
           </div>
        );
    }
     if (view === 'source_feed') {
      return (
         <div>
            <button className="read-more-btn" onClick={handleBackToCategories} style={{ marginBottom: '1rem' }}>
              &larr; Geri Dön
            </button>
            <div className="list-header">
              <div className="list-header-title">
                <h2>Kaynak Akışı: {selectedSource?.name}</h2>
                <p>Bu kaynaktan gelen en son haberler.</p>
              </div>
              <div className="search-container">
                <input 
                  type="search" 
                  placeholder="Haber başlıklarında ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <i className="fa-solid fa-search"></i>
              </div>
            </div>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      {/* 1. DÜZELTME: Header'ı sadece tam ekran modunda DEĞİLSEK göster. */}
      {!isChatFullScreen && (
        <header>
          <h1>CyberNexus TR</h1>
          <p>Küresel Siber İstihbarat ve Dil Geliştirme Portalınız</p>
          <div className="header-buttons">
              <button 
                  className="settings-btn" 
                  onClick={() => setIsSettingsOpen(true)}
                  title="AI Sağlayıcı Ayarları"
              >
                  <i className="fa-solid fa-cog"></i> Ayarlar
              </button>
          </div>
        </header>
      )}

      {/* Tam ekran modundayken main etiketine özel sınıf ekliyoruz (Bu satır doğru ve kalmalı) */}
      <main className={isChatFullScreen ? 'full-screen-chat-main' : ''}>
        {renderHeaderAndNav()}
        {renderContent()}
      </main>

      {isSettingsOpen && <SettingsView onClose={() => setIsSettingsOpen(false)} />}
      
      {/* 2. DÜZELTME: Kısayol butonunu da sadece tam ekran modunda DEĞİLSEK göster. */}
      {view !== 'chat' && !isChatFullScreen && (
        <button 
            className="fab-mentor-btn" 
            onClick={() => setView('chat')} 
            title="AI Mentor ile Sohbet Et"
        >
            <i className="fa-solid fa-comments"></i>
        </button>
      )}
    </>
  );
}

export default App;