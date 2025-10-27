<!-- src/views/EventPageView.vue -->
<template>
  <div class="event-page-view">
    <section class="featured-events">
      <h1>Upcoming Events</h1>

      <!-- Greyed-out overlay applied here -->
      <OverlayBlock
        :is-dimmed="!eventsEnabled"
        title="Events are coming soon!"
        message="We’re rolling this feature out. Want early access or notifications when it’s live?"
        cta-text="Notify Me"
        @cta="goNotify"
      >
        <EventList :events="events" />
      </OverlayBlock>
    </section>
  </div>
</template>

<script>
import EventList from '@/components/Events/EventList.vue'
import OverlayBlock from '@/components/Common/OverlayBlock.vue'

export default {
  name: 'EventPageView',
  components: { EventList, OverlayBlock },
  data() {
    return {
      // Flip to true when you want to enable events on this page
      eventsEnabled: false,
      events: [
        {
          id: 1,
          name: 'Wine Tasting Night',
          description: 'Sample a curated selection of fine wines paired with gourmet appetizers.',
          event_date: '2025-06-21T18:00:00',
          merchantLogo: require('@/assets/Screenshot_2.png'),
          merchantName: 'The Vineyard Bistro',
          location: 'Downtown',
          showRSVP: false
        },
        {
          id: 2,
          name: 'Sushi Rolling Workshop',
          description: 'Learn the art of sushi making with hands-on instruction from expert chefs.',
          event_date: '2025-07-15T10:00:00',
          merchantLogo: require('@/assets/sushi.png'),
          merchantName: 'Sushi Delight',
          location: 'Uptown',
          showRSVP: false
        },
        {
          id: 3,
          name: 'Burger Bonanza',
          description: 'Enjoy an evening of gourmet burgers and creative sides, with live cooking demos.',
          event_date: '2025-08-05T09:00:00',
          merchantLogo: require('@/assets/image2.png'),
          merchantName: 'Burger Hub',
          location: 'Midtown',
          showRSVP: false
        },
        {
          id: 4,
          name: 'Vegan Food Festival',
          description: 'Explore a variety of innovative vegan dishes from top local restaurants.',
          event_date: '2025-09-10T12:00:00',
          merchantLogo: require('@/assets/logo.png'),
          merchantName: 'Green Eats',
          location: 'City Park',
          showRSVP: false
        },
        {
          id: 5,
          name: 'Dessert Decadence',
          description: 'Indulge in an evening of exquisite desserts—from rich chocolates to delicate pastries.',
          event_date: '2025-10-20T07:00:00',
          merchantLogo: require('@/assets/logo.png'),
          merchantName: 'Sweet Spot',
          location: 'The Corner Cafe',
          showRSVP: false
        }
      ]
    }
  },
  methods: {
    goNotify() {
      // Route anywhere you like for signup/interest
      this.$router.push({ name: 'Contact', query: { topic: 'events-early-access' } })
    }
  }
}
</script>

<style scoped>
.event-page-view {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
  text-align: center;
}

/* Light mode overrides for OverlayBlock (your requested values) */
.featured-events {
  /* These cascade into OverlayBlock via CSS variables */
  --overlay-veil-bg: rgba(112, 112, 112, 0.85);
  --overlay-card-bg: #ffffff;
  --overlay-card-fg: #38424c;
  --overlay-card-border: rgba(56, 66, 76, 0.15);
  --overlay-radius: 8px;
  --overlay-shadow: 0 4px 20px rgba(0,0,0,0.1);
  --overlay-btn-bg: #FF6B35;
  --overlay-btn-bg-hover: #DD6146;
  --overlay-btn-fg: #ffffff;
}
</style>
