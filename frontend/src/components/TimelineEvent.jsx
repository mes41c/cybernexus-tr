import React, { useState } from 'react';

// Artık modal import etmiyoruz.
// 'onShowDetails' adında yeni bir prop alıyoruz.
function TimelineEvent({ event, onShowDetails }) {
  const [language, setLanguage] = useState('tr');

  const toggleLanguage = (e) => {
    e.stopPropagation();
    setLanguage(prev => (prev === 'tr' ? 'en' : 'tr'));
  };

  // Bu fonksiyon artık modal açmak yerine,
  // ana bileşene tıklanan olayın verisini gönderiyor.
  const handleShowDetailsClick = () => {
    onShowDetails(event, language);
  };

  return (
    <div className="timeline-event">
      <div className="timeline-event-dot"></div>
      <div className="timeline-event-content">
        <span className="event-date">{event.event_date}</span>
        <h3>{event.title[language]}</h3>
        <p className="narrative-snippet">
          {`${event.narrative[language].substring(0, 200)}...`}
        </p>

        {/* Buton tıklandığında yeni fonksiyonumuzu çağırıyoruz */}
        <button onClick={handleShowDetailsClick} className="details-toggle-btn">
          Detayları Göster
        </button>
        <button onClick={toggleLanguage} className="details-toggle-btn" style={{marginLeft: '10px'}}>
          {language === 'tr' ? 'EN' : 'TR'}
        </button>
      </div>
      {/* Modal'ı buradan tamamen kaldırdık */}
    </div>
  );
}

export default TimelineEvent;