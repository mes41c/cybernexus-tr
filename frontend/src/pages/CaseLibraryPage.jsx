import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchAllCases, deleteCaseById } from '../services/api';
import { getSolvedCases } from '../services/solvedCasesManager';
import './CaseLibraryPage.css';

const difficultyMap = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri'
};

function CaseLibraryPage() {
  const [allCases, setAllCases] = useState([]);
  const [solvedCases, setSolvedCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState('tr');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const casesPerPage = 12;

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const response = await fetchAllCases(); 
      setAllCases(response.cases || []);
      setSolvedCases(getSolvedCases());
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleDeleteCase = async (e, caseIdToDelete) => {
    e.preventDefault();
    e.stopPropagation();
    const isConfirmed = window.confirm("Bu vakayı kalıcı olarak silmek istediğinizden emin misiniz?");
    if (isConfirmed) {
      try {
        await deleteCaseById(caseIdToDelete);
        setAllCases(prevCases => prevCases.filter(c => c.id !== caseIdToDelete));
      } catch (error) {
        alert(`Hata: ${error.message}`);
      }
    }
  };

  const toggleLanguage = () => setLanguage(prev => (prev === 'tr' ? 'en' : 'tr'));
  const handleNextPage = () => setCurrentPage(p => p + 1);
  const handlePrevPage = () => setCurrentPage(p => p - 1);

  const processedCases = useMemo(() => {
    return allCases
      .filter(caseItem => {
        const term = searchTerm.toLowerCase();
        if (!term) return true;
        const titleMatch = caseItem.title['tr'].toLowerCase().includes(term) || caseItem.title['en'].toLowerCase().includes(term);
        const conceptsMatch = caseItem.related_concepts.some(concept => concept.toLowerCase().includes(term));
        return titleMatch || conceptsMatch;
      })
      .sort((a, b) => {
        const isASolved = solvedCases.includes(a.id);
        const isBSolved = solvedCases.includes(b.id);

        switch (sortOption) {
          case 'solved-first':
            if (isASolved && !isBSolved) return -1;
            if (!isASolved && isBSolved) return 1;
            return 0; // İkisi de aynı durumdaysa sıralamayı değiştirme
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
            const timeA = parseInt(a.id.split('-')[1], 10);
            const timeB = parseInt(b.id.split('-')[1], 10);
            return timeB - timeA;
        }
      });
  }, [allCases, searchTerm, sortOption, language]);

  const totalPages = Math.ceil(processedCases.length / casesPerPage);
  const casesToDisplay = processedCases.slice((currentPage - 1) * casesPerPage, currentPage * casesPerPage);

  useEffect(() => {
    if(currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
    } else if (totalPages === 1) {
        setCurrentPage(1);
    }
  }, [processedCases, currentPage, totalPages]);

  if (isLoading) {
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
            <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
              <option value="latest">Son Eklenen</option>
              <option value="solved-first">Önce Çözülenler</option> {/* YENİ */}
              <option value="unsolved-first">Önce Çözülmemişler</option> {/* YENİ */}
              <option value="alpha-asc">Alfabetik (A-Z)</option>
              <option value="alpha-desc">Alfabetik (Z-A)</option>
              <option value="diff-asc">Zorluk (Kolaydan Zora)</option>
              <option value="diff-desc">Zorluk (Zordan Kolaya)</option>
            </select>
          </div>
        </div>
        <button onClick={toggleLanguage} className="language-toggle-lib">
          {language === 'tr' ? 'EN' : 'TR'}
        </button>
      </div>

      <div className="case-grid">
        {casesToDisplay.length > 0 ? (
          casesToDisplay.map(caseItem => {
            const isSolved = solvedCases.includes(caseItem.id);
            return (
              <Link to={`/case/${caseItem.id}`} key={caseItem.id} className="case-card-link">
                <div className={`case-card ${isSolved ? 'case-card--solved' : ''}`}>
                  <button 
                    className="delete-case-btn" 
                    onClick={(e) => handleDeleteCase(e, caseItem.id)}
                    title="Vakayı Sil"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                  <div className="case-card-header">
                    <div className={`difficulty-tag difficulty-${caseItem.difficulty}`}>
                      {language === 'tr' ? difficultyMap[caseItem.difficulty] : caseItem.difficulty}
                    </div>
                    <h3>{caseItem.title[language]}</h3>
                  </div>
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
                <h3>Kütüphane Henüz Boş</h3>
                <p>Görünüşe göre henüz hiç vaka oluşturulmamış. Başlamak için ilk vakanızı oluşturun!</p>
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
          <button onClick={handlePrevPage} disabled={currentPage === 1}>
            <i className="fa-solid fa-arrow-left"></i> Önceki
          </button>
          <span>Sayfa {currentPage} / {totalPages}</span>
          <button onClick={handleNextPage} disabled={currentPage === totalPages}>
            Sonraki <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      )}
    </div>
  );
}

export default CaseLibraryPage;