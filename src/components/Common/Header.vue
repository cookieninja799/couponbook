<template>
  <header class="app-header">
    <div class="header-container">
      <div class="branding">
        <router-link to="/">
          <img src="@/assets/logo.png" alt="VivaSpot Logo" class="logo" />
        </router-link>
      </div>
      <nav class="navigation">
        <ul>
          <li><router-link to="/">Home</router-link></li>
          <li><router-link to="/coupon-book">Browse Local Coupons</router-link></li>
          <li><router-link to="/foodie-groups">Foodie Groups</router-link></li>
          <li><router-link to="/event-page">Events</router-link></li>
        </ul>
      </nav>
    </div>
  </header>
</template>

<script>
export default {
  name: "AppHeader"
}
</script>

<style scoped>
.app-header {
  background-color: #fff;
  border-bottom: 1px solid #ddd;
  padding: 1rem 0;
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
.navigation a {
  text-decoration: none;
  color: #007bff;
}
.navigation a:hover {
  text-decoration: underline;
}
</style>
