const BATCH_SIZE = 50
const isDirectUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value)

async function resolveMedia(exercises, fields = ['image']) {
  const result = exercises.map((exercise) => ({ ...exercise }))
  const requests = []

  result.forEach((exercise, index) => {
    fields.forEach((field) => {
      const fileID = exercise[field]
      if (isDirectUrl(fileID)) return
      if (typeof fileID !== 'string' || !fileID.startsWith('cloud://')) {
        throw new Error(`媒体地址格式不支持：${exercise.id}/${field}`)
      }
      requests.push({ index, field, fileID })
    })
  })

  for (let start = 0; start < requests.length; start += BATCH_SIZE) {
    const batch = requests.slice(start, start + BATCH_SIZE)
    const { fileList } = await wx.cloud.getTempFileURL({
      fileList: batch.map(({ fileID }) => fileID)
    })

    batch.forEach(({ index, field }, batchIndex) => {
      const url = fileList[batchIndex] && fileList[batchIndex].tempFileURL
      if (!url) throw new Error(`媒体临时链接获取失败：${result[index].id}/${field}`)
      result[index][field] = url
    })
  }

  return result
}

module.exports = { resolveMedia }
