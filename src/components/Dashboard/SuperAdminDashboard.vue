<template>
  <div class="super-admin-dashboard">
    <!-- NOT AUTHENTICATED -->
    <section v-if="!isAuthenticated" class="section-card signin-card">
      <h1>Super Admin Dashboard</h1>
      <p class="muted">
        You need to be signed in as an admin to access this dashboard.
      </p>
      <button class="btn primary" @click="signInNow">
        <i class="pi pi-sign-in icon-spacing-sm"></i>Sign In to Your Account
      </button>
      <p class="muted tiny">
        You'll be redirected to the secure sign-in page and brought back here
        after.
      </p>
    </section>

    <!-- ACCESS CHECK IN PROGRESS (AUTHENTICATED, BUT ROLE UNKNOWN) -->
    <section
      v-else-if="!authChecked"
      class="section-card access-check-card"
    >
      <h1>Super Admin Dashboard</h1>
      <p class="subtitle">Checking your admin permissions…</p>
    </section>

    <!-- AUTHENTICATED BUT NOT AUTHORIZED -->
    <section
      v-else-if="notAuthorized"
      class="section-card access-denied-card"
    >
      <h1>Access Denied</h1>
      <p>{{ notAuthorizedMessage }}</p>
      <button class="btn primary" @click="$router.push('/profile')">
        Back to Profile
      </button>
    </section>

    <!-- AUTHENTICATED + AUTHORIZED DASHBOARD -->
    <template v-else>
      <header class="profile-header">
        <h1>Super Admin Dashboard</h1>
        <p class="subtitle">
          Manage users, foodie groups, and system-wide settings and reports.
        </p>
      </header>

      <section class="dashboard-section global-overview">
        <h2>Global Overview</h2>
        <ul>
          <!-- These are still placeholder numbers; real stats can be wired later -->
          <li>Total Users: 1234</li>
          <li>Total Foodie Groups: 45</li>
          <li>Total Coupons Submitted: 150</li>
          <li>Total Events: 30</li>
        </ul>
      </section>

      <section class="dashboard-section group-management">
        <h2>Foodie Group Management</h2>
        <p>
          View and manage Foodie Groups, assign admins, and monitor performance.
        </p>
        <button class="btn primary" @click="manageGroups">
          <i class="pi pi-users icon-spacing-sm"></i>Manage Foodie Groups
        </button>
      </section>

      <section class="dashboard-section user-management">
        <h2>User Management</h2>
        <p>View all users, their roles, and manage access levels.</p>
        <button class="btn primary" @click="manageUsers">
          <i class="pi pi-user-edit icon-spacing-sm"></i>Manage Users
        </button>
      </section>

      <section class="dashboard-section system-settings">
        <h2>System Settings &amp; Reports</h2>
        <p>Access system reports, payment data, and global settings.</p>
        <button class="btn primary" @click="viewReports">
          <i class="pi pi-chart-line icon-spacing-sm"></i>View Reports
        </button>
      </section>
    </template>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { getAccessToken, signIn } from "@/services/authService";

export default {
  name: "SuperAdminDashboard",

  data() {
    return {
      // auth / gating state
      user: null,
      userLoading: false,
      userError: null,

      authChecked: false, // 🔹 has /users/me + role check finished?
      notAuthorized: false,
      notAuthorizedMessage:
        "You are not authorized to access the Super Admin Dashboard.",
    };
  },

  computed: {
    ...mapGetters("auth", ["isAuthenticated"]),

    role() {
      return this.user && this.user.role ? this.user.role : null;
    },
  },

  async created() {
    // If not logged in, let the sign-in gate render; do not hit the API.
    if (!this.isAuthenticated) return;

    try {
      await this.loadCurrentUser();

      // If loadCurrentUser() decided we're not authorized, bail early.
      if (this.notAuthorized) return;
    } finally {
      // Mark that we've finished checking; switches UI out of the "checking" state.
      this.authChecked = true;
    }
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
      this.authChecked = true;
    },

    async loadCurrentUser() {
      this.userLoading = true;
      this.userError = null;

      try {
        const token = await getAccessToken();
        if (!token) {
          this.user = null;
          this.markNotAuthorized(
            "Your session does not have a valid access token. Please sign in again."
          );
          return;
        }

        const res = await fetch("/api/v1/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          this.user = null;
          this.markNotAuthorized(
            "You are not signed in with a valid session. Please sign in again."
          );
          return;
        }

        if (!res.ok) {
          console.error(
            "[SuperAdminDashboard] Failed to load /api/v1/users/me",
            res.status
          );
          this.user = null;
          this.markNotAuthorized(
            "Unable to verify your account at this time. Please try again later."
          );
          return;
        }

        const data = await res.json();
        this.user = {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role,
        };

        // 🔐 Global role check: only 'admin' is treated as Super Admin.
        if (this.user.role !== "admin") {
          this.markNotAuthorized(
            "You are signed in, but you do not have Super Admin permissions."
          );
        }
      } catch (err) {
        console.error("[SuperAdminDashboard] loadCurrentUser error", err);
        this.userError = "Failed to load your user profile.";
        this.markNotAuthorized(
          "Unable to verify your admin permissions at this time."
        );
      } finally {
        this.userLoading = false;
      }
    },

    // Still placeholder actions; they will later call admin-only API routes.
    manageGroups() {
      alert("Manage Foodie Groups functionality is not implemented yet.");
    },
    manageUsers() {
      alert("User management functionality is not implemented yet.");
    },
    viewReports() {
      alert("Reports functionality is not implemented yet.");
    },
  },
};
</script>

<style scoped>
.super-admin-dashboard {
  padding: var(--spacing-2xl);
  max-width: var(--container-xl);
  margin: 0 auto;
}

@media (max-width: 768px) {
  .super-admin-dashboard {
    padding: var(--spacing-lg);
  }
}

.profile-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.section-card {
  background: var(--color-bg-primary);
  padding: var(--spacing-xl);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--spacing-xl);
}

.dashboard-section {
  background: var(--color-bg-muted);
  border: 1px solid var(--color-border-light);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-xl);
}

.dashboard-section h2 {
  margin-bottom: var(--spacing-lg);
}

.dashboard-section p {
  margin-bottom: var(--spacing-lg);
}

.dashboard-section ul {
  list-style: disc;
  padding-left: var(--spacing-xl);
  margin-bottom: var(--spacing-lg);
}

.dashboard-section li {
  margin-bottom: var(--spacing-sm);
}

.signin-card,
.access-check-card,
.access-denied-card {
  text-align: center;
  max-width: 500px;
  margin: var(--spacing-3xl) auto;
  padding: var(--spacing-xl);
}

.subtitle {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
}

.btn {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-full);
  border: none;
  cursor: pointer;
  font-size: var(--font-size-base);
  transition: all var(--transition-base);
  min-height: var(--button-height-md);
}

.btn.primary {
  background: var(--color-primary);
  color: var(--color-text-on-primary);
}

.btn.primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.muted {
  color: var(--color-text-muted);
}

.tiny {
  font-size: var(--font-size-xs);
}
</style>
