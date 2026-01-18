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
  font-family: var(--font-family-base);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
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
  padding: var(--spacing-2xl);
  border-radius: var(--radius-lg);
  text-align: center;
  max-width: 90%;
  color: #FFFFFF;
}

.hero h1 {
  font-size: var(--font-size-6xl);
  margin-bottom: var(--spacing-lg);
  color: #FFFFFF;
}

.hero p {
  font-size: var(--font-size-2xl);
  margin-bottom: var(--spacing-2xl);
  color: #FFFFFF;
  opacity: 0.95;
}

.cta-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--spacing-lg);
}

.btn {
  padding: var(--spacing-md) var(--spacing-xl);
  text-decoration: none;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
  transition: all var(--transition-base);
  min-height: var(--button-height-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn.primary {
  background-color: var(--color-secondary);
  color: var(--color-text-on-secondary);
}

.btn.primary:hover {
  background-color: var(--color-secondary-hover);
  color: var(--color-text-on-secondary);
}

.btn.secondary {
  background-color: var(--color-success);
  color: var(--color-text-on-success);
}

.btn.secondary:hover {
  background-color: var(--color-success-hover);
  color: var(--color-text-on-success);
}

.btn.tertiary {
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
}

.btn.tertiary:hover {
  background-color: var(--color-primary-hover);
}

/* Features Section */
.features {
  background-color: var(--surface-2);
  padding: var(--spacing-2xl);
  text-align: center;
  color: var(--color-text-primary);
}

.features h2 {
  color: var(--color-text-primary);
  font-size: var(--font-size-4xl);
  margin-bottom: var(--spacing-xl);
}

.features p {
  color: var(--color-text-secondary);
}

.feature-cards {
  display: grid;
  gap: var(--spacing-xl);
  max-width: var(--container-lg);
  margin: 0 auto;
}

.feature-cards .card {
  background-color: var(--surface-1);
  padding: var(--spacing-xl);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  color: var(--color-text-primary);
}

.feature-cards .card h3 {
  margin-bottom: var(--spacing-lg);
  font-size: var(--font-size-2xl);
  color: var(--color-text-primary);
}

.feature-cards .card p {
  color: var(--color-text-secondary);
  margin: 0;
}

/* Featured Events Section */
.featured-events {
  padding: var(--spacing-2xl);
  background: var(--surface-2);
  text-align: center;

  /* Light-mode variables for OverlayBlock */
  --overlay-veil-bg: var(--color-bg-overlay);
  --overlay-card-bg: var(--color-bg-primary);
  --overlay-card-fg: var(--color-slate);
  --overlay-card-border: rgba(56, 66, 76, 0.15);
  --overlay-radius: var(--radius-lg);
  --overlay-shadow: var(--shadow-lg);
  --overlay-btn-bg: var(--color-primary-light);
  --overlay-btn-bg-hover: var(--color-primary-hover);
  --overlay-btn-fg: var(--color-text-inverse);
}

.featured-events h2 {
  font-size: var(--font-size-5xl);
  margin-bottom: var(--spacing-2xl);
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .hero h1 {
    font-size: var(--font-size-5xl);
  }

  .hero p {
    font-size: var(--font-size-xl);
  }

  .features h2,
  .featured-events h2 {
    font-size: var(--font-size-4xl);
  }

  .hero-overlay {
    padding: var(--spacing-xl);
  }
}
</style>
