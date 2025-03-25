<template>
  <div class="events-container">
    <EventCard
      v-for="event in events"
      :key="event.id"
      :event="event"
      :hasAccess="hasAccess"
      @rsvp="handleRSVP"
    />
  </div>
</template>

<script>
import EventCard from '@/components/Events/EventCard.vue';

export default {
  name: 'EventList',
  components: {
    EventCard
  },
  props: {
    events: {
      type: Array,
      default: () => []
    },
    hasAccess: {
      type: Boolean,
      default: true
    }
  },
  methods: {
    handleRSVP(event) {
      console.log("RSVP event received:", event);
      alert(`RSVP for: ${event.name}`);
      event.showRSVP = !event.showRSVP;
    }
  }
};
</script>

<style scoped>
.events-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: stretch;
  gap: 1rem;
}
</style>
