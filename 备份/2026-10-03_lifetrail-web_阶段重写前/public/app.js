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
    f.textContent = 'v0.2 · 离线演示（启动 node server.js 接入真实数据）';
  }
}

/* ---- 演示数据（后端不可用时） ---- */
const DEMO = {
  stats: {
    logs: 153,
    actions: { total: 11, done: 3 },
    judgments: { total: 8, evaluated: 8, hits: 5 },
    stage: {
      name: '职业定位 60 天', purpose: '从"被筛选"变成"有明确坐标的人"。挑战不等于选择，选择是关掉其他的门。'
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
  /* 阶段带：边界严格取自《AI问答与个人助手知识库分析.md》§4.1—4.7，
     count 为磁盘 153 篇日志的实际清点数；theory 为对应的发展心理学框架。 */
  stageBands: [
    { n: 1, name: '日志形式的试探', start: '2016-09', end: '2017-01', count: 2, active: 0,
      theory: '前叙事期：只有“什么是日志”“日志是不是日记”等形式性尝试，未形成稳定主题。' },
    { n: 2, name: '心理学框架与暗影探索', start: '2020-11', end: '2021-06', count: 10, active: 0,
      theory: '马斯洛需求层次 · 阿德勒自卑与补偿 · 荣格阴影。用理论解释校园舆论与自我压抑，但自我分析带强烈道德判断。' },
    { n: 3, name: '回到记忆、关系与写作', start: '2022-08', end: '2022-10', count: 2, active: 0,
      theory: '叙事认同（McAdams）：承认怀念与投射，把经验组织成可讲述的自我故事；开始反思“为改变性格而高强度读心理学”。' },
    { n: 4, name: '高中结束与主动性课题', start: '2023-06', end: '2023-12', count: 21, active: 0,
      theory: '埃里克森同一性获得 · 可能自我（Markus & Nurius）。从“理解为什么”转向“我要主动争取什么”，旧焦虑仍把关系反馈读作自身价值。' },
    { n: 5, name: '多重自我与剧本意识', start: '2024-02', end: '2024-12', count: 37, active: 0,
      theory: '对话自我理论（Hermans）· 人生脚本（沟通分析）· 自我复杂性（Linville）。反对由单一剧本统治全部生活。' },
    { n: 6, name: '关系镜像与自我价值', start: '2025-02', end: '2025-12', count: 29, active: 0,
      theory: '依恋理论 · 自我价值条件性（Crocker & Wolfe）· 镜映（Winnicott）。删除抖音、退出游戏以恢复专注，并把体验记录成方法论。' },
    { n: 7, name: '关系危机、超我外化与职业主线', start: '2026-04', end: null, count: 52, active: 1,
      theory: '超我（Freud）· 理智化防御 · 自我决定论 SDT · 实施意图（Gollwitzer）。核心问题已表述为“用挑战回避判断”。' }
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
    { name: '关系危机、超我外化与职业主线', purpose: '把痛苦外化为可管理的系统；从被动经历转向判断与选择',
      start_date: '2026-04-01', end_date: null, conclusion: null, is_active: 1 },
    { name: '关系镜像与自我价值', purpose: '处理“被回应是否代表价值”；删抖音、退游以恢复专注',
      start_date: '2025-02-01', end_date: '2025-12-31', conclusion: '换环境不会自动解决旧问题', is_active: 0 },
    { name: '多重自我与剧本意识', purpose: '反对由单一剧本或固定人格统治全部生活',
      start_date: '2024-02-01', end_date: '2024-12-31', conclusion: '每个时刻只是多个自我的一部分', is_active: 0 },
    { name: '高中结束与主动性课题', purpose: '从“理解为什么”转向“我要主动争取什么”',
      start_date: '2023-06-01', end_date: '2023-12-31', conclusion: '旧焦虑仍把关系反馈读作自身价值', is_active: 0 },
    { name: '回到记忆、关系与写作', purpose: '承认怀念与投射，反思为改变性格而高强度读心理学',
      start_date: '2022-08-01', end_date: '2022-10-31', conclusion: '两个源头都是自己', is_active: 0 },
    { name: '心理学框架与暗影探索', purpose: '用马斯洛、阿德勒、荣格解释校园舆论与自我压抑',
      start_date: '2020-11-01', end_date: '2021-06-30', conclusion: '自我分析带有强烈道德判断', is_active: 0 },
    { name: '日志形式的试探', purpose: '接触日志载体本身',
      start_date: '2016-09-01', end_date: '2017-01-31', conclusion: '未形成稳定主题', is_active: 0 }
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
 * 一年一格；months 由磁盘 153 篇日志逐月清点得出，
 * events / summary 取自《AI问答与个人助手知识库分析.md》§4.1–4.7。 */
const YEARS = [
  { y: 2016, months: [0,0,0,0,0,0,0,0,1,0,0,0],
    events: ['写下第一篇日志，内容是对"什么是日志"的形式性提问'],
    summary: '只留下一篇，问的是日志本身是什么。只能说明很早就接触了这个载体，还谈不上稳定主题。' },
  { y: 2017, months: [1,0,0,0,0,0,0,0,0,0,0,0],
    events: ['《日志是不是就是日记?》——仍在确认日志的性质与用途'],
    summary: '同样只有一篇。与 2016 年连起来看，属同一段形式性试探，尚未形成持续记录的习惯。' },
  { y: 2018, months: [0,0,0,0,0,0,0,0,0,0,0,0], events: [], summary: '' },
  { y: 2019, months: [0,0,0,0,0,0,0,0,0,0,0,0], events: [], summary: '' },
  { y: 2020, months: [0,0,0,0,0,0,0,0,0,0,2,1],
    events: ['2020-11-29《自我初步的探索》——引入马斯洛需求层次、自卑与补偿、《自卑与超越》'],
    summary: '停笔近三年后重新开始，一上来就是理论化的自我分析：用马斯洛和阿德勒的框架解释自己的处境，把自身与他人的行为拆成动机模型。' },
  { y: 2021, months: [3,2,1,0,0,1,0,0,0,0,0,0],
    events: ['2021-01-02《2021了，感谢526。》——引用荣格"暗影"，处理嫉妒与攻击性',
             '2021-01-15《心声与心声》——提出实验、观察与矫正计划'],
    summary: '全年 7 篇，是真正形成记录习惯的开始。核心张力：一方面渴望彻底理解自己和别人，另一方面害怕自身"阴暗面"会伤害重要的人。自我分析带强烈道德判断，容易把一次失败上升为人格问题。' },
  { y: 2022, months: [0,0,0,0,0,0,0,1,0,1,0,0],
    events: ['2022-08-04《殊途》——"两个源头都是自己"',
             '2022-10-23《不知为何开始喜欢写日志》——把日志视为给特定的人、也给未来的自己看的长期媒介'],
    summary: '只有两篇，方向却变了：从搭建分析体系转向承认怀念、投射与遗憾，并开始反思"为改变性格而高强度读心理学"这件事本身。' },
  { y: 2023, months: [0,0,0,0,0,1,2,4,3,7,2,2],
    events: ['高考、专业调剂、进入大学——生活场景整体切换',
             '2023-07-05《高中的收获与总结》——把高中称为"实验场"，总结多种性格模式与可能性',
             '关注点转向社交主动性、舞台经验、宿舍关系、班委与辩论'],
    summary: '篇数从个位数跳到 21。把高中重新叙述为"实验场"：学到多种性格模式，开始追求"无限的可能性"。关键变化是从"理解为什么"移向"我要主动争取什么"，但旧有焦虑仍会把关系反馈解释成自身价值。' },
  { y: 2024, months: [0,2,7,4,3,5,4,0,1,4,5,2],
    events: ['2024-03-28《劝诫论》——"你所代表的是所有时间的你的集合的形象"',
             '2024-06-09 复盘：把高考后的历程解释为"受挫 → 对策 → 实践"的扩张过程',
             '2024-11-05《太棒了》——开始接触 TouchDesigner、DAZ 等创造类工具'],
    summary: '全年 37 篇，记录密度第一次跃升。高频词是"剧本""割裂""身份扮演""真实"：反对由某个单一人格或提前安排好的道路统治全部生活。同时开始关注创造与软件工作流。' },
  { y: 2025, months: [0,1,4,5,0,2,4,1,2,5,3,2],
    events: ['2025-03-12《一线生机》、03-14《三天后》——线上关系与自我降温',
             '删除抖音、退出游戏——恢复专注的具体动作',
             '2025-10-29《写吧》——投射、依赖与自我价值外化',
             '2025-11-26《短篇二则》——转向文学创作'],
    summary: '亲密关系与线上互动再次触发"被回应是否代表价值"。删抖音、退游是这一年最具体的行动。同时开始把体验、状态与身份切换记录成方法论，后期转向创作，用月球、沙漠、绿洲等意象表达"换环境不会自动解决旧问题"。' },
  { y: 2026, months: [0,0,0,1,3,27,11,6,2,2,0,0],
    events: ['4—5 月：旅程与自我珍视——把生命理解为没有固定轨道的旅程',
             '6 月：关系受挫与"超我 Skills"——把痛苦解释为严苛超我、价值外包与分析替代行动',
             '6—7 月：从心理循环转向技能与职业——面试与实习准备暴露具体知识差距',
             '7—10 月：长期主义、价值观与职业选择',
             '2026-10-01《本质》——"挑战失败只否定我的手，判断失败否定我的眼"'],
    summary: '密度最高、变化最快的一年：52 篇接近此前三年的总和，其中 6 月单月 27 篇。可拆四段——4—5 月的旅程与自我珍视；6 月将痛苦外化为可管理的 Skill；6—7 月转向具体技能与职业；7—10 月把长期主义定义为"波动后恢复并重新建立秩序"。最新一篇已把核心问题表述为"挑战失败只否定手，判断失败否定眼"。' }
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
      <p class="k" style="margin-top:10px">这一年没有留下任何日志，也没有可确认的大事件。</p>`;
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

  // 发展阶段模型（七阶段 + 理论框架）
  $('#stageTheory').innerHTML = DEMO.stageBands.map(b => `
    <div class="stg">
      <div class="stg-h">
        <span class="stg-n">${b.n}</span>
        <b>${esc(b.name)}</b>
        <span class="stg-t">${b.start} → ${b.end || '进行中'}</span>
        <span class="stg-c">${b.count} 篇</span>
      </div>
      <div class="stg-th">${esc(b.theory)}</div>
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
