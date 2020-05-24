<template>
  <q-page class="docs-input row justify-center">
    <div class="col-xl-4 col-lg-6 col-md-6 col-sm-12 col-xs-12 q-pa-xl">
      <h4>Login</h4>
      <q-form @submit="onSubmit" class="q-gutter-md">

        <q-input
          filled
          v-model="username"
          label="Username"
          :lazy-rules="true"
          :rules="[ val => val && val.length > 0 || 'Please type something']"
          :error-message="errorMsg"
          :error="error"
        />

        <q-input
          filled
          v-model="password"
          type="password"
          label="Password"
          :lazy-rules="true"
          :rules="[ val => val && val.length > 0 || 'Please type something']"
        />

        <div>
          <q-btn label="Submit" type="submit" color="primary" :loading="$store.state.auth.loading"/>
        </div>
      </q-form>
    </div>
  </q-page>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'PageLogin',
  components: {},
  props: ['nextPage', 'nextPageProps'],
  data () {
    const username = ''
    const password = ''
    const errorMsg = ''
    const error = false
    return { username, password, errorMsg, error }
  },
  methods: {
    onSubmit () {
      this.error = false
      this.$store.dispatch('auth/logIn', { username: this.username, password: this.password })
        .then(() => {
          if (this.$store.state.auth.nextPage) {
            this.$router.push({ name: this.$store.state.auth.nextPage, params: this.$store.state.auth.nextPageProps })
            this.$store.commit('auth/setNextPageProps', { nextPage: null, nextPageProps: null })
          } else {
            this.$router.push({ path: '/' })
          }
        })
        .catch((e) => {
          if (e.response) {
            this.errorMsg = 'Invalid username or password.'
            this.error = true
          } else {
            // Network error
            this.$q.notify('Could not contact the server.')
          }
        })
    }
  }
})
</script>
