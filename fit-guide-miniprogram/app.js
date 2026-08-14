const { initCloud } = require('./utils/api')

App({
  onLaunch() {
    initCloud()
  }
})
