// frontend/src/components/SettingsView.jsx

import React, { useState, useEffect } from 'react';
import { clearLearningHistory } from '../services/api';
// Ayarlar menüsüne özel CSS dosyasını import ediyoruz
import './SettingsView.css'; 

const defaultSettings = {
  provider: 'gemini',
  geminiApiKey: '',
  openaiApiKey: '',
  deepseekApiKey: '',
};

function SettingsView({ onClose, onSettingsSaved, anonymousUserId }) {
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
    if(onSettingsSaved) onSettingsSaved();
    setSaveStatus('Ayarlar başarıyla kaydedildi.');
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
    setSaveStatus(`${itemsRemoved} adet haber önbellek verisi temizlendi.`);
    setTimeout(() => setSaveStatus(''), 4000);
  };

  const handleClearKeys = () => {
    const isConfirmed = window.confirm("Kaydedilmiş tüm API anahtarlarını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.");
    if (isConfirmed) {
      localStorage.removeItem('userAiSettings');
      setSettings(defaultSettings);
      if(onSettingsSaved) onSettingsSaved();
      setSaveStatus('Tüm API anahtarları başarıyla silindi.');
      setTimeout(() => setSaveStatus(''), 4000);
    }
  };

  const handleClearHistory = async () => {
    if (!anonymousUserId) {
        setSaveStatus('Kullanıcı kimliği bulunamadı.');
        return;
    }
    const isConfirmed = window.confirm("Tüm vaka çözüm geçmişinizi ve yapay zeka değerlendirmelerini kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.");
    if (isConfirmed) {
        try {
            const result = await clearLearningHistory(anonymousUserId);
            setSaveStatus(result.message);
            setTimeout(() => setSaveStatus(''), 4000);
        } catch (error) {
            setSaveStatus(`Hata: ${error.message}`);
            setTimeout(() => setSaveStatus(''), 4000);
        }
    }
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-view" onClick={(e) => e.stopPropagation()}>
        
        <div className="settings-header">
          <h2>CyberNexus Ayarları</h2>
          <p>Kullanmak istediğiniz yapay zeka modelini seçin ve ilgili API anahtarını girin.</p>
        </div>

        <div className="settings-body"> {/* <-- KAYDIRILABİLİR ALAN BAŞLANGICI */}
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

          <div className="settings-actions">
            <div className="action-item">
              <button className="read-more-btn secondary" onClick={handleClearCache}>Haber Önbelleğini Temizle</button>
              <p className="action-description">Ana sayfadaki haber akışını yenilemek için sunucudan gelen verileri temizler.</p>
            </div>
            <div className="action-item">
              <button className="read-more-btn secondary danger" onClick={handleClearHistory}>Vaka Geçmişini Sil</button>
              <p className="action-description">Çözdüğünüz tüm vakaların raporlarını ve size özel AI değerlendirmelerini kalıcı olarak siler.</p>
            </div>
            <div className="action-item">
              <button className="read-more-btn secondary danger" onClick={handleClearKeys}>Tüm API Anahtarlarını Sil</button>
              <p className="action-description">Bu tarayıcıda kayıtlı olan tüm Google Gemini, OpenAI ve DeepSeek API anahtarlarını temizler.</p>
            </div>
          </div>
        </div> {/* <-- KAYDIRILABİLİR ALAN SONU */}

        <div className="settings-footer">
            {saveStatus && <p className="save-status-message">{saveStatus}</p>}
            <button className="read-more-btn" onClick={handleSave}>Ayarları Kaydet</button>
            <button className="read-more-btn secondary" onClick={onClose}>Kapat</button>
        </div>

      </div>
    </div>
  );
}

export default SettingsView;