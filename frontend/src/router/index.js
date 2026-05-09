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
  { path: '/admin', component: Admin, meta: { requiresAuth: true } },
  { path: '/forum', component: Forum, meta: { requiresAuth: true } },
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
