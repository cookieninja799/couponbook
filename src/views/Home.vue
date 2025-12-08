<!-- src/views/Home.vue -->
<template>
  <div class="home">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-overlay">
        <h1>Welcome to VivaSpot Coupon Book</h1>
        <p>Your digital catalog to exclusive local restaurant deals & events</p>
        <div class="cta-buttons">
          <router-link class="btn primary" to="/coupon-book">Browse Coupons</router-link>
          <router-link class="btn tertiary" to="/event-page">Browse Events</router-link>
          <router-link class="btn secondary" to="/foodie-groups">Join Foodie Groups</router-link>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features">
      <h2>Discover Local Deals & Experiences</h2>
      <div class="feature-cards">
        <div class="card">
          <h3>Exclusive Coupons</h3>
          <p>Access special discounts from top local restaurants.</p>
        </div>
        <div class="card">
          <h3>Seamless Redemption</h3>
          <p>Redeem offers easily using QR codes.</p>
        </div>
        <div class="card">
          <h3>Exciting Events</h3>
          <p>RSVP for curated events and add them to your calendar.</p>
        </div>
      </div>
    </section>

    <!-- Featured Events Section -->
    <section v-if="false" class="featured-events">
      <h2>Upcoming Events</h2>

      <!-- Overlay toggled here -->
      <OverlayBlock :is-dimmed="!eventsEnabled" title="Events are coming soon!"
        message="We’re rolling this feature out. Want early access or a heads-up when it’s live?" cta-text="Notify Me"
        @cta="goNotify">
        <EventList :events="featuredEvents" />
      </OverlayBlock>
    </section>
  </div>
</template>

<script>
import EventList from '@/components/Events/EventList.vue'
import OverlayBlock from '@/components/Common/OverlayBlock.vue'

export default {
  name: 'AppHome',
  components: { EventList, OverlayBlock },
  data() {
    return {
      eventsEnabled: false, // flip to true when you enable events on the homepage
      featuredEvents: [
        {
          id: 1,
          name: 'Taco Tuesday Extravaganza',
          description: 'Join us for an evening of delicious tacos and great company.',
          event_date: new Date().toISOString(),
          merchantName: 'Taco Shack',
          merchantLogo: require('@/assets/logo.png'),
          location: 'Downtown Plaza'
        },
        {
          id: 2,
          name: 'Sushi Sunday',
          description: 'Enjoy fresh sushi and sashimi served by expert chefs.',
          event_date: new Date(Date.now() + 86400000).toISOString(),
          merchantName: 'Sushi World',
          merchantLogo: require('@/assets/sushi.png'),
          location: 'City Center'
        },
        {
          id: 3,
          name: 'Burger Bonanza',
          description: 'Indulge in gourmet burgers with unique toppings.',
          event_date: new Date(Date.now() + 2 * 86400000).toISOString(),
          merchantName: 'Burger Hub',
          merchantLogo: require('@/assets/image2.png'),
          location: 'Main Street'
        }
      ]
    }
  },
  methods: {
    goNotify() {
      this.$router.push({ name: 'Contact', query: { topic: 'events-early-access' } })
    }
  }
}
</script>

<style scoped>
/* General */
.home {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
}

/* Hero Section */
.hero {
  position: relative;
  background-image: url("../assets/homepageBackground.jpg");
  background-size: cover;
  background-position: center;
  height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero-overlay {
  background: rgba(0, 0, 0, 0.65);
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  max-width: 90%;
}
.hero h1 {
  font-size: 3.5rem;
  margin-bottom: 1rem;
  color: #fff;
}
.hero p {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  color: #ddd;
}
.cta-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
}
.btn {
  padding: 0.75rem 1.5rem;
  text-decoration: none;
  border-radius: 4px;
  font-weight: bold;
  transition: background 0.3s ease, transform 0.2s ease;
}
.btn:hover {
  transform: translateY(-2px);
}
.btn.primary { background-color: #007bff; color: #fff; }
.btn.primary:hover { background-color: #0056b3; }
.btn.secondary { background-color: #28a745; color: #fff; }
.btn.secondary:hover { background-color: #218838; }
.btn.tertiary { background-color: #dd6146; color: #fff; }
.btn.tertiary:hover { background-color: #be3f22; }

/* Features Section */
.features {
  background-color: #38424c;
  padding: 2rem;
  text-align: center;
}
.features h2 {
  color: #fff;
  font-size: 2rem;
  margin-bottom: 1.5rem;
}
.feature-cards {
  display: grid;
  gap: 1.5rem;
  max-width: 1000px;
  margin: 0 auto;
}
.feature-cards .card {
  background-color: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.feature-cards .card h3 {
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

/* Featured Events Section */
.featured-events {
  padding: 2rem;
  background: #f0f0f0;
  text-align: center;

  /* Light-mode variables for OverlayBlock */
  --overlay-veil-bg: rgba(112, 112, 112, 0.85);
  --overlay-card-bg: #ffffff;                    /* white card */
  --overlay-card-fg: #38424c;                    /* slate text */
  --overlay-card-border: rgba(56, 66, 76, 0.15); /* faint slate border */
  --overlay-radius: 8px;
  --overlay-shadow: 0 4px 20px rgba(0,0,0,0.1);
  --overlay-btn-bg: #FF6B35;                     /* coral */
  --overlay-btn-bg-hover: #DD6146;               /* darker coral */
  --overlay-btn-fg: #ffffff;
}
.featured-events h2 {
  font-size: 2.5rem;
  margin-bottom: 2rem;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .hero h1 { font-size: 2.5rem; }
  .hero p { font-size: 1.25rem; }
  .features h2,
  .featured-events h2 { font-size: 2rem; }
}
</style>
