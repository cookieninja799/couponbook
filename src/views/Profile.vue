<!-- src/views/Profile.vue -->
<template>
  <div class="profile-page container">
    <!-- NOT AUTHENTICATED STATE -->
    <section v-if="!isAuthenticated" class="section-card signin-card">
      <h1>Your Account</h1>
      <p class="subtitle">
        You need to be signed in to view your profile, coupon books, and redemptions.
      </p>

      <button class="btn primary" @click="signInNow">
        Sign In to Your Account
      </button>

      <p class="muted tiny">
        You’ll be redirected to the secure sign-in page and brought back here after.
      </p>
    </section>

    <!-- AUTHENTICATED STATE -->
    <template v-else>
      <!-- Header -->
      <header class="profile-header">
        <h1>Your Account</h1>
        <p class="subtitle">
          Manage your profile, coupon books, and redemptions.
        </p>
      </header>

      <!-- Top: User Information / Account Overview -->
      <section class="section-card account-card">
        <div class="account-header">
          <div>
            <h2>Account Overview</h2>
            <p class="muted">
              Signed in as <strong>{{ user?.email || '—' }}</strong>
            </p>
          </div>

          <span v-if="roleLabel" class="role-pill">
            {{ roleLabel }}
          </span>
        </div>

        <!-- Loading state while user is being fetched -->
        <div v-if="loadingUser" class="loading">Loading…</div>

        <!-- Error / missing state -->
        <div v-else-if="!user" class="loading">
          Unable to load profile.
        </div>

        <!-- User info once loaded -->
        <div v-else class="user-info">
          <div class="user-meta">
            <p><strong>Name:</strong> {{ user.name || 'Not set' }}</p>
            <p><strong>User ID:</strong> {{ user.id }}</p>
          </div>

          <button class="btn tertiary" @click="signOutNow">
            Sign Out
          </button>
        </div>
      </section>

      <!-- Role-based content layout -->
      <div v-if="user" class="profile-grid">
        <!-- CUSTOMER VIEW -->
        <template v-if="role === 'customer'">
          <!-- Coupon Activity -->
          <section class="section-card">
            <h2>Coupon Activity</h2>
            <p class="muted">
              Here we’ll show your total redemptions, recent activity, and other
              stats once this is wired up.
            </p>

            <div class="stat-row">
              <div class="stat-card">
                <span class="stat-number">—</span>
                <span class="stat-label">Coupons Redeemed</span>
              </div>
              <div class="stat-card">
                <span class="stat-number">—</span>
                <span class="stat-label">Active Coupon Books</span>
              </div>
            </div>
          </section>

          <!-- Purchased Coupon Books -->
          <section class="section-card">
            <h2>Purchased Coupon Books</h2>
            <p class="muted">
              Soon this section will list all the foodie groups you’ve unlocked
              and when you purchased them.
            </p>
            <ul class="skeleton-list">
              <li class="skeleton-item"></li>
              <li class="skeleton-item"></li>
              <li class="skeleton-item"></li>
            </ul>
          </section>
        </template>

        <!-- MERCHANT VIEW -->
        <template v-else-if="role === 'merchant'">
          <!-- Merchant Profile / Restaurants -->
          <section class="section-card">
            <h2>Your Restaurants</h2>
            <p class="muted">
              Manage each restaurant’s profile. Logo upload will be per restaurant and
              reused on all coupons for that location.
            </p>

            <!-- No restaurants yet -->
            <div
              v-if="merchants.length === 0"
              class="muted small"
              style="margin-top: 0.75rem;"
            >
              You don’t have any restaurants linked to your account yet.
            </div>

            <!-- List of restaurants -->
            <div v-else class="merchant-list">
              <article v-for="m in merchants" :key="m.id" class="merchant-card">
                <div class="merchant-card-header">
                  <div class="merchant-logo-placeholder">
                    <!-- If logo exists, show image, else initials -->
                    <img
                      v-if="m.logo_url"
                      :src="m.logo_url"
                      :alt="m.name || 'Merchant logo'"
                      class="merchant-logo-img"
                    />
                    <span v-else class="initials">
                      {{ (m.name || 'VS').trim().charAt(0).toUpperCase() }}
                    </span>
                  </div>
                  <div>
                    <h3>{{ m.name }}</h3>
                    <p class="muted tiny">
                      Foodie Group ID: {{ m.foodie_group_id || '—' }}
                    </p>
                  </div>
                </div>

                <div class="merchant-card-body">
                  <p>
                    <strong>Website:</strong>
                    <span class="placeholder-text">
                      {{ m.website_url || 'https://example.com' }}
                    </span>
                  </p>

                  <!-- Logo upload controls -->
                  <div class="logo-upload-row">
                    <label class="file-label">
                      <span class="file-label-text">
                        {{ m.logo_url ? 'Change Logo' : 'Upload Logo' }}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        @change="onLogoFileChange(m, $event)"
                      />
                    </label>

                    <span
                      v-if="uploadingLogoId === m.id"
                      class="muted tiny"
                      style="margin-left: 0.5rem;"
                    >
                      Uploading…
                    </span>
                  </div>

                  <p
                    v-if="logoUploadError && uploadErrorMerchantId === m.id"
                    class="muted tiny"
                    style="color: #b00020; margin-top: 0.25rem;"
                  >
                    {{ logoUploadError }}
                  </p>

                  <p class="muted tiny" style="margin-top: 0.5rem;">
                    Recommended: square PNG or JPG, up to 5 MB. This logo will be used on
                    all coupons for this restaurant.
                  </p>
                </div>
              </article>
            </div>
          </section>

          <!-- Merchant Tools -->
          <section class="section-card">
            <h2>Merchant Tools</h2>
            <p class="muted">
              Quick links for managing your coupons will live here.
            </p>

            <ul class="link-list">
              <li>
                <span class="link-label">Create / Submit a Coupon</span>
                <span class="link-helper">Will route to Coupon Submissions.</span>
              </li>
              <li>
                <span class="link-label">View Approved Coupons</span>
                <span class="link-helper">Link to your public coupon list.</span>
              </li>
              <li>
                <span class="link-label">Redemption Insights</span>
                <span class="link-helper">Analytics card coming later.</span>
              </li>
            </ul>
          </section>
        </template>

        <!-- FOODIE GROUP ADMIN VIEW -->
        <template v-else-if="role === 'foodie_group_admin'">
          <section class="section-card">
            <h2>Foodie Group Admin</h2>
            <p class="muted">
              Your main controls live in the Foodie Group dashboard. This page is
              just a quick overview.
            </p>

            <div class="admin-block">
              <p>
                You’re set up as a <strong>Foodie Group Admin</strong>. Soon,
                we’ll show a summary of your groups and key metrics here.
              </p>

              <button class="btn primary" disabled>
                Go to Foodie Group Dashboard
              </button>
              <p class="muted tiny">
                (Button is disabled for now – we’ll wire this up once the
                dashboard route is finalized.)
              </p>
            </div>
          </section>
        </template>

        <!-- FALLBACK / UNKNOWN ROLE -->
        <template v-else>
          <section class="section-card">
            <h2>Profile</h2>
            <p class="muted">
              Your account is signed in but doesn’t have a specific role yet.
              Once roles are wired up, this page will adapt automatically.
            </p>
          </section>
        </template>
      </div>
    </template>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { getAccessToken, signOut, signIn } from "@/services/authService";

export default {
  name: "UserProfile",

  data() {
    return {
      user: null,        // { id, email, name, role }
      merchants: [],     // list of restaurants if role === 'merchant'
      loadingUser: true,

      // logo upload state
      uploadingLogoId: null,
      logoUploadError: null,
      uploadErrorMerchantId: null,
    };
  },

  computed: {
    ...mapGetters("auth", ["isAuthenticated"]),

    role() {
      if (this.user && this.user.role) {
        return this.user.role;
      }
      return null;
    },

    roleLabel() {
      switch (this.role) {
        case "merchant":
          return "Merchant";
        case "customer":
          return "Customer";
        case "foodie_group_admin":
          return "Foodie Group Admin";
        default:
          return null;
      }
    },

    // If there are merchants, use the first one’s name for initials,
    // otherwise fall back to the user’s name or "VS".
    merchantInitials() {
      const sourceName =
        (this.merchants[0] && this.merchants[0].name) ||
        (this.user && this.user.name) ||
        "";

      const parts = sourceName.trim().split(" ");
      if (!parts[0]) return "VS";
      if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    },
  },

  async created() {
    if (!this.isAuthenticated) {
      this.loadingUser = false;
      return;
    }

    await this.loadUserFromApi();
  },

  methods: {
    async loadUserFromApi() {
      this.loadingUser = true;
      try {
        const token = await getAccessToken();
        const res = await fetch("/api/v1/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.error("Failed to load /api/v1/users/me", res.status);
          this.user = null;
          this.merchants = [];
          return;
        }

        const data = await res.json();
        this.user = {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role,
        };
        this.merchants = data.merchants || [];
      } catch (err) {
        console.error("Error fetching /api/v1/users/me", err);
        this.user = null;
        this.merchants = [];
      } finally {
        this.loadingUser = false;
      }
    },

    async onLogoFileChange(merchant, event) {
      const file = event.target.files[0];
      if (!file) return;

      this.logoUploadError = null;
      this.uploadErrorMerchantId = null;
      this.uploadingLogoId = merchant.id;

      try {
        const token = await getAccessToken();
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`/api/v1/merchants/${merchant.id}/logo`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        console.log('logo upload response status', res.status);

        if (!res.ok) {
          let message = "Upload failed";
          try {
            const errJson = await res.json();
            console.log('logo upload error payload', errJson);
            if (errJson && errJson.error) {
              message = errJson.error;
            }
          } catch (_) {
            // ignore json parse error
          }
          this.logoUploadError = message;
          this.uploadErrorMerchantId = merchant.id;
          return;
        }

        const updated = await res.json(); // { id, name, logo_url, owner_id }

        // Update merchants array in-place
        this.merchants = this.merchants.map((m) =>
          m.id === updated.id
            ? { ...m, logo_url: updated.logo_url || updated.logoUrl }
            : m
        );
      } catch (err) {
        console.error("Error uploading merchant logo", err);
        this.logoUploadError = "Unexpected error during upload";
        this.uploadErrorMerchantId = merchant.id;
      } finally {
        this.uploadingLogoId = null;
        // Reset the input so selecting the same file again still triggers change
        event.target.value = "";
      }
    },

    signOutNow() {
      signOut();
    },

    signInNow() {
      signIn();
    },
  },
};
</script>

<style scoped>
.profile-page {
  max-width: 1000px;
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

.muted {
  color: #777;
}

.small {
  font-size: 0.9rem;
}

.tiny {
  font-size: 0.8rem;
}

.section-card {
  background: #fff;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 1.5rem;
}

/* Account header / role pill */
.account-card {
  margin-bottom: 2rem;
}

.account-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.role-pill {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: #ef5430;
  color: #fff;
}

.user-info {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.user-meta p {
  margin: 0.3rem 0;
}

/* Grid layout for role-based cards */
.profile-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(0, 1.5fr);
  gap: 1.5rem;
}

@media (max-width: 800px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}

/* Customer: stats row */
.stat-row {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1;
  min-width: 140px;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: #fafafa;
  border: 1px solid #eee;
}

.stat-number {
  display: block;
  font-size: 1.4rem;
  font-weight: 600;
}

.stat-label {
  font-size: 0.85rem;
  color: #777;
}

/* Skeleton list placeholder */
.skeleton-list {
  list-style: none;
  padding: 0;
  margin-top: 1rem;
}

.skeleton-item {
  height: 14px;
  border-radius: 999px;
  background: linear-gradient(90deg, #f0f0f0 0%, #e5e5e5 50%, #f0f0f0 100%);
  margin-bottom: 0.7rem;
}

/* Merchant list + cards */
.merchant-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.merchant-card {
  border-radius: 10px;
  border: 1px solid #eee;
  padding: 0.75rem 1rem;
  background: #fafafa;
}

.merchant-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.merchant-card-header h3 {
  margin: 0;
}

.merchant-card-body p {
  margin: 0.25rem 0;
}

/* Logo placeholder / image */
.merchant-logo-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #f7f7f7;
  border: 1px dashed #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.merchant-logo-placeholder .initials {
  font-size: 1.4rem;
  font-weight: 600;
  color: #555;
}

.merchant-logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* File upload UI */
.logo-upload-row {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
}

.file-label {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  border: 1px solid #ddd;
  background: #fff;
  font-size: 0.85rem;
  cursor: pointer;
}

.file-label input[type="file"] {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.file-label-text {
  pointer-events: none;
}

.placeholder-text {
  color: #aaa;
}

/* Merchant tools */
.link-list {
  list-style: none;
  padding: 0;
  margin-top: 1rem;
}

.link-list li {
  padding: 0.6rem 0;
  border-bottom: 1px solid #eee;
}

.link-list li:last-child {
  border-bottom: none;
}

.link-label {
  display: block;
  font-weight: 500;
}

.link-helper {
  font-size: 0.8rem;
  color: #888;
}

/* Foodie admin */
.admin-block {
  margin-top: 1rem;
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

.btn.tertiary {
  background: #f5f5f5;
  color: #333;
}

.btn[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading {
  color: #555;
  font-style: italic;
}

.signin-card {
  text-align: center;
  margin-top: 2rem;
}

@media (max-width: 600px) {
  .profile-page {
    padding: 0 0.5rem;
  }

  .user-info {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
