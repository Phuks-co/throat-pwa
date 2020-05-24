import { Module, ActionTree } from 'vuex'
import { StoreInterface } from '../index'
import axios from 'axios'
import { DefineGetters, DefineMutations } from 'vuex-type-helper'

export interface State {
  token: string;
  image: string;
  loading: boolean;

  required: boolean;
}

export interface Getters {
  token: string;
  image: string;
  loading: boolean;

  required: boolean;
}

export interface Mutations {
  setCaptcha: {
    token: string;
    image: string;
  };
  loading: {
    loading: boolean;
  };
  setRequired: {
    required: boolean;
  };
}

export const state: State = {
  token: '',
  image: '',
  loading: false,
  required: false
}

export const getters: DefineGetters<Getters, State> = {
  token: (state) => state.token,
  image: (state) => state.image,
  loading: (state) => state.loading,
  required: (state) => state.required
}

export const mutations: DefineMutations<Mutations, State> = {
  setCaptcha (state, payload) {
    state.token = payload.token
    state.image = payload.image
  },
  loading (state, payload) {
    state.loading = payload.loading
  },
  setRequired (state, payload) {
    state.required = payload.required
  }
}

export const actions: ActionTree<State, StoreInterface> = {
  async getCaptcha ({ commit }) {
    commit('loading', { loading: true })
    await axios.get(process.env.API_URI + 'challenge')
      .then((res) => {
        commit('setCaptcha', { token: res.data.challenge_token, image: res.data.challenge_blob })
      }).finally(() => commit('loading', { loading: false }))
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
