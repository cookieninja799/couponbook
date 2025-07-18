<!---src/components/Coupons/CouponCard.vue-->
<template>
  <div class="coupon-card">
    <h3 class="coupon-title">{{ coupon.title }}</h3>
    
    <div class="merchant-info" v-if="coupon.merchant_name">
      <img 
        v-if="coupon.merchant_logo" 
        :src="coupon.merchant_logo" 
        :alt="`Logo for ${coupon.merchant_name}`" 
        class="merchant-logo"
      />
      <img
        :src="coupon.merchant_logo || '/logo.png'"
        :alt="`Logo for ${coupon.merchant_name || 'Merchant'}`"
        class="merchant-logo"
      />
      <span class="merchant-name">{{ coupon.merchant_name }}</span>
    </div>
    
    <p class="coupon-description">{{ coupon.description }}</p>
    
    <div class="validity" v-if="coupon.valid_from && coupon.expires_at">
      <small>Valid from: {{ formatDate(coupon.valid_from) }}</small><br>
      <small>Expires: {{ formatDate(coupon.expires_at) }}</small>
    </div>
    
    <button 
      class="redeem-btn"
      @click="handleClick"
      :disabled="isLocked && !hasPurchasedCouponBook"
    >
      Redeem
    </button>

  
      <div v-if="isLocked && !hasPurchasedCouponBook" class="locked-overlay">
        <p>Locked: Join coupon book to unlock</p>
        <button class="redirect-btn" @click="redirectToGroup">
          Join {{ coupon.foodie_group_name }} Coupon Book
        </button>
      </div>
  </div>
  
</template>

<script>
export default {
  name: "CouponCard",
  props: {
    coupon: {
      type: Object,
      required: true
    },
    hasPurchasedCouponBook: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    // Always unlocked for Vivaspot Community
    isLocked() {
      if (this.coupon.foodie_group_name === 'Vivaspot Community') {
        return false;
      }
      return this.coupon.locked;
    }
  },
  methods: {
    formatDate(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleDateString();
    },
    handleClick() {
      if (this.isLocked && !this.hasPurchasedCouponBook) {
        this.redirectToGroup();
      } else {
        this.$emit('redeem', this.coupon);
      }
    },
    redirectToGroup() {
      const groupId = this.coupon.foodie_group_id;
      if (groupId) {
        this.$router.push({ 
          name: 'FoodieGroupView', 
          params: { id: groupId } 
        });
      } else {
        alert("Unable to determine group. Please contact support.");
      }
    }
  }
};
</script>

<style scoped>
.coupon-card {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 250px;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #fff;
  text-align: center;
}

.coupon-title {
  font-size: 1.3rem;
  color: #333;
}

.merchant-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1rem;
}

.merchant-logo {
  width: 80px;
  height: 80px;
  object-fit: contain;
  border-radius: 50%;
  border: 2px solid #ddd;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  margin-bottom: 0.5rem;
}

.merchant-name {
  font-weight: bold;
  font-size: 0.9rem;
}

.coupon-description {
  font-size: 1.1rem;
}

.validity {
  font-size: 0.8rem;
  color: #555;
  margin: .5rem 0;
}

.redeem-btn {
  background: #28a745;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  min-height: 50px;
}

.redeem-btn:hover {
  background: #218838;
}

.locked-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255,255,255,0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #555;
  border-radius: 4px;
}

.redirect-btn {
  margin-top: 0.5rem;
  background-color: #007bff;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.redirect-btn:hover {
  background-color: #0056b3;
}
</style>
