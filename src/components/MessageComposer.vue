<template>
  <q-card style="min-width: 50vw;">
    <q-card-section>
      <div class="text-h6">Composing message</div>
    </q-card-section>
    <q-card-section>
      <q-input v-model="recipient" label="Recipient" :disable="!!this.to" />
      <q-input v-model="subject" label="Subject" />

      <q-input
        v-model="content"
        filled
        style="width: 100%"
        rows="10"
        type="textarea"
        counter
        :maxlength="16384"
      />
    </q-card-section>

    <q-card-actions>
      <q-btn v-close-popup flat>Cancel</q-btn>
      <q-space/>
      <q-btn color="primary" @click="sendMessage" :loading="loading">Send</q-btn>
    </q-card-actions>
  </q-card>
</template>

<script>
export default {
  name: 'MessageComposer',
  props: {
    to: {
      type: String
    },
    subject: {
      type: String
    }
  },
  data: () => ({
    recipient: '',
    content: '',
    loading: false
  }),
  mounted () {
    this.recipient = this.to
  },
  methods: {
    sendMessage () {
      this.loading = true
      this.$axios.post(`${process.env.API_URI}messages`, { to: this.recipient, subject: this.subject, content: this.content})
        .then(() => {
          this.$emit('sent')
        }).finally(() => { this.loading = false })
    }
  }
}
</script>

<style scoped>

</style>
