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
            <SidebarFilters 
              :availableCuisines="availableCuisines"
              @filter-changed="updateFilters" 
            />

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
import { ensureCouponsHaveCuisine } from '@/utils/helpers';

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

    /**
     * Derive available cuisine types from loaded coupons (data-driven).
     */
    availableCuisines() {
      const cuisineSet = new Set();
      for (const c of this.coupons) {
        const cuisine = c.cuisine_type || c.cuisineType;
        if (cuisine && typeof cuisine === 'string' && cuisine.trim()) {
          cuisineSet.add(cuisine.trim());
        }
      }
      return Array.from(cuisineSet)
        .sort((a, b) => a.localeCompare(b))
        .map(c => ({ value: c, label: c }));
    },

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

      // Sort: active coupons first, followed by redeemed, then expired/not-yet-valid last
      const getPriority = (c) => {
        if (c.redeemed_by_user) return 2;
        if (c.expires_at && new Date(c.expires_at) < now) return 3;
        if (c.valid_from && new Date(c.valid_from) > now) return 3;
        return 1; // Redeemable
      };

      filtered.sort((a, b) => getPriority(a) - getPriority(b));

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
        const allPayload = await res.json();
        const all = ensureCouponsHaveCuisine(allPayload);
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
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.4) 0%,
    rgba(0, 0, 0, 0.7) 50%,
    rgba(0, 0, 0, 0.7) 100%
  );
  backdrop-filter: blur(1px);
  -webkit-backdrop-filter: blur(1px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-content {
  text-align: center;
  color: #FFFFFF;
  padding: var(--spacing-lg);
  position: relative;
  z-index: 1;
}

.banner-content h1 {
  font-size: var(--font-size-5xl);
  margin-bottom: var(--spacing-sm);
  text-shadow: 
    2px 2px 4px rgba(0, 0, 0, 0.9),
    0 0 10px rgba(0, 0, 0, 0.7),
    0 0 20px rgba(0, 0, 0, 0.5);
  color: #FFFFFF;
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  letter-spacing: -0.02em;
}

.banner-content p {
  font-size: var(--font-size-xl);
  margin-bottom: var(--spacing-lg);
  text-shadow: 
    1px 1px 3px rgba(0, 0, 0, 0.9),
    0 0 8px rgba(0, 0, 0, 0.6),
    0 0 15px rgba(0, 0, 0, 0.4);
  color: #FFFFFF;
  line-height: var(--line-height-normal);
  font-weight: var(--font-weight-medium);
}

@media (max-width: 768px) {
  .banner-content h1 {
    font-size: var(--font-size-4xl);
  }

  .banner-content p {
    font-size: var(--font-size-lg);
  }
  
  .banner-overlay {
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.5) 0%,
      rgba(0, 0, 0, 0.75) 50%,
      rgba(0, 0, 0, 0.75) 100%
    );
  }
  
  .banner-content {
    padding: var(--spacing-md);
  }
}

.social-links {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.social-links a {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-secondary);
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #FFFFFF !important;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: all var(--transition-slow);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  font-weight: var(--font-weight-medium);
  min-height: var(--button-height-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.social-links a:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.3);
  color: #FFFFFF !important;
  border-color: rgba(255, 255, 255, 0.5);
}

.container {
  max-width: var(--container-xl);
  margin: var(--spacing-2xl) auto;
  padding: 0 var(--spacing-2xl);
}

.section-card {
  background: var(--color-bg-primary);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--spacing-2xl);
  color: var(--color-text-primary);
}

.section-card h2 {
  color: var(--color-text-primary);
}

.section-card p {
  color: var(--color-text-primary);
}

.purchase-banner {
  background: var(--color-bg-muted);
  padding: var(--spacing-lg);
  text-align: center;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-lg);
}

.purchase-btn {
  margin-top: var(--spacing-sm);
  background: var(--color-secondary);
  color: var(--color-text-inverse);
  border: none;
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-slow);
  min-height: var(--button-height-md);
  font-weight: var(--font-weight-medium);
}

.purchase-btn:hover {
  background: var(--color-secondary-hover);
}

.error {
  color: var(--color-error);
  margin-bottom: var(--spacing-lg);
}

.map-section iframe {
  border: none;
  border-radius: var(--radius-lg);
}

.coupons-layout {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-xl);
  margin-top: var(--spacing-lg);
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
  margin-bottom: var(--spacing-lg);
}

/* filter chips */
.active-filter-tags {
  margin-top: var(--spacing-lg);
}

.filter-tag {
  display: inline-block;
  background-color: var(--color-info);
  color: var(--color-text-on-info);
  padding: var(--spacing-xs) var(--spacing-md);
  margin: var(--spacing-xs) var(--spacing-xs) 0 0;
  border-radius: var(--radius-full);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: background-color var(--transition-base);
}

.filter-tag:hover {
  background-color: var(--color-info-hover);
  color: var(--color-text-on-info);
}

/* 📱 Mobile: stack sidebar above coupons */
@media (max-width: 768px) {
  .container {
    padding: 0 var(--spacing-lg);
  }

  .coupons-layout {
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .coupons-sidebar {
    flex: 1 1 auto;
    max-width: 100%;
  }

  .coupons-main-title {
    margin-top: var(--spacing-lg);
    text-align: left;
  }
}
</style>
