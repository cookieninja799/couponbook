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
  /* make sure nothing inside forces horizontal scroll */
  max-width: 100%;
  overflow-x: hidden;
}

.footer-nav ul {
  list-style: none;
  display: flex;          /* was inline-flex */
  flex-wrap: wrap;        /* allow wrapping to new lines */
  justify-content: center;
  gap: 0.75rem;
  margin: 0.5rem 0 0;
  padding: 0;
}

.footer-nav li {
  /* let text wrap naturally within each link */
  max-width: 100%;
}

.footer-nav a {
  color: #007bff;
  text-decoration: none;
}

.footer-nav a:hover {
  text-decoration: underline;
}

/* Optional: on very small screens, stack links vertically */
@media (max-width: 480px) {
  .footer-nav ul {
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }
}
</style>
