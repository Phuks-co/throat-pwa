<template>
  <div class="comment-main" :cid="comment.cid">
    <div v-if="comment.cid" class="comment-header" v-on:click="collapse()">
      <i v-if="!collapsed" class="material-icons tog-exp">remove_circle</i>
      <i v-else class="material-icons tog-exp">add_circle_outline</i>&nbsp;
      <span class="comment-header-info">
      {{comment.user}}&nbsp;<span class="interpunct"></span>&nbsp;<timeago :datetime="comment.time"></timeago>
      </span>
    </div>
    <div
      v-if="comment.cid && !editingComment"
      :class="((cid && comment.cid == cid) ? 'highlighted ' : '') + 'comment-content'"
      v-html="comment.content"
      :style="(collapsed) ? 'display: none' : 'display: block'"/>
    <div v-else-if="editingComment" class="comment-create-container">
      <div class="comment-create q-ml-sm q-mr-sm q-pb-lg q-pt-sm">
        <q-input
          v-model="comment.source"
          filled
          style="width: 100%"
          type="textarea"
          counter
          :maxlength="16384"
        />
        <q-btn color="primary" :loading="loadingCommentEdit" :disabled="!comment.source" @click="submitEdit">Submit</q-btn>
        <q-btn flat :disabled="loadingCommentEdit" @click="editingComment = false">Cancel</q-btn>
      </div>
    </div>

    <div v-if="comment.cid" :class="((cid && comment.cid == cid) ? 'highlighted ' : '') + 'comment-footer'" :style="(collapsed) ? 'display: none' : 'display: block'">
      <span v-if="comment.status === null" class="more footerbtn" @click="replyComment"><i class="material-icons">reply</i></span>
      <div style="display: inline-block; float: right">
        <span v-if="comment.user === $store.state.auth.username" class="more footerbtn" @click="editComment"><i class="material-icons">edit</i></span>
        <q-btn v-if="comment.status === null" flat dense icon="more_vert">
          <q-menu>
            <q-list style="min-width: 100px">
              <q-item clickable v-close-popup :to="'/s/' + post.sub + '/' + comment.pid + '/' + comment.cid">
                <q-item-section>Permalink</q-item-section>
              </q-item>
              <q-item clickable v-close-popup :to="'/u/' + comment.user">
                <q-item-section>{{comment.user}}'s profile</q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup @click="deleteCommentDialog = true" v-if="comment.user === $store.state.auth.username">
                <q-item-section>Delete</q-item-section>
              </q-item>
              <!-- <q-separator />
              <q-item clickable v-close-popup>
                <q-item-section>Report</q-item-section> TODO
              </q-item> -->
            </q-list>
          </q-menu>
        </q-btn>
        <div class="post-voting">
          <div title="Upvote" v-if="!loadingUpvote" :class="((comment.positive == 1) ? 'upvoted ': '') + 'upvote'" @click="upvote()" ><i class="material-icons">expand_less</i></div>
          <div class="q-pr-sm" v-else-if="loadingUpvote"><q-spinner color="gray" size="1.7em"/></div>
          <div class="score">{{comment.score}}</div>
          <div title="Downvote" v-if="!loadingDownvote" :class="((comment.positive == 0) ? 'downvoted ': '') + 'downvote'" @click="downvote()"><i class="material-icons">expand_more</i></div>
          <div class="q-pr-sm" v-else-if="loadingDownvote"><q-spinner color="gray" size="1.7em"/></div>
        </div>
      </div>
    </div>
    <CommentCreator v-if="createComment" :sub="sub" :pid="comment.pid" :parentcid="comment.cid" @newcomment="newComment" />

    <div :key="comment.children.length" v-if="comment.children && comment.children.length > 0" :class="((!comment.cid) ? 'comment-root' : '') + ' comment-children'" :style="(collapsed) ? 'display: none' : 'display: block'">
      <div v-for="cmt in comment.children" :key='cmt.cid'>
        <div v-if="cmt.cid === null">
          <router-link class="comment-load" :to="'/s/' + post.sub + '/' + comment.pid + '/' + comment.cid" v-if="level >= 7">Continue reading</router-link>
          <a v-else-if="loading == false && errored == false" class="comment-load" @click="loadComments">Load more comments ({{cmt.more}})</a>
          <a v-else-if="errored == true" class="comment-load" @click="loadComments">Error</a>
          <a v-else class="comment-load" @click="loadComments">Loading...</a>
        </div>
        <Comment v-else :sub="sub" :comment='cmt' :level='level + 1' :parent="comment.cid" :post="post" :cid="fcid ? fcid : cid"/>
      </div>
    </div>

    <q-dialog v-model="deleteCommentDialog">
      <q-card>
        <q-card-section class="row items-center">
          <span class="q-ml-sm">Do you really want to delete this comment?</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn label="Delete" color="red" @click="deleteComment" :loading="deletingComment" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import CommentCreator from 'components/CommentCreator.vue'
export default {
  components: { CommentCreator },
  props: {
    comment: {
      type: Object,
      required: true
    },
    level: {
      type: Number,
      required: true
    },
    parent: {
      type: String,
      default: ''
    },
    post: {
      type: Object,
      required: true
    },
    cid: {
      type: String,
      default: ''
    },
    sub: {
      type: String
    }
  },
  name: 'Comment',
  data: () => ({
    collapsed: false,
    loading: false,
    errored: false,
    reply: false,
    createComment: false,
    fcid: null,

    loadingUpvote: false,
    loadingDownvote: false,
    editingComment: false,
    loadingCommentEdit: false,
    deleteCommentDialog: false,
    deletingComment: false
  }),
  created () {
    if (this.comment.status !== null && this.comment.cid !== null) {
      this.collapsed = true
    }
  },
  methods: {
    deleteComment () {
      this.deletingComment = true
      this.loadingCommentEdit = true
      this.$store.dispatch('postList/deleteComment', { sub: this.sub, pid: this.comment.pid, cid: this.comment.cid })
        .then(() => {
          this.comment.source = null
          this.comment.content = null
          this.comment.user = '[Deleted]'
          this.collapsed = true
        }).catch((e) => {
          if (!e.response && typeof e !== 'string') e = 'Network error'
          this.$q.notify(e.response.data.msg || e)
        }).finally(() => {
          this.deletingComment = false
        })
    },
    submitEdit () {
      this.loadingCommentEdit = true
      this.$store.dispatch('postList/editComment', { sub: this.sub, pid: this.comment.pid, cid: this.comment.cid, content: this.comment.source })
        .then((r) => {
          this.comment.source = r.data.comment.source
          this.comment.content = r.data.comment.content
          this.editingComment = false
        }).catch((e) => {
          if (!e.response && typeof e !== 'string') e = 'Network error'
          this.$q.notify(e.response.data.msg || e)
        }).finally(() => {
          this.loadingCommentEdit = false
        })
    },
    editComment () {
      this.editingComment = !this.editingComment
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
      if (!this.comment.children) {
        this.$set(this.comment, 'children', [comment])
      } else {
        this.comment.children.unshift(comment)
      }
    },
    upvote () {
      this.loadingUpvote = true
      this.$store.dispatch('postList/voteComment', { sub: this.sub, pid: this.comment.pid, cid: this.comment.cid, positive: 1 })
        .then((r) => {
          this.comment.positive = r.data.rm ? null : 1
          this.comment.score = r.data.score
        }).catch((e) => {
          if (!e.response && typeof e !== 'string') e = 'Network error'
          this.$q.notify(e.response.data.msg || e)
        }).finally(() => {
          this.loadingUpvote = false
        })
    },
    downvote () {
      this.loadingDownvote = true
      this.$store.dispatch('postList/voteComment', { sub: this.sub, pid: this.comment.pid, cid: this.comment.cid, positive: 0 })
        .then((r) => {
          this.comment.positive = r.data.rm ? null : 0
          this.comment.score = r.data.score
        }).catch((e) => {
          if (!e.response && typeof e !== 'string') e = 'Network error'
          this.$q.notify(e.response.data.msg || e)
        }).finally(() => {
          this.loadingDownvote = false
        })
    },
    collapse () {
      this.collapsed = !this.collapsed
    },
    loadComments () {
      this.loading = true
      this.errored = false
      const loader = this.comment.children[this.comment.children.length - 1]

      this.$store.dispatch('postList/loadChildrenComments', { pid: this.post.pid, sub: this.post.sub, cid: this.comment.cid, key: loader.key })
        .then((comms) => {
          if (loader.key) {
            this.comment.children = this.comment.children.concat(comms)
            this.comment.children = this.comment.children.filter(e => e !== loader)
          } else {
            this.comment.children.pop()
            // Stripping all the context that is only used for permalinks...
            let commt = comms[0].children
            if (commt.length > 0) {
              commt = commt[0].children
            }
            this.comment.children = this.comment.children.concat(commt)
          }
          this.loading = false
        })
        .catch((e) => {
          this.loading = false
          this.errored = true
          console.error(e)
        })
    }
  }
}
</script>

<style scoped lang="sass">
@import '../css/post.sass'
.highlighted
  background: #ffeecf

.tog-exp
  font-size: 1em
  vertical-align: middle
  cursor: pointer

.comment-main
  padding-top: 0.6em

.comment-header
  background: #eee
  a
    text-decoration: none
    color: #505050

.comment-content
  word-wrap: break-word
  padding-left: 8px
  border-left: 1px solid #bbb
  margin-left: 6px
  padding-right: 0.7em
  padding-bottom: 0.4em /* Don't remove this padding. It prevents margin collapse */

.comment-content > :last-child
  margin-bottom: 0

.comment-children
  padding-left: 8px
  margin-left: 6px
  border-left: 1px solid #bbb

.comment-children.comment-root
  padding-left: 0
  margin-left: 0
  border: none

.comment-footer
  height: 2.1em
  padding-left: 8px
  border-left: 1px solid #bbb
  margin-left: 6px
  position: relative
  .post-voting
    height: inherit
    border-left: 2px solid #ddd
    padding-left: 3px
    i
      font-size: 2.1em
      padding: 0 0.2em 0 0.2em
  i
    font-size: 1.8em
    vertical-align: middle
  i:active
    background: #ddd
  .reply i
    padding: 0 0.2em 0 0.2em
  .more
    margin-right: .3em

.comment-footer i, .tog-exp
  color: rgba(0, 0, 0, 0.54)

.comment-load
  font-weight: bold
  white-space: nowrap

.footerbtn
  cursor: pointer

.body--dark
  .highlighted
    background: #444
  .comment-header
    background: #1b1b1b
    color: #888
  .comment-content, .comment-children, .comment-footer
    border-color: #666
  .comment-content
    color: #aaa
  .comment-footer
    color: #666
    .post-voting
      border-color: #444
    i:active
      background: #444
  .comment-footer i, .tog-exp
    color: #666

</style>
