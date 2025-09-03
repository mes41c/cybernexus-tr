// frontend/src/services/notepadManager.js

/**
 * Belirli bir vaka ve kullanıcı için notları localStorage'dan alır.
 * @param {string} caseId - Vaka ID'si.
 * @param {string} anonymousUserId - Kullanıcının anonim kimliği.
 * @returns {string} Kaydedilmiş not metni.
 */
export const getNotepadContent = (caseId, anonymousUserId) => {
  if (!caseId || !anonymousUserId) return '';
  const key = `notepad_${caseId}_${anonymousUserId}`;
  return localStorage.getItem(key) || '';
};

/**
 * Belirli bir vaka ve kullanıcı için notları localStorage'a kaydeder.
 * @param {string} caseId - Vaka ID'si.
 * @param {string} anonymousUserId - Kullanıcının anonim kimliği.
 * @param {string} content - Kaydedilecek not metni.
 */
export const saveNotepadContent = (caseId, anonymousUserId, content) => {
  if (!caseId || !anonymousUserId) return;
  const key = `notepad_${caseId}_${anonymousUserId}`;
  localStorage.setItem(key, content);
};

/**
 * Mevcut not defteri içeriğinin sonuna yeni metin ekler.
 * @param {string} caseId - Vaka ID'si.
 * @param {string} anonymousUserId - Kullanıcının anonim kimliği.
 * @param {string} contentToAdd - Eklenecek metin.
 */
export const appendToNotepad = (caseId, anonymousUserId, contentToAdd) => {
  if (!caseId || !anonymousUserId) return;
  
  const currentContent = getNotepadContent(caseId, anonymousUserId);
  const newContent = currentContent.trim() 
    ? `${currentContent.trim()}\n\n---\n\n${contentToAdd.trim()}` 
    : contentToAdd.trim();
  
  saveNotepadContent(caseId, anonymousUserId, newContent);
};