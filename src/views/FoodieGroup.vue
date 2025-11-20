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
        <p>Purchase the coupon book to unlock all group coupons and RSVP for events.</p>
        <button @click="purchaseCouponBook" class="purchase-btn">Purchase Coupon Book</button>
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
          :isAuthenticated="isAuthenticated"
          @redeem="handleRedeemCoupon"
        />
      </section>

      <!-- Confirm Redeem Modal (currently unused, but kept) -->
      <CouponRedemption
        v-if="showRedeemDialog"
        :coupon="selectedCoupon"
        @confirm="confirmRedeem"
        @cancel="closeRedeem"
      />

      <!-- Events Section Wrapped with OverlayBlock -->
      <section class="events-section section-card">
        <OverlayBlock
          :is-dimmed="true"
          title="Events are coming soon!"
          message="Our events feature is in preview and will be unlocked soon for Foodie Groups."
          cta-text="Notify Me"
          @cta="alert('You’ll be notified when events are live!')"
        >
          <h2>Group Events</h2>
          <EventList :events="events" :hasAccess="hasPurchasedCouponBook" />
        </OverlayBlock>
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
import CouponRedemption from '@/components/Coupons/CouponRedemption.vue';
import EventList from '@/components/Events/EventList.vue';
import OverlayBlock from '@/components/Common/OverlayBlock.vue';
import { mapGetters } from 'vuex';
import { signIn } from '@/services/authService';

const PURCHASE_KEY_PREFIX = 'vs_couponbook_group_';

export default {
  name: 'FoodieGroupView',
  components: { CouponList, CouponRedemption, EventList, OverlayBlock },

  data() {
    return {
      group: null,
      hasPurchasedCouponBook: false,
      coupons: [],
      loadingCoupons: true,
      couponError: null,
      showRedeemDialog: false,
      selectedCoupon: null,
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
    const id = this.$route.params.id;
    this.fetchGroup(id);
    this.fetchCoupons(id);
    this.restorePurchaseState(id);
  },

  computed: {
    ...mapGetters('auth', ['isAuthenticated']),

    groupCoupons() {
      return this.coupons;
    },

    mapUrl() {
      if (!this.group?.mapCoordinates) return '';
      const { lat, lng } = this.group.mapCoordinates;
      const key = process.env.VUE_APP_GOOGLE_MAPS_API_KEY;
      return `https://www.google.com/maps/embed/v1/view?key=${key}&center=${lat},${lng}&zoom=12`;
    }
  },

  methods: {
    async fetchGroup(id) {
      try {
        console.log('📦  GET /api/v1/groups/:id from FoodieGroup.vue', id);
        const res = await fetch(`/api/v1/groups/${id}`);
        if (!res.ok) throw new Error(res.statusText);
        this.group = await res.json();
      } catch (err) {
        console.error('Failed to load group', err);
      }
    },

    async fetchCoupons(groupId) {
      try {
        console.log('📦  GET /api/v1/coupons from FoodieGroup.vue');
        const res = await fetch('/api/v1/coupons');
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const all = await res.json();
        this.coupons = all
          .filter(c => String(c.foodie_group_id) === String(groupId))
          .map(c => ({ redeemed_by_user: false, ...c }));
      } catch (err) {
        console.error('Failed to load coupons', err);
        this.couponError = err.message;
      } finally {
        this.loadingCoupons = false;
      }
    },

    // 🔁 Restore purchase state from localStorage
    restorePurchaseState(groupId) {
      try {
        const key = `${PURCHASE_KEY_PREFIX}${groupId}`;
        const flag = localStorage.getItem(key);
        if (flag === 'purchased') {
          this.hasPurchasedCouponBook = true;
        }
      } catch (e) {
        console.warn('[FoodieGroup] failed to read purchase state', e);
      }
    },

    // 🔐 Code-based "purchase" that persists across refreshes
    purchaseCouponBook() {
      const code = window.prompt('Enter unlock code to purchase:');
      if (!code) return;

      const normalized = code.trim().toUpperCase();
      const VALID_CODE = 'TESTCODE'; // use whatever code you want, just keep it uppercase here

      if (normalized === VALID_CODE) {
        this.hasPurchasedCouponBook = true;

        try {
          const groupId = this.group?.id || this.$route.params.id;
          if (groupId) {
            const key = `${PURCHASE_KEY_PREFIX}${groupId}`;
            localStorage.setItem(key, 'purchased');
          }
        } catch (e) {
          console.warn('[FoodieGroup] failed to persist purchase state', e);
        }

        alert(`✅ "${this.group?.name || 'Coupon Book'}" unlocked!`);
      } else {
        alert('❌ Invalid code. Please try again.');
      }
    },

    // Redeem handler – keep your existing route behavior, but gate by auth
    handleRedeemCoupon(coupon) {
      if (!coupon || coupon.redeemed_by_user) return;

      // 🔐 Not signed in → go straight to Cognito Hosted UI
      if (!this.isAuthenticated) {
        try {
          signIn(); // this triggers the Cognito hosted UI redirect
        } catch (e) {
          console.error('Sign-in redirect failed', e);
          alert('Something went wrong while redirecting to sign-in.');
        }
        return;
      }

      // ✅ Already signed in → go to redeem flow
      this.$router.push({ name: 'CouponRedeemPopup', params: { id: coupon.id } });
    },

    closeRedeem() {
      this.selectedCoupon = null;
      this.showRedeemDialog = false;
    },

    async confirmRedeem(coupon) {
      try {
        const res = await fetch(`/api/v1/coupons/${coupon.id}/redeem`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          if (res.status === 409) {
            alert('You have already redeemed this coupon.');
            this._markRedeemed(coupon.id, true);
            return this.closeRedeem();
          }
          throw new Error(text || `Redeem failed (status ${res.status})`);
        }

        const payload = await res.json().catch(() => ({}));
        this._markRedeemed(coupon.id, true, payload.redeemed_at);

        try {
          window.open(`/coupon-details/${coupon.id}`, '_blank');
        } catch (_) { alert("")}
      } catch (e) {
        alert(e.message || 'Failed to redeem. Please try again.');
      } finally {
        this.closeRedeem();
      }
    },

    _markRedeemed(couponId, isRedeemed = true, redeemedAt = new Date().toISOString()) {
      const idx = this.coupons.findIndex(c => String(c.id) === String(couponId));
      if (idx !== -1) {
        // Vue 2-friendly mutation
        this.$set(this.coupons[idx], 'redeemed_by_user', isRedeemed);
        this.$set(this.coupons[idx], 'redeemed_at', redeemedAt);
      }
    }
  }
};
</script>

<style scoped>
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

.social-links a {
  margin: 0 .5rem;
  padding: .5rem 1rem;
  background: #007bff;
  color: #fff;
  border-radius: 4px;
  text-decoration: none;
  transition: background .3s;
}

.social-links a:hover {
  background: #0056b3;
}

.container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.section-card {
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.purchase-banner {
  background: #f8f8f8;
  padding: 1rem;
  text-align: center;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.purchase-btn {
  margin-top: .5rem;
  background: #007bff;
  color: #fff;
  border: none;
  padding: .75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background .3s;
}

.purchase-btn:hover {
  background: #0056b3;
}

.error {
  color: red;
  margin-bottom: 1rem;
}

.map-section iframe {
  border: none;
  border-radius: 8px;
}
</style>
