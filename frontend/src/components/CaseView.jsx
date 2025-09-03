import React, { useState, useEffect } from 'react';
import caseData from '../cases/case-01.json';
import './CaseView.css';

function CaseView() {
  const [currentCase, setCurrentCase] = useState(null);
  const [language, setLanguage] = useState('tr'); // Varsayılan dil

  useEffect(() => {
    // İleride birden fazla vaka olabileceği için şimdiden bu yapıyı kuruyoruz.
    // Şimdilik sadece case-01.json'ı yüklüyoruz.
    setCurrentCase(caseData);
  }, []);

  if (!currentCase) {
    return <div>Vaka yükleniyor...</div>;
  }

  // Dil değiştirme fonksiyonu (şimdilik sadece arayüzde)
  const toggleLanguage = () => {
    setLanguage(prevLang => (prevLang === 'tr' ? 'en' : 'tr'));
  };

  return (
    <div className="case-view">
      <div className="case-header">
        <h1>{currentCase.title[language]}</h1>
        <button onClick={toggleLanguage} className="language-toggle">
          {language === 'tr' ? 'EN' : 'TR'}
        </button>
      </div>
      <div className="case-briefing">
        <h2>İlk Brifing</h2>
        <p>{currentCase.news_article_text[language]}</p>
      </div>
    </div>
  );
}

export default CaseView;