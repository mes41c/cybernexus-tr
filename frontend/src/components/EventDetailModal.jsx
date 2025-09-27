import React from 'react';
import './EventDetailModal.css';

function EventDetailModal({ event, onClose, language }) {
  if (!event) return null;

  // Metaveri bölümlerini bir dizi olarak tanımlayarak kodu daha temiz hale getiriyoruz
  const metadataSections = [
    { icon: 'fa-users', title: 'Kilit İsimler ve Gruplar', data: event.metadata.key_people },
    { icon: 'fa-microchip', title: 'Kullanılan Teknolojiler', data: event.metadata.technologies_used },
    { icon: 'fa-user-secret', title: 'Kullanılan Yöntemler', data: event.metadata.methods_used }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          &times;
        </button>
        
        <div className="modal-header">
          <span className="modal-event-date">{event.event_date}</span>
          <h2>{event.title[language]}</h2>
        </div>

        <div className="modal-body">
          {/* YENİ: İki sütunlu yapı */}
          <div className="modal-grid">
            
            {/* SOL SÜTUN: Anlatı ve Önem */}
            <div className="modal-main-content">
              <p className="modal-narrative">{event.narrative[language]}</p>
              
              <div className="modal-section">
                <h3><i className="fa-solid fa-circle-info"></i> Önemi</h3>
                <p>{event.metadata.significance[language]}</p>
              </div>
            </div>

            {/* SAĞ SÜTUN: Meta Veriler ve Kaynaklar */}
            <div className="modal-sidebar">
              {metadataSections.map(section => (
                <div className="modal-section" key={section.title}>
                  <h3><i className={`fa-solid ${section.icon}`}></i> {section.title}</h3>
                  <div className="modal-metadata-tags">
                    {section.data.map(item => <span key={item} className="modal-metadata-tag">{item}</span>)}
                  </div>
                </div>
              ))}
              
              <div className="modal-section">
                <h3><i className="fa-solid fa-link"></i> Kaynaklar</h3>
                <ul className="modal-sources-list">
                  {event.metadata.sources.map(src => <li key={src}><a href={src} target="_blank" rel="noopener noreferrer">{src}</a></li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetailModal;