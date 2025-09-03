// frontend/src/pages/CreateCasePage.jsx (TAM VE NİHAİ KODU)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCaseWithAi } from '../services/api';
import './CreateCasePage.css';

function CreateCasePage({ userSettings, onOpenSettings, anonymousUserId, onCaseCreated }) {
  const [articleText, setArticleText] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [isLoading, setIsLoading] = useState(false);
  const [caseType, setCaseType] = useState('private'); // Varsayılan olarak 'özel' seçili
  const navigate = useNavigate();

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
      // DÜZELTME: API çağrısına tüm gerekli parametreleri gönderiyoruz
      const result = await createCaseWithAi(articleText, userSettings, difficulty, caseType, anonymousUserId);
      
      if (result.success && result.newCaseId) {
        // 2. Yönlendirmeden hemen önce App.jsx'teki listeyi yenilemesi için prop'u çağırıyoruz.
        await onCaseCreated(); 
        
        // 3. Kullanıcıyı, yeni vakanın da içinde olduğu güncel listeye yönlendiriyoruz.
        navigate(`/cases`); 
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
          Aşağıdaki alana bir siber güvenlik haber metni yapıştırın. Mergen, bu metni analiz ederek çözmeniz için interaktif bir dedektiflik vakasına dönüştürecektir.
        </p>
        <form onSubmit={handleSubmit}>
          <textarea
            className="article-textarea"
            value={articleText}
            onChange={(e) => setArticleText(e.target.value)}
            placeholder="İlgili siber güvenlik haber metnini buraya yapıştırın..."
            disabled={isLoading}
          />
          <div className="difficulty-selector">
            <label htmlFor="difficulty">Vaka Zorluk Seviyesi:</label>
            <select 
              id="difficulty" 
              value={difficulty} 
              onChange={(e) => setDifficulty(e.target.value)}
              disabled={isLoading}
            >
              <option value="beginner">Başlangıç(Temel)</option>
              <option value="intermediate">Orta(Teknik)</option>
              <option value="advanced">İleri(Uzman)</option>
            </select>
          </div>
          <div className="case-type-selector">
            <label>Vaka Görünürlüğü:</label>
            <div className="radio-group">
              <label>
                <input type="radio" value="private" checked={caseType === 'private'} onChange={(e) => setCaseType(e.target.value)} disabled={isLoading} />
                <span>Özel (Sadece Ben Görebilirim)</span>
              </label>
              <label>
                <input type="radio" value="common" checked={caseType === 'common'} onChange={(e) => setCaseType(e.target.value)} disabled={isLoading} />
                <span>Ortak (Herkes Görebilir)</span>
              </label>
            </div>
          </div>
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? 'Oluşturuluyor...' : 'Vakayı Oluştur'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateCasePage;