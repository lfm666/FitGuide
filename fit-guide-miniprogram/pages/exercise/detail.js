const { getExercise } = require('../../utils/api')
const { getFavoriteIds, toggleFavorite: toggleStoredFavorite } = require('../../utils/favorites')
const { resolveMedia } = require('../../utils/media')

Page({
  data: {
    exercise: null,
    disclaimer: '',
    gifSrc: '',
    gifLoaded: false,
    gifFailed: false,
    isFavorite: false,
    favoritePending: false,
    notFound: false,
    loading: true,
    loadFailed: false
  },

  async onLoad(options) {
    this.exerciseId = options.id
    await this.loadExercise()
  },

  async loadExercise() {
    this.setData({
      exercise: null,
      gifSrc: '',
      gifLoaded: false,
      gifFailed: false,
      favoritePending: false,
      notFound: false,
      loading: true,
      loadFailed: false
    })

    try {
      const [{ disclaimer, exercise }, favoriteIds] = await Promise.all([
        getExercise(this.exerciseId),
        getFavoriteIds()
      ])
      this.sourceExercise = exercise
      this.setData({ isFavorite: favoriteIds.includes(exercise.id) })
      wx.setNavigationBarTitle({ title: exercise.name })

      const [resolvedExercise] = await resolveMedia([exercise], ['image', 'gif'])
      this.setData({
        exercise: resolvedExercise,
        disclaimer,
        gifSrc: resolvedExercise.gif,
        loading: false
      })
    } catch (error) {
      if (error.code === 'EXERCISE_NOT_FOUND' || error.code === 'INVALID_EXERCISE_ID') {
        this.setData({ notFound: true, loading: false })
        return
      }
      console.error('动作详情加载失败', error)
      this.setData({ loadFailed: true, loading: false })
    }
  },

  retryLoad() {
    this.loadExercise()
  },

  async toggleFavorite() {
    if (this.data.favoritePending || !this.data.exercise) return
    this.setData({ favoritePending: true })
    try {
      const isFavorite = await toggleStoredFavorite(
        this.data.exercise.id,
        this.data.isFavorite
      )
      this.setData({ isFavorite })
      wx.showToast({ title: isFavorite ? '已收藏' : '已取消收藏', icon: 'none' })
    } catch (error) {
      wx.showToast({ title: '收藏失败，请重试', icon: 'none' })
    } finally {
      this.setData({ favoritePending: false })
    }
  },

  onGifLoad() {
    this.setData({ gifLoaded: true, gifFailed: false })
  },

  onGifError() {
    this.setData({ gifLoaded: false, gifFailed: true })
  },

  async retryGif() {
    try {
      const [resolvedExercise] = await resolveMedia([this.sourceExercise], ['gif'])
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
