import React, { useState, useEffect } from 'react';
import { fetchHistoryEvents } from '../services/api';
import TimelineEvent from '../components/TimelineEvent';
import EventDetailModal from '../components/EventDetailModal'; // Modal'ı artık burada import ediyoruz
import './HistoryPage.css';

function HistoryPage() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // YENİ: Hangi olayın seçildiğini tutacak olan merkezi state'imiz
  const [selectedEvent, setSelectedEvent] = useState(null);
  // YENİ: Modal'daki dil tercihini tutacak state
  const [modalLanguage, setModalLanguage] = useState('tr');

  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      const data = await fetchHistoryEvents();
      setEvents(data);
      setIsLoading(false);
    };
    loadEvents();
  }, []);

  // TimelineEvent'ten gelen olayı ve dil bilgisini state'e kaydeden fonksiyon
  const handleShowDetails = (event, language) => {
    setSelectedEvent(event);
    setModalLanguage(language);
  };

  // Modal'ı kapatmak için state'i temizleyen fonksiyon
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
      </div>
      <div className="timeline-container">
        {events.map((event) => (
          // TimelineEvent'e artık onShowDetails fonksiyonunu prop olarak geçiyoruz
          <TimelineEvent 
            key={event.id} 
            event={event} 
            onShowDetails={handleShowDetails} 
          />
        ))}
      </div>

      {/* YENİ: Sadece BİR TANE Modal'ı burada render ediyoruz.
        Görünürlüğü, selectedEvent state'inin dolu olup olmamasına bağlı.
      */}
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