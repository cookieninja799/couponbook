<template>
  <footer class="app-footer">
    <div class="footer-container">
      <p>&copy; 2025 VivaSpot Coupon Book. All rights reserved.</p>
      <nav class="footer-nav">
        <ul>
          <li><router-link to="/terms">Terms of Service</router-link></li>
          <li><router-link to="/privacy">Privacy Policy</router-link></li>
          <!-- Add more links as needed -->
          <li><router-link to="/dashboard/foodie-group">Foodie Group Dashboard</router-link></li>
          <li><router-link to="/dashboard/super-admin">Super Admin Dashboard</router-link></li>
          <li><router-link to="/profile">Profile</router-link></li>
          <li><router-link to="/submissions">Submissions</router-link></li>
        </ul>
      </nav>
    </div>
  </footer>
</template>

<script>
export default {
  name: "AppFooter"
}
</script>

<style scoped>
.app-footer {
  background-color: #f8f8f8;
  border-top: 1px solid #ddd;
  padding: 1rem 0;
  text-align: center;
}
.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}
.footer-nav ul {
  list-style: none;
  display: inline-flex;
  gap: 1rem;
  margin: 0;
  padding: 0;
}
.footer-nav a {
  color: #007bff;
  text-decoration: none;
}
.footer-nav a:hover {
  text-decoration: underline;
}
</style>
