const { getCatalog, getTrainingPlans, deleteTrainingPlan } = require('../../utils/api')
const { hydratePlanExercises } = require('../../utils/exercises')

Page({
  data: {
    plans: [],
    loading: true,
    loadFailed: false,
    deletingPlanId: ''
  },

  onShow() {
    this.loadPlans()
  },

  async loadPlans() {
    this.setData({ plans: [], loading: true, loadFailed: false })
    try {
      const [plans, catalog] = await Promise.all([getTrainingPlans(), getCatalog()])
      this.setData({
        plans: plans.map((plan) => {
          const items = hydratePlanExercises(plan.exercises, catalog.exercises)
          return {
            ...plan,
            exerciseCount: items.length,
            exerciseNames: items.slice(0, 3)
              .map((item) => item.exercise ? item.exercise.name : `动作已失效（${item.exerciseId}）`)
              .join(' / ')
          }
        }),
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

  editPlan(event) {
    wx.navigateTo({ url: `/pages/plan/edit?id=${encodeURIComponent(event.currentTarget.dataset.id)}` })
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
  }
})
