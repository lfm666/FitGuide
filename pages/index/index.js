const { exercises, disclaimer } = require('../../data/exercises')
const { categoryOrder, filterExercises } = require('../../utils/exercises')
const exerciseCards = exercises.map((exercise) => ({
  ...exercise,
  primaryMusclesText: exercise.primaryMuscles.join(' · ')
}))

Page({
  data: {
    categories: categoryOrder,
    exercises: exerciseCards,
    query: '',
    activeCategory: '全部',
    disclaimer
  },

  onSearchInput(event) {
    this.applyFilters(event.detail.value, this.data.activeCategory)
  },

  onCategoryTap(event) {
    this.applyFilters(this.data.query, event.currentTarget.dataset.category)
  },

  applyFilters(query, category) {
    this.setData({
      query,
      activeCategory: category,
      exercises: filterExercises(exerciseCards, query, category)
    })
  },

  clearFilters() {
    this.applyFilters('', '全部')
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
