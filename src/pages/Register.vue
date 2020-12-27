<template>
  <q-page class="docs-input row justify-center">
    <div class="col-xl-4 col-lg-6 col-md-6 col-sm-12 col-xs-12 q-pa-xl">
      <h4>Register</h4>
      <div v-if="loading" class="row justify-center full-height full-width text-center q-pt-lg">
        <q-spinner color="primary" size="3em"/>
      </div>
      <q-form @submit="onSubmit" class="q-gutter-md" v-else>
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

        <q-input
          filled
          v-model="password2"
          type="password"
          label="Password (again)"
          :lazy-rules="true"
          :rules="[ val => val && val.length > 0 || 'Please type something', val => val == password || 'Passwords must match']"
        />

        <q-input
          filled
          v-model="email"
          type="email"
          :label="'E-mail' + ((!$store.state.auth.registration.mandatory.email) ? ' (optional)' : '')"
          :lazy-rules="true"
          :rules="[ val => val && val.length > 0 || !$store.state.auth.registration.mandatory.email || 'Please type something']"
        />

        <q-input
          filled
          v-model="inviteCode"
          label="Invite code"
          :lazy-rules="true"
          v-if="$store.state.auth.registration.mandatory.invite_code"
          :rules="[ val => val && val.length > 0 || 'Please type something']"
          :error-message="errorMsg"
          :error="error"
        />

        <Challenge v-model="challengeResponse"/>
        <div>
          <q-btn label="Submit" type="submit" color="primary" :loading="$store.state.auth.loading"/>
        </div>
      </q-form>
    </div>
  </q-page>
</template>

<script lang="ts">
import Vue from 'vue'
import Challenge from 'components/Challenge.vue'

export default Vue.extend({
  name: 'PageLogin',
  components: { Challenge },
  props: ['nextPage', 'nextPageProps'],
  data () {
    const loading = true
    const username = ''
    const password = ''
    const password2 = ''
    const email = ''
    const inviteCode = ''
    const challengeResponse = ''
    const errorMsg = ''
    const error = false
    return { loading, username, password, password2, email, inviteCode, challengeResponse, errorMsg, error }
  },
  mounted () {
    // 1. Check if registration is enabled and if we gotta add extra fields
    this.$store.dispatch('auth/getRegistrationFields')
      .then(() => {
        this.loading = false
      })
  },
  methods: {
    onSubmit () {
      this.error = false
      this.$store.dispatch('auth/register', {
        username: this.username,
        password: this.password,
        email: this.email,
        inviteCode: this.inviteCode,
        challengeResponse: this.challengeResponse
      })
        .then(() => {
          if (this.$store.state.auth.accountStatus === 0) { // OK
            this.$store.dispatch('auth/logIn', { username: this.username, password: this.password })
              .then(() => {
                this.$router.push({ path: '/' })
              })
          } else if (this.$store.state.auth.accountStatus === 1) { // PROBATION
            // TODO: Probation. Show message to user saying that we sent em an email
            console.log('Probation!')
          }
        })
        .catch((e) => {
          this.error = true
          this.errorMsg = e
        })
    }
  }
})
</script>
