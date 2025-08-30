import React from 'react';
import LiveFeedCard from './LiveFeedCard';

// App.jsx'ten gelen 'onPracticeClick' fonksiyonunu burada props olarak alıyoruz.
function LiveFeedList({ items, onPracticeClick }) {
  return (
    <div>
      {items.map((item, index) => (
        <LiveFeedCard 
          key={item.guid || index} 
          item={item} 
          // Aldığımız fonksiyonu bir alt bileşen olan LiveFeedCard'a iletiyoruz.
          onPracticeClick={onPracticeClick} 
        />
      ))}
    </div>
  );
}

export default LiveFeedList;