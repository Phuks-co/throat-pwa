<template>
  <div v-if="$store.state.postList.loading" class="row justify-center full-height full-width text-center q-pt-lg">
    <q-spinner color="primary" size="3em"/>
  </div>
  <div v-else class="post-list q-pt-sm q-pl-sm">
    <div v-for="post in $store.state.postList.posts" :key="post.pid" class="post">
      <div class="post-body">
        <div class="post-thumbnail">
          <router-link :to="'/s/' + post.sub + '/' + post.pid" v-if="post.ptype == 0" role="presentation" class="nothumb textpost"><q-icon name="comment"/></router-link>
          <router-link :to="'/s/' + post.sub + '/' + post.pid" v-if="post.thumbnail" class="thumbnail" :data-uri="post.link"><img alt="Thumbnail" :src="env.THUMBNAILS_URI + post.thumbnail"></router-link>
        </div>

        <router-link class="post-title" :to="'/s/' + post.sub + '/' + post.pid">{{post.title}}</router-link>
        <div class="post-data">
          <router-link class="blend" :to="'/s/' + post.sub">/s/{{post.sub}}</router-link>&nbsp;<span
          class="interpunct"></span>&nbsp;
          <timeago :datetime="post.posted"></timeago>&nbsp;<span class="interpunct"></span>&nbsp;
          <router-link class="blend" :to="'/u/' + post.user">{{post.user}}</router-link>
        </div>
      </div>
      <div class="post-footer">
        <router-link v-if="post.comments == 0" class="comments" :to="'/s/' + post.sub + '/' + post.pid"><i class="material-icons alm" aria-hidden="true">chat_bubble</i> Comment</router-link>
        <router-link v-else class="comments" :to="'/s/' + post.sub + '/' + post.pid"><i class="material-icons alm" aria-hidden="true">chat_bubble</i> {{post.comments}} comments</router-link>
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
</template>

<script>
export default {
  name: 'PostList',
  props: {
    sub: {
      type: String,
      required: true
    },
    sort: {
      type: String,
      required: true
    },
    page: {
      type: Number,
      required: true
    }
  },
  data: () => ({
    posts: [],
    env: process.env
  }),
  mounted () {
    this.loadStuff()
  },
  methods: {
    loadStuff () {
      this.$store.dispatch('postList/loadPosts', { sub: this.sub, sort: this.sort, page: this.page })
    },
    upvote (post) {
      if (post.archived) return this.$q.notify({ message: 'Post is archived', timeout: 1000 })
      this.$store.dispatch('postList/vote', { positive: 1, pid: post.pid, sub: post.sub })
        .catch(e => {
          if (!e.response && typeof e !== 'string') e = 'Network error'
          this.$q.notify(e)
        })
    },
    downvote (post) {
      if (post.archived) return this.$q.notify({ message: 'Post is archived', timeout: 1000 })
      this.$store.dispatch('postList/vote', { positive: 0, pid: post.pid, sub: post.sub })
        .catch(e => {
          this.$q.notify(e)
        })
    } // TODO: Scroll override to refresh post list
  },
  watch: {
    sort () {
      this.loadStuff()
    },
    sub () {
      this.loadStuff()
    },
    page () {
      this.loadStuff()
    }
  }
}
</script>
<style scoped lang="sass">
@import '../css/post.sass'
.post
  border-bottom: 1px solid rgba(0, 0, 0, 0.12)
  margin-bottom: 0.25em
  padding-top: 0.25em
  min-height: 50px
  margin-right: 5px

.post-thumbnail
  float: left
  padding-right: .7em

.nothumb
  background-color: rgba(0, 0, 0, 0.38)
  color: #efefef
  text-decoration: none
  width: 40px
  height: 40px
  border-radius: 50%
  display: inline-flex
  flex-shrink: 0
  align-items: center
  justify-content: center
  i
    font-size: 24px

.body--dark
  .post
    border-bottom: 1px solid #333
  .nothumb
    background-color: #181818
    color: #555
</style>
