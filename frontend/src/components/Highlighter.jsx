import React from 'react';

// Bu bileşen, bir metin (text) ve içinde vurgulanacak bir kelime (highlight) alır.
function Highlighter({ text = '', highlight = '' }) {
  // Eğer vurgulanacak bir kelime yoksa veya metin boşsa, metni olduğu gibi geri döndür.
  if (!highlight.trim() || !text) {
    return <span>{text}</span>;
  }

  // Vurgulanacak kelimeyi kullanarak bir "Regular Expression" (Düzenli İfade) oluşturuyoruz.
  // 'gi' bayrakları: 'g' (global, yani tüm eşleşmeleri bul) ve 'i' (case-insensitive, büyük/küçük harf duyarsız)
  const regex = new RegExp(`(${highlight})`, 'gi');
  
  // Metni, bulduğumuz eşleşmelere göre parçalara ayırıyoruz.
  // Örnek: text="Ağ Güvenliği", highlight="güven". Sonuç: ["Ağ ", "Güven", "liği"]
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) =>
        // Eğer parça, aranan kelimenin kendisiyse (büyük/küçük harf duyarsız kontrol)
        part.toLowerCase() === highlight.toLowerCase()
          // O zaman onu <mark> etiketiyle sararak vurgula
          ? <mark key={index}>{part}</mark>
          // Değilse, olduğu gibi yazdır
          : part
      )}
    </span>
  );
}

export default Highlighter;