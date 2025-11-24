<template>
  <div class="coupon-card">
    <h3 class="coupon-title">{{ coupon.title }}</h3>

    <div class="merchant-info" v-if="coupon.merchant_name">
      <img
        :src="coupon.merchant_logo || '/logo.png'"
        :alt="`Logo for ${coupon.merchant_name}`"
        class="merchant-logo"
      />
      <span class="merchant-name">{{ coupon.merchant_name }}</span>
    </div>

    <p class="coupon-description">{{ coupon.description }}</p>

    <div class="validity" v-if="coupon.valid_from && coupon.expires_at">
      <small>Valid from: {{ formatDate(coupon.valid_from) }}</small><br />
      <small>Expires: {{ formatDate(coupon.expires_at) }}</small>
    </div>

    <!-- Button with dynamic label + disabled logic -->
    <button
      class="action-btn"
      :class="buttonClass"
      :disabled="isDisabled"
      @click="handleClick"
    >
      {{ buttonLabel }}
    </button>
  </div>
</template>

<script>
import { signIn } from '@/services/authService';

export default {
  name: 'CouponCard',
  props: {
    coupon: { type: Object, required: true },
    hasPurchasedCouponBook: { type: Boolean, default: false },
    isAuthenticated: { type: Boolean, default: false } // from Vuex getter or parent
  },

  computed: {
    /** 🟥 Is coupon expired? */
    isExpired() {
      if (!this.coupon.expires_at) return false;
      return new Date(this.coupon.expires_at) < new Date();
    },

    /** 🟨 Is coupon not yet active? */
    isNotYetValid() {
      if (!this.coupon.valid_from) return false;
      return new Date(this.coupon.valid_from) > new Date();
    },

    /** 🔒 Is coupon locked? */
    isLocked() {
      return (
        this.coupon.foodie_group_name !== 'Vivaspot Community' &&
        this.coupon.locked
      );
    },

    /** 🧠 Unified metadata state */
    redeemStatus() {
      if (this.coupon.redeemed_by_user) return 'redeemed';
      if (this.isExpired) return 'expired';
      if (this.isNotYetValid) return 'not-yet-valid';
      if (!this.isAuthenticated) return 'login';
      if (this.isLocked && !this.hasPurchasedCouponBook) return 'locked';
      return 'active';
    },

    /** 🏷 Label text for button */
    buttonLabel() {
      switch (this.redeemStatus) {
        case 'redeemed':
          return '✅ Redeemed';
        case 'expired':
          return 'Expired';
        case 'not-yet-valid':
          return 'Not yet valid';
        case 'login':
          return 'Sign in to redeem';
        case 'locked':
          return `🔒 Join ${this.coupon.foodie_group_name} Coupon Book`;
        default:
          return 'Redeem';
      }
    },

    /** ⛔ Disable button for everything except active coupons */
    isDisabled() {
      return this.coupon.redeemed_by_user || this.isExpired;
    },

    /** 🎨 Button color theme */
    buttonClass() {
      if (this.coupon.redeemed_by_user || this.isExpired) {
        return "btn-gray";
      }
      if (!this.isAuthenticated) {
        return "btn-tertiary"; 
      }
      if (this.isLocked && !this.hasPurchasedCouponBook) {
        return "btn-primary";
      }
      return "btn-secondary";
    }
  },

  methods: {
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString();
    },

    handleClick() {
      if (this.isDisabled) return;

      // Not authenticated → redirect to Cognito
      if (this.redeemStatus === 'login') {
        try {
          signIn();
        } catch (e) {
          console.error(e);
        }
        return;
      }

      // Locked + not purchased → redirect to group
      if (this.redeemStatus === 'locked') {
        this.redirectToGroup();
        return;
      }

      // Active → emit redeem event
      this.$emit('redeem', this.coupon);
    },

    redirectToGroup() {
      const groupId = this.coupon.foodie_group_id;
      if (!groupId) {
        alert('Unable to determine group. Please contact support.');
        return;
      }

      this.$router.push({
        name: 'FoodieGroupView',
        params: { id: groupId }
      });
    }
  }
};
</script>

<style scoped>
/* SAME STYLES AS YOUR VERSION – unchanged */

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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
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

.action-btn {
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  min-height: 48px;
  transition: background 0.2s ease, opacity 0.2s ease;
  width: 100%;
  color: #fff;
}

.btn-primary {
  background-color: #007bff;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #28a745;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #218838;
}

.btn-tertiary {
  background-color: #dd6146;
}

.btn-tertiary:hover:not(:disabled) {
  background-color: #be3f22;
}

.btn-gray {
  background-color: #6c757d;
  cursor: default;
}

.action-btn:disabled {
  opacity: 0.65;
  cursor: default;
}

@media (max-width: 480px) {
  .coupon-card {
    width: 100%;
    max-width: 360px;
    margin: 0 auto;
  }
}
</style>
