/**
 * Super Admin utilities
 * Handles access control for creator/super admin functionality
 */

import type { User } from "@/lib/api/authTypes";

// Super admin email - REPLACE THIS WITH YOUR ACTUAL EMAIL ADDRESS
const SUPER_ADMIN_EMAIL = "tessierhuort@gmail.com"; // ⚠️ UPDATE THIS!

/**
 * Check if the current user is the super admin (creator)
 * Only the creator with the specified email can access the admin dashboard
 */
export function isSuperAdmin(user: User | null): boolean {
  if (!user) return false;

  // Check if user email matches super admin email
  return user.email === SUPER_ADMIN_EMAIL;
}
