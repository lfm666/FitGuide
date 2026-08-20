const { getCatalog } = require('../../utils/api')
const { getFavoriteIds } = require('../../utils/favorites')
const { resolveMedia } = require('../../utils/media')
const { shareAppMessage, shareTimeline, handleTimelineShare } = require('../../utils/share')

Page({
  data: {
    exercises: [],
    mediaReady: false,
    mediaFailed: false
  },

  onLoad(options) {
    this.timelineShare = handleTimelineShare(options, this)
  },

  async onShow() {
    if (this.timelineShare) return
    this.setData({ exercises: [], mediaReady: false, mediaFailed: false })

    try {
      const favoriteIds = await getFavoriteIds()
      if (!favoriteIds.length) {
        this.setData({ mediaReady: true })
        return
      }
      const { exercises } = await getCatalog()
      const favoriteCards = exercises
        .filter(({ id }) => favoriteIds.includes(id))
        .map((exercise) => ({
          ...exercise,
          primaryMusclesText: exercise.primaryMuscles.join(' · ')
        }))
      this.setData({
        exercises: await resolveMedia(favoriteCards),
        mediaReady: true
      })
    } catch (error) {
      console.error('收藏加载失败', error)
      this.setData({ mediaReady: true, mediaFailed: true })
    }
  },

  retryLoad() {
    this.onShow()
  },

  openExercise(event) {
    wx.navigateTo({
      url: `/pages/exercise/detail?id=${encodeURIComponent(event.currentTarget.dataset.id)}`
    })
  },

  onImageError(event) {
    this.setData({ [`exercises[${event.currentTarget.dataset.index}].imageFailed`]: true })
  },

  onShareAppMessage: shareAppMessage,
  onShareTimeline: shareTimeline
})
