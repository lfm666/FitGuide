const { exercises } = require('../data/exercises.json')
const isMediaAddress = (value) => (
  typeof value === 'string' && (value.startsWith('cloud://') || /^https?:\/\//i.test(value))
)

const media = exercises.flatMap((exercise) => [
  { id: exercise.id, value: exercise.image, suffix: '.jpg' },
  { id: exercise.id, value: exercise.gif, suffix: '.gif' }
])
const failures = media.filter(({ value, suffix }) => (
  !isMediaAddress(value) || !value.toLowerCase().endsWith(suffix)
))

if (failures.length) {
  console.error(failures.map(({ id, value }) => `${id}: 无效 CloudBase fileID (${value})`).join('\n'))
  process.exitCode = 1
} else {
  console.log(`媒体 fileID 检查通过：${media.length} 个文件`)
}
