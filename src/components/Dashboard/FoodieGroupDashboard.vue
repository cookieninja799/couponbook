<!-- src/components/Dashboard/FoodieGroupDashboard.vue -->
<template>
  <div class="foodie-group-dashboard">
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
            <ul>
              <li v-for="c in pendingCoupons" :key="c.id">
                <strong>{{ c.description }}</strong><br />
                Submitted by: {{ c.merchantName }} ({{ "Id: " + c.merchantId }})<br/>
                Expires: {{ formatDate(c.expires_at) }}
                <div class="action-buttons">
                  <button @click="approveCoupon(c)">Approve</button>
                  <button @click="rejectCoupon(c)">Reject</button>
                </div>
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
            <ul>
              <li v-for="c in activeCoupons" :key="c.id">
                <strong>{{ c.description }}</strong><br />
                Submitted by: {{ c.merchantName }}<br />
                Redemptions: {{ c.redemptions }}
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
</template>

<script>
const API_BASE = 'http://localhost:3000/api/v1';

export default {
  name: 'FoodieGroupDashboard',
  data() {
    return {
      group: {
        id:           '28e7dccf-4a8f-4894-b50a-0f439958e9d8',
        name:         '',
        description:  '',
        location:     '',
        bannerImage:  '',
        socialMedia:  { facebook: '', instagram: '', twitter: '' }
      },
      groupLoaded:    false,
      pendingCoupons: [],
      activeCoupons:  [],
      stats: {
        totalMembers: 0,
        totalCoupons: 0
      }
    };
  },

  async created() {
    await this.loadGroupDetails();
    await Promise.all([
      this.loadPendingCoupons(),
      this.loadActiveCoupons()
    ]);
  },

  methods: {
    // Fetch group info from port 3000
    async loadGroupDetails() {
      try {
        const res = await fetch(`${API_BASE}/groups/${this.group.id}`);
        if (!res.ok) throw new Error(res.statusText);
        const g = await res.json();

        this.group.name        = g.name;
        this.group.description = g.description;
        this.group.location    = g.location;
        this.group.bannerImage = g.bannerImageUrl;
        this.group.socialMedia = {
          facebook:  g.socialLinks.facebook,
          instagram: g.socialLinks.instagram,
          twitter:   g.socialLinks.twitter
        };

        this.groupLoaded = true;
      } catch (err) {
        console.error('Failed to load group:', err);
      }
    },

    // Fetch pending submissions filtered by groupId on port 3000
    async loadPendingCoupons() {
      const res  = await fetch(
        `${API_BASE}/coupon-submissions?groupId=${this.group.id}`
      );
      const list = await res.json();

      // Only keep submissions whose state is still "pending"
      this.pendingCoupons = list
        .filter(sub => sub.state === 'pending')
        .map(sub => ({
          id:           sub.id,
          description:  sub.submissionData.description,
          merchantName: sub.merchantName,
          expires_at:   sub.submissionData.expires_at
        }));
    },
    // Fetch active coupons & update stats
    async loadActiveCoupons() {
      const res = await fetch(
        `${API_BASE}/coupons?groupId=${encodeURIComponent(this.group.id)}`
      );
      const list = await res.json();

      this.activeCoupons = list.map(c => ({
        id:           c.id,
        description:  c.description,
        merchantName: c.merchant_name,
        redemptions:  c.redemptions || 0
      }));
      this.stats.totalCoupons = this.activeCoupons.length;
    },

    // Approve a pending submission via port 3000
    async approveCoupon(coupon) {
    // 1) Optimistically remove from pending
    this.pendingCoupons = this.pendingCoupons.filter(c => c.id !== coupon.id);

    // 2) Tell the server to approve → it will insert into your coupons table
    const res = await fetch(
      `${API_BASE}/coupon-submissions/${coupon.id}`,
      {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ state: 'approved' })
      }
    );
    if (!res.ok) {
      console.error('Approve failed:', res.statusText);
      // if you want to undo the optimistic remove on failure:
      await this.loadPendingCoupons();
      return;
    }

    // 3) Read back the newly‐inserted coupon record
    const newCoupon = await res.json();
    // 4) Push it into your active list
    this.activeCoupons.push({
      id:           newCoupon.id,
      description:  newCoupon.description,
      merchantName: newCoupon.merchant_name,
      redemptions:  newCoupon.redemptions || 0
    });

    // 5) Update your stats
    this.stats.totalCoupons = this.activeCoupons.length;
    },

    // Reject a pending submission (with a reason)
    async rejectCoupon(coupon) {
      // Ask the admin for a rejection reason
      const reason = window.prompt(
        'Please enter a brief reason for rejection:',
        ''
      );
      if (reason === null) {
        // User cancelled the prompt
        return;
      }

      // Optimistically remove it from the UI
      this.pendingCoupons = this.pendingCoupons.filter(c => c.id !== coupon.id);

      // Send the rejection + message
      const res = await fetch(
        `${API_BASE}/coupon-submissions/${coupon.id}`,
        {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            state:   'rejected',
            message: reason
          })
        }
      );

      if (!res.ok) {
        console.error('Failed to reject:', res.statusText);
        // rollback UI if you like
        await this.loadPendingCoupons();
      } else {
        // Optionally refresh actives if your backend does anything on reject
        await this.loadActiveCoupons();
      }
    },
    
    // Format ISO date to locale string
    formatDate(s) {
      return new Date(s).toLocaleDateString();
    },

    saveGroupDetails() {
      alert('Save group details not implemented yet');
    }
  }
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
</style>
