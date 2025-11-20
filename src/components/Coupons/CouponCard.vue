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

    <button
      class="action-btn"
      :class="{ locked: isLocked && !hasPurchasedCouponBook }"
      :disabled="isDisabled"
      @click="handleClick"
    >
      <template v-if="coupon.redeemed_by_user">
        ✅ Redeemed
      </template>
      <template v-else-if="isLocked && !hasPurchasedCouponBook">
        🔒 Join {{ coupon.foodie_group_name }} Coupon Book
      </template>
      <template v-else-if="!isAuthenticated">
        Sign in to redeem
      </template>
      <template v-else>
        Redeem
      </template>
    </button>
  </div>
</template>

<script>
import { signIn } from '@/services/authService';

export default {
  name: 'CouponCard',
  props: {
    coupon: {
      type: Object,
      required: true
    },
    hasPurchasedCouponBook: {
      type: Boolean,
      default: false
    },
    // 🔐 whether current user is logged in
    isAuthenticated: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    // Vivaspot Community is always unlocked
    isLocked() {
      return (
        this.coupon.foodie_group_name !== 'Vivaspot Community' &&
        this.coupon.locked
      );
    },

    // Only disable if already redeemed
    isDisabled() {
      return !!this.coupon.redeemed_by_user;
    }
  },
  methods: {
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString();
    },

    handleClick() {
      // 🔒 Locked & not purchased: send them to the group page
      if (this.isLocked && !this.hasPurchasedCouponBook) {
        this.redirectToGroup();
        return;
      }

      // 🔐 Not logged in, unlocked coupon → go to Cognito Hosted UI
      if (!this.isAuthenticated && !this.isLocked) {
        try {
          signIn(); // from authService.js → UserManager.signinRedirect()
        } catch (e) {
          console.error('Sign-in redirect failed', e);
        }
        return;
      }

      // ✅ Logged-in + has access → emit redeem
      this.$emit('redeem', this.coupon);
    },

    redirectToGroup() {
      const groupId = this.coupon.foodie_group_id;
      if (groupId) {
        this.$router.push({
          name: 'FoodieGroupView',
          params: { id: groupId }
        });
      } else {
        alert('Unable to determine group. Please contact support.');
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

.coupon-title { font-size: 1.3rem; color: #333; }

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

.merchant-name { font-weight: bold; font-size: 0.9rem; }

.coupon-description { font-size: 1.1rem; }

.validity {
  font-size: 0.8rem;
  color: #555;
  margin: .5rem 0;
}

/* unified button style */
.action-btn {
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  min-height: 48px;
  transition: background 0.2s ease, opacity 0.2s ease;
}

/* unlocked state */
.action-btn:not(.locked) {
  background: #28a745;
  color: #fff;
}
.action-btn:not(.locked):hover:not(:disabled) {
  background: #218838;
}

/* locked state */
.action-btn.locked {
  background: #007bff;
  color: #fff;
}
.action-btn.locked:hover:not(:disabled) {
  background: #0056b3;
}

/* disabled visual */
.action-btn:disabled {
  opacity: 0.65;
  cursor: default;
}

/* 📱 mobile tweak: let cards grow full-width on narrow screens */
@media (max-width: 480px) {
  .coupon-card {
    width: 100%;
    max-width: 360px;
    margin: 0 auto;
  }
}
</style>
