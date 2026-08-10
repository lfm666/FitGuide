const { exercises, disclaimer } = require('../../data/exercises')
const { findExerciseById } = require('../../utils/exercises')

Page({
  data: {
    exercise: null,
    disclaimer,
    gifSrc: '',
    gifLoaded: false,
    gifFailed: false,
    notFound: false
  },

  onLoad(options) {
    const exercise = findExerciseById(exercises, options.id)
    if (!exercise) {
      this.setData({ notFound: true })
      return
    }

    this.setData({ exercise, gifSrc: exercise.gif })
    wx.setNavigationBarTitle({ title: exercise.name })
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
