// Global test setup
import { vi } from 'vitest';

// Mock window.location
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'location', {
    value: {
      origin: 'http://localhost:8080',
      pathname: '/',
      search: '',
      hash: '',
      href: 'http://localhost:8080/',
    },
    writable: true,
  });

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  global.localStorage = localStorageMock;
}

// Mock fetch if needed
global.fetch = global.fetch || vi.fn();

