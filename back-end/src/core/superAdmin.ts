/**
 * Super Admin utilities for backend
 * Handles creator/super admin access control
 */

import type { SafeUser } from "../core/auth";

// Super admin email - REPLACE THIS WITH YOUR ACTUAL EMAIL ADDRESS
const SUPER_ADMIN_EMAIL = "tessierhuort@gmail.com"; // ⚠️ UPDATE THIS!

/**
 * Check if the current user is the super admin (creator)
 * Only the creator with the specified email can access super admin features
 */
export function isSuperAdmin(user: SafeUser | null): boolean {
  if (!user) return false;

  // Check if user email matches super admin email
  return user.email === SUPER_ADMIN_EMAIL;
}

/**
 * Middleware to check super admin access
 * Returns 403 if user is not super admin
 */
export function requireSuperAdmin(user: SafeUser | null) {
  if (!isSuperAdmin(user)) {
    throw new Error("Super admin access required");
  }
}
