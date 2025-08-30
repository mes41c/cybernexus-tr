import React from 'react';

function LiveFeedCard({ item, onPracticeClick }) {
  const sourceName = new URL(item.link).hostname.replace('www.','');
  const formattedDate = new Date(item.pubDate).toLocaleDateString('tr-TR');

  // Haberi yeni sekmede açmak için bir fonksiyon
  const openInNewTab = () => {
    window.open(item.link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="live-feed-card">
      <div onClick={openInNewTab} style={{cursor: 'pointer'}}>
        <h4>{item.title}</h4>
        <p className="summary">{item.summary}</p>
        <div className="meta">
          <span>{sourceName}</span>
          <span>{formattedDate}</span>
        </div>
      </div>
      <button 
        className="read-more-btn" 
        style={{marginTop: '1rem', alignSelf: 'flex-start'}}
        onClick={() => onPracticeClick(item)}
      >
        Bu Haberle Pratik Yap
      </button>
    </div>
  );
}

export default LiveFeedCard;