import React from 'react';

// Bu bileşen, tek bir kategori nesnesini ve tıklama fonksiyonunu prop olarak alır.
function CategoryCard({ category, onCategoryClick }) {
  return (
    // Karta tıklandığında, ID'sini üst bileşene (App.jsx) gönderir.
    <div className="category-card" onClick={() => onCategoryClick(category.id)}>
      <h3>{category.title}</h3>
      <p>{category.description}</p>
    </div>
  );
}

export default CategoryCard;