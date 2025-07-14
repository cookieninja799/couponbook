<!-- src/views/FoodieGroup.vue -->
<template>
  <div v-if="!group" class="not-found">
    <p>Group not found.</p>
  </div>
  <div v-else>
    <!-- Dynamic Banner -->
    <header 
      class="group-banner" 
      :style="{ backgroundImage: `url(${group.bannerImageUrl || '/default-banner.jpg'})` }"
    >
      <div class="banner-overlay">
        <div class="banner-content">
          <h1>{{ group.name }}</h1>
          <p>{{ group.description }}</p>
          <div class="social-links" v-if="group.socialLinks">
            <a 
              v-if="group.socialLinks.facebook" 
              :href="group.socialLinks.facebook" 
              target="_blank"
            >Facebook</a>
            <a 
              v-if="group.socialLinks.instagram" 
              :href="group.socialLinks.instagram" 
              target="_blank"
            >Instagram</a>
            <a 
              v-if="group.socialLinks.twitter" 
              :href="group.socialLinks.twitter" 
              target="_blank"
            >Twitter</a>
          </div>
        </div>
      </div>
    </header>

    <div class="foodie-group-view container">
      <!-- Purchase Coupon Book Banner -->
      <div v-if="!hasPurchasedCouponBook" class="purchase-banner">
        <p>
          Purchase the coupon book to unlock all group coupons and RSVP for events.
        </p>
        <button @click="purchaseCouponBook" class="purchase-btn">
          Purchase Coupon Book
        </button>
      </div>

      <!-- Coupons Section -->
      <section class="coupons-section section-card">
        <h2>Group Coupons</h2>
        <p v-if="loadingCoupons">Loading coupons…</p>
        <p v-else-if="couponError" class="error">⚠️ {{ couponError }}</p>
        <CouponList
          v-else
          :coupons="groupCoupons"
          :hasPurchasedCouponBook="hasPurchasedCouponBook"
          @redeem="handleRedeemCoupon"
        />
      </section>

      <!-- Events Section (static sample data) -->
      <section class="events-section section-card">
        <h2>Group Events</h2>
        <EventList 
          :events="events" 
          :hasAccess="hasPurchasedCouponBook" 
        />
      </section>

      <!-- Map Section -->
      <section class="map-section section-card">
        <h2>Location</h2>
        <iframe
          v-if="mapUrl"
          width="100%"
          height="300"
          frameborder="0"
          style="border:0"
          :src="mapUrl"
          allowfullscreen
        />
      </section>
    </div>
  </div>
</template>

<script>
import CouponList from '@/components/Coupons/CouponList.vue';
import EventList  from '@/components/Events/EventList.vue';

export default {
  name: "FoodieGroupView",
  components: { CouponList, EventList },

  data() {
    return {
      group: null,
      hasPurchasedCouponBook: false,

      // coupons loaded from API
      coupons: [],
      loadingCoupons: true,
      couponError: null,

      // inline sample events
      events: [
        {
          id: 1,
          name: 'Wine Tasting Night',
          description: 'Sample a curated selection of fine wines paired with gourmet appetizers.',
          event_date: '2025-06-21T18:00:00',
          merchantLogo: '/logo.png',
          merchantName: 'The Vineyard Bistro',
          location: 'Downtown',
          showRSVP: false
        },
        {
          id: 2,
          name: 'Sushi Rolling Workshop',
          description: 'Learn the art of sushi making with hands-on instruction from expert chefs.',
          event_date: '2025-07-15T10:00:00',
          merchantLogo: '/logo.png',
          merchantName: 'Sushi Delight',
          location: 'Uptown',
          showRSVP: false
        },
        {
          id: 3,
          name: 'Burger Bonanza',
          description: 'Enjoy an evening of gourmet burgers and creative sides, with live cooking demos.',
          event_date: '2025-08-05T09:00:00',
          merchantLogo: '/logo.png',
          merchantName: 'Burger Hub',
          location: 'Midtown',
          showRSVP: false
        }
      ]
    };
  },

  created() {
    const id = this.$route.params.id;    // e.g. "de9ec277-7329-4f64-b5df-40a618420677"
    this.fetchGroup(id);
    this.fetchCoupons(id);
  },

  methods: {
    async fetchGroup(id) {
      try {
        const res = await fetch(`http://localhost:3000/api/v1/groups/${id}`);
        if (!res.ok) throw new Error(res.statusText);
        this.group = await res.json();
      } catch (err) {
        console.error("Failed to load group", err);
      }
    },
    async fetchCoupons(groupId) {
      try {
        const res = await fetch('http://localhost:3000/api/v1/coupons');
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const all = await res.json();
        // filter just this group’s coupons
        this.coupons = all.filter(c => String(c.foodie_group_id) === String(groupId));
      } catch (err) {
        console.error("Failed to load coupons", err);
        this.couponError = err.message;
      } finally {
        this.loadingCoupons = false;
      }
    },

    purchaseCouponBook() {
      this.hasPurchasedCouponBook = true;
      alert(`You've purchased the ${this.group.name} Coupon Book!`);
    },

    handleRedeemCoupon(coupon) {
      console.log("Redeeming coupon:", coupon);
    }
  },

  computed: {
    groupCoupons() {
      return this.coupons;
    },
    mapUrl() {
      if (!this.group?.mapCoordinates) return '';
      const { lat, lng } = this.group.mapCoordinates;
      const key = process.env.VUE_APP_GOOGLE_MAPS_API_KEY;
      return `https://www.google.com/maps/embed/v1/view?key=${key}&center=${lat},${lng}&zoom=12`;
    }
  }
};
</script>

<style scoped>
.group-banner {
  width: 100%; height: 300px;
  background-size: cover;
  background-position: center;
  position: relative;
}
.banner-overlay {
  position: absolute; top:0; left:0;
  width:100%; height:100%;
  background: rgba(0,0,0,0.55);
  display: flex; align-items:center; justify-content:center;
}
.banner-content { text-align:center; color:#fff; }
.banner-content h1 { font-size:2.5rem; margin-bottom:0.5rem; }
.banner-content p    { font-size:1.25rem; margin-bottom:1rem; }
.social-links a {
  margin:0 .5rem; padding:.5rem 1rem;
  background:#007bff; color:#fff;
  border-radius:4px; text-decoration:none;
  transition:background .3s;
}
.social-links a:hover { background:#0056b3; }

.container { max-width:1200px; margin:2rem auto; padding:0 2rem; }
.section-card {
  background:#fff; padding:1.5rem; border-radius:8px;
  box-shadow:0 2px 4px rgba(0,0,0,0.1); margin-bottom:2rem;
}
.purchase-banner {
  background:#f8f8f8; padding:1rem; text-align:center;
  border:1px solid #ddd; border-radius:8px; margin-bottom:1rem;
}
.purchase-btn {
  margin-top:.5rem;
  background:#007bff; color:#fff; border:none;
  padding:.75rem 1.5rem; border-radius:4px;
  cursor:pointer; transition:background .3s;
}
.purchase-btn:hover { background:#0056b3; }

.error { color:red; margin-bottom:1rem; }

.map-section iframe {
  border:none; border-radius:8px;
}
</style>
