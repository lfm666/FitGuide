const { getCatalog, getTrainingPlans, deleteTrainingPlan } = require('../../utils/api')
const { hydratePlanExercises } = require('../../utils/exercises')
const { resolveMedia } = require('../../utils/media')
const { shareAppMessage, shareTimeline, handleTimelineShare } = require('../../utils/share')

Page({
  data: {
    plans: [],
    loading: true,
    loadFailed: false,
    deletingPlanId: ''
  },

  onLoad(options) {
    this.timelineShare = handleTimelineShare(options, this)
  },

  onShow() {
    if (this.timelineShare) return
    this.loadPlans()
  },

  async loadPlans() {
    this.setData({ plans: [], loading: true, loadFailed: false })
    try {
      const [plans, catalog] = await Promise.all([getTrainingPlans(), getCatalog()])
      const hydratedPlans = plans.map((plan) => ({
        plan,
        items: hydratePlanExercises(plan.exercises, catalog.exercises)
      }))
      const resolvedPreviews = await resolveMedia(hydratedPlans.flatMap(({ items }) => (
        items.slice(0, 2).filter(({ exercise }) => exercise).map(({ exercise }) => exercise)
      )))
      let mediaIndex = 0

      this.setData({
        plans: hydratedPlans.map(({ plan, items }) => ({
          id: plan.id,
          name: plan.name,
          exerciseCount: items.length,
          totalSetCount: items.reduce((total, { setCount }) => total + setCount, 0),
          hiddenExerciseCount: Math.max(0, items.length - 2),
          previewItems: items.slice(0, 2).map((item) => {
            const exercise = item.exercise ? resolvedPreviews[mediaIndex++] : null
            return {
              exerciseId: item.exerciseId,
              setCount: item.setCount,
              name: exercise ? exercise.name : `动作已失效（${item.exerciseId}）`,
              image: exercise ? exercise.image : ''
            }
          })
        })),
        loading: false
      })
    } catch (error) {
      console.error('训练计划加载失败', error)
      this.setData({ loading: false, loadFailed: true })
    }
  },

  createPlan() {
    wx.navigateTo({ url: '/pages/plan/edit' })
  },

  openPlan(event) {
    wx.navigateTo({ url: `/pages/plan/detail?id=${encodeURIComponent(event.currentTarget.dataset.id)}` })
  },

  editPlan(event) {
    wx.navigateTo({ url: `/pages/plan/edit?id=${encodeURIComponent(event.currentTarget.dataset.id)}` })
  },

  onImageError(event) {
    const { planIndex, previewIndex } = event.currentTarget.dataset
    this.setData({ [`plans[${planIndex}].previewItems[${previewIndex}].imageFailed`]: true })
  },

  deletePlan(event) {
    const id = event.currentTarget.dataset.id
    if (this.data.deletingPlanId) return
    wx.showModal({
      title: '删除训练计划',
      content: '删除后无法恢复，确定继续吗？',
      confirmColor: '#d64545',
      success: async ({ confirm }) => {
        if (!confirm) return
        this.setData({ deletingPlanId: id })
        try {
          await deleteTrainingPlan(id)
          await this.loadPlans()
        } catch (error) {
          console.error('训练计划删除失败', error)
          wx.showToast({ title: error.message || '删除失败', icon: 'none' })
        } finally {
          this.setData({ deletingPlanId: '' })
        }
      }
    })
  },

  onShareAppMessage: shareAppMessage,
  onShareTimeline: shareTimeline
})
