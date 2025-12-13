<!-- src/views/CouponBook.vue -->
<template>
  <div class="coupon-book-view">
  
    <div class="content-wrapper">
      <!-- Sidebar Filters -->
      <SidebarFilters @filter-changed="updateFilters" />

      <!-- Main Content Area -->
      <div class="coupons-content">
        <h1>Vivaspot Community Coupons</h1>
        <p class="banner-description">
          Welcome to Vivaspot Community Coupons – your ultimate destination for exclusive savings from local merchants. 
          Whether you're looking for the latest foodie group deals or independent offers, explore a world of discounts and local flavor all in one place!
        </p>
        <!-- Active Filter Tags -->
        <div class="active-filter-tags">
          <span 
            v-if="filters.merchant" 
            class="filter-tag"
            @click="removeFilter('merchant')">
            Merchant: {{ filters.merchant }} &times;
          </span>
          <span 
            v-if="filters.title" 
            class="filter-tag"
            @click="removeFilter('title')">
            Title: {{ filters.title }} &times;
          </span>
          <span 
            v-if="filters.activeOnly" 
            class="filter-tag"
            @click="removeFilter('activeOnly')">
            Active Only &times;
          </span>
          <span 
            v-if="filters.couponType" 
            class="filter-tag"
            @click="removeFilter('couponType')">
            Type: {{ filters.couponType }} &times;
          </span>
          <span 
            v-if="filters.foodieGroup" 
            class="filter-tag"
            @click="removeFilter('foodieGroup')">
            Foodie Group: {{ filters.foodieGroup }} &times;
          </span>
          <span 
            v-if="filters.locked" 
            class="filter-tag"
            @click="removeFilter('locked')">
            Access: {{ filters.locked }} &times;
          </span>
          <span 
            v-if="filters.cuisineType" 
            class="filter-tag"
            @click="removeFilter('cuisineType')">
            Cuisine: {{ filters.cuisineType }} &times;
          </span>
        </div>

        <!-- Loading / Error States -->
        <p v-if="loading">Loading coupons…</p>
        <p v-else-if="error" class="error">⚠️ {{ error }}</p>

        <!-- Coupon List -->
        <CouponList
          v-else
          :coupons="filteredCoupons"
          :hasPurchasedCouponBook="hasPurchasedCouponBook"
          :isAuthenticated="isAuthenticated"
          @redeem="handleRedeem"
        />
      </div>
    </div>
  </div>
</template>

<script>
import CouponList from '@/components/Coupons/CouponList.vue';
import SidebarFilters from '@/components/Coupons/SidebarFilters.vue';
import { mapGetters } from 'vuex';

export default {
  name: "CouponBookView",
  components: { CouponList, SidebarFilters },
  data() {
    return {
      coupons: [],
      loading: true,
      error: null,
      filters: {
        merchant: "",
        title: "",
        activeOnly: false,
        couponType: "",
        foodieGroup: "",
        locked: "",
        cuisineType: ""
      },
      hasPurchasedCouponBook: false
    };
  },
  mounted() {
    this.fetchCoupons();
  },

  methods: {
    async fetchCoupons() {
      try {
        const res = await fetch('/api/v1/coupons');
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        this.coupons = await res.json();
      } catch (err) {
        console.error("Failed to load coupons", err);
        this.error = "Could not load coupons. " + err.message;
      } finally {
        this.loading = false;
      }
    },

    handleRedeem(coupon) {
      if (!this.isAuthenticated) {
        alert('Please sign in to redeem coupons.');
        return;
      }
      console.log("Redeeming coupon:", coupon);
      // You can route to FoodieGroup or open a popup here if you want
    },

    updateFilters(newFilters) {
      this.filters = newFilters;
    },

    removeFilter(key) {
      if (typeof this.filters[key] === "boolean") {
        this.filters[key] = false;
      } else {
        this.filters[key] = "";
      }
    }
  },

  computed: {
    ...mapGetters('auth', ['isAuthenticated']),

    filteredCoupons() {
      let filtered = this.coupons;

      // 🔒 Global rule: hide coupons expired ≥ 30 days ago
      const now = new Date();
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

      filtered = filtered.filter(c => {
        // if expires_at is missing, keep it (safety)
        if (!c.expires_at) return true;

        const expiresAt = new Date(c.expires_at);
        const diffMs = now.getTime() - expiresAt.getTime();

        // keep coupons that are not yet expired OR expired less than 30 days ago
        return diffMs < THIRTY_DAYS_MS;
      });

      if (this.filters.merchant) {
        filtered = filtered.filter(c =>
          (c.merchantName || "")
            .toLowerCase()
            .includes(this.filters.merchant.toLowerCase())
        );
      }

      if (this.filters.title) {
        filtered = filtered.filter(c =>
          (c.title || "").toLowerCase().includes(this.filters.title.toLowerCase())
        );
      }

      if (this.filters.activeOnly) {
        const nowInner = new Date();
        filtered = filtered.filter(c => {
          const validFrom = c.valid_from ? new Date(c.valid_from) : null;
          const expiresAt = c.expires_at ? new Date(c.expires_at) : null;

          if (validFrom && validFrom > nowInner) return false;
          if (expiresAt && expiresAt <= nowInner) return false;
          return true;
        });
      }

      if (this.filters.couponType) {
        filtered = filtered.filter(c => c.coupon_type === this.filters.couponType);
      }

      if (this.filters.foodieGroup) {
        filtered = filtered.filter(c =>
          c.foodie_group_id === this.filters.foodieGroup
        );
      }

      if (this.filters.locked) {
        filtered = filtered.filter(c =>
          this.filters.locked === "locked" ? c.locked === true : c.locked === false
        );
      }

      if (this.filters.cuisineType) {
        filtered = filtered.filter(c =>
          c.cuisine_type &&
          c.cuisine_type.toLowerCase() === this.filters.cuisineType.toLowerCase()
        );
      }

      return filtered;
    }
  }
};
</script>

<style scoped>
.coupon-book-view {
  padding: var(--spacing-2xl);
  color: var(--color-text-primary);
}

h1 {
  text-align: center;
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-5xl);
  color: var(--color-text-primary);
}

/* Banner Description */
.banner-description {
  font-size: var(--font-size-lg);
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-2xl);
  text-align: center;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  line-height: var(--line-height-normal);
}

/* Content Layout */
.content-wrapper {
  display: flex;
  gap: var(--spacing-2xl);
  margin: 0 auto;
}

/* Sidebar Filters */
.sidebar-filters {
  flex: 0 0 250px;
  background: var(--color-bg-primary);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

/* Main Content Area */
.coupons-content {
  flex: 1;
}

/* Active Filter Tags */
.active-filter-tags {
  margin-bottom: var(--spacing-lg);
}

.filter-tag {
  display: inline-block;
  background-color: var(--color-info);
  color: var(--color-text-on-info);
  padding: var(--spacing-xs) var(--spacing-md);
  margin: var(--spacing-xs);
  border-radius: var(--radius-full);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: background-color var(--transition-slow);
}

.filter-tag:hover {
  background-color: var(--color-info-hover);
  color: var(--color-text-on-info);
}

/* Fixed sidebar on larger screens */
@media (min-width: 768px) {
  .sidebar-filters {
    position: fixed;
    top: 300px;
    left: var(--spacing-xl);
    width: 250px;
  }

  .content-wrapper {
    margin-left: 290px; /* sidebar width + gap */
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .coupon-book-view {
    padding: var(--spacing-lg);
  }

  .content-wrapper {
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .sidebar-filters {
    position: relative;
    width: 100%;
  }
}

.loading {
  color: var(--color-text-secondary);
  text-align: center;
  padding: var(--spacing-xl);
}

.error {
  color: var(--color-error);
  text-align: center;
  padding: var(--spacing-xl);
  background: var(--color-error-light);
  background: rgba(176, 0, 32, 0.1);
  border: 1px solid var(--color-error-light);
  border-radius: var(--radius-md);
}
</style>
