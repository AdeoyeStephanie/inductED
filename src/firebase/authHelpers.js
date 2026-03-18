/**
 * Firebase Auth helpers: sign up, sign in, sign out, and get current user.
 * Also creates/updates the user document in Firestore when they sign up.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from './config';

/** Firestore collection where we store user profiles (name, status, totalPoints) */
const USERS_COLLECTION = 'users';

/**
 * Helper: check if an email exists in a given Firestore collection.
 * Used to verify inducted and e-board signups against your master lists.
 * @param {string} collectionName
 * @param {string} email
 * @returns {Promise<boolean>}
 */
async function emailExistsInCollection(collectionName, email) {
  const colRef = collection(db, collectionName);
  const q = query(colRef, where('email', '==', email.trim().toLowerCase()));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

/**
 * Helper: verify that a (name, email) pair belongs to a current e-board member.
 * We query by email and then compare the name in code to allow case differences.
 * @param {string} collectionName
 * @param {string} name
 * @param {string} email
 * @returns {Promise<boolean>}
 */
async function eboardMemberMatches(collectionName, name, email) {
  const colRef = collection(db, collectionName);
  const q = query(colRef, where('email', '==', email.trim().toLowerCase()));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return false;
  const normalizedInputName = name.trim().toLowerCase();
  return snapshot.docs.some((d) => {
    const data = d.data();
    return (data.name || '').trim().toLowerCase() === normalizedInputName;
  });
}

/** 
 * Sign up a new user with email/password and create their Firestore profile.
 * @param {string} email
 * @param {string} password
 * @param {string} name - Display name for the user
 * @param {'prospective' | 'inducted' | 'officer'} desiredStatus
 * @param {{ year?: string, role?: string } | null} officerInfo
 * @returns {Promise} - Resolves with user credential, rejects with error
 */
export async function signUp(email, password, name, desiredStatus = 'prospective', officerInfo = null) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const { uid } = userCredential.user;

  // Decide initial status, with optional verification against your master lists.
  // Collections you will maintain:
  // - "inductedMembers"  : inducted alumni/member directory
  // - "eboardMembers"    : current e-board directory for the year
  let status = 'prospective';
  let needsVerification = false;

  if (desiredStatus === 'inducted') {
    const ok = await emailExistsInCollection('inductedMembers', email);
    if (ok) {
      status = 'inducted';
    } else {
      status = 'prospective';
      needsVerification = true;
    }
  } else if (desiredStatus === 'officer') {
    const ok = await eboardMemberMatches('eboardMembers', name, email);
    if (ok) {
      status = 'officer';
    } else {
      status = 'prospective';
      needsVerification = true;
    }
  }

  // Create user document in Firestore with computed status and points
  const profileData = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    status,
    totalPoints: 0,
    requestedStatus: desiredStatus,
    needsVerification,
  };

  if (officerInfo) {
    profileData.officerYear = officerInfo.year;
    profileData.officerRole = officerInfo.role;
  }

  await setDoc(doc(db, USERS_COLLECTION, uid), profileData);

  return userCredential;
}

/**
 * Sign in an existing user with email/password.
 */
export async function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  return firebaseSignOut(auth);
}

/**
 * Subscribe to auth state changes (e.g. when user logs in or out).
 * @param {function} callback - Called with the current Firebase User or null
 * @returns {function} - Unsubscribe function
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get the current user's profile from Firestore (name, status, totalPoints).
 * Call this after you know the user is logged in (auth.currentUser exists).
 * @param {string} uid - Firebase Auth UID
 * @returns {Promise<object|null>} - User profile or null if not found
 */
export async function getUserProfile(uid) {
  const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
  return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
}
