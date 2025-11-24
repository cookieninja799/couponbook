<template>
  <div class="profile-page container">

    <!-- Header -->
    <header class="profile-header">
      <h1>Your Account</h1>
      <p class="subtitle">Manage your profile, coupon books, and redemptions.</p>
    </header>

    <!-- User Information Card -->
    <section class="section-card">
      <h2>User Information</h2>

      <div v-if="!user" class="loading">Loading…</div>

      <div v-else class="user-info">
        <p><strong>Name:</strong> {{ user.name }}</p>
        <p><strong>Email:</strong> {{ user.email }}</p>
        <p><strong>User ID:</strong> {{ user.id }}</p>

        <button class="btn tertiary" @click="signOutNow">
          Sign Out
        </button>
      </div>
    </section>

    <!-- Purchased Coupon Books -->
    <section class="section-card">
      <h2>Purchased Coupon Books</h2>

      <div v-if="loadingPurchases" class="loading">Loading…</div>

      <div v-else-if="purchases.length === 0" class="empty-state">
        <p>You have not unlocked any coupon books yet.</p>
      </div>

      <ul v-else class="purchase-list">
        <li v-for="p in purchases" :key="p.id" class="purchase-item">
          <strong>{{ p.groupName }}</strong><br>
          <small>Purchased: {{ formatDate(p.purchasedAt) }}</small>
        </li>
      </ul>
    </section>

    <!-- Redeemed Coupons -->
    <section class="section-card">
      <h2>Redeemed Coupons</h2>

      <div v-if="loadingRedemptions" class="loading">Loading…</div>

      <div v-else-if="redemptions.length === 0" class="empty-state">
        <p>You haven't redeemed any coupons yet.</p>
      </div>

      <ul v-else class="redeem-list">
        <li v-for="c in redemptions" :key="c.id" class="redeem-item">
          <strong>{{ c.title }}</strong><br>
          <small>Merchant: {{ c.merchant_name }}</small><br>
          <small>Redeemed: {{ formatDate(c.redeemed_at) }}</small>
        </li>
      </ul>
    </section>

  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { getAccessToken, signOut } from "@/services/authService";

export default {
  name: "UserProfile",

  data() {
    return {
      user: null,
      purchases: [],
      redemptions: [],
      loadingPurchases: true,
      loadingRedemptions: true,
    };
  },

  computed: {
    ...mapGetters("auth", ["isAuthenticated", "userData"]),
  },

  created() {
    if (!this.isAuthenticated) {
      this.$router.push("/"); // redirect to home if not logged in
    } else {
      this.user = this.userData;
      this.fetchPurchases();
      this.fetchRedemptions();
    }
  },

  methods: {
    async fetchPurchases() {
      this.loadingPurchases = true;
      try {
        const token = await getAccessToken();
        const res = await fetch(`/api/v1/users/me/purchases`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          this.purchases = await res.json();
        }
      } catch (err) {
        console.error("Failed to fetch purchases", err);
      }
      this.loadingPurchases = false;
    },

    async fetchRedemptions() {
      this.loadingRedemptions = true;
      try {
        const token = await getAccessToken();
        const res = await fetch(`/api/v1/coupons/redeemed`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          this.redemptions = await res.json();
        }
      } catch (err) {
        console.error("Failed to fetch redemptions", err);
      }
      this.loadingRedemptions = false;
    },

    formatDate(str) {
      return new Date(str).toLocaleDateString();
    },

    signOutNow() {
      signOut();
    },
  },
};
</script>

<style scoped>
.profile-page {
  max-width: 900px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.profile-header {
  text-align: center;
  margin-bottom: 2rem;
}

.subtitle {
  color: #666;
}

.section-card {
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.user-info p {
  margin: 0.5rem 0;
}

.btn {
  margin-top: 1rem;
}

.purchase-list,
.redeem-list {
  list-style: none;
  padding: 0;
}

.purchase-item,
.redeem-item {
  padding: 0.7rem 0;
  border-bottom: 1px solid #eee;
}

.purchase-item:last-child,
.redeem-item:last-child {
  border-bottom: none;
}

.loading,
.empty-state {
  color: #555;
  font-style: italic;
}

@media (max-width: 600px) {
  .profile-page {
    padding: 0 .5rem;
  }
}
</style>
