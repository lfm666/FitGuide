const { getCatalog, getTrainingPlans } = require('../../utils/api')
const { hydratePlanExercises } = require('../../utils/exercises')
const { resolveMedia } = require('../../utils/media')
const { shareAppMessage, shareTimeline, handleTimelineShare } = require('../../utils/share')

Page({
  data: {
    plan: null,
    loading: true,
    loadFailed: false,
    notFound: false
  },

  onLoad(options) {
    if (handleTimelineShare(options, this)) return
    this.planId = typeof options.id === 'string' ? options.id : ''
    wx.setNavigationBarTitle({ title: '计划详情' })
    return this.loadPlan()
  },

  onShow() {
    if (!this.shouldReload) return
    this.shouldReload = false
    this.loadPlan()
  },

  async loadPlan() {
    if (!this.planId) {
      this.setData({ plan: null, loading: false, loadFailed: false, notFound: true })
      return
    }

    this.setData({ plan: null, loading: true, loadFailed: false, notFound: false })
    try {
      const [plans, catalog] = await Promise.all([getTrainingPlans(), getCatalog()])
      const plan = plans.find(({ id }) => id === this.planId)
      if (!plan) {
        this.setData({ loading: false, notFound: true })
        return
      }

      const hydrated = hydratePlanExercises(plan.exercises, catalog.exercises)
      const resolvedExercises = await resolveMedia(
        hydrated.filter(({ exercise }) => exercise).map(({ exercise }) => exercise)
      )
      let mediaIndex = 0
      const items = hydrated.map((item) => {
        const exercise = item.exercise ? resolvedExercises[mediaIndex++] : null
        return {
          exerciseId: item.exerciseId,
          setCount: item.setCount,
          name: exercise ? exercise.name : `动作已失效（${item.exerciseId}）`,
          metaText: exercise ? `${exercise.category} · ${exercise.equipment}` : `动作 ID：${item.exerciseId}`,
          muscleText: exercise ? exercise.primaryMuscles.join(' · ') : '',
          image: exercise ? exercise.image : '',
          missing: !exercise
        }
      })

      this.setData({
        plan: {
          id: plan.id,
          name: plan.name,
          items,
          exerciseCount: items.length,
          totalSetCount: items.reduce((total, { setCount }) => total + setCount, 0)
        },
        loading: false
      })
    } catch (error) {
      console.error('训练计划详情加载失败', error)
      this.setData({ loading: false, loadFailed: true })
    }
  },

  editPlan() {
    this.shouldReload = true
    wx.navigateTo({ url: `/pages/plan/edit?id=${encodeURIComponent(this.planId)}` })
  },

  openExercise(event) {
    if (event.currentTarget.dataset.missing) return
    wx.navigateTo({ url: `/pages/exercise/detail?id=${encodeURIComponent(event.currentTarget.dataset.id)}` })
  },

  onImageError(event) {
    this.setData({ [`plan.items[${event.currentTarget.dataset.index}].imageFailed`]: true })
  },

  backToPlans() {
    if (getCurrentPages().length > 1) wx.navigateBack()
    else wx.switchTab({ url: '/pages/plans/plans' })
  },

  onShareAppMessage: shareAppMessage,
  onShareTimeline: shareTimeline
})
