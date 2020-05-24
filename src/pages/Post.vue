<template>
  <div v-if="$store.state.postList.loading " class="row justify-center full-height full-width text-center q-pt-lg">
    <q-spinner color="primary" size="3em"/>
  </div>
  <div v-else-if="error" class="row justify-center full-height full-width text-center q-pt-lg">
    Error: {{error}}
  </div>
  <div v-else-if="!$store.state.postList.post" class="row justify-center full-height full-width text-center q-pt-lg">
    Post not found
  </div>
  <Post v-else :post="$store.state.postList.post" :cid="cid" />
</template>

<script lang="ts">
import Vue from 'vue'
import Post from 'components/Post.vue'

export default Vue.extend({
  props: {
    sub: {
      type: String,
      required: true
    },
    pid: {
      required: true
    },
    cid: {
      type: String
    }
  },
  components: { Post },
  data: () => ({
    error: null
  }),
  mounted () {
    this.$store.dispatch('postList/loadPost', { sub: this.sub, pid: this.pid as number })
      .catch((e) => {
        this.error = e
      })
  },
  methods: {
  }
})
</script>
