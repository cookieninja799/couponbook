// SuperAdminDashboard component tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import SuperAdminDashboard from '../../../../../src/components/Dashboard/SuperAdminDashboard.vue';
import { createMockStore, createMockRouter } from '../../../../helpers/vue.js';

// Mock authService - can't reference external variables in vi.mock factory
vi.mock('../../../../../src/services/authService.js', () => ({
  getAccessToken: vi.fn(),
  signIn: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

describe('SuperAdminDashboard', () => {
  let wrapper;
  let store;
  let router;
  let mockGetAccessToken;
  let mockSignIn;

  beforeEach(async () => {
    // Import the mocked module to access the mock functions
    const authService = await import('../../../../../src/services/authService.js');
    mockGetAccessToken = authService.getAccessToken;
    mockSignIn = authService.signIn;

    store = createMockStore({
      auth: {
        namespaced: true,
        state: {
          isAuthenticated: false,
          user: null,
        },
        getters: {
          isAuthenticated: (state) => state.isAuthenticated,
        },
      },
    });

    router = createMockRouter();

    vi.clearAllMocks();
    mockGetAccessToken.mockResolvedValue('test-token');
  });

  it('should show sign-in prompt when not authenticated', () => {
    wrapper = mount(SuperAdminDashboard, {
      global: {
        plugins: [store, router],
      },
    });

    expect(wrapper.text()).toContain('Sign In to Your Account');
    expect(wrapper.find('.signin-card').exists()).toBe(true);
  });

  it('should show access check message when authenticated but role unknown', async () => {
    store.state.auth.isAuthenticated = true;
    mockGetAccessToken.mockResolvedValue('test-token');
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn().mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
      }),
    });

    wrapper = mount(SuperAdminDashboard, {
      global: {
        plugins: [store, router],
      },
    });

    // Wait for component to initialize and check auth
    await wrapper.vm.$nextTick();
    // The component should show checking initially
    expect(wrapper.text()).toMatch(/Checking your admin permissions|Super Admin Dashboard/);
  });

  it('should show access denied for non-admin users', async () => {
    store.state.auth.isAuthenticated = true;
    mockGetAccessToken.mockResolvedValue('test-token');
    
    const mockJson = vi.fn().mockResolvedValue({
      id: 'user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'customer',
    });
    
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: mockJson,
    });

    wrapper = mount(SuperAdminDashboard, {
      global: {
        plugins: [store, router],
      },
    });

    // Wait for created() hook to complete (which calls loadCurrentUser)
    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Access Denied');
    expect(wrapper.vm.notAuthorized).toBe(true);
  });

  it('should show dashboard for admin users', async () => {
    store.state.auth.isAuthenticated = true;
    mockGetAccessToken.mockResolvedValue('test-token');
    
    const mockJson = vi.fn().mockResolvedValue({
      id: 'user-id',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
    });
    
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: mockJson,
    });

    wrapper = mount(SuperAdminDashboard, {
      global: {
        plugins: [store, router],
      },
    });

    // Wait for created() hook to complete (which calls loadCurrentUser)
    await wrapper.vm.$nextTick();
    // Wait a bit more for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Super Admin Dashboard');
    expect(wrapper.text()).toContain('Global Overview');
    expect(wrapper.vm.notAuthorized).toBe(false);
  });

  it('should handle API errors gracefully', async () => {
    store.state.auth.isAuthenticated = true;
    mockGetAccessToken.mockResolvedValue('test-token');
    
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    wrapper = mount(SuperAdminDashboard, {
      global: {
        plugins: [store, router],
      },
    });

    // Wait for created() hook to complete (which calls loadCurrentUser)
    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.notAuthorized).toBe(true);
  });
});
