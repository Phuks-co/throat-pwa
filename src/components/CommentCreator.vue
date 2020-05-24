<template>
  <div class="comment-create-container">
    <div class="comment-create q-ml-sm q-mr-sm q-pb-lg q-pt-sm">
      <q-input
        v-model="content"
        filled
        style="width: 100%"
        type="textarea"
        counter
        :maxlength="16384"
      />
      <q-btn color="primary" :loading="$store.state.postList.loadingCommentsCreator" :disabled="!content" @click="submit">Submit</q-btn>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    sub: {
      type: String,
      required: true
    },
    pid: {
      type: Number,
      required: true
    },
    parentcid: {
      type: String,
      default: null
    }
  },
  name: 'CommentCreator',
  data: () => ({
    content: ''
  }),
  methods: {
    submit () {
      this.$store.dispatch('postList/createComment', { sub: this.sub, pid: this.pid, parentcid: this.parentcid, content: this.content })
        .then((res) => {
          this.$emit('newcomment', res)
          this.content = ''
        }).catch((e) => {
          if (!e.response && typeof e !== 'string') e = 'Network error'
          this.$q.notify(e)
        })
    }
  }
}
</script>

<style lang="sass">
.comment-create-container
  min-height: 15em

.comment-create
  position: absolute
  left: 0
  background: white
  width: 95%

.body--dark
  .comment-create
    background: black
</style>
