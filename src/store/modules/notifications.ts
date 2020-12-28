import { Module, ActionTree } from 'vuex'
import { StoreInterface } from '../index'
import axios from 'axios'
import firebase from 'firebase/app'
import 'firebase/messaging'
import { DefineGetters, DefineMutations } from 'vuex-type-helper'

// TODO: Make configurable
const firebaseConfig = {
  apiKey: process.env.FCM_apiKey,
  authDomain: process.env.FCM_authDomain,
  projectId: process.env.FCM_projectId,
  storageBucket: process.env.FCM_storageBucket,
  messagingSenderId: process.env.FCM_messagingSenderId,
  appId: process.env.FCM_appId
}

// Initialize Firebase
firebase.initializeApp(firebaseConfig)

export interface State {
  loading: boolean;
  pushToken: null | string;
}

export interface Getters {
  loading: boolean;
  pushToken: null | string;
}

export interface Mutations {
  setLoading: boolean;
  setToken: null | string;
}

export const state: State = {
  loading: false,
  pushToken: window.localStorage.getItem('pushToken')
}

export const getters: DefineGetters<Getters, State> = {
  loading: (state) => state.loading,
  pushToken: (state) => state.pushToken
}

export const mutations: DefineMutations<Mutations, State> = {
  setLoading (state, payload) {
    state.loading = payload
  },
  setToken (state, payload) {
    state.pushToken = payload
    if (payload === null) {
      window.localStorage.removeItem('pushToken')
    } else {
      window.localStorage.setItem('pushToken', payload)
    }
  }
}

export const actions: ActionTree<State, StoreInterface> = {
  getToken () {
    const messaging = firebase.messaging()
    return messaging.getToken({ vapidKey: process.env.FCM_PUBKEY })
      .then((currentToken) => {
        if (!currentToken) {
          return Promise.reject('Could not fetch token')
        }
        return Promise.resolve(currentToken)
      })
  },
  disableNotifications ({ commit }) {
    const messaging = firebase.messaging()
    commit('setLoading', true)
    messaging.deleteToken()
      .then(() => commit('setToken', null))
      .finally(() => commit('setLoading', false))
  },
  enableNotifications ({ commit, dispatch }) {
    commit('setLoading', true)
    return Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        return dispatch('getToken').then((token) => {
          console.log(token)
          axios.post(process.env.API_URI + 'push', { token: token })
            .then(() => {
              commit('setToken', token)
            }).finally(() => commit('setLoading', false))
        }).catch((e) => {
          console.log(e)
          commit('setLoading', false)
        })
      } else {
        console.log('Unable to get permission to notify.')
        commit('setLoading', false)
        return Promise.reject('Unable to get notification permission')
      }
    })
  }
}

const module: Module<State, StoreInterface> = {
  namespaced: true,
  actions,
  getters,
  mutations,
  state
}

export default module
