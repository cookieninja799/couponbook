<template>
  <div class="coupon-list">
    <h2>Available Coupons</h2>
    <div class="coupons-container">
      <CouponCard 
        v-for="coupon in coupons" 
        :key="coupon.id" 
        :coupon="coupon" 
        :hasPurchasedCouponBook="hasPurchasedCouponBook"
        :isAuthenticated="isAuthenticated"
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
    hasPurchasedCouponBook: {
      type: Boolean,
      default: false
    },
    // 🔐 new prop
    isAuthenticated: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    handleRedeem(coupon) {
      this.$emit('redeem', coupon);
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
