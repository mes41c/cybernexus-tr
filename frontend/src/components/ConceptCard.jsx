import React from 'react';
import Highlighter from './Highlighter'; // Yeni bileşeni import et

// Bileşen artık 'concept' ve 'onConceptClick' dışında 'searchTerm' prop'unu da alıyor.
function ConceptCard({ concept, onConceptClick, searchTerm }) {
  return (
    <div className="concept-card" onClick={() => onConceptClick(concept)}>
      <h4>
        {/* Başlığı artık Highlighter ile render ediyoruz */}
        <Highlighter text={concept.title} highlight={searchTerm} />
      </h4>
      <p>
        {/* Açıklamayı da Highlighter ile render ediyoruz */}
        <Highlighter text={concept.description} highlight={searchTerm} />
      </p>
    </div>
  );
}

export default ConceptCard;