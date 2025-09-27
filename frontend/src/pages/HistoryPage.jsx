import React, { useState, useEffect } from 'react';
import { fetchHistoryEvents } from '../services/api';
import TimelineEvent from '../components/TimelineEvent';
import './HistoryPage.css'; // Yeni CSS'imizi import ediyoruz

function HistoryPage() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      const data = await fetchHistoryEvents();
      setEvents(data);
      setIsLoading(false);
    };
    loadEvents();
  }, []);

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
        {events.map((event, index) => (
          <TimelineEvent key={event.id} event={event} index={index} />
        ))}
      </div>
    </div>
  );
}

export default HistoryPage;