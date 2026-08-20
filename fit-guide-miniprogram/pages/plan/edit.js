const {
  getCatalog,
  getCategories,
  getEquipments,
  getTrainingPlans,
  createTrainingPlan,
  updateTrainingPlan
} = require('../../utils/api')
const { filterExercises, hydratePlanExercises } = require('../../utils/exercises')
const { shareAppMessage, shareTimeline, handleTimelineShare } = require('../../utils/share')

Page({
  data: {
    planId: '',
    name: '',
    items: [],
    categories: ['全部'],
    equipments: ['全部器械'],
    loading: true,
    loadFailed: false,
    notFound: false,
    saving: false,
    selecting: false,
    selectorQuery: '',
    selectorCategory: '全部',
    selectorEquipment: '全部器械',
    selectorExercises: []
  },

  onLoad(options) {
    if (handleTimelineShare(options, this)) return
    this.requestedPlanId = typeof options.id === 'string' ? options.id : ''
    this.loadEditor()
  },

  async loadEditor() {
    this.setData({ loading: true, loadFailed: false, notFound: false })
    try {
      const requests = [getCatalog(), getCategories(), getEquipments()]
      if (this.requestedPlanId) requests.push(getTrainingPlans())
      const [catalog, categories, equipments, plans] = await Promise.all(requests)
      this.catalogExercises = catalog.exercises
      const plan = this.requestedPlanId && plans.find(({ id }) => id === this.requestedPlanId)
      if (this.requestedPlanId && !plan) {
        this.setData({ loading: false, notFound: true })
        return
      }
      this.setData({
        planId: this.requestedPlanId,
        name: plan ? plan.name : '',
        items: this.hydrate(plan ? plan.exercises : []),
        categories: ['全部', ...categories],
        equipments: ['全部器械', ...equipments],
        loading: false
      })
    } catch (error) {
      console.error('训练计划编辑器加载失败', error)
      this.setData({ loading: false, loadFailed: true })
    }
  },

  hydrate(items) {
    return hydratePlanExercises(items, this.catalogExercises).map((item) => ({
      ...item,
      displayName: item.exercise ? item.exercise.name : `动作已失效（${item.exerciseId}）`,
      equipmentText: item.exercise ? item.exercise.equipment : `动作 ID：${item.exerciseId}`
    }))
  },

  onNameInput(event) {
    this.setData({ name: event.detail.value })
  },

  changeSetCount(event) {
    const index = Number(event.currentTarget.dataset.index)
    const delta = Number(event.currentTarget.dataset.delta)
    const setCount = Math.min(99, Math.max(1, Number(this.data.items[index].setCount) + delta))
    this.setData({ [`items[${index}].setCount`]: setCount })
  },

  onSetCountBlur(event) {
    const index = Number(event.currentTarget.dataset.index)
    const setCount = Number(event.detail.value)
    this.setData({ [`items[${index}].setCount`]: Number.isInteger(setCount) ? setCount : event.detail.value })
  },

  moveItem(event) {
    const index = Number(event.currentTarget.dataset.index)
    const target = index + Number(event.currentTarget.dataset.delta)
    if (target < 0 || target >= this.data.items.length) return
    const items = [...this.data.items]
    ;[items[index], items[target]] = [items[target], items[index]]
    this.setData({ items })
  },

  removeItem(event) {
    const index = Number(event.currentTarget.dataset.index)
    this.setData({ items: this.data.items.filter((_, itemIndex) => itemIndex !== index) })
  },

  openSelector() {
    this.pendingExerciseIds = new Set()
    this.pendingSelectionOrder = []
    this.setData({ selecting: true, selectorQuery: '', selectorCategory: '全部', selectorEquipment: '全部器械' })
    this.applySelector('', '全部', '全部器械')
  },

  cancelSelector() {
    this.pendingExerciseIds = new Set()
    this.pendingSelectionOrder = []
    this.setData({ selecting: false, selectorExercises: [] })
  },

  onSelectorSearch(event) {
    this.applySelector(event.detail.value, this.data.selectorCategory, this.data.selectorEquipment)
  },

  onSelectorCategory(event) {
    this.applySelector(this.data.selectorQuery, event.currentTarget.dataset.category, this.data.selectorEquipment)
  },

  onSelectorEquipment(event) {
    this.applySelector(this.data.selectorQuery, this.data.selectorCategory, event.currentTarget.dataset.equipment)
  },

  applySelector(query, category, equipment) {
    const existing = new Set(this.data.items.map(({ exerciseId }) => exerciseId))
    this.setData({
      selectorQuery: query,
      selectorCategory: category,
      selectorEquipment: equipment,
      selectorExercises: filterExercises(this.catalogExercises, query, category, equipment).map(({ id, name, equipment }) => ({
        id,
        name,
        equipment,
        added: existing.has(id),
        checked: this.pendingExerciseIds.has(id)
      }))
    })
  },

  toggleExercise(event) {
    const id = event.currentTarget.dataset.id
    if (event.currentTarget.dataset.added) return
    if (this.pendingExerciseIds.has(id)) {
      this.pendingExerciseIds.delete(id)
      this.pendingSelectionOrder = this.pendingSelectionOrder.filter((value) => value !== id)
    } else {
      if (this.data.items.length + this.pendingExerciseIds.size >= 50) {
        wx.showToast({ title: '每个计划最多 50 个动作', icon: 'none' })
        return
      }
      this.pendingExerciseIds.add(id)
      this.pendingSelectionOrder.push(id)
    }
    this.applySelector(this.data.selectorQuery, this.data.selectorCategory, this.data.selectorEquipment)
  },

  finishSelector() {
    const added = this.pendingSelectionOrder
      .filter((id) => this.pendingExerciseIds.has(id))
      .map((exerciseId) => ({ exerciseId, setCount: 3 }))
    this.setData({ items: this.hydrate([...this.data.items, ...added]), selecting: false, selectorExercises: [] })
    this.pendingExerciseIds = new Set()
    this.pendingSelectionOrder = []
  },

  async savePlan() {
    if (this.data.saving || this.data.notFound) return
    const name = this.data.name.trim()
    const exercises = this.data.items.map(({ exerciseId, setCount }) => ({ exerciseId, setCount: Number(setCount) }))
    if (!name || name.length > 50) {
      wx.showToast({ title: '计划名称需要 1 到 50 个字符', icon: 'none' })
      return
    }
    if (!exercises.length) {
      wx.showToast({ title: '请至少添加一个动作', icon: 'none' })
      return
    }
    if (exercises.some(({ setCount }) => !Number.isInteger(setCount) || setCount < 1 || setCount > 99)) {
      wx.showToast({ title: '组数需要是 1 到 99 的整数', icon: 'none' })
      return
    }

    this.setData({ saving: true })
    try {
      const payload = { name, exercises }
      if (this.data.planId) await updateTrainingPlan(this.data.planId, payload)
      else await createTrainingPlan(payload)
      if (getCurrentPages().length > 1) wx.navigateBack()
      else wx.switchTab({ url: '/pages/plans/plans' })
    } catch (error) {
      console.error('训练计划保存失败', error)
      const explicitError = error.code && error.code !== 'REQUEST_FAILED'
      const title = this.data.planId || explicitError
        ? (error.message || '保存失败，请重试')
        : '保存结果未知，请返回计划列表刷新确认'
      wx.showModal({ title: '未能确认保存', content: title, showCancel: false })
    } finally {
      this.setData({ saving: false })
    }
  },

  backToPlans() {
    wx.switchTab({ url: '/pages/plans/plans' })
  },

  onShareAppMessage: shareAppMessage,
  onShareTimeline: shareTimeline
})
