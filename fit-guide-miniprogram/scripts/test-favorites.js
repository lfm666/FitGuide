const assert = require('node:assert/strict')

let stored
global.wx = {
  getStorageSync: () => stored,
  setStorageSync: (key, value) => { stored = value },
  cloud: {
    getTempFileURL: async ({ fileList }) => ({
      fileList: fileList.map((fileID) => ({ fileID, tempFileURL: `https://test.local/${fileID}` }))
    })
  }
}

const { getFavoriteIds, toggleFavorite } = require('../utils/favorites')

assert.deepEqual(getFavoriteIds(), [])
assert.equal(toggleFavorite('seated-lat-pulldown'), true)
assert.deepEqual(getFavoriteIds(), ['seated-lat-pulldown'])
assert.equal(toggleFavorite('seated-lat-pulldown'), false)
assert.deepEqual(getFavoriteIds(), [])

stored = ['valid-id', 'valid-id', '', null]
assert.deepEqual(getFavoriteIds(), ['valid-id'])

let page
global.Page = (config) => { page = config }
stored = ['seated-lat-pulldown']
require('../pages/favorites/favorites')

const context = {
  data: {},
  setData(value) { Object.assign(this.data, value) }
}
page.onShow.call(context).then(() => {
  assert.deepEqual(context.data.exercises.map(({ id }) => id), stored)
  console.log('本地收藏检查通过')
}).catch((error) => {
  console.error(error)
  process.exitCode = 1
})
