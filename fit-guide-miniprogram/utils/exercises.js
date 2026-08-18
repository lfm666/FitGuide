const categoryOrder = ['全部', '胸部', '背部', '肩部', '手臂', '腿部', '臀部', '核心', '下背部', '小腿', '有氧']

function filterExercises(exercises, query = '', category = '全部', equipment = '全部器械') {
  const keyword = query.trim().toLowerCase()

  return exercises.filter((exercise) => {
    if (category !== '全部' && exercise.category !== category) return false
    if (equipment !== '全部器械' && exercise.equipment !== equipment) return false
    if (!keyword) return true

    return [
      exercise.name,
      exercise.equipment,
      ...exercise.primaryMuscles,
      ...exercise.secondaryMuscles
    ].some((value) => value.toLowerCase().includes(keyword))
  })
}

function findExerciseById(exercises, id) {
  return exercises.find((exercise) => exercise.id === id)
}

function hydratePlanExercises(items, exercises) {
  const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]))
  return items.map((item) => ({
    ...item,
    exercise: byId.get(item.exerciseId) || null,
    missing: !byId.has(item.exerciseId)
  }))
}

module.exports = { categoryOrder, filterExercises, findExerciseById, hydratePlanExercises }
