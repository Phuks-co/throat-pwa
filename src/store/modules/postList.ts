import { Module, ActionTree } from 'vuex'
import { StoreInterface } from '../index'

import axios from 'axios'
import { DefineGetters, DefineMutations } from 'vuex-type-helper'
interface Post{
  pid: number;
  loadingUpvote: boolean;
  loadingDownvote: boolean;
  positive: 1 | null | 0;
  score: number;
  trustedHost: boolean;
  link: string;
}

interface Comment{
  cid: string;
  children: Array<Comment>;
}

export interface State {
  loading: boolean;
  posts: Array<Post>;
  post: null|Post;
  sub: string;
  sort: string;
  page: number;
  loadingEdit: boolean;

  // This could go in a different module
  loadingComments: boolean;
  loadingCommentsCreator: boolean;
  comments: Array<Comment>;
}

export interface Getters {
  loading: boolean;
  posts: Array<Post>;
  post: null|Post;
}

export interface Mutations {
  setContext: {
    sub: string;
    sort?: string;
    page?: number;
    pid?: number;
  };
  setLoading: {
    loading: boolean;
  };
  setLoadingEdit: {
    loading: boolean;
  };
  setPosts: {
    posts: Array<Post>;
  };
  setPost: {
    post: Post;
  };
  setVoted: {
    positive: 1 | null | 0;
    score: number;
    pid: number;
  };
  setLoadingVote: {
    positive: 1 | 0;
    loading: boolean;
    pid: number;
  };
  setLoadingComments: {
    loading: boolean;
  };
  setLoadingCommentsCreator: {
    loading: boolean;
  };
}

export const state: State = {
  loading: false,
  loadingEdit: false,
  posts: [],
  post: null,
  sub: '',
  sort: '',
  page: 1,
  loadingComments: false,
  loadingCommentsCreator: false,
  comments: []
}

export const getters: DefineGetters<Getters, State> = {
  posts: (state) => state.posts,
  post: (state) => state.post,
  loading: (state) => state.loading
}

export const mutations: DefineMutations<Mutations, State> = {
  setContext (state, payload) {
    state.sub = payload.sub
    if (payload.sort) state.sort = payload.sort
    if (payload.page) state.page = payload.page
  },
  setLoading (state, payload) {
    state.loading = payload.loading
  },
  setLoadingEdit (state, payload) {
    state.loadingEdit = payload.loading
  },
  setPosts (state, payload) {
    payload.posts.forEach(p => {
      p.loadingUpvote = false
      p.loadingDownvote = false
      if (process.env.TRUSTED_HOSTS) {
        p.trustedHost = process.env.TRUSTED_HOSTS.includes(p.link)
      } else {
        p.trustedHost = false
      }
    })
    state.posts = payload.posts
  },
  setPost (state, payload) {
    payload.post.loadingUpvote = false
    payload.post.loadingDownvote = false
    if (process.env.TRUSTED_HOSTS) {
      payload.post.trustedHost = process.env.TRUSTED_HOSTS.includes(payload.post.link)
    } else {
      payload.post.trustedHost = false
    }
    state.post = payload.post
  },
  setVoted (state, payload) {
    for (const post of state.posts) {
      if (post.pid === payload.pid) {
        post.positive = payload.positive
        post.score = payload.score
        break
      }
    }
  },
  setLoadingVote (state, payload) {
    // Probably inefficient as shit, but javascript Objects don't preserve any fucking order unless I use string keys
    // (and our PIDs are numeric) and Vue doesn't support Maps...
    for (const post of state.posts) {
      if (post.pid === payload.pid) {
        if (payload.positive === 0) {
          post.loadingDownvote = payload.loading
        } else {
          post.loadingUpvote = payload.loading
        }
        break
      }
    }
  },
  setLoadingComments (state, payload) {
    state.loadingComments = payload.loading
  },
  setLoadingCommentsCreator (state, payload) {
    state.loadingCommentsCreator = payload.loading
  }
}

export const actions: ActionTree<State, StoreInterface> = {
  async loadPosts ({ commit, state }, payload) {
    if (state.sub === payload.sub && state.sort === payload.sort && state.page === payload.page && state.posts.length > 0 && payload.force !== true) {
      commit('setContext', { sub: payload.sub, sort: payload.sort, page: payload.page, pid: null })
      return
    }
    commit('setContext', { sub: payload.sub, sort: payload.sort, page: payload.page, pid: null })
    commit('setLoading', { loading: true })
    await axios.get(process.env.API_URI + 'post/' + payload.sub, { params: { sort: payload.sort, page: payload.page } })
      .then((res) => {
        commit('setPosts', { posts: res.data.posts })
      })
      .finally(() => commit('setLoading', { loading: false }))
  },
  async loadPost ({ commit, state }, payload) {
    commit('setLoading', { loading: true })
    commit('setContext', { sub: payload.sub, pid: payload.pid })
    const fPost = state.posts.find((p) => p.pid === payload.pid as number)
    if (fPost) {
      commit('setPost', { post: fPost })
      commit('setLoading', { loading: false })
    } else {
      await axios.get(process.env.API_URI + 'post/' + payload.sub + '/' + payload.pid)
        .then((res) => {
          commit('setPost', { post: res.data.post })
        })
        .finally(() => commit('setLoading', { loading: false }))
    }
  },
  async createPost ({ commit }, payload) {
    commit('setLoading', { loading: true })
    return await axios.post(process.env.API_URI + 'post', {
      sub: payload.sub,
      type: payload.type,
      link: payload.link,
      content: payload.content,
      title: payload.title,
      nsfw: payload.nsfw,
      challengeToken: payload.challengeToken,
      challengeResponse: payload.challengeResponse
    }).then((r) => {
      return r.data
    }).finally(() => commit('setLoading', { loading: false }))
  },
  async editPost ({ commit }, payload) {
    commit('setLoadingEdit', { loading: true })
    await axios.patch(process.env.API_URI + 'post/' + payload.sub + '/' + payload.pid, { content: payload.content })
      .then((res) => {
        commit('setPosts', { posts: [res.data.post] })
      })
      .finally(() => commit('setLoadingEdit', { loading: false }))
  },
  async deletePost ({ commit }, payload) {
    commit('setLoadingEdit', { loading: true })
    await axios.delete(process.env.API_URI + 'post/' + payload.sub + '/' + payload.pid)
      .finally(() => commit('setLoadingEdit', { loading: false }))
  },
  async vote ({ commit }, payload) {
    commit('setLoadingVote', { pid: payload.pid, positive: payload.positive, loading: true })
    await axios.post(process.env.API_URI + 'post/' + payload.sub + '/' + payload.pid + '/vote', { upvote: payload.positive === 1 })
      .then((res) => {
        commit('setVoted', { positive: res.data.rm ? null : payload.positive, pid: payload.pid, score: res.data.score })
      })
      .finally(() => commit('setLoadingVote', { pid: payload.pid, positive: payload.positive, loading: false }))
  },
  // TODO: Move everything comment related to another module
  loadComments ({ commit }, payload) {
    commit('setLoadingComments', { loading: true })
    return axios.get(process.env.API_URI + 'post/' + payload.sub + '/' + payload.pid + '/comment')
      .then((res) => {
        return res.data.comments
      })
      .finally(() => commit('setLoadingComments', { loading: false }))
  },
  loadChildrenComments (_, payload) {
    const url = process.env.API_URI + 'post/' + payload.sub + '/' + payload.pid + '/comment/' + payload.cid + '/children'
    return axios.get(url, { params: { key: payload.key } })
      .then((res) => {
        return res.data.comments
      })
  },
  createComment ({ commit }, payload) {
    commit('setLoadingCommentsCreator', { loading: true })
    return axios.post(process.env.API_URI + 'post/' + payload.sub + '/' + payload.pid + '/comment', { content: payload.content, parentcid: payload.parentcid })
      .then((res) => {
        return res.data.comment
      })
      .finally(() => commit('setLoadingCommentsCreator', { loading: false }))
  },
  voteComment (_, payload) {
    // XXX: Very shitty solution. Should find a way to have all the comments in the store...
    return axios.post(process.env.API_URI + 'post/' + payload.sub + '/' + payload.pid + '/comment/' + payload.cid + '/vote', { upvote: payload.positive === 1 })
  },
  editComment (_, payload) {
    return axios.patch(process.env.API_URI + 'post/' + payload.sub + '/' + payload.pid + '/comment/' + payload.cid, { content: payload.content })
  },
  deleteComment (_, payload) {
    return axios.delete(process.env.API_URI + 'post/' + payload.sub + '/' + payload.pid + '/comment/' + payload.cid)
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
