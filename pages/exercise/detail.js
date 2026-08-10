const { exercises, disclaimer } = require('../../data/exercises')
const { findExerciseById } = require('../../utils/exercises')
const { getFavoriteIds, toggleFavorite: toggleStoredFavorite } = require('../../utils/favorites')

Page({
  data: {
    exercise: null,
    disclaimer,
    gifSrc: '',
    gifLoaded: false,
    gifFailed: false,
    isFavorite: false,
    notFound: false
  },

  onLoad(options) {
    const exercise = findExerciseById(exercises, options.id)
    if (!exercise) {
      this.setData({ notFound: true })
      return
    }

    this.setData({
      exercise,
      gifSrc: exercise.gif,
      isFavorite: getFavoriteIds().includes(exercise.id)
    })
    wx.setNavigationBarTitle({ title: exercise.name })
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

  retryGif() {
    const { gif } = this.data.exercise
    const separator = gif.includes('?') ? '&' : '?'
    this.setData({
      gifSrc: `${gif}${separator}retry=${Date.now()}`,
      gifLoaded: false,
      gifFailed: false
    })
  },

  goHome() {
    wx.reLaunch({ url: '/pages/index/index' })
  }
})
