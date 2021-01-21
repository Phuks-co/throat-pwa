<template>
  <q-page class="docs-input row justify-center">
    <div class="col-xl-4 col-lg-6 col-md-6 col-sm-12 col-xs-12 q-pa-sm">
      <span style="font-size: 2em">Messages</span>
      <div v-if="loading" class="row justify-center full-height full-width text-center q-pt-lg">
        <q-spinner color="primary" size="3em"/>
      </div>
      <div v-else class="q-pt-sm q-pl-sm">
        <div v-for="ntf in messages" :key="ntf.id">
          <q-card bordered :class="(!ntf.read ? 'msg-highlight' : '') + ' q-ma-sm'">
            <q-card-section>
              <!-- title -->
              <div class="text-subtitle1">{{ ntf.subject }}</div>
              <div class="text-subtitle2" style="margin-bottom: 0.6em">Sent <timeago :datetime="ntf.posted"/> ago by <router-link :to="`/u/${ntf.sender}`">/u/{{ ntf.sender }}</router-link></div>

              <div v-html="ntf.content" />
            </q-card-section>
            <q-separator/>
            <q-card-actions>
              <q-btn flat disabled v-if="ntf.read">Read&nbsp;<span v-if="ntf.read"><timeago :datetime="ntf.read" />&nbsp;ago</span><span v-else>now</span></q-btn>
              <q-btn color="primary" v-else @click="markAsRead(ntf)" :loading="ntf.markAsReadLoading">Mark as read</q-btn>
              <q-btn flat @click="sendMessage(ntf)">Reply</q-btn>
              <q-space/>
              <q-btn flat v-if="!ntf.ignored" @click="ignoreUser(ntf)" :loading="ntf.loadingIgnore">Block</q-btn>
              <q-btn flat v-else @click="unignoreUser(ntf)" :loading="ntf.loadingIgnore">Unblock</q-btn>
              <q-btn flat color="red" @click="deleteMessage(ntf)" :loading="ntf.loadingDelete">Delete</q-btn>
            </q-card-actions>
          </q-card>
        </div>
      </div>
    </div>
    <q-dialog v-model="dialogMessageComposer" :maximized="$q.platform.is.mobile" style="min-width: 50%;">
      <MessageComposer :to="messageComposerTo" :subject="messageComposerSubject" @sent="loadStuff()"/>
    </q-dialog>
  </q-page>
</template>

<script>
import MessageComposer from '../components/MessageComposer'
export default {
  name: 'Messages',
  components: { MessageComposer },
  data: () => ({
    messages: [],
    loading: false,
    env: process.env,
    dialogMessageComposer: false,
    messageComposerTo: null,
    messageComposerSubject: null
  }),
  mounted () {
    this.loadStuff()
  },
  methods: {
    loadStuff () {
      this.dialogMessageComposer = false
      // TODO: Move to store
      this.loading = true
      this.$axios.get(`${process.env.API_URI}messages`)
        .then((res) => {
          res.data.messages.forEach((i) => {
            i.loadingIgnore = false
            i.loadingDelete = false
            i.markAsReadLoading = false
          })
          this.messages = res.data.messages
        })
        .catch((e) => {
          if (!e.response && typeof e !== 'string') e = 'Network error'
          this.$q.notify(e.response.data.msg || e)
        }).finally(() => {
          this.loading = false
        })
    },
    ignoreUser (ntf) {
      ntf.loadingIgnore = true
      this.$axios.post(`${process.env.API_URI}notifications/ignore`, { user: ntf.sender })
        .then(() => {
          ntf.ignored = true
          ntf.loadingIgnore = false
        })
        .catch((e) => {
          if (!e.response && typeof e !== 'string') e = 'Network error'
          this.$q.notify(e.response.data.msg || e)
        })
        .finally(() => {
          ntf.loadingIgnore = false
        })
    },
    unignoreUser (ntf) {
      ntf.loadingIgnore = true
      this.$axios.delete(`${process.env.API_URI}notifications/ignore`, { data: { user: ntf.sender } })
        .then(() => {
          ntf.ignored = false
          ntf.loadingIgnore = false
        })
        .catch((e) => {
          if (!e.response && typeof e !== 'string') e = 'Network error'
          this.$q.notify(e.response.data.msg || e)
        })
        .finally(() => {
          ntf.loadingIgnore = false
        })
    },
    deleteMessage (ntf) {
      this.$q.dialog({
        title: 'Confirm',
        message: 'Do you want to delete this notification?',
        ok: true,
        cancel: true
      }).onOk(() => {
        ntf.loadingDelete = true
        this.$axios.delete(`${process.env.API_URI}messages`, { data: { messageId: ntf.id } })
          .then(() => {
            this.messages = this.messages.filter((r) => r.id !== ntf.id)
          })
          .catch((e) => {
            if (!e.response && typeof e !== 'string') e = 'Network error'
            this.$q.notify(e.response.data.msg || e)
          })
          .finally(() => {
            ntf.loadingDelete = false
          })
      })
    },
    sendMessage (ntf) {
      this.messageComposerTo = ntf.sender
      this.dialogMessageComposer = true
      this.messageComposerSubject = ntf.subject
    },
    markAsRead (ntf) {
      ntf.markAsReadLoading = true
      this.$axios.post(`${process.env.API_URI}messages/${ntf.id}/read`)
        .then(() => {
          ntf.read = new Date()
        })
        .finally(() => {
          ntf.markAsReadLoading = false
        })
    }
  }
}
</script>
<style lang="sass">
.msg-highlight
  border-left: 4px solid $primary
</style>
