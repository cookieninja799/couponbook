// src/store/index.js
import { createStore } from 'vuex';
import { userManager, signOut, signIn } from '@/services/authService';

export default createStore({
  modules: {
    auth: {
      namespaced: true,
      state: () => ({
        user: null
      }),
      getters: {
        isAuthenticated: state => !!state.user?.access_token,
        profile:         state => state.user?.profile
      },
      mutations: {
        setUser(state, user) { state.user = user },
        clearUser(state)     { state.user = null }
      },
      actions: {
        async initialize({ commit }) {
          try {
            const user = await userManager.getUser();
            if (user && !user.expired) {
              commit('setUser', user);
            } else {
              commit('clearUser');
            }
          } catch (e) {
            console.error('Auth initialize failed', e);
            commit('clearUser');
          }
        },

        async login() {
          await signIn();
        },

        async handleCallback({ commit }) {
          const user = await userManager.signinRedirectCallback();
          commit('setUser', user);
        },

        async logout({ commit }) {
          commit('clearUser');
          signOut();
        }
      }
    }
  }
});
