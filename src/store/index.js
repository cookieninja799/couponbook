// src/store/index.js
import { createStore } from 'vuex';
// Import BOTH userManager and the manual signOut function
import { userManager, signOut } from '@/services/authService';

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
        clearUser(state)       { state.user = null }
      },
      actions: {
        async login() {
          await userManager.signinRedirect();
        },
        async handleCallback({ commit }) {
          const user = await userManager.signinRedirectCallback();
          commit('setUser', user);
        },
        async logout({ commit }) {
          // Clear user state FIRST
          commit('clearUser');
          // Now call the manual signOut function which redirects
          signOut(); // <--- CHANGE THIS LINE
          // Original line was: await userManager.signoutRedirect();
        }
      }
    }
  }
});