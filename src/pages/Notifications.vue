<template>
  <q-page class="docs-input row justify-center">
    <div class="col-xl-4 col-lg-6 col-md-6 col-sm-12 col-xs-12 q-pa-sm">
      <span style="font-size: 2em">Notifications</span>
      <div v-if="loading" class="row justify-center full-height full-width text-center q-pt-lg">
        <q-spinner color="primary" size="3em"/>
      </div>
      <div v-else class="q-pt-sm q-pl-sm">
        <div v-for="ntf in messages" :key="ntf.id">
          <q-card bordered :class="(!ntf.read ? 'msg-highlight' : '') + ' q-ma-sm'">
            <q-card-section>
              <!-- title -->
              <div class="text-subtitle2" v-if="ntf.type == 'POST_REPLY'">
                <router-link :to="`/u/${ntf.sender}`">{{ntf.sender}}</router-link> replied to your post <router-link :to="`/s/${ntf.sub_name}/${ntf.pid}`">{{ntf.post_title}}</router-link>
              </div>
              <div class="text-subtitle2" v-else-if="ntf.type == 'COMMENT_REPLY'">
                <router-link :to="`/u/${ntf.sender}`">{{ntf.sender}}</router-link> replied to your comment in <router-link :to="`/s/${ntf.sub_name}/${ntf.pid}`">{{ntf.post_title}}</router-link>
              </div>
              <div class="text-subtitle2" v-else-if="['POST_MENTION', 'COMMENT_MENTION'].includes(ntf.type)">
                <router-link :to="`/u/${ntf.sender}`">{{ntf.sender}}</router-link> mentioned you in <router-link :to="`/s/${ntf.sub_name}/${ntf.pid}`">{{ntf.post_title}}</router-link>
              </div>
              <div class="text-subtitle2" v-else-if="ntf.type == 'SUB_BAN'">
                <router-link :to="`/u/${ntf.sender}`" v-if="ntf.sender">{{ntf.sender}}</router-link>
                <span v-else>You have been</span>
                banned you from <router-link :to="`/s/${ntf.sub_name}`">{{ntf.sub_name}}</router-link>
              </div>
              <div class="text-subtitle2" v-else-if="ntf.type == 'SUB_UNBAN'">
                <router-link :to="`/u/${ntf.sender}`" v-if="ntf.sender">{{ntf.sender}}</router-link>
                <span v-else>You have been</span>
                unbanned you from <router-link :to="`/s/${ntf.sub_name}`">{{ntf.sub_name}}</router-link>
              </div>

              <div class="text-subtitle2" v-else-if="ntf.type == 'POST_DELETE'">
                <template v-if="ntf.sender">
                  <template v-if="ntf.pid">
                    <router-link :to="`/u/${ntf.sender}`">{{ntf.sender}}</router-link> deleted your post <router-link :to="`/s/${ntf.sub_name}/${ntf.pid}`">{{ntf.post_title}}</router-link>
                  </template>
                  <template v-else>
                    <router-link :to="`/u/${ntf.sender}`">{{ntf.sender}}</router-link> deleted one of your posts in <router-link :to="`/s/${ntf.sub_name}`">{{ntf.sub_name}}</router-link>
                  </template>
                </template>
                <template v-else>
                  <template v-if="ntf.pid">
                    Your post <router-link :to="`/s/${ntf.sub_name}/${ntf.pid}`">{{ntf.post_title}}</router-link> has been deleted
                  </template>
                  <template v-else>
                    One of your posts in <router-link :to="`/s/${ntf.sub_name}`">{{ntf.sub_name}}</router-link> has been deleted
                  </template>
                </template>
              </div>

              <div class="text-subtitle2" v-else-if="ntf.type == 'POST_UNDELETE'"> <!-- big dupe -->
                <template v-if="ntf.sender">
                  <router-link :to="`/u/${ntf.sender}`">{{ntf.sender}}</router-link> un-deleted your post <router-link :to="`/s/${ntf.sub_name}/${ntf.pid}`">{{ntf.post_title}}</router-link>
                </template>
                <template v-else>
                  Your post <router-link :to="`/s/${ntf.sub_name}/${ntf.pid}`">{{ntf.post_title}}</router-link> has been un-deleted
                </template>
              </div>
              <div class="text-subtitle2" v-else>Notification</div>

              <!-- content -->
              <div v-if="ntf.cid">
                <Comment
                  :sub="ntf.sub_name"
                  :post="{sub: ntf.sub_name}"
                  :level="0"
                  :noMenu="!!ntf.comment_context"
                  :comment="getCommentArray(ntf)"/>
              </div>
              <div v-else-if="ntf.pid && ntf.type != 'POST_DELETE'">
                <Post
                  :no-comments="true"
                  :post="getPostArray(ntf)"
                />
              </div>
              <div v-else>
                <div v-if="ntf.content">{{ntf.content}}</div>
                <div v-if="['MOD_INVITE', 'MOD_INVITE_JANITOR', 'MOD_INVITE_OWNER'].includes(ntf.type)">
                  Please visit <router-link :to="`/s/${ntf.sub_name}/mods`">here</router-link> to accept or reject the invitation
                </div>
              </div>
            </q-card-section>
            <q-separator/>
            <q-card-actions>
              <q-btn flat disabled>Read&nbsp;<span v-if="ntf.read"><timeago :datetime="ntf.read" />&nbsp;ago</span><span v-else>now</span></q-btn>
              <q-space/>
              <q-btn flat v-if="!ntf.ignored" @click="ignoreUser(ntf)" :loading="ntf.loadingIgnore">Block</q-btn>
              <q-btn flat v-else @click="unignoreUser(ntf)" :loading="ntf.loadingIgnore">Unblock</q-btn>
              <q-btn flat color="red" @click="deleteNotification(ntf)" :loading="ntf.loadingDelete" icon="delete"/>
            </q-card-actions>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import Comment from 'components/Comment.vue'
import Post from '../components/Post'
export default {
  components: { Post, Comment },
  name: 'Notifications',

  data: () => ({
    messages: [],
    loading: false,
    env: process.env
  }),
  mounted () {
    this.loadStuff()
  },
  methods: {
    loadStuff () {
      // TODO: Move to store
      this.loading = true
      this.$axios.get(`${process.env.API_URI}notifications`)
        .then((res) => {
          res.data.notifications.forEach((i) => {
            i.loadingIgnore = false
            i.loadingDelete = false
          })
          this.messages = res.data.notifications
        })
        .catch((e) => {
          if (!e.response && typeof e !== 'string') e = 'Network error'
          this.$q.notify(e.response.data.msg || e)
        }).finally(() => {
          this.loading = false
        })
    },
    getCommentArray (ntf) {
      const comment = {
        pid: ntf.pid,
        cid: ntf.cid,
        user: ntf.sender,
        time: ntf.created,
        status: null,
        score: ntf.comment_score,
        content: ntf.comment_content,
        positive: ntf.comment_positive
      }
      if (ntf.comment_context) {
        return {
          pid: ntf.pid,
          cid: `${ntf.cid}`,
          user: this.$store.state.auth.username,
          time: ntf.comment_context_posted,
          status: null,
          score: ntf.comment_context_score,
          content: ntf.comment_context,
          children: [comment]
        }
      } else {
        return comment
      }
    },
    getPostArray (ntf) {
      return {
        posted: ntf.created,
        pid: ntf.pid,
        user: ntf.sender,
        sub: ntf.sub_name,
        score: ntf.post_score,
        positive: ntf.post_positive,
        content: ntf.post_content,
        link: ntf.post_link,
        loadingUpvote: false
      }
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
    deleteNotification (ntf) {
      this.$q.dialog({
        title: 'Confirm',
        message: 'Do you want to delete this notification?',
        ok: true,
        cancel: true
      }).onOk(() => {
        ntf.loadingDelete = true
        this.$axios.delete(`${process.env.API_URI}notifications`, { data: { notificationId: ntf.id } })
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
    }
  }
}
</script>
<style lang="sass">
.msg-highlight
  border-left: 4px solid $primary
</style>
