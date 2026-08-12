const storageKey = 'favoriteExerciseIds'

function getFavoriteIds() {
  const value = wx.getStorageSync(storageKey)
  return Array.isArray(value)
    ? [...new Set(value.filter((id) => typeof id === 'string' && id))]
    : []
}

function toggleFavorite(id) {
  const ids = getFavoriteIds()
  const index = ids.indexOf(id)

  if (index === -1) ids.push(id)
  else ids.splice(index, 1)

  wx.setStorageSync(storageKey, ids)
  return index === -1
}

module.exports = { getFavoriteIds, toggleFavorite }
