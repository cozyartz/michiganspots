/**
 * Test setup file for vitest
 */

// Mock Devvit kit for testing
vi.mock('@devvit/kit', () => ({
  Devvit: {
    configure: vi.fn(),
    addSettings: vi.fn(),
    addCustomPostType: vi.fn(),
  },
}));

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: console.warn,
  error: console.error,
};