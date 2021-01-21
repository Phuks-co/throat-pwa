<template>
  <q-page class="docs-input row justify-center">
    <div class="col-xl-4 col-lg-6 col-md-6 col-sm-12 col-xs-12 q-pa-sm">
      <div class="q-pb-sm">
        <div style="font-size: 2em">Blocked users</div>
        <span class="text-subtitle2">You can block users from your inbox</span>
      </div>
      <div v-if="loading" class="row justify-center full-height full-width text-center q-pt-lg">
        <q-spinner color="primary" size="3em"/>
      </div>
      <div v-else class="q-pt-sm q-pl-sm">
        <div v-if="ignores.length === 0">You haven't blocked anybody.</div>
        <q-list bordered separator style="max-width: 50%">
          <q-item v-for="ignore in ignores" :key="ignore.name">
            <q-item-section top>
              <q-item-label>{{ignore.name}}</q-item-label>
              <q-item-label><timeago :datetime="ignore.date" /> ago</q-item-label>
            </q-item-section>
            <q-item-section top side>
              <div class="text-grey-8 q-gutter-xs">
                <q-btn flat round color="red" icon="delete" :loading="ignore.loadingDelete" @click="unignoreUser(ignore)" />
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'Ignores',
  data: () => ({
    ignores: [],
    loading: false
  }),
  mounted () {
    this.loadStuff()
  },
  methods: {
    loadStuff () {
      // TODO: Move to store
      this.loading = true
      this.$axios.get(`${process.env.API_URI}notifications/ignore`)
        .then((res) => {
          res.data.ignores.forEach((i) => {
            i.loadingDelete = false
          })
          this.ignores = res.data.ignores
        })
        .catch((e) => {
          if (!e.response && typeof e !== 'string') e = 'Network error'
          this.$q.notify(e.response.data.msg || e)
        }).finally(() => {
          this.loading = false
        })
    },
    unignoreUser (ignore) {
      ignore.loadingDelete = true
      this.$axios.delete(`${process.env.API_URI}notifications/ignore`, { data: { user: ignore.name } })
        .then(() => {
          ignore.loadingDelete = false
          this.loadStuff()
        })
        .catch((e) => {
          if (!e.response && typeof e !== 'string') e = 'Network error'
          this.$q.notify(e.response.data.msg || e)
        })
        .finally(() => {
          ignore.loadingDelete = false
        })
    }
  }
}
</script>
<style lang="sass">
.msg-highlight
  border-left: 4px solid $primary
</style>
