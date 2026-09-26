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
export const VERSION = "1.0.14"

/**
 * Link Manager backend used by the backlinks checker.
 *
 * Keep the production default stable so published extension builds continue to
 * work while the backend is migrated. Developers can override this from
 * Settings without rebuilding the extension.
 */
export const DEFAULT_LINK_MANAGER_API_BASE =
  "https://tanstack-link-manager.leobing2023.workers.dev"

export const LINK_MANAGER_REQUEST_TIMEOUT_MS = 15000

// Shared with tanstack-link-manager (src/modules/domains/utils.ts). Change both sides together.
export const LINK_MANAGER_COMMENT_FAST_KEY =
  "a4e786554de86d86b7753b419a4209b3b139ee8271ac9d42"

/** Must not exceed the server's DOMAIN_AGES_MAX_PER_REQUEST. */
export const DOMAIN_AGES_BATCH_SIZE = 20
