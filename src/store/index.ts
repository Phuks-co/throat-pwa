import { store } from 'quasar/wrappers'
import Vuex from 'vuex'
// import { auth } from './modules/auth'

import postList from './modules/postList'
import auth from './modules/auth'
import captcha from './modules/captcha'

import axios from 'axios'
// import example from './module-example';
// import { ExampleStateInterface } from './module-example/state';

export interface StoreInterface {
  // Define your own store structure, using submodules if needed
  // example: ExampleStateInterface;
  // Declared as unknown to avoid linting issue. Best to strongly type as per the line above.
  auth: unknown;
  postList: unknown;
  captcha: {
    required: boolean;
  };
}

export default store(function ({ Vue }) {
  Vue.use(Vuex)

  const store = new Vuex.Store({
    modules: {
      auth,
      postList,
      captcha
    }
  })
  axios.interceptors.request.use(function (config) {
    let token
    if (config.url === process.env.API_URI + 'refresh') {
      token = store.getters['auth/refresh']
    } else {
      token = store.getters['auth/token']
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  }, (err) => Promise.reject(err))

  axios.interceptors.response.use(
    (response) => response,
    (err) => {
      if (!err.response) return Promise.reject(err)
      if (err.request.responseURL !== (process.env.API_URI + 'login') && err.response.status === 401) {
        if (!store.getters['auth/loggedIn']) return Promise.reject('Login required')
        return store.dispatch('auth/refresh')
          .then(() => {
            err.config.headers.Authorization = 'Bearer ' + store.getters['auth/token']
            return axios.request(err.config)
          })
      } else if (err.response.status === 423) {
        store.dispatch('captcha/getCaptcha')
        store.commit('captcha/setRequired', { required: true })
        if (err.response.data.failed) return Promise.reject('Invalid captcha')
        return Promise.reject('captcha_req')
      } else {
        if (!err.response && typeof err !== 'string') {
          err = 'Network error'
        } else {
          err = err.response.data.msg
        }
        return Promise.reject(err)
      }
    })

  return store
})
