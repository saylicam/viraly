/**
 * Mock de Firestore pour le mode développement (Expo Dev)
 * Toutes les fonctions retournent des valeurs null/empty pour éviter les appels réseau
 * Utilisé uniquement quand __DEV__ === true
 * 
 * Utilise CommonJS (module.exports) pour compatibilité avec require()
 */

/**
 * Mock de getDoc - retourne un document vide qui n'existe pas
 * En mode dev, tous les documents sont considérés comme inexistants
 */
const getDoc = async () => {
  // Retourner un DocumentSnapshot mock qui n'existe pas
  return {
    exists: () => false, // Méthode qui retourne false
    data: () => undefined, // Méthode qui retourne undefined (pas null pour correspondre à Firestore)
    id: 'mock-doc-id',
    ref: null,
    metadata: {
      hasPendingWrites: false,
      isFromCache: false,
    },
  };
};

/**
 * Mock de setDoc - ne fait rien
 */
const setDoc = async () => {
  return null;
};

/**
 * Mock de updateDoc - ne fait rien
 */
const updateDoc = async () => {
  return null;
};

/**
 * Mock de addDoc - retourne un ID fictif
 */
const addDoc = async () => {
  return { id: 'mock-doc-id' };
};

/**
 * Mock de deleteDoc - ne fait rien
 */
const deleteDoc = async () => {
  return null;
};

/**
 * Mock de onSnapshot - retourne une fonction de désabonnement vide
 */
const onSnapshot = () => {
  return () => null; // Fonction de désabonnement
};

/**
 * Mock de doc - retourne un objet mock de référence de document
 */
const doc = (db, collectionPath, documentPath) => {
  return {
    id: documentPath || 'mock-doc-id',
    path: `${collectionPath}/${documentPath || 'mock-doc-id'}`,
    parent: null,
  };
};

/**
 * Mock de collection - retourne un objet mock de collection
 */
const collection = (db, collectionPath) => {
  return {
    id: collectionPath,
    path: collectionPath,
    parent: null,
  };
};

/**
 * Mock de serverTimestamp - retourne un objet mock
 */
const serverTimestamp = () => {
  return {
    _methodName: 'serverTimestamp',
    _toFieldValue: () => new Date(),
  };
};

/**
 * Mock de query - retourne un objet mock de requête
 */
const query = (...args) => {
  return {
    _query: args,
  };
};

/**
 * Mock de where - retourne un objet mock de filtre
 */
const where = (field, operator, value) => {
  return {
    _field: field,
    _operator: operator,
    _value: value,
  };
};

/**
 * Mock de orderBy - retourne un objet mock de tri
 */
const orderBy = (field, direction = 'asc') => {
  return {
    _field: field,
    _direction: direction,
  };
};

/**
 * Mock de limit - retourne un objet mock de limite
 */
const limit = (count) => {
  return {
    _count: count,
  };
};

// Exporter en CommonJS pour compatibilité avec require()
module.exports = {
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  doc,
  collection,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
};

