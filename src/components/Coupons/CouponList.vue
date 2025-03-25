<template>
  <div class="coupon-list">
    <h2>Available Coupons</h2>
    <div class="coupons-container">
      <CouponCard 
        v-for="coupon in coupons" 
        :key="coupon.id" 
        :coupon="coupon" 
        :hasPurchasedCouponBook="hasPurchasedCouponBook"
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
  padding: 1rem;
  text-align: center;
}
.coupons-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
}
</style>
