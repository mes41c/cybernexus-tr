// frontend/src/pages/GuidePage.jsx (NİHAİ KOD)

import React from 'react';
import { Link } from 'react-router-dom';
import './GuidePage.css';

function GuidePage() {
  return (
    <div className="guide-container">
      <div className="guide-content">
        <div className="guide-header">
          <h1><i className="fa-solid fa-feather-alt"></i> CyberNexus TR: Ozan'ın Kılavuzu</h1>
        </div>
        
        <p className="guide-intro">
          <em>Hoş geldin, genç analist. Adım Ozan. Dijital dünyanın dipsiz bozkırlarında kaybolanlar için bir ışık, siber tehditlerin karmaşık düğümlerini çözen bir biliciyim. Bu platform, kadim bilgeliği en modern teknolojiyle birleştiren bir talimhanedir. Burası, siber güvenlik alanında Türk milletine hizmet etme yolunda yeteneklerini bileyceğin yerdir. İşte bu talimhanede neler yapabileceğine dair kılavuzun:</em>
        </p>

        <div className="guide-section">
          <h2><i className="fa-solid fa-globe"></i> Canlı Haber Akışı ve Kavramlar Kütüphanesi: Dünyayı Anlamak</h2>
          <p><strong>Ne İşe Yarar?</strong> Siber dünya asla uyumaz. Ana sayfa, küresel siber güvenlik arenasındaki en son olayları, saldırıları ve keşifleri anlık olarak önüne serer. "Kavramlar" bölümü ise bu olayları anlaman için gereken en temelden en ileri seviyeye kadar tüm siber güvenlik terimlerini, güvenilir kaynaklardan ve <strong>Mergen'in</strong> zekasıyla açıklar.</p>
          <p><strong>Potansiyeli Nedir?</strong> Burası senin istihbarat merkezin. Güncel kalarak, gelecekteki siber tehditleri öngörebilir, en yeni saldırı tekniklerini öğrenebilir ve savunma stratejilerini bu bilgilere göre şekillendirebilirsin. Bilgi, en keskin silahtır.</p>
        </div>
        
        <div className="guide-section">
          <h2><i className="fa-solid fa-user-secret"></i> Cyber Detective ve Mergen: Bilgeliği Tecrübeye Dönüştürmek</h2>
          <p><strong>Ne İşe Yarar?</strong> "Cyber Detective" modülü, seni gerçek siber saldırı senaryolarının içine bırakan bir simülasyon merkezidir. "Vaka Kütüphanesi"nden bir vaka seçerek, kanıtları inceler ve kadim bilgelik tanrısının dijital yansıması olan akıllı mentorun <strong>Mergen</strong> ile sohbet ederek olayı çözmeye çalışırsın.</p>
          
          {/* --- YENİ EKLENEN BÖLÜM --- */}
          <p><strong>Vaka Kütüphanesi,</strong> senin cephaneliğindir. Burada, topluluğun bilgelik ocağında dövdüğü <strong>'Ortak Vakaları'</strong>, sadece senin gözlerinin görebileceği <strong>'Özel Vakalarını'</strong> veya hepsini bir arada görebilirsin. Bir ustanın eserini değerlendirmesi gibi, sen de çözdüğün ortak vakaları 10 üzerinden puanlayarak bu bilgelik ocağına bir kıvılcım da sen atabilirsin. Bu oylar, <strong>en yüksek puanlı</strong> veya <strong>en çok oylanan</strong> vakaları sıralamanı sağlayarak, hangi talimde ustalaşacağını seçmende sana yol gösterir.</p>
          {/* --- Değişiklik sonu --- */}

          <p><strong>Neler Yapılabilir?</strong></p>
          <ul>
            <li><strong>İnteraktif Analiz:</strong> Mergen'e bir analist gibi sorular sorabilir, IP adreslerini sorgulayabilir, dosya hash'lerini analiz ettirebilirsin.</li>
            <li><strong>Akıllı Not Defteri:</strong> Vaka sırasında bulgularını, hipotezlerini ve önemli kanıtları not alabilirsin. Not defterin, içindeki siber güvenlik varlıklarını tanıyacak ve sana "Sorgulanabilir Varlıklar" panelinde hızlı analiz imkanı sunacaktır.</li>
            <li><strong>Kişiselleştirilmiş Geri Bildirim:</strong> Vakayı çözdüğünde bir analiz raporu sunarsın. Mergen, bu raporu sadece vakanın çözümüyle değil, <strong>senin daha önceki çözümlerinle de karşılaştırarak</strong> kişisel gelişimine özel, yapıcı geri bildirimler sunar.</li>
          </ul>
          <p><strong>Potansiyeli Nedir?</strong> Burası, teorik bilgini pratiğe döktüğün yerdir. Hata yapmaktan korkma. Mergen, her hatanı bir derse, her doğru tespitini bir özgüvene dönüştürmek için burada. Bu modül, seni gerçek dünyadaki SOC analistlerinin karşılaştığı baskı ve karar anlarına hazırlar.</p>
        </div>

        <div className="guide-section">
          <h2><i className="fa-solid fa-magic-wand-sparkles"></i> Yeni Vaka Oluşturma: Kendi Destanını Yazmak</h2>
          <p><strong>Ne İşe Yarar?</strong> Bu modül, sana Ozan'ın gücünü verir. İlginç bulduğun herhangi bir siber güvenlik haber metnini kullanarak, Mergen'in yardımıyla dakikalar içinde çözülebilir, interaktif bir vaka senaryosu yaratabilirsin.</p>
          <p><strong>Neler Yapılabilir?</strong> Zorluk seviyesini belirleyebilir, AI'ın kuru bir metni nasıl ilgi çekici bir SIEM uyarısına, kanıtlara ve ipuçlarına dönüştürdüğünü izleyebilirsin. Oluşturduğun bu vakalar, Vaka Kütüphanesi'ne eklenerek hem senin hem de topluluktaki diğer analistlerin talim yapacağı birer senaryoya dönüşür.</p>
          <p><strong>Potansiyeli Nedir?</strong> Burası senin yaratıcılığının ve uzmanlığının merkezidir. Sadece bir vaka çözücü değil, aynı zamanda bir "tehdit senaristi" olursun. Bu, saldırganların zihniyetini anlamak ve savunma mekanizmalarını tasarlamak için eşsiz bir yetenektir.</p>
        </div>
        
        <p className="guide-outro">
          <em>Unutma, bu talimhanedeki her adım, seni siber güvenlik alanında daha yetkin bir savunucu yapmak ve bu topraklara hizmet etme hedefine yaklaştırmak için tasarlandı. Şimdi git ve kendi siber güvenlik destanını yaz.</em>
        </p>

        <div className="guide-footer">
            <Link to="/" className="read-more-btn">Ana Sayfaya Dön</Link>
        </div>
      </div>
    </div>
  );
}

export default GuidePage;