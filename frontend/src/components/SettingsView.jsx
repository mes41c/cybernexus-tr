// SettingsView.jsx - NİHAİ VERSİYON
import React, { useState, useEffect } from 'react';

const defaultSettings = {
  provider: 'gemini',
  geminiApiKey: '',
  openaiApiKey: '',
  deepseekApiKey: '',
};

function SettingsView({ onClose, onSettingsChange }) { // onSettingsChange prop'unu alıyoruz
  const [settings, setSettings] = useState(defaultSettings);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    const storedSettingsJson = localStorage.getItem('userAiSettings');
    if (storedSettingsJson) {
      setSettings(JSON.parse(storedSettingsJson));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: value,
    }));
  };

  const handleSave = () => {
    localStorage.setItem('userAiSettings', JSON.stringify(settings));
    onSettingsChange(); // <-- Değişikliği ana bileşene haber veriyoruz!
    setSaveStatus('Ayarlar başarıyla kaydedildi.');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleClear = () => {
    localStorage.removeItem('userAiSettings');
    setSettings(defaultSettings);
    onSettingsChange(); // <-- Değişikliği ana bileşene haber veriyoruz!
    setSaveStatus('Kaydedilmiş API anahtarları temizlendi.');
    setTimeout(() => setSaveStatus(''), 3000);
  };

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
        </p>
        <div className="provider-selection">
          <label><input type="radio" name="provider" value="gemini" checked={settings.provider === 'gemini'} onChange={handleChange} /> Google Gemini</label>
          <label><input type="radio" name="provider" value="openai" checked={settings.provider === 'openai'} onChange={handleChange} /> OpenAI (GPT)</label>
          <label><input type="radio" name="provider" value="deepseek" checked={settings.provider === 'deepseek'} onChange={handleChange} /> DeepSeek</label>
        </div>
        <label htmlFor="geminiApiKey" className="api-key-label">Google Gemini API Anahtarı:</label>
        <input type="password" id="geminiApiKey" name="geminiApiKey" className="settings-input" placeholder="Gemini anahtarınızı buraya yapıştırın..." value={settings.geminiApiKey} onChange={handleChange} />
        <label htmlFor="openaiApiKey" className="api-key-label">OpenAI API Anahtarı:</label>
        <input type="password" id="openaiApiKey" name="openaiApiKey" className="settings-input" placeholder="OpenAI anahtarınızı buraya yapıştırın..." value={settings.openaiApiKey} onChange={handleChange} />
        <label htmlFor="deepseekApiKey" className="api-key-label">DeepSeek API Anahtarı:</label>
        <input type="password" id="deepseekApiKey" name="deepseekApiKey" className="settings-input" placeholder="DeepSeek anahtarınızı buraya yapıştırın..." value={settings.deepseekApiKey} onChange={handleChange} />
        <div className="settings-controls">
          <button className="read-more-btn" onClick={handleSave}>Kaydet</button>
          <button className="read-more-btn secondary" onClick={handleClearCache}>Önbelleği Temizle</button>
          <button className="read-more-btn secondary" onClick={handleClear}>Tümünü Temizle</button>
          <button className="read-more-btn secondary" onClick={onClose} style={{ marginLeft: 'auto' }}>Kapat</button>
        </div>
        {saveStatus && <p className="save-status-message">{saveStatus}</p>}
      </div>
    </div>
  );
}

export default SettingsView;
