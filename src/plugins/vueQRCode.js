// 1) install a QR-code Vue component, e.g.:
//    npm install qrcode.vue

import QRCode from 'qrcode.vue'

export default {
  install(app) {
    // register the <QRCode> component globally
    app.component('QRCode', QRCode)
  }
}
