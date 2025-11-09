// Global configuration for Comment Fast extension

/**
 * Debug mode configuration
 * Set to true to enable detailed console logging for development
 * Set to false for production builds (default)
 * 
 * When DEBUG is false:
 * - Most console.log and console.warn statements are suppressed
 * - console.error statements are always shown (for error tracking)
 * - Global error handler is disabled
 * 
 * To enable debug mode during development:
 * 1. Change DEBUG to true
 * 2. Run: pnpm run dev
 * 3. Reload the extension
 */
export const DEBUG = false

/**
 * Extension version
 * This should match the version in package.json
 */
export const VERSION = "1.0.0"

