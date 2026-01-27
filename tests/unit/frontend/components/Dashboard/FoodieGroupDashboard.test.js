import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import FoodieGroupDashboard from '../../../../../src/components/Dashboard/FoodieGroupDashboard.vue';
import { createMockStore } from '../../../../helpers/vue.js';

vi.mock('../../../../../src/services/authService.js', () => ({
  getAccessToken: vi.fn(),
  signIn: vi.fn(),
}));

global.fetch = vi.fn();

function mockFetchOk(url) {
  if (String(url).includes('/users/me')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          id: 'user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: 'foodie_group_admin',
        }),
    });
  }
  if (String(url).includes('/groups/my/admin-memberships')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });
  }
  if (String(url).includes('/groups/')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          name: 'Test Group',
          description: '',
          location: '',
          bannerImageUrl: '',
          socialLinks: {},
          totalMembers: 0,
        }),
    });
  }
  if (String(url).includes('/coupon-submissions')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });
  }
  if (String(url).includes('/coupons')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });
  }
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
  });
}

describe('FoodieGroupDashboard', () => {
  let store;

  beforeEach(() => {
    store = createMockStore();
    global.fetch.mockImplementation(mockFetchOk);
    vi.clearAllMocks();
  });

  it('reads groupId from route params', () => {
    store.state.auth.isAuthenticated = false;

    const wrapper = mount(FoodieGroupDashboard, {
      global: {
        plugins: [store],
        mocks: {
          $route: { params: { groupId: 'test-uuid-123' } },
          $router: { replace: vi.fn() },
        },
      },
    });

    expect(wrapper.vm.groupId).toBe('test-uuid-123');
  });

  it('redirects to /profile when groupId is missing', () => {
    store.state.auth.isAuthenticated = false;
    const replaceSpy = vi.fn();

    mount(FoodieGroupDashboard, {
      global: {
        plugins: [store],
        mocks: {
          $route: { params: {} },
          $router: { replace: replaceSpy },
        },
      },
    });

    expect(replaceSpy).toHaveBeenCalledWith('/profile');
  });

  it('reloads data when route groupId changes', async () => {
    store.state.auth.isAuthenticated = false;

    const wrapper = mount(FoodieGroupDashboard, {
      global: {
        plugins: [store],
        mocks: {
          $route: { params: { groupId: 'group-1' } },
          $router: { replace: vi.fn() },
        },
      },
    });

    const reloadSpy = vi.spyOn(wrapper.vm, 'reloadAllGroupData');
    await wrapper.vm.$options.watch['$route.params.groupId'].handler.call(
      wrapper.vm,
      'group-2'
    );

    expect(reloadSpy).toHaveBeenCalled();
    expect(wrapper.vm.groupId).toBe('group-2');
  });

  it('shows group selector when admin has multiple groups', async () => {
    store.state.auth.isAuthenticated = true;

    const wrapper = mount(FoodieGroupDashboard, {
      global: {
        plugins: [store],
        mocks: {
          $route: { params: { groupId: 'group-1' } },
          $router: { replace: vi.fn(), push: vi.fn() },
        },
      },
    });

    await wrapper.setData({
      authChecked: true,
      notAuthorized: false,
      adminMemberships: [
        { groupId: 'group-1', name: 'Group One' },
        { groupId: 'group-2', name: 'Group Two' },
      ],
    });

    expect(wrapper.find('.group-selector').exists()).toBe(true);
  });

  it('renders redemption counts for active coupons', async () => {
    store.state.auth.isAuthenticated = true;
    const couponPayload = [
      {
        id: 'coupon-1',
        description: 'Test coupon',
        merchant_name: 'Acme Widgets',
        redemptions: 5,
      },
    ];

    global.fetch.mockImplementation((url) => {
      if (String(url).includes('/coupons?')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(couponPayload),
        });
      }
      return mockFetchOk(url);
    });

    const wrapper = mount(FoodieGroupDashboard, {
      global: {
        plugins: [store],
        mocks: {
          $route: { params: { groupId: 'group-1' } },
          $router: { replace: vi.fn() },
        },
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Redemptions: 5');
  });

  it('navigates to new group when selector changes', () => {
    store.state.auth.isAuthenticated = false;
    const pushSpy = vi.fn();

    const wrapper = mount(FoodieGroupDashboard, {
      global: {
        plugins: [store],
        mocks: {
          $route: { params: { groupId: 'group-1' } },
          $router: { push: pushSpy, replace: vi.fn() },
        },
      },
    });

    wrapper.vm.switchGroup('group-2');

    expect(pushSpy).toHaveBeenCalledWith({
      name: 'FoodieGroupDashboard',
      params: { groupId: 'group-2' },
    });
  });
});
