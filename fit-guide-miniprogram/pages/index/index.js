const { getCatalog, getCategories, getEquipments } = require('../../utils/api')
const { filterExercises } = require('../../utils/exercises')
const { resolveMedia } = require('../../utils/media')
const { shareAppMessage, shareTimeline, handleTimelineShare } = require('../../utils/share')

Page({
  data: {
    categories: ['全部'],
    equipments: ['全部器械'],
    exercises: [],
    query: '',
    activeCategory: '全部',
    activeEquipment: '全部器械',
    disclaimer: '',
    mediaReady: false,
    mediaFailed: false
  },

  async onLoad(options) {
    if (handleTimelineShare(options, this)) return
    await this.loadCatalog()
  },

  async loadCatalog() {
    this.setData({ mediaReady: false, mediaFailed: false })

    try {
      const [catalog, categories, equipments] = await Promise.all([
        getCatalog(),
        getCategories(),
        getEquipments()
      ])
      const exerciseCards = catalog.exercises.map((exercise) => ({
        ...exercise,
        primaryMusclesText: exercise.primaryMuscles.join(' · ')
      }))
      this.mediaExerciseCards = await resolveMedia(exerciseCards)
      this.setData({
        categories: ['全部', ...categories],
        equipments: ['全部器械', ...equipments],
        disclaimer: catalog.disclaimer,
        mediaReady: true
      })
      this.applyFilters(this.data.query, this.data.activeCategory, this.data.activeEquipment)
    } catch (error) {
      console.error('动作库加载失败', error)
      this.setData({ mediaReady: true, mediaFailed: true })
    }
  },

  retryLoad() {
    this.loadCatalog()
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
  },

  onShareAppMessage: shareAppMessage,
  onShareTimeline: shareTimeline
})
