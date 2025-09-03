import React, { useState, useEffect, useRef, useMemo } from 'react';
import Highlighter from 'react-highlight-words';
import { saveNotepadContent } from '../services/notepadManager';
import { getWordsToHighlight } from '../services/entityExtractor';
import './Notepad.css';
import Modal from './Modal';

function Notepad({ caseId, anonymousUserId, sendToMentorNet, content, onContentChange }) {
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEntitiesPanelOpen, setIsEntitiesPanelOpen] = useState(true);
  const saveTimeoutRef = useRef(null);

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    onContentChange(newContent);
    
    setIsSaving(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveNotepadContent(caseId, anonymousUserId, newContent);
      setIsSaving(false);
    }, 1500);
  };
  
  const openNotepadModal = () => setIsModalOpen(true);
  const closeNotepadModal = () => setIsModalOpen(false);

  const detectedEntities = useMemo(() => {
    return getWordsToHighlight(content);
  }, [content]);

  const handleEntityClick = (entity) => {
    const isConfirmed = window.confirm(`"${entity}" varlığı hakkında MentorNet'e sorgu göndermek istediğinizden emin misiniz?`);
    if (isConfirmed) {
      const query = `"${entity}" hakkında bana bilgi ver.`;
      if (sendToMentorNet) {
        sendToMentorNet(query);
      }
    }
  };

  // --- KAYBOLAN BUTONUN FONKSİYONU ---
  const handleSendToMentorNet = () => {
    if (!content.trim()) {
      alert("Lütfen analiz için önce not defterine bir şeyler yazın.");
      return;
    }
    const query = `Aşağıdaki analist notlarımı değerlendirir misin?:\n\n---\n${content}\n---`;
    if (sendToMentorNet) {
      sendToMentorNet(query);
    }
  };
  // --- Değişiklik sonu ---

  const renderNotepadBody = (isFullScreen = false) => (
    <div className="notepad-body">
      <textarea
        value={content}
        onChange={handleContentChange}
        placeholder="Önemli bulguları, IP'leri ve hash'leri buraya not alın..."
        className={isFullScreen ? 'full-screen' : ''}
      />
      <div className="highlighter-overlay" aria-hidden="true">
        <Highlighter
          searchWords={detectedEntities}
          autoEscape={true}
          textToHighlight={content + ' \n'}
          highlightClassName="highlighted-cyber-entity"
        />
      </div>
    </div>
  );

  return (
    <>
      <div className="notepad-and-entities-wrapper">
        <div className="notepad-container">
          <div className="notepad-header">
            <h3><i className="fa-solid fa-book-skull"></i> Analist Not Defteri</h3>
            <div className="notepad-controls">
              {/* --- KAYBOLAN BUTONU GERİ GETİRİYORUZ --- */}
              <button onClick={handleSendToMentorNet} className="notepad-action-btn" title="Notları Analiz için Gönder">
                <i className="fa-solid fa-share-square"></i>
              </button>
              {/* --- Değişiklik sonu --- */}
              <span className={`save-status ${isSaving ? 'saving' : ''}`}>
                {isSaving ? 'Kaydediliyor...' : 'Kaydedildi ✓'}
              </span>
              <button onClick={openNotepadModal} className="notepad-action-btn" title="Not Defterini Büyült">
                <i className="fa-solid fa-expand-alt"></i>
              </button>
            </div>
          </div>
          {renderNotepadBody(false)}
        </div>
        
        {detectedEntities.length > 0 && (
          <div className="entities-panel">
            <h4 onClick={() => setIsEntitiesPanelOpen(!isEntitiesPanelOpen)}>
              <i className={`fa-solid fa-chevron-down ${isEntitiesPanelOpen ? 'open' : ''}`}></i>
              Sorgulanabilir Varlıklar ({detectedEntities.length})
            </h4>
            {isEntitiesPanelOpen && (
              <ul className="entities-list">
                {detectedEntities.map((entity, index) => (
                  <li key={index} onClick={() => handleEntityClick(entity)} title={`${entity} hakkında sorgu yap`}>
                    {entity}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <Modal 
          onClose={closeNotepadModal} 
          title="Analist Not Defteri (Büyütülmüş)"
          // YENİ: footer prop'unu tanımlıyoruz
          footer={
            <button onClick={handleSendToMentorNet} className="submit-evaluation-btn">
              <i className="fa-solid fa-share-square"></i> Notları Analiz için Gönder
            </button>
          }
        >
            <textarea
                value={content}
                onChange={handleContentChange}
                className="full-screen-notepad-textarea"
                placeholder="Önemli bulguları, IP adreslerini, dosya hash'lerini ve hipotezlerinizi buraya not alın..."
            />
            {renderNotepadBody(true)}
        </Modal>
      )}
    </>
  );
}

export default Notepad;