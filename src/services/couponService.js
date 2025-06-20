import api from './apiService';

export default {
  // GET /api/v1/coupons
  getAllCoupons() {
    return api.get('/coupons');
  },
  // GET /api/v1/coupons/:id
  getCoupon(id) {
    return api.get(`/coupons/${id}`);
  },
  // POST /api/v1/coupons
  createCoupon(payload) {
    // payload should match your server’s snake_case fields
    return api.post('/coupons', payload);
  },
  // PUT /api/v1/coupons/:id
  updateCoupon(id, payload) {
    return api.put(`/coupons/${id}`, payload);
  },
  // DELETE /api/v1/coupons/:id
  deleteCoupon(id) {
    return api.delete(`/coupons/${id}`);
  },
};
