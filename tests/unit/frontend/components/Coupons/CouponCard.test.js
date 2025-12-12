// CouponCard component tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import CouponCard from '../../../../../src/components/Coupons/CouponCard.vue';
import { createMockRouter } from '../../../../helpers/vue.js';

// Mock authService
vi.mock('../../../../../src/services/authService.js', () => ({
  signIn: vi.fn(),
}));

describe('CouponCard', () => {
  let wrapper;
  let router;

  const mockCoupon = {
    id: 'coupon-1',
    title: 'Test Coupon',
    description: 'Test description',
    merchant_name: 'Test Merchant',
    merchant_logo: '/logo.png',
    valid_from: new Date(Date.now() - 86400000).toISOString(), // yesterday
    expires_at: new Date(Date.now() + 86400000).toISOString(), // tomorrow
    locked: false,
    foodie_group_name: 'Test Group',
    foodie_group_id: 'group-1',
  };

  beforeEach(() => {
    router = createMockRouter();
    vi.clearAllMocks();
  });

  it('should render coupon information', () => {
    wrapper = mount(CouponCard, {
      props: {
        coupon: mockCoupon,
        hasPurchasedCouponBook: true,
        isAuthenticated: true,
      },
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toContain('Test Coupon');
    expect(wrapper.text()).toContain('Test description');
    expect(wrapper.text()).toContain('Test Merchant');
  });

  it('should show "Sign in to redeem" for unauthenticated users', () => {
    wrapper = mount(CouponCard, {
      props: {
        coupon: mockCoupon,
        hasPurchasedCouponBook: true,
        isAuthenticated: false,
      },
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toContain('Sign in to redeem');
    expect(wrapper.find('button').attributes('disabled')).toBeUndefined();
  });

  it('should show "Redeem" button for active coupon', () => {
    wrapper = mount(CouponCard, {
      props: {
        coupon: mockCoupon,
        hasPurchasedCouponBook: true,
        isAuthenticated: true,
      },
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toContain('Redeem');
  });

  it('should show "Expired" for expired coupons', () => {
    const expiredCoupon = {
      ...mockCoupon,
      expires_at: new Date(Date.now() - 86400000).toISOString(), // yesterday
    };

    wrapper = mount(CouponCard, {
      props: {
        coupon: expiredCoupon,
        hasPurchasedCouponBook: true,
        isAuthenticated: true,
      },
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toContain('Expired');
    expect(wrapper.find('button').attributes('disabled')).toBeDefined();
  });

  it('should show locked message for locked coupons', () => {
    const lockedCoupon = {
      ...mockCoupon,
      locked: true,
    };

    wrapper = mount(CouponCard, {
      props: {
        coupon: lockedCoupon,
        hasPurchasedCouponBook: false,
        isAuthenticated: true,
      },
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toContain('Join');
    expect(wrapper.text()).toContain('Coupon Book');
  });

  it('should emit redeem event when redeem button is clicked', async () => {
    wrapper = mount(CouponCard, {
      props: {
        coupon: mockCoupon,
        hasPurchasedCouponBook: true,
        isAuthenticated: true,
      },
      global: {
        plugins: [router],
      },
    });

    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('redeem')).toBeTruthy();
    expect(wrapper.emitted('redeem')[0][0]).toEqual(mockCoupon);
  });

  it('should call signIn when clicking redeem while not authenticated', async () => {
    const { signIn } = await import('../../../../../src/services/authService.js');

    wrapper = mount(CouponCard, {
      props: {
        coupon: mockCoupon,
        hasPurchasedCouponBook: true,
        isAuthenticated: false,
      },
      global: {
        plugins: [router],
      },
    });

    await wrapper.find('button').trigger('click');
    expect(signIn).toHaveBeenCalled();
  });
});


