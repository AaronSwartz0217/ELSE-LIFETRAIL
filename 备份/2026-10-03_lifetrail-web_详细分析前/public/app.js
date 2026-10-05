/* LifeTrail 前端逻辑
 * 后端可用时走 API；未启动时回退到内置演示数据（页脚显示"离线演示"）。
 * 图表全部为原生 SVG 手绘，无第三方依赖。 */
const $ = s => document.querySelector(s);

const api = (u, opt) => fetch(u, opt && {
  method: opt.m || 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(opt.b || {})
}).then(r => r.json());

let OFFLINE = false;
function markOffline() {
  if (OFFLINE) return;
  OFFLINE = true;
  const f = document.querySelector('.foot');
  if (f) {
    f.classList.add('offline');
    f.textContent = 'v0.3 · 离线演示（当前页面使用已核验的本地摘要）';
  }
}

/* ---- 演示数据（后端不可用时） ---- */
const DEMO = {
  stats: {
    logs: 153,
    actions: { total: 11, done: 3 },
    judgments: { total: 8, evaluated: 8, hits: 5 },
    stage: {
      name: '职业坐标与判断训练', purpose: '把技术挑战收束为职业主线，用可检验的选择代替不断增加事务。'
    },
    recent: [
      { text: '本质 —— 挑战失败只否定我的手，判断失败否定我的眼', d: '2026-10-01' },
      { text: 'human3.0建议 —— 四象限定稿与 60 天指南', d: '2026-10-01' },
      { text: '取悦自己吧 —— 大胆取悦自己吧', d: '2026-09-19' },
      { text: '男性浪漫主义 —— 投射与撤回是一种很好的学习', d: '2026-09-13' },
      { text: '随记 —— 水映万象，印化其杀（真恶→放下，2 小时完成转化）', d: '2026-08-20' },
      { text: '家业七杀 —— 爷爷葬礼与那一万五', d: '2026-08-20' }
    ]
  },
  logs: {
    '2026': [['10-01','本质'],['10-01','human3.0建议'],['09-19','取悦自己吧'],['09-13','男性浪漫主义'],
             ['08-20','随记'],['08-20','真恶'],['08-20','家业七杀'],['08-12','记录'],['08-10','补记'],
             ['08-08','小感悟'],['07-26','长期主义'],['07-24','非暴力沟通'],['07-22','分析找不到'],
             ['07-22','ELSE'],['07-14','小想法'],['07-12','刽子手与骑士'],['07-12','碎总结'],['07-10','真相']],
    '2025': [['10-29','写吧'],['03-14','三天后'],['03-13','退游了王者'],['03-12','一线生机']]
  },
  /* 阶段带：依据 153 篇原始日志重新划分。
     count 为日期目录中的 TXT 实际清点数；summary 只概括文本中可确认的变化，
     boundary 明示证据不足或 AI 转存不能直接等同于作者稳定结论。 */
  stageBands: [
    { n: 1, name: '记录载体的试探', start: '2016-09', end: '2017-01', count: 2, active: 0,
      summary: '两篇极短记录。标题在追问“日志是什么”，正文只有“不知道”和“下雪了”，更像试用载体与留下瞬间，还不能推出稳定主题。',
      boundary: '样本仅 2 篇，不据此判断人格或长期状态。' },
    { n: 2, name: '理论化观察与道德审判', start: '2020-11', end: '2021-06', count: 10, active: 0,
      summary: '以校园舆论、自我压抑和关系困惑为材料，引入马斯洛、阿德勒与荣格。优点是开始提出假设、案例和验证计划；代价是容易把嫉妒、攻击性或失败上升成“人格阴暗”和道德罪责。到 2021-06 已开始质疑心理学被当作伤人或操控工具。',
      boundary: '这里记录的是当时采用的解释框架，不代表这些理论应用准确。' },
    { n: 3, name: '叙事回归与人生转场', start: '2022-08', end: '2023-07', count: 5, active: 0,
      summary: '从抽象理论回到怀念、投射、写作和个人经历。2022 年承认“两个源头都是自己”；2023 年高考结束后，把高中重写为探索多种性格模式的“实验场”，同时面对失常发挥、专业调剂与未来目标重置。',
      boundary: '阶段跨越长时间空白，重点是文本重心变化，不表示期间状态连续。' },
    { n: 4, name: '大学适应与主动性训练', start: '2023-08', end: '2024-03', count: 27, active: 0,
      summary: '关注点落到大学里的社交、舞台、班委、辩论、宿舍边界与能力反馈。反复强调机会需要主动争取，也开始区分“缺少经验或知识”与“人格有问题”；与此同时，仍会用地位、他人回应和角色表现衡量自己。',
      boundary: '梦境和修辞性文本只作为当时关注点，不作为现实事件证据。' },
    { n: 5, name: '反剧本、多重自我与创造转向', start: '2024-04', end: '2024-12', count: 28, active: 0,
      summary: '集中反对预设人生、单一人格和过度扮演，提出“所有时间的自己共同构成我”。年中用受挫—对策—实践重述高考后经历，后期把“创造”视为对抗空洞的重要来源，并开始记录 TouchDesigner、DAZ、URP 等工具工作流。',
      boundary: '“人格割裂”等是作者当时的比喻性语言，不作临床诊断。' },
    { n: 6, name: '反馈依赖与状态方法化', start: '2025-02', end: '2025-07', count: 15, active: 0,
      summary: '线上互动再次暴露“他人的主动是否证明我的价值”。删抖音、退游是明确的注意力调整；随后尝试把日常思维、状态复现、学习和跨赛道体验写成可重复的方法，而不只停留在情绪解释。',
      boundary: '方法多为当时设想，日志没有持续记录执行结果。' },
    { n: 7, name: '文学表达与认知僵化反思', start: '2025-08', end: '2025-12', count: 14, active: 0,
      summary: '表达从直接分析扩展到《月球漫步》《滤网》《静默信号》等小说：换环境不会自动消除旧问题，经验既保护人也可能成为滤网。同期继续处理关系投射、对认可的依赖，以及“分析者、吟诗者、强迫者如何重新组队”。',
      boundary: '命理与占卜转存仅是资料痕迹，不作为事实预测或人格依据。' },
    { n: 8, name: '旅程意识与自我珍视', start: '2026-04', end: '2026-05', count: 4, active: 0,
      summary: '以“五行切换”“无轨列车”和“幕启”为意象，明确想要的是持续探索的旅程，并第一次较完整地表达对自己的珍视。关系经验在此被看作打开可能性的事件，而不是唯一的人生意义。',
      boundary: '这是关系危机前的阶段性自述，不能反推后续问题已经解决。' },
    { n: 9, name: '关系断裂与超我外化', start: '2026-06-04', end: '2026-06-20', count: 20, active: 0,
      summary: '关系受挫后出现密集复盘，并把“严苛超我、价值外包、理智化替代行动”整理成法典、武器库和五分钟行动流程。最大进展是问题被外化为可观察机制；最大风险是大量内容来自 AI 对话转存，且分析本身仍可能继续替代现实行动。',
      boundary: 'AI 的心理学措辞不是诊断；出现强烈不真实感的记录也只说明当时体验。' },
    { n: 10, name: '技能现实检验与长期主义', start: '2026-06-21', end: '2026-07', count: 18, active: 0,
      summary: '面试、实习与考试把注意力拉回现实能力：UE/C++、蓝图、Gameplay Ability、GC、对象池和 UMG 等差距被具体列出。7 月下旬的岗位报告显示排名 64/1552、超过 95.88% 竞争者，同时日志仍要求对照他人作品集继续看远；“ELSE”被重新解释为经历、长期、深耕、进化，沟通截图则反思把争吵当成解决问题的惯性。随后把长期主义从“长期高压”改写为波动后的恢复、调整和重建秩序。',
      boundary: '职业兴趣已更具体，但尚未等于稳定职业选择。' },
    { n: 11, name: '判断方式与职业坐标', start: '2026-08', end: null, count: 10, active: 1,
      summary: '家庭事件推动“不要把万千因果强压成单一答案”的判断修正；《真恶》到《随记》记录了从强行定性转向容纳复杂性的变化。10 月进一步识别“用挑战回避判断”，并把职业问题聚焦为主动选择、拒绝与可检验产出。',
      boundary: '60 天方案来自 AI 评估，属于待验证计划；是否形成职业主线需以后续行动证据判断。' }
  ],
  /* 2026 年逐月日志数（磁盘实际清点：01–10 月） */
  monthly: {
    months:    ['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07','2026-08','2026-09','2026-10'],
    logs:      [0, 0, 0, 1, 3, 27, 11, 6, 2, 2],
    actions:   [0, 0, 0, 0, 0, 0, 1, 2, 1, 2],
    judgments: [0, 0, 0, 0, 0, 0, 1, 1, 1, 2]
  },
  /* 四象限：2026-10-01 为《human3.0建议》原始评估值；
     其余三点按该阶段日志内容回溯判定（inferred=1，界面标注）。 */
  snapshots: [
    { taken_at: '2026-05-03', scores: { '职业': 1, '身体': 1.5, '精神': 2, '心智': 1.5 }, inferred: 1 },
    { taken_at: '2026-06-16', scores: { '职业': 1, '身体': 1, '精神': 1.5, '心智': 1.8 }, inferred: 1 },
    { taken_at: '2026-08-20', scores: { '职业': 1, '身体': 1.5, '精神': 2, '心智': 2.0 }, inferred: 1 },
    { taken_at: '2026-10-01', scores: { '职业': 1, '身体': 1.5, '精神': 2, '心智': 2.2 }, inferred: 0 }
  ],
  stages: [
    { name: '判断方式与职业坐标', purpose: '把技术挑战收束为职业主线，用选择、拒绝和可检验产出训练判断', start_date: '2026-08-01', end_date: null, conclusion: null, is_active: 1 },
    { name: '技能现实检验与长期主义', purpose: '用面试、考试和具体技术差距检验能力，并建立可恢复的长期节奏', start_date: '2026-06-21', end_date: '2026-07-31', conclusion: '长期主义是波动后恢复并重建秩序', is_active: 0 },
    { name: '关系断裂与超我外化', purpose: '把自我审判外化成可观察流程，同时防止分析继续替代行动', start_date: '2026-06-04', end_date: '2026-06-20', conclusion: '机制被看见，但执行仍需要现实证据', is_active: 0 },
    { name: '旅程意识与自我珍视', purpose: '从固定轨道转向探索，并把自我珍视放在关系反馈之前', start_date: '2026-04-01', end_date: '2026-05-31', conclusion: '想要的是旅程，而不是被单一答案困住', is_active: 0 },
    { name: '文学表达与认知僵化反思', purpose: '用小说和隐喻处理旧问题、经验滤网与完美秩序', start_date: '2025-08-01', end_date: '2025-12-31', conclusion: '换环境不会自动解决旧问题，经验也可能限制新判断', is_active: 0 },
    { name: '反馈依赖与状态方法化', purpose: '识别认可依赖，并把注意力、状态与学习转成可重复方法', start_date: '2025-02-01', end_date: '2025-07-31', conclusion: '出现具体调整，但方法执行缺少持续记录', is_active: 0 },
    { name: '反剧本、多重自我与创造转向', purpose: '停止用单一角色统治生活，恢复创造与多种可能性', start_date: '2024-04-01', end_date: '2024-12-31', conclusion: '创造成为对抗空洞的重要线索', is_active: 0 },
    { name: '大学适应与主动性训练', purpose: '在社交、舞台、班委和辩论中练习主动争取与边界', start_date: '2023-08-01', end_date: '2024-03-31', conclusion: '开始区分经验不足与人格否定', is_active: 0 },
    { name: '叙事回归与人生转场', purpose: '从理论回到记忆与写作，完成高中结束后的叙事重组', start_date: '2022-08-01', end_date: '2023-07-31', conclusion: '高中被重述为多种性格模式的实验场', is_active: 0 },
    { name: '理论化观察与道德审判', purpose: '借心理学框架解释校园舆论、自我压抑和关系困惑', start_date: '2020-11-01', end_date: '2021-06-30', conclusion: '分析能力形成，同时伴随强烈道德化与过度推断', is_active: 0 },
    { name: '记录载体的试探', purpose: '试用日志记录问题与瞬间', start_date: '2016-09-01', end_date: '2017-01-31', conclusion: '样本不足，尚无稳定主题', is_active: 0 }
  ],
  actions: [
    { id: 1, content: '写定职业架构句第一版', source_log_id: null, created_at: '2026-10-01 09:00:00',
      done_at: '2026-10-01 21:30:00', evidence: '已写入 human3.0建议 日志' },
    { id: 2, content: '按新架构句投出第一批 3 个岗位', source_log_id: null, created_at: '2026-10-02 09:00:00',
      done_at: null, evidence: null }
  ],
  judgments: [
    { id: 1, question: '图形学渲染管线是否值得作为三年主线？', decision: '是，收敛到渲染管线',
      basis: 'TouchDesigner/Shader/Unity 的迁移经验都指向同一方向', predicted: '三个月内能独立完成一个最小管线 demo',
      actual: null, outcome: null, lesson: null, created_at: '2026-10-01 10:00:00' }
  ]
};

/* ============ SVG 图表工具 ============ */
const esc = s => String(s).replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const C_LOG = 'rgba(255,255,255,.38)', C_ACT = '#8FA3BF', C_JDG = '#B39A7D',
      C_NOW = '#D8B47A', C_TXT = '#6E6E73', C_GRID = 'rgba(255,255,255,.07)';

/* ---- 年度刻度尺 ----
 * 一年一格；months 由磁盘 153 篇日志逐月清点得出。
 * events / summary 重新对照全部 TXT、评论、已有 OCR 与本地图片核验；
 * 2018、2019 没有记录，因此只说明数据空白，不推断当年状态。 */
const YEARS = [
  { y: 2016, months: [0,0,0,0,0,0,0,0,1,0,0,0],
    events: ['09-16《什么是日志》：正文只有“不知道”'],
    summary: '全年仅 1 篇、正文极短。能够确认的只有：开始试用日志载体，并把对“日志是什么”的疑问本身记录下来；没有足够材料概括心理状态或生活主题。' },
  { y: 2017, months: [1,0,0,0,0,0,0,0,0,0,0,0],
    events: ['01-31《日志是不是就是日记?》：正文记录“下雪了”，并有一条简短互动'],
    summary: '全年仅 1 篇。标题继续询问日志与日记的关系，但正文已经是在保存一个天气瞬间；它更像从“测试形式”迈向“记录生活”的微小尝试，仍不足以证明已形成习惯。' },
  { y: 2018, months: [0,0,0,0,0,0,0,0,0,0,0,0], events: [], summary: '资料中没有 2018 年日志。空白只表示当前语料缺记录，不等于这一年没有重要经历。' },
  { y: 2019, months: [0,0,0,0,0,0,0,0,0,0,0,0], events: [], summary: '资料中没有 2019 年日志。无法从现有文件可靠重建这一年的状态或事件。' },
  { y: 2020, months: [0,0,0,0,0,0,0,0,0,0,2,1],
    events: ['11-29《自我初步的探索》：用考试、进店和异性交往三个案例分析紧张与回避',
             '11-29《舆论传播者动机的探讨》：把校园舆论解释为找乐子、攻击驱力与学习自卑的补偿',
             '12-26《U》：意识到“全视角观察”不可能，同时讨论压抑性格与接纳阴影'],
    summary: '停笔近三年后以 3 篇长记录重启。写法从生活片段直接跳到理论建模：用马斯洛、阿德勒与荣格解释自身紧张、校园舆论和被压抑的欲望。分析能力开始成形，但对他人动机的推断较强，也把“阴暗面”置于沉重的道德框架中。' },
  { y: 2021, months: [3,2,1,0,0,1,0,0,0,0,0,0],
    events: ['01-02《2021了，感谢526。》：借“暗影”讨论嫉妒、攻击与人格外衣',
             '01-15《心声与心声》：用双声部对话呈现自责、逃避与自我安慰',
             '02-13《怀疑焦虑滞留瓶颈》：开始质疑把两套理论混用的可靠性',
             '06-19 无标题日志：批评把心理学当作伤人、PUA 或逐利工具'],
    summary: '全年 7 篇。年初仍试图彻底识别并矫正“阴暗面”，把嫉妒、攻击与关系焦虑解释成人格问题；随后逐渐暴露理论之间的矛盾，并在年中转向反思心理学应如何被使用。变化不是“问题被解决”，而是从确信模型转向开始质疑模型及其伦理后果。' },
  { y: 2022, months: [0,0,0,0,0,0,0,1,0,1,0,0],
    events: ['2022-08-04《殊途》——"两个源头都是自己"',
             '2022-10-23《不知为何开始喜欢写日志》——把日志视为给特定的人、也给未来的自己看的长期媒介'],
    summary: '全年只有 2 篇，但写法发生转向：不再主要为他人建立动机模型，而是承认怀念、投射、遗憾和自己的责任；也回看了为改变性格而高强度阅读心理学的经历。日志开始同时承担情感保存、给未来自己留信和与特定对象间接交流的功能。' },
  { y: 2023, months: [0,0,0,0,0,1,2,4,3,7,2,2],
    events: ['06—08 月：高考结束、失常发挥、专业调剂与身体不适，原有目标被迫重置',
             '07-05《高中的收获与总结》：把高中称为“实验场”，回看多种性格模式与自由边界',
             '09 月：重新讨论情绪、投射、阅读输入与学习',
             '10—12 月：围绕排练、舞台、班委、辩论、宿舍关系和社交主动性密集记录'],
    summary: '全年 21 篇，记录密度首次显著上升。上半年完成高中叙事的收束，下半年进入大学适应：注意力从“我为什么这样”移到“机会怎样主动争取、能力怎样练出来、边界怎样维护”。但地位感、他人回应和失败经历仍频繁被用来评价自我，旧理论也继续被套用于大学社交。' },
  { y: 2024, months: [0,2,7,4,3,5,4,0,1,4,5,2],
    events: ['02—03 月：处理宿舍边界、转专业后的失衡，并强调自己不是单一时刻或单一角色',
             '04—06 月：连续写“剧本”“既定预谋”“忒修斯之船”，反对预设道路和单一人格',
             '06-09 年度复盘：把高考后经历概括为受挫、提出对策、实践和扩大世界',
             '09—12 月：从大学生活回望转向创造、软件工作流与对机械生活的反抗'],
    summary: '全年 37 篇。最稳定的主线不是简单的“寻找真实”，而是反对由某个角色、过去经验或预设剧本独占全部生活；“所有时间的自己共同构成我”成为新的整合方式。年中仍以心理理论回看变化，后期则更明确地把创造与工具实践视为恢复生命感的来源。文本中的“割裂”主要是自我比喻，不应被读成诊断。' },
  { y: 2025, months: [0,1,4,5,0,2,4,1,2,5,3,2],
    events: ['03 月：一次线上互动触发“别人的主动是否代表我的价值”，随后删抖音、退出王者',
             '04—07 月：尝试把日常思考、状态复现、跨赛道体验和学习写成方法',
             '09 月《工作1》：以跨领域经历和城市想象讨论工作与改变',
             '10—11 月：关系投射、自我整合与“经验僵化”成为重点，并创作三篇完整小说',
             '12 月：保存命理 AI 文本与梦境聊天截图，但这些只作为资料痕迹'],
    summary: '全年 29 篇。前半年的核心是反馈依赖与注意力管理：从线上互动中识别认可焦虑，并做出删抖音、退游等具体调整；年中尝试把状态与学习经验方法化。后半年转向文学表达，《月球漫步》《滤网》《静默信号》共同讨论旧问题随环境迁移、经验既保护又限制、完美秩序压制探索。命理内容不纳入事实判断。' },
  { y: 2026, months: [0,0,0,1,3,27,11,6,2,2,0,0],
    events: ['04—05 月：以五行、无轨列车和“幕启”表达旅程意识与自我珍视',
             '06-04—06-20：关系受挫后密集复盘，把严苛自我审判外化成“超我 Skill”和五分钟行动流程',
             '06-21—07 月：面试、考试与实习准备暴露 UE/C++、蓝图、GA、GC、对象池、UMG 等具体差距',
             '07-22—07-24：岗位竞争力报告显示 64/1552；“ELSE”被拆为经历、长期、深耕、进化；开始反思用争吵强行解决问题的沟通惯性',
             '07-26《长期主义》：把长期主义定义为波动后的恢复、调整与重建秩序',
             '08—09 月：家庭事件、旧关系回看、从“真恶”到“水映万象”的判断方式修正',
             '10-01《本质》《human3.0建议》：识别“用挑战回避判断”，把职业问题聚焦到选择、拒绝与市场验证'],
    summary: '截至 10 月共有 52 篇，其中 6 月 27 篇，是全语料最密集的一年。变化可分五段：先确认探索与自我珍视；关系危机后用 AI 对话和 Skill 文档外化内在审判；随后被面试与考试拉回具体能力；再把长期主义改写为可恢复的节奏；最后把“强行得出答案”修正为容纳复杂性，并把职业困境命名为“用挑战回避判断”。需要保留两条边界：大量 6 月文本是 AI 回答转存，不等于诊断；10 月 60 天计划是待验证方案，不是已完成成果。' }
];

let SELECTED_YEAR = null;
const yearTotal = d => d.months.reduce((a, b) => a + b, 0);

/* 年度刻度尺：一年一格，柱高与篇数成正比 */
function renderYearRuler(container, data) {
  const W = Math.max(760, Math.min(1560, container.clientWidth - 40)), H = 176;
  const padL = 20, padR = 20;
  const seg = (W - padL - padR) / data.length;
  const base = H - 52;
  const max = Math.max(...data.map(yearTotal));

  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`;
  s += `<line x1="${padL}" y1="${base}" x2="${W - padR}" y2="${base}"
          stroke="rgba(255,255,255,.22)"/>`;

  data.forEach((d, i) => {
    const total = yearTotal(d);
    const cx = padL + seg * i + seg / 2;
    const sel = d.y === SELECTED_YEAR;
    const col = total ? (sel ? C_NOW : 'rgba(143,163,191,.7)') : 'rgba(255,255,255,.16)';
    const h = total ? 18 + (total / max) * 72 : 7;

    for (let k = 1; k <= 3; k++) {   // 四分之一细刻度
      const xq = padL + seg * i + seg * k / 4;
      s += `<line x1="${xq}" y1="${base}" x2="${xq}" y2="${base - 5}"
              stroke="rgba(255,255,255,.10)"/>`;
    }
    s += `<line x1="${cx}" y1="${base}" x2="${cx}" y2="${base - h}" stroke="${col}"
            stroke-width="${sel ? 2.4 : 1.6}"${total ? '' : ' stroke-dasharray="2 3"'}/>`;
    if (total)
      s += `<circle cx="${cx}" cy="${base - h}" r="${sel ? 3.6 : 2.6}" fill="${col}"/>`;
    s += `<text x="${cx}" y="${H - 28}" font-size="12" text-anchor="middle"
            fill="${sel ? '#F5F5F7' : (total ? '#A1A1A6' : '#6E6E73')}">${d.y}</text>` +
         `<text x="${cx}" y="${H - 11}" font-size="10" text-anchor="middle"
            fill="#6E6E73">${total ? total + ' 篇' : '无记录'}</text>`;
    s += `<rect x="${padL + seg * i}" y="0" width="${seg}" height="${H}"
            class="yr-hit" data-y="${d.y}"/>`;
  });

  s += '</svg>';
  container.innerHTML = s;
}

/* 年份详情：大事件 + 年度总结 + 该年逐月分布 */
function renderYearDetail(year) {
  const el = $('#yearDetail');
  if (!year) {
    el.innerHTML = '<div class="k">点击上方任意年份，查看该年的大事件与年度总结。</div>';
    return;
  }
  const d = YEARS.find(x => x.y === year);
  const total = yearTotal(d);
  if (!total) {
    el.innerHTML = `<div class="yd-h"><b>${d.y}</b><span class="badge">没有记录</span></div>
      <p class="yd-sum" style="margin-top:10px">${esc(d.summary || '这一年没有留下任何日志，也没有可确认的大事件。')}</p>`;
    return;
  }
  const mMax = Math.max(1, ...d.months);
  const bars = d.months.map((c, i) => `<span class="mb${c ? '' : ' zero'}"
      style="height:${c ? 6 + (c / mMax) * 40 : 3}px"
      title="${i + 1} 月 · ${c} 篇"></span>`).join('');
  const monthsLabel = d.months.map((c, i) => c ? `${i + 1}月` : null)
    .filter(Boolean).join(' · ');

  el.innerHTML = `
    <div class="yd-h"><b>${d.y}</b><span class="badge">${total} 篇日志</span>
      <span class="yd-span">有记录月份：${monthsLabel}</span></div>
    <div class="mb-row">${bars}</div>
    <div class="yd-sec">大事件</div>
    <ul class="yd-ev">${d.events.map(e => `<li>${esc(e)}</li>`).join('')}</ul>
    <div class="yd-sec">年度总结</div>
    <p class="yd-sum">${esc(d.summary)}</p>`;
}

/* 分组柱状图：动态数量 */
function renderBarChart(container, monthly) {
  const { months, logs, actions, judgments } = monthly;
  const W = Math.max(560, container.clientWidth - 44), H = 190;
  const padL = 26, padB = 26, padT = 12;
  const max = Math.max(4, ...logs, ...actions, ...judgments);
  const gw = (W - padL - 12) / months.length;
  const barW = Math.min(10, (gw - 10) / 3);
  const y = v => padT + (H - padT - padB) * (1 - v / max);
  let s = `<svg viewBox="0 0 ${W} ${H}">`;
  // 横网格 + 刻度
  for (let v = 0; v <= max; v += Math.ceil(max / 4)) {
    s += `<line x1="${padL}" y1="${y(v)}" x2="${W - 8}" y2="${y(v)}" stroke="${C_GRID}"/>` +
         `<text x="${padL - 6}" y="${y(v) + 3}" font-size="9" fill="${C_TXT}" text-anchor="end">${v}</text>`;
  }
  months.forEach((m, i) => {
    const cx = padL + gw * i + gw / 2;
    const g = [
      [logs[i], C_LOG, '日志'], [actions[i], C_ACT, '动作'], [judgments[i], C_JDG, '判断']
    ];
    g.forEach(([v, col, name], j) => {
      if (!v) return;
      const bx = cx - (barW * 3 + 6) / 2 + j * (barW + 3);
      s += `<rect x="${bx}" y="${y(v)}" width="${barW}" height="${H - padB - y(v)}"
              rx="2" fill="${col}"><title>${m} · ${name} ${v}</title></rect>`;
    });
    s += `<text x="${cx}" y="${H - 8}" font-size="9.5" fill="${C_TXT}"
            text-anchor="middle">${m.slice(5)}月</text>`;
  });
  s += '</svg>';
  container.innerHTML = s;
}

/* 折线图：状态变化（快照） */
function renderLineChart(container, snaps, legendEl) {
  if (legendEl) {
    const colors = ['#F5F5F7', C_ACT, C_JDG, '#7FA08A'];
    const dims = Object.keys(snaps[0]?.scores || {});
    legendEl.innerHTML = dims.map((d, i) =>
      `<span><i style="background:${colors[i % 4]}"></i>${esc(d)}</span>`).join('');
  }
  const W = Math.max(560, container.clientWidth - 44), H = 200;
  const padL = 30, padB = 26, padT = 14;
  const maxV = 3;
  const n = snaps.length;
  const x = i => padL + (n === 1 ? 0 : (W - padL - 30) * i / (n - 1));
  const y = v => padT + (H - padT - padB) * (1 - v / maxV);
  let s = `<svg viewBox="0 0 ${W} ${H}">`;
  for (let v = 0; v <= maxV; v++) {
    s += `<line x1="${padL}" y1="${y(v)}" x2="${W - 24}" y2="${y(v)}" stroke="${C_GRID}"/>` +
         `<text x="${padL - 6}" y="${y(v) + 3}" font-size="9" fill="${C_TXT}" text-anchor="end">L${v}</text>`;
  }
  const dims = Object.keys(snaps[0]?.scores || {});
  const colors = ['#F5F5F7', C_ACT, C_JDG, '#7FA08A'];
  dims.forEach((d, di) => {
    const pts = snaps.map((sn, i) => [x(i), y(sn.scores[d] || 0)]);
    const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    s += `<path d="${path}" fill="none" stroke="${colors[di % 4]}" stroke-width="1.6"
            opacity=".85" stroke-linejoin="round"/>`;
    pts.forEach((p, i) => {
      s += `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="${colors[di % 4]}">` +
           `<title>${snaps[i].taken_at} · ${d} L${snaps[i].scores[d]}</title></circle>`;
    });
  });
  snaps.forEach((sn, i) => {
    s += `<text x="${x(i)}" y="${H - 8}" font-size="9.5" fill="${C_TXT}"
            text-anchor="middle">${sn.taken_at.slice(5)}</text>`;
  });
  s += '</svg>';
  container.innerHTML = s;
}

/* ============ 数据加载 ============ */
async function loadStats() {
  let s;
  try { s = await api('/api/stats'); } catch { markOffline(); s = DEMO.stats; }
  $('#stLogs').textContent = s.logs || '—';
  $('#stAct').textContent = s.actions.total
    ? Math.round(s.actions.done * 100 / s.actions.total) + '%' : '—';
  $('#stHit').textContent = s.judgments.evaluated
    ? Math.round(s.judgments.hits * 100 / s.judgments.evaluated) + '%' : '—';
  $('#stSmp').textContent = s.judgments.evaluated || '—';
  $('#stageCard').innerHTML = s.stage
    ? `<div class="k">当前阶段</div>
       <div style="font-size:18px;font-weight:600;margin-top:6px">${esc(s.stage.name)}
         <span class="badge">进行中</span></div>
       <div class="k" style="margin-top:6px">${esc(s.stage.purpose)}</div>`
    : `<div class="k">当前阶段</div>
       <div style="font-size:18px;font-weight:600;margin-top:6px">未设立</div>
       <div class="k" style="margin-top:6px">阶段是一段时间内的一条主线，给它一个名字和一个目的。</div>`;
  $('#recent').innerHTML = s.recent.map(r =>
    `<li><span>${esc(r.text)}</span><span class="d">${(r.d || '').slice(0, 10)}</span></li>`).join('')
    || '<li>还没有记录。导入历史日志后，这里会出现第一条时间线。</li>';
}

const h = new Date().getHours();
$('#greet').textContent = h < 12 && h >= 5 ? '早上好' : h < 18 ? '下午好' : '晚上好';

/* ---- 时间轴 ---- */
let ALL_LOGS = null;
async function fetchLogs() {
  if (ALL_LOGS) return ALL_LOGS;
  try {
    ALL_LOGS = await api('/api/logs?limit=100000');
  } catch {
    markOffline();
    ALL_LOGS = Object.entries(DEMO.logs).flatMap(([y, items]) =>
      items.map(([md, title]) => ({ date: `${y}-${md}-01`, title, category: '洞察' })));
  }
  return ALL_LOGS;
}

async function loadTimeline() {
  // 年度刻度尺：一年一格，点击查看该年大事件与年度总结
  renderYearRuler($('#yearRuler'), YEARS);
  renderYearDetail(SELECTED_YEAR);

  // 纵向明细列表
  const logs = await fetchLogs();
  const years = [...new Set(logs.map(l => l.date.slice(0, 4)))].sort().reverse();
  const sel = $('#yearSel');
  if (!sel.options.length)
    sel.innerHTML = '<option value="">全部</option>' +
      years.map(y => `<option>${y}</option>`).join('');
  sel.onchange = () => renderList(sel.value);
  function renderList(y) {
    const list = y ? logs.filter(l => l.date.startsWith(y)) : logs;
    const byYear = {};
    list.forEach(l => (byYear[l.date.slice(0, 4)] ||= []).push(l));
    $('#timeline').innerHTML = Object.keys(byYear).sort().reverse().map(y =>
      `<div class="y">${y} · ${byYear[y].length} 篇</div>` +
      byYear[y].map(l =>
        `<a>${l.date.slice(5, 10)}　${esc(l.title)}<span class="tag">${esc(l.category)}</span></a>`).join('')
    ).join('') || '<div class="k">暂无日志，点击右上角"导入日志清单"。</div>';
  }
  renderList(sel.value || '');
}

/* 刻度尺点击：切换年份详情 */
document.addEventListener('click', e => {
  const hit = e.target.closest('.yr-hit'); if (!hit) return;
  SELECTED_YEAR = +hit.dataset.y;
  renderYearRuler($('#yearRuler'), YEARS);
  renderYearDetail(SELECTED_YEAR);
});

/* 窗口尺寸变化时重绘刻度尺（防抖） */
let _rsz;
window.addEventListener('resize', () => {
  clearTimeout(_rsz);
  _rsz = setTimeout(() => {
    if ($('#p-timeline')?.classList.contains('on'))
      renderYearRuler($('#yearRuler'), YEARS);
  }, 200);
});

$('#btnImport').onclick = async () => {
  try {
    const r = await api('/api/import', { b: {} });
    alert(r.imported ? `已导入 ${r.imported} 条` : '导入失败：' + (r.error || '未知错误'));
    ALL_LOGS = null; loadTimeline();
  } catch {
    markOffline();
    alert('后端未启动，无法导入。请先运行 node server.js');
  }
};

/* ---- 阶段 ---- */
async function loadStages() {
  let list;
  try { list = await api('/api/stages'); } catch { markOffline(); list = DEMO.stages; }

  // 汇总卡（与总览页统一走 stats 聚合，避免离线演示口径不一致）
  let st;
  try { st = await api('/api/stats'); } catch { st = DEMO.stats; }
  const stageTotal = OFFLINE ? DEMO.stageBands.length : list.length;
  $('#stageStats').innerHTML = [
    ['阶段总数', stageTotal], ['进行中', list.filter(s => s.is_active).length],
    ['动作闭环', `${st.actions.done} / ${st.actions.total}`],
    ['判断命中', st.judgments.evaluated
      ? Math.round(st.judgments.hits * 100 / st.judgments.evaluated) + '%' : '—']
  ].map(([k, v]) => `<div class="card" data-glass>
      <div class="k">${k}</div><div class="v" style="font-size:22px">${v}</div></div>`).join('');

  // 动态数量：离线时用 DEMO.monthly（磁盘清点的真实值），在线时从库现算
  let acts, jdgs, snaps, monthly;
  try { acts = await api('/api/actions'); } catch { acts = DEMO.actions; }
  try { jdgs = await api('/api/judgments'); } catch { jdgs = DEMO.judgments; }
  try {
    snaps = (await api('/api/snapshots')).map(x =>
      ({ taken_at: x.taken_at, scores: typeof x.scores === 'string' ? JSON.parse(x.scores) : x.scores }));
  } catch { snaps = DEMO.snapshots; }

  monthly = OFFLINE ? DEMO.monthly : buildMonthly(acts, jdgs, await fetchLogs());
  renderBarChart($('#chartMonthly'), monthly);

  // 状态变化（标注哪些点为回溯判定）
  renderLineChart($('#chartSnapshot'), snaps, $('#snapLegend'));

  // 发展阶段模型（按全部日志与图片重新核验）
  $('#stageTheory').innerHTML = DEMO.stageBands.map(b => `
    <div class="stg">
      <div class="stg-h">
        <span class="stg-n">${b.n}</span>
        <b>${esc(b.name)}</b>
        <span class="stg-t">${b.start} → ${b.end || '进行中'}</span>
        <span class="stg-c">${b.count} 篇</span>
      </div>
      <div class="stg-th"><b>阶段总结：</b>${esc(b.summary)}</div>
      <div class="stg-th stg-boundary"><b>证据边界：</b>${esc(b.boundary)}</div>
    </div>`).join('');

  $('#stageList').innerHTML = list.map(s => `<div class="card wide">
    <div style="display:flex;justify-content:space-between">
      <b>${esc(s.name)}</b>
      <span class="badge">${s.is_active ? '进行中' : '已结束'}</span></div>
    <div class="k" style="margin-top:6px">${esc(s.purpose || '')}</div>
    <div class="k" style="margin-top:6px">${s.start_date || ''} → ${s.end_date || '至今'}
      ${s.conclusion ? '　结论：' + esc(s.conclusion) : ''}</div>
  </div>`).join('');
}

/* 由动作/判断/日志记录现算逐月分布 */
function buildMonthly(acts, jdgs, logs) {
  const months = DEMO.monthly.months.slice();
  const cnt = (arr, key) => months.map(m =>
    arr.filter(x => (x[key] || '').slice(0, 7) === m).length);
  return {
    months,
    logs: months.map(m => (logs || []).filter(l => l.date.slice(0, 7) === m).length),
    actions: cnt(acts, 'created_at'),
    judgments: cnt(jdgs, 'created_at')
  };
}

$('#stAdd').onclick = async () => {
  if (!$('#stName').value) return;
  try {
    await api('/api/stages', { b: { name: $('#stName').value, purpose: $('#stPurpose').value } });
    $('#stName').value = $('#stPurpose').value = '';
    loadStages();
  } catch {
    markOffline();
    alert('后端未启动，无法保存。请先运行 node server.js');
  }
};

/* ---- 动作 ---- */
async function loadActions() {
  let list;
  try { list = await api('/api/actions'); } catch { markOffline(); list = DEMO.actions; }
  $('#actionList').innerHTML = list.map(a => `<div class="card wide">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span>${esc(a.content)}</span>
      <span style="display:flex;gap:8px;align-items:center">
        ${a.done_at ? `<span class="badge">已闭环</span>` :
          `<button class="btn" data-done="${a.id}">标记完成</button>`}
        <span class="d">${(a.created_at || '').slice(0, 10)}</span></span></div>
    ${a.done_at ? `<div class="k" style="margin-top:6px">痕迹：${esc(a.evidence || '未填写')}</div>` : ''}
  </div>`).join('');
  $('#actionList').onclick = async e => {
    const id = e.target.dataset.done; if (!id) return;
    const evidence = prompt('可见痕迹（链接/截图说明/结果一句话）：') || '';
    try {
      await api('/api/actions/' + id, { m: 'PATCH', b: { done: true, evidence } });
      loadActions(); loadStats();
    } catch { markOffline(); alert('后端未启动，无法保存。'); }
  };
}

$('#acAdd').onclick = async () => {
  if (!$('#acContent').value) return;
  try {
    await api('/api/actions', { b: {
      content: $('#acContent').value, source_log_id: $('#acSource').value || null } });
    $('#acContent').value = $('#acSource').value = '';
    loadActions();
  } catch { markOffline(); alert('后端未启动，无法保存。请先运行 node server.js'); }
};

/* ---- 判断 ---- */
async function loadJudgments() {
  let list;
  try { list = await api('/api/judgments'); } catch { markOffline(); list = DEMO.judgments; }
  $('#jdList').innerHTML = list.map(j => `<div class="card wide">
    <b>${esc(j.question)}</b><span class="badge" style="margin-left:10px">${esc(j.outcome || '待回填')}</span>
    <div class="k" style="margin-top:8px">决定：${esc(j.decision || '—')}</div>
    <div class="k">预测：${esc(j.predicted || '—')}</div>
    ${j.actual ? `<div class="k">实际：${esc(j.actual)}</div>
    <div class="k">教训：${esc(j.lesson || '—')}</div>` :
    `<div style="margin-top:8px"><button class="btn" data-jd="${j.id}">回填结果</button></div>`}
  </div>`).join('');
  $('#jdList').onclick = async e => {
    const id = e.target.dataset.jd; if (!id) return;
    const actual = prompt('实际发生了什么？') || '';
    const outcome = prompt('结果（对 / 部分 / 错）：') || '';
    const lesson = prompt('眼睛校准了什么？') || '';
    try {
      await api('/api/judgments/' + id, { m: 'PATCH', b: { actual, outcome, lesson } });
      loadJudgments(); loadStats();
    } catch { markOffline(); alert('后端未启动，无法保存。'); }
  };
}

$('#jdAdd').onclick = async () => {
  if (!$('#jdQ').value) return;
  try {
    await api('/api/judgments', { b: {
      question: $('#jdQ').value, decision: $('#jdD').value, predicted: $('#jdP').value } });
    $('#jdQ').value = $('#jdD').value = $('#jdP').value = '';
    loadJudgments();
  } catch { markOffline(); alert('后端未启动，无法保存。请先运行 node server.js'); }
};

/* ---- 导航 ---- */
$('#nav').addEventListener('click', e => {
  const btn = e.target.closest('button'); if (!btn) return;
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b === btn));
  document.querySelectorAll('.page').forEach(p =>
    p.classList.toggle('on', p.id === 'p-' + btn.dataset.p));
  ({ timeline: loadTimeline, stages: loadStages, actions: loadActions,
     judgments: loadJudgments }[btn.dataset.p] || (() => {}))();
});

/* ---- 启动 ---- */
loadStats();

/* ---- 烟雾视差 ---- */
const smoke = document.getElementById('smoke');
document.addEventListener('mousemove', e => {
  const x = (e.clientX / innerWidth - .5) * 14, y = (e.clientY / innerHeight - .5) * 10;
  smoke.style.transform = `translate(${x}px,${y}px)`;
});
