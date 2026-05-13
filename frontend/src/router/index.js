import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Checkout from '../views/Checkout.vue'
import Home from '../views/Home.vue'
import LessonPlayer from '../views/LessonPlayer.vue'
import Admin from '../views/Admin.vue'
import Forum from '../views/Forum.vue'

const routes = [
  { path: '/', component: Login },
  { path: '/register', component: Register },
  { path: '/checkout', component: Checkout },
  { path: '/home', component: Home, meta: { requiresAuth: true } },
  { path: '/lesson/:id', component: LessonPlayer, meta: { requiresAuth: true } },
  {
    path: '/admin',
    component: Admin,
    meta: { requiresAuth: true },
    redirect: '/admin/painel',
    children: [
      { path: 'painel',      component: () => import('../views/admin/PainelView.vue') },
      { path: 'marketplace', component: () => import('../views/admin/MarketplaceView.vue') },
      { path: 'edificios',   component: () => import('../views/admin/EdificiosView.vue') },
      { path: 'conteudo',    component: () => import('../views/admin/ConteudoView.vue') },
      { path: 'vault',       component: () => import('../views/admin/VaultView.vue') },
      { path: 'vouchers',    component: () => import('../views/admin/VouchersView.vue') },
      { path: 'auditoria',   component: () => import('../views/admin/AuditoriaView.vue') },
      { path: 'usuarios',    component: () => import('../views/admin/UsuariosView.vue') },
      { path: 'calendario',  component: () => import('../views/admin/AdminCalendarView.vue') },
      { path: 'produtos',    component: () => import('../views/admin/AdminProductsView.vue') },
      { path: 'turmas',      component: () => import('../views/admin/AdminCohortsView.vue') },
      { path: 'campanhas',   component: () => import('../views/admin/AdminCampaignsView.vue') },
      { path: 'convites',    component: () => import('../views/admin/AdminInvitesView.vue') },
    ],
  },
  { path: '/forum',        component: Forum, meta: { requiresAuth: true } },
  { path: '/marketplace',  component: () => import('../views/Marketplace.vue'), meta: { requiresAuth: true } },
  { path: '/world',        component: () => import('../views/WorldView.vue'),   meta: { requiresAuth: true } },
  { path: '/city',         component: () => import('../views/CityView.vue'),    meta: { requiresAuth: true } },
  { path: '/city/:userId', component: () => import('../views/CityView.vue'),    meta: { requiresAuth: true } },
  { path: '/u/:username',  component: () => import('../views/Profile.vue'),     meta: { requiresAuth: true } },

  // Live classes commerce platform
  { path: '/calendar',          component: () => import('../views/Calendar.vue'),        meta: { requiresAuth: true } },
  { path: '/live/:id',          component: () => import('../views/LiveClassRoom.vue'),   meta: { requiresAuth: true } },
  { path: '/catalog',           component: () => import('../views/CourseCatalog.vue') },
  { path: '/product/:slug',     component: () => import('../views/ProductDetail.vue') },
  { path: '/checkout/:productId', component: () => import('../views/CourseCheckout.vue'), meta: { requiresAuth: true } },
  { path: '/invite/:code',      component: () => import('../views/InviteRedeem.vue'),    meta: { requiresAuth: true } },
  { path: '/me/enrollments',    component: () => import('../views/MyEnrollments.vue'),   meta: { requiresAuth: true } },
  { path: '/promo/:slug',       component: () => import('../views/CampaignLanding.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  if (to.meta.requiresAuth && (!token || !user)) {
    next('/')
    return
  }

  if (to.meta.requiresAuth && user) {
    const needsActive = to.path === '/home' || to.path.startsWith('/lesson/')
    if (needsActive && !user.isActive && user.role !== 'admin') {
      next('/checkout')
      return
    }
  }

  next()
})

export default router
