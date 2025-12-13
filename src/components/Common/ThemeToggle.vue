<template>
  <button
    class="theme-toggle"
    @click="toggleTheme"
    :aria-label="`Switch to ${isDark ? 'light' : 'dark'} mode`"
    type="button"
    role="switch"
    :aria-checked="isDark"
  >
    <i :class="isDark ? 'pi pi-sun' : 'pi pi-moon'" class="theme-icon"></i>
    <span class="theme-label">{{ isDark ? 'Light' : 'Dark' }} Mode</span>
  </button>
</template>

<script>
export default {
  name: 'ThemeToggle',
  data() {
    return {
      isDark: false,
      mediaQuery: null,
      boundHandler: null
    }
  },
  mounted() {
    // Initialize theme state from current document state
    this.updateThemeState();
    
    // Watch for system preference changes (optional enhancement)
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    // Bind handler to preserve component context
    this.boundHandler = (e) => this.handleSystemPreferenceChange(e);
    this.mediaQuery.addEventListener('change', this.boundHandler);
  },
  
  beforeUnmount() {
    // Cleanup listener on unmount
    if (this.mediaQuery && this.boundHandler) {
      this.mediaQuery.removeEventListener('change', this.boundHandler);
    }
  },
  methods: {
    updateThemeState() {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      // If no data-theme attribute, check browser preference for adaptive mode
      if (!currentTheme) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.isDark = prefersDark;
      } else {
        this.isDark = currentTheme === 'dark';
      }
    },
    
    toggleTheme() {
      const newTheme = this.isDark ? 'light' : 'dark';
      
      // Set theme on document root
      document.documentElement.setAttribute('data-theme', newTheme);
      
      // Save preference to localStorage
      localStorage.setItem('theme', newTheme);
      
      // Update component state
      this.isDark = !this.isDark;
    },
    
    handleSystemPreferenceChange(e) {
      // Only update if user hasn't manually set a preference
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) {
        const prefersDark = e.matches;
        const newTheme = prefersDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        this.updateThemeState();
      }
    }
  }
}
</script>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  background: transparent;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-base);
  min-height: var(--button-height-md);
}

.theme-toggle:hover {
  background: var(--color-bg-muted);
  border-color: var(--color-border);
  color: var(--color-text-primary);
}

.theme-toggle:focus {
  outline: 2px solid var(--color-secondary);
  outline-offset: 2px;
}

.theme-icon {
  font-size: var(--font-size-lg);
  transition: transform var(--transition-base);
}

.theme-toggle:hover .theme-icon {
  transform: scale(1.1);
}

.theme-label {
  white-space: nowrap;
}

/* Mobile: hide label, show only icon */
@media (max-width: 480px) {
  .theme-label {
    display: none;
  }
  
  .theme-toggle {
    padding: var(--spacing-xs);
    min-width: var(--button-height-md);
    justify-content: center;
  }
}
</style>

