const assert = require('node:assert/strict')

const calls = []
let initialized
const catalogData = require('../data/exercises')
const exercise = catalogData.exercises[0]
global.wx = {
  cloud: {
    init: (config) => { initialized = config },
    callContainer: async (options) => {
      calls.push(options)
      if (options.path === '/api/v1/favorites' && options.method === 'GET') {
        return {
          statusCode: 200,
          data: { code: '00000', message: '操作成功', data: [exercise.id] }
        }
      }
      if (options.path === `/api/v1/favorites/${exercise.id}` && options.method === 'PUT') {
        return {
          statusCode: 200,
          data: { code: '00000', message: '操作成功', data: true }
        }
      }
      if (options.path === `/api/v1/favorites/${exercise.id}` && options.method === 'DELETE') {
        return {
          statusCode: 200,
          data: { code: '00000', message: '操作成功', data: false }
        }
      }
      if (options.path === '/api/v1/training-plans' && options.method === 'GET') {
        return {
          statusCode: 200,
          data: { code: '00000', message: '操作成功', data: [{ id: '12', name: '推日', exercises: [{ exerciseId: exercise.id, setCount: 3 }] }] }
        }
      }
      if (options.path === '/api/v1/training-plans' && options.method === 'POST') {
        return { statusCode: 200, data: { code: '00000', message: '操作成功', data: { id: '13', ...options.data } } }
      }
      if (options.path === '/api/v1/training-plans/12' && options.method === 'PUT') {
        return { statusCode: 200, data: { code: '00000', message: '操作成功', data: { id: '12', ...options.data } } }
      }
      if (options.path === '/api/v1/training-plans/12' && options.method === 'DELETE') {
        return { statusCode: 200, data: { code: '00000', message: '操作成功', data: true } }
      }
      return {
        statusCode: 404,
        data: { code: 'EXERCISE_NOT_FOUND', message: '动作不存在', data: null }
      }
    }
  }
}

const {
  initCloud,
  getCatalog,
  getCategories,
  getEquipments,
  getExercise,
  getFavoriteIds,
  addFavorite,
  removeFavorite,
  getTrainingPlans,
  createTrainingPlan,
  updateTrainingPlan,
  deleteTrainingPlan
} = require('../utils/api')

async function main() {
  initCloud()
  assert.deepEqual(initialized, { env: 'prod-d4gi5hg2s057d6cfc' })

  const first = await getCatalog()
  const second = await getCatalog()
  assert.equal(first, second)
  assert.equal(first, catalogData)
  assert.equal(calls.length, 0)

  assert.deepEqual(await getCategories(), [...new Set(catalogData.exercises.map(({ category }) => category))])
  assert.deepEqual(await getEquipments(), [...new Set(catalogData.exercises.map(({ equipment }) => equipment))])

  const detail = await getExercise(exercise.id)
  assert.equal(detail.exercise, exercise)

  assert.throws(
    () => getExercise('missing-exercise'),
    (error) => error.code === 'EXERCISE_NOT_FOUND' && error.message === '动作不存在'
  )
  assert.equal(calls.length, 0)

  assert.deepEqual(await getFavoriteIds(), [exercise.id])
  assert.equal(await addFavorite(exercise.id), true)
  assert.equal(await removeFavorite(exercise.id), false)
  assert.deepEqual(
    calls.map(({ path, method }) => [path, method]),
    [
      ['/api/v1/favorites', 'GET'],
      [`/api/v1/favorites/${exercise.id}`, 'PUT'],
      [`/api/v1/favorites/${exercise.id}`, 'DELETE']
    ]
  )
  assert.equal(calls[0].header['X-WX-SERVICE'], 'springboot-7pqe')
  assert.equal(calls[0].header['X-WX-OPENID'], undefined)

  const payload = { name: '推日', exercises: [{ exerciseId: exercise.id, setCount: 3 }] }
  assert.equal(typeof payload.exercises[0].exerciseId, 'string')
  assert.equal((await getTrainingPlans())[0].id, '12')
  assert.equal((await createTrainingPlan(payload)).id, '13')
  assert.equal((await updateTrainingPlan('12', payload)).id, '12')
  assert.equal(await deleteTrainingPlan('12'), true)
  assert.deepEqual(
    calls.slice(-4).map(({ path, method }) => [path, method]),
    [
      ['/api/v1/training-plans', 'GET'],
      ['/api/v1/training-plans', 'POST'],
      ['/api/v1/training-plans/12', 'PUT'],
      ['/api/v1/training-plans/12', 'DELETE']
    ]
  )
  assert.deepEqual(calls.at(-3).data, payload)
  assert.deepEqual(calls.at(-2).data, payload)
  assert.equal(calls.at(-4).header['X-WX-OPENID'], undefined)
  assert.equal(calls.at(-3).header['content-type'], 'application/json')

  console.log('本地动作数据、收藏与训练计划接口检查通过')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
