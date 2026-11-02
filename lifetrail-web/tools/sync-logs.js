#!/usr/bin/env node
'use strict';
/*
 * 日志自动同步：扫描 Qzone 备份目录，把库里没有的日志按库内格式落盘，
 * 并更新 数据/日志全量索引.json 与 public/stats.json。
 *
 * 用法：
 *   node lifetrail-web/tools/sync-logs.js --dry-run      # 只报告，不写文件
 *   node lifetrail-web/tools/sync-logs.js                # 只入库「比库内最新日期更新」的日志
 *   node lifetrail-web/tools/sync-logs.js --backfill     # 连同历史缺漏一起补
 *   node lifetrail-web/tools/sync-logs.js --source "<目录>"
 *
 * 去重：日期 + 去标点后的正文哈希；同日相似度 ≥ 0.85 视为同一篇。
 * 语义层（阶段总结 / 学习路线 / 评价）仍需人工或 AI 重跑，脚本只负责机械部分。
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const LOG_DIR = path.join(ROOT, '日志');
const INDEX_FILE = path.join(ROOT, '数据', '日志全量索引.json');
const WEB_DIR = path.join(ROOT, 'lifetrail-web');
const TOKEN_FILE = path.join(WEB_DIR, 'data', 'auth-token.txt');

const args = process.argv.slice(2);
const argOf = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const DRY = args.includes('--dry-run');
const BACKFILL = args.includes('--backfill');
const SOURCE = argOf('--source', path.join(process.env.USERPROFILE || '', 'Downloads', 'QQ空间备份', '日志'));

const pad = n => String(n).padStart(2, '0');
const norm = s => String(s || '').replace(/\r/g, '').replace(/\s+/g, '');
const stripPunct = s => String(s || '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
const digest = (date, body) => date + '|' + crypto.createHash('sha1').update(stripPunct(body).slice(0, 800)).digest('hex');

function parseTime(m) {
  return {
    date: `${m[1]}-${pad(m[2])}-${pad(m[3])}`,
    text: `${m[1]}-${pad(m[2])}-${pad(m[3])} ${pad(m[4])}:${pad(m[5])}:${pad(m[6] || 0)}`
  };
}

/* 源文件：标题 / 时间 / 正文：/ 评论：- Else (id)｜时间 + 内容 */
function parseSource(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').replace(/\r/g, '');
  const title = (raw.match(/^标题[：:]\s*(.+)$/m) || [])[1];
  const tm = raw.match(/^时间[：:]\s*(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/m);
  if (!tm) return null;
  const time = parseTime(tm);
  const body = (raw.split(/正文[：:]/)[1] || '').split(/评论[：:]/)[0].trim();
  if (!body) return null;
  const comments = [];
  let cur = null;
  for (const line of (raw.split(/评论[：:]/)[1] || '').split('\n')) {
    if (!line.trim()) continue;
    const head = line.match(/^-\s*(.+?)\s*[（(](\d+)[）)]\s*[｜|]\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(?::\d{2})?)/);
    if (head) {
      const rest = line.replace(/^-\s*.+?\s*[（(]\d+[）)]\s*[｜|]\s*\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(?::\d{2})?\s*/, '').trim();
      cur = { author: head[1].trim(), at: head[3], text: rest };
      comments.push(cur);
      continue;
    }
    if (cur) cur.text = (cur.text ? cur.text + '\n' : '') + line.trim();
  }
  return { file, title: title || path.basename(file, '.txt'), date: time.date, timeText: time.text, body, comments };
}

function parseLibrary(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').replace(/\r/g, '');
  const tm = raw.match(/^时间[：:]\s*(\d{4})-(\d{1,2})-(\d{1,2})/m);
  const dm = tm || path.relative(LOG_DIR, file).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!dm) return null;
  const date = `${dm[1]}-${pad(dm[2])}-${pad(dm[3])}`;
  const body = (raw.split('【正文】')[1] || '').split(/【评论[（(]?/)[0].trim();
  return { file, date, title: (raw.match(/^标题[：:]\s*(.+)$/m) || [])[1] || '', body };
}

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/^\d{4}-\d{2}-\d{2}_.+\.txt$/i.test(ent.name)) out.push(p);
  }
  return out;
}

const bigrams = s => { const out = new Set(); const t = stripPunct(s); for (let i = 0; i < t.length - 1; i++) out.add(t.slice(i, i + 2)); return out; };
const jaccard = (a, b) => {
  const A = bigrams(a), B = bigrams(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
};

function safeTitle(t) {
  return String(t || '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 44) || '未命名日志';
}

function toLibraryText(src) {
  const lines = [
    `标题：${src.title}`,
    `时间：${src.timeText}`,
    '日志ID：（无 · 来源 Qzone 备份）',
    '原链接：（无 · 来源 Qzone 备份）',
    '',
    '【正文】',
    src.body,
    '',
    `【评论（${src.comments.length}条）】`,
    ''
  ];
  if (!src.comments.length) lines.push('（无评论）');
  src.comments.forEach((c, i) => {
    lines.push(`--- 评论 ${i + 1} ---`, c.author, '', `${i + 1}楼 评论时间: ${c.at}`, '', '回复', '', c.text || '', '', '-----------------------------------', '');
  });
  return lines.join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}

function copyImages(src, destDir) {
  const base = src.file.replace(/\.txt$/i, '');
  for (const dir of [base + '_图片', base]) {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue;
    const files = fs.readdirSync(dir).filter(f => /\.(png|jpg|jpeg|gif|webp)$/i.test(f));
    if (!files.length) return [];
    if (!DRY) {
      fs.mkdirSync(destDir, { recursive: true });
      for (const f of files) fs.copyFileSync(path.join(dir, f), path.join(destDir, f));
      fs.writeFileSync(path.join(destDir, '图片索引.txt'), files.map(f => `${f}\t（本地备份）`).join('\n') + '\n', 'utf8');
    }
    return files;
  }
  return [];
}

async function refreshStats() {
  if (DRY) return 'dry-run';
  const token = fs.existsSync(TOKEN_FILE) ? fs.readFileSync(TOKEN_FILE, 'utf8').trim() : '';
  try {
    const r = await fetch('http://127.0.0.1:3217/api/stats', { headers: { 'X-LifeTrail-Token': token } });
    if (r.ok) return '已通过运行中的服务刷新 public/stats.json';
  } catch {}
  const child = spawn(process.execPath, [path.join(WEB_DIR, 'server.js')], { cwd: WEB_DIR, stdio: 'ignore' });
  await new Promise(res => setTimeout(res, 2500));
  try { child.kill(); } catch {}
  return '临时启动服务重建 public/stats.json';
}

(async () => {
  if (!fs.existsSync(SOURCE)) { console.error(`源目录不存在：${SOURCE}`); process.exit(1); }

  const existing = walk(LOG_DIR).map(parseLibrary).filter(Boolean);
  const latestDate = existing.reduce((m, x) => x.date > m ? x.date : m, '');
  const exact = new Set(existing.map(x => digest(x.date, x.body)));
  const byDate = {};
  for (const l of existing) (byDate[l.date] = byDate[l.date] || []).push(l);

  const srcFiles = fs.readdirSync(SOURCE).filter(f => f.toLowerCase().endsWith('.txt') && !f.startsWith('导出文件'));
  const parsed = srcFiles.map(f => parseSource(path.join(SOURCE, f))).filter(Boolean);

  const seen = new Set();
  const fresh = [], nearDup = [];
  for (const src of parsed) {
    const k = digest(src.date, src.body);
    if (seen.has(k) || exact.has(k)) continue;
    seen.add(k);
    const same = byDate[src.date] || [];
    let best = 0, bestT = '';
    for (const l of same) { const sim = jaccard(src.body, l.body); if (sim > best) { best = sim; bestT = l.title; } }
    if (best >= 0.85) { nearDup.push({ src, best, bestT }); continue; }
    fresh.push(src);
  }
  fresh.sort((a, b) => a.date.localeCompare(b.date));

  const recent = fresh.filter(x => x.date > latestDate);
  const backfill = fresh.filter(x => x.date <= latestDate);
  const picked = BACKFILL ? fresh : recent;

  console.log(`源目录：${SOURCE}`);
  console.log(`源文件 ${srcFiles.length} 个，可解析 ${parsed.length} 篇；库内 ${existing.length} 篇（最新 ${latestDate}）`);
  console.log(`精确重复 ${parsed.length - fresh.length - nearDup.length} 篇；近似重复 ${nearDup.length} 篇`);
  console.log(`新增（晚于库内最新）：${recent.length} 篇；历史缺漏：${backfill.length} 篇${BACKFILL ? '（已启用 --backfill，一并入库）' : '（默认跳过，加 --backfill 补）'}`);

  for (const x of backfill) console.log(`  [历史] ${x.date} ${x.title.slice(0, 30)}`);
  if (!picked.length) { console.log('\n没有需要入库的日志。'); return; }

  const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  const today = new Date(), p = n => pad(n), ts = `${today.getFullYear()}${p(today.getMonth() + 1)}${p(today.getDate())}${p(today.getHours())}${p(today.getMinutes())}`;

  for (const src of picked) {
    const dir = path.join(LOG_DIR, src.date);
    let name = `${src.date}_${safeTitle(src.title)}.txt`;
    let full = path.join(dir, name);
    if (fs.existsSync(full)) name = `${src.date}_${safeTitle(src.title)}_${ts.slice(-6)}.txt`, full = path.join(dir, name);
    const destDir = full.replace(/\.txt$/i, '');
    console.log(`\n[新] ${src.timeText}  ${src.title}  (${norm(src.body).length} 字 / ${src.comments.length} 条评论)`);
    console.log(`  → ${path.relative(ROOT, full)}`);
    if (DRY) continue;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(full, toLibraryText(src), 'utf8');
    const images = copyImages(src, destDir);
    index.push({ date: src.date, title: src.title, id: '（无 · 来源 Qzone 备份）',
      path: `..\\日志\\${src.date}\\${name}`, chars: norm(src.body).length,
      comments: src.comments.length, ocr: false, images });
  }

  if (!DRY) {
    index.sort((a, b) => String(a.date).localeCompare(String(b.date)));
    fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 4) + '\n', 'utf8');
    console.log(`\n索引已更新：${index.length} 条`);
    console.log(await refreshStats());
  } else {
    console.log('\n--dry-run：未写入任何文件。');
  }
  console.log('\n提醒：阶段总结 / 学习路线 / 评价属于语义层，需要重跑后再提交。');
})();
