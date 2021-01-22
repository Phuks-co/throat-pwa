const firebaseConfig = {
  // Config here!
}

// eslint-disable-next-line no-undef
firebase.initializeApp(firebaseConfig)

// eslint-disable-next-line no-undef
const messaging = firebase.messaging()

messaging.setBackgroundMessageHandler(function (payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload)
  // Customize notification here
  const notificationData = payload.data
  if (notificationData.type !== 'notification') return
  const notificationTitle = notificationData.title
  const notificationOptions = JSON.parse(notificationData.notificationPayload)

  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  if (navigator.setAppBadge) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    navigator.setAppBadge(notificationData.notificationCount.messages + notificationData.notificationCount.notifications)
  }
  return self.registration.showNotification(notificationTitle, notificationOptions)
})
