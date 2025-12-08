<!-- src/views/FoodieGroupList.vue -->
<template>
  <div class="foodie-group-list">
    <h1>Available Foodie Groups</h1>

    <!-- Loading / Error States -->
    <p v-if="loading">Loading groups…</p>
    <p v-else-if="error" class="error">⚠️ {{ error }}</p>

    <!-- Groups Grid -->
    <div v-else class="group-list-container">
      <div
        v-for="group in groups"
        :key="group.id"
        class="group-card"
        :class="{ 'group-card--joined': hasActiveCouponBook(group.id) }"
      >
        <div class="card-content">
          <!-- Joined badge -->
          <div
            v-if="hasActiveCouponBook(group.id)"
            class="badge-joined"
          >
            Joined · Coupon Book Active
          </div>

          <h2>{{ group.name }}</h2>
          <p>{{ group.description }}</p>
          <p class="location" v-if="group.location">
            Location: {{ group.location }}
          </p>
        </div>

        <router-link
          :to="{ name: 'FoodieGroupView', params: { id: group.id } }"
          class="btn"
        >
          View Group
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { getAccessToken } from '@/services/authService';

export default {
  name: 'FoodieGroupList',

  data() {
    return {
      groups: [],              // API data
      loading: true,
      error: null,

      // For highlighting joined / purchased groups
      purchasedGroupIds: [],
      loadingPurchases: false,
    };
  },

  computed: {
    ...mapGetters('auth', ['isAuthenticated']),
  },

  watch: {
    // If user logs in while on this page, pull their purchases
    isAuthenticated(newVal, oldVal) {
      if (newVal && !oldVal) {
        this.loadMyGroupPurchases();
      } else if (!newVal) {
        this.purchasedGroupIds = [];
      }
    },
  },

  async mounted() {
    await this.loadGroups();

    // If already logged in, immediately load purchases
    if (this.isAuthenticated) {
      this.loadMyGroupPurchases();
    }
  },

  methods: {
    async loadGroups() {
      this.loading = true;
      this.error = null;
      try {
        const res = await fetch('/api/v1/groups');
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        this.groups = await res.json();
      } catch (err) {
        console.error('Failed to load groups', err);
        this.error = 'Could not load groups. ' + err.message;
      } finally {
        this.loading = false;
      }
    },

    async loadMyGroupPurchases() {
      this.loadingPurchases = true;
      try {
        const token = await getAccessToken();
        if (!token) return;

        const res = await fetch('/api/v1/groups/my/purchases', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.error(
            'Failed to load my group purchases',
            res.status,
            res.statusText
          );
          return;
        }

        const purchases = await res.json();
        const now = new Date();

        // Mirror the "active coupon books" logic from Profile.vue:
        // status === 'paid' and not expired
        const activeGroupIds = (Array.isArray(purchases) ? purchases : [])
          .filter((p) => {
            if (p.status !== 'paid') return false;
            if (!p.expiresAt) return true;
            const exp = new Date(p.expiresAt);
            if (Number.isNaN(exp.getTime())) return true;
            return exp >= now;
          })
          .map((p) => p.groupId);

        this.purchasedGroupIds = activeGroupIds;
      } catch (err) {
        console.error('Error loading my group purchases', err);
      } finally {
        this.loadingPurchases = false;
      }
    },

    hasActiveCouponBook(groupId) {
      return this.purchasedGroupIds.includes(groupId);
    },
  },
};
</script>

<style scoped>
.foodie-group-list {
  padding: 2rem;
  text-align: center;
}

.group-list-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.group-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  width: 300px;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 350px;
  transition: box-shadow 0.2s ease, border-color 0.2s ease,
    transform 0.2s ease;
}

/* Highlight when user has an active coupon book for this group */
.group-card--joined {
  border: 2px solid #ef5430;
  box-shadow:
    0 0 0 1px rgba(239, 84, 48, 0.08),
    0 6px 14px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.card-content {
  margin-bottom: 1rem;
}

.badge-joined {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  margin-bottom: 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: #fff3ee;
  color: #ef5430;
  border: 1px solid #ffd0bd;
}

.location {
  font-style: italic;
  color: #555;
  margin-bottom: 1rem;
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #007bff;
  color: #fff;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.btn:hover {
  background-color: #0056b3;
}

.error {
  color: red;
  margin-top: 1rem;
}
</style>
