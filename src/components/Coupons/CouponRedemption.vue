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
.banner-error {
  background: #ffe8e6;
  color: #8a1f11;
  border: 1px solid #ffb4ac;
}
.banner-success {
  background: #e8fff0;
  color: #0f6b2e;
  border: 1px solid #b8f1cf;
}
.coupon-details {
  border: 1px solid #eee;
  padding: 1rem;
  margin-bottom: 1rem;
}
.coupon-description {
  font-size: 1.1rem;
}
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
.actions {
  margin-top: 1rem;
}
.actions button {
  margin: 0 0.5rem 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}
.primary-btn {
  background-color: #28a745;
  color: #fff;
}
.secondary-btn {
  background-color: #007bff;
  color: #fff;
}
.cancel-btn {
  background-color: #dc3545;
  color: #fff;
}
.actions button[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}
.actions button:hover {
  opacity: 0.9;
}
</style>
