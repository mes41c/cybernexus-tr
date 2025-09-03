import { useState, useEffect } from 'react';
import { fetchCategories, fetchConceptsByCategory, fetchLiveNews, fetchNewsSources, fetchAllNews, fetchAiDefinition } from '../services/api';
import CategoryList from '../components/CategoryList';
import ConceptList from '../components/ConceptList';
import LiveFeedList from '../components/LiveFeedList';
import SandboxView from '../components/SandboxView';
import SmartContent from '../components/SmartContent';
import ChatView from '../components/ChatView';
import '../App.css';

function HomePage({ userSettings, allConcepts, onOpenSettings }) {
  const [view, setView] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [concepts, setConcepts] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [previousView, setPreviousView] = useState('categories');
  const [liveArticles, setLiveArticles] = useState([]);
  const [newsSources, setNewsSources] = useState([]);
  const [allNews, setAllNews] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [practiceArticle, setPracticeArticle] = useState(null);
  const [currentConceptTitle, setCurrentConceptTitle] = useState('');
  const [currentConcept, setCurrentConcept] = useState(null);
  const [aiDefinition, setAiDefinition] = useState('');
  const [isDefiningWithAi, setIsDefiningWithAi] = useState(false);
  const [isChatFullScreen, setIsChatFullScreen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'model', content: 'Merhaba! Ben Nexus, kişisel siber güvenlik mentorunuz. Okuduğunuz bir makale, bir zafiyet veya genel bir siber güvenlik konsepti hakkında soru sormaktan çekinmeyin.' }
  ]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.allSettled([
        fetchCategories().then(setCategories),
        fetchNewsSources().then(setNewsSources),
        fetchAllNews().then(setAllNews)
      ]);
      setIsInitialLoading(false);
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (view === 'concept_detail' && currentConcept) {
      setAiDefinition('');
      setIsLoadingNews(true);
      setLiveArticles([]);
      fetchLiveNews(currentConcept.english_term_authoritative, currentConcept.related_keywords)
        .then(newsItems => { setLiveArticles(newsItems || []); })
        .finally(() => { setIsLoadingNews(false); });
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
    setView('concept_detail');
    setCurrentConcept(concept);
    setCurrentConceptTitle(concept.title);
  };
  
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

  const handleBackFromSandbox = () => { setView(previousView); setPracticeArticle(null); };
  const handleBackToConcepts = () => { setView('concepts'); setLiveArticles([]); };
  const handleBackToCategories = () => { setView('categories'); setConcepts([]); setSelectedCategory(null); setLiveArticles([]); setPracticeArticle(null); setIsChatFullScreen(false); };
  
  const handleDefineWithAi = async () => {
    if (!currentConcept || !userSettings) {
      onOpenSettings();
      alert("Lütfen önce Ayarlar'dan bir AI sağlayıcı ve API anahtarı yapılandırın.");
      return;
    }
    const cacheKey = `ai_definition_${currentConcept.id}`;
    const cachedDefinition = localStorage.getItem(cacheKey);
    if (cachedDefinition) { setAiDefinition(cachedDefinition); return; }
    setIsDefiningWithAi(true);
    setAiDefinition('');
    let fullResponseText = '';
    try {
      const response = await fetchAiDefinition(userSettings, currentConcept);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const read = async () => {
        const { done, value } = await reader.read();
        if (done) {
          localStorage.setItem(cacheKey, fullResponseText);
          setIsDefiningWithAi(false);
          return;
        }
        const chunk = decoder.decode(value, { stream: true });
        fullResponseText += chunk;
        setAiDefinition(prev => prev + chunk);
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
    setSearchTerm('');
    setView('source_feed');
  };

  const handleConceptLinkClick = (englishTerm) => {
    const foundConcept = allConcepts.find(c => c.english_term_authoritative.toLowerCase() === englishTerm.toLowerCase());
    if (foundConcept) { handleConceptClick(foundConcept); }
    else { console.warn(`Linke tıklandı ama "${englishTerm}" adında bir kavram bulunamadı.`); }
  };

  const handleShowAllNewsClick = () => {
    setSelectedSource({ id: 'all', name: 'Tüm Kaynaklar' });
    setSearchTerm('');
    setPreviousView('categories');
    setView('source_feed');
  };
  
  const renderHeaderAndNav = () => {
    if (view === 'categories') {
      return (<div className="search-container" style={{ margin: '1rem 0 2rem 0' }}><input type="search" placeholder="Tüm kavramlar içinde ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /><i className="fa-solid fa-search"></i></div>);
    }
    if (view === 'concepts') {
      return (<div><button className="read-more-btn" onClick={handleBackToCategories} style={{ marginBottom: '1rem' }}>&larr; Tüm Kategorilere Geri Dön</button><div className="list-header"><div className="list-header-title"><h2>{selectedCategory?.title}</h2><p>{selectedCategory?.description}</p></div><div className="search-container"><input type="search" placeholder="Bu kategorideki kavramlarda ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /><i className="fa-solid fa-search"></i></div></div></div>);
    }
    if (view === 'concept_detail') {
      const nistTerm = currentConcept?.english_term_authoritative.toLowerCase().replace(/ /g, '+');
      const nistLink = `https://csrc.nist.gov/glossary?keywords-lg=${nistTerm}&sortBy-lg=relevance&ipp-lg=100`;
      const sansLink = `https://www.sans.org/security-resources/glossary-of-terms`;
      return (<div><button className="read-more-btn" onClick={handleBackToConcepts} style={{ marginBottom: '1rem' }}>&larr; Kavramlara Geri Dön</button><div className="list-header" style={{ alignItems: 'flex-start' }}><div className="list-header-title"><h2>{currentConceptTitle}</h2><p style={{color: 'var(--secondary-text-color)', marginBottom: '1.5rem'}}>Resmi Kaynaklar ve İlgili Haberler:</p></div><div className="official-sources"><h4>Resmi Tanımlar</h4><a href={nistLink} target="_blank" rel="noopener noreferrer" className="read-more-btn secondary"><i className="fa-solid fa-scroll"></i> NIST Sözlüğü</a><a href={sansLink} target="_blank" rel="noopener noreferrer" className="read-more-btn secondary"><i className="fa-solid fa-book-open"></i> SANS Sözlüğü</a><button className="read-more-btn secondary" onClick={handleDefineWithAi} disabled={isDefiningWithAi}><i className="fa-solid fa-microchip"></i> {isDefiningWithAi ? 'Tanımlanıyor...' : 'AI ile Tanımla'}</button></div></div>{(isDefiningWithAi || aiDefinition) && (<div className="ai-definition-box"><SmartContent text={aiDefinition} concepts={allConcepts} onConceptLinkClick={handleConceptLinkClick}/></div>)}</div>);
    }
    if (view === 'source_feed') {
      return (<div><button className="read-more-btn" onClick={handleBackToCategories} style={{ marginBottom: '1rem' }}>&larr; Geri Dön</button><div className="list-header"><div className="list-header-title"><h2>Kaynak Akışı: {selectedSource?.name}</h2><p>Bu kaynaktan gelen en son haberler.</p></div><div className="search-container"><input type="search" placeholder="Haber başlıklarında ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /><i className="fa-solid fa-search"></i></div></div></div>);
    }
    return null;
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
        let sourceArticles = [];
        if (selectedSource?.id === 'all') {
          sourceArticles = allNews;
        } else {
          sourceArticles = allNews.filter(article => new URL(article.link).hostname === selectedSource.id);
        }
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
                  onBack={handleBackToCategories} onOpenSettings={onOpenSettings}
                  messages={chatMessages} setMessages={setChatMessages} 
               />;
      case 'categories':
      default: {
        let categoriesToDisplay = [];
        let directConceptResults = []; // Doğrudan eşleşen kavramlar için yeni dizi
        let suggestedConcepts = [];
        
        if (searchTerm.trim() !== '') {
          // --- 1. Doğrudan Arama: Kavram başlığında veya açıklamasında ara ---
          directConceptResults = allConcepts.filter(concept => 
            concept.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            concept.description.toLowerCase().includes(searchTerm.toLowerCase())
          );

          // --- 2. Akıllı Öneri: İlişkili anahtar kelimelerde ara ---
          suggestedConcepts = allConcepts.filter(concept =>
            concept.related_keywords && concept.related_keywords.toLowerCase().includes(searchTerm.toLowerCase()) &&
            // Öneri sonuçlarının doğrudan sonuçlarla aynı olmasını engelle
            !directConceptResults.some(directResult => directResult.id === concept.id)
          );
        } else {
          // Arama çubuğu boşsa, tüm kategorileri göster
          categoriesToDisplay = categories;
        }
        
        // Arama yapıldıysa, kategori listesi yerine doğrudan kavram listesini göster
        if (searchTerm.trim() !== '') {
          if (directConceptResults.length > 0 || suggestedConcepts.length > 0) {
            return (
              <>
                {directConceptResults.length > 0 && (
                  <ConceptList 
                    concepts={directConceptResults} 
                    onConceptClick={handleConceptClick} 
                    searchTerm={searchTerm} 
                  />
                )}
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
              </>
            );
          } else {
            return <p style={{textAlign: 'center', marginTop: '2rem'}}>Aradığınız terimle eşleşen bir sonuç bulunamadı.</p>;
          }
        }
        
        // Arama yapılmadıysa, normal kategori ve haber kaynağı görünümü
        return (
          <>
            <CategoryList categories={categoriesToDisplay} onCategoryClick={handleCategoryClick} />
            <div className="source-list-container">
              <h2>Haber Kaynakları</h2>
              <p>Güvenilir bir kaynaktan gelen en son haberleri keşfedin.</p>
              <div className="source-list">
                <button onClick={handleShowAllNewsClick} className="source-button all-sources-btn">
                  ✨ Tüm Kaynaklar
                </button>
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
    }
  };

  if (isInitialLoading) {
    return (<div className="loading-container"><div className="loading-spinner"></div><h2>CyberNexus TR</h2><p>Sunucuya bağlanılıyor, bu işlem 30 saniye kadar sürebilir...</p></div>);
  }
  
  return (
    <>
      {renderHeaderAndNav()}
      {renderContent()}
      {!isChatFullScreen && view !== 'chat' && (<button className="fab-mentor-btn" onClick={() => setView('chat')} title="AI Mentor ile Sohbet Et"><i className="fa-solid fa-comments"></i></button>)}
    </>
  );
}

export default HomePage;