<template>
  <div v-if="group">
    <!-- Full-width Dynamic Banner -->
    <header class="group-banner" :style="{ backgroundImage: 'url(' + group.bannerImage + ')' }">
      <div class="banner-overlay">
        <div class="banner-content">
          <h1>{{ group.name }}</h1>
          <p>{{ group.description }}</p>
          <h3>Connect with Us</h3>
          <div class="social-links">
            <a v-if="group.socialMedia.facebook" :href="group.socialMedia.facebook" target="_blank">Facebook</a>
            <a v-if="group.socialMedia.instagram" :href="group.socialMedia.instagram" target="_blank">Instagram</a>
            <a v-if="group.socialMedia.twitter" :href="group.socialMedia.twitter" target="_blank">Twitter</a>
          </div>
        </div>
      </div>
    </header>

    <!-- Contained Page Content -->
    <div class="foodie-group-view container">
      <!-- Purchase Coupon Book Banner -->
      <div v-if="!hasPurchasedCouponBook" class="purchase-banner">
        <p>Purchase the coupon book to unlock all group coupons and RSVP for events.</p>
        <button @click="purchaseCouponBook" class="purchase-btn">Purchase Coupon Book</button>
      </div>

      <!-- Coupons Section -->
      <section class="coupons-section section-card">
        <h2>Group Coupons</h2>
        <CouponList 
          :coupons="groupCoupons" 
          :hasPurchasedCouponBook="hasPurchasedCouponBook"
          @redeem="handleRedeemCoupon" 
          @purchase-coupon-book="handlePurchaseCoupon" 
        />
      </section>

      <!-- Events Section -->
      <section class="events-section section-card">
        <h2>Group Events</h2>
        <EventList :events="events" :hasAccess="hasPurchasedCouponBook" />
      </section>

      <!-- Map Section -->
      <section class="map-section section-card">
        <h2>Location</h2>
        <iframe 
          width="100%" 
          height="300" 
          frameborder="0" 
          style="border:0" 
          :src="mapUrl" 
          allowfullscreen>
        </iframe>
      </section>
    </div>
  </div>
  <div v-else class="not-found">
    <p>Group not found.</p>
  </div>
</template>

<script>
import CouponList from '@/components/Coupons/CouponList.vue';
import EventList from '@/components/Events/EventList.vue';
import samplecoupons from '@/data/samplecoupons';
import foodieGroups from '@/data/foodieGroups';

export default {
  name: "FoodieGroupView",
  components: {
    CouponList,
    EventList
  },
  data() {
    return {
      group: null,
      hasPurchasedCouponBook: false, // Determines access to coupons/events
      coupons: samplecoupons,
      events: [
        {
          id: 1,
          name: 'Wine Tasting Night',
          description: 'Sample a curated selection of fine wines paired with gourmet appetizers.',
          event_date: '2025-06-21T18:00:00',
          merchantLogo: require('@/assets/logo.png'),
          merchantName: 'The Vineyard Bistro',
          location: 'Downtown',
          showRSVP: false
        },
        {
          id: 2,
          name: 'Sushi Rolling Workshop',
          description: 'Learn the art of sushi making with hands-on instruction from expert chefs.',
          event_date: '2025-07-15T10:00:00',
          merchantLogo: require('@/assets/logo.png'),
          merchantName: 'Sushi Delight',
          location: 'Uptown',
          showRSVP: false
        },
        {
          id: 3,
          name: 'Burger Bonanza',
          description: 'Enjoy an evening of gourmet burgers and creative sides, with live cooking demos.',
          event_date: '2025-08-05T09:00:00',
          merchantLogo: require('@/assets/logo.png'),
          merchantName: 'Burger Hub',
          location: 'Midtown',
          showRSVP: false
        }
      ],
      foodieGroups // Imported from data
    }
  },
  computed: {
    // Filters coupons to only those that belong to the current group.
    groupCoupons() {
      if (!this.group) return [];
      return this.coupons.filter(coupon =>
        coupon.foodieGroup && coupon.foodieGroup.toLowerCase() === this.group.foodieGroup.toLowerCase()
      );
    },
    // Constructs a Google Maps embed URL based on the group's coordinates.
    mapUrl() {
      if (!this.group || !this.group.mapCoordinates) return '';
      const { lat, lng } = this.group.mapCoordinates;
      const apiKey = process.env.VUE_APP_GOOGLE_MAPS_API_KEY;
      return `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${lat},${lng}&zoom=12`;
    }
  },
  created() {
    // Retrieve the group id from the route parameters and find the matching group.
    const groupId = Number(this.$route.params.id);
    this.group = this.foodieGroups.find(g => g.id === groupId);
  },
  methods: {
    purchaseCouponBook() {
      // Simulate a purchase process; in a real app, integrate your payment flow.
      this.hasPurchasedCouponBook = true;
      alert(`You've purchased the ${this.group.name} Coupon Book!`);
    },
    handleRedeemCoupon(coupon) {
      console.log("Redeeming coupon:", coupon);
      // Add coupon redemption logic here.
    },
    handlePurchaseCoupon() {
      // Trigger purchase if a locked coupon is tapped.
      this.purchaseCouponBook();
    }
  }
};
</script>

<style scoped>
/* Full-width Banner */
.group-banner {
  width: 100%;
  height: 300px;
  background-size: cover;
  background-position: center;
  position: relative;
}
.banner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
}
.banner-content {
  text-align: center;
  color: #fff;
}
.banner-content h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}
.banner-content p {
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

/* Social Links in Header */
.social-links {
  margin-top: 1rem;
}
.social-links a {
  margin: 0 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: #fff;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}
.social-links a:hover {
  background-color: #0056b3;
}

/* Container for the rest of the content */
.container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
}

/* Section Card Styling */
.section-card {
  position: relative;
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

/* Purchase Coupon Book Banner */
.purchase-banner {
  background-color: #f8f8f8;
  padding: 1rem;
  text-align: center;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 1rem;
}
.purchase-btn {
  background-color: #007bff;
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-top: 0.5rem;
}
.purchase-btn:hover {
  background-color: #0056b3;
}

/* Map Section */
.map-section iframe {
  border: none;
  border-radius: 8px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .banner-content h1 {
    font-size: 2rem;
  }
  .banner-content p {
    font-size: 1rem;
  }
}
</style>
