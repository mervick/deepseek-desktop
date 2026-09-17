/**
 * Utility modules for the DeepSeek Desktop application.
 */

export { getPlatform, isMacOS, isWindows, isLinux, usesCustomWindowControls } from './platform';
export type { Platform } from './platform';
export { createRendererLogger, type Logger } from './logger';
