// frontend/src/components/StarDisplay.jsx
import React from 'react';
import './StarDisplay.css';

const StarDisplay = ({ rating, maxRating = 10 }) => {
  const percentage = (rating / maxRating) * 100;
  return (
    <div className="star-display">
      <div className="star-display-inner" style={{ width: `${percentage}%` }}></div>
    </div>
  );
};

export default StarDisplay;