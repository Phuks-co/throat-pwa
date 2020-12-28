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
  const notificationTitle = 'Background Message Title'
  const notificationOptions = {
    body: 'Background Message body.',
    icon: '/firebase-logo.png'
  }

  return self.registration.showNotification(notificationTitle,
    notificationOptions)
})
