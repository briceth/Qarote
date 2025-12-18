/**
 * RegExp.escape() polyfill and type-safe wrapper
 *
 * RegExp.escape() is a new JavaScript feature (Node.js 24+) that may not be
 * available in all browsers yet. This module provides a polyfill and type-safe
 * wrapper to ensure compatibility.
 */

// Type-safe interface for RegExp with escape method
// We use a type assertion instead of extending RegExpConstructor to avoid conflicts
interface RegExpWithEscape {
  escape(str: string): string;
}

const RegExpWithEscape = RegExp as unknown as RegExpWithEscape;

// Polyfill for RegExp.escape() if not available (for browser compatibility)
if (typeof RegExpWithEscape.escape === "undefined") {
  RegExpWithEscape.escape = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };
}

/**
 * Escapes special regex characters in a string for safe use in regular expressions.
 * Uses native RegExp.escape() if available, otherwise falls back to polyfill.
 *
 * @param str The string to escape
 * @returns The escaped string safe for use in regex patterns
 */
export function escapeRegex(str: string): string {
  return RegExpWithEscape.escape!(str);
}

// Export the type-safe RegExp constructor for direct use if needed
export { RegExpWithEscape };
