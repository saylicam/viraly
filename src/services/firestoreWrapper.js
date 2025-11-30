/**
 * Wrapper pour Firestore qui utilise le mock en mode dev
 * Permet de remplacer tous les imports firebase/firestore par ce wrapper
 * 
 * IMPORTANT: En mode __DEV__, tous les appels Firestore sont mockés et ne font rien
 * Aucun appel réseau n'est effectué en mode développement
 */

// Import conditionnel basé sur __DEV__
// En mode dev, utiliser le mock, sinon utiliser le vrai Firestore
let firestoreExports;

if (__DEV__) {
  // Mode développement : importer depuis le mock
  firestoreExports = require('./firestoreMock');
} else {
  // Mode production : importer depuis firebase/firestore
  firestoreExports = require('firebase/firestore');
}

// Réexporter toutes les fonctions
export const getDoc = firestoreExports.getDoc;
export const setDoc = firestoreExports.setDoc;
export const updateDoc = firestoreExports.updateDoc;
export const addDoc = firestoreExports.addDoc;
export const deleteDoc = firestoreExports.deleteDoc;
export const onSnapshot = firestoreExports.onSnapshot;
export const doc = firestoreExports.doc;
export const collection = firestoreExports.collection;
export const serverTimestamp = firestoreExports.serverTimestamp;
export const query = firestoreExports.query;
export const where = firestoreExports.where;
export const orderBy = firestoreExports.orderBy;
export const limit = firestoreExports.limit;

