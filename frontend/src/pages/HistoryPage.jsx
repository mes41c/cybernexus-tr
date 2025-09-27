import React, { useState, useEffect, useMemo } from 'react';
import { fetchHistoryEvents } from '../services/api';
import TimelineEvent from '../components/TimelineEvent';
import EventDetailModal from '../components/EventDetailModal';
import './HistoryPage.css';

function HistoryPage() {
  const [allEvents, setAllEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalLanguage, setModalLanguage] = useState('tr');
  
  // YENİ: Arama terimi için state
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      const data = await fetchHistoryEvents();
      setAllEvents(data);
      setIsLoading(false);
    };
    loadEvents();
  }, []);

  // YENİ: Arama işlevselliği için `useMemo` kullanımı
  // Bu, her harf yazıldığında listeyi verimli bir şekilde filtreler.
  const filteredEvents = useMemo(() => {
    if (!searchTerm) {
      return allEvents;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return allEvents.filter(event => {
      // Başlıkta, anlatıda veya kilit isimlerde/teknolojilerde arama yap
      const titleMatch = event.title.tr.toLowerCase().includes(lowercasedFilter) || event.title.en.toLowerCase().includes(lowercasedFilter);
      const narrativeMatch = event.narrative.tr.toLowerCase().includes(lowercasedFilter) || event.narrative.en.toLowerCase().includes(lowercasedFilter);
      const metadataMatch = [...event.metadata.key_people, ...event.metadata.technologies_used].some(tag =>
        tag.toLowerCase().includes(lowercasedFilter)
      );
      return titleMatch || narrativeMatch || metadataMatch;
    });
  }, [searchTerm, allEvents]);


  const handleShowDetails = (event, language) => {
    setSelectedEvent(event);
    setModalLanguage(language);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <h2>Siber Tarihçe Yükleniyor...</h2>
      </div>
    );
  }

  return (
    <div className="history-page-container">
      <div className="history-header">
        <h1><i className="fa-solid fa-scroll"></i> Siber Güvenlik Tarihçesi</h1>
        <p>Dijital dünyanın en önemli olaylarında bir yolculuğa çıkın. Dünü anlamak, yarını korumanın ilk adımıdır.</p>
        
        {/* YENİ: ARAMA ÇUBUĞU */}
        <div className="history-search-container">
          <i className="fa-solid fa-search"></i>
          <input
            type="search"
            placeholder="Olay, kişi veya teknoloji ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="timeline-container">
        {/* YENİ: Artık filtrelenmiş listeyi render ediyoruz */}
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <TimelineEvent 
              key={event.id} 
              event={event} 
              onShowDetails={handleShowDetails} 
            />
          ))
        ) : (
          <div className="no-results-found">
            <i className="fa-solid fa-ghost"></i>
            <p>"{searchTerm}" ile eşleşen bir olay bulunamadı.</p>
          </div>
        )}
      </div>

      {selectedEvent && (
        <EventDetailModal 
          event={selectedEvent}
          onClose={handleCloseModal}
          language={modalLanguage}
        />
      )}
    </div>
  );
}

export default HistoryPage;