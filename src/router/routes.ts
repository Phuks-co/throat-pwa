import { RouteConfig } from 'vue-router'

const routes: RouteConfig[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '/', props: { sub: 'home', sort: 'hot' }, component: () => import('pages/PostList.vue') },
      { path: '/home/:sort(hot|top|new)/:page?', name: 'view_home', props: route => ({ sub: 'home', sort: route.params.sort, page: route.params.page }), component: () => import('pages/PostList.vue') },
      { path: '/all/:sort(hot|top|new)/:page?', name: 'view_all', props: route => ({ sub: 'all', sort: route.params.sort, page: route.params.page }), component: () => import('pages/PostList.vue') },
      { path: '/s/:sub', props: true, component: () => import('pages/PostList.vue') },
      { path: '/s/:sub/:sort(hot|top|new)/:page?', name: 'view_sub', props: true, component: () => import('pages/PostList.vue') },

      { path: '/s/:sub/:pid(\\d+)/:cid?', name: 'view_post', props: true, component: () => import('pages/Post.vue') },

      { path: '/submit/:sub?', name: 'create_post', props: true, component: () => import('pages/Submit.vue') },

      { path: '/messages/notifications', name: 'view_notifications', props: true, component: () => import('pages/Notifications.vue') },
      { path: '/messages/inbox', name: 'view_messages', props: true, component: () => import('pages/Messages.vue') },
      { path: '/messages/sent', name: 'view_sent_messages', props: () => ({ sent: true }), component: () => import('pages/Messages.vue') },
      { path: '/messages/ignore', name: 'view_ignores', props: true, component: () => import('pages/Ignores.vue') },

      { path: 'login', name: 'login', component: () => import('pages/Login.vue') },
      { path: 'register', name: 'register', component: () => import('pages/Register.vue') }
    ]
  }
]

// Always leave this as last one
if (process.env.MODE !== 'ssr') {
  routes.push({
    path: '*',
    component: () => import('pages/Error404.vue')
  })
}

export default routes
