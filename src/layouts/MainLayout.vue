<template>
  <q-layout view="lHh Lpr lFf" dark>
    <q-header elevated id="mainHeader">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />

        <q-toolbar-title>
          <router-link tag="span" to="/">Phuks</router-link>
        </q-toolbar-title>
        <q-btn flat round icon="edit" @click="edit" v-if="$route.name !== 'create_post' && $store.state.auth.loggedIn"/>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :content-class="darkMode ? 'bg-black-1' : 'bg-grey-1'"
    >
      <q-list>
        <DrawerItem v-if="!$store.state.auth.loggedIn" link="/login" title="Login" icon="perm_identity"/>
        <!-- TODO <DrawerItem v-if="!$store.state.auth.loggedIn" link="/register" title="Register" icon="portrait"/> -->

        <q-item-label
          header
          class="text-grey-8"
          v-if="$store.state.auth.loggedIn"
        >
          Logged in as <b>{{$store.state.auth.username}}</b>
        </q-item-label>
        <DrawerItem v-if="$store.state.auth.loggedIn" @click="logout" title="Log out" icon="contact_mail"/>

        <q-separator />

        <q-item tag="label" v-ripple>
          <q-item-section>
            <q-item-label>Dark mode</q-item-label>
          </q-item-section>
          <q-item-section avatar>
            <q-toggle color="red" v-model="darkMode" />
          </q-item-section>
        </q-item>

        <q-item tag="label" v-ripple v-if="$store.state.auth.loggedIn">
          <q-item-section>
            <q-item-label>Notifications</q-item-label>
          </q-item-section>
          <q-item-section avatar v-if="!$store.state.notifications.loading">
            <q-toggle color="red" v-model="notifications" :disable="!$store.state.notifications.available" />
          </q-item-section>
          <q-item-section avatar v-else>
            <q-spinner color="gray" size="1.7em"/>
          </q-item-section>
        </q-item>

        <q-item>
          Version: {{version}}
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view :key="$route.fullPath"/>
    </q-page-container>
  </q-layout>
</template>

<script>
import DrawerItem from '../components/DrawerItem'
import { version } from '../../package.json'

export default {
  name: 'MainLayout',

  components: {
    DrawerItem
  },
  data () {
    return {
      version: version,
      leftDrawerOpen: false,
      darkMode: false,
      notifications: this.$store.state.notifications.pushToken !== null
    }
  },
  created () {
    // XXX: Move to store
    this.darkMode = localStorage.getItem('dark') === '1'
  },
  watch: {
    darkMode (val) {
      localStorage.setItem('dark', val ? '1' : '0')
      this.$q.dark.set(val)
    },
    notifications (val) {
      if (val) {
        this.$store.dispatch('notifications/enableNotifications').finally(() => this.$store.state.notifications.pushToken !== null)
      } else {
        this.$store.dispatch('notifications/disableNotifications').finally(() => this.$store.state.notifications.pushToken !== null)
      }
    }
  },
  methods: {
    edit () {
      this.$router.push({ name: 'create_post', params: { sub: this.$route.params.sub || undefined } })
    },
    logout () {
      this.$store.commit('auth/logout')
      this.$router.push({ path: '/' })
    }
  }
}
</script>
<style>
.material-icons.alm{
  vertical-align: middle;
}
.body--dark #mainHeader{
    background-color: black;
}
body.body--dark {
  background: #000
}
</style>
