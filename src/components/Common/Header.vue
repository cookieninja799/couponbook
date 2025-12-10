<template>
  <header class="app-header">
    <div class="header-container">
      <div class="branding">
        <router-link to="/">
          <img src="@/assets/logo.png" alt="VivaSpot Logo" class="logo" />
        </router-link>
      </div>
      <button class="hamburger" @click="toggleMenu">
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>
      <nav class="navigation" :class="{ open: isMenuOpen }">
        <ul>
          <li><router-link to="/">Home</router-link></li>
          <li><router-link to="/coupon-book">Local Coupons</router-link></li>
          <li><router-link to="/foodie-groups">Foodie Groups</router-link></li>
          <li><router-link to="/event-page">Events</router-link></li>
          <li v-if="!isAuthenticated">
            <button @click="login" class="auth-btn">Sign In</button>
          </li>
          <li v-else>
            <button @click="logout" class="auth-btn">Log Out</button>
          </li>
        </ul>
      </nav>
    </div>
  </header>
</template>
<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'AppHeader',
  data() {
    return {
      isMenuOpen: false
    };
  },
  computed: {
    // pulls auth/isAuthenticated getter into this.isAuthenticated
    ...mapGetters('auth', ['isAuthenticated'])
  },
  methods: {
    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen;
    },
    // exposes this.login() and this.logout()
    ...mapActions('auth', ['login', 'logout'])
  }
};
</script>

<style scoped>
.auth-btn {
  background: none;
  border: 1px solid var(--color-secondary);
  color: var(--color-secondary);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  min-height: var(--button-height-md);
}

.auth-btn:hover {
  background: var(--color-secondary);
  color: var(--color-text-inverse);
}

.app-header {
  background-color: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border-light);
  padding: var(--spacing-lg) 0;
  position: relative;
  z-index: var(--z-index-fixed);
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: var(--container-xl);
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
  width: 100%;
}

.header-container > * {
  flex-shrink: 0;
}

.navigation {
  display: flex;
  align-items: center;
}

@media (min-width: 1024px) {
  .header-container {
    padding: 0 var(--spacing-2xl);
  }
  
  .navigation ul {
    gap: var(--spacing-xl);
  }
}

.branding {
  display: flex;
  align-items: center;
}

.logo {
  height: 8vh;
  width: auto;
  max-width: 100%;
}

.navigation ul {
  list-style: none;
  display: flex;
  gap: var(--spacing-lg);
  margin: 0;
  padding: 0;
  align-items: center;
}

.navigation li {
  font-size: var(--font-size-base);
  display: flex;
  align-items: center;
}

/* Menu link styles */
.navigation a {
  text-decoration: none;
  color: var(--color-slate);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  transition: background-color var(--transition-slow), color var(--transition-slow);
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
}

.navigation a:hover {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
  text-decoration: none;
}

/* Hamburger Button Styles */
.hamburger {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: var(--spacing-2xl);
  height: var(--spacing-2xl);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  min-height: var(--button-height-md);
  min-width: var(--button-height-md);
}

.hamburger:focus {
  outline: 2px solid var(--color-secondary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

.hamburger-line {
  width: var(--spacing-2xl);
  height: 3px;
  background-color: var(--color-slate);
  border-radius: var(--radius-sm);
  transition: all var(--transition-base);
}

/* Responsive Styles for Mobile */
@media (max-width: 768px) {
  /* show burger, hide desktop layout */
  .hamburger {
    display: flex;
  }

  /* base closed state: completely hidden off-canvas */
  .navigation {
    position: absolute;
    top: 70px;
    right: 0;
    background-color: var(--color-bg-primary);
    width: 220px;
    display: none;             /* hide from layout */
    opacity: 0;                /* invisible */
    pointer-events: none;      /* not clickable when closed */
    transform: translateX(100%);
    transition: transform var(--transition-slow), opacity var(--transition-slow);
    box-shadow: var(--shadow-lg);
    z-index: var(--z-index-dropdown);
    flex-direction: column;
  }

  /* open state: slide in + visible + interactive */
  .navigation.open {
    display: block;
    opacity: 1;
    pointer-events: auto;
    transform: translateX(0);
  }

  .navigation ul {
    flex-direction: column;
    gap: var(--spacing-lg);
    padding: var(--spacing-lg);
  }
}
</style>
