const ENV_ID = 'prod-d4gi5hg2s057d6cfc'
const SERVICE_NAME = 'springboot-7pqe'

let catalogPromise

function initCloud() {
  wx.cloud.init({ env: ENV_ID })
}

async function request(path, method = 'GET') {
  const response = await wx.cloud.callContainer({
    config: { env: ENV_ID },
    path,
    method,
    header: { 'X-WX-SERVICE': SERVICE_NAME }
  })
  const body = response && response.data

  if (!response || response.statusCode < 200 || response.statusCode >= 300 || !body || body.code !== '00000') {
    const error = new Error((body && body.message) || '服务请求失败，请稍后重试')
    error.code = (body && body.code) || 'REQUEST_FAILED'
    throw error
  }

  return body.data
}

function getCatalog() {
  if (!catalogPromise) {
    catalogPromise = request('/api/v1/catalog')
      .then((catalog) => {
        if (!catalog || !Array.isArray(catalog.exercises)) throw new Error('动作目录数据格式错误')
        return catalog
      })
      .catch((error) => {
        catalogPromise = null
        throw error
      })
  }

  return catalogPromise
}

async function getOptions(path) {
  const options = await request(path)
  if (!Array.isArray(options) || options.some((option) => typeof option !== 'string' || !option)) {
    throw new Error('筛选选项数据格式错误')
  }
  return options
}

function getCategories() {
  return getOptions('/api/v1/catalog/categories')
}

function getEquipments() {
  return getOptions('/api/v1/catalog/equipments')
}

async function getExercise(id) {
  const detail = await request(`/api/v1/exercises/${encodeExerciseId(id)}`)
  if (!detail || !detail.exercise) throw new Error('动作详情数据格式错误')
  return detail
}

function getFavoriteIds() {
  return request('/api/v1/favorites')
}

function addFavorite(id) {
  return request(`/api/v1/favorites/${encodeExerciseId(id)}`, 'PUT')
}

function removeFavorite(id) {
  return request(`/api/v1/favorites/${encodeExerciseId(id)}`, 'DELETE')
}

function encodeExerciseId(id) {
  if (typeof id !== 'string' || !id) {
    const error = new Error('动作 ID 无效')
    error.code = 'INVALID_EXERCISE_ID'
    throw error
  }
  return encodeURIComponent(id)
}

module.exports = {
  initCloud,
  getCatalog,
  getCategories,
  getEquipments,
  getExercise,
  getFavoriteIds,
  addFavorite,
  removeFavorite
}
