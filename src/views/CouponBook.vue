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

        <!-- Coupon List -->
        <CouponList 
          :coupons="filteredCoupons" 
          :hasPurchasedCouponBook="hasPurchasedCouponBook"
          @redeem="handleRedeem" 
        />
      </div>
    </div>
  </div>
</template>

<script>
import CouponList from '@/components/Coupons/CouponList.vue';
import SidebarFilters from '@/components/Coupons/SidebarFilters.vue';
import samplecoupons from '@/data/samplecoupons.js';

export default {
  name: "CouponBookView",
  components: { CouponList, SidebarFilters },
  data() {
    return {
      coupons: samplecoupons,
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
  computed: {
    filteredCoupons() {
      let filtered = this.coupons;
      if (this.filters.merchant) {
        filtered = filtered.filter(coupon =>
          coupon.merchantName.toLowerCase().includes(this.filters.merchant.toLowerCase())
        );
      }
      if (this.filters.title) {
        filtered = filtered.filter(coupon =>
          coupon.title.toLowerCase().includes(this.filters.title.toLowerCase())
        );
      }
      if (this.filters.activeOnly) {
        const now = new Date();
        filtered = filtered.filter(coupon => {
          const validFrom = new Date(coupon.valid_from);
          const expiresAt = new Date(coupon.expires_at);
          return validFrom <= now && expiresAt > now;
        });
      }
      if (this.filters.couponType) {
        filtered = filtered.filter(coupon => coupon.couponType === this.filters.couponType);
      }
      if (this.filters.foodieGroup) {
        filtered = filtered.filter(coupon => coupon.foodieGroup === this.filters.foodieGroup);
      }
      if (this.filters.locked) {
        if (this.filters.locked === "locked") {
          filtered = filtered.filter(coupon => coupon.locked === true);
        } else if (this.filters.locked === "unlocked") {
          filtered = filtered.filter(coupon => coupon.locked === false);
        }
      }
      if (this.filters.cuisineType) {
        filtered = filtered.filter(coupon =>
          coupon.cuisineType &&
          coupon.cuisineType.toLowerCase() === this.filters.cuisineType.toLowerCase()
        );
      }
      return filtered;
    }
  },
  methods: {
    handleRedeem(coupon) {
      console.log("Redeeming coupon:", coupon);
      // Redemption logic here.
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
  }
};
</script>

<style scoped>
.coupon-book-view {
  padding: 2rem;
}
h1 {
  text-align: center;
  margin-bottom: 0.5rem;
  font-size: 2.5rem;
  color: #2c3e50;
}
/* Banner Description */
.banner-description {
  font-size: 1.2rem;
  color: #7f8c8d;
  margin-bottom: 2rem;
  text-align: center;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.5;
}

/* Content Layout */
.content-wrapper {
  display: flex;
  gap: 2rem;
  margin: 0 auto;
}

/* Sidebar Filters */
.sidebar-filters {
  flex: 0 0 250px;
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

/* Main Content Area */
.coupons-content {
  flex: 1;
}

/* Active Filter Tags */
.active-filter-tags {
  margin-bottom: 1rem;
}

.filter-tag {
  display: inline-block;
  background-color: #3498db;
  color: #fff;
  padding: 0.4rem 0.8rem;
  margin: 0.2rem;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s ease;
}

.filter-tag:hover {
  background-color: #2980b9;
}

/* Fixed sidebar on larger screens */
@media (min-width: 768px) {
  .sidebar-filters {
    position: fixed;
    top: 300px;
    left: 20px;
    width: 250px;
  }
  .content-wrapper {
    margin-left: 290px; /* sidebar width + gap */
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .content-wrapper {
    flex-direction: column;
  }
  .sidebar-filters {
    position: relative;
    width: 100%;
  }
}
</style>
