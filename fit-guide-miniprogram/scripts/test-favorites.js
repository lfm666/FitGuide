const assert = require('node:assert/strict')

const calls = []
const toasts = []
let failNextFavoriteWrite = false
const storage = {
  favoriteExerciseIds: ['seated-lat-pulldown', 'seated-lat-pulldown', 'INVALID_ID']
}
const remoteFavoriteIds = new Set()
const exercise = {
  id: 'seated-lat-pulldown',
  name: '坐姿高位下拉',
  category: '背部',
  equipment: '高位下拉器',
  level: '初级',
  primaryMuscles: ['背阔肌'],
  secondaryMuscles: ['肱二头肌'],
  image: 'cloud://exercise.jpg',
  gif: 'cloud://exercise.gif',
  steps: ['下拉'],
  cautions: ['不要借力']
}

function success(data) {
  return { statusCode: 200, data: { code: '00000', message: '操作成功', data } }
}

global.wx = {
  getStorageSync: (key) => storage[key],
  setStorageSync: (key, value) => { storage[key] = value },
  removeStorageSync: (key) => { delete storage[key] },
  setNavigationBarTitle: () => {},
  showToast: (options) => { toasts.push(options) },
  cloud: {
    callContainer: async (options) => {
      calls.push(options)
      if (options.path === '/api/v1/favorites' && options.method === 'GET') {
        return success([...remoteFavoriteIds])
      }
      if (options.path.startsWith('/api/v1/favorites/')) {
        if (failNextFavoriteWrite) {
          failNextFavoriteWrite = false
          return { statusCode: 500, data: { code: 'INTERNAL_ERROR', message: '服务内部错误' } }
        }
        const id = decodeURIComponent(options.path.split('/').pop())
        if (options.method === 'PUT') {
          remoteFavoriteIds.add(id)
          return success(true)
        }
        if (options.method === 'DELETE') {
          remoteFavoriteIds.delete(id)
          return success(false)
        }
      }
      if (options.path === '/api/v1/catalog') {
        return success({ version: 1, disclaimer: '测试', exercises: [exercise] })
      }
      if (options.path === `/api/v1/exercises/${exercise.id}`) {
        return success({ version: 1, disclaimer: '测试', exercise })
      }
      return { statusCode: 404, data: { code: 'NOT_FOUND', message: '不存在', data: null } }
    },
    getTempFileURL: async ({ fileList }) => ({
      fileList: fileList.map((fileID) => ({ fileID, tempFileURL: `https://test.local/${fileID}` }))
    })
  }
}

const { getFavoriteIds, toggleFavorite } = require('../utils/favorites')

async function main() {
  failNextFavoriteWrite = true
  await assert.rejects(getFavoriteIds, (error) => error.code === 'INTERNAL_ERROR')
  assert.deepEqual(storage.favoriteExerciseIds, [
    'seated-lat-pulldown',
    'seated-lat-pulldown',
    'INVALID_ID'
  ])
  assert.equal(storage.favoriteMigrationV1, undefined)

  assert.deepEqual(await getFavoriteIds(), [exercise.id])
  assert.equal(storage.favoriteMigrationV1, true)
  assert.equal(storage.favoriteExerciseIds, undefined)
  assert.deepEqual(
    calls.slice(0, 3).map(({ path, method }) => [path, method]),
    [
      [`/api/v1/favorites/${exercise.id}`, 'PUT'],
      [`/api/v1/favorites/${exercise.id}`, 'PUT'],
      ['/api/v1/favorites', 'GET']
    ]
  )

  assert.equal(await toggleFavorite(exercise.id, true), false)
  assert.deepEqual(await getFavoriteIds(), [])
  assert.equal(await toggleFavorite(exercise.id, false), true)

  let favoritesPage
  global.Page = (config) => { favoritesPage = config }
  require('../pages/favorites/favorites')
  const favoritesContext = {
    data: {},
    setData(value) { Object.assign(this.data, value) }
  }
  await favoritesPage.onShow.call(favoritesContext)
  assert.deepEqual(favoritesContext.data.exercises.map(({ id }) => id), [exercise.id])

  let detailPage
  global.Page = (config) => { detailPage = config }
  require('../pages/exercise/detail')
  const detailContext = {
    exerciseId: exercise.id,
    data: {},
    setData(value) { Object.assign(this.data, value) }
  }
  await detailPage.loadExercise.call(detailContext)
  assert.equal(detailContext.data.isFavorite, true)
  await detailPage.toggleFavorite.call(detailContext)
  assert.equal(detailContext.data.isFavorite, false)
  assert.equal(detailContext.data.favoritePending, false)

  failNextFavoriteWrite = true
  await detailPage.toggleFavorite.call(detailContext)
  assert.equal(detailContext.data.isFavorite, false)
  assert.equal(detailContext.data.favoritePending, false)
  assert.equal(toasts.at(-1).title, '收藏失败，请重试')

  console.log('后端收藏检查通过')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
