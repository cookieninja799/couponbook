<template>
  <div class="event-page-view">
    <section class="featured-events">
      <h1>Upcoming Events</h1>
      <EventList :events="events" />
    </section>
  </div>
</template>

<script>
import EventList from '@/components/Events/EventList.vue';

export default {
  name: "EventPageView",
  components: { EventList },
  data() {
    return {
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
    };
  }
};
</script>

<style scoped>
.event-page-view {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
  text-align: center;
}
</style>
