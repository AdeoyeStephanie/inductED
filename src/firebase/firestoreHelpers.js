/**
 * Firestore helpers for point claims (submissions) and user data.
 * Point claims are submitted by prospective members and approved/rejected by officers.
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';

const USERS_COLLECTION = 'users';
const CLAIMS_COLLECTION = 'pointClaims';

/**
 * Upload a JPG proof image for a point claim and return its download URL.
 * @param {File} file
 * @param {string} userId
 * @returns {Promise<string>}
 */
export async function uploadClaimImage(file, userId) {
  const safeName = file.name.replace(/\s+/g, '_');
  const fileRef = ref(storage, `pointProofs/${userId}/${Date.now()}_${safeName}`);
  const snapshot = await uploadBytes(fileRef, file);
  return getDownloadURL(snapshot.ref);
}

/**
 * Submit a new point claim (prospective members only).
 * @param {string} userId - Firebase Auth UID
 * @param {number} points - Number of points claimed
 * @param {string} description - Extra information about the activity
 * @param {string} category - Category label for the claim
 * @param {string|null} proofImageUrl - Optional URL to supporting image
 * @returns {Promise<string>} - The new claim document ID
 */
export async function submitPointClaim(userId, points, description, category, proofImageUrl = null) {
  const claimsRef = collection(db, CLAIMS_COLLECTION);
  const docRef = await addDoc(claimsRef, {
    userId,
    points: Number(points),
    description: (description || '').trim(),
    category: (category || '').trim(),
    proofImageUrl: proofImageUrl || null,
    status: 'pending', // pending | approved | rejected
    createdAt: serverTimestamp(),
    reviewedAt: null,
    reviewedBy: null,
  });
  return docRef.id;
}

/**
 * Get all point claims for a specific user (for dashboard history and notifications).
 * Uses only userId so it works without a composite index; sorts by createdAt in memory.
 * Ensures all past and present claims from Firebase are returned.
 * @param {string} userId
 * @returns {Promise<Array>} - Array of claim objects with id, newest first
 */
export async function getUserClaims(userId) {
  const claimsRef = collection(db, CLAIMS_COLLECTION);
  const q = query(claimsRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map((d) => {
    const data = d.data();
    const createdAt = data.createdAt?.toDate?.() ?? data.createdAt ?? null;
    return { id: d.id, ...data, createdAt };
  });
  list.sort((a, b) => {
    const ta = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt ?? 0);
    const tb = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt ?? 0);
    return tb - ta;
  });
  return list;
}

/**
 * Get all pending point claims (for officer approval dashboard).
 * @returns {Promise<Array>} - Array of pending claims with id
 */
export async function getPendingClaims() {
  const claimsRef = collection(db, CLAIMS_COLLECTION);
  const q = query(
    claimsRef,
    where('status', '==', 'pending'),
    orderBy('createdAt', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.() }));
}

/**
 * Get all point claims for officers, regardless of status.
 * Returns newest first so the most recent activity is at the top.
 */
export async function getAllClaimsForOfficer() {
  const claimsRef = collection(db, CLAIMS_COLLECTION);
  const q = query(claimsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.(),
  }));
}

/**
 * Approve a point claim: update status and add points to user's total.
 * @param {string} claimId - Document ID of the claim
 * @param {string} officerId - UID of the officer approving
 * @param {object} claim - The claim object (must have userId and points)
 * @param {string} officerName - Display name of the officer approving
 */
export async function approveClaim(claimId, officerId, claim, officerName) {
  const claimRef = doc(db, CLAIMS_COLLECTION, claimId);
  const userRef = doc(db, USERS_COLLECTION, claim.userId);

  // Update claim status
  await updateDoc(claimRef, {
    status: 'approved',
    reviewedAt: serverTimestamp(),
    reviewedBy: officerId,
    reviewedByName: officerName || null,
  });

  // Add points to user's total
  const userSnap = await getDoc(userRef);
  const currentTotal = userSnap.exists() ? (userSnap.data().totalPoints || 0) : 0;
  await updateDoc(userRef, {
    totalPoints: currentTotal + (claim.points || 0),
  });
}

/**
 * Reject a point claim (only updates status, no points added).
 */
export async function rejectClaim(claimId, officerId) {
  const claimRef = doc(db, CLAIMS_COLLECTION, claimId);
  await updateDoc(claimRef, {
    status: 'rejected',
    reviewedAt: serverTimestamp(),
    reviewedBy: officerId,
  });
}

/**
 * Mark a claim as "in review" (kanban stage) without approving or rejecting it yet.
 */
export async function markClaimInReview(claimId) {
  const claimRef = doc(db, CLAIMS_COLLECTION, claimId);
  await updateDoc(claimRef, {
    status: 'in_review',
  });
}

/**
 * Get a user's profile by ID (e.g. to show submitter name on officer dashboard).
 */
export async function getUserById(userId) {
  const userSnap = await getDoc(doc(db, USERS_COLLECTION, userId));
  return userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null;
}
