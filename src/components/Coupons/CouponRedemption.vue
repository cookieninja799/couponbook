<template>
  <div class="coupon-redemption">
    <h2>Redeem Coupon</h2>
    <p>Are you sure you want to redeem this coupon?</p>

    <div v-if="error" class="banner banner-error">{{ error }}</div>
    <div v-if="redeemedAt" class="banner banner-success">
      Redeemed {{ new Date(redeemedAt).toLocaleString() }}
    </div>

    <div class="coupon-details">
      <p class="coupon-description">{{ coupon.description }}</p>
      <div class="validity" v-if="coupon.valid_from && coupon.expires_at">
        <small>Valid from: {{ formatDate(coupon.valid_from) }}</small><br />
        <small>Expires: {{ formatDate(coupon.expires_at) }}</small>
      </div>
      <img
        v-if="coupon.qr_code_url"
        :src="coupon.qr_code_url"
        alt="QR Code"
        class="qr-code"
      />
    </div>

    <div class="actions">
      <button @click="confirmRedemption" class="primary-btn" :disabled="loading">
        <span v-if="loading">Redeeming…</span>
        <span v-else>Confirm & Open Details</span>
      </button>

      <button @click="printCoupon" class="secondary-btn" :disabled="loading">
        Print Coupon
      </button>
      <button @click="downloadPdf" class="secondary-btn" :disabled="loading">
        Download PDF
      </button>
      <button @click="$emit('cancel')" class="cancel-btn" :disabled="loading">
        Cancel
      </button>
    </div>
  </div>
</template>

<script>
import { userManager } from "@/services/authService.js";

export default {
  name: "CouponRedemption",
  props: { coupon: { type: Object, required: true } },
  data() {
    return { loading: false, error: "", redeemedAt: "" };
  },
  methods: {
    formatDate(dateStr) {
      const d = new Date(dateStr);
      return isNaN(d) ? "" : d.toLocaleDateString();
    },

    // Get access token first, fallback to id_token
    async getToken() {
      try {
        const user = await userManager.getUser();
        if (user?.access_token) {
          console.debug("[redeem] using access_token from userManager");
          return user.access_token;
        }
        if (user?.id_token) {
          console.debug("[redeem] fallback id_token from userManager");
          return user.id_token;
        }
      } catch (e) {
        console.error("[redeem] userManager.getUser failed", e);
      }

      // Fallback to persisted storage
      const access = localStorage.getItem("accessToken");
      if (access) return access;
      const id = localStorage.getItem("idToken");
      if (id) return id;
      return "";
    },

    async confirmRedemption() {
      this.error = "";
      this.redeemedAt = "";
      this.loading = true;

      try {
        const token = await this.getToken();
        if (!token) {
          this.error = "Please sign in to redeem this coupon.";
          return;
        }

        const res = await fetch(`/api/v1/coupons/${this.coupon.id}/redeem`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        });

        if (res.status === 201) {
          const json = await res.json().catch(() => ({}));
          this.redeemedAt = json.redeemed_at || new Date().toISOString();
          window.open(`/coupon-details/${this.coupon.id}`, "_blank");
          this.$emit("confirm", {
            coupon: this.coupon,
            redeemed_at: this.redeemedAt,
          });
          return;
        }

        if (res.status === 200) {
          const json = await res.json().catch(() => ({}));
          if (json.alreadyRedeemed) {
            this.error = "This coupon has already been redeemed.";
          }
          this.redeemedAt = json.redeemed_at || new Date().toISOString();
          window.open(`/coupon-details/${this.coupon.id}`, "_blank");
          return;
        }

        if (res.status === 401) {
          this.error = "Please sign in to redeem this coupon.";
          return;
        }

        const problem = await res.json().catch(() => ({}));
        this.error = problem.error || `Failed to redeem (HTTP ${res.status}).`;
      } catch (e) {
        console.error(e);
        this.error = "Network error while redeeming. Please try again.";
      } finally {
        this.loading = false;
      }
    },

    printCoupon() {
      const w = window.open("", "_blank");
      w.document.write(`
        <html><head><title>Print Coupon</title>
        <style>
        body{font-family:Arial;text-align:center;padding:2rem;}
        .qr-code{width:150px;height:150px;margin-top:1rem;}
        </style></head><body>
        <h1>${this.coupon.title}</h1>
        <p>${this.coupon.description}</p>
        <img src="${this.coupon.qr_code_url || ""}" class="qr-code" />
        <p>Valid from: ${this.formatDate(this.coupon.valid_from)}</p>
        <p>Expires: ${this.formatDate(this.coupon.expires_at)}</p>
        </body></html>
      `);
      w.document.close();
      w.print();
    },

    downloadPdf() {
      const pdfUrl = `/coupon-pdf/${this.coupon.id}`;
      window.open(pdfUrl, "_blank");
    },
  },
};
</script>

<style scoped>
.coupon-redemption {
  padding: var(--spacing-2xl);
  text-align: center;
  max-width: 400px;
  margin: var(--spacing-2xl) auto;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
}

.coupon-redemption h2 {
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-lg);
}

.coupon-redemption > p {
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-lg);
}
.banner {
  margin: 0 0 var(--spacing-lg) 0;
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  text-align: left;
}
.banner-error {
  background: var(--color-error-light);
  background: rgba(176, 0, 32, 0.1);
  color: var(--color-error-dark);
  border: 1px solid var(--color-error-light);
}
.banner-success {
  background: var(--color-success-light);
  background: rgba(40, 167, 69, 0.1);
  color: var(--color-success-dark);
  border: 1px solid var(--color-success-light);
}
.coupon-details {
  border: 1px solid var(--border-subtle);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  background: var(--color-bg-muted);
  color: var(--color-text-primary);
}
.coupon-description {
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}
.validity {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-sm);
}
.qr-code {
  width: 100px;
  height: 100px;
  margin-top: 1rem;
}
.actions {
  margin-top: 1rem;
}
.actions button {
  margin: 0 var(--spacing-sm) var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-base);
  min-height: var(--button-height-md);
  font-weight: var(--font-weight-medium);
  transition: background-color var(--transition-base);
}
.primary-btn {
  background-color: var(--color-success);
  color: var(--color-text-on-success);
}
.primary-btn:hover:not(:disabled) {
  background-color: var(--color-success-hover);
  color: var(--color-text-on-success);
}
.secondary-btn {
  background-color: var(--color-secondary);
  color: var(--color-text-on-secondary);
}
.secondary-btn:hover:not(:disabled) {
  background-color: var(--color-secondary-hover);
  color: var(--color-text-on-secondary);
}
.cancel-btn {
  background-color: var(--color-error);
  color: var(--color-text-on-error);
}
.cancel-btn:hover:not(:disabled) {
  background-color: var(--color-error-hover);
  color: var(--color-text-on-error);
}
.actions button[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}
.actions button:hover {
  opacity: 0.9;
}
</style>
