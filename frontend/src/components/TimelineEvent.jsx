import React, { useState } from 'react';
// import { useState } from 'react'; // Zaten React import edildiği için gerek yok
import EventDetailModal from './EventDetailModal'; // Yeni modal'ı import et

function TimelineEvent({ event, index }) {
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal durumu için yeni state
  const [language, setLanguage] = useState('tr');

  const toggleLanguage = (e) => {
    e.stopPropagation();
    setLanguage(prev => (prev === 'tr' ? 'en' : 'tr'));
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="timeline-event">
      <div className="timeline-event-dot"></div>
      <div className="timeline-event-content">
        <span className="event-date">{event.event_date}</span>
        <h3>{event.title[language]}</h3>
        <p className="narrative-snippet">
          {`${event.narrative[language].substring(0, 200)}...`} {/* Artık her zaman kısa özet */}
        </p>

        {/* Detayları gösterme butonu artık modal'ı açacak */}
        <button onClick={openModal} className="details-toggle-btn">
          Detayları Göster
        </button>
        <button onClick={toggleLanguage} className="details-toggle-btn" style={{marginLeft: '10px'}}>
          {language === 'tr' ? 'EN' : 'TR'}
        </button>
      </div>

      {/* Modal'ı buraya dahil et */}
      <EventDetailModal
        event={event}
        onClose={closeModal}
        language={language}
        isOpen={isModalOpen}
      />
    </div>
  );
}

export default TimelineEvent;