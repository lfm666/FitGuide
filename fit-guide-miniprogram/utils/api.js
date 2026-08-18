const ENV_ID = 'prod-d4gi5hg2s057d6cfc'
const SERVICE_NAME = 'springboot-7pqe'
const catalog = require('../data/exercises')

function initCloud() {
  wx.cloud.init({ env: ENV_ID })
}

async function request(path, method = 'GET', data) {
  const options = {
    config: { env: ENV_ID },
    path,
    method,
    header: {
      'X-WX-SERVICE': SERVICE_NAME,
      'content-type': 'application/json'
    }
  }
  if (data !== undefined) options.data = data
  const response = await wx.cloud.callContainer(options)
  const body = response && response.data

  if (!response || response.statusCode < 200 || response.statusCode >= 300 || !body || body.code !== '00000') {
    const error = new Error((body && body.message) || '服务请求失败，请稍后重试')
    error.code = (body && body.code) || 'REQUEST_FAILED'
    throw error
  }

  return body.data
}

function getCatalog() {
  return catalog
}

function getCategories() {
  return [...new Set(catalog.exercises.map(({ category }) => category))]
}

function getEquipments() {
  return [...new Set(catalog.exercises.map(({ equipment }) => equipment))]
}

function getExercise(id) {
  encodeExerciseId(id)
  const exercise = catalog.exercises.find((item) => item.id === id)
  if (!exercise) {
    const error = new Error('动作不存在')
    error.code = 'EXERCISE_NOT_FOUND'
    throw error
  }
  return { version: catalog.version, disclaimer: catalog.disclaimer, exercise }
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

async function getTrainingPlans() {
  const plans = await request('/api/v1/training-plans')
  const invalid = !Array.isArray(plans) || plans.some((plan) => (
    !plan || typeof plan.id !== 'string' || typeof plan.name !== 'string'
    || !Array.isArray(plan.exercises)
    || plan.exercises.some((item) => (
      !item || typeof item.exerciseId !== 'string' || !Number.isInteger(item.setCount)
    ))
  ))
  if (invalid) throw new Error('训练计划数据格式错误')
  return plans
}

function createTrainingPlan(plan) {
  return request('/api/v1/training-plans', 'POST', plan)
}

function updateTrainingPlan(id, plan) {
  return request(`/api/v1/training-plans/${encodeURIComponent(id)}`, 'PUT', plan)
}

function deleteTrainingPlan(id) {
  return request(`/api/v1/training-plans/${encodeURIComponent(id)}`, 'DELETE')
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
  removeFavorite,
  getTrainingPlans,
  createTrainingPlan,
  updateTrainingPlan,
  deleteTrainingPlan
}
