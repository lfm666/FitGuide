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
  removeFavorite
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

  console.log('本地动作数据与后端收藏接口检查通过')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
