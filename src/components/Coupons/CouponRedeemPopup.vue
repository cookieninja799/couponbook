<!-- src/components/Coupons/CouponRedeemPopup.vue -->
<template>
  <div class="popup-wrap">
    <header class="popup-header">
      <h2>{{ coupon?.title || 'Redeem Coupon' }}</h2>
    </header>

    <section v-if="loading" class="state">Loading…</section>
    <section v-else-if="error" class="state error">⚠️ {{ error }}</section>

    <section v-else>
      <div v-if="!redeemed" class="confirm">
        <p><strong>Are you sure?</strong> This coupon can be redeemed only once with your account. After
          confirming, you won’t be able to redeem it again.</p>

        <div class="actions">
          <button class="btn primary" @click="confirmRedeem" :disabled="submitting">Confirm Redeem</button>
          <button class="btn ghost" @click="windowClose">Cancel</button>
        </div>

        <p class="note">Printing or downloading the coupon is disabled until you confirm.</p>

        <div v-if="submitting" class="state">Redeeming…</div>
        <div v-if="error" class="state error">⚠️ {{ error }}</div>
      </div>

      <div v-else class="redeemed">
        <p class="success">✅ Redeemed on {{ fmtDate(redeemedAt) }}</p>
        <div class="coupon-detail">
          <p v-if="couponDescription">{{ couponDescription }}</p>
          <img v-if="qrCodeUrl" :src="qrCodeUrl" alt="Coupon QR" class="qr" />
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
</template>

<script>
export default {
  name: 'CouponRedeemPopup',
  data() {
    return {
      coupon: null,
      loading: true,
      error: null,
      redeemed: false,
      redeemedAt: null,
      submitting: false,
      blockPrintStyleEl: null,
      // renamed to avoid vue/no-reserved-keys
      origPrint: null,
    };
  },
  computed: {
    couponId() {
      return this.$route.params.id;
    },
    // Normalize API shape (snake_case or camelCase)
    couponDescription() {
      return this.coupon?.description ?? this.coupon?.desc ?? '';
    },
    qrCodeUrl() {
      return this.coupon?.qr_code_url ?? this.coupon?.qrCodeUrl ?? null;
    },
    pdfUrl() {
      return this.coupon?.pdf_url ?? this.coupon?.pdfUrl ?? null;
    },
    downloadUrlSecured() {
      return this.pdfUrl || '#';
    }
  },
  async created() {
    try {
      const res = await fetch(`/api/v1/coupons/${this.couponId}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      this.coupon = await res.json();
    } catch (e) {
      this.error = e.message || 'Failed to load coupon';
    } finally {
      this.loading = false;
    }

    this.installPrintBlocker();
    window.addEventListener('keydown', this.preventPrintHotkeys, true);
    window.addEventListener('beforeunload', this.cleanup, { once: true });
  },
  beforeUnmount() {
    this.cleanup();
  },

  methods: {
    /**
     * Robust ID token getter:
     * - localStorage('oidc.user') -> .id_token (oidc-client-ts default)
     * - localStorage('idToken')
     * - window.auth.getIdToken() (may be sync or Promise)
     * - window.oidcUser.id_token
     */
    async getIdToken() {
      try {
        // 1) oidc-client-ts default storage (stringified user with id_token)
        const oidcUserRaw = localStorage.getItem('oidc.user');
        if (oidcUserRaw) {
          try {
            const parsed = JSON.parse(oidcUserRaw);
            if (parsed?.id_token) return parsed.id_token;
          } catch (_) {
            console.error('Error parsing oidc.user', _);
          }
        }

        // 2) simple custom key
        const fromLocal = localStorage.getItem('idToken');
        if (fromLocal) return fromLocal;

        // 3) window.auth.getIdToken() may return a Promse or string
        if (window?.auth?.getIdToken) {
          const t = window.auth.getIdToken();
          if (typeof t === 'string') return t;
          if (t && typeof t.then === 'function') {
            const resolved = await t;
            if (resolved) return resolved;
          }
        }

        // 4) window.oidcUser.id_token
        if (window?.oidcUser?.id_token) return window.oidcUser.id_token;

        return null;
      } catch (err) {
        console.error('Error getting ID token', err);
        return null;
      }
    },

    async confirmRedeem() {
      if (this.submitting) return;
      this.error = null;
      this.submitting = true;

      // 🔐 Require token before making the call
      const idToken = await this.getIdToken();
      if (!idToken) {
        this.error = 'Please sign in to redeem this coupon.';
        this.submitting = false;
        return;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const res = await fetch(`/api/v1/coupons/${this.couponId}/redeem`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          credentials: 'include',
          body: JSON.stringify({}),
          signal: controller.signal
        }).catch((e) => {
          throw new Error(
            e?.name === 'AbortError'
              ? 'Request timed out. Please try again.'
              : 'Network error. Check your connection or CORS settings.'
          );
        });

        clearTimeout(timeoutId);

        // Handle common auth & duplication cases up front
        if (res.status === 401) {
          this.error = 'Please sign in to redeem this coupon.';
          return;
        }

        // If server uses 409 for already redeemed
        if (res.status === 409) {
          const j = await res.json().catch(() => ({}));
          this.redeemed = true;
          this.redeemedAt = j.redeemed_at || j.redeemedAt || new Date().toISOString();
          this.uninstallPrintBlocker();
          try {
            window.opener && window.opener.postMessage({ type: 'coupon-redeemed', couponId: this.couponId }, '*');
          } catch (_) {
            console.error('Error posting message', _);
          }
          return;
        }

        // Standard success path (201 created) OR 200 with alreadyRedeemed flag
        const payload = await res.json().catch(() => ({}));

        if (!res.ok) {
          const text = typeof payload === 'string' ? payload : (payload?.error || '');
          throw new Error(text || `Redeem failed (status ${res.status}).`);
        }

        if (payload?.alreadyRedeemed) {
          // Server returns 200 { alreadyRedeemed: true }
          this.redeemed = true;
          this.redeemedAt = payload.redeemed_at || payload.redeemedAt || new Date().toISOString();
          this.uninstallPrintBlocker();
          try {
            window.opener && window.opener.postMessage({ type: 'coupon-redeemed', couponId: this.couponId }, '*');
          } catch (_) {
            console.error('Error posting message', _);
          }
          return;
        }

        // Fresh redemption success
        this.redeemed = true;
        this.redeemedAt = payload.redeemed_at || payload.redeemedAt || new Date().toISOString();

        // If backend starts issuing secure download tokens
        if (payload.download_token && this.pdfUrl) {
          const u = new URL(this.pdfUrl, window.location.origin);
          u.searchParams.set('token', payload.download_token);
          this.coupon = { ...this.coupon, pdfUrl: u.toString(), pdf_url: u.toString() };
        }

        this.uninstallPrintBlocker();

        try {
          window.opener && window.opener.postMessage({ type: 'coupon-redeemed', couponId: this.couponId }, '*');
        } catch (_) {
          console.error('Error posting message', _);
        }
      } catch (e) {
        this.error = e?.message || 'Failed to redeem. Please try again.';
        alert(this.error);
      } finally {
        this.submitting = false;
      }
    },

    installPrintBlocker() {
      const css = `@media print { body { display: none !important; } }`;
      const el = document.createElement('style');
      el.setAttribute('data-block-print', 'true');
      el.appendChild(document.createTextNode(css));
      document.head.appendChild(el);
      this.blockPrintStyleEl = el;

      const self = this;
      this.origPrint = window.print;
      window.print = function () {
        if (!self.redeemed) {
          alert('Please confirm redemption before printing.');
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
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      if (!this.redeemed && cmdOrCtrl && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        e.stopPropagation();
        alert('Please confirm redemption before printing.');
      }
    },

    printCoupon() {
      window.print();
    },

    windowClose() {
      window.close();
    },

    cleanup() {
      window.removeEventListener('keydown', this.preventPrintHotkeys, true);
      this.uninstallPrintBlocker();
    },

    fmtDate(iso) {
      try {
        return new Date(iso).toLocaleString();
      } catch {
        return iso;
      }
    }
  }
};
</script>

<style scoped>
.popup-wrap {
  padding: 16px;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
}

.popup-header {
  margin-bottom: 12px;
}

.state {
  padding: 12px;
}

.state.error {
  color: #b00020;
}

.confirm .actions,
.redeemed .actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.btn {
  padding: 8px 14px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
}

.btn.primary {
  background: #007bff;
  color: #fff;
}

.btn.ghost {
  background: transparent;
  border: 1px solid #ccc;
}

.success {
  margin: 8px 0 12px;
}

.qr {
  display: block;
  width: 180px;
  height: 180px;
  object-fit: contain;
  margin: 8px 0;
}

.note {
  color: #555;
  font-size: .9rem;
  margin-top: 8px;
}

.page {
  min-height: 100vh;
  display: grid;
  align-content: start;
  padding: 16px;
}

.dialog {
  width: 100%;
  max-width: 520px;
  margin: 24px auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, .12);
  padding: 16px;
}

@media (max-width: 768px) {
  .dialog {
    max-width: none;
    margin: 0;
    border-radius: 0;
    min-height: 100vh;
    box-shadow: none;
  }
}
</style>
