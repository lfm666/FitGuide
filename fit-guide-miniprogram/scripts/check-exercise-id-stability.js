const fs = require('node:fs')

const [, , previousPath, candidatePath] = process.argv
if (!previousPath || !candidatePath) {
  throw new Error('用法：node scripts/check-exercise-id-stability.js <旧版.json> <新版.json>')
}

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))
const previous = read(previousPath)
const candidate = read(candidatePath)
const index = (catalog) => new Map(catalog.exercises.map((item) => [item.id, item]))
const before = index(previous)
const after = index(candidate)
const added = [...after.keys()].filter((id) => !before.has(id))
const removed = [...before.keys()].filter((id) => !after.has(id))
const identityChanged = [...after.keys()].filter((id) => {
  const old = before.get(id)
  const current = after.get(id)
  return old && old.image !== current.image && old.gif !== current.gif
})
const changed = added.length || removed.length || identityChanged.length

console.log(JSON.stringify({ added, removed, identityChanged }, null, 2))
if (changed && (!Number.isInteger(candidate.version) || candidate.version <= previous.version)) {
  throw new Error('动作目录发生发布级变化时必须递增 version')
}
if (identityChanged.length) {
  throw new Error('同一 ID 的图片和 GIF 均已变化，请人工确认没有复用动作 ID')
}
