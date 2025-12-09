<!-- src/components/Dashboard/FoodieGroupDashboard.vue -->
<template>
  <div class="foodie-group-dashboard">
    <!-- NOT AUTHENTICATED GATE -->
    <div v-if="!isAuthenticated" class="signin-gate">
      <h1>Foodie Group Dashboard</h1>
      <p class="muted">
        You need to be signed in as a Foodie Group Admin to access this dashboard.
      </p>
      <button class="btn primary" @click="signInNow">
        Sign In to Continue
      </button>
      <p class="muted tiny">
        You’ll be redirected to the secure sign-in page and brought back here after.
      </p>
    </div>

    <!-- NOT AUTHORIZED GATE -->
    <div v-else-if="notAuthorized" class="forbidden-gate">
      <h1>Access Denied</h1>
      <p class="muted">
        {{ notAuthorizedMessage }}
      </p>
      <button class="btn primary" @click="$router.push('/profile')">
        Back to Profile
      </button>
    </div>

    <!-- AUTHENTICATED + AUTHORIZED DASHBOARD -->
    <div v-else>
      <h1>Foodie Group Dashboard</h1>
      <p>
        Manage your Foodie Group here. Approve or reject coupon submissions,
        view group statistics, update your group's details, and monitor activity.
      </p>

      <!-- Edit Group Section -->
      <section class="dashboard-section edit-group" v-if="groupLoaded">
        <h2>Edit Group Details</h2>
        <form @submit.prevent="saveGroupDetails">
          <div class="form-group">
            <label for="groupName">Group Name:</label>
            <input id="groupName" type="text" v-model="group.name" required />
          </div>
          <div class="form-group">
            <label for="groupDescription">Group Description:</label>
            <textarea
              id="groupDescription"
              v-model="group.description"
              rows="3"
              required
            ></textarea>
          </div>
          <div class="form-group">
            <label for="location">Location:</label>
            <input
              id="location"
              type="text"
              v-model="group.location"
              placeholder="Enter location"
            />
          </div>
          <div class="form-group">
            <label for="bannerImage">Banner Image URL:</label>
            <input
              id="bannerImage"
              type="text"
              v-model="group.bannerImage"
              placeholder="Enter banner image URL"
            />
          </div>
          <div class="form-group">
            <label for="facebook">Facebook URL:</label>
            <input
              id="facebook"
              type="text"
              v-model="group.socialMedia.facebook"
              placeholder="Enter Facebook URL"
            />
          </div>
          <div class="form-group">
            <label for="instagram">Instagram URL:</label>
            <input
              id="instagram"
              type="text"
              v-model="group.socialMedia.instagram"
              placeholder="Enter Instagram URL"
            />
          </div>
          <div class="form-group">
            <label for="twitter">Twitter URL:</label>
            <input
              id="twitter"
              type="text"
              v-model="group.socialMedia.twitter"
              placeholder="Enter Twitter URL"
            />
          </div>
          <button type="submit">Save Changes</button>
        </form>
      </section>

      <!-- Coupons Board (Kanban Style) -->
      <section class="dashboard-section submissions-board" v-if="groupLoaded">
        <div class="kanban-column pending">
          <h2>Pending Submissions</h2>
          <div class="column-content">
            <div class="pending-coupons card">
              <h3>Coupon Submissions</h3>

              <p v-if="pendingLoading" class="muted tiny">
                Loading pending submissions…
              </p>
              <p v-if="pendingError" class="tiny" style="color:#b00020;">
                {{ pendingError }}
              </p>

              <ul v-if="!pendingLoading && !pendingError">
                <li v-for="c in pendingCoupons" :key="c.id">
                  <strong>{{ c.description }}</strong><br />
                  Submitted by: {{ c.merchantName }} ({{ "Id: " + c.merchantId }})<br/>
                  Expires: {{ formatDate(c.expires_at) }}
                  <div class="action-buttons">
                    <button @click="approveCoupon(c)">Approve</button>
                    <button @click="rejectCoupon(c)">Reject</button>
                  </div>
                </li>
                <li v-if="pendingCoupons.length === 0" class="muted tiny">
                  No pending submissions for this group.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="kanban-column active">
          <h2>Active Coupons</h2>
          <div class="column-content">
            <div class="active-coupons card">
              <h3>Active Coupons</h3>

              <p v-if="activeLoading" class="muted tiny">
                Loading active coupons…
              </p>
              <p v-if="activeError" class="tiny" style="color:#b00020;">
                {{ activeError }}
              </p>

              <ul v-if="!activeLoading && !activeError">
                <li v-for="c in activeCoupons" :key="c.id">
                  <strong>{{ c.description }}</strong><br />
                  Submitted by: {{ c.merchantName }}<br />
                  Redemptions: {{ c.redemptions }}
                </li>
                <li v-if="activeCoupons.length === 0" class="muted tiny">
                  No active coupons for this group yet.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- Group Statistics Section -->
      <section class="dashboard-section group-stats" v-if="groupLoaded">
        <h2>Group Statistics</h2>
        <ul>
          <li>Total Members: {{ stats.totalMembers }}</li>
          <li>Total Coupons: {{ stats.totalCoupons }}</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { getAccessToken, signIn } from '@/services/authService';

const API_BASE = '/api/v1';

export default {
  name: 'FoodieGroupDashboard',
  data() {
    return {
      group: {
        // Hard-coded for now; later you’ll infer this from membership / API
        id:           '28e7dccf-4a8f-4894-b50a-0f439958e9d8',
        name:         '',
        description:  '',
        location:     '',
        bannerImage:  '',
        socialMedia:  { facebook: '', instagram: '', twitter: '' },
      },
      groupLoaded: false,
      groupError: null,

      pendingCoupons: [],
      pendingLoading: false,
      pendingError: null,

      activeCoupons: [],
      activeLoading: false,
      activeError: null,

      stats: {
        totalMembers: 0,
        totalCoupons: 0,
      },

      // authorization gate
      notAuthorized: false,
      notAuthorizedMessage:
        'You do not have permission to manage this Foodie Group.',
    };
  },

  computed: {
    ...mapGetters('auth', ['isAuthenticated']),
  },

  async created() {
    // If not logged in, do not attempt API calls – let the gate render.
    if (!this.isAuthenticated) return;

    await this.loadGroupDetails();
    if (this.notAuthorized) return;

    await Promise.all([this.loadPendingCoupons(), this.loadActiveCoupons()]);
  },

  methods: {
    signInNow() {
      signIn();
    },

    markNotAuthorized(customMsg) {
      this.notAuthorized = true;
      if (customMsg) {
        this.notAuthorizedMessage = customMsg;
      }
    },

    // Fetch group info (secured via token so you can lock this route down later if you want)
    async loadGroupDetails() {
      this.groupLoaded = false;
      this.groupError = null;
      try {
        const token = await getAccessToken();
        const res = await fetch(`${API_BASE}/groups/${this.group.id}`, {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        });

        if (res.status === 403) {
          // Not authorized to view this group at all
          const body = await res.json().catch(() => ({}));
          this.markNotAuthorized(
            body.error ||
              'You are signed in, but you are not authorized to manage this Foodie Group.',
          );
          return;
        }

        if (res.status === 401) {
          // Token invalid/expired – treat as not authorized from dashboard POV
          this.markNotAuthorized(
            'Your session is not authorized for this Foodie Group. Please sign in again or contact support.',
          );
          return;
        }

        if (!res.ok) {
          const errText = await res.text().catch(() => res.statusText);
          throw new Error(
            `Failed to load group (${res.status}): ${errText || res.statusText}`,
          );
        }

        const g = await res.json();

        this.group.name        = g.name;
        this.group.description = g.description;
        this.group.location    = g.location;
        this.group.bannerImage = g.bannerImageUrl;
        this.group.socialMedia = {
          facebook:  g.socialLinks?.facebook || '',
          instagram: g.socialLinks?.instagram || '',
          twitter:   g.socialLinks?.twitter || '',
        };

        this.groupLoaded = true;
      } catch (err) {
        if (!this.notAuthorized) {
          console.error('Failed to load group:', err);
          this.groupError = err.message || 'Could not load group details.';
          this.groupLoaded = false;
        }
      }
    },

    // Fetch pending submissions filtered by groupId (auth-protected)
    async loadPendingCoupons() {
      if (this.notAuthorized) return;

      this.pendingLoading = true;
      this.pendingError = null;
      try {
        const token = await getAccessToken();
        const res = await fetch(
          `${API_BASE}/coupon-submissions?groupId=${encodeURIComponent(this.group.id)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (res.status === 403) {
          const body = await res.json().catch(() => ({}));
          this.markNotAuthorized(
            body.error ||
              'You are not authorized to view pending submissions for this Foodie Group.',
          );
          return;
        }

        if (res.status === 401) {
          this.markNotAuthorized(
            'Your session is not authorized for this Foodie Group. Please sign in again.',
          );
          return;
        }

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          const msg =
            errBody.error ||
            `Failed to load pending submissions (status ${res.status})`;
          throw new Error(msg);
        }

        const list = await res.json();

        if (!Array.isArray(list)) {
          throw new Error('Unexpected response format from /coupon-submissions');
        }

        // Backend already filters state='pending' & groupId; keep this for safety.
        this.pendingCoupons = list
          .filter((sub) => sub.state === 'pending')
          .map((sub) => ({
            id:           sub.id,
            description:  sub.submissionData?.description || '',
            merchantName: sub.merchantName,
            merchantId:   sub.merchantId,
            expires_at:   sub.submissionData?.expires_at,
          }));
      } catch (err) {
        if (!this.notAuthorized) {
          console.error('[FoodieGroupDashboard] loadPendingCoupons failed', err);
          this.pendingError =
            err.message || 'Could not load pending submissions for this group.';
          this.pendingCoupons = [];
        }
      } finally {
        this.pendingLoading = false;
      }
    },

    // Fetch active coupons & update stats
    async loadActiveCoupons() {
      if (this.notAuthorized) return;

      this.activeLoading = true;
      this.activeError = null;
      try {
        const token = await getAccessToken();
        const res = await fetch(
          `${API_BASE}/coupons?groupId=${encodeURIComponent(this.group.id)}`,
          {
            headers: token
              ? { Authorization: `Bearer ${token}` }
              : {},
          },
        );

        if (res.status === 403) {
          const body = await res.json().catch(() => ({}));
          this.markNotAuthorized(
            body.error ||
              'You are not authorized to view coupons for this Foodie Group.',
          );
          return;
        }

        if (res.status === 401) {
          this.markNotAuthorized(
            'Your session is not authorized for this Foodie Group. Please sign in again.',
          );
          return;
        }

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          const msg =
            errBody.error ||
            `Failed to load active coupons (status ${res.status})`;
          throw new Error(msg);
        }

        const list = await res.json();

        if (!Array.isArray(list)) {
          throw new Error('Unexpected response format from /coupons');
        }

        this.activeCoupons = list.map((c) => ({
          id:           c.id,
          description:  c.description,
          merchantName: c.merchant_name,
          redemptions:  c.redemptions || 0,
        }));
        this.stats.totalCoupons = this.activeCoupons.length;
      } catch (err) {
        if (!this.notAuthorized) {
          console.error('[FoodieGroupDashboard] loadActiveCoupons failed', err);
          this.activeError =
            err.message || 'Could not load active coupons for this group.';
          this.activeCoupons = [];
          this.stats.totalCoupons = 0;
        }
      } finally {
        this.activeLoading = false;
      }
    },

    // Approve a pending submission
    async approveCoupon(coupon) {
      if (this.notAuthorized) return;

      try {
        const token = await getAccessToken();

        // Optimistically remove from pending
        const before = this.pendingCoupons.slice();
        this.pendingCoupons = this.pendingCoupons.filter(
          (c) => c.id !== coupon.id,
        );

        const res = await fetch(
          `${API_BASE}/coupon-submissions/${coupon.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ state: 'approved' }),
          },
        );

        if (res.status === 403) {
          const body = await res.json().catch(() => ({}));
          this.markNotAuthorized(
            body.error ||
              'You are not authorized to approve submissions for this Foodie Group.',
          );
          // rollback optimistic update
          this.pendingCoupons = before;
          return;
        }

        if (res.status === 401) {
          this.markNotAuthorized(
            'Your session is not authorized for this Foodie Group. Please sign in again.',
          );
          this.pendingCoupons = before;
          return;
        }

        if (!res.ok) {
          console.error('Approve failed:', res.status, await res.text());
          // Roll back pending list
          this.pendingCoupons = before;
          return;
        }

        const newCoupon = await res.json();

        this.activeCoupons.push({
          id:           newCoupon.id,
          description:  newCoupon.description,
          merchantName: newCoupon.merchant_name,
          redemptions:  newCoupon.redemptions || 0,
        });

        this.stats.totalCoupons = this.activeCoupons.length;
      } catch (err) {
        if (!this.notAuthorized) {
          console.error('[FoodieGroupDashboard] approveCoupon error', err);
          await this.loadPendingCoupons();
        }
      }
    },

    // Reject a pending submission (with a reason)
    async rejectCoupon(coupon) {
      if (this.notAuthorized) return;

      const reason = window.prompt(
        'Please enter a brief reason for rejection:',
        '',
      );
      if (reason === null) {
        return;
      }

      try {
        const token = await getAccessToken();

        const before = this.pendingCoupons.slice();
        // Optimistically remove
        this.pendingCoupons = this.pendingCoupons.filter(
          (c) => c.id !== coupon.id,
        );

        const res = await fetch(
          `${API_BASE}/coupon-submissions/${coupon.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              state: 'rejected',
              message: reason,
            }),
          },
        );

        if (res.status === 403) {
          const body = await res.json().catch(() => ({}));
          this.markNotAuthorized(
            body.error ||
              'You are not authorized to reject submissions for this Foodie Group.',
          );
          this.pendingCoupons = before;
          return;
        }

        if (res.status === 401) {
          this.markNotAuthorized(
            'Your session is not authorized for this Foodie Group. Please sign in again.',
          );
          this.pendingCoupons = before;
          return;
        }

        if (!res.ok) {
          console.error('Failed to reject:', res.status, await res.text());
          // rollback UI
          this.pendingCoupons = before;
        } else {
          await this.loadActiveCoupons();
        }
      } catch (err) {
        if (!this.notAuthorized) {
          console.error('[FoodieGroupDashboard] rejectCoupon error', err);
          await this.loadPendingCoupons();
        }
      }
    },

    // Format ISO date to locale string
    formatDate(s) {
      if (!s) return '—';
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) return '—';
      return d.toLocaleDateString();
    },

    saveGroupDetails() {
      alert('Save group details not implemented yet');
    },
  },
};
</script>

<style scoped>
.foodie-group-dashboard {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-section {
  background: #f9f9f9;
  border: 1px solid #ddd;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.edit-group form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

label {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

input,
textarea {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.submissions-board {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.kanban-column {
  flex: 1;
  min-width: 300px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  max-height: 500px;
  overflow-y: auto;
}

.column-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card {
  background: #fefefe;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.action-buttons {
  margin-top: 0.5rem;
}
.action-buttons button {
  margin-right: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.signin-gate,
.forbidden-gate {
  text-align: center;
  max-width: 500px;
  margin: 3rem auto;
}

.btn {
  margin-top: 0.75rem;
  padding: 0.45rem 1rem;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
}

.btn.primary {
  background: #ef5430;
  color: #fff;
}

.muted {
  color: #777;
}

.tiny {
  font-size: 0.8rem;
}
</style>
