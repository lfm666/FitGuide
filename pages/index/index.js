const { exercises, disclaimer } = require('../../data/exercises')
const { categoryOrder, filterExercises } = require('../../utils/exercises')
const exerciseCards = exercises.map((exercise) => ({
  ...exercise,
  primaryMusclesText: exercise.primaryMuscles.join(' · ')
}))
const equipments = ['全部器械', ...new Set(exercises.map(({ equipment }) => equipment))]

Page({
  data: {
    categories: categoryOrder,
    equipments,
    exercises: exerciseCards,
    query: '',
    activeCategory: '全部',
    activeEquipment: '全部器械',
    disclaimer
  },

  onSearchInput(event) {
    this.applyFilters(event.detail.value, this.data.activeCategory, this.data.activeEquipment)
  },

  onCategoryTap(event) {
    this.applyFilters(this.data.query, event.currentTarget.dataset.category, this.data.activeEquipment)
  },

  onEquipmentTap(event) {
    this.applyFilters(this.data.query, this.data.activeCategory, event.currentTarget.dataset.equipment)
  },

  onShow() {
    this.applyFilters(this.data.query, this.data.activeCategory, this.data.activeEquipment)
  },

  applyFilters(query, category, equipment = '全部器械') {
    this.setData({
      query,
      activeCategory: category,
      activeEquipment: equipment,
      exercises: filterExercises(exerciseCards, query, category, equipment)
    })
  },

  clearFilters() {
    this.applyFilters('', '全部', '全部器械')
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
