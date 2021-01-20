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
          @click="leftDrawerOpen = !leftDrawerOpen">
          <q-badge color="red" v-if="!leftDrawerOpen && $store.state.notifications.count.total" floating>{{ $store.state.notifications.count.total }}</q-badge>
        </q-btn>

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
        <DrawerItem v-if="!$store.state.auth.loggedIn" link="/register" title="Register" icon="portrait"/>

        <q-item-label
          header
          class="text-grey-8"
          v-if="$store.state.auth.loggedIn"
        >
          Logged in as <b>{{$store.state.auth.username}}</b>
        </q-item-label>
        <DrawerItem v-if="$store.state.auth.loggedIn" @click="logout" title="Log out" icon="contact_mail"/>

        <q-separator />
        <DrawerItem v-if="$store.state.auth.loggedIn" title="Notifications" link="/messages/notifications" icon="notifications" :badge="$store.state.notifications.count.notifications"/>
        <DrawerItem v-if="$store.state.auth.loggedIn" title="Messages" link="/messages/inbox" icon="mail" :badge="$store.state.notifications.count.messages"/>

        <q-separator/>

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
            <q-item-label>Push notifications</q-item-label>
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
    // XXX: hack for spoiler tags
    document.addEventListener('click', function (event) {
      const clickedElement = event.target, matchingChild = clickedElement.closest('spoiler')
      if (matchingChild !== null) {
        if (matchingChild.matches('spoiler')) {
          matchingChild.classList.add('shown')
        }
      }
    })
    // XXX: Move to store
    this.darkMode = localStorage.getItem('dark') === '1'
  },
  mounted () {
    this.$store.dispatch('auth/getData')
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
<style lang="sass">
.material-icons.alm
  vertical-align: middle

.body--dark #mainHeader
    background-color: black

body.body--dark
  background: #000
  a
    color: #777
  a:visited
    color: #444

spoiler:not(.shown) a
  pointer-events: none
  color: #111

spoiler:not(.shown)
  color: #111
  background-color: #111
  border-radius: 3px
  user-select: none

spoiler
  transition: background-color 400ms linear

</style>
