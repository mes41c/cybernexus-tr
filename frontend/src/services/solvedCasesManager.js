// frontend/src/services/solvedCasesManager.js

const SOLVED_CASES_KEY = 'solvedCases';

/**
 * localStorage'dan çözülmüş tüm vaka ID'lerinin listesini alır.
 * @returns {string[]} Çözülmüş vaka ID'lerinin dizisi.
 */
export const getSolvedCases = () => {
  try {
    const solvedCases = localStorage.getItem(SOLVED_CASES_KEY);
    return solvedCases ? JSON.parse(solvedCases) : [];
  } catch (error) {
    console.error("Çözülmüş vakalar okunurken hata:", error);
    return [];
  }
};

/**
 * Yeni bir vaka ID'sini çözülmüş olarak localStorage'a ekler.
 * @param {string} caseId - Çözüldü olarak işaretlenecek vaka ID'si.
 */
export const addSolvedCase = (caseId) => {
  try {
    const solvedCases = getSolvedCases();
    if (!solvedCases.includes(caseId)) {
      const updatedSolvedCases = [...solvedCases, caseId];
      localStorage.setItem(SOLVED_CASES_KEY, JSON.stringify(updatedSolvedCases));
    }
  } catch (error) {
    console.error("Vaka çözüldü olarak işaretlenirken hata:", error);
  }
};

/**
 * Bir vaka ID'sini çözülmüş listesinden kaldırır.
 * @param {string} caseId - Çözülmedi olarak işaretlenecek vaka ID'si.
 */
export const removeSolvedCase = (caseId) => {
  try {
    let solvedCases = getSolvedCases();
    if (solvedCases.includes(caseId)) {
      const updatedSolvedCases = solvedCases.filter(id => id !== caseId);
      localStorage.setItem(SOLVED_CASES_KEY, JSON.stringify(updatedSolvedCases));
    }
  } catch (error) {
    console.error("Vaka çözülmedi olarak işaretlenirken hata:", error);
  }
};