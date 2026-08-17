import { readFile, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = resolve(root, 'data/exercises.json')
const outputPath = resolve(root, 'data/exercises-zh.json')
const mediaBase = 'https://7072-prod-d4gi5hg2s057d6cfc-1466119943.tcb.qcloud.la/exercises-dataset/'
const run = promisify(execFile)

const categories = {
  back: '背部',
  cardio: '有氧',
  chest: '胸部',
  'lower arms': '前臂',
  'lower legs': '小腿',
  neck: '颈部',
  shoulders: '肩部',
  'upper arms': '上臂',
  'upper legs': '大腿',
  waist: '核心'
}

const equipment = {
  assisted: '辅助器械',
  band: '弹力带',
  barbell: '杠铃',
  'body weight': '自重',
  'bosu ball': '半圆平衡球',
  cable: '绳索拉力器',
  dumbbell: '哑铃',
  'elliptical machine': '椭圆机',
  'ez barbell': '曲杆杠铃',
  hammer: '铁锤',
  kettlebell: '壶铃',
  'leverage machine': '杠杆式器械',
  'medicine ball': '药球',
  'olympic barbell': '奥林匹克杠铃',
  'resistance band': '阻力带',
  roller: '泡沫轴',
  rope: '训练绳',
  'skierg machine': '滑雪机',
  'sled machine': '阻力雪橇',
  'smith machine': '史密斯机',
  'stability ball': '瑜伽球',
  'stationary bike': '固定式自行车',
  'stepmill machine': '楼梯机',
  tire: '轮胎',
  'trap bar': '六角杠铃',
  'upper body ergometer': '上肢功率车',
  weighted: '负重',
  'wheel roller': '健腹轮'
}

const muscles = {
  abductors: '外展肌群',
  abdominals: '腹肌',
  abs: '腹肌',
  adductors: '内收肌群',
  'ankle stabilizers': '踝关节稳定肌群',
  ankles: '踝部肌群',
  back: '背部肌群',
  biceps: '肱二头肌',
  brachialis: '肱肌',
  calves: '小腿肌群',
  'cardiovascular system': '心肺系统',
  chest: '胸肌',
  core: '核心肌群',
  deltoids: '三角肌',
  delts: '三角肌',
  feet: '足部肌群',
  forearms: '前臂肌群',
  glutes: '臀肌',
  'grip muscles': '握力肌群',
  groin: '腹股沟肌群',
  hamstrings: '腘绳肌',
  hands: '手部肌群',
  'hip flexors': '髋屈肌',
  'inner thighs': '大腿内侧肌群',
  'latissimus dorsi': '背阔肌',
  lats: '背阔肌',
  'levator scapulae': '肩胛提肌',
  'lower abs': '下腹肌',
  'lower back': '下背肌群',
  obliques: '腹斜肌',
  pectorals: '胸肌',
  quadriceps: '股四头肌',
  quads: '股四头肌',
  'rear deltoids': '三角肌后束',
  rhomboids: '菱形肌',
  'rotator cuff': '肩袖肌群',
  'serratus anterior': '前锯肌',
  shins: '小腿前侧肌群',
  shoulders: '肩部肌群',
  soleus: '比目鱼肌',
  spine: '脊柱肌群',
  sternocleidomastoid: '胸锁乳突肌',
  trapezius: '斜方肌',
  traps: '斜方肌',
  triceps: '肱三头肌',
  'upper back': '上背肌群',
  'upper chest': '上胸肌',
  'wrist extensors': '腕伸肌群',
  'wrist flexors': '腕屈肌群',
  wrists: '腕部肌群'
}

const nameOverrides = {
  'all fours squad stretch': '四点跪姿股四头肌拉伸',
  'arm slingers hanging bent knee legs': '悬垂屈膝举腿',
  'arm slingers hanging straight legs': '悬垂直腿抬举',
  'assisted lying leg raise with lateral throw down': '辅助仰卧侧向落腿',
  'assisted lying leg raise with throw down': '辅助仰卧落腿',
  'barbell jm bench press': '杠铃窄距屈臂卧推',
  'bench pull-ups': '长凳引体向上',
  'biceps leg concentration curl': '大腿支撑集中弯举',
  'cable pulldown (pro lat bar)': '绳索背阔肌杆下拉',
  'dumbbell biceps curl v sit on bosu ball': '半圆平衡球坐姿哑铃弯举',
  'ez barbell jm bench press': '曲杆杠铃窄距屈臂卧推',
  'l-sit on floor': '地面L字支撑',
  'reverse grip machine lat pulldown': '器械反握高位下拉',
  'twin handle parallel grip lat pulldown': '双把手平行握高位下拉',
  'v-sit on floor': '地面V字支撑'
}

const nameTerms = [
  [/ez[- ]barbell|ez[- ]bar/gi, '曲杆杠铃'],
  [/olympic barbell/gi, '奥林匹克杠铃'],
  [/trap bar/gi, '六角杠铃'],
  [/smith machine|smith/gi, '史密斯机'],
  [/stability ball|exercise ball/gi, '健身球'],
  [/bosu ball/gi, '半圆平衡球'],
  [/medicine ball/gi, '药球'],
  [/resistance band/gi, '阻力带'],
  [/body ?weight/gi, '自重'],
  [/barbells?/gi, '杠铃'],
  [/dumbbells?/gi, '哑铃'],
  [/kettlebell/gi, '壶铃'],
  [/cable/gi, '绳索'],
  [/\bband\b/gi, '弹力带'],
  [/\blever\b/gi, '杠杆式器械'],
  [/\bassisted\b/gi, '辅助'],
  [/\bweighted\b/gi, '负重'],
  [/arm blaster/gi, '二头肌训练板'],
  [/sz-bar/gi, '曲杆'],
  [/v-bar/gi, 'V形把手'],
  [/t-bar/gi, 'T杠'],
  [/bench press/gi, '卧推'],
  [/chest press/gi, '推胸'],
  [/shoulder press/gi, '肩推'],
  [/military press/gi, '军事推举'],
  [/french press/gi, '法式推举'],
  [/leg press/gi, '腿举'],
  [/\bw[- ]press\b/gi, 'W字推举'],
  [/inverted row/gi, '反向划船'],
  [/bent[- ]over row/gi, '俯身划船'],
  [/upright row/gi, '直立划船'],
  [/seated row/gi, '坐姿划船'],
  [/high row/gi, '高位划船'],
  [/\bl[- ]pull[- ]ups?\b/gi, 'L字引体向上'],
  [/\bpull[- ]?ups?\b/gi, '引体向上'],
  [/\bchin[- ]?ups?\b/gi, '反握引体向上'],
  [/\bpush[- ]?ups?\b/gi, '俯卧撑'],
  [/\bpull[- ]?down\b/gi, '下拉'],
  [/\bpush[- ]?down\b/gi, '下压'],
  [/\bpull[- ]?over\b/gi, '过顶拉'],
  [/pull through/gi, '胯下拉'],
  [/\bv[- ]up\b/gi, 'V字卷腹'],
  [/\by[- ]raise\b/gi, 'Y字平举'],
  [/\bt[- ]raise\b/gi, 'T字平举'],
  [/\bl[- ]sit\b/gi, 'L字支撑'],
  [/\bv[- ]sit\b/gi, 'V字支撑'],
  [/good morning/gi, '早安式'],
  [/dead bug/gi, '死虫式'],
  [/\bcalf raises?\b|\bcalves raises?\b/gi, '提踵'],
  [/\bleg raise\b/gi, '举腿'],
  [/\bleg raised\b/gi, '抬腿'],
  [/\bhip raise\b/gi, '提臀'],
  [/\bfront raise\b/gi, '前平举'],
  [/\blateral raise\b/gi, '侧平举'],
  [/curl[- ]up/gi, '卷腹'],
  [/sit[- ]up/gi, '仰卧起坐'],
  [/deadlift/gi, '硬拉'],
  [/\bpress\b/gi, '推举'],
  [/\brow\b/gi, '划船'],
  [/\bdip\b/gi, '臂屈伸'],
  [/\bfly\b/gi, '飞鸟'],
  [/\bcurl\b/gi, '弯举'],
  [/\bcrunch\b/gi, '卷腹'],
  [/\bsquat\b/gi, '深蹲'],
  [/\blunge\b/gi, '弓步'],
  [/\bshrug\b/gi, '耸肩'],
  [/\bplank\b/gi, '平板支撑'],
  [/\bbridge\b/gi, '桥式'],
  [/\btwist\b/gi, '转体'],
  [/\bstretch\b/gi, '拉伸'],
  [/\bextension\b/gi, '伸展'],
  [/\braise\b/gi, '平举'],
  [/close[- ]grip/gi, '窄握'],
  [/wide[- ]grip/gi, '宽握'],
  [/reverse[- ]grip/gi, '反握'],
  [/\bunderhand\b/gi, '反握'],
  [/\boverhand\b/gi, '正握'],
  [/one arm/gi, '单臂'],
  [/two arm/gi, '双臂'],
  [/single leg/gi, '单腿'],
  [/bent knees?/gi, '屈膝'],
  [/straight leg/gi, '直腿'],
  [/bent arms?/gi, '屈臂'],
  [/straight arm/gi, '直臂'],
  [/\bside lying\b/gi, '侧卧'],
  [/\bseated\b/gi, '坐姿'],
  [/\bstanding\b/gi, '站姿'],
  [/\blying\b/gi, '卧姿'],
  [/\bkneeling\b/gi, '跪姿'],
  [/\bprone\b/gi, '俯卧'],
  [/\bsupine\b/gi, '仰卧'],
  [/\bincline\b/gi, '上斜'],
  [/\bdecline\b/gi, '下斜'],
  [/\bstep[- ]up\b/gi, '登阶'],
  [/\bstepbox\b/gi, '踏步箱'],
  [/\bthruster\b/gi, '深蹲推举'],
  [/\bzercher\b/gi, '泽奇式'],
  [/\bhack\b/gi, '哈克式'],
  [/\bstiff leg\b/gi, '直腿'],
  [/\brear delt\b/gi, '三角肌后束'],
  [/\bab roller?out\b/gi, '腹肌轮滚动'],
  [/\bfull\b/gi, '完整'],
  [/\bwide\b/gi, '宽距'],
  [/\bfloor\b/gi, '地面'],
  [/\bpov\b/gi, '视角'],
  [/\bbiceps?\b/gi, '肱二头肌'],
  [/\btriceps?\b/gi, '肱三头肌'],
  [/\bquadriceps|\bquads?\b/gi, '股四头肌'],
  [/\bhamstrings?\b/gi, '腘绳肌'],
  [/\bglutes?\b/gi, '臀肌'],
  [/\bcalves\b/gi, '小腿肌群'],
  [/\bchest\b/gi, '胸部'],
  [/\bshoulders?\b/gi, '肩部'],
  [/\bwrist\b/gi, '腕部'],
  [/\babs\b/gi, '腹肌'],
  [/\brussian\b/gi, '俄罗斯式'],
  [/\bromanian\b/gi, '罗马尼亚式'],
  [/\barnold\b/gi, '阿诺德'],
  [/\bcuban\b/gi, '古巴式'],
  [/\bpreacher\b/gi, '牧师凳'],
  [/\bhammer\b/gi, '锤式'],
  [/\bconcentration\b/gi, '集中'],
  [/v\.\s*2\b/gi, '第二式'],
  [/v\.\s*3\b/gi, '第三式']
]

const preparedName = (name) => nameTerms.reduce(
  (value, [pattern], index) => value.replace(pattern, `9${String(index).padStart(5, '0')}`),
  name
)

const restoredName = (name) => nameTerms.reduce(
  (value, [, replacement], index) => value.replaceAll(`9${String(index).padStart(5, '0')}`, replacement),
  name
)
  .replace(/\s+/g, ' ')
  .replace(/\s*\(\s*/g, '（')
  .replace(/\s*\)\s*/g, '）')
  .replace(/(?<=[\p{Script=Han}）])\s+(?=[\p{Script=Han}（])/gu, '')
  .trim()

const translateBatch = async (names) => {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const { stdout } = await run('curl.exe', [
        '--fail', '--silent', '--show-error', '--ssl-no-revoke', '--request', 'POST',
        'https://translate.googleapis.com/translate_a/single',
        '--data-urlencode', 'client=gtx',
        '--data-urlencode', 'sl=en',
        '--data-urlencode', 'tl=zh-CN',
        '--data-urlencode', 'dt=t',
        '--data-urlencode', `q=${names.map(preparedName).join('\n')}`
      ])
      const payload = JSON.parse(stdout)
      const translated = payload[0].map((part) => part[0]).join('').split('\n')
      if (translated.length !== names.length) {
        throw new Error(`翻译数量不匹配：${names.length} -> ${translated.length}`)
      }
      return translated.map(restoredName)
    } catch (error) {
      if (attempt === 3) throw error
      await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 1000))
    }
  }
}

const loadExistingNames = async () => {
  try {
    const existing = JSON.parse(await readFile(outputPath, 'utf8'))
    return new Map(existing.exercises.map(({ id, name }) => [id, name]))
  } catch (error) {
    if (error.code === 'ENOENT') return new Map()
    throw error
  }
}

const requireMapping = (mapping, value, field, id) => {
  if (!mapping[value]) throw new Error(`${id} 存在未映射的 ${field}: ${value}`)
  return mapping[value]
}

const source = JSON.parse(await readFile(sourcePath, 'utf8'))
const namesById = process.argv.includes('--refresh-names') ? new Map() : await loadExistingNames()
const missing = source.filter(({ id }) => !namesById.has(id))

for (let index = 0; index < missing.length; index += 40) {
  const batch = missing.slice(index, index + 40)
  const translated = await translateBatch(batch.map(({ name }) => name))
  batch.forEach(({ id, name }, offset) => namesById.set(id, nameOverrides[name] ?? translated[offset]))
  console.log(`已翻译 ${Math.min(index + batch.length, missing.length)}/${missing.length}`)
}

const exercises = source.map((exercise) => {
  const primaryMuscles = [requireMapping(muscles, exercise.target, 'target', exercise.id)]
  const secondaryMuscles = [...new Set(
    [exercise.muscle_group, ...exercise.secondary_muscles]
      .map((value) => requireMapping(muscles, value, 'muscle', exercise.id))
      .filter((value) => !primaryMuscles.includes(value))
  )]

  return {
    id: exercise.id,
    name: nameOverrides[exercise.name] ?? namesById.get(exercise.id),
    category: requireMapping(categories, exercise.category, 'category', exercise.id),
    equipment: requireMapping(equipment, exercise.equipment, 'equipment', exercise.id),
    primaryMuscles,
    secondaryMuscles,
    image: `${mediaBase}${exercise.image}`,
    gif: `${mediaBase}${exercise.gif_url}`,
    steps: exercise.instruction_steps.zh
  }
})

const ids = new Set(exercises.map(({ id }) => id))
if (ids.size !== source.length) throw new Error('动作 ID 重复')
if (exercises.some(({ name, steps }) => !name || !Array.isArray(steps) || !steps.length)) {
  throw new Error('存在缺少中文名称或步骤的动作')
}

const output = {
  version: 1,
  disclaimer: '内容仅供一般健身动作参考；首次使用器械时请让教练确认座椅、限位和重量设置。',
  attribution: source[0].attribution,
  exercises
}

await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
console.log(`已生成 ${outputPath}，共 ${exercises.length} 条动作`)
