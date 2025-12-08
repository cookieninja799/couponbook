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
  border: 1px solid #007bff;
  color: #007bff;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}
.auth-btn:hover {
  background: #007bff;
  color: white;
}

.app-header {
  background-color: #fff;
  border-bottom: 1px solid #ddd;
  padding: 1rem 0;
  position: relative;
  z-index: 1000;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 100%;
  margin: 0 auto;
  padding: 0 1rem;
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
  gap: 1.7rem;
  margin: 0;
  padding: 0;
}

.navigation li {
  font-size: 1rem;
}

/* Menu link styles */
.navigation a {
  text-decoration: none;
  color: #38424c;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.navigation a:hover {
  background-color: #dd6146;
  color: #fff;
  text-decoration: none;
}

/* Hamburger Button Styles */
.hamburger {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 25px;
  height: 25px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}

.hamburger:focus {
  outline: none;
}

.hamburger-line {
  width: 25px;
  height: 3px;
  background-color: #38424c;
  border-radius: 2px;
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
    background-color: #fff;
    width: 220px;
    display: none;             /* hide from layout */
    opacity: 0;                /* invisible */
    pointer-events: none;      /* not clickable when closed */
    transform: translateX(100%);
    transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
    box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
    z-index: 1000;
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
    gap: 1rem;
    padding: 1rem;
  }
}
</style>
