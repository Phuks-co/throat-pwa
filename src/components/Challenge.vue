<template>
  <div style="width: 270px">
    <div style="height: 70px">
      <img v-if="!$store.state.captcha.loading" class="challenge_image" alt="Captcha" :src="'data:image/png;base64,' + $store.state.captcha.image" />
    </div>
    <q-input
      v-model="challengeResponse"
      v-on:input="$emit('input', challengeResponse)"
      style="width: 95%"
      :rules="[ val => val && val.length > 0 || 'Please type something']"
      label="Type the text in the image">
      <template v-slot:after>
        <q-btn round dense flat icon="refresh" :loading="$store.state.captcha.loading" @click="$store.dispatch('captcha/getCaptcha')" />
      </template>
    </q-input>
  </div>
</template>

<script>
export default {
  name: 'Challenge',
  props: ['value'],
  data () {
    const challengeResponse = ''
    return { challengeResponse }
  },
  mounted () {
    this.$store.dispatch('captcha/getCaptcha')
  }
}
</script>

<style scoped>

</style>
