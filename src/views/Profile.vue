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
              Your personal stats for VivaSpot Coupon Book.
            </p>

            <div v-if="customerStats.error" class="muted tiny" style="color:#b00020;margin-bottom:0.5rem;">
              {{ customerStats.error }}
            </div>

            <div class="stat-row">
              <div class="stat-card">
                <span class="stat-number">
                  <span v-if="customerStats.loading">…</span>
                  <span v-else>
                    {{ customerStats.couponsRedeemed != null ? customerStats.couponsRedeemed : '—' }}
                  </span>
                </span>
                <span class="stat-label">Coupons Redeemed</span>
              </div>

              <div class="stat-card">
                <span class="stat-number">
                  <span v-if="customerStats.loading">…</span>
                  <span v-else>
                    {{ customerStats.activeCouponBooks != null ? customerStats.activeCouponBooks : '—' }}
                  </span>
                </span>
                <span class="stat-label">Active Coupon Books</span>
              </div>
            </div>
          </section>

          <!-- Purchased Coupon Books -->
          <section class="section-card">
            <h2>Purchased Coupon Books</h2>

            <p class="muted" v-if="!customerStats.loading && !customerStats.purchases.length">
              Once you unlock a foodie group, it will show up here with purchase and expiry info.
            </p>

            <!-- Skeleton while loading -->
            <ul v-if="customerStats.loading" class="skeleton-list">
              <li class="skeleton-item"></li>
              <li class="skeleton-item"></li>
              <li class="skeleton-item"></li>
            </ul>

            <!-- Actual list -->
            <ul v-else-if="customerStats.purchases.length" class="purchases-list">
              <li v-for="p in customerStats.purchases" :key="p.id" class="purchase-item">
                <div class="purchase-main">
                  <strong>{{ p.groupName }}</strong>
                  <span class="muted tiny">
                    · Purchased {{ formatDateMedium(p.purchasedAt) }}
                  </span>
                </div>
                <div class="muted tiny">
                  Status: {{ p.status }}
                  <span v-if="p.expiresAt">
                    · Expires {{ formatDateMedium(p.expiresAt) }}
                  </span>
                </div>
              </li>
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
            <div v-if="merchants.length === 0" class="muted small" style="margin-top: 0.75rem;">
              You don’t have any restaurants linked to your account yet.
            </div>

            <!-- List of restaurants -->
            <div v-else class="merchant-list">
              <article v-for="m in merchants" :key="m.id" class="merchant-card">
                <div class="merchant-card-header">
                  <div class="merchant-logo-placeholder">
                    <!-- If logo exists, show image, else initials -->
                    <img v-if="m.logo_url" :src="m.logo_url" :alt="m.name || 'Merchant logo'"
                      class="merchant-logo-img" />
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
                      <input type="file" accept="image/*" @change="onLogoFileChange(m, $event)" />
                    </label>

                    <span v-if="uploadingLogoId === m.id" class="muted tiny" style="margin-left: 0.5rem;">
                      Uploading…
                    </span>
                  </div>

                  <p v-if="logoUploadError && uploadErrorMerchantId === m.id" class="muted tiny"
                    style="color: #b00020; margin-top: 0.25rem;">
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
              These tools apply to all restaurants linked to your account. Later we’ll
              add filters so you can focus on a single location at a time.
            </p>

            <ul class="link-list">
              <!-- Create / Submit -->
              <li class="link-row clickable" @click="goToCouponSubmissions">
                <span class="link-label">Create / Submit a Coupon</span>
                <span class="link-helper">
                  Open the submission form and choose which restaurant the coupon belongs to.
                </span>
              </li>

              <!-- Approved -->
              <li class="link-row clickable" @click="loadApprovedCoupons">
                <span class="link-label">View Approved Coupons</span>
                <span class="link-helper">
                  See all live, approved coupons across your restaurants.
                </span>
              </li>

              <!-- Rejected -->
              <li class="link-row clickable" @click="loadRejectedCoupons">
                <span class="link-label">View Rejected Coupons</span>
                <span class="link-helper">
                  Review coupons that were not approved and see the reason.
                </span>
              </li>

              <!-- Insights -->
              <li class="link-row clickable" @click="loadRedemptionInsights">
                <span class="link-label">Redemption Insights</span>
                <span class="link-helper">
                  See how many times coupons from your restaurants have been redeemed.
                </span>
              </li>
            </ul>

            <!-- Status / errors -->
            <p v-if="merchantToolsLoading" class="muted tiny" style="margin-top: 0.75rem;">
              Loading…
            </p>
            <p v-if="merchantToolsError" class="tiny" style="margin-top: 0.5rem; color: #b00020;">
              {{ merchantToolsError }}
            </p>

            <!-- Approved coupons list -->
            <div v-if="activeToolsView === 'approved' && approvedCoupons.length" class="tools-results-block">
              <h3 class="tiny-heading">Approved Coupons</h3>
              <ul class="tiny-list">
                <li v-for="c in approvedCoupons" :key="c.id">
                  <strong>{{ c.title }}</strong>
                  <span class="muted tiny">
                    · {{ merchantNameById(c.merchant_id) }}
                  </span>
                </li>
              </ul>
            </div>

            <!-- Rejected coupon submissions -->
            <div v-if="activeToolsView === 'rejected' && rejectedCoupons.length" class="tools-results-block">
              <h3 class="tiny-heading">Rejected Coupons</h3>
              <ul class="tiny-list">
                <li v-for="sub in rejectedCoupons" :key="sub.id">
                  <strong>{{ sub.submissionData?.title || 'Untitled coupon' }}</strong>
                  <span class="muted tiny">
                    · {{ merchantNameById(sub.merchantId) }}
                  </span>
                  <br />
                  <span class="muted tiny">
                    Rejected on
                    {{ formatDateTiny(sub.submittedAt) }}
                    <span v-if="sub.rejectionMessage">
                      — Reason: {{ sub.rejectionMessage }}
                    </span>
                  </span>
                </li>
              </ul>
            </div>

            <!-- Redemption insights summary -->
            <div v-if="activeToolsView === 'insights' && redemptionInsights.length" class="tools-results-block">
              <h3 class="tiny-heading">Redemption Insights</h3>
              <ul class="tiny-list">
                <li v-for="row in redemptionInsights" :key="row.merchantId">
                  <strong>{{ row.merchantName }}</strong>
                  <span class="muted tiny">
                    · {{ row.totalRedemptions }} total redemptions
                  </span>
                </li>
              </ul>
            </div>

            <!-- Empty states per view -->
            <div v-if="activeToolsView === 'approved' && !merchantToolsLoading && !approvedCoupons.length"
              class="muted tiny" style="margin-top: 0.5rem;">
              No approved coupons found for your restaurants yet.
            </div>

            <div v-if="activeToolsView === 'rejected' && !merchantToolsLoading && !rejectedCoupons.length"
              class="muted tiny" style="margin-top: 0.5rem;">
              No rejected coupon submissions found for your restaurants.
            </div>

            <div v-if="activeToolsView === 'insights' && !merchantToolsLoading && !redemptionInsights.length"
              class="muted tiny" style="margin-top: 0.5rem;">
              No redemptions recorded yet for coupons from your restaurants.
            </div>
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
      user: null,
      merchants: [],
      loadingUser: true,
      customerStats: {
        loading: false,
        error: null,
        couponsRedeemed: null,
        activeCouponBooks: null,
        purchases: [],
      },

      // logo upload state
      uploadingLogoId: null,
      logoUploadError: null,
      uploadErrorMerchantId: null,

      // merchant tools state
      approvedCoupons: [],
      rejectedCoupons: [],
      redemptionInsights: [],
      merchantToolsLoading: false,
      merchantToolsError: null,
      activeToolsView: null, // 'approved' | 'rejected' | 'insights'
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

        if (this.role === 'customer') {
          this.loadCustomerStats();
        }
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

    merchantNameById(id) {
      const m = this.merchants.find((mm) => mm.id === id);
      return m && m.name ? m.name : 'Unknown merchant';
    },

    formatDateTiny(value) {
      if (!value) return '—';
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return '—';
      return d.toLocaleDateString();
    },

    resetMerchantToolsState(view) {
      this.activeToolsView = view || null;
      this.merchantToolsError = null;
      if (view === 'approved') {
        // keep approved list between clicks if you want; for now we just reload each time
        this.rejectedCoupons = [];
        this.redemptionInsights = [];
      } else if (view === 'rejected') {
        this.approvedCoupons = [];
        this.redemptionInsights = [];
      } else if (view === 'insights') {
        this.approvedCoupons = [];
        this.rejectedCoupons = [];
      } else {
        this.approvedCoupons = [];
        this.rejectedCoupons = [];
        this.redemptionInsights = [];
      }
    },

    // Navigate to SurveyJS coupon submission page
    goToCouponSubmissions() {
      // adjust path/name if your route is different
      this.$router.push('/coupon-submissions');
    },

    async loadApprovedCoupons() {
      if (!this.merchants.length) {
        this.activeToolsView = 'approved';
        this.merchantToolsError = 'You do not have any restaurants linked to this account yet.';
        this.approvedCoupons = [];
        return;
      }

      this.resetMerchantToolsState('approved');
      this.merchantToolsLoading = true;

      try {
        const token = await getAccessToken();
        const res = await fetch('/api/v1/coupons', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to load coupons, status ${res.status}`);
        }

        const allCoupons = await res.json();
        const merchantIds = new Set(this.merchants.map((m) => m.id));

        // Every coupon row has merchant_id from the coupons router
        this.approvedCoupons = allCoupons.filter((c) =>
          merchantIds.has(c.merchant_id)
        );
      } catch (err) {
        console.error('Error loading approved coupons', err);
        this.merchantToolsError = 'Could not load approved coupons.';
      } finally {
        this.merchantToolsLoading = false;
      }
    },

    async loadRejectedCoupons() {
      if (!this.merchants.length) {
        this.activeToolsView = 'rejected';
        this.merchantToolsError = 'You do not have any restaurants linked to this account yet.';
        this.rejectedCoupons = [];
        return;
      }

      this.resetMerchantToolsState('rejected');
      this.merchantToolsLoading = true;

      try {
        const token = await getAccessToken();
        const merchantIds = this.merchants.map((m) => m.id).join(',');

        // Assumes backend lets you filter by state + merchantIds query
        const url = `/api/v1/coupon-submissions?state=rejected&merchantIds=${encodeURIComponent(
          merchantIds
        )}`;

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to load rejected submissions, status ${res.status}`);
        }

        const subs = await res.json();
        this.rejectedCoupons = subs || [];
      } catch (err) {
        console.error('Error loading rejected coupons', err);
        this.merchantToolsError = 'Could not load rejected coupon submissions.';
      } finally {
        this.merchantToolsLoading = false;
      }
    },

    async loadRedemptionInsights() {
      if (!this.merchants.length) {
        this.activeToolsView = 'insights';
        this.merchantToolsError =
          'You do not have any restaurants linked to this account yet.';
        this.redemptionInsights = [];
        return;
      }

      this.resetMerchantToolsState('insights');
      this.merchantToolsLoading = true;

      try {
        const token = await getAccessToken();

        // Backend route: returns rows per coupon the merchant-owner has
        // [{ merchantId, merchantName, couponId, couponTitle, redemptions, lastRedeemedAt }]
        const res = await fetch(
          '/api/v1/coupons/redemptions/merchant-insights',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error(
            `Failed to load redemption insights, status ${res.status}`
          );
        }

        const rows = await res.json();

        // Collapse rows into per-merchant totals to match the template:
        // <li v-for="row in redemptionInsights" :key="row.merchantId">
        //   {{ row.merchantName }} · {{ row.totalRedemptions }}
        const byMerchant = {};

        for (const r of rows) {
          if (!byMerchant[r.merchantId]) {
            byMerchant[r.merchantId] = {
              merchantId: r.merchantId,
              merchantName: r.merchantName,
              totalRedemptions: 0,
            };
          }
          byMerchant[r.merchantId].totalRedemptions += Number(r.redemptions || 0);
        }

        this.redemptionInsights = Object.values(byMerchant);
      } catch (err) {
        console.error('Error loading redemption insights', err);
        this.merchantToolsError = 'Could not load redemption insights.';
        this.redemptionInsights = [];
      } finally {
        this.merchantToolsLoading = false;
      }
    },

    formatDateMedium(value) {
      if (!value) return '—';
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return '—';
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    },

    async loadCustomerStats() {
      if (this.role !== 'customer') return;

      this.customerStats.loading = true;
      this.customerStats.error = null;

      try {
        const token = await getAccessToken();

        // 1) Redemptions count
        const redRes = await fetch('/api/v1/coupons/redemptions/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!redRes.ok) {
          throw new Error(`Failed to load redemptions (status ${redRes.status})`);
        }
        const redRows = await redRes.json();
        this.customerStats.couponsRedeemed = Array.isArray(redRows)
          ? redRows.length
          : 0;

        // 2) Purchases
        const pRes = await fetch('/api/v1/groups/my/purchases', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!pRes.ok) {
          throw new Error(`Failed to load purchases (status ${pRes.status})`);
        }
        const purchases = await pRes.json();
        this.customerStats.purchases = Array.isArray(purchases) ? purchases : [];

        // 3) Derive active coupon books: paid + not expired (or no expiry)
        const now = new Date();
        const active = this.customerStats.purchases.filter((p) => {
          if (p.status !== 'paid') return false;
          if (!p.expiresAt) return true;
          const exp = new Date(p.expiresAt);
          if (Number.isNaN(exp.getTime())) return true;
          return exp >= now;
        });

        this.customerStats.activeCouponBooks = active.length;
      } catch (err) {
        console.error('Error loading customer stats', err);
        this.customerStats.error = 'Could not load your coupon activity.';
        this.customerStats.couponsRedeemed = null;
        this.customerStats.activeCouponBooks = null;
        this.customerStats.purchases = [];
      } finally {
        this.customerStats.loading = false;
      }
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

.link-row.clickable {
  cursor: pointer;
}

.link-row.clickable:hover .link-label {
  text-decoration: underline;
}

.tools-results-block {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid #eee;
}

.tiny-heading {
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.tiny-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tiny-list li {
  margin-bottom: 0.35rem;
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

.purchases-list {
  list-style: none;
  padding: 0;
  margin: 0.75rem 0 0;
}

.purchase-item {
  padding: 0.6rem 0;
  border-top: 1px solid #eee;
}

.purchase-item:first-child {
  border-top: none;
}

.purchase-main {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  align-items: baseline;
}
</style>
