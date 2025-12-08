<!-- src/views/FoodieGroup.vue -->
<template>
  <div v-if="!group" class="not-found">
    <p>Group not found.</p>
  </div>
  <div v-else>
    <!-- Dynamic Banner -->
    <header class="group-banner" :style="{ backgroundImage: `url(${group.bannerImageUrl || '/default-banner.jpg'})` }">
      <div class="banner-overlay">
        <div class="banner-content">
          <h1>{{ group.name }}</h1>
          <p>{{ group.description }}</p>
          <div class="social-links" v-if="group.socialLinks">
            <a v-if="group.socialLinks.facebook" :href="group.socialLinks.facebook" target="_blank">Facebook</a>
            <a v-if="group.socialLinks.instagram" :href="group.socialLinks.instagram" target="_blank">Instagram</a>
            <a v-if="group.socialLinks.twitter" :href="group.socialLinks.twitter" target="_blank">Twitter</a>
          </div>
        </div>
      </div>
    </header>

    <div class="foodie-group-view container">
      <!-- Purchase Coupon Book Banner -->
      <div v-if="!hasPurchasedCouponBook" class="purchase-banner">
        <p>Purchase the coupon book to unlock all group coupons and RSVP for events.</p>
        <button @click="onPurchaseClick" class="purchase-btn">Purchase Coupon Book</button>
      </div>

      <!-- Coupons Section -->
      <section class="coupons-section section-card">
        <h2>Group Coupons</h2>

        <div class="coupons-layout">
          <!-- 🧱 LEFT: sidebar filters -->
          <aside class="coupons-sidebar">
            <SidebarFilters @filter-changed="updateFilters" />

            <!-- Active filter chips -->
            <div class="active-filter-tags">
              <span v-if="filters.keyword" class="filter-tag" @click="removeFilter('keyword')">
                Keyword: {{ filters.keyword }} &times;
              </span>

              <span v-if="filters.activeOnly" class="filter-tag" @click="removeFilter('activeOnly')">
                Active Only &times;
              </span>

              <span v-if="filters.couponType" class="filter-tag" @click="removeFilter('couponType')">
                Type: {{ filters.couponType }} &times;
              </span>

              <span v-if="filters.cuisineType" class="filter-tag" @click="removeFilter('cuisineType')">
                Cuisine: {{ filters.cuisineType }} &times;
              </span>
            </div>

          </aside>

          <!-- 📄 RIGHT: coupons list -->
          <div class="coupons-main">

            <p v-if="loadingCoupons">Loading coupons…</p>
            <p v-else-if="couponError" class="error">⚠️ {{ couponError }}</p>

            <CouponList v-else :coupons="filteredCoupons" :hasPurchasedCouponBook="hasPurchasedCouponBook"
              :isAuthenticated="isAuthenticated" @redeem="handleRedeemCoupon" />
          </div>
        </div>
      </section>

      <!-- Events Section Wrapped with OverlayBlock -->
      <section v-if="false" class="events-section section-card">
        <OverlayBlock :is-dimmed="true" title="Events are coming soon!"
          message="Our events feature is in preview and will be unlocked soon for Foodie Groups." cta-text="Notify Me"
          @cta="alert('You’ll be notified when events are live!')">
          <h2>Group Events</h2>
          <EventList :events="events" :hasAccess="hasPurchasedCouponBook" />
        </OverlayBlock>
      </section>

      <!-- Map Section -->
      <section v-if="false" class="map-section section-card">
        <h2>Location</h2>
        <iframe v-if="mapUrl" width="100%" height="300" frameborder="0" style="border:0" :src="mapUrl"
          allowfullscreen />
      </section>
    </div>
  </div>
</template>

<script>
import CouponList from '@/components/Coupons/CouponList.vue';
import EventList from '@/components/Events/EventList.vue';
import SidebarFilters from '@/components/Coupons/SidebarFilters.vue';
import OverlayBlock from '@/components/Common/OverlayBlock.vue';
import { mapGetters } from 'vuex';
import { signIn, getAccessToken } from '@/services/authService';

export default {
  name: 'FoodieGroupView',
  components: { CouponList, EventList, OverlayBlock, SidebarFilters },

  data() {
    return {
      group: null,
      hasPurchasedCouponBook: false,
      coupons: [],
      loadingCoupons: true,
      couponError: null,
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
      ],
      filters: {
        keyword: '',
        activeOnly: false,
        couponType: '',
        cuisineType: ''
      }

    };
  },

  created() {
    const id = this.$route.params.id;
    this.fetchGroup(id);
    this.fetchCoupons(id);

    // If already authenticated on load, immediately check DB-backed access
    if (this.isAuthenticated) {
      this.fetchAccess(id);
    }

    // 📨 Listen for redemption messages from popup
    window.addEventListener('message', this.onCouponRedeemedMessage);
  },

  beforeUnmount() {
    window.removeEventListener('message', this.onCouponRedeemedMessage);
  },

  computed: {
    ...mapGetters('auth', ['isAuthenticated']),

    filteredCoupons() {
      let filtered = this.coupons;

      // 🔒 Global rule: hide coupons expired ≥ 30 days ago
      const now = new Date();
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

      filtered = filtered.filter(c => {
        if (!c.expires_at) return true; // safety if null
        const expiresAt = new Date(c.expires_at);
        const diffMs = now.getTime() - expiresAt.getTime();
        // keep coupons that are not expired yet OR expired less than 30 days ago
        return diffMs < THIRTY_DAYS_MS;
      });

      // 🔎 Keyword search (merchant, title, description, cuisine)
      if (this.filters.keyword) {
        const kw = this.filters.keyword.toLowerCase();
        filtered = filtered.filter(c => {
          const fields = [
            c.merchant_name,
            c.title,
            c.description,
            c.cuisine_type
          ];
          return fields.some(f =>
            (f || '').toLowerCase().includes(kw)
          );
        });
      }

      // Active only (valid_from <= now <= expires_at)
      if (this.filters.activeOnly) {
        filtered = filtered.filter(c => {
          const start = c.valid_from ? new Date(c.valid_from) : null;
          const end = c.expires_at ? new Date(c.expires_at) : null;

          if (start && start > now) return false;
          if (end && end < now) return false;
          return true;
        });
      }

      // Coupon type
      if (this.filters.couponType) {
        filtered = filtered.filter(c =>
          (c.coupon_type || '').toLowerCase() ===
          this.filters.couponType.toLowerCase()
        );
      }

      // Cuisine type
      if (this.filters.cuisineType) {
        filtered = filtered.filter(c =>
          c.cuisine_type &&
          c.cuisine_type.toLowerCase() ===
          this.filters.cuisineType.toLowerCase()
        );
      }

      return filtered;
    },

    mapUrl() {
      if (!this.group?.mapCoordinates) return '';
      const { lat, lng } = this.group.mapCoordinates;
      const key = process.env.VUE_APP_GOOGLE_MAPS_API_KEY;
      return `https://www.google.com/maps/embed/v1/view?key=${key}&center=${lat},${lng}&zoom=12`;
    }
  },

  watch: {
    isAuthenticated(newVal) {
      const id = this.$route.params.id;
      if (newVal && id) {
        // logged in → refresh access from server + hydrate redemptions
        this.fetchAccess(id);
        this.fetchRedemptionsMe();
      } else if (!newVal) {
        // logged out → clear access flag
        this.hasPurchasedCouponBook = false;
      }
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

        // After coupons load, hydrate redeemed state if logged in
        if (this.isAuthenticated) {
          this.fetchRedemptionsMe();
        }
      }
    },

    // Hydrate redeemed coupons from DB (/api/v1/coupons/redemptions/me)
    async fetchRedemptionsMe() {
      try {
        const token = await getAccessToken();
        if (!token) return;

        console.log('📦  GET /api/v1/coupons/redemptions/me from FoodieGroup.vue');
        const res = await fetch('/api/v1/coupons/redemptions/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          console.warn('[FoodieGroup] redemptions/me failed', res.status);
          return;
        }

        const rows = await res.json();
        // rows: [{ couponId, redeemedAt }, …]
        rows.forEach(r => {
          this._markRedeemed(r.couponId, true, r.redeemedAt || new Date().toISOString());
        });
      } catch (e) {
        console.error('[FoodieGroup] failed to hydrate redemptions', e);
      }
    },

    // DB-backed access check using Cognito access token
    async fetchAccess(groupId) {
      this.hasPurchasedCouponBook = false;

      try {
        const token = await getAccessToken();
        if (!token) {
          console.log('[FoodieGroup] No access token available, treating as no purchase');
          return;
        }

        console.log('📦  GET /api/v1/groups/:id/access from FoodieGroup.vue', groupId);
        const res = await fetch(`/api/v1/groups/${groupId}/access`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          console.warn('[FoodieGroup] access check failed', res.status);
          return;
        }

        const payload = await res.json();
        this.hasPurchasedCouponBook = !!payload.hasAccess;
        console.log('[FoodieGroup] hasPurchasedCouponBook =', this.hasPurchasedCouponBook);
      } catch (e) {
        console.error('[FoodieGroup] failed to fetch access state', e);
      }
    },

    // Redeem handler – gated by auth + DB-backed purchase, opens popup
    handleRedeemCoupon(coupon) {
      if (!coupon || coupon.redeemed_by_user) return;

      // Not signed in → go to Cognito Hosted UI
      if (!this.isAuthenticated) {
        try {
          signIn();
        } catch (e) {
          console.error('Sign-in redirect failed', e);
          alert('Something went wrong while redirecting to sign-in.');
        }
        return;
      }

      // Signed in but no purchase → block redemption
      if (!this.hasPurchasedCouponBook) {
        alert('Please purchase this coupon book to redeem offers.');
        return;
      }

      // Signed in + purchased → open popup window to CouponRedeemPopup route
      const route = this.$router.resolve({
        name: 'CouponRedeemPopup',
        params: { id: coupon.id }
      });

      const url = route && route.href ? route.href : `/coupon-redeem/${coupon.id}`;

      window.open(
        url,
        'coupon-redeem',
        'width=520,height=720,noopener,noreferrer'
      );
    },

    // Handle postMessage from CouponRedeemPopup
    onCouponRedeemedMessage(event) {
      const data = event && event.data;
      if (!data || data.type !== 'coupon-redeemed') return;

      const couponId = data.couponId;
      if (!couponId) return;

      console.log('[FoodieGroup] received coupon-redeemed message for', couponId);
      this._markRedeemed(couponId, true, new Date().toISOString());
    },

    _markRedeemed(
      couponId,
      isRedeemed = true,
      redeemedAt = new Date().toISOString()
    ) {
      const idx = this.coupons.findIndex(
        c => String(c.id) === String(couponId)
      );
      if (idx === -1) return;

      // Create an updated copy of the coupon
      const updated = {
        ...this.coupons[idx],
        redeemed_by_user: isRedeemed,
        redeemed_at: redeemedAt,
      };

      // Use splice so Vue 3 tracks the change reactively
      this.coupons.splice(idx, 1, updated);
    },

    // Click handler for "Purchase Coupon Book" banner
    onPurchaseClick() {
      const groupId = this.$route.params.id;

      // If not authenticated, send to sign-in first
      if (!this.isAuthenticated) {
        try {
          signIn();
        } catch (e) {
          console.error('[FoodieGroup] sign-in redirect failed', e);
          alert('Something went wrong while redirecting to sign-in.');
        }
        return;
      }

      const raw = window.prompt('Enter unlock code to purchase:');
      if (!raw) return;

      const code = raw.trim().toUpperCase();
      this.unlockWithTestCode(groupId, code);
    },

    // Call dev-only /test-purchase endpoint with TESTCODE
    async unlockWithTestCode(groupId, code) {
      try {
        const token = await getAccessToken();
        if (!token) {
          console.warn('[FoodieGroup] no access token while unlocking with code');
          alert('Please sign in again to unlock this coupon book.');
          return;
        }

        console.log('📦  POST /api/v1/groups/:id/test-purchase from FoodieGroup.vue', {
          groupId,
          code
        });

        const res = await fetch(`/api/v1/groups/${groupId}/test-purchase`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ code })
        });

        if (!res.ok) {
          let problem = {};
          try {
            problem = await res.json();
          } catch (_) { /* ignore */ }
          const msg = problem.error || `Unlock failed (status ${res.status}).`;
          alert(msg);
          return;
        }

        const payload = await res.json().catch(() => ({}));
        const hasAccess = !!payload.hasAccess;

        this.hasPurchasedCouponBook = hasAccess;

        if (hasAccess) {
          alert('Coupon book unlocked for your account!');
        } else {
          alert('Unlock did not succeed. Please check the code and try again.');
        }

        // Re-check access from server for consistency
        if (this.isAuthenticated) {
          await this.fetchAccess(groupId);
        }
      } catch (e) {
        console.error('[FoodieGroup] failed to unlock with test code', e);
        alert('Failed to unlock. Please try again.');
      }
    },

    updateFilters(newFilters) {
      this.filters = newFilters;
    },

    removeFilter(key) {
      if (typeof this.filters[key] === 'boolean') {
        this.filters[key] = false;
      } else {
        this.filters[key] = '';
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

.coupons-layout {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  margin-top: 1rem;
}

/* left column: filters */
.coupons-sidebar {
  flex: 0 0 260px;
  max-width: 260px;
}

/* right column: coupons */
.coupons-main {
  flex: 1;
  min-width: 0;
}

.coupons-main-title {
  margin-top: 0;
  margin-bottom: 1rem;
}

/* filter chips */
.active-filter-tags {
  margin-top: 1rem;
}

.filter-tag {
  display: inline-block;
  background-color: #3498db;
  color: #fff;
  padding: 0.4rem 0.8rem;
  margin: 0.2rem 0.2rem 0 0;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background-color 0.2s ease;
}

.filter-tag:hover {
  background-color: #217dbb;
}

/* 📱 Mobile: stack sidebar above coupons */
@media (max-width: 768px) {
  .coupons-layout {
    flex-direction: column;
  }

  .coupons-sidebar {
    flex: 1 1 auto;
    max-width: 100%;
  }

  .coupons-main-title {
    margin-top: 1rem;
    text-align: left;
  }
}
</style>
