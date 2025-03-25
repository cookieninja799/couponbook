<template>
  <div class="coupon-redemption">
    <h2>Redeem Coupon</h2>
    <p>Are you sure you want to redeem this coupon?</p>
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
      <button @click="confirmRedemption" class="primary-btn">
        Confirm & Open Details
      </button>
      <button @click="printCoupon" class="secondary-btn">
        Print Coupon
      </button>
      <button @click="downloadPdf" class="secondary-btn">
        Download PDF
      </button>
      <button @click="$emit('cancel')" class="cancel-btn">
        Cancel
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: "CouponRedemption",
  props: {
    coupon: {
      type: Object,
      required: true
    }
  },
  methods: {
    formatDate(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleDateString();
    },
    confirmRedemption() {
      // Redirect to a new tab with coupon details.
      // In a real app, you might have a route like "/coupon-details/:id"
      const url = `/coupon-details/${this.coupon.id}`;
      window.open(url, '_blank');
      // Optionally, emit an event to notify parent about the redemption.
      this.$emit('confirm', this.coupon);
    },
    printCoupon() {
      // For demonstration, open a new window and call print()
      const printWindow = window.open('', '_blank');
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
              <img src="${this.coupon.qr_code_url}" alt="QR Code" class="qr-code" />
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
      // For demonstration, open a new tab to a URL that should generate a PDF.
      // In a real application, you'd integrate with a PDF generation service.
      const pdfUrl = `/coupon-pdf/${this.coupon.id}`;
      window.open(pdfUrl, '_blank');
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
  margin: 0 0.5rem;
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
.actions button:hover {
  opacity: 0.9;
}
</style>
