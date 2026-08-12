const { exercises, disclaimer } = require('../../data/exercises')
const { categoryOrder, filterExercises } = require('../../utils/exercises')
const { resolveMedia } = require('../../utils/media')
const exerciseCards = exercises.map((exercise) => ({
  ...exercise,
  primaryMusclesText: exercise.primaryMuscles.join(' · ')
}))
const equipments = ['全部器械', ...new Set(exercises.map(({ equipment }) => equipment))]

Page({
  data: {
    categories: categoryOrder,
    equipments,
    exercises: [],
    query: '',
    activeCategory: '全部',
    activeEquipment: '全部器械',
    disclaimer,
    mediaReady: false,
    mediaFailed: false
  },

  async onLoad() {
    try {
      this.mediaExerciseCards = await resolveMedia(exerciseCards)
      this.setData({ mediaReady: true })
      this.applyFilters(this.data.query, this.data.activeCategory, this.data.activeEquipment)
    } catch (error) {
      console.error('动作图片加载失败', error)
      this.setData({ mediaReady: true, mediaFailed: true })
    }
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
    if (this.mediaExerciseCards) {
      this.applyFilters(this.data.query, this.data.activeCategory, this.data.activeEquipment)
    }
  },

  applyFilters(query, category, equipment = '全部器械') {
    this.setData({
      query,
      activeCategory: category,
      activeEquipment: equipment,
      exercises: filterExercises(this.mediaExerciseCards || [], query, category, equipment)
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
