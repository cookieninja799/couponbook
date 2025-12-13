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
  padding: var(--spacing-2xl);
}

.admin-dashboard h1 {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.overview,
.recent-activities,
.user-management {
  margin-bottom: var(--spacing-2xl);
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  background-color: var(--color-bg-muted);
}

.overview h2,
.recent-activities h2,
.user-management h2 {
  margin-bottom: var(--spacing-lg);
}

.overview ul,
.recent-activities ul {
  list-style: disc;
  padding-left: var(--spacing-xl);
  color: var(--color-text-primary);
}

button {
  background-color: var(--color-secondary);
  color: var(--color-text-on-secondary);
  border: none;
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  cursor: pointer;
  min-height: var(--button-height-md);
  font-weight: var(--font-weight-medium);
  transition: background-color var(--transition-base);
}

button:hover {
  background-color: var(--color-secondary-hover);
}
</style>
