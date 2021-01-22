// import something here
import io from 'socket.io-client'
// "async" is optional;
// more info on params: https://quasar.dev/quasar-cli/cli-documentation/boot-files#Anatomy-of-a-boot-file
export default ({ store }) => {
  const socket = io(`${process.env.SOCKET_URI}snt`, { transports: ['websocket'], upgrade: false })
  socket.on('connect', () => {
    socket.emit('token-login', { jwt: store.getters['auth/token'] })
  })

  socket.on('notification', (data) => {
    store.dispatch('notifications/setNotificationCount', data.count)
  })
}
