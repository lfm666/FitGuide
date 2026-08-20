const { initCloud } = require('./utils/api')

App({
  globalData: { scene: 0 },

  onLaunch(options) {
    this.globalData.scene = options.scene
    initCloud()
  },

  onShow(options) {
    this.globalData.scene = options.scene
  }
})
