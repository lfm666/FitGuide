const assert = require('node:assert/strict')
const path = require('node:path')
const catalog = require('../data/exercises')
const { hydratePlanExercises } = require('../utils/exercises')

const first = catalog.exercises[0]
const second = catalog.exercises[1]
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
const apiPath = require.resolve('../utils/api')
require.cache[apiPath] = {
  id: apiPath,
  filename: apiPath,
  loaded: true,
  exports: {
    getCatalog: async () => catalog,
    getCategories: async () => [first.category, second.category],
    getEquipments: async () => [first.equipment, second.equipment],
    getTrainingPlans: async () => [],
    createTrainingPlan: async () => {
      createCalls++
      if (createMode === 'fail') throw new Error('network down')
      return new Promise((resolve) => { resolveCreate = resolve })
    },
    updateTrainingPlan: async () => ({})
  }
}

let definition
const modals = []
global.Page = (value) => { definition = value }
global.getCurrentPages = () => [{}, {}]
global.wx = {
  showToast() {},
  showModal(options) { modals.push(options) },
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

  console.log('训练计划关联、选择、排序和保存状态检查通过')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
