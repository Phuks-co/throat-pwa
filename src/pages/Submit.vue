<template>
  <q-page class="docs-input row justify-center">
    <div class="col-xl-4 col-lg-6 col-md-6 col-sm-12 col-xs-12 q-pa-sm">
      <span style="font-size: 2em">Create post</span>
      <q-form @submit="onSubmit" class="q-gutter-md" v-if="!sent">

        <q-select
          v-model="postingSub"
          use-input
          hide-selected
          fill-input
          input-debounce="300"
          label="Sub"
          :options="subs"
          dense
          @filter="filterFn"
          hint="Type to find a sub"
          :rules="[ val => val && val.length > 0 || 'Field required']" />

        <q-input
          v-model="title"
          label="Title"
          dense
          :rules="[ val => val && val.length > 0 || 'Field required', val => val.length >= 3 || 'At least three characters']" />

        <q-btn-toggle
          v-model="postType"
          spread
          no-caps
          toggle-color="blue"
          :color="$q.dark.isActive ? 'black' : 'white'"
          :text-color="$q.dark.isActive ? 'white' : 'black'"
          label="Post type"
          :options="postOptions" />

        <q-separator/>

        <q-input
          v-if="postType == 'text'"
          v-model="content"
          filled
          style="width: 95%"
          type="textarea"
          label="Post content"
          counter
          :maxlength="16384" />

        <q-input
          v-if="postType == 'link'"
          v-model="link"
          filled
          type="text"
          label="Paste link here">
          <template v-slot:after>
            <q-btn round dense flat icon="play_for_work" :loading="loadingGrabber" :disable="!link" @click="grabTitle" />
          </template>
        </q-input>
        <div>
          <q-btn label="Submit" type="submit" color="primary" :loading="$store.state.auth.loading"/>
        </div>
      </q-form>
      <div v-else>
        <div v-if="$store.state.postList.loading " class="row justify-center full-height full-width text-center q-pt-lg">
          <q-spinner color="primary" size="3em"/>
        </div>
        <div v-if="$store.state.captcha.required">
          <h4>Captcha required</h4>

          <img v-if="!$store.state.captcha.loading" class="challenge_image" alt="Captcha" :src="'data:image/png;base64,' + $store.state.captcha.image" />
          <q-input
            v-model="captcha"
            style="width: 95%"
            label="Type the text in the image">
            <template v-slot:after>
              <q-btn round dense flat icon="refresh" :loading="$store.state.captcha.loading" @click="$store.dispatch('captcha/getCaptcha')" />
            </template>
          </q-input>
          <q-btn label="Submit" type="submit" color="primary" class="q-mt-lg" :loading="$store.state.auth.loading" @click="onSubmit"/>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import Vue from 'vue'
import axios from 'axios'

let cancel: ((x: string) => void) | undefined
export default Vue.extend({
  name: 'PageLogin',
  components: {},
  props: ['sub'],
  data: () => ({
    postingSub: '',
    subs: [],

    postType: 'text', // TODO: Uploads
    title: '',
    link: '',
    content: '',
    captcha: '',

    postOptions: [
      { label: 'Text post', value: 'text' },
      { label: 'Link post', value: 'link' }
    ],

    loadingGrabber: false,
    sent: false
  }),
  created () {
    if (this.sub) this.postingSub = this.sub
  },
  methods: {
    grabTitle () {
      this.loadingGrabber = true
      axios.get(process.env.API_URI + 'grabtitle', { params: { url: this.link } })
        .then((r) => {
          this.title = r.data.title
        }).catch((err) => {
          this.$q.notify(err)
        }).finally(() => {
          this.loadingGrabber = false
        })
    },
    filterFn (val: string, update: () => void, abort: () => void) {
      if (val.length < 3) return abort()

      if (cancel !== undefined) cancel('err_cancel')
      axios({
        method: 'GET',
        url: process.env.API_URI + 'sub',
        params: { query: val },
        cancelToken: new axios.CancelToken(function executor (c) {
          cancel = c
        })
      })
        .then((r) => {
          this.subs = r.data.results.map((a: { name: string }) => a.name)
          update()
        }).catch((err) => {
          if (err.message === 'err_cancel') return
          this.$q.notify(err)
          abort()
        })
    },
    onSubmit () {
      this.sent = true
      this.$store.commit('captcha/setRequired', { required: false })
      this.$store.dispatch('postList/createPost', {
        sub: this.postingSub,
        title: this.title,
        type: this.postType,
        link: this.link,
        content: this.content,
        nsfw: false,
        challengeResponse: this.captcha,
        challengeToken: this.$store.state.captcha.token
      }).then((r) => {
        this.sent = false
        this.$router.push({ name: 'view_post', params: { sub: this.postingSub, pid: r.pid } })
      }).catch((e) => {
        if (e === 'captcha_req') {
          return
        }
        this.captcha = ''
        // TODO: Use error codes here
        if (e !== 'Invalid captcha') this.sent = false
        this.$q.notify(e)
      })
    }
  }
})
</script>
