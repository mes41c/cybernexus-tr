import React, { useEffect, useRef, useState } from 'react';
import './ContextMenu.css';

// Hangi varlık türü için hangi aksiyonların gösterileceğini tanımlar
const entityActions = {
  ip: (value) => [
    { label: 'Bu IP adresi hakkında bilgi iste', query: `"${value}" IP adresi hakkında detaylı bilgi verir misin?` },
    { label: 'WHOIS sorgusu yap (Simüle et)', query: `"${value}" için WHOIS sorgusu yapar mısın?` },
  ],
  md5: (value) => [
    { label: 'Bu MD5 hashini analiz et', query: `"${value}" MD5 hash'i hangi zararlıya ait olabilir?` },
  ],
  sha256: (value) => [
    { label: 'Bu SHA256 hashini analiz et', query: `"${value}" SHA256 hash'i hakkında bilgi verir misin?` },
  ],
  url: (value) => [
    { label: 'Bu alan adını analiz et', query: `"${value}" alan adı/URL'i hakkında istihbarat bilgisi var mı?` },
  ],
  cve: (value) => [
    { label: 'Bu CVE hakkında bilgi ver', query: `"${value}" zafiyeti hakkında detaylı bilgi verir misin?` },
  ]
};

function ContextMenu({ menuData, onAction, onClose }) {
  const menuRef = useRef(null);
  const { x, y, value, type } = menuData;
  const [position, setPosition] = useState({ top: y, left: x });

  // Menü ilk render edildiğinde, pozisyonunu ekran sınırlarına göre ayarla
  useEffect(() => {
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const newPosition = { top: y, left: x };

      if (x + menuRect.width > window.innerWidth) {
        newPosition.left = x - menuRect.width;
      }

      if (y + menuRect.height > window.innerHeight) {
        newPosition.top = y - menuRect.height;
      }

      setPosition(newPosition);
    }
  }, [x, y]);

  // Menü dışına tıklandığında kapatma
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const actions = entityActions[type] ? entityActions[type](value) : [];

  if (actions.length === 0) return null;

  return (
    <div className="context-menu" style={{ top: position.top, left: position.left }} ref={menuRef}>
      <div className="context-menu-header">{value}</div>
      <ul>
        {actions.map((action, index) => (
          <li key={index} onClick={() => onAction(action.query)}>
            {action.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ContextMenu;