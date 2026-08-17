const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const source = path.join(root, 'data', 'exercises.json')
const target = path.join(root, 'data', 'exercises.js')
const data = JSON.parse(fs.readFileSync(source, 'utf8'))
const required = [
  'id',
  'name',
  'category',
  'equipment',
  'primaryMuscles',
  'secondaryMuscles',
  'image',
  'gif',
  'steps'
]
const isMediaAddress = (value) => (
  typeof value === 'string' && (value.startsWith('cloud://') || /^https?:\/\//i.test(value))
)

if (!Array.isArray(data.exercises) || !data.exercises.length) {
  throw new Error('exercises.json 中没有动作数据')
}

const ids = new Set()
for (const [index, exercise] of data.exercises.entries()) {
  const missing = required.filter((key) => exercise[key] === undefined || exercise[key] === '')
  if (missing.length) throw new Error(`第 ${index + 1} 个动作缺少字段：${missing.join(', ')}`)
  if (ids.has(exercise.id)) throw new Error(`动作 id 重复：${exercise.id}`)
  if (!isMediaAddress(exercise.image) || !isMediaAddress(exercise.gif)) {
    throw new Error(`动作媒体必须使用 HTTP(S) 地址或 CloudBase fileID：${exercise.id}`)
  }
  ids.add(exercise.id)
}

const output = `// 由 scripts/sync-exercises.js 自动生成，请修改 exercises.json 后重新执行脚本。\nmodule.exports = ${JSON.stringify(data, null, 2)}\n`
fs.writeFileSync(target, output)
console.log(`已同步 ${data.exercises.length} 个动作到 ${path.relative(root, target)}`)
