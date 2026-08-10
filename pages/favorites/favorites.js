const { exercises } = require('../../data/exercises')
const { getFavoriteIds } = require('../../utils/favorites')
const exerciseCards = exercises.map((exercise) => ({
  ...exercise,
  primaryMusclesText: exercise.primaryMuscles.join(' · ')
}))

Page({
  data: {
    exercises: []
  },

  onShow() {
    const favoriteIds = getFavoriteIds()
    this.setData({ exercises: exerciseCards.filter(({ id }) => favoriteIds.includes(id)) })
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
