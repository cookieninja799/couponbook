<!-- src/views/CouponSubmissions.vue -->
<template>
  <div class="coupon-submissions">
    <!-- NOT AUTHENTICATED -->
    <section v-if="!isAuthenticated" class="section-card signin-card">
      <h1>Submit a New Coupon</h1>
      <p class="muted">
        You need to be signed in as a merchant or admin to submit coupons.
      </p>
      <button class="btn primary" @click="signInNow">
        <i class="pi pi-sign-in icon-spacing-sm"></i>Sign In to Continue
      </button>
      <p class="muted tiny">
        You'll be redirected to the secure sign-in page and brought back here after.
      </p>
    </section>

    <!-- ACCESS CHECK IN PROGRESS -->
    <section v-else-if="!authChecked" class="section-card access-check-card">
      <h1>Submit a New Coupon</h1>
      <p class="subtitle">Checking your permissions…</p>
    </section>

    <!-- AUTHENTICATED BUT NOT AUTHORIZED -->
    <section v-else-if="notAuthorized" class="section-card access-denied-card">
      <h1>Access Denied</h1>
      <p>{{ notAuthorizedMessage }}</p>
      <button class="btn primary" @click="$router.push('/profile')">
        <i class="pi pi-arrow-left icon-spacing-sm"></i>Back to Profile
      </button>
    </section>

    <!-- AUTHORIZED BUT NO MERCHANTS (foodie_group_admin with 0 restaurants) -->
    <section v-else-if="noMerchants" class="section-card empty-state-card">
      <h1>No Restaurants Linked</h1>
      <p class="muted">
        You don't have any restaurants linked to your account yet.
        To submit coupons, you need to own at least one restaurant.
      </p>
      <button class="btn primary" @click="$router.push('/profile')">
        <i class="pi pi-arrow-left icon-spacing-sm"></i>Back to Profile
      </button>
      <p class="muted tiny">
        Contact support if you believe this is an error.
      </p>
    </section>

    <!-- AUTHENTICATED + AUTHORIZED: SHOW SURVEY OR SUCCESS -->
    <template v-else>
      <!-- SUCCESS STATE -->
      <section v-if="submissionSuccess" class="section-card success-card">
        <div class="success-content">
          <div class="success-icon">
            <i class="pi pi-check-circle"></i>
          </div>
          <h1>Coupon Submitted Successfully!</h1>
          <p class="success-message">
            Your coupon has been sent for approval. You'll see it live once your Foodie Group accepts it.
          </p>
          <div class="success-actions">
            <button class="btn primary" @click="goToCouponBook">
              <i class="pi pi-arrow-right icon-spacing-sm"></i>View Coupon Book
            </button>
            <button class="btn secondary" @click="submitAnother">
              <i class="pi pi-plus icon-spacing-sm"></i>Submit Another Coupon
            </button>
          </div>
        </div>
      </section>

      <!-- SURVEY FORM -->
      <div v-else class="submissions">
        <h1>Submit a New Coupon</h1>
        <survey-component :model="survey" />
      </div>
    </template>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { Model } from 'survey-core'
import { SurveyComponent } from 'survey-vue3-ui'
import { couponSurveyJson } from '@/data/couponSurvey.js'
import { getAccessToken, signIn } from '@/services/authService'

const API_BASE = '/api/v1'
const WEBHOOK_URL = 'https://n8n.vivaspot.com/webhook/7d15576d-01a3-49c8-b0f4-6c490e54baa7'
const TEST_EMAIL = 'thommy@ivalu8.com'

// Roles allowed to access this page
const ALLOWED_ROLES = ['admin', 'merchant', 'foodie_group_admin']

export default {
  name: 'CouponSubmissions',

  components: {
    SurveyComponent,
  },

  data() {
    return {
      // Auth / gating state
      user: null,
      merchants: [],
      authChecked: false,
      notAuthorized: false,
      notAuthorizedMessage: 'You are not authorized to submit coupons.',

      // Survey
      survey: null,
      
      // Submission state
      submissionSuccess: false,
    }
  },

  computed: {
    ...mapGetters('auth', ['isAuthenticated']),

    role() {
      return this.user?.role || null
    },

    noMerchants() {
      // Show empty state if user is foodie_group_admin with no merchants
      // (admin and merchant roles always have access regardless of merchants)
      if (this.role === 'foodie_group_admin' && this.merchants.length === 0) {
        return true
      }
      return false
    },
  },

  async created() {
    // If not logged in, let the sign-in gate render; do not hit the API.
    if (!this.isAuthenticated) {
      this.authChecked = true
      return
    }

    try {
      await this.loadCurrentUser()

      // If loadCurrentUser() decided we're not authorized, bail early.
      if (this.notAuthorized) return

      // If user has no merchants and is foodie_group_admin, bail (noMerchants will show)
      if (this.noMerchants) return

      // Initialize survey and load dropdown choices
      await this.initializeSurvey()
    } finally {
      this.authChecked = true
    }
  },

  methods: {
    signInNow() {
      signIn()
    },

    markNotAuthorized(customMsg) {
      this.notAuthorized = true
      if (customMsg) {
        this.notAuthorizedMessage = customMsg
      }
    },

    async loadCurrentUser() {
      try {
        const token = await getAccessToken()
        if (!token) {
          this.markNotAuthorized(
            'Your session does not have a valid access token. Please sign in again.'
          )
          return
        }

        const res = await fetch(`${API_BASE}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (res.status === 401) {
          this.markNotAuthorized(
            'You are not signed in with a valid session. Please sign in again.'
          )
          return
        }

        if (!res.ok) {
          console.error('[CouponSubmissions] Failed to load /api/v1/users/me', res.status)
          this.markNotAuthorized(
            'Unable to verify your account at this time. Please try again later.'
          )
          return
        }

        const data = await res.json()
        this.user = {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role,
        }
        this.merchants = data.merchants || []

        // Role check: only allowed roles can access
        if (!ALLOWED_ROLES.includes(this.user.role)) {
          this.markNotAuthorized(
            'You are signed in, but you do not have permission to submit coupons. Only merchants and admins can submit coupons.'
          )
        }
      } catch (err) {
        console.error('[CouponSubmissions] loadCurrentUser error', err)
        this.markNotAuthorized(
          'Unable to verify your permissions at this time.'
        )
      }
    },

    async initializeSurvey() {
      // Create survey model
      this.survey = new Model(couponSurveyJson)

      // Hide the default completion page - we'll show our own success message
      this.survey.showCompletedPage = false

      // Load dropdown choices
      await Promise.all([
        this.loadChoices('group_id', 'groups'),
        this.loadChoices('merchant_id', 'merchants/mine', { authRequired: true }),
      ])

      // Register the completion handler
      this.survey.onComplete.add(this.handleSubmit)
    },

    async loadChoices(questionName, endpoint, { authRequired = false } = {}) {
      try {
        const headers = {}
        if (authRequired) {
          const token = await getAccessToken()
          if (!token) {
            throw new Error('You must be signed in to load this data')
          }
          headers.Authorization = `Bearer ${token}`
        }

        const res = await fetch(`${API_BASE}/${endpoint}`, { headers })
        if (!res.ok) throw new Error(res.statusText)
        const items = await res.json()
        const q = this.survey.getQuestionByName(questionName)
        if (q) {
          q.choices = items.map((i) => ({ value: i.id, text: i.name }))
        }
        return items
      } catch (err) {
        console.error(`Failed to load ${endpoint}:`, err)
        return []
      }
    },

    async handleSubmit(sender) {
      const d = sender.data

      // Build submission_data payload
      const submissionData = {
        title: d.title,
        description: d.description,
        coupon_type: d.coupon_type,
        discount_value: parseFloat(d.discount_value) || 0,
        valid_from: d.valid_from,
        expires_at: d.expires_at,
        qr_code_url: d.qr_code_url,
        locked: d.locked,
        cuisine_type: d.cuisine_type,
      }

      try {
        const token = await getAccessToken()
        if (!token) {
          throw new Error('You must be signed in to submit a coupon')
        }

        // 1) Insert into coupon_submissions
        const res = await fetch(`${API_BASE}/coupon-submissions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            group_id: d.group_id,
            merchant_id: d.merchant_id,
            submission_data: submissionData,
          }),
        })
        if (!res.ok) throw new Error(`Status ${res.status}`)
        console.log('🗂 Saved submission:', await res.json())

        // 2) Fire off the n8n webhook for email notification
        await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: TEST_EMAIL,
            groupId: d.group_id,
            merchantId: d.merchant_id,
            submission_data: submissionData,
          }),
        })

        // Show success state instead of alert popup
        this.submissionSuccess = true
      } catch (err) {
        console.error('❌ Submission error:', err)
        alert(`⚠️ Coupon creation failed: ${err.message}`)
      }
    },

    goToCouponBook() {
      this.$router.push({ name: 'CouponBook' })
    },

    submitAnother() {
      this.submissionSuccess = false
      // Reinitialize the survey to allow another submission
      this.initializeSurvey()
    },
  },
}
</script>

<style scoped>
.coupon-submissions {
  padding: var(--spacing-2xl);
  max-width: var(--container-xl);
  margin: 0 auto;
}

@media (max-width: 768px) {
  .coupon-submissions {
    padding: var(--spacing-lg);
  }
}

.submissions {
  max-width: 700px;
  margin: 0 auto;
}

.section-card {
  background: var(--color-bg-primary);
  padding: var(--spacing-xl);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--spacing-xl);
  color: var(--color-text-primary);
}

.section-card h1,
.section-card h2 {
  color: var(--color-text-primary);
}

.signin-card,
.access-check-card,
.access-denied-card,
.empty-state-card,
.success-card {
  text-align: center;
  max-width: 600px;
  margin: var(--spacing-3xl) auto;
  padding: var(--spacing-xl);
  color: var(--color-text-primary);
}

.success-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
}

.success-icon {
  font-size: 4rem;
  color: var(--color-success);
  margin-bottom: var(--spacing-sm);
}

.success-icon .pi-check-circle {
  font-size: 4rem;
}

.success-card h1 {
  color: var(--color-text-primary);
  margin: 0;
}

.success-message {
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
  margin: 0;
}

.success-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
  flex-wrap: wrap;
  justify-content: center;
}

.btn.secondary {
  background: var(--color-success);
  color: var(--color-text-on-success);
}

.btn.secondary:hover:not(:disabled) {
  background: var(--color-success-hover);
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
