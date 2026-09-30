/**
 * Point d'entrée unique pour Firestore.
 *
 * Avant : en mode __DEV__, ce fichier remplaçait Firestore par un faux (firestoreMock.js)
 * parce que la base Firestore n'existait pas encore dans le projet Firebase.
 * La base existe maintenant (europe-west1) : on utilise toujours le vrai Firestore,
 * en dev comme en production, pour tester le vrai comportement.
 */
export {
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
  getDocs,
} from 'firebase/firestore';
