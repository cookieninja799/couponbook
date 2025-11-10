// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import CouponBook from '../views/CouponBook.vue'
import EventPage from '../views/EventPage.vue'
import FoodieGroupView from '../views/FoodieGroup.vue'
import FoodieGroupList from '../views/FoodieGroupList.vue'
import Profile from '../views/Profile.vue'
import AuthCallback from '@/views/AuthCallback.vue'
import CouponSubmissions from '@/views/CouponSubmissions.vue'

// Import dashboards directly from their component paths:
import AdminDashboard from '../components/Dashboard/AdminDashboard.vue'
import FoodieGroupDashboard from '../components/Dashboard/FoodieGroupDashboard.vue'
import SuperAdminDashboard from '../components/Dashboard/SuperAdminDashboard.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/coupon-book',
    name: 'CouponBook',
    component: CouponBook
  },
  {
    path: '/event-page',
    name: 'EventPage',
    component: EventPage
  },
  {
    path: '/coupon/redeem/:id',
    name: 'CouponRedeemPopup',
    component: () => import('@/components/Coupons/CouponRedeemPopup.vue')
  },
  {
    path: '/foodie-group/:id',
    name: 'FoodieGroupView',
    component: FoodieGroupView,
    props: true
  },
  {
    path: '/foodie-groups',
    name: 'FoodieGroupList',
    component: FoodieGroupList
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile
  },
  { path: '/callback', 
    name: 'AuthCallback', 
    component: AuthCallback 
  },
  // Dashboard routes (for testing purposes)
  {
    path: '/dashboard/admin',
    name: 'AdminDashboard',
    component: AdminDashboard
  },
  {
    path: '/dashboard/foodie-group',
    name: 'FoodieGroupDashboard',
    component: FoodieGroupDashboard
  },
  {
    path: '/dashboard/super-admin',
    name: 'SuperAdminDashboard',
    component: SuperAdminDashboard
  },
  {
    path: '/submissions',
    name: 'CouponSubmissions',
    component: CouponSubmissions
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
