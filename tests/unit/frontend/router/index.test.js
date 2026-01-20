import { describe, it, expect } from 'vitest';
import router from '../../../../src/router/index.js';

describe('Router - Dashboard Routes', () => {
  it('removes /dashboard/admin route', () => {
    const adminRoute = router.getRoutes().find((r) => r.path === '/dashboard/admin');
    expect(adminRoute).toBeUndefined();
  });

  it('/dashboard/foodie-group redirects to /profile', async () => {
    await router.push('/dashboard/foodie-group');
    expect(router.currentRoute.value.path).toBe('/profile');
  });

  it('/dashboard/foodie-group/:groupId loads FoodieGroupDashboard', async () => {
    await router.push('/dashboard/foodie-group/test-group-id');
    expect(router.currentRoute.value.name).toBe('FoodieGroupDashboard');
    expect(router.currentRoute.value.params.groupId).toBe('test-group-id');
  });

  it('passes groupId as prop to FoodieGroupDashboard', () => {
    const route = router.getRoutes().find((r) => r.name === 'FoodieGroupDashboard');
    expect(route.props === true || route.props?.default === true).toBe(true);
  });
});
