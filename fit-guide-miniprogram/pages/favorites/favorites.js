const { exercises } = require('../../data/exercises')
const { getFavoriteIds } = require('../../utils/favorites')
const { resolveMedia } = require('../../utils/media')
const exerciseCards = exercises.map((exercise) => ({
  ...exercise,
  primaryMusclesText: exercise.primaryMuscles.join(' · ')
}))

Page({
  data: {
    exercises: [],
    mediaReady: false,
    mediaFailed: false
  },

  async onShow() {
    const favoriteIds = getFavoriteIds()
    const favoriteCards = exerciseCards.filter(({ id }) => favoriteIds.includes(id))
    this.setData({ exercises: [], mediaReady: false, mediaFailed: false })

    try {
      this.setData({
        exercises: await resolveMedia(favoriteCards),
        mediaReady: true
      })
    } catch (error) {
      console.error('收藏动作图片加载失败', error)
      this.setData({ mediaReady: true, mediaFailed: true })
    }
  },

  openExercise(event) {
    wx.navigateTo({
      url: `/pages/exercise/detail?id=${encodeURIComponent(event.currentTarget.dataset.id)}`
    })
  },

  onImageError(event) {
    this.setData({ [`exercises[${event.currentTarget.dataset.index}].imageFailed`]: true })
  }
})
