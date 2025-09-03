// frontend/src/components/CaseReportModal.jsx

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { addSolvedCase } from '../services/solvedCasesManager';
import { evaluateCaseReport } from '../services/api'; // Bu fonksiyonu daha sonra oluşturacağız
import './CaseReportModal.css'; // Bu CSS dosyasını da oluşturacağız

function CaseReportModal({ caseId, userSettings, language, onClose, anonymousUserId }) {
  const [report, setReport] = useState({
    initial_access: '',
    key_tools: '',
    impact: '',
    summary: ''
  });
  const [evaluation, setEvaluation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setReport(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setEvaluation(null);
    try {
      // API çağrısına anonymousUserId'yi ekliyoruz
      const result = await evaluateCaseReport(caseId, report, userSettings, language, anonymousUserId);
      setEvaluation(result.evaluation);

      addSolvedCase(caseId);

    } catch (error) {
      setEvaluation(`**Hata:** Değerlendirme alınamadı. Lütfen sunucu loglarını kontrol edin. Hata Mesajı: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const reportFields = [
    // Her bir alanı, ikon ve alt başlık içerecek şekilde güncelliyoruz.
    { name: 'initial_access', icon: 'fa-key', label: 'İlk Erişim Vektörü', subtitle: 'Saldırgan sisteme ilk olarak nasıl sızdı?', placeholder: 'Örn: Bir oltalama e-postası ile gönderilen zararlı bir Office belgesi aracılığıyla...' },
    { name: 'key_tools', icon: 'fa-microchip', label: 'Kullanılan Anahtar Araçlar/Zararlılar', subtitle: 'Saldırgan hangi araçları, malware\'leri veya TTP\'leri kullandı?', placeholder: 'Örn: Cobalt Strike, Mimikatz, PowerShell betikleri...' },
    { name: 'impact', icon: 'fa-chart-line', label: 'Saldırının Etkisi', subtitle: 'Saldırının kuruma olan finansal, operasyonel veya itibari etkisi neydi?', placeholder: 'Örn: Kritik verilerin şifrelenmesi, hizmet kesintisi, müşteri verilerinin sızdırılması...' },
    { name: 'summary', icon: 'fa-clipboard-check', label: 'Olay Özeti ve Çıkarımlar', subtitle: 'Vakayı kendi cümlelerinizle özetleyin ve en önemli bulgularınızı belirtin.', placeholder: 'Örn: Saldırganlar, oltalama ile elde ettikleri kimlik bilgileriyle...' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Vaka Analiz Raporu</h2>
          <button onClick={onClose} className="close-modal-btn">&times;</button>
        </div>
        
        {!evaluation ? (
          <form onSubmit={handleSubmit}>
            {/* Formun render edilme şeklini güncelliyoruz */}
            {reportFields.map(field => (
              <div key={field.name} className="form-group">
                <div className="form-group-header">
                  <i className={`fa-solid ${field.icon}`}></i>
                  <div className="form-group-title">
                    <label htmlFor={field.name}>{field.label}</label>
                    <span>{field.subtitle}</span>
                  </div>
                </div>
                <textarea
                  id={field.name}
                  name={field.name}
                  value={report[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  rows="4"
                  disabled={isLoading}
                  required
                ></textarea>
                <div className="char-counter">
                  {report[field.name].length} Karakter
                </div>
              </div>
            ))}
            <button type="submit" className="submit-evaluation-btn" disabled={isLoading}>
              {isLoading ? 'Değerlendiriliyor...' : 'Raporu Değerlendirmeye Gönder'}
            </button>
          </form>
        ) : (
          <div className="evaluation-result">
            <h3>AI Değerlendirmesi</h3>
            <ReactMarkdown>{evaluation}</ReactMarkdown>
            <button onClick={onClose} className="submit-evaluation-btn">Kapat</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CaseReportModal;