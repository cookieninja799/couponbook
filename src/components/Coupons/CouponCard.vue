<template>
  <div class="coupon-card">
    <h3 class="coupon-title">{{ coupon.title }}</h3>
    
    <div class="merchant-info" v-if="coupon.merchantName">
      <img 
        v-if="coupon.merchantLogo" 
        :src="coupon.merchantLogo" 
        alt="Merchant Logo" 
        class="merchant-logo"
      />
      <span class="merchant-name">{{ coupon.merchantName }}</span>
    </div>
    
    <p class="coupon-description">{{ coupon.description }}</p>
    
    <div class="validity" v-if="coupon.valid_from && coupon.expires_at">
      <small>Valid from: {{ formatDate(coupon.valid_from) }}</small>
      <br>
      <small>Expires: {{ formatDate(coupon.expires_at) }}</small>
    </div>
    
    <!-- Main redeem button always shows "Redeem" -->
    <button 
      class="redeem-btn"
      @click="handleClick"
      :disabled="coupon.locked && !hasPurchasedCouponBook"
    >
      {{ buttonText }}
    </button>

    <!-- Locked overlay on individual coupon card -->
    <div v-if="coupon.locked && !hasPurchasedCouponBook" class="locked-overlay">
      <p>Locked: Purchase coupon book to unlock</p>
      <button class="redirect-btn" @click="redirectToGroup">
        Purchase {{ titleCase(coupon.foodieGroup) }} Coupon Book
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
    // Indicates if the user has purchased the coupon book.
    hasPurchasedCouponBook: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    buttonText() {
      return "Redeem";
    }
  },
  methods: {
    formatDate(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleDateString();
    },
    titleCase(str) {
      if (!str) return "";
      return str
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
    },
    handleClick() {
      if (this.coupon.locked && !this.hasPurchasedCouponBook) {
        // Redirect to purchase page.
        this.redirectToGroup();
      } else {
        this.$emit('redeem', this.coupon);
      }
    },
    redirectToGroup() {
      // Map the coupon.foodieGroup to a group id.
      const mapping = {
        'charlotte': 1,
        'raleigh': 2,
        'chapel hill': 3,
        'wnc': 4
      };
      // Using lowercase to avoid casing issues.
      const groupId = mapping[this.coupon.foodieGroup.toLowerCase()];
      if (groupId) {
        this.$router.push({ name: 'FoodieGroupView', params: { id: groupId } });
      } else {
        alert("Unable to determine group. Please contact support.");
      }
    }
  }
};
</script>

<style scoped>
.coupon-card {
  position: relative; /* Allow overlay positioning */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 250px;
  height: 450px;
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
  height: 80px;
  width: 80px;
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
}

.redeem-btn {
  background: #28a745;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  min-height: 50px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.redeem-btn:hover {
  background: #218838;
}

/* Locked overlay styles */
.locked-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255,255,255,0.8);
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
  transition: background-color 0.3s ease;
}

.redirect-btn:hover {
  background-color: #0056b3;
}
</style>
