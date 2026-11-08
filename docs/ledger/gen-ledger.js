#!/usr/bin/env node
/* 《如果那年》事件编号台账生成器（扩容第 0 期第一件）
 *
 * 用法：node gen-ledger.js [主树路径]   默认 ~/workspace/if-that-year
 * 产出（脚本所在目录）：ledger.json / ledger.md / tree.md / stats.json
 *
 * 方法：不解析文本猜结构，而是按 index.html 的加载顺序在 VM 里把内容文件
 * 真实加载一遍，枚举运行时数据结构（GAME_DATA / GAME_PACKS / GAME_SYNERGY /
 * GAME_CARDS / GAME_PROLOGUE.packFor 六代包 / GAME_REGISTRY），机械抽取。
 * 行号则回到源文件文本里按 id 字面量出现顺序逐个对位。
 *
 * 台账范围（带 id 的可玩内容条目）：
 *   src/events.js        GAME_DATA.events（基础事件）、GAME_DATA.forks 中带 id 者（分岔）
 *   src/content/pool|era|lines  GAME_PACKS（按 index.html 顺序逐文件切片归属）
 *   src/content/rare/synergy.js GAME_SYNERGY 的 combos / rare / endings
 *   src/content/prologue/cards.js GAME_CARDS 的 family / temper / eras
 *   src/content/prologue/prologue*.js 六代包的 acts / sitActs / pool / marks
 * 不入账（无 id 的结构化内容，在 REPORT 里另行计数）：
 *   routes、forks 无 id 者、crisis、shadows、micro、verdict*、originOpen、
 *   flatsByAge、special、registry 的旗定义本身。
 *
 * 门槛类型机械判定（顺序执行，先命中先算）：
 *   1) 来源是序章包（acts/sitActs/pool/marks）或出身牌 → 序章幕
 *   2) 条目带 chain 字段，或其 id 被别的条目的 chain 字段指向 → 链条
 *   3) 带任一门槛字段（见 GATE_FIELDS，ctx 须非空对象）→ 状态门
 *   4) 其余 → 无门
 *
 * 引入版本机械对法：读 GAME_REGISTRY（milestones 的 setters + domains 边
 * 的 by），若登记 note 里有 v0.x 版本字样，则 setter 条目的引入版本记该
 * 版本；对不上的记 unknown，绝不猜。
 *
 * 职业/行当机械对法：只看条目自身字段里出现的旗名（ctx 键、require、
 * set——含选项 set、all），按 OCC_FLAG_TABLE 对照打标签，可多挂；
 * 对照表是照主树真实旗词汇定的，表外旗一律不打，宁缺毋滥。
 *
 * 职业族机械对法（第 1 期 P1-1 增）：同一批旗名与行当注册表（src/content/
 * trades.js 的 GAME_TRADES，flag→trade id 一一对应）对照打「职业族」标签，
 * 与职业/行当标签并行——前者是文案向的粗分类，后者是职业层注册表的行当 id。
 * tree.md 另出「职业族 → 年代 → 年龄段」查询树，只收挂上职业族的条目。
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = process.argv[2] || path.join(process.env.HOME, "workspace/if-that-year");
const OUT = __dirname;

/* ---------- 1. 按 index.html 顺序加载 ---------- */
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const scriptSrcs = [...html.matchAll(/src="(src\/[^"]+)"/g)].map((m) => m[1]);

const w = {};
w.window = w;
const ctx = vm.createContext(w);
const loadErrors = [];
function load(rel) {
  try {
    vm.runInContext(fs.readFileSync(path.join(ROOT, rel), "utf8"), ctx, { filename: rel });
  } catch (e) {
    loadErrors.push({ file: rel, error: String(e && e.message || e) });
  }
}

// GAME_DATA 基础数据
load("src/events.js");

// GAME_PACKS：逐文件加载、切片归属
const PACK_FILES = scriptSrcs.filter(
  (s) => s.startsWith("src/content/pool/") || s.startsWith("src/content/era/") || s.startsWith("src/content/lines/")
);
const packSlices = []; // {file, entries[]}
for (const f of PACK_FILES) {
  const before = (w.GAME_PACKS || []).length;
  load(f);
  const after = (w.GAME_PACKS || []).length;
  packSlices.push({ file: f, entries: (w.GAME_PACKS || []).slice(before, after) });
}

load("src/content/prologue/cards.js");
load("src/content/rare/synergy.js");
for (const f of scriptSrcs.filter((s) => s.startsWith("src/content/registry-"))) load(f);
load("src/content/prologue/prologue.js");
for (const e of ["c1978", "c1955", "c1965", "c1985", "c1995"]) load(`src/content/prologue/prologue-${e}.js`);
load("src/content/trades.js"); // 第 1 期 P1-1：行当注册表（登记数据文件同位，registry.js 合入 trades 键）
load("src/world/state.js");
load("src/registry.js");

/* ---------- 2. 行号对位：每文件 id 字面量出现位置 ---------- */
const lineCache = new Map();
function idLines(rel) {
  if (lineCache.has(rel)) return lineCache.get(rel);
  const text = fs.readFileSync(path.join(ROOT, rel), "utf8");
  const lines = text.split("\n");
  const map = new Map(); // id -> [lineNo,...]
  const push = (id, ln) => { if (!map.has(id)) map.set(id, []); map.get(id).push(ln); };
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/"?id"?\s*:\s*"([^"]+)"/g)) push(m[1], i + 1);
    for (const m of line.matchAll(/^\s*"?((?:mark|grab)_[A-Za-z0-9_]+)"?\s*:/g)) push(m[1], i + 1);
  });
  lineCache.set(rel, map);
  return map;
}
const lineCursor = new Map(); // file|id -> 已用次数
function takeLine(rel, id) {
  const arr = idLines(rel).get(id);
  if (!arr || !arr.length) return null;
  const key = rel + "|" + id;
  const n = lineCursor.get(key) || 0;
  lineCursor.set(key, n + 1);
  return arr[Math.min(n, arr.length - 1)];
}

/* ---------- 3. 引入版本：registry setters/by → note 里的版本 ---------- */
const versionOf = new Map(); // entryId -> version string（先登记者胜）
function noteVersion(note) {
  if (!note) return null;
  const m = String(note).match(/v0\.\d+(?:\.\d+)?/);
  return m ? m[0] : null;
}
const REG = w.GAME_REGISTRY || {};
for (const flag of Object.values(REG.milestones || {})) {
  const v = noteVersion(flag && flag.note);
  if (!v) continue;
  for (const sid of flag.setters || []) if (!versionOf.has(sid)) versionOf.set(sid, v);
}
for (const dom of Object.values(REG.domains || {})) {
  for (const e of dom.edges || []) {
    const v = noteVersion(e && e.note);
    if (v && e.by && !versionOf.has(e.by)) versionOf.set(e.by, v);
  }
}

/* ---------- 4. 职业对照表（照真实旗词汇） ---------- */
const OCC_FLAG_TABLE = {
  factory_work: "工厂", fab_work: "半导体/电子厂", assembly_work: "工厂（装配）",
  loom_work: "纺织", miner_work: "矿业", fitter_work: "技工", welder_work: "技工",
  mech_work: "技工", heavy_work: "重体力工种", appliance_work: "家电维修",
  med_work: "医护", med_hosp: "医护", nurse_work: "医护",
  teach_work: "教师", calligraphy_teach: "教师（书法）",
  farm_work: "农业", farmLine: "农业",
  shop_work: "个体经营/小店", shop_opened: "个体经营/小店", shop_begun: "个体经营/小店",
  shop_kept: "个体经营/小店", shop_grew: "个体经营/小店", shop_closed: "个体经营/小店",
  shop_wound_down: "个体经营/小店", fam_shop_in: "个体经营/小店", stall_started: "摊贩",
  courier_work: "快递/骑手", driver_taxi: "司机/运输", truck_work: "司机/运输",
  dev_work: "程序员/IT", fin_work: "金融", acct_work: "财会",
  care_work: "照护/家政", craft_work: "手艺/工艺", process_craft: "手艺/工艺",
  gig_work: "零工", side_job: "副业", side_start: "副业",
  img_work: "影像/设计", write_work: "写作", sew_work: "缝纫/裁缝",
  stream_cook: "主播/直播", stream_craft: "主播/直播",
};
function flagsOf(e) {
  const out = new Set();
  if (!e || typeof e !== "object") return out;
  if (e.ctx && typeof e.ctx === "object") Object.keys(e.ctx).forEach((k) => out.add(k));
  if (e.require) [].concat(e.require).forEach((x) => typeof x === "string" && out.add(x));
  if (typeof e.set === "string") out.add(e.set);
  if (Array.isArray(e.all)) e.all.forEach((x) => typeof x === "string" && out.add(x));
  for (const c of e.choices || []) if (c && typeof c.set === "string") out.add(c.set);
  return out;
}
function occupationsOf(e) {
  const tags = new Set();
  for (const f of flagsOf(e)) if (OCC_FLAG_TABLE[f]) tags.add(OCC_FLAG_TABLE[f]);
  return [...tags].sort();
}

/* ---------- 4b. 职业族对照（行当注册表，P1-1） ---------- */
const GAME_TRADES = w.GAME_TRADES || {};
const TRADE_BY_FLAG = {}; // flag -> trade id
for (const [tid, t] of Object.entries(GAME_TRADES)) if (t && t.flag) TRADE_BY_FLAG[t.flag] = tid;
function tradesOf(e) {
  const tags = new Set();
  for (const f of flagsOf(e)) if (TRADE_BY_FLAG[f]) tags.add(TRADE_BY_FLAG[f]);
  return [...tags].sort();
}

/* ---------- 5. 门槛类型 ---------- */
const GATE_FIELDS = [
  "require", "requiresFactAny", "requiresFactHard", "stateAll", "state", "stateNot",
  "stats", "all", "any", "eraIn", "routeIn", "route", "forbid", "forbidRoute",
  "minYear", "maxYear", "kidMin", "kidMax", "kidAgeMin", "kidAgeMax",
  "petMin", "petMax", "flagAgeWithin", "flagAgeMin", "flagAgeMax", "chance", "evidence",
];
function hasGate(e) {
  if (e.ctx && typeof e.ctx === "object" && Object.keys(e.ctx).length) return true;
  return GATE_FIELDS.some((k) => e[k] !== undefined && e[k] !== null && !(Array.isArray(e[k]) && !e[k].length));
}

/* ---------- 6. 组装台账行 ---------- */
const rows = [];
const chainTargets = new Set();
function collectChainTargets(list) {
  for (const e of list || []) if (e && typeof e.chain === "string") chainTargets.add(e.chain);
}
packSlices.forEach((s) => collectChainTargets(s.entries));
collectChainTargets(w.GAME_DATA && w.GAME_DATA.events);
collectChainTargets(w.GAME_SYNERGY && w.GAME_SYNERGY.rare);

function eraOf(e, fileEra) {
  if (e.era) return e.era;
  if (e.eraIn) return [].concat(e.eraIn).join("+");
  if (fileEra) return fileEra;
  return "全年代";
}
function routeOf(e) {
  if (e.route) return [].concat(e.route).join("+");
  if (e.routeIn) return [].concat(e.routeIn).join("+");
  return "不限";
}
function ageOf(e) {
  let min = null, max = null;
  if (typeof e.min === "number") min = e.min;
  if (typeof e.max === "number") max = e.max;
  if (min === null && typeof e.age === "number") { min = e.age; max = e.age; }
  if (min === null && Array.isArray(e.window)) { min = e.window[0]; max = e.window[1]; }
  return { min, max };
}
function ageText(min, max) {
  if (min === null) return "—";
  if (max === null || max === min) return String(min);
  return min + "–" + max;
}
function gateType(e, category) {
  if (category.startsWith("序章") || category === "童年记号" || category === "出身牌") return "序章幕";
  if ((e && typeof e.chain === "string") || (e && chainTargets.has(e.id))) return "链条";
  if (e && hasGate(e)) return "状态门";
  return "无门";
}
let seq = 0;
function addRow(e, file, category, fileEra) {
  const { min, max } = ageOf(e || {});
  rows.push({
    seq: ++seq,
    id: e.id,
    file,
    line: takeLine(file, e.id),
    category,
    occupations: occupationsOf(e),
    trades: tradesOf(e),
    era: eraOf(e, fileEra),
    route: routeOf(e),
    ageMin: min,
    ageMax: max,
    ageBand: ageText(min, max),
    gate: gateType(e, category),
    introduced: versionOf.get(e.id) || "unknown",
    status: "在用",
  });
}

// 基础事件 + 带 id 的分岔
for (const e of (w.GAME_DATA && w.GAME_DATA.events) || []) if (e && e.id) addRow(e, "src/events.js", "基础事件");
for (const f of (w.GAME_DATA && w.GAME_DATA.forks) || []) if (f && f.id) addRow(f, "src/events.js", "分岔");
// GAME_PACKS 逐文件
for (const s of packSlices) {
  const cat = s.file.includes("/era/") ? "年代包" : s.file.includes("/lines/") ? "具名线" : "普通池";
  const fileEra = s.file.includes("/era/") ? "c" + s.file.match(/era(\d{4})/)[1] : null;
  for (const e of s.entries) if (e && e.id) addRow(e, s.file, cat, fileEra);
}
// synergy
const SYN = w.GAME_SYNERGY || {};
for (const e of SYN.combos || []) if (e && e.id) addRow(e, "src/content/rare/synergy.js", "协同组合");
for (const e of SYN.rare || []) if (e && e.id) addRow(e, "src/content/rare/synergy.js", "稀有事件");
for (const e of SYN.endings || []) if (e && e.id) addRow(e, "src/content/rare/synergy.js", "特殊结局");
// 出身牌
const CARDS = w.GAME_CARDS || {};
for (const c of CARDS.family || []) if (c && c.id) addRow(c, "src/content/prologue/cards.js", "出身牌");
for (const c of CARDS.temper || []) if (c && c.id) addRow(c, "src/content/prologue/cards.js", "出身牌");
for (const [era, arr] of Object.entries(CARDS.eras || {}))
  for (const c of arr || []) if (c && c.id) addRow(c, "src/content/prologue/cards.js", "出身牌", era);
// 序章六代包
const PRO = w.GAME_PROLOGUE || {};
const ERAS = ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"];
for (const era of ERAS) {
  const pack = typeof PRO.packFor === "function" ? PRO.packFor(era) : null;
  if (!pack) { loadErrors.push({ file: `prologue pack ${era}`, error: "packFor 返回空" }); continue; }
  const file = era === "c2000" ? "src/content/prologue/prologue.js" : `src/content/prologue/prologue-${era}.js`;
  for (const a of pack.acts || []) if (a && a.id) addRow(a, file, "序章幕", era);
  for (const a of (pack.sitActs && pack.sitActs.half) || []) if (a && a.id) addRow(a, file, "序章处境幕", era);
  for (const a of (pack.sitActs && pack.sitActs.never) || []) if (a && a.id) addRow(a, file, "序章处境幕", era);
  for (const a of pack.pool || []) if (a && a.id) addRow(a, file, "序章随时池", era);
  for (const mid of Object.keys(pack.marks || {})) addRow({ id: mid }, file, "童年记号", era);
}

/* ---------- 7. 校验统计 ---------- */
const byId = new Map();
for (const r of rows) { if (!byId.has(r.id)) byId.set(r.id, []); byId.get(r.id).push(r); }
const duplicates = [...byId.entries()].filter(([, v]) => v.length > 1)
  .map(([id, v]) => ({ id, count: v.length, at: v.map((r) => `${r.file}:${r.line}`) }));
const countBy = (key) => {
  const m = {};
  for (const r of rows) { const k = typeof key === "function" ? key(r) : r[key]; m[k] = (m[k] || 0) + 1; }
  return Object.fromEntries(Object.entries(m).sort((a, b) => b[1] - a[1]));
};
// 文本口径计数（对账用，与运行时口径并列）
function textIdSet(dirRel) {
  const set = new Set();
  const walk = (d) => {
    for (const name of fs.readdirSync(d)) {
      const p = path.join(d, name);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (name.endsWith(".js")) {
        const t = fs.readFileSync(p, "utf8");
        for (const m of t.matchAll(/"?id"?\s*:\s*"([^"]+)"/g)) set.add(m[1]);
        for (const m of t.matchAll(/^\s*"?((?:mark|grab)_[A-Za-z0-9_]+)"?\s*:/gm)) set.add(m[1]);
      }
    }
  };
  walk(path.join(ROOT, dirRel));
  return set;
}
function textCount(dirRel, style) {
  const set = new Set(); let occ = 0;
  const walk = (d) => {
    for (const name of fs.readdirSync(d)) {
      const p = path.join(d, name);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (name.endsWith(".js")) {
        const t = fs.readFileSync(p, "utf8");
        const re = style === "json" ? /"id":"([^"]+)"/g : style === "js" ? /id: "([^"]+)"/g : /"?id"?\s*:\s*"([^"]+)"/g;
        for (const m of t.matchAll(re)) { set.add(m[1]); occ++; }
      }
    }
  };
  walk(path.join(ROOT, dirRel));
  return { unique: set.size, occurrences: occ };
}
const stats = {
  totalRows: rows.length,
  uniqueIds: byId.size,
  duplicateIds: duplicates,
  byFile: countBy("file"),
  byCategory: countBy("category"),
  byEra: countBy("era"),
  byGate: countBy("gate"),
  byRoute: countBy("route"),
  introducedKnown: rows.filter((r) => r.introduced !== "unknown").length,
  lineResolved: rows.filter((r) => r.line !== null).length,
  withOccupation: rows.filter((r) => r.occupations.length).length,
  withTrade: rows.filter((r) => r.trades.length).length,
  byTrade: (() => { const m = {}; for (const r of rows) for (const t of r.trades) m[t] = (m[t] || 0) + 1; return Object.fromEntries(Object.entries(m).sort((a, b) => b[1] - a[1])); })(),
  runtimeGamePacks: (w.GAME_PACKS || []).length,
  runtimeGameDataEvents: ((w.GAME_DATA || {}).events || []).length,
  textCounts: {
    contentJsonStyle: textCount("src/content", "json"),
    contentJsStyle: textCount("src/content", "js"),
    contentBothStyles: textCount("src/content", "both"),
    srcBothStyles: textCount("src", "both"),
  },
  lineMissing: rows.filter((r) => r.line === null).map((r) => `${r.id} @ ${r.file}`),
  textVsRuntime: (() => {
    const textSet = textIdSet("src");
    const runtimeSet = new Set(rows.map((r) => r.id));
    return {
      runtimeOnly: [...runtimeSet].filter((x) => !textSet.has(x)).sort(),
      textOnly: [...textSet].filter((x) => !runtimeSet.has(x)).sort(),
    };
  })(),
  loadErrors,
  unnumbered: {
    routes: ((w.GAME_DATA || {}).routes || []).length,
    forksNoId: (((w.GAME_DATA || {}).forks) || []).filter((f) => !(f && f.id)).length,
    crisisKeys: Object.keys(((w.GAME_DATA || {}).crisis) || {}).length,
    shadowRoutes: Object.keys(((w.GAME_DATA || {}).shadows) || {}).length,
    microStages: (((w.GAME_DATA || {}).micro) || []).length,
    prologueOriginOpen: ERAS.reduce((n, era) => { const p = PRO.packFor ? PRO.packFor(era) : null; return n + ((p && p.originOpen) || []).length; }, 0),
    prologueFlatsAges: ERAS.reduce((n, era) => { const p = PRO.packFor ? PRO.packFor(era) : null; return n + Object.keys((p && p.flatsByAge) || {}).length; }, 0),
    registryMilestones: Object.keys(REG.milestones || {}).length,
    registryFlagsTotal: Object.keys(REG.milestones || {}).length + Object.keys(REG.enumFacts || {}).length + Object.keys(REG.familyFacts || {}).length,
  },
};

/* ---------- 8. 产出 ---------- */
fs.writeFileSync(path.join(OUT, "ledger.json"), JSON.stringify({
  meta: {
    generatedBy: "gen-ledger.js（运行时枚举＋源文件行号对位）",
    root: ROOT,
    scope: "带 id 的可玩内容条目：GAME_DATA.events/forks(带id) + GAME_PACKS + GAME_SYNERGY + GAME_CARDS + 序章六代包",
    gateRules: "序章幕（序章包/出身牌）> 链条（chain 字段或被 chain 指向）> 状态门（带门槛字段）> 无门",
    totalRows: stats.totalRows, uniqueIds: stats.uniqueIds,
  },
  entries: rows,
}, null, 1));

const esc = (s) => String(s).replace(/\|/g, "\\|");
let md = "# 《如果那年》事件编号台账（机读 JSON 的人读版；由 gen-ledger.js 生成，禁止手改）\n\n";
md += `共 ${stats.totalRows} 条（唯一 id ${stats.uniqueIds} 个）。引入版本对不上 registry 登记的记 unknown。\n\n`;
md += "| # | id | 源文件:行 | 大类 | 职业/行当 | 职业族 | 年代 | 路线 | 年龄段 | 门槛 | 引入 | 状态 |\n|---|---|---|---|---|---|---|---|---|---|---|---|\n";
for (const r of rows) {
  md += `| ${r.seq} | ${esc(r.id)} | ${esc(r.file.replace("src/content/", "").replace("src/", ""))}:${r.line === null ? "?" : r.line} | ${r.category} | ${r.occupations.join("、") || "—"} | ${r.trades.join("、") || "—"} | ${esc(r.era)} | ${esc(r.route)} | ${r.ageBand} | ${r.gate} | ${r.introduced} | ${r.status} |\n`;
}
fs.writeFileSync(path.join(OUT, "ledger.md"), md);

// 查询树：大类 → 职业 → 年代 → 年龄段
function bandOf(r) {
  if (r.ageMin === null) return "未定/开局";
  const m = r.ageMin;
  if (m <= 5) return "0–5"; if (m <= 12) return "6–12"; if (m <= 17) return "13–17";
  if (m <= 22) return "18–22"; if (m <= 29) return "23–29"; if (m <= 39) return "30–39";
  if (m <= 49) return "40–49"; if (m <= 59) return "50–59"; if (m <= 69) return "60–69";
  if (m <= 75) return "70–75"; return "76+";
}
const BAND_ORDER = ["0–5", "6–12", "13–17", "18–22", "23–29", "30–39", "40–49", "50–59", "60–69", "70–75", "76+", "未定/开局"];
const tree = new Map();
for (const r of rows) {
  const occs = r.occupations.length ? r.occupations : ["通用/未挂职业"];
  for (const occ of occs) {
    const key = [r.category, occ, r.era, bandOf(r)];
    const k = key.join("\x00");
    if (!tree.has(k)) tree.set(k, { key, ids: [] });
    tree.get(k).ids.push(r.id);
  }
}
let tm = "# 查询树：大类 → 职业/行当 → 年代 → 年龄段（gen-ledger.js 生成）\n\n";
tm += "「某职业的第几条」＝在对应枝下按 id 排序数位置。带多个职业标签的条目在每个职业枝下各出现一次。\n";
let cur1 = null, cur2 = null, cur3 = null;
for (const node of [...tree.values()].sort((a, b) => a.key.join("/").localeCompare(b.key.join("/"), "zh"))) {
  const [c1, c2, c3, c4] = node.key;
  if (c1 !== cur1) { tm += `\n## ${c1}\n`; cur1 = c1; cur2 = null; cur3 = null; }
  if (c2 !== cur2) { tm += `\n### ${c2}\n`; cur2 = c2; cur3 = null; }
  if (c3 !== cur3) { tm += `\n#### ${c3}\n`; cur3 = c3; }
  const ids = [...new Set(node.ids)].sort();
  tm += `- ${c4}（${ids.length}）：${ids.join(", ")}\n`;
}
// 查询树二：职业族 → 年代 → 年龄段（P1-1 增；只收挂上职业族的条目，行当 id 见 trades.js）
const tradeTree = new Map();
for (const r of rows) {
  for (const t of r.trades) {
    const key = [t, r.era, bandOf(r)];
    const k = key.join("\x00");
    if (!tradeTree.has(k)) tradeTree.set(k, { key, ids: [] });
    tradeTree.get(k).ids.push(r.id);
  }
}
tm += "\n# 查询树二：职业族 → 年代 → 年龄段（gen-ledger.js 生成）\n\n";
tm += "职业族＝行当注册表（src/content/trades.js）的 trade id；只收自身字段挂上对应入行旗的条目，未挂职业族的条目不在此树（计数见 stats.json 的 withTrade/byTrade）。\n";
let tc1 = null, tc2 = null;
for (const node of [...tradeTree.values()].sort((a, b) => a.key.join("/").localeCompare(b.key.join("/"), "zh"))) {
  const [t1, t2, t3] = node.key;
  if (t1 !== tc1) { tm += `\n## ${t1}\n`; tc1 = t1; tc2 = null; }
  if (t2 !== tc2) { tm += `\n### ${t2}\n`; tc2 = t2; }
  const ids = [...new Set(node.ids)].sort();
  tm += `- ${t3}（${ids.length}）：${ids.join(", ")}\n`;
}
fs.writeFileSync(path.join(OUT, "tree.md"), tm);
fs.writeFileSync(path.join(OUT, "stats.json"), JSON.stringify(stats, null, 1));
console.log(JSON.stringify(stats, null, 1));
