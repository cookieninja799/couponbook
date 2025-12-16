<template>
  <div class="coupon-list">
    <h2>Available Coupons</h2>
    <div class="coupons-container">
      <CouponCard 
        v-for="coupon in coupons" 
        :key="coupon.id" 
        :coupon="coupon" 
        :hasPurchasedCouponBook="hasPurchasedForCoupon(coupon)"
        :isAuthenticated="isAuthenticated"
        :forceGoToGroupForFoodieGroupCoupons="forceGoToGroupForFoodieGroupCoupons"
        @redeem="handleRedeem"
        @purchase-coupon-book="$emit('purchase-coupon-book', $event)"
      />
    </div>
  </div>
</template>

<script>
import CouponCard from './CouponCard.vue';

export default {
  name: "CouponList",
  components: { CouponCard },
  props: {
    coupons: {
      type: Array,
      default: () => []
    },
    // Single-group mode: used on FoodieGroup.vue
    hasPurchasedCouponBook: {
      type: Boolean,
      default: false
    },
    // Multi-group mode: used on CouponBook.vue (Local Coupons)
    purchasedGroupIds: {
      type: Array,
      default: () => []
    },
    isAuthenticated: {
      type: Boolean,
      default: false
    },
    // When true, foodie group coupons show "Go to ... Coupon Book" instead of direct redeem
    forceGoToGroupForFoodieGroupCoupons: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    handleRedeem(coupon) {
      this.$emit('redeem', coupon);
    },

    /**
     * Determine if the user has purchased the coupon book for this coupon's group.
     * - If purchasedGroupIds is provided (multi-group mode), check if coupon's group is in the list.
     * - Otherwise, fall back to hasPurchasedCouponBook (single-group mode).
     */
    hasPurchasedForCoupon(coupon) {
      // Multi-group mode: check per-coupon
      if (this.purchasedGroupIds && this.purchasedGroupIds.length > 0) {
        return this.purchasedGroupIds.includes(coupon.foodie_group_id);
      }
      // Single-group mode: use the single boolean
      return this.hasPurchasedCouponBook;
    }
  }
};
</script>

<style scoped>
.coupon-list {
  padding: var(--spacing-lg);
  text-align: center;
  color: var(--color-text-primary);
}

.coupon-list h2 {
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-lg);
}

.coupons-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--spacing-lg);
}

@media (max-width: 768px) {
  .coupon-list {
    padding: var(--spacing-md);
  }
  
  .coupons-container {
    gap: var(--spacing-md);
  }
}
</style>
