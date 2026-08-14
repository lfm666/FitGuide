const {
  getFavoriteIds: getRemoteFavoriteIds,
  addFavorite,
  removeFavorite
} = require('./api')

const storageKey = 'favoriteExerciseIds'
const migrationKey = 'favoriteMigrationV1'
const exerciseIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

let migrationPromise

function getStoredFavoriteIds() {
  const value = wx.getStorageSync(storageKey)
  return Array.isArray(value)
    ? [...new Set(value.filter((id) => (
      typeof id === 'string' && id.length <= 64 && exerciseIdPattern.test(id)
    )))]
    : []
}

async function migrateFavorites() {
  if (wx.getStorageSync(migrationKey)) return
  if (!migrationPromise) {
    migrationPromise = (async () => {
      await Promise.all(getStoredFavoriteIds().map(async (id) => {
        try {
          await addFavorite(id)
        } catch (error) {
          if (error.code !== 'EXERCISE_NOT_FOUND' && error.code !== 'INVALID_EXERCISE_ID') throw error
        }
      }))
      wx.setStorageSync(migrationKey, true)
      wx.removeStorageSync(storageKey)
    })().catch((error) => {
      migrationPromise = null
      throw error
    })
  }
  await migrationPromise
}

async function getFavoriteIds() {
  await migrateFavorites()
  const ids = await getRemoteFavoriteIds()
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string' || !id)) {
    throw new Error('收藏数据格式错误')
  }
  return [...new Set(ids)]
}

async function toggleFavorite(id, isFavorite) {
  await migrateFavorites()
  const nextState = isFavorite ? await removeFavorite(id) : await addFavorite(id)
  if (typeof nextState !== 'boolean') throw new Error('收藏状态格式错误')
  return nextState
}

module.exports = { getFavoriteIds, toggleFavorite }
