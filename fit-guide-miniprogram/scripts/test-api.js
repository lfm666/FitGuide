const assert = require('node:assert/strict')

const calls = []
let initialized
global.wx = {
  cloud: {
    init: (config) => { initialized = config },
    callContainer: async (options) => {
      calls.push(options)
      if (options.path === '/api/v1/catalog') {
        return {
          statusCode: 200,
          data: {
            code: '00000',
            message: '操作成功',
            data: { version: 1, disclaimer: '测试', exercises: [] }
          }
        }
      }
      if (options.path === '/api/v1/catalog/categories') {
        return {
          statusCode: 200,
          data: { code: '00000', message: '操作成功', data: ['背部', '胸部'] }
        }
      }
      if (options.path === '/api/v1/catalog/equipments') {
        return {
          statusCode: 200,
          data: { code: '00000', message: '操作成功', data: ['高位下拉器', '坐姿推胸机'] }
        }
      }
      if (options.path === '/api/v1/exercises/seated-lat-pulldown') {
        return {
          statusCode: 200,
          data: {
            code: '00000',
            message: '操作成功',
            data: {
              version: 1,
              disclaimer: '测试',
              exercise: { id: 'seated-lat-pulldown', name: '坐姿高位下拉' }
            }
          }
        }
      }
      if (options.path === '/api/v1/favorites' && options.method === 'GET') {
        return {
          statusCode: 200,
          data: { code: '00000', message: '操作成功', data: ['seated-lat-pulldown'] }
        }
      }
      if (options.path === '/api/v1/favorites/seated-lat-pulldown' && options.method === 'PUT') {
        return {
          statusCode: 200,
          data: { code: '00000', message: '操作成功', data: true }
        }
      }
      if (options.path === '/api/v1/favorites/seated-lat-pulldown' && options.method === 'DELETE') {
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
  assert.equal(calls.length, 1)
  assert.equal(calls[0].path, '/api/v1/catalog')
  assert.equal(calls[0].header['X-WX-SERVICE'], 'springboot-7pqe')
  assert.equal(calls[0].header['X-WX-OPENID'], undefined)

  assert.deepEqual(await getCategories(), ['背部', '胸部'])
  assert.deepEqual(await getEquipments(), ['高位下拉器', '坐姿推胸机'])

  const detail = await getExercise('seated-lat-pulldown')
  assert.equal(detail.exercise.name, '坐姿高位下拉')

  await assert.rejects(
    getExercise('missing-exercise'),
    (error) => error.code === 'EXERCISE_NOT_FOUND' && error.message === '动作不存在'
  )
  assert.equal(calls[4].path, '/api/v1/exercises/missing-exercise')

  assert.deepEqual(await getFavoriteIds(), ['seated-lat-pulldown'])
  assert.equal(await addFavorite('seated-lat-pulldown'), true)
  assert.equal(await removeFavorite('seated-lat-pulldown'), false)
  assert.deepEqual(
    calls.slice(5).map(({ path, method }) => [path, method]),
    [
      ['/api/v1/favorites', 'GET'],
      ['/api/v1/favorites/seated-lat-pulldown', 'PUT'],
      ['/api/v1/favorites/seated-lat-pulldown', 'DELETE']
    ]
  )

  console.log('CloudBase 云托管接口检查通过')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
