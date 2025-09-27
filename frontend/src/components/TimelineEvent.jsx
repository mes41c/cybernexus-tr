import React, { useState } from 'react';

function TimelineEvent({ event, index }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [language, setLanguage] = useState('tr');

  const toggleLanguage = (e) => {
    e.stopPropagation();
    setLanguage(prev => (prev === 'tr' ? 'en' : 'tr'));
  };

  return (
    <div className="timeline-event">
      <div className="timeline-event-dot"></div>
      <div className="timeline-event-content">
        <span className="event-date">{event.event_date}</span>
        <h3>{event.title[language]}</h3>
        <p className="narrative-snippet">
          {isExpanded 
            ? event.narrative[language] 
            : `${event.narrative[language].substring(0, 200)}...`
          }
        </p>

        {isExpanded && (
          <div className="event-details">
            <h4><i className="fa-solid fa-circle-info"></i> Önemi</h4>
            <p>{event.metadata.significance[language]}</p>

            <h4><i className="fa-solid fa-users"></i> Kilit İsimler ve Gruplar</h4>
            <div className="metadata-tags">
              {event.metadata.key_people.map(item => <span key={item} className="metadata-tag">{item}</span>)}
            </div>

            <h4><i className="fa-solid fa-microchip"></i> Kullanılan Teknolojiler</h4>
            <div className="metadata-tags">
              {event.metadata.technologies_used.map(item => <span key={item} className="metadata-tag">{item}</span>)}
            </div>
            
            <h4><i className="fa-solid fa-user-secret"></i> Kullanılan Yöntemler</h4>
            <div className="metadata-tags">
              {event.metadata.methods_used.map(item => <span key={item} className="metadata-tag">{item}</span>)}
            </div>

            <h4><i className="fa-solid fa-link"></i> Kaynaklar</h4>
            <ul>
              {event.metadata.sources.map(src => <li key={src}><a href={src} target="_blank" rel="noopener noreferrer">{src}</a></li>)}
            </ul>
          </div>
        )}

        <button onClick={() => setIsExpanded(!isExpanded)} className="details-toggle-btn">
          {isExpanded ? 'Detayları Gizle' : 'Detayları Göster'}
        </button>
        <button onClick={toggleLanguage} className="details-toggle-btn" style={{marginLeft: '10px'}}>
          {language === 'tr' ? 'EN' : 'TR'}
        </button>
      </div>
    </div>
  );
}

export default TimelineEvent;