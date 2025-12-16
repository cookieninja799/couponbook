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

  // ─── forceGoToGroupForFoodieGroupCoupons mode (Local Coupons page) ───

  describe('forceGoToGroupForFoodieGroupCoupons mode', () => {
    const foodieGroupCoupon = {
      ...mockCoupon,
      foodie_group_name: 'Chapel Hill Foodies',
      foodie_group_id: 'group-chapel-hill',
      locked: false,
    };

    it('should show "Go to ... Coupon Book to Redeem" when purchased and forceGoToGroup is true', () => {
      wrapper = mount(CouponCard, {
        props: {
          coupon: foodieGroupCoupon,
          hasPurchasedCouponBook: true,
          isAuthenticated: true,
          forceGoToGroupForFoodieGroupCoupons: true,
        },
        global: {
          plugins: [router],
        },
      });

      expect(wrapper.text()).toContain('Go to Chapel Hill Foodies Coupon Book to Redeem');
    });

    it('should show "Join ... Coupon Book" when NOT purchased and forceGoToGroup is true', () => {
      wrapper = mount(CouponCard, {
        props: {
          coupon: foodieGroupCoupon,
          hasPurchasedCouponBook: false,
          isAuthenticated: true,
          forceGoToGroupForFoodieGroupCoupons: true,
        },
        global: {
          plugins: [router],
        },
      });

      expect(wrapper.text()).toContain('Join Chapel Hill Foodies Coupon Book');
    });

    it('should route to FoodieGroupView when clicking "Go to ... Coupon Book to Redeem"', async () => {
      // Create a router with the FoodieGroupView route
      const routerWithRoute = createMockRouter([
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/foodie-group/:id', name: 'FoodieGroupView', component: { template: '<div>Group</div>' } },
      ]);
      
      // Spy on the push method
      const pushSpy = vi.spyOn(routerWithRoute, 'push');

      wrapper = mount(CouponCard, {
        props: {
          coupon: foodieGroupCoupon,
          hasPurchasedCouponBook: true,
          isAuthenticated: true,
          forceGoToGroupForFoodieGroupCoupons: true,
        },
        global: {
          plugins: [routerWithRoute],
        },
      });

      await wrapper.find('button').trigger('click');

      // Should have navigated to FoodieGroupView
      expect(pushSpy).toHaveBeenCalledWith({
        name: 'FoodieGroupView',
        params: { id: 'group-chapel-hill' },
      });
    });

    it('should route to FoodieGroupView when clicking "Join ... Coupon Book"', async () => {
      // Create a router with the FoodieGroupView route
      const routerWithRoute = createMockRouter([
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/foodie-group/:id', name: 'FoodieGroupView', component: { template: '<div>Group</div>' } },
      ]);
      
      // Spy on the push method
      const pushSpy = vi.spyOn(routerWithRoute, 'push');

      wrapper = mount(CouponCard, {
        props: {
          coupon: foodieGroupCoupon,
          hasPurchasedCouponBook: false,
          isAuthenticated: true,
          forceGoToGroupForFoodieGroupCoupons: true,
        },
        global: {
          plugins: [routerWithRoute],
        },
      });

      await wrapper.find('button').trigger('click');

      expect(pushSpy).toHaveBeenCalledWith({
        name: 'FoodieGroupView',
        params: { id: 'group-chapel-hill' },
      });
    });

    it('should NOT affect Vivaspot Community coupons - show Redeem directly', () => {
      const communityCoupon = {
        ...mockCoupon,
        foodie_group_name: 'Vivaspot Community',
        foodie_group_id: 'vivaspot-community',
      };

      wrapper = mount(CouponCard, {
        props: {
          coupon: communityCoupon,
          hasPurchasedCouponBook: false,
          isAuthenticated: true,
          forceGoToGroupForFoodieGroupCoupons: true,
        },
        global: {
          plugins: [router],
        },
      });

      // Should show Redeem, not "Go to" or "Join"
      expect(wrapper.text()).toContain('Redeem');
      expect(wrapper.text()).not.toContain('Go to');
      expect(wrapper.text()).not.toContain('Join');
    });

    it('should emit redeem event for Vivaspot Community coupons even with forceGoToGroup', async () => {
      const communityCoupon = {
        ...mockCoupon,
        foodie_group_name: 'Vivaspot Community',
        foodie_group_id: 'vivaspot-community',
      };

      wrapper = mount(CouponCard, {
        props: {
          coupon: communityCoupon,
          hasPurchasedCouponBook: false,
          isAuthenticated: true,
          forceGoToGroupForFoodieGroupCoupons: true,
        },
        global: {
          plugins: [router],
        },
      });

      await wrapper.find('button').trigger('click');
      expect(wrapper.emitted('redeem')).toBeTruthy();
      expect(wrapper.emitted('redeem')[0][0]).toEqual(communityCoupon);
    });
  });
});






