const { exercises, disclaimer } = require('../../data/exercises')
const { findExerciseById } = require('../../utils/exercises')
const { getFavoriteIds, toggleFavorite: toggleStoredFavorite } = require('../../utils/favorites')
const { resolveMedia } = require('../../utils/media')

Page({
  data: {
    exercise: null,
    disclaimer,
    gifSrc: '',
    gifLoaded: false,
    gifFailed: false,
    mediaFailed: false,
    isFavorite: false,
    notFound: false
  },

  async onLoad(options) {
    const exercise = findExerciseById(exercises, options.id)
    if (!exercise) {
      this.setData({ notFound: true })
      return
    }

    this.setData({ isFavorite: getFavoriteIds().includes(exercise.id) })
    wx.setNavigationBarTitle({ title: exercise.name })

    try {
      const [resolvedExercise] = await resolveMedia([exercise], ['image', 'gif'])
      this.setData({
        exercise: resolvedExercise,
        gifSrc: resolvedExercise.gif
      })
    } catch (error) {
      console.error('动作媒体加载失败', error)
      this.setData({ mediaFailed: true })
    }
  },

  toggleFavorite() {
    try {
      const isFavorite = toggleStoredFavorite(this.data.exercise.id)
      this.setData({ isFavorite })
      wx.showToast({ title: isFavorite ? '已收藏' : '已取消收藏', icon: 'none' })
    } catch (error) {
      wx.showToast({ title: '收藏失败，请重试', icon: 'none' })
    }
  },

  onGifLoad() {
    this.setData({ gifLoaded: true, gifFailed: false })
  },

  onGifError() {
    this.setData({ gifLoaded: false, gifFailed: true })
  },

  async retryGif() {
    const source = findExerciseById(exercises, this.data.exercise.id)
    try {
      const [resolvedExercise] = await resolveMedia([source], ['gif'])
      this.setData({
        gifSrc: `${resolvedExercise.gif}${resolvedExercise.gif.includes('?') ? '&' : '?'}retry=${Date.now()}`,
        gifLoaded: false,
        gifFailed: false
      })
    } catch (error) {
      console.error('动作 GIF 重试失败', error)
      this.setData({ gifLoaded: false, gifFailed: true })
    }
  },

  goHome() {
    wx.reLaunch({ url: '/pages/index/index' })
  }
})
