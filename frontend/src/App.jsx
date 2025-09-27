import { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { fetchAllConcepts } from './services/api'; // Tüm konseptleri çekecek yeni bir fonksiyon varsayıyoruz.
import HomePage from './pages/HomePage';
import CasePage from './pages/CasePage';
import { v4 as uuidv4 } from 'uuid'; 
import CaseLibraryPage from './pages/CaseLibraryPage';
import CreateCasePage from './pages/CreateCasePage';
import SettingsView from './components/SettingsView';
import './App.css';
import GuidePage from './pages/GuidePage';
import { fetchAllCases } from './services/api';
import HistoryPage from './pages/HistoryPage';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userSettings, setUserSettings] = useState(null);
  const [allConcepts, setAllConcepts] = useState([]);
  const [anonymousUserId, setAnonymousUserId] = useState(null);
  const [allCases, setAllCases] = useState([]);

  useEffect(() => {
    if (anonymousUserId) {
      fetchAllCases(anonymousUserId).then(response => {
        setAllCases(response.cases || []);
      });
    }
  }, [anonymousUserId]);

  const refreshCaseList = async () => {
    if (anonymousUserId) {
      const response = await fetchAllCases(anonymousUserId);
      setAllCases(response.cases || []);
    }
  };

  useEffect(() => {
    // --- YENİ: ANONİM KULLANICI KİMLİĞİ OLUŞTURMA ---
    let userId = localStorage.getItem('anonymousUserId');
    if (!userId) {
      // Eğer tarayıcıda bir kimlik yoksa, yeni bir tane oluştur ve kaydet
      userId = `user-${uuidv4()}`;
      localStorage.setItem('anonymousUserId', userId);
    }
    setAnonymousUserId(userId);
    // Uygulama ilk yüklendiğinde genel verileri çek
    const loadGlobalData = async () => {
      // api.js dosyanıza tüm konseptleri getiren bir fonksiyon eklemeniz gerekecek.
      // Örnek: export const fetchAllConcepts = () => get('/concepts/all');
      fetchAllConcepts().then(setAllConcepts); 
    };
    
    loadGlobalData();
    
    // Kullanıcı ayarlarını local storage'dan yükle
    const storedSettingsJson = localStorage.getItem('userAiSettings');
    if (storedSettingsJson) {
      setUserSettings(JSON.parse(storedSettingsJson));
    }
  }, []);

  // Ayarlar değiştiğinde state'i güncellemek için fonksiyon
  const handleSettingsChange = () => {
    const storedSettingsJson = localStorage.getItem('userAiSettings');
    const newSettings = storedSettingsJson ? JSON.parse(storedSettingsJson) : null;
    
    // --- KONTROL NOKTASI 1 ---
    console.log('App.jsx (handleSettingsChange): Ayarlar değişti. Yeni ayarlar:', newSettings);
    
    setUserSettings(newSettings);
  };

  return (
    <>
      <header>
        <div className="header-content">
          <div className="logo-container">
            <img src="/cybernexus.png" alt="CyberNexus TR Logo" className="logo" />
            <h1>CyberNexus TR</h1>
          </div>
          <nav>
            <Link to="/" className="nav-link">Ana Sayfa</Link>
            <Link to="/cases" className="nav-link">Vaka Kütüphanesi</Link>
            <Link to="/history" className="nav-link">Siber Tarihçe</Link>
            <Link to="/create-case" className="nav-link">Yeni Vaka Oluştur</Link>
          </nav>
          <div className="header-actions">
            <Link to="/guide" className="info-btn" title="Ozan'ın Kılavuzu">
              <i className="fa-solid fa-info-circle"></i>
            </Link>
            <button className="settings-btn" onClick={() => setIsSettingsOpen(true)} title="AI Sağlayıcı Ayarları">
              <i className="fa-solid fa-cog"></i> Ayarlar
            </button>
          </div>
        </div>
      </header>

      <main>
        <Routes>
          <Route 
            path="/" 
            element={
              <HomePage 
                userSettings={userSettings} 
                allConcepts={allConcepts} 
                onOpenSettings={() => setIsSettingsOpen(true)} 
              />
            } 
          />
          <Route 
            path="/cases" 
            element={
              <CaseLibraryPage 
                anonymousUserId={anonymousUserId} 
                cases={allCases} // <-- Vaka listesini prop olarak geçiyoruz
                onCaseDeleted={refreshCaseList} // <-- Silme sonrası yenileme için fonksiyon
              />
            } 
          />
          <Route 
            path="/case/:caseId" 
            element={
              <CasePage 
                userSettings={userSettings} 
                onOpenSettings={() => setIsSettingsOpen(true)} 
                anonymousUserId={anonymousUserId}
                onCaseCreated={refreshCaseList}
              />
            } 
          />
          <Route 
            path="/create-case" 
            element={
              <CreateCasePage 
                userSettings={userSettings} 
                onOpenSettings={() => setIsSettingsOpen(true)} 
                anonymousUserId={anonymousUserId} // <-- BU PROP'UN EKLENDİĞİNDEN EMİN OLUN
                onCaseCreated={refreshCaseList}
              />
            } 
          />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>

      {isSettingsOpen && 
        <SettingsView 
          onClose={() => setIsSettingsOpen(false)} 
          onSettingsSaved={handleSettingsChange}
          anonymousUserId={anonymousUserId}
        />
      }
    </>
  );
}

export default App;