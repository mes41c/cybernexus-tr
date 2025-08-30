import React, { useState, useEffect } from 'react';

// Varsayılan ayarlar nesnesi, kod tekrarını önler ve başlangıç durumunu netleştirir.
const defaultSettings = {
  provider: 'gemini', // Varsayılan olarak seçili gelen AI sağlayıcısı
  geminiApiKey: '',
  openaiApiKey: '',
  deepseekApiKey: '',
};

/**
 * Kullanıcının AI sağlayıcısını (Gemini, OpenAI, DeepSeek) seçmesini
 * ve ilgili API anahtarlarını tarayıcının yerel deposuna (localStorage)
 * kaydetmesini sağlayan gelişmiş ayarlar bileşeni.
 * @param {object} props - React bileşen özellikleri
 * @param {function} props.onClose - Bu ayarlar penceresini kapatma fonksiyonu
 */
function SettingsView({ onClose }) {
  // State'i artık tek bir string yerine, tüm ayarları içeren bir nesne olarak tutuyoruz.
  const [settings, setSettings] = useState(defaultSettings);
  const [saveStatus, setSaveStatus] = useState('');

  // Bileşen ilk yüklendiğinde, localStorage'dan ayarları çek.
  // Kayıtlı ayar yoksa, varsayılan ayarları kullan.
  useEffect(() => {
    const storedSettingsJson = localStorage.getItem('userAiSettings');
    if (storedSettingsJson) {
      // JSON formatında saklanan veriyi tekrar nesneye çeviriyoruz.
      setSettings(JSON.parse(storedSettingsJson));
    }
  }, []); // Sadece ilk render'da çalışır.

  /**
   * Input alanlarındaki veya radio butonlarındaki herhangi bir değişikliği
   * merkezi 'settings' state'ine işler.
   * @param {React.ChangeEvent<HTMLInputElement>} e - Değişiklik olayı
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: value,
    }));
  };

  /**
   * "Kaydet" butonuna tıklandığında, mevcut ayarlar nesnesini
   * JSON formatına çevirerek localStorage'a kaydeder.
   */
  const handleSave = () => {
    localStorage.setItem('userAiSettings', JSON.stringify(settings));
    onSettingsChange(); // <-- Değişikliği ana bileşene haber veriyoruz.
    setSaveStatus('Ayarlar başarıyla kaydedildi.');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  /**
   * "Tümünü Temizle" butonuna tıklandığında localStorage'daki kaydı siler
   * ve state'i varsayılan ayarlara döndürür.
   */
  const handleClear = () => {
    localStorage.removeItem('userAiSettings');
    setSettings(defaultSettings);
    onSettingsChange(); // <-- Değişikliği ana bileşene haber veriyoruz.
    setSaveStatus('Kaydedilmiş API anahtarları temizlendi.');
    setTimeout(() => setSaveStatus(''), 3000);
  };
  
  // YENİ FONKSİYON
  const handleClearCache = () => {
    let itemsRemoved = 0;
    Object.keys(localStorage)
      .filter(key => key.startsWith('cache_'))
      .forEach(key => {
        localStorage.removeItem(key);
        itemsRemoved++;
      });
    setSaveStatus(`${itemsRemoved} adet önbellek verisi başarıyla temizlendi.`);
    setTimeout(() => setSaveStatus(''), 3000);
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-view" onClick={(e) => e.stopPropagation()}>
        <h2>AI Sağlayıcı Ayarları</h2>
        <p style={{ color: 'var(--secondary-text-color)', marginBottom: '1.5rem' }}>
          Kullanmak istediğiniz yapay zeka modelini seçin ve ilgili API anahtarını girin.
          Seçiminiz, metin pratiklerinde kullanılacak modeli belirleyecektir.
        </p>

        {/* --- AI Sağlayıcı Seçimi --- */}
        <div className="provider-selection">
          <label>
            <input type="radio" name="provider" value="gemini" checked={settings.provider === 'gemini'} onChange={handleChange} />
            Google Gemini
          </label>
          <label>
            <input type="radio" name="provider" value="openai" checked={settings.provider === 'openai'} onChange={handleChange} />
            OpenAI (GPT)
          </label>
          <label>
            <input type="radio" name="provider" value="deepseek" checked={settings.provider === 'deepseek'} onChange={handleChange} />
            DeepSeek
          </label>
        </div>

        {/* --- API Anahtar Giriş Alanları --- */}
        <label htmlFor="geminiApiKey" className="api-key-label">Google Gemini API Anahtarı:</label>
        <input
          type="password"
          id="geminiApiKey"
          name="geminiApiKey"
          className="settings-input"
          placeholder="Gemini anahtarınızı buraya yapıştırın..."
          value={settings.geminiApiKey}
          onChange={handleChange}
        />

        <label htmlFor="openaiApiKey" className="api-key-label">OpenAI API Anahtarı:</label>
        <input
          type="password"
          id="openaiApiKey"
          name="openaiApiKey"
          className="settings-input"
          placeholder="OpenAI anahtarınızı buraya yapıştırın..."
          value={settings.openaiApiKey}
          onChange={handleChange}
        />
        
        <label htmlFor="deepseekApiKey" className="api-key-label">DeepSeek API Anahtarı:</label>
        <input
          type="password"
          id="deepseekApiKey"
          name="deepseekApiKey"
          className="settings-input"
          placeholder="DeepSeek anahtarınızı buraya yapıştırın..."
          value={settings.deepseekApiKey}
          onChange={handleChange}
        />

        {/* --- Kontrol Butonları --- */}
        <div className="settings-controls">
          <button className="read-more-btn" onClick={handleSave}>Kaydet</button>
          <button className="read-more-btn secondary" onClick={handleClearCache}>
            Önbelleği Temizle
          </button>
          <button className="read-more-btn secondary" onClick={handleClear}>Tümünü Temizle</button>
          <button className="read-more-btn secondary" onClick={onClose} style={{ marginLeft: 'auto' }}>Kapat</button>
        </div>

        {saveStatus && <p className="save-status-message">{saveStatus}</p>}
      </div>
    </div>
  );
}

export default SettingsView;
