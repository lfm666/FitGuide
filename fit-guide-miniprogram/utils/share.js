const title = 'FitGuide｜健身动作指北'
const home = '/pages/index/index'

function shareAppMessage() {
  return { title, path: home }
}

function shareTimeline() {
  return { title, query: 'shareTarget=home' }
}

function handleTimelineShare(options, page) {
  if (!options || options.shareTarget !== 'home') return false
  if (getApp().globalData.scene === 1154) page.setData({ timelineShare: true })
  else wx.reLaunch({ url: home })
  return true
}

module.exports = { shareAppMessage, shareTimeline, handleTimelineShare }
