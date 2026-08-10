const https = require('node:https')
const { exercises } = require('../data/exercises.json')

const tasks = exercises.flatMap((exercise) => [
  { id: exercise.id, url: exercise.image, type: 'image/jpeg' },
  { id: exercise.id, url: exercise.gif, type: 'image/gif' }
])
const failures = []
let cursor = 0

function head(url) {
  return new Promise((resolve, reject) => {
    const request = https.request(url, { method: 'HEAD', timeout: 15000 }, (response) => {
      response.resume()
      resolve({ status: response.statusCode, type: response.headers['content-type'] || '' })
    })
    request.on('error', reject)
    request.on('timeout', () => request.destroy(new Error('请求超时')))
    request.end()
  })
}

async function worker() {
  while (cursor < tasks.length) {
    const task = tasks[cursor++]
    try {
      const result = await head(task.url)
      if (result.status < 200 || result.status >= 400 || !result.type.startsWith(task.type)) {
        failures.push(`${task.id}: HTTP ${result.status}, ${result.type || '无 Content-Type'} (${task.url})`)
      }
    } catch (error) {
      failures.push(`${task.id}: ${error.message} (${task.url})`)
    }
  }
}

Promise.all(Array.from({ length: 12 }, worker)).then(() => {
  if (failures.length) {
    console.error(failures.join('\n'))
    process.exitCode = 1
    return
  }
  console.log(`媒体检查通过：${tasks.length} 个远程文件`)
})
