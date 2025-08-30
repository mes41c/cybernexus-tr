import React from 'react';
import ReactMarkdown from 'react-markdown';

function SmartContent({ text, concepts, onConceptLinkClick }) {
  if (!text || !concepts || concepts.length === 0) {
    return <ReactMarkdown>{text}</ReactMarkdown>;
  }

  // Arama yapılacak terimlerin listesini ve bunları bulacak olan Regex'i hazırlıyoruz.
  // Bu kısım bir öncekiyle aynı.
  const searchTerms = concepts
    .map(c => c.english_term_authoritative)
    .filter(Boolean)
    .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  searchTerms.sort((a, b) => b.length - a.length);

  // Eğer hiç aranacak terim yoksa, daha fazla işlem yapma
  if (searchTerms.length === 0) {
      return <ReactMarkdown>{text}</ReactMarkdown>;
  }

  const regex = new RegExp(`(${searchTerms.join('|')})`, 'gi');

  // ReactMarkdown'a, metin içindeki paragrafları (<p>) nasıl işleyeceğini öğretiyoruz.
  return (
    <ReactMarkdown
      components={{
        // Varsayılan paragraf (<p>) render etme davranışını eziyoruz (override).
        p: ({ node, ...props }) => {
          // Bir paragrafın içeriği genellikle tek bir text node'udur.
          // Bu text node'unun içeriğini alıyoruz.
          const textContent = node.children.map(child => {
            return typeof child.value === 'string' ? child.value : '';
          }).join('');

          if (!textContent) return <p {...props} />;

          // Tıpkı bir önceki kodumuzdaki gibi, metni Regex ile parçalara ayırıyoruz.
          const parts = textContent.split(regex);
          
          return (
            <p {...props}>
              {parts.map((part, index) => {
                // Her bir parçanın bir kavram olup olmadığını kontrol ediyoruz.
                const isConcept = searchTerms.some(term => term.toLowerCase() === part.toLowerCase());
                
                if (isConcept) {
                  // Eğer kavram ise, onu tıklanabilir bir linke dönüştürüyoruz.
                  return (
                    <strong key={index} className="concept-link" onClick={() => onConceptLinkClick(part)}>
                      {part}
                    </strong>
                  );
                }
                // Değilse, normal metin olarak bırakıyoruz.
                return part;
              })}
            </p>
          );
        }
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

export default SmartContent;