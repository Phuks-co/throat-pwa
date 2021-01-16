<template>
  <q-item
    clickable
    tag="a"
    :to="link"
    @click="click"
  >
    <q-item-section
      v-if="icon"
      avatar
    >
      <div class="relative-position">
        <q-icon :name="icon" size="25px">
        </q-icon>
        <q-badge color="red" v-if="badge" floating>{{ badge }}</q-badge>
      </div>
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
      <q-item-label caption>
        {{ caption }}
      </q-item-label>
    </q-item-section>
  </q-item>
</template>

<script>
export default {
  name: 'DrawerItem',
  props: {
    title: {
      type: String,
      required: true
    },

    caption: {
      type: String,
      default: ''
    },

    link: {
      type: String,
      default: '#'
    },

    icon: {
      type: String,
      default: ''
    },
    badge: {
      type: Number
    }
  },
  methods: {
    click () {
      this.$emit('click')
    }
  }
}
</script>
