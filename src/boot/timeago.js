import { boot } from 'quasar/wrappers'
import VueTimeago from 'vue-timeago'
import distanceInWordsStrict from 'date-fns/distance_in_words_strict'

export default boot(({ Vue }) => {
  Vue.use(VueTimeago, {
    name: 'timeago',
    locale: 'en',
    converter (date, locale, { includeSeconds, addSuffix = false }) {
      let xm = distanceInWordsStrict(Date.now(), date, { locale, addSuffix, includeSeconds })
      // XXX: dirty hack so we don't have to add an extra locale -_-
      xm = xm.replace(' hour', 'h').replace('hours', 'h').replace(' minutes', 'm').replace(' minute', 'min')
      return xm
    }
  })
})
