<template>  
  <div class="foodie-group-dashboard">
    <h1>Foodie Group Dashboard</h1>
    <p>
      Manage your Foodie Group here. Approve or reject submissions, view group statistics,
      create new coupons/events, update your group's details, and monitor active activity.
    </p>
    
    <!-- Edit Group Section -->
    <section class="dashboard-section edit-group">
      <h2>Edit Group Details</h2>
      <form @submit.prevent="saveGroupDetails">
        <div class="form-group">
          <label for="groupName">Group Name:</label>
          <input id="groupName" type="text" v-model="group.name" required />
        </div>
        <div class="form-group">
          <label for="groupDescription">Group Description:</label>
          <textarea id="groupDescription" v-model="group.description" rows="3" required></textarea>
        </div>
        <div class="form-group">
          <label for="location">Location:</label>
          <input id="location" type="text" v-model="group.location" placeholder="Enter location" />
        </div>
        <div class="form-group">
          <label for="bannerImage">Banner Image URL:</label>
          <input id="bannerImage" type="text" v-model="group.bannerImage" placeholder="Enter banner image URL" />
        </div>
        <div class="form-group">
          <label for="facebook">Facebook URL:</label>
          <input id="facebook" type="text" v-model="group.socialMedia.facebook" placeholder="Enter Facebook URL" />
        </div>
        <div class="form-group">
          <label for="instagram">Instagram URL:</label>
          <input id="instagram" type="text" v-model="group.socialMedia.instagram" placeholder="Enter Instagram URL" />
        </div>
        <div class="form-group">
          <label for="twitter">Twitter URL:</label>
          <input id="twitter" type="text" v-model="group.socialMedia.twitter" placeholder="Enter Twitter URL" />
        </div>
        <button type="submit">Save Changes</button>
      </form>
    </section>
    
    <!-- Submissions Board (Kanban Style) -->
    <section class="dashboard-section submissions-board">
      <div class="kanban-column pending">
        <h2>Pending Submissions</h2>
        <div class="column-content">
          <div class="pending-coupons card">
            <h3>Coupon Submissions</h3>
            <ul>
              <li v-for="coupon in pendingCoupons" :key="coupon.id">
                <strong>{{ coupon.description }}</strong>
                <br>
                Submitted by: {{ coupon.merchantName }}
                <br>
                Expires: {{ formatDate(coupon.expires_at) }}
                <div class="action-buttons">
                  <button @click="approveCoupon(coupon)">Approve</button>
                  <button @click="rejectCoupon(coupon)">Reject</button>
                </div>
              </li>
            </ul>
          </div>
          <div class="pending-events card">
            <h3>Event Submissions</h3>
            <ul>
              <li v-for="event in pendingEvents" :key="event.id">
                <strong>{{ event.name }}</strong>
                <br>
                Submitted by: {{ event.merchantName }}
                <br>
                Scheduled for: {{ formatDateTime(event.event_date) }}
                <div class="action-buttons">
                  <button @click="approveEvent(event)">Approve</button>
                  <button @click="rejectEvent(event)">Reject</button>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <div class="kanban-column active">
        <h2>Active Submissions</h2>
        <div class="column-content">
          <div class="active-coupons card">
            <h3>Active Coupons</h3>
            <ul>
              <li v-for="coupon in activeCoupons" :key="coupon.id">
                <strong>{{ coupon.description }}</strong>
                <br>
                Submitted by: {{ coupon.merchantName }}
                <br>
                Redemptions: {{ coupon.redemptions }}
              </li>
            </ul>
          </div>
          <div class="active-events card">
            <h3>Active Events</h3>
            <ul>
              <li v-for="event in activeEvents" :key="event.id">
                <strong>{{ event.name }}</strong>
                <br>
                Submitted by: {{ event.merchantName }}
                <br>
                Scheduled: {{ formatDateTime(event.event_date) }}
                <br>
                RSVPs: {{ event.rsvps }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Group Statistics Section -->
    <section class="dashboard-section group-stats">
      <h2>Group Statistics</h2>
      <ul>
        <li>Total Members: {{ stats.totalMembers }}</li>
        <li>Total Coupons: {{ stats.totalCoupons }}</li>
        <li>Total Events: {{ stats.totalEvents }}</li>
      </ul>
    </section>
    
    <!-- Create New Submission Section -->
    <section class="dashboard-section create-section">
      <h2>Create New Submission</h2>
      <p>Use the buttons below to create a new coupon or event.</p>
      <button @click="createCoupon">Create Coupon</button>
      <button @click="createEvent">Create Event</button>
    </section>
  </div>
</template>

<script>
export default {
  name: "FoodieGroupDashboard",
  data() {
    return {
      group: {
        name: "Charlotte Foodie Group",
        description: "Discover the best local deals and dining experiences in Charlotte.",
        location: "Charlotte, NC",
        bannerImage: "https://via.placeholder.com/1200x300?text=Banner+Image", // Placeholder URL
        socialMedia: {
          facebook: "https://facebook.com/CharlotteFoodieGroup",
          instagram: "https://instagram.com/CharlotteFoodieGroup",
          twitter: "https://twitter.com/CharlotteFoodieGroup"
        }
      },
      // Dummy pending coupon submissions
      pendingCoupons: [
        {
          id: 1,
          description: "10% Off at Joe's Diner",
          merchantName: "Joe's Diner",
          expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          description: "Free Appetizer",
          merchantName: "Bella's Bistro",
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      // Dummy pending event submissions
      pendingEvents: [
        {
          id: 1,
          name: "Taco Tuesday",
          merchantName: "Taco Hub",
          event_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          name: "Wine Tasting Evening",
          merchantName: "Vino Venue",
          event_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      // Dummy active submissions
      activeCoupons: [
        {
          id: 3,
          description: "15% Off at Bella's Bistro",
          merchantName: "Bella's Bistro",
          redemptions: 25
        },
        {
          id: 4,
          description: "Buy One Get One Free",
          merchantName: "The Food Place",
          redemptions: 40
        }
      ],
      activeEvents: [
        {
          id: 3,
          name: "Summer BBQ Bash",
          merchantName: "Grill Master",
          event_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          rsvps: 15
        },
        {
          id: 4,
          name: "Jazz Night",
          merchantName: "Blue Note",
          event_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          rsvps: 20
        }
      ],
      // Dummy group statistics
      stats: {
        totalMembers: 120,
        totalCoupons: 45,
        totalEvents: 5
      }
    }
  },
  methods: {
    saveGroupDetails() {
      alert(`Group details saved:
Name: ${this.group.name}
Description: ${this.group.description}
Location: ${this.group.location}
Banner URL: ${this.group.bannerImage}
Facebook: ${this.group.socialMedia.facebook}
Instagram: ${this.group.socialMedia.instagram}
Twitter: ${this.group.socialMedia.twitter}`);
    },
    approveCoupon(coupon) {
      alert(`Approved coupon: ${coupon.description} by ${coupon.merchantName}`);
    },
    rejectCoupon(coupon) {
      alert(`Rejected coupon: ${coupon.description} by ${coupon.merchantName}`);
    },
    approveEvent(event) {
      alert(`Approved event: ${event.name} by ${event.merchantName}`);
    },
    rejectEvent(event) {
      alert(`Rejected event: ${event.name} by ${event.merchantName}`);
    },
    createCoupon() {
      alert("Open coupon creation form");
    },
    createEvent() {
      alert("Open event creation form");
    },
    formatDate(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleDateString();
    },
    formatDateTime(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleString();
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

/* Dashboard Section Card Styling */
.dashboard-section {
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

/* Edit Group Section */
.edit-group form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.edit-group .form-group {
  display: flex;
  flex-direction: column;
}
.edit-group label {
  font-weight: bold;
  margin-bottom: 0.5rem;
}
.edit-group input,
.edit-group textarea {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

/* Kanban Board Styling */
.submissions-board {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}
.kanban-column {
  flex: 1;
  min-width: 300px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  max-height: 500px;
  overflow-y: auto;
}
.kanban-column h2 {
  text-align: center;
  margin-bottom: 1rem;
}
.column-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.card {
  background-color: #fefefe;
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
  font-size: 0.9rem;
}
.action-buttons button:hover {
  opacity: 0.9;
}

/* Create Section Buttons */
.create-section button {
  background-color: #007bff;
  color: #fff;
  margin-right: 1rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
}
.create-section button:hover {
  background-color: #0056b3;
}

/* Full-width Banner */
.group-banner {
  width: 100%;
  height: 300px;
  background-size: cover;
  background-position: center;
  position: relative;
}
.banner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
}
.banner-content {
  text-align: center;
  color: #fff;
}
.banner-content h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}
.banner-content p {
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

/* Social Links in Header */
.social-links {
  margin-top: 1rem;
}
.social-links a {
  margin: 0 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: #fff;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}
.social-links a:hover {
  background-color: #0056b3;
}

/* Container for page content */
.container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
}

/* Map Section */
.map-section iframe {
  border: none;
  border-radius: 8px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .banner-content h1 {
    font-size: 2rem;
  }
  .banner-content p {
    font-size: 1rem;
  }
}
</style>
