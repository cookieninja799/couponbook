<template>
  <div class="admin-dashboard">
    <h1>Admin Dashboard</h1>
    
    <section class="overview">
      <h2>System Overview</h2>
      <p>This section provides a summary of key metrics and the overall system status.</p>
      <ul>
        <li>Total Users: 1234</li>
        <li>Total Foodie Groups: 45</li>
        <li>Pending Coupon Submissions: 7</li>
        <li>Pending Event Submissions: 3</li>
      </ul>
    </section>
    
    <section class="recent-activities">
      <h2>Recent Activities</h2>
      <p>Review recent user sign-ups, coupon submissions, and Foodie Group creation requests.</p>
      <ul>
        <li>User "John Doe" signed up.</li>
        <li>Coupon "10% Off at Joe's Diner" submitted by Merchant X.</li>
        <li>Foodie Group "Charlotte Foodies" created.</li>
      </ul>
    </section>
    
    <section class="user-management">
      <h2>User Management</h2>
      <p>Manage users, review roles, and adjust permissions as needed.</p>
      <button @click="viewAllUsers">View All Users</button>
    </section>
  </div>
</template>

<script>
export default {
  name: "AdminDashboard",
  methods: {
    viewAllUsers() {
      // Placeholder for navigating to or opening a user management interface
      alert("User management functionality is not implemented yet.");
    }
  }
}
</script>

<style scoped>
.admin-dashboard {
  padding: 2rem;
}

.admin-dashboard h1 {
  text-align: center;
  margin-bottom: 2rem;
}

.overview,
.recent-activities,
.user-management {
  margin-bottom: 2rem;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.overview h2,
.recent-activities h2,
.user-management h2 {
  margin-bottom: 1rem;
}

.overview ul,
.recent-activities ul {
  list-style: disc;
  padding-left: 1.5rem;
}

button {
  background-color: #007bff;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}
</style>
