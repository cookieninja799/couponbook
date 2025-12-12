<template>
  <footer class="app-footer">
    <div class="footer-container">
      <p>&copy; 2025 VivaSpot Coupon Book. All rights reserved.</p>
      <nav class="footer-nav">
        <ul>
          <li><router-link to="/terms">Terms of Service</router-link></li>
          <li><router-link to="/privacy">Privacy Policy</router-link></li>
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
  background-color: var(--color-bg-muted);
  border-top: 1px solid var(--color-border-light);
  padding: var(--spacing-lg) 0;
  text-align: center;
}

.footer-container {
  max-width: var(--container-xl);
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
  width: 100%;
  overflow-x: hidden;
}

.footer-nav ul {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--spacing-md);
  margin: var(--spacing-sm) 0 0;
  padding: 0;
}

.footer-nav li {
  max-width: 100%;
}

.footer-nav a {
  color: var(--color-secondary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.footer-nav a:hover {
  color: var(--color-secondary-hover);
  text-decoration: underline;
}

/* Optional: on very small screens, stack links vertically */
@media (max-width: 480px) {
  .footer-nav ul {
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xs);
  }
}
</style>
