import React from 'react';

function Notification({ message, onClose }) {
  return (
    <div className="notification-banner">
      <p>{message}</p>
      <button onClick={onClose} className="close-btn">&times;</button>
    </div>
  );
}

export default Notification;