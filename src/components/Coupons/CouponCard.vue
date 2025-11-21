<template>
  <div class="coupon-card">
    <h3 class="coupon-title">{{ coupon.title }}</h3>

    <div class="merchant-info" v-if="coupon.merchant_name">
      <img :src="coupon.merchant_logo || '/logo.png'" :alt="`Logo for ${coupon.merchant_name}`" class="merchant-logo" />
      <span class="merchant-name">{{ coupon.merchant_name }}</span>
    </div>

    <p class="coupon-description">{{ coupon.description }}</p>

    <div class="validity" v-if="coupon.valid_from && coupon.expires_at">
      <small>Valid from: {{ formatDate(coupon.valid_from) }}</small><br />
      <small>Expires: {{ formatDate(coupon.expires_at) }}</small>
    </div>

    <button class="action-btn" :class="buttonClass" :disabled="isDisabled" @click="handleClick">
      <!-- 1) Already redeemed -->
      <template v-if="coupon.redeemed_by_user">
        ✅ Redeemed
      </template>

      <!-- 2) Not authenticated -->
      <template v-else-if="!isAuthenticated">
        Sign in to redeem
      </template>

      <!-- 3) Locked + not purchased -->
      <template v-else-if="isLocked && !hasPurchasedCouponBook">
        🔒 Join {{ coupon.foodie_group_name }} Coupon Book
      </template>

      <!-- 4) Default: redeem -->
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
    },

    // 🔵🟢🧡 decide button color based on semantic state
    buttonClass() {
      if (this.coupon.redeemed_by_user) {
        return 'btn-gray';
      }
      if (!this.isAuthenticated) {
        return 'btn-tertiary'; // sign in = orange-ish
      }
      if (this.isLocked && !this.hasPurchasedCouponBook) {
        return 'btn-primary'; // join = blue
      }
      return 'btn-secondary'; // redeem = green
    }

  },

  methods: {
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString();
    },

    handleClick() {
      // Already redeemed (disabled anyway)
      if (this.coupon.redeemed_by_user) return;

      // 1️⃣ Not logged in → go to Cognito
      if (!this.isAuthenticated) {
        try { signIn(); } catch (e) { console.error(e); }
        return;
      }

      // 2️⃣ Locked + no purchase → redirect to group
      if (this.isLocked && !this.hasPurchasedCouponBook) {
        this.redirectToGroup();
        return;
      }

      // 3️⃣ Otherwise → redeem
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

/* map semantic button classes → your global button palette */
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

/* redeemed = neutral gray */
.btn-gray {
  background-color: #6c757d;
  cursor: default;
}

/* disabled visual */
.action-btn:disabled {
  opacity: 0.65;
  cursor: default;
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
