// ConceptList.jsx

import React from 'react';
import ConceptCard from './ConceptCard';

// Bileşen artık 'searchTerm' prop'unu da alıyor.
function ConceptList({ concepts, onConceptClick, searchTerm }) {
  return (
    <div className="content-grid" style={{ gridTemplateColumns: '1fr' }}>
      {concepts.map(concept => (
        <ConceptCard 
          key={concept.id} 
          concept={concept} 
          onConceptClick={onConceptClick}
          searchTerm={searchTerm} // searchTerm'ü ConceptCard'a iletiyoruz.
        />
      ))}
    </div>
  );
}

export default ConceptList;