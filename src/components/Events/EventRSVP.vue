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
  padding: 1rem;
  max-width: 400px;
  margin: 2rem auto;
  border: 1px solid #ddd;
  border-radius: 8px;
}
.form-group {
  margin-bottom: 1rem;
}
label {
  display: block;
  margin-bottom: 0.5rem;
}
input, select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
button {
  margin-right: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button[type="submit"] {
  background-color: #007bff;
  color: #fff;
}
button[type="submit"]:hover {
  background-color: #0056b3;
}
button[type="button"] {
  background-color: #dc3545;
  color: #fff;
}
button[type="button"]:hover {
  background-color: #c82333;
}
</style>
