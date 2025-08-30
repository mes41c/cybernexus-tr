import React, { useState, useEffect, useRef } from 'react';
import { streamChatResponse } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * @param {object} props
 * @param {object} props.userSettings
 * @param {boolean} props.isFullScreen
 * @param {function} props.onToggleFullScreen - Tam ekran modunu değiştiren fonksiyon
 */
function ChatView({ userSettings, isFullScreen, onToggleFullScreen, onBack, onOpenSettings, messages, setMessages }) {

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Sohbet alanını otomatik olarak en alta kaydırmak için bir referans
  const chatEndRef = useRef(null);

  // Mesajlar her güncellendiğinde sohbeti en alta kaydır
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!input.trim() || isLoading) return;

    // Akıllı yedekleme mantığını burada da kullanabiliriz (opsiyonel ama tutarlı)
    const findAvailableProvider = (settings) => {
      if (!settings) return null;
      const preferredProvider = settings.provider;
      const fallbackOrder = ['gemini', 'openai', 'deepseek'];
      if (settings[`${preferredProvider}ApiKey`]) return settings;
      for (const provider of fallbackOrder) {
        if (settings[`${provider}ApiKey`]) {
            // Yedek sağlayıcıyı aktif sağlayıcı yapıp yeni bir ayar nesnesi döndür
            return { ...settings, provider: provider };
        }
      }
      return null;
    };
    
    const activeSettings = findAvailableProvider(userSettings);
    if (!activeSettings) {
        alert("Lütfen devam etmeden önce Ayarlar menüsünden geçerli bir API anahtarı girin.");
        return;
    }

    const newUserMessage = { role: 'user', content: input };
    
    // --- HATA MUHTEMELEN BU BÖLGEDEYDİ ---
    // Değişkeni burada doğru şekilde tanımlayıp state'i güncelliyoruz.
    const messagesForStateUpdate = [...messages, newUserMessage];
    setMessages(messagesForStateUpdate);
    
    setInput('');
    setIsLoading(true);

    try {
      // API için Mesajları Filtreleme
      // Yukarıda tanımladığımız değişkeni burada kullanıyoruz.
      let messagesForApi = [...messagesForStateUpdate];

      // Eğer sohbet geçmişindeki ilk mesaj bizim karşılama mesajımız ise onu listeden çıkarıyoruz.
      if (messagesForApi.length > 0 && messagesForApi[0].role === 'model') {
        messagesForApi = messagesForApi.slice(1);
      }
      
      const response = await streamChatResponse(activeSettings, messagesForApi);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let modelResponse = '';
      // Gelen yanıt için önce boş bir 'model' mesajı ekliyoruz
      setMessages(prev => [...prev, { role: 'model', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        modelResponse += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = modelResponse;
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Sohbet hatası:", error);
      setMessages(prev => [...prev, { role: 'model', content: `Bir hata oluştu: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`chat-view ${isFullScreen ? 'full-screen' : ''}`}>
      
      {/* YENİ: Kendi Header Alanı */}
      <div className="chat-header">
        <div className="chat-header-left">
          <button className="read-more-btn" onClick={onBack}>
            &larr; Ana Sayfaya Geri Dön
          </button>
          <div className="chat-header-title">
            <h2>AI Mentor: Nexus</h2>
            <p>Aklınızdaki siber güvenlik sorularını sorun.</p>
          </div>
        </div>
        <div className="chat-header-right">
          {/* YENİ: ChatView içindeki Ayarlar butonu */}
          <button 
              className="settings-btn" 
              onClick={onOpenSettings} // onOpenSettings fonksiyonunu çağırıyoruz
              title="AI Sağlayıcı Ayarları"
          >
              <i className="fa-solid fa-cog"></i>
          </button>
          <button 
              className="full-screen-toggle-btn" 
              onClick={onToggleFullScreen}
              title={isFullScreen ? "Pencere Moduna Geç" : "Tam Ekrana Geç"}
          >
              <i className={`fa-solid ${isFullScreen ? 'fa-compress-alt' : 'fa-expand-alt'}`}></i>
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {/* Karşılama mesajını buradan kaldırıp, state'in başlangıç değerine taşıyarak
            her açıldığında görünmesini sağlayalım. */}
        {messages.map((msg, index) => (
          <div key={index} className={`message-bubble ${msg.role}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
          </div>
        ))}
        {isLoading && (
          <div className="message-bubble model">
            <p className="typing-indicator">Nexus yazıyor...</p>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nexus'a bir soru sorun..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>Gönder</button>
      </form>
    </div>
  );
}

export default ChatView;