import React from 'react';
import './EventDetailModal.css'; // Modal'ın kendi CSS'i olacak

function EventDetailModal({ event, onClose, language }) {
  if (!event) return null; // Event yoksa modal'ı gösterme

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          &times; {/* Kapatma ikonu */}
        </button>
        
        <div className="modal-header">
          <span className="modal-event-date">{event.event_date}</span>
          <h2>{event.title[language]}</h2>
        </div>

        <div className="modal-body">
          <p className="modal-narrative">{event.narrative[language]}</p>

          <div className="modal-section">
            <h3><i className="fa-solid fa-circle-info"></i> Önemi</h3>
            <p>{event.metadata.significance[language]}</p>
          </div>

          <div className="modal-section">
            <h3><i className="fa-solid fa-users"></i> Kilit İsimler ve Gruplar</h3>
            <div className="modal-metadata-tags">
              {event.metadata.key_people.map(item => <span key={item} className="modal-metadata-tag">{item}</span>)}
            </div>
          </div>

          <div className="modal-section">
            <h3><i className="fa-solid fa-microchip"></i> Kullanılan Teknolojiler</h3>
            <div className="modal-metadata-tags">
              {event.metadata.technologies_used.map(item => <span key={item} className="modal-metadata-tag">{item}</span>)}
            </div>
          </div>
          
          <div className="modal-section">
            <h3><i className="fa-solid fa-user-secret"></i> Kullanılan Yöntemler</h3>
            <div className="modal-metadata-tags">
              {event.metadata.methods_used.map(item => <span key={item} className="modal-metadata-tag">{item}</span>)}
            </div>
          </div>

          <div className="modal-section">
            <h3><i className="fa-solid fa-link"></i> Kaynaklar</h3>
            <ul className="modal-sources-list">
              {event.metadata.sources.map(src => <li key={src}><a href={src} target="_blank" rel="noopener noreferrer">{src}</a></li>)}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}

export default EventDetailModal;