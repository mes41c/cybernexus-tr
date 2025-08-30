import React from 'react';
import CategoryCard from './CategoryCard';

// Bu bileşen, kategori dizisini ve tıklama fonksiyonunu alır.
function CategoryList({ categories, onCategoryClick }) {
  return (
    <div className="content-grid">
      {categories.map(category => (
        // Her bir kategori için bir kart oluşturur ve gerekli bilgileri ona iletir.
        <CategoryCard 
          key={category.id} 
          category={category} 
          onCategoryClick={onCategoryClick} 
        />
      ))}
    </div>
  );
}

export default CategoryList;