import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCaseWithAi } from '../services/api'; 
import './CreateCasePage.css'; // Bu CSS dosyasını bir sonraki adımda oluşturacağız

// YENİ: App.jsx'ten bu prop'ları alacak şekilde güncelliyoruz
function CreateCasePage({ userSettings, onOpenSettings }) {
  const [articleText, setArticleText] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // handleSubmit fonksiyonunu tamamen değiştiriyoruz
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!articleText.trim()) {
      alert('Lütfen vaka oluşturmak için bir haber metni girin.');
      return;
    }
    
    if (!userSettings || !userSettings[`${userSettings.provider}ApiKey`]) {
      onOpenSettings();
      alert("Lütfen devam etmek için Ayarlar'dan bir API anahtarı girin.");
      return;
    }

    setIsLoading(true);
    
    try {
      // API isteğine zorluk seviyesini de gönderiyoruz
      const result = await createCaseWithAi(articleText, userSettings, difficulty);
      
      if (result.success && result.newCaseId) {
        // BAŞARILI OLDUĞUNDA KULLANICIYI YENİ VAKANIN SAYFASINA YÖNLENDİR
        navigate(`/case/${result.newCaseId}`);
      } else {
        throw new Error(result.error || "Bilinmeyen bir hata oluştu.");
      }

    } catch (error) {
      alert(`Vaka oluşturulurken bir hata meydana geldi: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-case-container">
      <div className="create-case-form">
        <h1 className="form-title">
          <i className="fa-solid fa-wand-magic-sparkles"></i>
          Yapay Zeka ile Yeni Vaka Oluştur
        </h1>
        <p className="form-description">
          Aşağıdaki alana bir siber güvenlik haber metni yapıştırın. MentorNet, bu metni analiz ederek çözmeniz için interaktif bir dedektiflik vakasına dönüştürecektir.
        </p>
        <form onSubmit={handleSubmit}>
          <textarea
            className="article-textarea"
            value={articleText}
            onChange={(e) => setArticleText(e.target.value)}
            placeholder="İlgili siber güvenlik haber metnini buraya yapıştırın..."
            disabled={isLoading}
          />

          {/* YENİ EKLENEN BÖLÜM: ZORLUK SEÇİMİ */}
          <div className="difficulty-selector">
            <label htmlFor="difficulty">Vaka Zorluk Seviyesi:</label>
            <select 
              id="difficulty" 
              value={difficulty} 
              onChange={(e) => setDifficulty(e.target.value)}
              disabled={isLoading}
            >
              <option value="beginner">Başlangıç (Temel Kavramlar)</option>
              <option value="intermediate">Orta (Teknik Detaylar)</option>
              <option value="advanced">İleri Seviye (Derinlemesine Analiz)</option>
            </select>
          </div>

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Vaka Oluşturuluyor...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-bolt"></i>
                <span>Vakayı Oluştur</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateCasePage;