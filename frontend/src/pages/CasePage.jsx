import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Modal from '../components/Modal';

import StarRating from '../components/StarRating';
import { rateCaseById } from '../services/api';

import { askMentorNet, fetchCaseDetails } from '../services/api';
import { appendToNotepad, getNotepadContent, saveNotepadContent } from '../services/notepadManager';
import { getSolvedCases, addSolvedCase, removeSolvedCase } from '../services/solvedCasesManager';
import { getWordsToHighlight } from '../services/entityExtractor';

import CaseReportModal from '../components/CaseReportModal';
import Notepad from '../components/Notepad';
import '../components/CaseView.css';

const clearChatHistory = (caseId, anonymousUserId) => {
  if (!caseId || !anonymousUserId) return;
  const key = `chat_${caseId}_${anonymousUserId}`;
  localStorage.removeItem(key);
};

const getChatHistory = (caseId, anonymousUserId) => {
  if (!caseId || !anonymousUserId) return null;
  const key = `chat_${caseId}_${anonymousUserId}`;
  const savedHistory = localStorage.getItem(key);
  return savedHistory ? JSON.parse(savedHistory) : null;
};

const saveChatHistory = (caseId, anonymousUserId, messages) => {
  if (!caseId || !anonymousUserId) return;
  const key = `chat_${caseId}_${anonymousUserId}`;
  localStorage.setItem(key, JSON.stringify(messages));
};

function CasePage({ userSettings, onOpenSettings, anonymousUserId }) {
  const { caseId } = useParams();
  
  // --- STATE YÖNETİMİ ---
  const [caseDetails, setCaseDetails] = useState(null);
  const [artifacts, setArtifacts] = useState([]);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [isLoadingCase, setIsLoadingCase] = useState(true);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [language, setLanguage] = useState('tr');
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isMentorTyping, setIsMentorTyping] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isMentorNetModalOpen, setIsMentorNetModalOpen] = useState(false); 
  const [isSolved, setIsSolved] = useState(false);
  const [notification, setNotification] = useState('');
  const [caseType, setCaseType] = useState(null);
  
  // Notepad içeriği artık bu üst bileşende yönetiliyor
  const [notepadContent, setNotepadContent] = useState('');
  
  const messageListRef = useRef(null);

  // --- VERİ YÜKLEME VE SENKRONİZASYON ---
  useEffect(() => {
    const loadData = async () => {
      if (!caseId || !anonymousUserId) return; // anonymousUserId'nin var olduğundan emin ol
      setIsLoadingCase(true);
      
      // DÜZELTME: API çağrısına anonymousUserId'yi ekliyoruz
      const details = await fetchCaseDetails(caseId, anonymousUserId);
      
      setCaseDetails(details);
      setCaseType(details.type);
      setArtifacts(details.artifacts || []);
      
      const solvedStatus = getSolvedCases().includes(caseId);
      setIsSolved(solvedStatus);
      
      const savedNotepad = getNotepadContent(caseId, anonymousUserId);
      setNotepadContent(savedNotepad);

      // --- YENİ EKLENEN BÖLÜM ---
      const savedHistory = getChatHistory(caseId, anonymousUserId);
      if (savedHistory && savedHistory.length > 0) {
        setMessages(savedHistory);
      } else {
        setMessages([{ sender: 'mentor', text: 'Vaka brifingini dikkatlice incele. Analize başlamak için ilk sorunu bekliyorum. Örneğin: "İlk erişim nasıl sağlanmış?"', entities: [] }]);
      }
      // --- Değişiklik sonu ---

      setIsLoadingCase(false);
    };
    loadData();
  }, [caseId, anonymousUserId]);

  const handleRatingSubmit = async (rating) => {
    if (!anonymousUserId) {
        setNotification('Oylama yapmak için kimliğinizin olması gerekiyor.');
        setTimeout(() => setNotification(''), 3000);
        return;
    }
    try {
        const response = await rateCaseById(caseId, anonymousUserId, rating);
        setNotification(`Oyunuz (${rating}/10) başarıyla kaydedildi! Yeni Ortalama: ${response.averageRating}`);
        setTimeout(() => setNotification(''), 4000);
    } catch (error) {
        setNotification(`Hata: ${error.message}`);
        setTimeout(() => setNotification(''), 3000);
    }
  };

  useEffect(() => {
    // İlk yüklemedeki başlangıç mesajının hemen kaydedilmemesi için kontrol
    if (messages.length > 1) {
      saveChatHistory(caseId, anonymousUserId, messages);
    }
  }, [messages, caseId, anonymousUserId]);

  // --- OLAY YÖNETİCİLERİ (EVENT HANDLERS) ---
  const handleAsk = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isMentorTyping) return;
    
    const userMessage = { sender: 'user', text: userInput, entities: [] };
    const updatedMessages = [...messages, userMessage];
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsMentorTyping(true);

    try {
        // DÜZELTME: API çağrısına anonymousUserId'yi ekliyoruz
      const mentorReplyText = await askMentorNet(caseId, updatedMessages, language, userSettings, anonymousUserId);
      const mentorResponse = {
        sender: 'mentor', 
        text: mentorReplyText,
        entities: getWordsToHighlight(mentorReplyText) 
      };
      setMessages(prev => [...prev, mentorResponse]);
    } catch (error) {
      // Hata mesajını artık doğrudan error.message'dan alıyoruz
      const errorResponse = { sender: 'mentor', text: `MentorNet ile iletişim kurulamadı.\nLütfen API anahtarınızı kontrol edin veya daha sonra tekrar deneyin.\n\nHata: ${error.message}`, entities: [] };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsMentorTyping(false);
    }
  };

  const handleNotepadChange = (newContent) => {
    setNotepadContent(newContent);
    // Otomatik kaydetme mantığı Notepad bileşeninin içinde devam ediyor
  };

  const handleResetChat = () => {
    const isConfirmed = window.confirm("Bu vakaya ait tüm MentorNet sohbet geçmişini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.");
    if (isConfirmed) {
      clearChatHistory(caseId, anonymousUserId);
      // State'i de sıfırlayarak ekranın anında güncellenmesini sağlıyoruz
      setMessages([{ sender: 'mentor', text: 'Sohbet geçmişi temizlendi. Analize yeniden başlayabiliriz. İlk sorunu bekliyorum.', entities: [] }]);
      setNotification('Sohbet geçmişi başarıyla sıfırlandı!');
      setTimeout(() => setNotification(''), 3000);
    }
  };

  const addTextToNotepad = (text) => {
      const currentContent = getNotepadContent(caseId, anonymousUserId);
      const newContent = currentContent.trim() ? `${currentContent.trim()}\n${text}` : text;
      setNotepadContent(newContent); // State'i anında güncelle
      saveNotepadContent(caseId, anonymousUserId, newContent); // localStorage'ı güncelle
      
      setNotification(`'${text}' not defterine eklendi!`);
      setTimeout(() => setNotification(''), 3000);
  };
  
  const handleAddArtifactToNotepad = (artifact) => {
    if (!artifact) return;
    const contentToAdd = `Kanıt #${artifact.id}: ${artifact.title[language]}\n---\n${artifact.content[language]}`;
    appendToNotepad(caseId, anonymousUserId, contentToAdd);
    setNotepadContent(getNotepadContent(caseId, anonymousUserId)); // State'i anında güncelle
    setNotification(`"${artifact.title[language]}" not defterine eklendi!`);
    setTimeout(() => setNotification(''), 3000);
  };
  
  const handleToggleSolved = () => {
    const newSolvedStatus = !isSolved;
    if (newSolvedStatus) {
      addSolvedCase(caseId);
    } else {
      removeSolvedCase(caseId);
    }
    setIsSolved(newSolvedStatus);
  };

  

  const getArtifactIcon = (type) => {
    switch (type) {
      case 'log':
      case 'dns_log':
        return 'fa-file-lines';
      case 'code':
        return 'fa-file-code';
      case 'report':
        return 'fa-file-invoice';
      case 'network-traffic':
        return 'fa-network-wired';
      case 'file_analysis':
        return 'fa-virus';
      default:
        return 'fa-file-alt';
    }
  };

  if (isLoadingCase || !caseDetails) {
    return (
        <div className="loading-container">
            <div className="loading-spinner"></div>
            <h2>Vaka Yükleniyor...</h2>
        </div>
    );
  }

  // --- RENDER ---
  return (
    <div className="case-view-container">
      {notification && <div className="app-notification">{notification}</div>}
      <div className="case-view-grid">
        <div className="case-content-left">
          <div className="case-header">
            <h1><i className="fa-solid fa-folder-open"></i> {caseDetails.title[language]}</h1>
            <button onClick={() => setLanguage(prev => prev === 'tr' ? 'en' : 'tr')} className="language-toggle">
              {language === 'tr' ? 'EN' : 'TR'}
            </button>
          </div>
          <div className="case-briefing">
            <h2><i className="fa-solid fa-file-alt"></i> Vaka Brifingi</h2>
            <ReactMarkdown children={caseDetails.briefing[language]} />
          </div>

          {caseDetails.related_concepts && caseDetails.related_concepts.length > 0 && (
            <div className="related-concepts">
              <h3><i className="fa-solid fa-lightbulb"></i> Bu Vakayla İlgili Kavramlar</h3>
              <div className="concepts-list">
                {caseDetails.related_concepts.map((concept, index) => (
                  <span key={index} className="concept-tag">{concept}</span>
                ))}
              </div>
            </div>
          )}

          {artifacts.length > 0 && (
            <div className="case-artifacts">
              <h3><i className="fa-solid fa-folder-tree"></i> Vaka Kanıtları</h3>
              <div className="artifact-list">
                {artifacts.map(artifact => (
                  <div key={artifact.id} className="artifact-item-wrapper">
                    <button onClick={() => setSelectedArtifact(artifact)} className="artifact-item">
                      <i className={`fa-solid ${getArtifactIcon(artifact.type)}`}></i>
                      {artifact.title[language]}
                    </button>
                    <button 
                      className="add-to-notepad-btn" 
                      title="Not Defterine Ekle"
                      onClick={() => handleAddArtifactToNotepad(artifact)}
                    >
                      <i className="fa-solid fa-plus"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="case-actions-container">
            <div className="report-submission-container">
                <button onClick={() => setIsReportModalOpen(true)} className="submit-report-btn">
                <i className="fa-solid fa-flag-checkered"></i> Vaka Raporu Sun
                </button>
            </div>
            <div className="manual-toggle-container">
                <button onClick={handleToggleSolved} className={`manual-solve-btn ${isSolved ? 'solved' : ''}`}>
                <i className={`fa-solid ${isSolved ? 'fa-times-circle' : 'fa-check-circle'}`}></i>
                {isSolved ? 'Çözülmedi Olarak İşaretle' : 'Çözüldü Olarak İşaretle'}
                </button>
            </div>
          </div>

          {caseType === 'common' && (
            <div className="case-rating-section">
              <h3><i className="fa-solid fa-star-half-alt"></i> Bu Vakayı Değerlendir</h3>
              <p>Bu vakanın kalitesini, öğreticiliğini ve gerçekçiliğini 10 üzerinden puanlayarak topluluğa yardımcı olun.</p>
              <StarRating onRatingSubmit={handleRatingSubmit} />
            </div>
          )}

        </div>
        
        <div className="case-content-right">
          <div className="mentor-net-chat">
            <div className="chat-title-header">
                <h2><i className="fa-solid fa-user-secret"></i> Mergen Analiz Konsolu</h2>
                <div> {/* Butonları sarmalayan bir div */}
                <button onClick={() => setIsMentorNetModalOpen(true)} className="help-button" title="Konsolu Büyüt">
                    <i className="fa-solid fa-expand-alt"></i>
                </button>
                <button onClick={handleResetChat} className="help-button reset-chat-btn" title="Sohbeti Sıfırla">
                    <i className="fa-solid fa-sync-alt"></i>
                </button>
                {/* --- Değişiklik sonu --- */}
                <button onClick={() => setIsHelpOpen(true)} className="help-button" title="Nasıl Oynanır?">
                    <i className="fa-solid fa-circle-info"></i>
                </button>
              </div>
            </div>
            <div className="message-list" ref={messageListRef}>
              {messages.map((msg, index) => (
                <div key={index} className={`message-wrapper ${msg.sender}`}>
                  <div className="message">
                    <div className="message-sender-icon">
                      <i className={`fa-solid ${msg.sender === 'user' ? 'fa-user-astronaut' : 'fa-microchip'}`}></i>
                    </div>
                    <div className="message-text">
                      <ReactMarkdown 
                        children={msg.text}
                        components={{
                          code({node, inline, className, children, ...props}) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <SyntaxHighlighter
                                children={String(children).replace(/\n$/, '')}
                                style={atomDark}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              />
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          }
                        }}
                      />
                      {msg.sender === 'mentor' && msg.entities && msg.entities.length > 0 && (
                        <div className="message-entities">
                          {msg.entities.map((entity, i) => (
                            <button key={i} onClick={() => addTextToNotepad(entity)} className="entity-add-btn" title="Nota Ekle">
                              {entity} <i className="fa-solid fa-plus"></i>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isMentorTyping && (
                <div className="message-wrapper mentor">
                  <div className="message">
                    <div className="message-sender-icon"><i className="fa-solid fa-microchip"></i></div>
                    <div className="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <form onSubmit={handleAsk} className="message-form">
              <i className="fa-solid fa-terminal"></i>
              <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder={language === 'tr' ? "Analiz sorgunu gir..." : "Enter your analysis query..."} disabled={isMentorTyping} />
              <button type="submit" disabled={isMentorTyping}>
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </form>
          </div>
          
          <Notepad 
            caseId={caseId} 
            anonymousUserId={anonymousUserId} 
            sendToMentorNet={ (query) => { setUserInput(query); setTimeout(() => document.querySelector('.message-form').requestSubmit(), 50); } }
            content={notepadContent}
            onContentChange={handleNotepadChange}
          />
        </div>
      </div>

      {selectedArtifact && (
        <div className="artifact-modal-overlay" onClick={() => setSelectedArtifact(null)}>
          <div className="artifact-modal" onClick={(e) => e.stopPropagation()}>
            <div className="artifact-modal-header">
              <h3><i className={`fa-solid ${getArtifactIcon(selectedArtifact.type)}`}></i> {selectedArtifact.title[language]}</h3>
              <div>
                <button className="add-to-notepad-btn modal-btn" title="Bu Kanıtı Not Defterine Ekle" onClick={() => handleAddArtifactToNotepad(selectedArtifact)}>
                  <i className="fa-solid fa-book-medical"></i> Nota Ekle
                </button>
                <button onClick={() => setSelectedArtifact(null)} className="close-modal-btn">&times;</button>
              </div>
            </div>
            <div className="artifact-modal-content">
              <pre>{selectedArtifact.content[language]}</pre>
            </div>
          </div>
        </div>
      )}

      {isHelpOpen && (
        <div className="info-modal-overlay" onClick={() => setIsHelpOpen(false)}>
          <div className="info-modal" onClick={(e) => e.stopPropagation()}>
             <h3>Nasıl Oynanır?</h3>
             <ol>
               <li><span>1</span> Sol taraftaki brifingi ve kanıtları dikkatlice inceleyin.</li>
               <li><span>2</span> Bir analist gibi düşünerek bu konsola sorular sorun (örn: "Firewall loglarında anomali var mı?").</li>
               <li><span>3</span> Aldığınız ipuçlarını birleştirerek saldırının adımlarını (İlk Erişim, Yatay Hareket vb.) çözmeye çalışın.</li>
               <li><span>4</span> Tıkandığınızı hissettiğinizde "bilmiyorum" veya "yardım et" gibi ifadelerle Mergen'den daha net bir yönlendirme isteyin.</li>
               <li><span>5</span> Amacınız, tüm kanıtları toplayarak olayın tam resmini ortaya çıkarmaktır.</li>
             </ol>
             <button onClick={() => setIsHelpOpen(false)}>Anladım</button>
          </div>
        </div>
      )}

      {isReportModalOpen && (
        <CaseReportModal 
          caseId={caseId}
          userSettings={userSettings}
          language={language}
          onClose={() => setIsReportModalOpen(false)}
          anonymousUserId={anonymousUserId}
        />
      )}

      {isMentorNetModalOpen && (
        <Modal onClose={() => setIsMentorNetModalOpen(false)} title="MentorNet Analiz Konsolu (Büyütülmüş)">
          <div className="mentor-net-chat modal-version">
            <div className="message-list">
              {/* Mevcut mesajları burada yeniden render ediyoruz */}
              {messages.map((msg, index) => (
                <div key={index} className={`message-wrapper ${msg.sender}`}>
                  <div className="message">
                    <div className="message-sender-icon">
                      <i className={`fa-solid ${msg.sender === 'user' ? 'fa-user-astronaut' : 'fa-microchip'}`}></i>
                    </div>
                    <div className="message-text">
                      <ReactMarkdown children={msg.text} />
                      {msg.sender === 'mentor' && msg.entities && msg.entities.length > 0 && (
                        <div className="message-entities">
                          {msg.entities.map((entity, i) => (
                            <button key={i} onClick={() => addTextToNotepad(entity)} className="entity-add-btn" title="Nota Ekle">
                              {entity} <i className="fa-solid fa-plus"></i>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isMentorTyping && (
                 <div className="message-wrapper mentor">
                   {/* ... (typing indicator JSX'i buraya da eklenebilir) ... */}
                 </div>
              )}
            </div>
            <form onSubmit={handleAsk} className="message-form">
              <i className="fa-solid fa-terminal"></i>
              <input 
                type="text" 
                value={userInput} 
                onChange={(e) => setUserInput(e.target.value)} 
                placeholder={language === 'tr' ? "Analiz sorgunu gir..." : "Enter your analysis query..."} 
                disabled={isMentorTyping} 
                autoFocus // Modal açıldığında otomatik olarak input'a odaklansın
              />
              <button type="submit" disabled={isMentorTyping}>
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </form>
          </div>
        </Modal>
      )}
      {/* --- Değişiklik sonu --- */}
    </div>
  );
}

export default CasePage;