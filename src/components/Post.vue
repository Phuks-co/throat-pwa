<template>
  <div class="post q-pt-md">
    <div class="post-block">
      <div class="post-title">{{post.title}}</div>
      <div class="post-data">
        <timeago :datetime="post.posted"></timeago>
        ago by
        <router-link :to="'/u/' + post.user">{{post.user}}</router-link>
        on
        <router-link :to="'/s/' + post.sub">/s/{{post.sub}}</router-link>
      </div>

      <!-- link post -->
      <div v-if="post.type === 'link'" :class="(post.trustedHost ? 'post-link-th' : '') + ' post-link'">
        <div v-if="post.trustedHost">
          <a :href="post.link" target="_blank"><img :alt="post.title" :src="post.link"/></a>
        </div>
        <a class="p-a" :href="post.link" target="_blank">{{post.link}}</a>
      </div>
      <div v-else-if="post.type == 'text' && !editing" class="post-text" v-html="post.content"/>
      <div v-else-if="post.type == 'text' && editing" class="comment-create-container">
        <div class="comment-create q-ml-sm q-mr-sm q-pb-lg q-pt-sm">
          <q-input
            v-model="post.source"
            filled
            style="width: 100%"
            type="textarea"
            counter
            :maxlength="16384"
          />
          <q-btn color="primary" :loading="$store.state.postList.loadingEdit" :disabled="!post.source" @click="saveEdit">Submit</q-btn>
          <q-btn flat :disabled="$store.state.postList.loadingEdit" @click="editing = false">Cancel</q-btn>
        </div>
      </div>
      <div v-else-if="post.type == 'poll'">
        <marquee>I have yet to implement polls. Sorry.</marquee> <!-- TODO -->
      </div>

      <div class="post-footer">
        <span class="create-comm comments" @click="replyComment">
          <i class="material-icons alm"  aria-hidden="true">reply</i> Comment
        </span>
        <router-link class="comments" :to="'/s/' + post.sub + '/' + post.pid">
          <i class="material-icons alm" aria-hidden="true">chat_bubble</i> {{post.comments}}
        </router-link>
        <div style="display: inline-block; float: right">
          <q-btn v-if="post.user === $store.state.auth.username" flat dense icon="more_vert" style="border-right: 2px solid #ddd">
            <q-menu>
              <q-list style="min-width: 100px">
                <q-item v-if="post.type === 'text'" clickable v-close-popup @click="editPost">
                  <q-item-section>Edit</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="deletePostDialog = true">
                  <q-item-section>Delete</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <div class="post-voting">
            <div title="Upvote" v-if="!post.loadingUpvote" :class="((post.positive == 1) ? 'upvoted ': '') + 'upvote'" @click="upvote(post)" ><i class="material-icons">expand_less</i></div>
            <div class="q-pr-sm" v-else><q-spinner color="gray" size="1.7em"/></div>
            <div class="score">{{post.score}}</div>
            <div title="Downvote" v-if="!post.loadingDownvote" :class="((post.positive == 0) ? 'downvoted ': '') + 'downvote'" @click="downvote(post)"><i class="material-icons">expand_more</i></div>
            <div class="q-pr-sm" v-else><q-spinner color="gray" size="1.7em"/></div>
          </div>
        </div>
      </div>
    </div>
    <CommentCreator v-if="createComment" :sub="post.sub" :pid="post.pid" @newcomment="newComment" />

    <div class="comment-block q-pl-sm">
      <div class="q-pt-sm" style="font-size: 1.4em">Comments</div>

      <div v-if="$store.state.postList.loadingComments && post.comments > 0" class="row justify-center full-height full-width text-center q-pt-lg">
        <q-spinner color="primary" size="3em"/>
      </div>
      <div v-else-if="post.comments == 0">
        No comments.. yet
      </div>
      <div v-else-if="!$store.state.postList.loadingComments && commentsError">
        Error loading comments: {{commentsError}}
      </div>
      <div v-else class='comment-space'>
        <Comment :comment="{cid: null, children: comments}" :sub="post.sub" :level='0' parent="0" :post="post" :cid="fcid ? fcid : cid"/>
      </div>
    </div>

    <q-dialog v-model="deletePostDialog">
      <q-card>
        <q-card-section class="row items-center">
          <span class="q-ml-sm">Do you really want to delete this post?</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn label="Delete" color="red" @click="deletePost" :loading="$store.state.postList.loadingEdit" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import Comment from 'components/Comment.vue'
import CommentCreator from 'components/CommentCreator.vue'
export default {
  name: 'Post',
  components: { Comment, CommentCreator },
  props: {
    post: {
      type: Object,
      required: true
    },
    cid: {
      type: String,
      default: ''
    }
  },
  data: () => ({
    env: process.env,
    commentsError: '',
    // Stored locally instead of in the store until I grasp a better way to handle the recursivity
    comments: [],
    createComment: false,
    fcid: null,

    editing: false,
    deletePostDialog: false
  }),
  created () {
    this.comments = []
    this.loadComments()
  },
  methods: {
    deletePost () {
      this.$store.dispatch('postList/deletePost', { pid: this.post.pid, sub: this.post.sub, content: this.post.source })
        .then(() => {
          this.deletePostDialog = false
          this.$router.push({ name: 'view_sub', params: { sub: this.post.sub } })
        }).catch((e) => {
          if (!e.response && typeof e !== 'string') e = 'Network error'
          this.$q.notify(e)
        })
    },
    saveEdit () {
      this.$store.dispatch('postList/editPost', { pid: this.post.pid, sub: this.post.sub, content: this.post.source })
        .then(() => {
          this.editing = false
        }).catch((e) => {
          if (!e.response && typeof e !== 'string') e = 'Network error'
          this.$q.notify(e)
        })
    },
    editPost () {
      this.editing = !this.editing
    },
    loadComments () {
      if (this.post.comments > 0) {
        let promise = null
        if (this.cid) {
          promise = this.$store.dispatch('postList/loadChildrenComments', { pid: this.post.pid, sub: this.post.sub, cid: this.cid })
        } else {
          promise = this.$store.dispatch('postList/loadComments', { pid: this.post.pid, sub: this.post.sub })
        }
        promise.then((comms) => {
          this.comments = comms
        }).catch((e) => {
          this.commentsError = e
        })
      }
    },
    upvote () {
      if (this.post.archived) return this.$q.notify({ message: 'Post is archived', timeout: 1000 })
      this.post.loadingUpvote = true
      this.$store.dispatch('postList/vote', { positive: 1, pid: this.post.pid, sub: this.post.sub })
        .then((r) => {
          this.post.positive = r.rm ? null : 1
          this.post.score = r.score
        })
        .catch(e => {
          this.$q.notify(e)
        }).finally(() => {
          this.post.loadingUpvote = false
        })
    },
    downvote () {
      if (this.post.archived) return this.$q.notify({ message: 'Post is archived', timeout: 1000 })
      this.post.loadingDownvote = true
      this.$store.dispatch('postList/vote', { positive: 0, pid: this.post.pid, sub: this.post.sub })
        .then((r) => {
          this.post.positive = r.rm ? null : 0
          this.post.score = r.score
        })
        .catch(e => {
          this.$q.notify(e)
        }).finally(() => {
          this.post.loadingDownvote = false
        })
    },
    replyComment () {
      if (!this.$store.state.auth.loggedIn) {
        this.$store.commit('auth/setNextPageProps', { nextPage: this.$router.currentRoute.name, nextPageProps: this.$router.currentRoute.params })
        this.$router.push({ name: 'login' })
        return
      }
      this.createComment = !this.createComment
    },
    newComment (comment) {
      this.createComment = false
      this.fcid = comment.cid
      this.post.comments++
      this.comments.unshift(comment)
    }
  }
}
</script>
<style scoped lang="sass">
@import '../css/post.sass'
.post-block .post-title, .post-block .post-data, .post-block .post-footer, .post-block .post-text
  padding-left: 10px
  //margin-right: 1em

.post-block .post-title
  font-size: 16px

.post-link
  border: 1px solid #ddd
  border-radius: 2px
  padding: 0.2em
  margin: 0.7em 1.3em 0.5em 1.3em
  position: relative
  .p-a
    color: #005aff
    text-decoration: none
    display: inline-block
    text-overflow: ellipsis
    width: 95%
    white-space: nowrap
    overflow: hidden
    vertical-align: middle
  .p-a[href^="http://"]:after, .p-a[href^="https://"]:after
      content: url(data:image/svg+xml,%3Csvg%20version%3D%221.1%22%20width%3D%2214%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20stroke%3D%22%23005aff%22%20d%3D%22M17%2013v6c0%200.137-0.027%200.266-0.075%200.382-0.050%200.122-0.125%200.232-0.218%200.325s-0.203%200.167-0.325%200.218c-0.116%200.048-0.245%200.075-0.382%200.075h-11c-0.137%200-0.266-0.027-0.382-0.075-0.122-0.050-0.232-0.125-0.325-0.218s-0.167-0.203-0.218-0.325c-0.048-0.116-0.075-0.245-0.075-0.382v-11c0-0.137%200.027-0.266%200.075-0.382%200.050-0.122%200.125-0.232%200.218-0.325s0.203-0.167%200.325-0.218c0.116-0.048%200.245-0.075%200.382-0.075h6c0.552%200%201-0.448%201-1s-0.448-1-1-1h-6c-0.405%200-0.793%200.081-1.148%200.228-0.367%200.152-0.697%200.375-0.973%200.651s-0.499%200.606-0.651%200.973c-0.147%200.355-0.228%200.743-0.228%201.148v11c0%200.405%200.081%200.793%200.228%201.148%200.152%200.368%200.375%200.698%200.651%200.974s0.606%200.499%200.974%200.651c0.354%200.146%200.742%200.227%201.147%200.227h11c0.405%200%200.793-0.081%201.148-0.228%200.368-0.152%200.698-0.375%200.974-0.651s0.499-0.606%200.651-0.974c0.146-0.354%200.227-0.742%200.227-1.147v-6c0-0.552-0.448-1-1-1s-1%200.448-1%201zM10.707%2014.707l9.293-9.293v3.586c0%200.552%200.448%201%201%201s1-0.448%201-1v-6c0-0.003%200-0.005%200-0.008-0.001-0.132-0.028-0.258-0.075-0.374-0.101-0.245-0.297-0.441-0.543-0.543-0.115-0.047-0.241-0.074-0.373-0.075-0.003%200-0.006%200-0.009%200h-6c-0.552%200-1%200.448-1%201s0.448%201%201%201h3.586l-9.293%209.293c-0.391%200.391-0.391%201.024%200%201.414s1.024%200.391%201.414%200z%22%3E%3C/path%3E%3C/svg%3E)
      margin: 0 0 0 5px
      color: blue
      position: absolute
      right: .4em

.post-link.post-link-th
  margin: 0.7em 0 0 0
  padding: unset
  border: none
  .p-a
    margin-left: 0.3em

.create-comm
  margin-right: 1em
  padding: 5px
  cursor: pointer

.comment-create
  position: relative

.post-footer .create-comm i
  font-size: 1.7em

.create-comm:active
  background: #ddd

.comment-space
  position: relative

.body--dark
  .post-link
    border-color: #333
    .p-a
      color: #105be6
  .create-comm:active
    background: #444
</style>
