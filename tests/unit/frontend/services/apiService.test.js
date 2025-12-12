// API service unit tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

// Mock axios BEFORE importing apiService
const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
};

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
  },
}));

describe('API Service', () => {
  let api;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Import after mock is set up
    const apiModule = await import('../../../../src/services/apiService.js');
    api = apiModule.default;
  });

  it('should create axios instance with correct baseURL', async () => {
    // Re-import to get the mocked axios
    const axiosModule = await import('axios');
    const axiosMock = axiosModule.default;
    
    expect(axiosMock.create).toHaveBeenCalledWith({
      baseURL: '/api/v1',
    });
  });

  it('should export axios instance', () => {
    expect(api).toBeDefined();
    expect(typeof api.get).toBe('function');
    expect(typeof api.post).toBe('function');
    expect(typeof api.put).toBe('function');
    expect(typeof api.delete).toBe('function');
  });

  it('should have interceptors configured', () => {
    expect(api.interceptors).toBeDefined();
    expect(api.interceptors.request).toBeDefined();
    expect(api.interceptors.response).toBeDefined();
  });
});
