const assert = require('node:assert/strict')

let stored
global.wx = {
  getStorageSync: () => stored,
  setStorageSync: (key, value) => { stored = value }
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
require('../pages/index/index')

const context = {
  data: {},
  setData(value) { Object.assign(this.data, value) }
}
page.applyFilters.call(context, '', '收藏')
assert.deepEqual(context.data.exercises.map(({ id }) => id), stored)

console.log('本地收藏检查通过')
