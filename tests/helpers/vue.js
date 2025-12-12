// Vue test utilities
import { createRouter, createWebHistory } from 'vue-router';
import { createStore } from 'vuex';
import { config } from '@vue/test-utils';

/**
 * Create a mock Vue Router instance
 */
export function createMockRouter(routes = []) {
  return createRouter({
    history: createWebHistory(),
    routes: routes.length > 0 ? routes : [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/profile', component: { template: '<div>Profile</div>' } },
    ],
  });
}

/**
 * Create a mock Vuex store
 */
export function createMockStore(modules = {}) {
  const defaultModules = {
    auth: {
      namespaced: true,
      state: {
        isAuthenticated: false,
        user: null,
      },
      getters: {
        isAuthenticated: (state) => state.isAuthenticated,
        user: (state) => state.user,
      },
      mutations: {
        SET_AUTHENTICATED(state, value) {
          state.isAuthenticated = value;
        },
        SET_USER(state, user) {
          state.user = user;
        },
      },
      actions: {
        login: vi.fn(() => Promise.resolve()),
        logout: vi.fn(() => Promise.resolve()),
      },
    },
    ...modules,
  };

  const store = createStore({
    modules: defaultModules,
  });

  // Add _actions for easier testing
  store._actions = {};
  Object.keys(defaultModules).forEach((moduleName) => {
    const module = defaultModules[moduleName];
    if (module.actions) {
      Object.keys(module.actions).forEach((actionName) => {
        const key = `${moduleName}/${actionName}`;
        store._actions[key] = [module.actions[actionName]];
      });
    }
  });

  return store;
}

/**
 * Global Vue test utils configuration
 */
export function setupVueTestUtils() {
  config.global.mocks = {
    $router: createMockRouter(),
    $route: {
      path: '/',
      params: {},
      query: {},
    },
  };
}

// Import vi for mocks
import { vi } from 'vitest';

