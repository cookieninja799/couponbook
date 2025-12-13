<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <button class="modal-close" @click="closeModal">×</button>
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: "AppModal",
  methods: {
    closeModal() {
      this.$emit("close");
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-index-modal-backdrop);
}
.modal-content {
  background: var(--color-bg-surface);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  position: relative;
  width: 90%;
  max-width: 500px;
  box-shadow: var(--shadow-xl);
  color: var(--color-text-primary);
}
.modal-close {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  background: transparent;
  border: none;
  font-size: var(--font-size-2xl);
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: color var(--transition-fast);
  line-height: 1;
  padding: var(--spacing-xs);
  min-width: var(--button-height-md);
  min-height: var(--button-height-md);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-close:hover {
  color: var(--color-text-primary);
}
</style>
