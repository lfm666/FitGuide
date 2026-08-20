const assert = require('node:assert/strict')
const { shareAppMessage, shareTimeline, handleTimelineShare } = require('../utils/share')

let redirectedTo = ''
global.wx = { reLaunch: ({ url }) => { redirectedTo = url } }
let launchScene = 1154
global.getApp = () => ({ globalData: { scene: launchScene } })

assert.deepEqual(shareAppMessage(), {
  title: 'FitGuide｜健身动作指北',
  path: '/pages/index/index'
})
assert.deepEqual(shareTimeline(), {
  title: 'FitGuide｜健身动作指北',
  query: 'shareTarget=home'
})
const pageContext = { data: {}, setData(value) { Object.assign(this.data, value) } }
assert.equal(handleTimelineShare({}, pageContext), false)
assert.equal(handleTimelineShare({ shareTarget: 'home' }, pageContext), true)
assert.equal(pageContext.data.timelineShare, true)
launchScene = 1155
assert.equal(handleTimelineShare({ shareTarget: 'home' }, pageContext), true)
assert.equal(redirectedTo, '/pages/index/index')

let page
global.Page = (definition) => { page = definition }
for (const path of [
  '../pages/index/index',
  '../pages/favorites/favorites',
  '../pages/plans/plans',
  '../pages/plan/detail',
  '../pages/plan/edit',
  '../pages/exercise/detail'
]) {
  require(path)
  assert.equal(page.onShareAppMessage, shareAppMessage)
  assert.equal(page.onShareTimeline, shareTimeline)
}

console.log('全页面好友与朋友圈分享检查通过')
