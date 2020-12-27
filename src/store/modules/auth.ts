import { Module, ActionTree } from 'vuex'
import { StoreInterface } from '../index'
import axios from 'axios'
import { DefineGetters, DefineMutations } from 'vuex-type-helper'

export interface State {
  loggedIn: boolean;
  loading: boolean;
  token: null|string;
  refresh: null|string;
  username: null|string;
  registration: null|{
    enabled: boolean;
    mandatory: {
      email: boolean;
      invite_code: boolean;
    };
  };
  accountStatus: null|0|1;
}

export interface Getters {
  loggedIn: boolean;
  loading: boolean;
  token: null|string;
  refresh: null|string;
  username: null|string;
  registration: null|{
    enabled: boolean;
    mandatory: {
      email: boolean;
      invite_code: boolean;
    };
  };
  accountStatus: null|0|1;
}

export interface Mutations {
  authenticate: {
    token: string;
    refresh: string;
    username: string;
  };
  logout: {};
  loading: {
    loading: boolean;
  };
  updateToken: {
    token: string;
  };
  updateRegistrationStatus: {
    enabled: boolean;
    mandatory: {
      email: boolean;
      invite_code: boolean;
    };
  };
  setAccountStatus: null|0|1;
}

export const state: State = {
  loggedIn: !!window.localStorage.getItem('token'),
  loading: false,
  token: window.localStorage.getItem('token'),
  refresh: window.localStorage.getItem('refresh'),
  username: window.localStorage.getItem('username'),
  registration: null,
  accountStatus: null
}

export const getters: DefineGetters<Getters, State> = {
  token: (state) => state.token,
  refresh: (state) => state.refresh,
  username: (state) => state.username,
  loggedIn: (state) => state.loggedIn,
  loading: (state) => state.loading,
  registration: (state) => state.registration,
  accountStatus: (state) => state.accountStatus
}

export const mutations: DefineMutations<Mutations, State> = {
  authenticate (state, payload) {
    state.token = payload.token
    state.refresh = payload.refresh
    state.username = payload.username
    state.loggedIn = true
    state.loading = false
    window.localStorage.setItem('token', payload.token)
    window.localStorage.setItem('refresh', payload.refresh)
    window.localStorage.setItem('username', payload.username)
  },
  logout (state) {
    state.loggedIn = false
    state.token = null
    state.refresh = null
    state.username = null
    window.localStorage.removeItem('token')
    window.localStorage.removeItem('refresh')
    window.localStorage.removeItem('username')
  },
  loading (state, payload) {
    state.loading = payload.loading
  },
  updateToken (state, payload) {
    state.token = payload.token
    window.localStorage.setItem('token', payload.token)
  },
  updateRegistrationStatus (state, payload) {
    state.registration = payload
  },
  setAccountStatus (state, payload) {
    state.accountStatus = payload
  }
}

export const actions: ActionTree<State, StoreInterface> = {
  async logIn ({ commit }, payload) {
    commit('loading', { loading: true })
    await axios.post(process.env.API_URI + 'login', payload)
      .then((res) => {
        commit('authenticate', { username: res.data.username, token: res.data.access_token, refresh: res.data.refresh_token })
        commit('setAccountStatus', 'OK')
      }).finally(() => commit('loading', { loading: false }))
  },
  async refresh ({ commit }) {
    await axios.post(process.env.API_URI + 'refresh')
      .then((res) => {
        commit('updateToken', { token: res.data.access_token })
      })
  },
  async getRegistrationFields ({ commit }) {
    await axios.get(process.env.API_URI + 'register')
      .then((res) => {
        commit('updateRegistrationStatus', { enabled: res.data.enabled, mandatory: res.data.mandatory })
      })
  },
  async register ({ commit }, payload) {
    commit('loading', { loading: true })
    await axios.post(process.env.API_URI + 'register', payload)
      .then((res) => {
        commit('setAccountStatus', res.data.status)
      })
      .finally(() => commit('loading', { loading: false }))
  },
  logout ({ commit }) {
    commit('logout')
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
