const { exercises, disclaimer } = require('../../data/exercises')
const { categoryOrder, filterExercises } = require('../../utils/exercises')
const { getFavoriteIds } = require('../../utils/favorites')
const exerciseCards = exercises.map((exercise) => ({
  ...exercise,
  primaryMusclesText: exercise.primaryMuscles.join(' · ')
}))
const categories = [categoryOrder[0], '收藏', ...categoryOrder.slice(1)]

Page({
  data: {
    categories,
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

  onShow() {
    this.applyFilters(this.data.query, this.data.activeCategory)
  },

  applyFilters(query, category) {
    const filtered = filterExercises(exerciseCards, query, category === '收藏' ? '全部' : category)
    const favoriteIds = category === '收藏' ? getFavoriteIds() : []

    this.setData({
      query,
      activeCategory: category,
      exercises: category === '收藏'
        ? filtered.filter(({ id }) => favoriteIds.includes(id))
        : filtered
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
