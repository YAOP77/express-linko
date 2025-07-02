import photoDefault from '../assets/images/default-avatar-icon-of-social-media-user-vector.jpg';
const API_URL = process.env.REACT_APP_API_URL;

/**
 * Génère l'URL complète pour un avatar utilisateur
 * @param {string} avatar - Le nom du fichier avatar (peut être null/undefined)
 * @returns {string} L'URL complète de l'avatar ou l'image par défaut
 */
export const getAvatarUrl = (avatar) => {
  if (!avatar) {
    return photoDefault;
  }
  // Si c'est déjà une URL complète, la retourner
  if (avatar.startsWith('http')) {
    return avatar;
  }
  // Corrige l'URL pour enlever /api si présent
  return `${API_URL.replace(/\/api$/, '')}/uploads/${avatar}`;
};

/**
 * Gère l'erreur de chargement d'une image avatar
 * @param {Event} e - L'événement d'erreur
 */
export const handleAvatarError = (e) => {
  e.target.onerror = null;
  e.target.src = photoDefault;
}; 