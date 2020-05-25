<template>
  <div class="postList">
    <q-tabs dense v-if="sub == 'home' || sub == 'all'" v-model="cSub" @input="changeSub">
      <q-tab name="home" :to="'/home/' + sort">Home</q-tab>
      <q-tab name="all" :to="'/all/' + sort">All</q-tab>
    </q-tabs>
    <div class="sort-select q-pt-sm q-pl-sm">
      <q-btn-dropdown dense flat :ripple="false" :label="sort">
        <q-list>
          <q-item v-for="sortname in sorts" :key="sortname" :active="sortname.toLowerCase() == sort" clickable v-close-popup @click="changeSort(sortname)">
            <q-item-section>
              <q-item-label>{{sortname}}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>
    </div>
    <PostList :sort="sort" :sub="sub" :page="page"/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

import PostList from 'components/PostList.vue'

export default Vue.extend({
  props: {
    sub: {
      type: String,
      required: true
    },
    sort: {
      type: String,
      default: 'default'
    },
    page: {
      type: Number,
      default: 1
    }
  },
  name: 'PageIndex',
  components: { PostList },
  data: () => ({
    sorts: ['Hot', 'Top', 'New'],
    cSub: ''
  }),
  created () {
    this.cSub = this.sub
  },
  watch: {
    sub (val) {
      this.cSub = val
    }
  },
  methods: {
    changeSub () {
      this.$route.params.sub = this.cSub
      if (!this.$route.params.sort) this.$route.params.sort = 'hot'
      this.$router.push({ name: 'view_sub', params: this.$route.params })
    },
    changeSort (sort: string) {
      if (this.sort === sort.toLowerCase()) return
      if (this.sub === 'home') {
        this.$router.push({ name: 'view_home', params: { sort: sort.toLowerCase() } })
      } else if (this.sub === 'all') {
        this.$router.push({ name: 'view_all', params: { sort: sort.toLowerCase() } })
      } else {
        this.$router.push({ name: 'view_sub', params: { sub: this.sub, sort: sort.toLowerCase() } })
      }
    }
  }
})
</script>
