<template>
  <footer class="app-footer">
    <div class="footer-container">
      <p>&copy; 2025 VivaSpot Coupon Book. All rights reserved.</p>
      <div class="footer-right">
      <nav class="footer-nav">
        <ul>
          <li><router-link to="/terms">Terms of Service</router-link></li>
          <li><router-link to="/privacy">Privacy Policy</router-link></li>
        </ul>
      </nav>
        <ThemeToggle />
      </div>
    </div>
  </footer>
</template>

<script>
import ThemeToggle from './ThemeToggle.vue'

export default {
  name: "AppFooter",
  components: {
    ThemeToggle
  }
}
</script>

<style scoped>
.app-footer {
  background-color: var(--color-bg-muted);
  border-top: 1px solid var(--color-border-light);
  padding: var(--spacing-lg) 0;
  text-align: center;
  color: var(--color-text-primary);
}

.app-footer p {
  color: var(--color-text-primary);
  margin: 0;
}

.footer-container {
  max-width: var(--container-xl);
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
  width: 100%;
  overflow-x: hidden;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.footer-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

.footer-nav ul {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--spacing-md);
  margin: 0;
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

/* Responsive: stack on small screens */
@media (max-width: 768px) {
  .footer-container {
    flex-direction: column;
    text-align: center;
  }
  
  .footer-right {
    flex-direction: column;
    width: 100%;
  }
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
