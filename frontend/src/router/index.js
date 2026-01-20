import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Checkout from '../views/Checkout.vue'
import Home from '../views/Home.vue'
import LessonPlayer from '../views/LessonPlayer.vue'
import Admin from '../views/Admin.vue'
import Library from '../views/Library.vue'
import Calendar from '../views/Calendar.vue'

const routes = [
  { path: '/', component: Login },
  { path: '/register', component: Register },
  { path: '/checkout', component: Checkout },
  { path: '/home', component: Home, meta: { requiresAuth: true } },
  { path: '/lesson/:id', component: LessonPlayer, meta: { requiresAuth: true } },
  { path: '/admin', component: Admin, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/library', component: Library, meta: { requiresAuth: true } },
  { path: '/calendar', component: Calendar, meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem('user'))

  if (to.meta.requiresAuth && !user) {
    next('/')
  } else if (to.meta.requiresAuth && user) {
    // Check for admin requirement
    if (to.meta.requiresAdmin && user.role !== 'admin') {
      next('/home') // Redirect to home or checkout depending on status?
      // If not active, home will redirect to checkout anyway.
      // Safe default is home or root.
      return
    }

    // If the route is home or lesson or library or calendar, check if active
    if ((to.path === '/home' || to.path === '/library' || to.path === '/calendar' || to.path.startsWith('/lesson/')) && user.is_active != 1 && user.role !== 'admin') {
      next('/checkout')
    } else {
        next()
    }
  } else {
    next()
  }
})

export default router
