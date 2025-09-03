// frontend/src/pages/CaseLibraryPage.jsx (NİHAİ KOD)

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getSolvedCases } from '../services/solvedCasesManager';
import { deleteCaseById } from '../services/api';
import StarDisplay from '../components/StarDisplay'; // Puan gösterimi için import
import './CaseLibraryPage.css';

const difficultyMap = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri'
};

function CaseLibraryPage({ anonymousUserId, cases, onCaseDeleted }) {
  const [solvedCases, setSolvedCases] = useState([]);
  const [language, setLanguage] = useState('tr');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const casesPerPage = 12;
  const [viewMode, setViewMode] = useState('all');

  useEffect(() => {
    if (anonymousUserId) {
      setSolvedCases(getSolvedCases(anonymousUserId));
    }
  }, [anonymousUserId]);

  const handleDeleteCase = async (e, caseIdToDelete) => {
    e.preventDefault();
    e.stopPropagation();
    if (!anonymousUserId) {
      alert("Kullanıcı kimliği bulunamadığı için silme işlemi yapılamıyor.");
      return;
    }
    const isConfirmed = window.confirm("Bu vakayı kalıcı olarak silmek istediğinizden emin misiniz?");
    if (isConfirmed) {
      try {
        await deleteCaseById(caseIdToDelete, anonymousUserId);
        onCaseDeleted();
      } catch (error) {
        alert(`Hata: ${error.message}`);
      }
    }
  };

  const toggleLanguage = () => setLanguage(prev => (prev === 'tr' ? 'en' : 'tr'));

  const processedCases = useMemo(() => {
    return cases
      .filter(caseItem => {
        if (viewMode === 'common') return caseItem.type === 'common';
        if (viewMode === 'private') return caseItem.type === 'private';
        return true;
      })
      .filter(caseItem => {
        const term = searchTerm.toLowerCase();
        if (!term) return true;
        const titleMatch = (caseItem.title.tr || '').toLowerCase().includes(term) || (caseItem.title.en || '').toLowerCase().includes(term);
        const conceptsMatch = caseItem.related_concepts.some(concept => concept.toLowerCase().includes(term));
        return titleMatch || conceptsMatch;
      })
      .sort((a, b) => {
        const isASolved = solvedCases.includes(a.id);
        const isBSolved = solvedCases.includes(b.id);

        switch (sortOption) {
          // --- YENİ EKLENEN SIRALAMA SEÇENEKLERİ ---
          case 'rating-desc':
            return (b.averageRating || 0) - (a.averageRating || 0);
          case 'rating-count-desc':
            return (b.ratingCount || 0) - (a.ratingCount || 0);
          // --- Değişiklik sonu ---
          case 'solved-first':
            if (isASolved && !isBSolved) return -1;
            if (!isASolved && isBSolved) return 1;
            return 0;
          case 'unsolved-first':
            if (isASolved && !isBSolved) return 1;
            if (!isASolved && isBSolved) return -1;
            return 0;
          case 'alpha-asc': return a.title[language].localeCompare(b.title[language]);
          case 'alpha-desc': return b.title[language].localeCompare(a.title[language]);
          case 'diff-asc':
            const diffOrder = { beginner: 1, intermediate: 2, advanced: 3 };
            return (diffOrder[a.difficulty] || 2) - (diffOrder[b.difficulty] || 2);
          case 'diff-desc':
            const diffOrderDesc = { beginner: 1, intermediate: 2, advanced: 3 };
            return (diffOrderDesc[b.difficulty] || 2) - (diffOrderDesc[a.difficulty] || 2);
          case 'latest':
          default:
            const timeA = parseInt((a.id || 'case-0').split('-')[1], 10);
            const timeB = parseInt((b.id || 'case-0').split('-')[1], 10);
            return timeB - timeA;
        }
      });
  }, [cases, searchTerm, sortOption, language, solvedCases, viewMode]);

  const totalPages = Math.ceil(processedCases.length / casesPerPage);
  const casesToDisplay = processedCases.slice((currentPage - 1) * casesPerPage, currentPage * casesPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (totalPages <= 1 && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [processedCases, currentPage, totalPages]);

  if (!cases) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <h2>Vaka Kütüphanesi Yükleniyor...</h2>
      </div>
    );
  }

  return (
    <div className="case-library-container">
      <div className="library-header">
        <h1><i className="fa-solid fa-book-journal-whills"></i> Vaka Kütüphanesi</h1>
        <p>Çözülmeyi bekleyen siber güvenlik vakalarını keşfedin.</p>
        <button onClick={toggleLanguage} className="language-toggle-lib">
          {language === 'tr' ? 'EN' : 'TR'}
        </button>
      </div>

      <div className="library-controls-container">
        <div className="view-toggle-container">
            <button
                className={`view-toggle-btn ${viewMode === 'all' ? 'active' : ''}`}
                onClick={() => setViewMode('all')}
            >
                <i className="fa-solid fa-globe"></i> Tümü
            </button>
            <button
                className={`view-toggle-btn ${viewMode === 'common' ? 'active' : ''}`}
                onClick={() => setViewMode('common')}
            >
                <i className="fa-solid fa-users"></i> Ortak Vakalar
            </button>
            <button
                className={`view-toggle-btn ${viewMode === 'private' ? 'active' : ''}`}
                onClick={() => setViewMode('private')}
            >
                <i className="fa-solid fa-user-lock"></i> Özel Vakalarım
            </button>
        </div>

        <div className="library-controls">
          <div className="library-search-container">
            <i className="fa-solid fa-search"></i>
            <input
              type="search"
              placeholder="Vaka başlığında veya kavramlarda ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="library-sort-container">
            <i className="fa-solid fa-sort"></i>
            {/* GÜNCELLEME: Sıralama menüsüne yeni seçenekler eklendi */}
            <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
              <option value="latest">Son Eklenen</option>
              <option value="rating-desc">En Yüksek Puanlı</option>
              <option value="rating-count-desc">En Çok Oylanan</option>
              <option value="unsolved-first">Önce Çözülmemişler</option>
              <option value="solved-first">Önce Çözülenler</option>
              <option value="alpha-asc">Alfabetik (A-Z)</option>
              <option value="alpha-desc">Alfabetik (Z-A)</option>
              <option value="diff-asc">Zorluk (Kolaydan Zora)</option>
              <option value="diff-desc">Zorluk (Zordan Kolaya)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="case-grid">
        {casesToDisplay.length > 0 ? (
          casesToDisplay.map(caseItem => {
            const isSolved = solvedCases.includes(caseItem.id);
            return (
              <Link to={`/case/${caseItem.id}`} key={caseItem.id} className="case-card-link">
                <div className={`case-card ${isSolved ? 'case-card--solved' : ''}`}>
                  <div className="case-card-header">
                    <h3>{caseItem.title[language]}</h3>
                    <div className="card-badges">
                      {isSolved && (
                          <div className="solved-badge">
                              <i className="fa-solid fa-check-circle"></i> Çözüldü
                          </div>
                      )}
                      {caseItem.type && (
                          <div className={`type-badge type-${caseItem.type}`}>
                              <i className={`fa-solid ${caseItem.type === 'common' ? 'fa-users' : 'fa-user-lock'}`}></i>
                              {caseItem.type === 'common' ? 'Ortak' : 'Özel'}
                          </div>
                      )}
                    </div>
                  </div>
                  <button
                    className="delete-case-btn"
                    onClick={(e) => handleDeleteCase(e, caseItem.id)}
                    title="Vakayı Sil"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                  
                  {/* Puan gösterimi artık burada */}
                  {caseItem.type === 'common' && caseItem.ratingCount > 0 && (
                    <div className="card-rating">
                        <StarDisplay rating={caseItem.averageRating} />
                        <span>{caseItem.averageRating.toFixed(1)} ({caseItem.ratingCount} oy)</span>
                    </div>
                  )}

                  <div className="case-card-concepts">
                    {caseItem.related_concepts.slice(0, 3).map((concept, index) => (
                      <span key={index} className="concept-tag-sm">{concept}</span>
                    ))}
                  </div>
                  <div className="case-card-footer">
                    <span>{isSolved ? 'Tekrar İncele' : 'Vakayı Başlat'} <i className="fa-solid fa-arrow-right"></i></span>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="empty-state-container">
            {searchTerm ? (
              <>
                <i className="fa-solid fa-magnifying-glass-minus"></i>
                <h3>Sonuç Bulunamadı</h3>
                <p>"{searchTerm}" için arama kriterlerinizle eşleşen bir vaka bulunamadı.</p>
              </>
            ) : (
              <>
                <i className="fa-solid fa-box-open"></i>
                <h3>Gösterilecek Vaka Bulunmuyor</h3>
                <p>Bu filtrede henüz hiç vaka oluşturulmamış. Başlamak için yeni bir vaka oluşturun!</p>
                <Link to="/create-case" className="read-more-btn">
                  <i className="fa-solid fa-plus"></i> Yeni Vaka Oluştur
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination-controls">
          <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
            <i className="fa-solid fa-arrow-left"></i> Önceki
          </button>
          <span>Sayfa {currentPage} / {totalPages}</span>
          <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
            Sonraki <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      )}
    </div>
  );
}

export default CaseLibraryPage;