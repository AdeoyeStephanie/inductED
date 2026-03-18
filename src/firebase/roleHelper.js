/**
 * Role-based access: fetches user profile and checks status for route protection.
 * Status can be: "prospective" | "inducted" | "officer"
 */

import { getUserProfile } from './authHelpers';

/**
 * Get the current user's profile including their status (role).
 * Use this to decide what UI to show and whether to allow access to a route.
 * @param {string} uid - Firebase Auth UID
 * @returns {Promise<object|null>} - { name, email, status, totalPoints, id } or null
 */
export async function getUserRole(uid) {
  return getUserProfile(uid);
}

/**
 * Check if the user is an officer (can access /officer and approve/reject claims).
 */
export function isOfficer(profile) {
  return profile && profile.status === 'officer';
}

/**
 * Check if the user is a prospective member (can submit point claims).
 */
export function isProspective(profile) {
  return profile && profile.status === 'prospective';
}

/**
 * Check if the user is inducted (read-only view, no submit).
 */
export function isInducted(profile) {
  return profile && profile.status === 'inducted';
}
