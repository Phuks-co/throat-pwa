<template>
  <div class="postList">
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
    sorts: ['Hot', 'Top', 'New']
  }),
  methods: {
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
