<!-- src/components/Coupons/CouponRedemption.vue -->
<template>
  <div class="coupon-redemption">
    <h2>Redeem Coupon</h2>
    <p>Are you sure you want to redeem this coupon?</p>

    <!-- status banners -->
    <div v-if="error" class="banner banner-error">{{ error }}</div>
    <div v-if="redeemedAt" class="banner banner-success">
      Redeemed {{ new Date(redeemedAt).toLocaleString() }}
    </div>

    <div class="coupon-details">
      <p class="coupon-description">{{ coupon.description }}</p>
      <div class="validity" v-if="coupon.valid_from && coupon.expires_at">
        <small>Valid from: {{ formatDate(coupon.valid_from) }}</small>
        <br>
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
      <button
        @click="confirmRedemption"
        class="primary-btn"
        :disabled="loading"
      >
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
export default {
  name: "CouponRedemption",
  props: {
    coupon: { type: Object, required: true }
  },
  data() {
    return {
      loading: false,
      error: "",
      redeemedAt: ""
    };
  },
  methods: {
    formatDate(dateStr) {
      const date = new Date(dateStr);
      return isNaN(date) ? "" : date.toLocaleDateString();
    },

    // Try to retrieve an ID token if your app stores one (adjust as needed)
    getIdToken() {
      // Common places teams stash these:
      const fromLocal = localStorage.getItem("idToken");
      if (fromLocal) return fromLocal;
      try {
        if (window?.auth?.getIdToken) return window.auth.getIdToken();
        if (window?.oidcUser?.id_token) return window.oidcUser.id_token;
      } catch (_) {
        console.error('Error getting ID token', _);
      }
      return "";
    },

    async confirmRedemption() {
      this.error = "";
      this.redeemedAt = "";
      this.loading = true;
      try {
        const idToken = this.getIdToken();
        const res = await fetch(`/api/v1/coupons/${this.coupon.id}/redeem`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
          },
          // You can plumb through client meta if desired (geo, device, etc.)
          body: JSON.stringify({ /* location_meta: { lat, lng } */ })
        });

        // Handle common outcomes from the API contract
        if (res.status === 201) {
          const json = await res.json();
          this.redeemedAt = json.redeemed_at || new Date().toISOString();

          // Open details in a new tab (kept from your original)
          const url = `/coupon-details/${this.coupon.id}`;
          window.open(url, "_blank");

          // Notify parent for any state updates it needs
          this.$emit("confirm", { coupon: this.coupon, redeemed_at: this.redeemedAt });
          return;
        }

        if (res.status === 409) {
          const json = await res.json().catch(() => ({}));
          this.redeemedAt = json.redeemed_at || "";
          this.error = "This coupon has already been redeemed.";
          // Still open details to keep UX consistent if you want:
          const url = `/coupon-details/${this.coupon.id}`;
          window.open(url, "_blank");
          this.$emit("confirm", { coupon: this.coupon, redeemed_at: this.redeemedAt, duplicate: true });
          return;
        }

        // Other server responses (400, 401, 404, 5xx)
        const problem = await res.json().catch(() => ({}));
        this.error = problem.error || `Failed to redeem (HTTP ${res.status}).`;
      } catch (e) {
        this.error = "Network error while redeeming. Please try again.";
      } finally {
        this.loading = false;
      }
    },

    printCoupon() {
      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Coupon</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 2rem; }
              .qr-code { width: 150px; height: 150px; margin-top: 1rem; }
            </style>
          </head>
          <body>
            <h1>${this.coupon.title}</h1>
            <p>${this.coupon.description}</p>
            <div>
              <img src="${this.coupon.qr_code_url || ""}" alt="QR Code" class="qr-code" />
            </div>
            <p>Valid from: ${this.formatDate(this.coupon.valid_from)}</p>
            <p>Expires: ${this.formatDate(this.coupon.expires_at)}</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    },

    downloadPdf() {
      const pdfUrl = `/coupon-pdf/${this.coupon.id}`;
      window.open(pdfUrl, "_blank");
    }
  }
};
</script>

<style scoped>
.coupon-redemption {
  padding: 2rem;
  text-align: center;
  max-width: 400px;
  margin: 2rem auto;
  border: 1px solid #ddd;
  border-radius: 8px;
}
.banner {
  margin: 0 0 1rem 0;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.95rem;
  text-align: left;
}
.banner-error { background: #ffe8e6; color: #8a1f11; border: 1px solid #ffb4ac; }
.banner-success { background: #e8fff0; color: #0f6b2e; border: 1px solid #b8f1cf; }

.coupon-details {
  border: 1px solid #eee;
  padding: 1rem;
  margin-bottom: 1rem;
}
.coupon-description { font-size: 1.1rem; }
.validity {
  font-size: 0.8rem;
  color: #555;
  margin-top: 0.5rem;
}
.qr-code {
  width: 100px;
  height: 100px;
  margin-top: 1rem;
}
.actions { margin-top: 1rem; }
.actions button {
  margin: 0 0.5rem 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}
.primary-btn { background-color: #28a745; color: #fff; }
.secondary-btn { background-color: #007bff; color: #fff; }
.cancel-btn { background-color: #dc3545; color: #fff; }
.actions button[disabled] { opacity: 0.6; cursor: not-allowed; }
.actions button:hover { opacity: 0.9; }
</style>
