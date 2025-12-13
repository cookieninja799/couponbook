<!-- src/components/Common/OverlayBlock.vue -->
<template>
    <div class="overlay-block" :class="{ 'overlay-active': isDimmed }">
      <slot />
  
      <div
        v-if="isDimmed"
        class="overlay-block__veil"
        role="region"
        :aria-label="ariaLabel"
      >
        <div class="overlay-block__content" :class="contentClass">
          <slot name="overlay">
            <h3 class="overlay-block__title">{{ title }}</h3>
            <p v-if="message" class="overlay-block__message">{{ message }}</p>
            <div v-if="$slots.actions || ctaText" class="overlay-block__actions">
              <slot name="actions">
                <button
                  v-if="ctaText"
                  class="overlay-block__btn"
                  type="button"
                  @click="$emit('cta')"
                >
                  {{ ctaText }}
                </button>
              </slot>
            </div>
          </slot>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'OverlayBlock',
    props: {
      isDimmed: { type: Boolean, default: false },
      title: { type: String, default: 'Coming soon' },
      message: { type: String, default: '' },
      ctaText: { type: String, default: '' },
      ariaLabel: { type: String, default: 'Feature temporarily unavailable' },
      contentClass: { type: String, default: '' }
    },
    emits: ['cta']
  }
  </script>
  
  <style scoped>
  /* Themed overlay variables (inherit from design tokens) */
  :host, .overlay-block {
    --overlay-veil-bg: var(--color-bg-overlay, rgba(112, 112, 112, 0.85));
    --overlay-card-bg: var(--color-bg-surface);
    --overlay-card-fg: var(--color-text-primary);
    --overlay-card-border: var(--color-border-light);
    --overlay-radius: 8px;
    --overlay-shadow: 0 4px 20px rgba(0,0,0,0.1);
    --overlay-btn-bg: var(--color-primary-light);
    --overlay-btn-bg-hover: var(--color-primary-hover);
    --overlay-btn-fg: var(--color-text-on-primary);
  }
  
  /* Root wrapper */
  .overlay-block {
    position: relative;
    transition: filter .18s ease-in-out;
  }
  
  /* Slight desaturation of underlying content */
  .overlay-active {
    filter: grayscale(0.1) brightness(0.96);
  }
  
  /* Prevent clicks behind the overlay */
  .overlay-active :deep(a),
  .overlay-active :deep(button),
  .overlay-active :deep([tabindex]) {
    pointer-events: none !important;
  }
  
  /* Veil */
  .overlay-block__veil {
    position: absolute; inset: 0;
    z-index: 2;
    background: var(--overlay-veil-bg);
    display: grid; place-items: center;
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
    pointer-events: auto;
    animation: overlay-fade .2s ease-out;
  }
  
  /* Card container */
  .overlay-block__content {
    max-width: 640px;
    width: min(92%, 640px);
    background: var(--overlay-card-bg);
    color: var(--overlay-card-fg);
    border: 1px solid var(--overlay-card-border);
    border-radius: var(--overlay-radius);
    padding: 1.25rem 1.5rem;
    text-align: center;
    box-shadow: var(--overlay-shadow);
  }
  
  /* Typography */
  .overlay-block__title {
    margin: 0 0 0.25rem;
    font-size: 1.25rem;
    font-weight: 700;
  }
  .overlay-block__message {
    margin: 0 0 0.75rem;
    opacity: 0.85;
    font-size: 1rem;
    line-height: 1.5;
  }
  .overlay-block__actions { margin-top: 0.5rem; }
  
  /* CTA button (brand coral) */
  .overlay-block__btn {
    appearance: none;
    border: none;
    border-radius: 999px;
    padding: 10px 18px;
    font-weight: 700;
    background: var(--overlay-btn-bg);
    color: var(--overlay-btn-fg);
    cursor: pointer;
    transition: background-color .15s ease, transform .15s ease, box-shadow .15s ease;
  }
  .overlay-block__btn:hover {
    background: var(--overlay-btn-bg-hover);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  .overlay-block__btn:focus {
    outline: 2px solid var(--color-secondary);
    outline-offset: 2px;
  }
  
  /* Fade animation */
  @keyframes overlay-fade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  </style>
  