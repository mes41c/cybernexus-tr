// frontend/src/components/StarRating.jsx

import React, { useState } from 'react';
import './StarRating.css';

const StarRating = ({ initialRating = 0, maxRating = 10, onRatingSubmit }) => {
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);

  const handleSubmit = () => {
    if (rating > 0) {
      onRatingSubmit(rating);
    }
  };

  return (
    <div className="star-rating-container">
      <div className="stars">
        {[...Array(maxRating)].map((_, index) => {
          const ratingValue = index + 1;
          return (
            <span
              key={ratingValue}
              className={`star ${ratingValue <= (hover || rating) ? 'active' : ''}`}
              onClick={() => setRating(ratingValue)}
              onMouseEnter={() => setHover(ratingValue)}
              onMouseLeave={() => setHover(0)}
            >
              ★
            </span>
          );
        })}
      </div>
      <button onClick={handleSubmit} disabled={rating === 0} className="rate-submit-btn">
        Oyla ({rating}/{maxRating})
      </button>
    </div>
  );
};

export default StarRating;