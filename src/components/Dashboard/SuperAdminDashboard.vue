<template>
  <div class="super-admin-dashboard">
    <h1>Super Admin Dashboard</h1>
    
    <section class="global-overview">
      <h2>Global Overview</h2>
      <ul>
        <li>Total Users: 1234</li>
        <li>Total Foodie Groups: 45</li>
        <li>Total Coupons Submitted: 150</li>
        <li>Total Events: 30</li>
      </ul>
    </section>
    
    <section class="group-management">
      <h2>Foodie Group Management</h2>
      <p>Review and manage Foodie Group creation requests and ongoing group activities.</p>
      <button @click="manageGroups">Manage Foodie Groups</button>
    </section>
    
    <section class="user-management">
      <h2>User Management</h2>
      <p>Oversee user registrations, role assignments, and permissions.</p>
      <button @click="manageUsers">Manage Users</button>
    </section>
    
    <section class="system-settings">
      <h2>System Settings & Reports</h2>
      <p>Access system reports, payment data, and global settings.</p>
      <button @click="viewReports">View Reports</button>
    </section>
  </div>
</template>

<script>
export default {
  name: "SuperAdminDashboard",
  methods: {
    manageGroups() {
      // Placeholder for managing Foodie Groups
      alert("Manage Foodie Groups functionality is not implemented yet.");
    },
    manageUsers() {
      // Placeholder for managing users
      alert("User management functionality is not implemented yet.");
    },
    viewReports() {
      // Placeholder for viewing system reports and settings
      alert("Reports functionality is not implemented yet.");
    }
  }
}
</script>

<style scoped>
.super-admin-dashboard {
  padding: 2rem;
}

.super-admin-dashboard h1 {
  text-align: center;
  margin-bottom: 2rem;
}

section {
  margin-bottom: 2rem;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

section h2 {
  margin-bottom: 1rem;
}

section p {
  margin-bottom: 1rem;
}

ul {
  list-style: disc;
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

button {
  background-color: #007bff;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

button:hover {
  background-color: #0056b3;
}
</style>
