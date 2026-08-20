const assert = require('node:assert/strict')
const path = require('node:path')
const catalog = require('../data/exercises')
const { hydratePlanExercises } = require('../utils/exercises')

const first = catalog.exercises[0]
const second = catalog.exercises[1]
const third = catalog.exercises[2]
const hydrated = hydratePlanExercises([
  { exerciseId: first.id, setCount: 3 },
  { exerciseId: 'missing-id', setCount: 4 }
], catalog.exercises)
assert.equal(hydrated[0].exercise, first)
assert.equal(hydrated[1].missing, true)
assert.equal(hydrated[1].exerciseId, 'missing-id')

let createCalls = 0
let createMode = 'pending'
let resolveCreate
let trainingPlans = []
const apiPath = require.resolve('../utils/api')
require.cache[apiPath] = {
  id: apiPath,
  filename: apiPath,
  loaded: true,
  exports: {
    getCatalog: async () => catalog,
    getCategories: async () => [first.category, second.category],
    getEquipments: async () => [first.equipment, second.equipment],
    getTrainingPlans: async () => trainingPlans,
    createTrainingPlan: async () => {
      createCalls++
      if (createMode === 'fail') throw new Error('network down')
      return new Promise((resolve) => { resolveCreate = resolve })
    },
    updateTrainingPlan: async () => ({}),
    deleteTrainingPlan: async () => ({})
  }
}

let definition
const modals = []
const navigations = []
global.Page = (value) => { definition = value }
global.getCurrentPages = () => [{}, {}]
global.wx = {
  cloud: {
    getTempFileURL: async ({ fileList }) => ({
      fileList: fileList.map((fileID) => ({ tempFileURL: fileID }))
    })
  },
  showToast() {},
  showModal(options) { modals.push(options) },
  setNavigationBarTitle() {},
  navigateTo(options) { navigations.push(options.url) },
  navigateBack() {},
  switchTab() {}
}
require(path.resolve(__dirname, '../pages/plan/edit.js'))

function page() {
  const instance = { ...definition, data: JSON.parse(JSON.stringify(definition.data)) }
  instance.setData = (patch) => {
    for (const [key, value] of Object.entries(patch)) {
      const match = key.match(/^items\[(\d+)]\.(\w+)$/)
      if (match) instance.data.items[Number(match[1])][match[2]] = value
      else instance.data[key] = value
    }
  }
  return instance
}

async function main() {
  const editor = page()
  await editor.loadEditor()
  editor.openSelector()
  editor.toggleExercise({ currentTarget: { dataset: { id: first.id, added: false } } })
  editor.toggleExercise({ currentTarget: { dataset: { id: second.id, added: false } } })
  editor.finishSelector()
  assert.deepEqual(editor.data.items.map(({ exerciseId, setCount }) => [exerciseId, setCount]), [
    [first.id, 3],
    [second.id, 3]
  ])

  editor.openSelector()
  editor.toggleExercise({ currentTarget: { dataset: { id: first.id, added: true } } })
  editor.finishSelector()
  assert.equal(editor.data.items.length, 2)

  editor.moveItem({ currentTarget: { dataset: { index: 1, delta: -1 } } })
  assert.deepEqual(editor.data.items.map(({ exerciseId }) => exerciseId), [second.id, first.id])

  editor.setData({ name: '计划' })
  const firstSave = editor.savePlan()
  const duplicateSave = editor.savePlan()
  assert.equal(createCalls, 1)
  resolveCreate({})
  await Promise.all([firstSave, duplicateSave])

  createMode = 'fail'
  const beforeFailure = editor.data.items.map(({ exerciseId }) => exerciseId)
  await editor.savePlan()
  assert.deepEqual(editor.data.items.map(({ exerciseId }) => exerciseId), beforeFailure)
  assert.equal(createCalls, 2)
  assert.match(modals.at(-1).content, /返回计划列表刷新确认/)

  trainingPlans = [{
    id: 'plan-1',
    name: '推日',
    exercises: [
      { exerciseId: first.id, setCount: 3 },
      { exerciseId: second.id, setCount: 2 },
      { exerciseId: third.id, setCount: 4 }
    ]
  }]

  require(path.resolve(__dirname, '../pages/plans/plans.js'))
  const list = page()
  await list.loadPlans()
  assert.equal(list.data.plans[0].exerciseCount, 3)
  assert.equal(list.data.plans[0].totalSetCount, 9)
  assert.equal(list.data.plans[0].previewItems.length, 2)
  assert.equal(list.data.plans[0].hiddenExerciseCount, 1)
  assert.ok(list.data.plans[0].previewItems[0].image)
  list.openPlan({ currentTarget: { dataset: { id: 'plan-1' } } })
  assert.equal(navigations.at(-1), '/pages/plan/detail?id=plan-1')

  require(path.resolve(__dirname, '../pages/plan/detail.js'))
  const detail = page()
  await detail.onLoad({ id: 'plan-1' })
  assert.equal(detail.data.plan.items.length, 3)
  assert.equal(detail.data.plan.totalSetCount, 9)
  assert.ok(detail.data.plan.items.every(({ image }) => image))
  detail.openExercise({ currentTarget: { dataset: { id: first.id, missing: false } } })
  assert.equal(navigations.at(-1), `/pages/exercise/detail?id=${first.id}`)
  detail.editPlan()
  assert.equal(navigations.at(-1), '/pages/plan/edit?id=plan-1')

  console.log('训练计划关联、预览、详情、选择、排序和保存状态检查通过')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
