<template>
  <div class="event-details">
    <h2>{{ event.name }}</h2>

    <div class="merchant-info">
      <img
        class="merchant-logo"
        :src="event.merchantLogo"
        :alt="`Logo of ${event.merchantName}`"
      />
      <p class="merchant-name">{{ event.merchantName }}</p>
    </div>

    <p>{{ event.description }}</p>
    <p v-if="event.location" class="event-location">
      Location: {{ event.location }}
    </p>
    <p class="event-date">
      Date: {{ formatDate(event.event_date) }}
    </p>

    <div class="actions">
      <button @click="emitRSVP" class="rsvp-btn">
        {{ event.showRSVP ? 'Close RSVP' : 'RSVP' }}
      </button>
    </div>

    <!-- Locked overlay for events with redirect button -->
    <div v-if="!hasAccess" class="locked-overlay">
      <p>Locked: Purchase coupon book to RSVP</p>
      <button class="redirect-btn" @click="redirectToGroup">
        Purchase Coupon Book
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EventCard',
  props: {
    event: {
      type: Object,
      required: true
    },
    hasAccess: {
      type: Boolean,
      default: true
    }
  },
  methods: {
    formatDate(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleString();
    },
    emitRSVP() {
      this.$emit('rsvp', this.event);
    },
    redirectToGroup() {
      // Assuming the event object has a foodieGroup property.
      // Use a mapping to determine the group id.
      const mapping = {
        'charlotte': 1,
        'raleigh': 2,
        'chapel hill': 3,
        'wnc': 4
      };
      // Ensure event.foodieGroup exists.
      if (!this.event.foodieGroup) {
        alert("Group information unavailable.");
        return;
      }
      const groupId = mapping[this.event.foodieGroup.toLowerCase()];
      if (groupId) {
        this.$router.push({ name: 'FoodieGroupView', params: { id: groupId } });
      } else {
        alert("Unable to determine group. Please contact support.");
      }
    }
  }
};
</script>

<style scoped>
.event-details {
  position: relative; /* For overlay positioning */
  display: flex;
  flex-direction: column;
  width: 300px;
  margin-bottom: var(--spacing-2xl);
  padding: var(--spacing-lg);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--color-bg-muted);
}

.event-details h2 {
  min-height: 3em;
}

.actions {
  margin-top: auto;
  margin-bottom: 1rem;
}

.event-date {
  color: #555;
  margin-top: 0.5rem;
}

.event-location {
  font-weight: bold;
  margin: 0.5rem 0;
}

.rsvp-btn {
  background-color: #007bff;
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.rsvp-btn:hover {
  background-color: #0056b3;
}

.merchant-info {
  display: flex;
  flex-direction: column; 
  align-items: center;
  justify-content: center;
  margin: 1rem;
}

.merchant-logo {
  height: 80px;
  width: 80px;
  object-fit: contain;
  border-radius: 50%;
  border: 2px solid var(--border-subtle);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--spacing-sm);
  background-color: #FFFFFF !important;
  padding: var(--spacing-xs);
}

.merchant-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

/* Locked overlay styles */
.locked-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  background: var(--color-bg-surface);
  opacity: 0.95;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
  border-radius: var(--radius-lg);
}

.redirect-btn {
  margin-top: var(--spacing-sm);
  background-color: var(--color-secondary);
  color: var(--color-text-on-secondary);
  border: none;
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-base);
  min-height: var(--button-height-md);
  font-weight: var(--font-weight-medium);
}

.redirect-btn:hover {
  background-color: var(--color-secondary-hover);
}
</style>
