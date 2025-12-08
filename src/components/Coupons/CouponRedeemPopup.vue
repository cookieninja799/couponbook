<!-- src/components/Coupons/CouponRedeemPopup.vue -->
<template>
  <div class="page">
    <div class="dialog">
      <div class="popup-wrap">
        <header class="popup-header">
          <h2>{{ couponTitle || 'Redeem Coupon' }}</h2>
        </header>

        <section v-if="loading" class="state">Loading…</section>
        <section v-else-if="error" class="state error">⚠️ {{ error }}</section>

        <section v-else>
          <!-- NOT REDEEMED YET -->
          <div v-if="!redeemed" class="confirm">
            <p class="lead">
              <strong>Are you sure?</strong>
              This coupon can be redeemed only once with your account. After confirming,
              you won’t be able to redeem it again.
            </p>

            <p class="note">
              Printing or downloading the coupon and viewing full coupon details is disabled
              until you confirm redemption.
            </p>

            <div class="actions">
              <button class="btn primary" @click="confirmRedeem" :disabled="submitting">
                {{ submitting ? 'Redeeming…' : 'Confirm Redeem' }}
              </button>
              <button class="btn ghost" @click="windowClose">Cancel</button>
            </div>

            <div v-if="error" class="state error">⚠️ {{ error }}</div>
          </div>

          <!-- ALREADY / NOW REDEEMED -->
          <div v-else class="redeemed">
            <p class="success">✅ Redeemed on {{ fmtDate(redeemedAt) }}</p>

            <!-- NEW: usage instructions -->
            <p class="instructions">
              Show this coupon receipt to your server or cashier at the restaurant so they can
              verify it and apply your discount to your bill.
            </p>

            <div class="details-card">
              <h3>Coupon Details</h3>
              <dl class="details-list">
                <div>
                  <dt>Title</dt>
                  <dd>{{ couponTitle }}</dd>
                </div>
                <div>
                  <dt>Description</dt>
                  <dd>{{ couponDescription || '—' }}</dd>
                </div>
                <div>
                  <dt>Type</dt>
                  <dd>{{ couponType || '—' }}</dd>
                </div>
                <div>
                  <dt>Value</dt>
                  <dd>{{ couponValueDisplay }}</dd>
                </div>
                <div>
                  <dt>Valid From</dt>
                  <dd>{{ couponValidFromDisplay }}</dd>
                </div>
                <div>
                  <dt>Expires At</dt>
                  <dd>{{ couponExpiresAtDisplay }}</dd>
                </div>
                <div>
                  <dt>Merchant</dt>
                  <dd>{{ couponMerchantDisplay }}</dd>
                </div>
              </dl>

              <div class="qr-wrapper" v-if="qrCodeUrl">
                <img :src="qrCodeUrl" alt="Coupon QR" class="qr" />
              </div>
            </div>

            <div class="actions">
              <button class="btn" @click="printCoupon">Print</button>
              <a v-if="pdfUrl" class="btn" :href="downloadUrlSecured" target="_self" download>
                Download PDF
              </a>
              <button class="btn ghost" @click="windowClose">Close</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
import { userManager as svcUserManager } from "@/services/authService.js";

export default {
  name: "CouponRedeemPopup",
  data() {
    return {
      coupon: null,
      loading: true,
      error: null,
      redeemed: false,
      redeemedAt: null,
      submitting: false,
      blockPrintStyleEl: null,
      origPrint: null,
    };
  },
  computed: {
    couponId() {
      return this.$route.params.id;
    },

    // ---- Normalized coupon fields ----
    couponTitle() {
      return this.coupon?.title ?? "";
    },
    couponDescription() {
      return this.coupon?.description ?? this.coupon?.desc ?? "";
    },
    qrCodeUrl() {
      return this.coupon?.qr_code_url ?? this.coupon?.qrCodeUrl ?? null;
    },
    pdfUrl() {
      return this.coupon?.pdf_url ?? this.coupon?.pdfUrl ?? null;
    },
    downloadUrlSecured() {
      return this.pdfUrl || "#";
    },
    couponType() {
      return this.coupon?.coupon_type ?? this.coupon?.couponType ?? "";
    },
    couponValueRaw() {
      return this.coupon?.discount_value ?? this.coupon?.discountValue ?? 0;
    },
    couponValueDisplay() {
      if (this.couponType === "percent") {
        return `${this.couponValueRaw ?? 0}%`;
      }
      if (this.couponType === "amount") {
        return `$${this.couponValueRaw ?? 0}`;
      }
      return String(this.couponValueRaw ?? 0);
    },
    couponValidFrom() {
      return this.coupon?.valid_from ?? this.coupon?.validFrom ?? null;
    },
    couponExpiresAt() {
      return this.coupon?.expires_at ?? this.coupon?.expiresAt ?? null;
    },
    couponValidFromDisplay() {
      return this.couponValidFrom ? this.fmtDateShort(this.couponValidFrom) : "—";
    },
    couponExpiresAtDisplay() {
      return this.couponExpiresAt ? this.fmtDateShort(this.couponExpiresAt) : "—";
    },
    couponMerchantId() {
      return this.coupon?.merchant_id ?? this.coupon?.merchantId ?? null;
    },
    couponMerchantDisplay() {
      return this.coupon?.merchant_name ?? this.couponMerchantId ?? "—";
    },
  },

  async created() {
    try {
      const res = await fetch(`/api/v1/coupons/${this.couponId}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      this.coupon = await res.json();
    } catch (e) {
      this.error = e.message || "Failed to load coupon";
    } finally {
      this.loading = false;
    }

    this.installPrintBlocker();
    window.addEventListener("keydown", this.preventPrintHotkeys, true);
    window.addEventListener("beforeunload", this.cleanup, { once: true });
  },

  beforeUnmount() {
    this.cleanup();
  },

  methods: {
    manager() {
      return svcUserManager || window.userManager || null;
    },

    async getAccessToken() {
      try {
        const um = this.manager();
        if (um?.getUser) {
          let u = await um.getUser();
          if (!u || !u.access_token) {
            if (um.signinSilent) {
              try {
                u = await um.signinSilent();
              } catch (e) {
                void e;
              }
            }
          }
          if (u?.access_token) return u.access_token;
        }
      } catch (e) {
        console.error("[redeem] userManager access_token lookup failed", e);
      }

      try {
        const fromLocal = localStorage.getItem("accessToken");
        if (fromLocal) return fromLocal;
      } catch (e) {
        void e;
      }

      const scan = (storage) => {
        try {
          for (let i = 0; i < storage.length; i++) {
            const k = storage.key(i);
            if (k && k.startsWith("oidc.user:")) {
              const raw = storage.getItem(k);
              if (!raw) continue;
              const obj = JSON.parse(raw);
              if (obj?.access_token) return obj.access_token;
            }
          }
        } catch (e) {
          void e;
        }
        return null;
      };
      const fromSession = scan(window.sessionStorage || {});
      if (fromSession) return fromSession;
      const fromLocalOidc = scan(window.localStorage || {});
      if (fromLocalOidc) return fromLocalOidc;

      return null;
    },

    async getIdTokenFallback() {
      try {
        const um = this.manager();
        if (um?.getUser) {
          const u = await um.getUser();
          if (u?.id_token) return u.id_token;
        }
      } catch (e) {
        void e;
      }

      try {
        const fromLocal = localStorage.getItem("idToken");
        if (fromLocal) return fromLocal;
      } catch (e) {
        void e;
      }

      const scan = (storage) => {
        try {
          for (let i = 0; i < storage.length; i++) {
            const k = storage.key(i);
            if (k && k.startsWith("oidc.user:")) {
              const raw = storage.getItem(k);
              const obj = raw && JSON.parse(raw);
              if (obj?.id_token) return obj.id_token;
            }
          }
        } catch (e) {
          void e;
        }
        return null;
      };
      const fromSession = scan(window.sessionStorage || {});
      if (fromSession) return fromSession;
      const fromLocalOidc = scan(window.localStorage || {});
      if (fromLocalOidc) return fromLocalOidc;

      return null;
    },

    async confirmRedeem() {
      if (this.submitting) return;
      this.error = null;
      this.submitting = true;

      const accessToken = await this.getAccessToken();
      const token = accessToken || (await this.getIdTokenFallback());

      if (!token) {
        this.error = "Please sign in to redeem this coupon.";
        this.submitting = false;
        return;
      }

      try {
        const mid = token.split(".")[1] || "";
        const payload = mid ? JSON.parse(atob(mid)) : null;
        console.debug("[redeem] token_use:", payload && payload.token_use);
      } catch (e) {
        void e;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const res = await fetch(`/api/v1/coupons/${this.couponId}/redeem`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
          signal: controller.signal,
        }).catch((e) => {
          throw new Error(
            e?.name === "AbortError"
              ? "Request timed out. Please try again."
              : "Network error. Check your connection or CORS settings."
          );
        });

        clearTimeout(timeoutId);

        if (res.status === 401) {
          this.error = "Please sign in to redeem this coupon.";
          return;
        }

        if (res.status === 409) {
          const j = await res.json().catch(() => ({}));
          this.redeemed = true;
          this.redeemedAt =
            j.redeemed_at || j.redeemedAt || new Date().toISOString();
          this.uninstallPrintBlocker();
          try {
            if (window.opener) {
              window.opener.postMessage(
                { type: "coupon-redeemed", couponId: this.couponId },
                "*"
              );
            }
          } catch (e) {
            void e;
          }
          return;
        }

        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          const text =
            typeof payload === "string"
              ? payload
              : payload?.error || "";
          throw new Error(text || `Redeem failed (status ${res.status}).`);
        }

        if (payload?.alreadyRedeemed) {
          this.redeemed = true;
          this.redeemedAt =
            payload.redeemed_at ||
            payload.redeemedAt ||
            new Date().toISOString();
          this.uninstallPrintBlocker();
          try {
            if (window.opener) {
              window.opener.postMessage(
                { type: "coupon-redeemed", couponId: this.couponId },
                "*"
              );
            }
          } catch (e) {
            void e;
          }
          return;
        }

        this.redeemed = true;
        this.redeemedAt =
          payload.redeemed_at ||
          payload.redeemedAt ||
          new Date().toISOString();

        if (payload.download_token && this.pdfUrl) {
          const u = new URL(this.pdfUrl, window.location.origin);
          u.searchParams.set("token", payload.download_token);
          this.coupon = {
            ...this.coupon,
            pdfUrl: u.toString(),
            pdf_url: u.toString(),
          };
        }

        this.uninstallPrintBlocker();
        try {
          if (window.opener) {
            window.opener.postMessage(
              { type: "coupon-redeemed", couponId: this.couponId },
              "*"
            );
          }
        } catch (e) {
          void e;
        }
      } catch (e) {
        this.error = e?.message || "Failed to redeem. Please try again.";
        alert(this.error);
      } finally {
        this.submitting = false;
      }
    },

    installPrintBlocker() {
      const css = `@media print { body { display: none !important; } }`;
      const el = document.createElement("style");
      el.setAttribute("data-block-print", "true");
      el.appendChild(document.createTextNode(css));
      document.head.appendChild(el);
      this.blockPrintStyleEl = el;

      const self = this;
      this.origPrint = window.print;
      window.print = function () {
        if (!self.redeemed) {
          alert("Please confirm redemption before printing.");
          return;
        }
        return self.origPrint.call(window);
      };
    },

    uninstallPrintBlocker() {
      if (this.blockPrintStyleEl?.parentNode) {
        this.blockPrintStyleEl.parentNode.removeChild(this.blockPrintStyleEl);
      }
      if (this.origPrint) {
        window.print = this.origPrint;
        this.origPrint = null;
      }
    },

    preventPrintHotkeys(e) {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      if (!this.redeemed && cmdOrCtrl && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        e.stopPropagation();
        alert("Please confirm redemption before printing.");
      }
    },

    printCoupon() {
      window.print();
    },

    windowClose() {
      window.close();
    },

    cleanup() {
      window.removeEventListener("keydown", this.preventPrintHotkeys, true);
      this.uninstallPrintBlocker();
    },

    fmtDate(iso) {
      try {
        return new Date(iso).toLocaleString();
      } catch (e) {
        void e;
        return iso;
      }
    },

    fmtDateShort(iso) {
      try {
        return new Date(iso).toLocaleDateString();
      } catch (e) {
        void e;
        return iso;
      }
    },
  },
};
</script>

<style scoped>
/* Outer layout */
.page {
  min-height: 100vh;
  display: flex;
  align-items: stretch;
  justify-content: center;
  background: #f3f4f6;
}

.dialog {
  width: 100%;
  max-width: 520px;
  margin: 24px auto;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  display: flex;
}

/* Inner content */
.popup-wrap {
  padding: 16px 18px 20px;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  width: 100%;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
}

.popup-header {
  margin-bottom: 12px;
}

.popup-header h2 {
  margin: 0;
  font-size: 1.3rem;
}

/* States */
.state {
  padding: 12px 0;
  font-size: 0.95rem;
}

.state.error {
  color: #b00020;
}

/* Content blocks */
.lead {
  margin: 8px 0 12px;
  line-height: 1.4;
}

.note {
  color: #555;
  font-size: 0.9rem;
  margin-top: 4px;
}

/* Buttons / actions */
.confirm .actions,
.redeemed .actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 16px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  flex: 0 0 auto;
}

.btn.primary {
  background: #007bff;
  color: #fff;
}

.btn.primary:disabled {
  opacity: 0.7;
  cursor: default;
}

.btn.ghost {
  background: transparent;
  border: 1px solid #ccc;
  color: #111827;
}

.success {
  margin: 8px 0 12px;
  font-weight: 600;
}

/* Details card */
.details-card {
  margin-top: 12px;
  padding: 12px;
  border-radius: 8px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}

.details-card h3 {
  margin: 0 0 8px;
  font-size: 1rem;
  font-weight: 600;
}

.details-list {
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 150px 1fr;
  row-gap: 8px;
  column-gap: 12px;
  align-items: start;
}

.details-list>div {
  display: contents;
}

.details-list dt {
  font-weight: 600;
  color: #374151;
  text-align: left;
  font-size: 0.9rem;
}

.details-list dd {
  margin: 0;
  color: #111827;
  text-align: left;
  font-size: 0.9rem;
}

.details-list>div:nth-child(n + 2)::before {
  content: "";
  grid-column: 1 / span 2;
  height: 1px;
  background: #e5e7eb;
  margin: 6px 0;
}

/* QR image */
.qr-wrapper {
  margin-top: 12px;
  text-align: center;
}

.qr {
  display: inline-block;
  width: 180px;
  height: 180px;
  object-fit: contain;
  margin: 8px 0;
}

/* Mobile tweaks */
@media (max-width: 768px) {
  .page {
    background: #ffffff;
  }

  .dialog {
    max-width: none;
    margin: 0;
    border-radius: 0;
    min-height: 100vh;
    box-shadow: none;
  }

  .popup-wrap {
    max-height: 100vh;
    padding: 16px;
  }

  .popup-header h2 {
    font-size: 1.2rem;
  }

  .details-list {
    grid-template-columns: 1fr;
  }

  .details-list>div:nth-child(n + 2)::before {
    grid-column: 1 / span 1;
  }

  .confirm .actions,
  .redeemed .actions {
    flex-direction: column;
    align-items: stretch;
  }

  .btn {
    width: 100%;
    text-align: center;
  }
}
</style>
