<template>
  <div class="event-rsvp">
    <h2>RSVP for {{ event.name }}</h2>
    <form @submit.prevent="submitRSVP">
      <div class="form-group">
        <label for="name">Your Name:</label>
        <input id="name" type="text" v-model="rsvpData.name" required />
      </div>
      <div class="form-group">
        <label for="email">Your Email:</label>
        <input id="email" type="email" v-model="rsvpData.email" required />
      </div>
      <div class="form-group">
        <label for="attendees">Number of Attendees:</label>
        <select id="attendees" v-model.number="rsvpData.attendees">
          <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
      <button type="submit">Submit RSVP</button>
      <button type="button" @click="$emit('cancel')">Cancel</button>
    </form>
  </div>
</template>

<script>
export default {
  name: "EventRSVP",
  props: {
    event: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      rsvpData: {
        name: '',
        email: '',
        attendees: 1
      }
    }
  },
  methods: {
    submitRSVP() {
      // Emit the RSVP data along with the event information to the parent component.
      this.$emit('submit', {
        event: this.event,
        rsvp: this.rsvpData
      });
    }
  }
};
</script>

<style scoped>
.event-rsvp {
  padding: var(--spacing-lg);
  max-width: 400px;
  margin: var(--spacing-2xl) auto;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  background: var(--color-bg-surface);
}
.form-group {
  margin-bottom: var(--spacing-lg);
}
label {
  display: block;
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}
input, select {
  width: 100%;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-family: var(--font-family-base);
  transition: border-color var(--transition-fast);
}
input:focus, select:focus {
  outline: none;
  border-color: var(--color-secondary);
}
button {
  margin-right: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  min-height: var(--button-height-md);
  font-weight: var(--font-weight-medium);
  transition: background-color var(--transition-base);
}
button[type="submit"] {
  background-color: var(--color-secondary);
  color: var(--color-text-on-secondary);
}
button[type="submit"]:hover {
  background-color: var(--color-secondary-hover);
}
button[type="button"] {
  background-color: var(--color-error);
  color: var(--color-text-on-error);
}
button[type="button"]:hover {
  background-color: var(--color-error-hover);
  color: var(--color-text-on-error);
}
</style>
