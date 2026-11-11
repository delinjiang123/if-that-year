#!/usr/bin/env node
/* 《如果那年》统一 storylet 校验器（v0.20.0 M1-B）——用法：node tools/validate-storylet.js
   装载序照 index.html：events → content 各包（相对顺序）→ cards → synergy → state/registry/rhythm
   → prologue → storylet（并入 + 挂 sl 在此发生）。断言：
   1) 并入后全部条目（D.events 含主池/扩展/combos、D.rare、D.forks、序章 acts、D.crisis）都有 sl，
      且 domain ∈ {process, era, line, rare, pool}、layer ∈ {0,1,2,3,4}、kind ∈ {jump, call}、win 为 [lo,hi] 且 lo<=hi；
   2) 普通抽取池隔离（按现引擎 scheduler.met/pickEvent 的实际过滤）：D.events 中 procOnly 条目全部
      kind="jump"，其余全部 kind="call"（met() 对 procOnly 恒 false，pickEvent 只从 D.events 取
      met 通过者）；D.forks 全部 kind="jump"；
   3) effects 键（条目级与选项级递归）⊆ {health,money,growth,freedom,relation,wisdom}；
      选项级与条目级的 set/setState/temp 只许以白名单形状出现（set=字符串旗标名、setState=对象、temp=数字）；
   4) 全池 id 唯一（events/rare/forks/序章 acts/endings/危机合成 id）；
   5) 锚点表一致性（v0.20.0 M2，src/anchors.js）：表里有的 forks（年龄+id+route 为键）数据里
      必须有、数据里的 forks 必须全在表里；procBeats 与 D.events 的 procOnly 集合全等；
      glimpseAges 恒 [30,40,50]；prologueForks 的 id 必须在序章 acts 里实存。防锚点表与数据漂移。
   退出码：0 = PASS，1 = FAIL。 */
"use strict";
const fs = require("fs"), vm = require("vm"), path = require("path");
const ROOT = path.join(__dirname, "..");
const PACK_FILES = ["src/content/pool/pack1.js", "src/content/pool/pack2.js", "src/content/pool/pack3.js", "src/content/pool/pack4.js", "src/content/pool/pack5.js", "src/content/pool/pack6.js", "src/content/pool/pack9.js", "src/content/pool/pack10.js", "src/content/pool/pack11.js", "src/content/pool/pack12.js", "src/content/lines/side-and-steady.js", "src/content/pool/pack14.js", "src/content/pool/pack15.js", "src/content/lines/exam.js", "src/content/pool/pack17.js", "src/content/pool/pack18.js", "src/content/pool/pack19.js", "src/content/pool/pack20.js", "src/content/pool/pack21.js", "src/content/pool/pack22.js", "src/content/pool/pack23.js", "src/content/lines/late-life.js", "src/content/pool/pack25.js", "src/content/pool/pack26.js", "src/content/pool/pack27.js", "src/content/pool/pack28.js", "src/content/pool/pack29.js", "src/content/pool/pack30.js", "src/content/pool/pack33.js", "src/content/pool/pack31.js", "src/content/pool/pack32.js", "src/content/pool/pack34.js", "src/content/pool/pack35.js", "src/content/pool/pack36.js", "src/content/pool/pack37.js", "src/content/pool/pack38.js", "src/content/pool/pack39.js", "src/content/pool/pack40.js", "src/content/pool/pack41.js", "src/content/pool/pack42.js", "src/content/pool/pack43.js", "src/content/pool/pack44.js", "src/content/pool/pack45.js", "src/content/pool/pack46.js", "src/content/pool/pack47.js", "src/content/pool/pack48.js", "src/content/pool/pack49.js", "src/content/pool/pack50.js", "src/content/pool/pack51.js", "src/content/pool/pack52.js", "src/content/pool/pack53.js", "src/content/pool/pack54.js", "src/content/pool/pack55.js", "src/content/pool/pack56.js", "src/content/pool/pack57.js", "src/content/pool/pack58.js", "src/content/pool/pack59.js", "src/content/pool/pack60.js", "src/content/pool/pack61.js", "src/content/pool/pack62.js", "src/content/pool/pack63.js", "src/content/pool/pack64.js", "src/content/pool/pack65.js", "src/content/pool/pack66.js", "src/content/pool/pack67.js", "src/content/pool/pack68.js", "src/content/pool/pack69.js", "src/content/pool/pack70.js", "src/content/pool/pack71.js", "src/content/pool/pack72.js", "src/content/pool/pack73.js", "src/content/pool/pack74.js", "src/content/pool/pack75.js", "src/content/pool/pack76.js", "src/content/pool/pack77.js", "src/content/pool/pack78.js", "src/content/pool/pack79.js", "src/content/pool/pack80.js", "src/content/pool/pack81.js", "src/content/pool/pack82.js", "src/content/pool/pack83.js", "src/content/pool/pack84.js", "src/content/pool/pack85.js", "src/content/pool/pack86.js", "src/content/pool/pack87.js", "src/content/pool/pack88.js", "src/content/pool/pack89.js", "src/content/pool/pack90.js", "src/content/pool/pack91.js", "src/content/pool/pack92.js", "src/content/pool/pack93.js", "src/content/pool/pack94.js", "src/content/pool/pack95.js", "src/content/pool/pack96.js", "src/content/pool/pack99.js", "src/content/pool/pack98.js", "src/content/pool/pack100.js", "src/content/pool/pack97.js", "src/content/pool/pack101.js", "src/content/pool/pack102.js", "src/content/pool/pack103.js", "src/content/pool/pack104.js", "src/content/pool/pack105.js", "src/content/pool/pack107.js", "src/content/pool/pack108.js", "src/content/pool/pack106.js", "src/content/pool/pack109.js", "src/content/pool/pack111.js", "src/content/pool/pack113.js", "src/content/pool/pack114.js", "src/content/pool/pack128.js", "src/content/pool/pack127.js", "src/content/pool/pack116.js", "src/content/pool/pack112.js", "src/content/pool/pack119.js", "src/content/pool/pack117.js", "src/content/pool/pack118.js", "src/content/pool/pack115.js", "src/content/pool/pack110.js", "src/content/lines/covenant.js", "src/content/lines/process-beats.js", "src/content/lines/abroad.js", "src/content/era/era1955.js", "src/content/era/era1965.js", "src/content/era/era1978.js", "src/content/era/era1985.js", "src/content/era/era1995.js"];

const sandbox = { window: {}, console };
sandbox.window = sandbox;
vm.createContext(sandbox);
const load = (rel) => vm.runInContext(fs.readFileSync(path.join(ROOT, rel), "utf8"), sandbox, { filename: rel });
load("src/events.js");
for (const p of PACK_FILES) load(p);
load("src/content/prologue/cards.js");
load("src/content/rare/synergy.js");
load("src/content/pool/pack120.js"); // CL-115：rare 追加包，装载序同 index.html（synergy 之后、storylet 之前，条目追加 rare 表尾）
load("src/content/registry-v023.js"); load("src/content/registry-wp2.js"); load("src/content/registry-wp3.js"); load("src/content/registry-wp4.js"); load("src/content/registry-wp5.js"); load("src/content/registry-wp6.js"); load("src/content/registry-wp7.js"); load("src/content/registry-wp8.js"); load("src/content/registry-retire.js"); load("src/content/trades.js"); load("src/world/state.js"); load("src/registry.js"); load("src/anchors.js"); load("src/rhythm.js");
load("src/content/prologue/prologue-c1955.js"); load("src/content/prologue/prologue-c1965.js"); load("src/content/prologue/prologue-c1978.js"); load("src/content/prologue/prologue-c1985.js"); load("src/content/prologue/prologue-c1995.js");
load("src/content/prologue/prologue.js");
load("src/storylet.js");

const D = sandbox.GAME_DATA, PRO = sandbox.GAME_PROLOGUE, ST = sandbox.GAME_STORYLET;
const errors = [];
const err = (m) => errors.push(m);
if (!ST) err("GAME_STORYLET 未导出（storylet.js 未生效）");

const DOMAINS = new Set(["process", "era", "line", "rare", "pool"]);
const STAT_KEYS = new Set(["health", "money", "growth", "freedom", "relation", "wisdom"]);

const collections = [
  ["events", D.events || []],
  ["rare", D.rare || []],
  ["forks", D.forks || []],
  ["prologue", (PRO && PRO.acts) || []],
  ["crisis", Object.values(D.crisis || {})],
];
let total = 0;
const byDomain = {}, byLayer = {}, byKind = {};
for (const [name, arr] of collections) {
  for (const e of arr) {
    total++;
    const at = `${name}:${e.id || "(无 id)"}`;
    if (!e.sl) { err(`${at} 缺 sl`); continue; }
    const { domain, win, layer, kind } = e.sl;
    if (!DOMAINS.has(domain)) err(`${at} sl.domain 非法: ${domain}`);
    if (!Number.isInteger(layer) || layer < 0 || layer > 4) err(`${at} sl.layer 非法: ${layer}`);
    if (kind !== "jump" && kind !== "call") err(`${at} sl.kind 非法: ${kind}`);
    if (!Array.isArray(win) || win.length !== 2 || typeof win[0] !== "number" || typeof win[1] !== "number" || win[0] > win[1]) err(`${at} sl.win 非法: ${JSON.stringify(win)}`);
    byDomain[domain] = (byDomain[domain] || 0) + 1;
    byLayer[layer] = (byLayer[layer] || 0) + 1;
    byKind[kind] = (byKind[kind] || 0) + 1;
    // domain 派生复核（与 storylet.js 规则同口径，防挂牌漂移）
    const wantDomain = e.procOnly ? "process" : (e.era || e.eraIn) ? "era" : (e.chain || e.ctx) ? "line" : null;
    if (wantDomain && domain !== wantDomain) err(`${at} sl.domain=${domain} 与派生规则不符（应为 ${wantDomain}）`);
    if (name === "crisis" && layer !== 1) err(`${at} crisis 条目 sl.layer 应为 1，实为 ${layer}`);
    if ((name === "rare") && !e.chain && layer !== 2) err(`${at} rare 条目 sl.layer 应为 2，实为 ${layer}`);
  }
}

// ---- 抽取池隔离：procOnly ⇔ jump（仅 D.events 内），普通池条目全 call，forks 全 jump ----
for (const e of D.events || []) {
  if (e.procOnly && (!e.sl || e.sl.kind !== "jump")) err(`events:${e.id} procOnly 条目 kind 应为 jump`);
  if (!e.procOnly && e.sl && e.sl.kind !== "call") err(`events:${e.id} 普通池条目 kind 应为 call，实为 ${e.sl.kind}`);
}
for (const f of D.forks || []) if (!f.sl || f.sl.kind !== "jump") err(`forks:${f.id || f.age} kind 应为 jump`);

// ---- effects 键与选项级白名单（递归条目与 choices）----
function checkEffects(item, at) {
  if (!item || typeof item !== "object") return;
  if (item.effects) for (const k of Object.keys(item.effects)) if (!STAT_KEYS.has(k)) err(`${at} effects 键越界: ${k}`);
  if (item.set !== undefined && typeof item.set !== "string") err(`${at} set 形状非法（应为字符串旗标名）`);
  if (item.setState !== undefined && (typeof item.setState !== "object" || item.setState === null || Array.isArray(item.setState))) err(`${at} setState 形状非法（应为对象）`);
  if (item.temp !== undefined && typeof item.temp !== "number") err(`${at} temp 形状非法（应为数字）`);
  // 活计形态字段（v0.20.0 M2）：ctx.form/notForm 值域与 textForm/echoForm 形状，与 validate-state 同口径。
  const FORM_VALUES = ["farm", "public", "self", "flex", "employee"];
  if (item.ctx) for (const fld of ["form", "notForm"]) {
    if (item.ctx[fld] === undefined) continue;
    const v = item.ctx[fld];
    if (!Array.isArray(v) || !v.length) err(`${at} ctx.${fld} 应为非空数组`);
    else for (const fv of v) if (!FORM_VALUES.includes(fv)) err(`${at} ctx.${fld} 含非法形态值 ${fv}`);
  }
  // 主线门（v0.20.0 M2 第二批）：ctx.mainLine 形状与 validate-state 同口径（入行旗 id 或其非空数组）。
  const ENTRY_FLAGS = ["farm_work", "exam_landed", "shop_work", "gig_work", "courier_work", "care_work", "write_work", "factory_work", "fab_work", "craft_work", "heavy_work", "miner_work", "truck_work", "med_hosp", "med_work", "nurse_work", "img_work", "teach_work", "acct_work", "fin_work", "press_work", "dev_work", "driver_taxi", "grad_work"];
  if (item.ctx && item.ctx.mainLine !== undefined) {
    const v = item.ctx.mainLine;
    const arr = Array.isArray(v) ? v : [v];
    if (!arr.length || arr.some((x) => typeof x !== "string")) err(`${at} ctx.mainLine 应为入行旗 id 或其非空数组`);
    else for (const fv of arr) if (!ENTRY_FLAGS.includes(fv)) err(`${at} ctx.mainLine 含非入行旗 ${fv}`);
  }
  for (const fld of ["textForm", "echoForm", "labelForm"]) {
    if (!item[fld]) continue;
    for (const [fv, txt] of Object.entries(item[fld])) {
      if (!FORM_VALUES.includes(fv)) err(`${at} ${fld} 含非法形态键 ${fv}`);
      else if (typeof txt !== "string" || !txt) err(`${at} ${fld}.${fv} 不是非空文本`);
    }
  }
  // 年代变体（v0.20.1 面板急修）：与 validate-state 同口径核形状。
  const ERA_VALUES = ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"]; // v0.23 WP1（E12 后六代）
  for (const fld of ["textEra", "echoEra", "labelEra"]) {
    if (!item[fld]) continue;
    for (const [ev, txt] of Object.entries(item[fld])) {
      if (!ERA_VALUES.includes(ev)) err(`${at} ${fld} 含非法年代键 ${ev}`);
      else if (typeof txt !== "string" || !txt) err(`${at} ${fld}.${ev} 不是非空文本`);
    }
  }
  // 枚举事实与序章选项门（v0.23 WP1 E3/E11）：此处只核形状，事实名/值集归 validate-state 按 registry 核。
  for (const fld of ["setFact", "requiresFact"]) if (item[fld] !== undefined && (typeof item[fld] !== "object" || item[fld] === null || Array.isArray(item[fld]))) err(`${at} ${fld} 形状非法（应为对象）`);
  if (item.requiresSit !== undefined && !(typeof item.requiresSit === "string" || Array.isArray(item.requiresSit))) err(`${at} requiresSit 形状非法（应为处境值或其数组）`);
  if (item.requiresFlag !== undefined && !(typeof item.requiresFlag === "string" || Array.isArray(item.requiresFlag))) err(`${at} requiresFlag 形状非法（应为旗名或其数组）`);
  if (item.requiresState !== undefined && (typeof item.requiresState !== "object" || item.requiresState === null || Array.isArray(item.requiresState))) err(`${at} requiresState 形状非法（应为对象）`);
  // gateNote 文案规格（v0.23 WP1 E3）：叙述者口吻、一句、≤40 字、不许通知腔——逐字拦 banned 词。
  if (item.gateNote !== undefined) {
    if (typeof item.gateNote !== "string" || !item.gateNote) err(`${at} gateNote 不是非空文本`);
    else {
      if (item.gateNote.length > 40) err(`${at} gateNote 超 40 字（实 ${item.gateNote.length} 字）`);
      for (const w of ["你不符合", "由于", "资格", "条件不足"]) if (item.gateNote.includes(w)) err(`${at} gateNote 含通知腔词「${w}」`);
    }
    if (!Array.isArray(item.gateNoteNeeds) || !item.gateNoteNeeds.length) err(`${at} gateNote 已声明但 gateNoteNeeds 缺失或为空`);
  }
  // eraFrame 年代框（v0.23 WP1 E2）：键为已登记年代、框 text 非空、choices 若有须为带 label 的非空数组。
  if (item.eraFrame !== undefined) for (const [ev, fr] of Object.entries(item.eraFrame || {})) {
    if (!ERA_VALUES.includes(ev)) { err(`${at} eraFrame 含非法年代键 ${ev}`); continue; }
    if (!fr || typeof fr.text !== "string" || !fr.text) err(`${at} eraFrame.${ev}.text 不是非空文本`);
    if (fr && fr.choices !== undefined && (!Array.isArray(fr.choices) || !fr.choices.length || fr.choices.some((c) => !c || typeof c.label !== "string"))) err(`${at} eraFrame.${ev}.choices 形状非法`);
  }
  // familyBeat 拍型（v0.23 WP1 E4）：此处只核 familyBeat 标记与回声字段形状；白名单/quotaHolder 逐项断言在 validate-state。
  if (item.familyBeat !== undefined && item.familyBeat !== true) err(`${at} familyBeat 应为 true`);
  // 返聘后复退门与退休年数变体（v0.20.1 W7）：与 validate-state 同口径核形状。
  if (item.rehireAfterRetire !== undefined && typeof item.rehireAfterRetire !== "boolean") err(`${at} rehireAfterRetire 不是布尔`);
  if (item.textRetireYears !== undefined) {
    const ry = item.textRetireYears;
    if (!ry || typeof ry !== "object" || Array.isArray(ry)) err(`${at} textRetireYears 不是对象`);
    else for (const k of ["mid", "long"]) if (typeof ry[k] !== "string" || !ry[k]) err(`${at} textRetireYears.${k} 不是非空文本`);
  }
  // dating 摊牌分级变体（CL-45 登记）：与 validate-state 同口径核形状（键＝已推迟次数，值域 {"1","2"}）
  for (const fld of ["textDefer"]) {
    if (item[fld] === undefined) continue;
    const dv = item[fld];
    if (!dv || typeof dv !== "object" || Array.isArray(dv)) err(`${at} ${fld} 不是对象`);
    else for (const [dk, txt] of Object.entries(dv)) {
      if (!["1", "2"].includes(dk)) err(`${at} ${fld} 含非法推迟键 ${dk}`);
      else if (typeof txt !== "string" || !txt) err(`${at} ${fld}.${dk} 不是非空文本`);
    }
  }
  for (const c of item.choices || []) for (const fld of ["labelDefer", "echoDefer"]) {
    if (c[fld] === undefined) continue;
    const dv = c[fld];
    if (!dv || typeof dv !== "object" || Array.isArray(dv)) err(`${at} 选项 ${fld} 不是对象`);
    else for (const [dk, txt] of Object.entries(dv)) {
      if (!["1", "2"].includes(dk)) err(`${at} 选项 ${fld} 含非法推迟键 ${dk}`);
      else if (typeof txt !== "string" || !txt) err(`${at} 选项 ${fld}.${dk} 不是非空文本`);
    }
  }
  for (const c of item.choices || []) checkEffects(c, at);
}
for (const [name, arr] of collections) for (const e of arr) checkEffects(e, `${name}:${e.id || "(无 id)"}`);
for (const e of D.endings || []) checkEffects(e, `endings:${e.id}`);

// ---- 全池 id 唯一（含 endings 与危机合成 id）----
// 序章幕按包/年代分组建键（v0.23 合并二期，裁定 MB-1）：各年代包有意复用同一批 act id
// （同 act 槽、一代一本，运行时按年代分发不冲突）——裸 id 建键会把跨代同名幕误报重复。
// 键＝「年代:id」，同年代内同 id 仍报错；归属按对象引用对包内 acts/sitActs 对账，无包归属者为 c2000 内置。
const seen = new Map();
const reg = (id, where) => { if (id == null) return; if (seen.has(id)) err(`重复 id: ${id}（${where} 与 ${seen.get(id)}）`); else seen.set(id, where); };
const eraOfAct = new Map();
for (const [era, pk] of Object.entries(sandbox.GAME_PROLOGUE_PACKS || {})) {
  for (const a of pk.acts || []) eraOfAct.set(a, era);
  for (const lst of Object.values(pk.sitActs || {})) for (const a of lst || []) eraOfAct.set(a, era);
}
for (const e of D.events || []) reg(e.id, "events");
for (const e of D.rare || []) reg(e.id, "rare");
for (const f of D.forks || []) reg(f.id || `fork${f.age}`, "forks");
for (const a of (PRO && PRO.acts) || []) reg(`${eraOfAct.get(a) || "c2000"}:${a.id}`, `prologue@${eraOfAct.get(a) || "c2000"}`);
for (const e of D.endings || []) reg(e.id, "endings");
for (const k of Object.keys(D.crisis || {})) reg(`crisis_${k}`, "crisis");

// ---- 锚点表一致性（v0.20.0 M2）：表 ↔ 数据双向对账 ----
const AN = sandbox.GAME_ANCHORS;
let anchorNote = "GAME_ANCHORS 未导出";
if (!AN) err("GAME_ANCHORS 未导出（anchors.js 未生效）");
else {
  const fkey = (f) => `${f.age}|${f.id || ""}|${f.route || ""}`;
  const dataForks = new Set((D.forks || []).map(fkey));
  const tabForks = new Set((AN.forks || []).map(fkey));
  for (const k of tabForks) if (!dataForks.has(k)) err(`锚点表分岔 ${k} 数据里不存在`);
  for (const k of dataForks) if (!tabForks.has(k)) err(`数据分岔 ${k} 未登记进锚点表`);
  if ((AN.forks || []).length !== tabForks.size) err("锚点表 forks 有重复登记");
  if (JSON.stringify(AN.glimpseAges) !== JSON.stringify([30, 40, 50])) err(`锚点表 glimpseAges 应为 [30,40,50]，实为 ${JSON.stringify(AN.glimpseAges)}`);
  const procData = new Set((D.events || []).filter((e) => e.procOnly).map((e) => e.id));
  const procTab = new Set((AN.procBeats || []).map((b) => b.id));
  for (const id of procTab) if (!procData.has(id)) err(`锚点表进程拍 ${id} 数据里不存在（非 procOnly 条目）`);
  for (const id of procData) if (!procTab.has(id)) err(`数据 procOnly 条目 ${id} 未登记进锚点表 procBeats`);
  for (const pf of AN.prologueForks || []) {
    if (!((PRO && PRO.acts) || []).some((a) => a.id === pf.id)) err(`锚点表序章分岔 ${pf.id} 在序章 acts 里不存在`);
  }
  anchorNote = `forks ${tabForks.size} 双向一致 / procBeats ${procTab.size} 双向一致 / glimpseAges [30,40,50] / prologueForks ${(AN.prologueForks || []).length}`;
}

// ---- 序章条件分文形状（读者最小扩展批）：分文叶值或为字符串、或为非空字符串数组 ----
// 与 prologue.js 的 condText 读者同口径：字符串原样返回、数组按派生哈希定款；其余形状
// （空数组、含非字符串元素的数组、数字/对象冒充叶值）在呈现层只会回落未命中，必须在此拦下。
// 例外（出生年小片）：factAlt 的数组条目可为对象形 {text, calWindow:[lo,hi]}——公历分段
// 分文（读者 factAltPool 按呈现年过滤后仍走 condText 定款）；仅 factAlt 一处放行，形状由
// 下方 factAltLeafOk 单独把门（text 非空字符串、calWindow 为 lo<=hi 的两年数组）。
// 补查（出生年小片第五批）：textByTrack 叶此前不在本断言面内；第五批起条目可为对象形
// {text, calWindow:[lo,hi], elseText}——公历分文（读者 trackText 按呈现年定款、出窗回落
// elseText）。本断言面新增覆盖 textByTrack（含 altSets 内）：字符串原样放行，对象形由
// 下方 trackLeafOk 单独把门（text/elseText 均非空字符串、calWindow 为 lo<=hi 的两年数组）；
// 这是新增检查、不是放宽——此前对象形会静默漏检，此后形状不合即报错。
// 集成补形（v0.60.7 总指挥）：扩招句恢复项（v0.60.6）的底文分段数组形（字符串段＋
// {text, calWindow} 段，读者 trackTextOf）同为 textByTrack 合法叶，trackLeafOk 一并认：
// 数组须非空、每段或为字符串、或为 text 非空且 calWindow 两元 lo<=hi 的对象——逐段严查。
// 补查（出生年小片第六批）：变体/幕级的公历字段（calYear 单年、calWindow 公历窗）此前不在
// 本断言面内；第六批起变体新增 calWindow（读者 pickVariants 过滤），本断言面新增覆盖——
// 凡对象带 calYear 须为有限数、带 calWindow 须为 lo<=hi 的两元有限数数组，形状不合即报错。
// 这是新增检查、不是放宽（覆盖面：checkObj 所及的幕/变体/altTexts/平年/带对象）。
// 覆盖：六包的 acts/sitActs/pool（模板与变体）/poolActs（bands）/pool95（变体）/flatsByAge，
// 与包级 originLB/originMigrant/originMigrantBySit/special never 文。性子框 frames 的 textLB
// 与回声/选项/记号层不在本断言面（与普查口径一致，登记备查）。
{
  const leafOk = (v) => typeof v === "string" || (Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "string"));
  const factAltLeafOk = (v) => typeof v === "string" || (Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "string" || (x && typeof x === "object" && typeof x.text === "string" && x.text.length > 0 && Array.isArray(x.calWindow) && x.calWindow.length === 2 && Number.isFinite(x.calWindow[0]) && Number.isFinite(x.calWindow[1]) && x.calWindow[0] <= x.calWindow[1])));
  const trackLeafOk = (v) => typeof v === "string" || (Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "string" || (x && typeof x === "object" && typeof x.text === "string" && x.text.length > 0 && Array.isArray(x.calWindow) && x.calWindow.length === 2 && Number.isFinite(x.calWindow[0]) && Number.isFinite(x.calWindow[1]) && x.calWindow[0] <= x.calWindow[1]))) || (v && typeof v === "object" && !Array.isArray(v) && typeof v.text === "string" && v.text.length > 0 && typeof v.elseText === "string" && v.elseText.length > 0 && Array.isArray(v.calWindow) && v.calWindow.length === 2 && Number.isFinite(v.calWindow[0]) && Number.isFinite(v.calWindow[1]) && v.calWindow[0] <= v.calWindow[1]);
  const DIRECT = ["textLB", "textTown", "textByMigrant", "textByLeftBehind"];
  const MAPS = ["textBySchooling", "bandText", "textByQuota", "stageText", "textBySit", "textLBBySchooling", "trackAlt"];
  let leafCount = 0;
  const bad = (at, what) => err(`${at} 分文 ${what} 形状非法（应为字符串或非空字符串数组）`);
  function checkObj(o, at) {
    if (!o || typeof o !== "object") return;
    for (const f of DIRECT) if (o[f] !== undefined) { leafCount++; if (!leafOk(o[f])) bad(at, f); }
    for (const f of MAPS) if (o[f] && typeof o[f] === "object") for (const [k, v] of Object.entries(o[f])) { leafCount++; if (!leafOk(v)) bad(at, `${f}.${k}`); }
    if (o.textByFact && typeof o.textByFact === "object") for (const [fn, map] of Object.entries(o.textByFact)) if (map && typeof map === "object") for (const [fv, v] of Object.entries(map)) { leafCount++; if (!leafOk(v)) bad(at, `textByFact.${fn}.${fv}`); }
    if (o.textByFlag && typeof o.textByFlag === "object") for (const [fl, v] of Object.entries(o.textByFlag)) { leafCount++; if (!leafOk(v)) bad(at, `textByFlag.${fl}`); }
    if (o.factAlt && o.factAlt.texts) for (const [fv, v] of Object.entries(o.factAlt.texts)) { leafCount++; if (!factAltLeafOk(v)) bad(at, `factAlt.${fv}`); }
    if (o.calYear !== undefined) { leafCount++; if (!(typeof o.calYear === "number" && Number.isFinite(o.calYear))) bad(at, "calYear"); }
    if (o.calWindow !== undefined) { leafCount++; if (!(Array.isArray(o.calWindow) && o.calWindow.length === 2 && Number.isFinite(o.calWindow[0]) && Number.isFinite(o.calWindow[1]) && o.calWindow[0] <= o.calWindow[1])) bad(at, "calWindow"); }
    if (o.textByTrack && typeof o.textByTrack === "object") for (const [k, v] of Object.entries(o.textByTrack)) { leafCount++; if (!trackLeafOk(v)) bad(at, `textByTrack.${k}`); }
    for (const s of o.altSets || []) if (s && s.textByTrack && typeof s.textByTrack === "object") for (const [k, v] of Object.entries(s.textByTrack)) { leafCount++; if (!trackLeafOk(v)) bad(at, `altSets.textByTrack.${k}`); }
    if (o.factText && o.factText.texts) for (const [fv, v] of Object.entries(o.factText.texts)) { leafCount++; if (!leafOk(v)) bad(at, `factText.${fv}`); }
    if (o.flagText && o.flagText.text !== undefined) { leafCount++; if (!leafOk(o.flagText.text)) bad(at, "flagText.text"); }
    if (Array.isArray(o.factTexts)) for (const ft of o.factTexts) if (ft && ft.text !== undefined) { leafCount++; if (!leafOk(ft.text)) bad(at, `factTexts.${ft.fact}=${ft.is}`); }
    for (const v of o.variants || []) checkObj(v, at);
    for (const v of o.altTexts || []) checkObj(v, at);
  }
  const packs = Object.assign({}, sandbox.GAME_PROLOGUE_PACKS || {});
  if (PRO && PRO.packFor) packs.c2000 = PRO.packFor("c2000");
  for (const [era, pk] of Object.entries(packs)) {
    if (!pk) continue;
    const at = (id) => `prologue@${era}:${id}`;
    for (const f of ["originLB", "originMigrant"]) if (pk[f] !== undefined) { leafCount++; if (!leafOk(pk[f])) bad(at("(包级)"), f); }
    // 文本门 originOpenTextGate（彩电句小项起，新增覆盖、只加不减）：须与 originOpen 同序
    // 同长；每叶或为 null、或为 { seg, dropWhen }——seg 须为非空字符串且真实出现在同序
    // originOpen 正文里（摘不到的死门＝数据错，先拦）；dropWhen 只许 birthYearMin（有限数）
    // 与 settingIn（非空数组、值须在场景标签词表内）两键，多键/异形一律报错。未声明跳过。
    if (pk.originOpenTextGate !== undefined) {
      const SETTING_VOCAB = ["urban", "rural", "factory", "town"];
      const g = pk.originOpenTextGate;
      if (!Array.isArray(g) || g.length !== (pk.originOpen || []).length) err(`${at("(包级)")} originOpenTextGate 须与 originOpen 同序同长`);
      else for (let i = 0; i < g.length; i++) {
        const e = g[i];
        if (e === null) continue;
        const okShape = e && typeof e === "object" && !Array.isArray(e)
          && Object.keys(e).every((k) => k === "seg" || k === "dropWhen")
          && typeof e.seg === "string" && e.seg.length > 0
          && typeof pk.originOpen[i] === "string" && pk.originOpen[i].includes(e.seg)
          && (e.dropWhen === undefined || (e.dropWhen && typeof e.dropWhen === "object" && !Array.isArray(e.dropWhen)
            && Object.keys(e.dropWhen).every((k) => k === "birthYearMin" || k === "settingIn")
            && (e.dropWhen.birthYearMin === undefined || Number.isFinite(e.dropWhen.birthYearMin))
            && (e.dropWhen.settingIn === undefined || (Array.isArray(e.dropWhen.settingIn) && e.dropWhen.settingIn.length > 0 && e.dropWhen.settingIn.every((s) => SETTING_VOCAB.includes(s))))));
        if (!okShape) err(`${at("(包级)")} originOpenTextGate[${i}] 形状非法（应为 null 或 { seg∈同序正文, dropWhen{ birthYearMin?, settingIn?⊆词表 } }）`);
      }
    }
    if (pk.originMigrantBySit) for (const [k, v] of Object.entries(pk.originMigrantBySit)) { leafCount++; if (!leafOk(v)) bad(at("(包级)"), `originMigrantBySit.${k}`); }
    if (pk.special) for (const f of ["neverChild1Text", "neverChild4Text", "neverChild1MigrantText"]) if (pk.special[f] !== undefined) { leafCount++; if (!leafOk(pk.special[f])) bad(at("(包级)"), `special.${f}`); }
    for (const a of pk.acts || []) checkObj(a, at(a.id));
    for (const lst of Object.values(pk.sitActs || {})) for (const a of lst || []) checkObj(a, at(a.id));
    for (const e of pk.pool || []) { if (e.act) checkObj(e.act, at(e.id)); for (const v of e.variants || []) checkObj(v, at(e.id)); }
    for (const e of pk.poolActs || []) for (const [bk, band] of Object.entries(e.bands || {})) checkObj(band, `${at(e.id)}#${bk}`);
    for (const e of pk.pool95 || []) for (const v of e.variants || []) checkObj(v, at(e.id));
    for (const [age, f] of Object.entries(pk.flatsByAge || {})) checkObj(f, at(`flat@${age}`));
  }
  console.log(`  条件分文形状: 已检叶 ${leafCount} 个（字符串或非空字符串数组）`);
}

// ---- 埋种声明校验（第 1 期 P1-3，设计 §2.1）：seed（选项）/ seedOnShow（呈现）声明 ----
// 形状：行当 id 字符串或其非空数组；凡声明种子的对象必须带非空 seedNote（关口回指句
// 的出处，缺了关口侧 fail-closed 不拼，数据层先拦）；行当必须在注册表 GAME_TRADES 内；
// 单个声明对象至多 2 颗。覆盖面：主池/稀有/分岔/危机的条目与选项（递归）、序章六包的
// acts/sitActs（含变体与选项）与池条目（act/变体）。
{
  const TR = sandbox.GAME_TRADES || {};
  let declObjects = 0, seedChoice = 0, seedSeen = 0;
  const countedObj = new Set(); // PRO.acts 与六包是同一批对象引用，普查按对象去重（校验本身重复走无害）
  const asList = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
  function checkSeedDecl(o, at) {
    if (!o || typeof o !== "object") return;
    if (countedObj.has(o)) return;
    countedObj.add(o);
    const here = [];
    for (const [fld, kind] of [["seed", "choice"], ["seedOnShow", "seen"]]) {
      if (o[fld] === undefined) continue;
      const v = o[fld];
      if (!(typeof v === "string" || (Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "string" && x)))) { err(`${at} ${fld} 形状非法（应为行当 id 或其非空数组）`); continue; }
      for (const t of asList(v)) here.push({ trade: t, kind });
    }
    if (!here.length) return;
    declObjects++;
    if (here.length > 2) err(`${at} 一拍种子 ${here.length} 颗，超上限 2`);
    if (typeof o.seedNote !== "string" || !o.seedNote) err(`${at} 声明了种子但缺 seedNote（回指句出处必填）`);
    for (const d of here) {
      if (!TR[d.trade]) err(`${at} 种子指向未登记行当 ${d.trade}`);
      if (d.kind === "choice") seedChoice++; else seedSeen++;
    }
  }
  function walkBeat(e, at) {
    checkSeedDecl(e, at);
    for (const v of e.variants || []) checkSeedDecl(v, `${at}#variant`);
    for (const v of e.altTexts || []) checkSeedDecl(v, `${at}#alt`);
    for (const c of e.choices || []) { checkSeedDecl(c, `${at}#choice`); for (const c2 of c.choices || []) checkSeedDecl(c2, `${at}#choice2`); }
  }
  for (const [name, arr] of collections) for (const e of arr) walkBeat(e, `${name}:${e.id || "(无 id)"}`);
  for (const e of D.endings || []) walkBeat(e, `endings:${e.id}`);
  const packs2 = Object.assign({}, sandbox.GAME_PROLOGUE_PACKS || {});
  if (PRO && PRO.packFor) packs2.c2000 = PRO.packFor("c2000");
  for (const [era, pk] of Object.entries(packs2)) {
    if (!pk) continue;
    for (const a of pk.acts || []) walkBeat(a, `prologue@${era}:${a.id}`);
    for (const lst of Object.values(pk.sitActs || {})) for (const a of lst || []) walkBeat(a, `prologue@${era}:${a.id}`);
    for (const e of pk.pool || []) { if (e.act) walkBeat(e.act, `prologue@${era}:${e.id}`); for (const v of e.variants || []) checkSeedDecl(v, `prologue@${era}:${e.id}#variant`); }
  }
  console.log(`  埋种声明: 对象 ${declObjects} 个（选项种子 ${seedChoice} 颗 / 呈现种子 ${seedSeen} 颗），行当均在注册表内、一拍 ≤2、seedNote 齐全（有误见 ERROR）`);
}

// ---- 种子读取点白名单静态扫描（设计 §2.3.1）：.seeds / seedsOf( 只许出现在 ----
// src/world/career.js（账本主：plantSeed 写、关口段与 seedsOf 读）与 src/engine.js
// （状态管道：freshState 初始化与读档回填调用）。其余 src 文件出现即报错——呈现层
// 挂点只许调 IFY.plantSeed（写），不许直读种子账。
{
  const ALLOW = new Set(["src/world/career.js", "src/engine.js"]);
  const hits = [];
  (function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (name.endsWith(".js")) {
        const rel = path.relative(ROOT, p).split(path.sep).join("/");
        if (ALLOW.has(rel)) continue;
        const lines = fs.readFileSync(p, "utf8").split("\n");
        lines.forEach((l, i) => { if (/\.seeds\b/.test(l) || /\bseedsOf\s*\(/.test(l)) hits.push(`${rel}:${i + 1}`); });
      }
    }
  })(path.join(ROOT, "src"));
  for (const h of hits) err(`种子读取点越白名单: ${h}`);
  console.log(`  种子读取点白名单: src 全扫，越界 ${hits.length} 处（白名单 career.js / engine.js 状态管道）`);
}

// ---- 职业 ctx 键族静态检查（第 2 期 P2-3，设计 §4.5）：career 键族只许职业族 ----
// 新拍（id 前缀 cr_）用，存量条目零回填——六键（careerTrade/careerVia/
// careerTenureIn/careerWas/careerIdle/careerNone）出现在任何非 cr_ 条目（含选项/
// 变体递归）上即红；本批只在 record.js 落地前三键，后三键未落地，出现在任何
// 条目（含 cr_）上同样即红（不许先用未落地的门）。cr_ 条目上前三键形状一并核：
// careerTrade 须为注册表行当 id 或其非空数组、careerVia 须为来处值域
// （seed/inherit/cold/chain/legacy）或其非空数组、careerTenureIn 须为 lo<=hi
// 的两元有限数数组（与 record.js ctxOk 求值口径一致）。
{
  const CAREER_KEYS = ["careerTrade", "careerVia", "careerTenureIn", "careerWas", "careerIdle", "careerNone"];
  const LANDED_KEYS = ["careerTrade", "careerVia", "careerTenureIn"];
  const VIA_VALUES = ["seed", "inherit", "cold", "chain", "legacy"];
  const TR2 = sandbox.GAME_TRADES || {};
  let careerBeats = 0;
  function scanCareer(o, at, rootId) {
    if (!o || typeof o !== "object") return;
    if (o.ctx && typeof o.ctx === "object") {
      const hit = CAREER_KEYS.filter((k) => o.ctx[k] !== undefined);
      if (hit.length) {
        if (!/^cr_/.test(rootId || "")) err(`${at} ctx 含 career 键（${hit.join("/")}）但 id 非职业族前缀 cr_——career 键只许职业族新拍用，存量条目零回填`);
        else {
          careerBeats++;
          for (const k of ["careerWas", "careerIdle", "careerNone"]) if (o.ctx[k] !== undefined) err(`${at} ctx.${k} 尚未在 record.js 落地（P2-3 只接 careerTrade/careerVia/careerTenureIn 子集），不许先用`);
          if (o.ctx.careerTrade !== undefined) {
            const arr = Array.isArray(o.ctx.careerTrade) ? o.ctx.careerTrade : [o.ctx.careerTrade];
            if (!arr.length || arr.some((x) => typeof x !== "string" || !x)) err(`${at} ctx.careerTrade 应为行当 id 或其非空数组`);
            else for (const fv of arr) if (!TR2[fv]) err(`${at} ctx.careerTrade 含未登记行当 ${fv}`);
          }
          if (o.ctx.careerVia !== undefined) {
            const arr = Array.isArray(o.ctx.careerVia) ? o.ctx.careerVia : [o.ctx.careerVia];
            if (!arr.length || arr.some((x) => typeof x !== "string" || !x)) err(`${at} ctx.careerVia 应为来处值或其非空数组`);
            else for (const fv of arr) if (!VIA_VALUES.includes(fv)) err(`${at} ctx.careerVia 含非法来处值 ${fv}`);
          }
          if (o.ctx.careerTenureIn !== undefined) {
            const v = o.ctx.careerTenureIn;
            if (!(Array.isArray(v) && v.length === 2 && Number.isFinite(v[0]) && Number.isFinite(v[1]) && v[0] <= v[1])) err(`${at} ctx.careerTenureIn 应为 [lo,hi] 两元有限数且 lo<=hi`);
          }
        }
      }
    }
    for (const c of o.choices || []) scanCareer(c, at, rootId);
    for (const v of o.variants || []) scanCareer(v, at, rootId);
    for (const v of o.altTexts || []) scanCareer(v, at, rootId);
  }
  for (const [name, arr] of collections) for (const e of arr) scanCareer(e, `${name}:${e.id || "(无 id)"}`, e.id);
  for (const e of D.endings || []) scanCareer(e, `endings:${e.id}`, e.id);
  console.log(`  职业 ctx 键族: 职业族（cr_）带 career 门条目 ${careerBeats} 个；非 cr_ 条目带 career 键即红（存量零回填），未落地三键（careerWas/Idle/None）出现即红`);
}

console.log(`validate-storylet: 条目 ${total}（events ${(D.events || []).length} / rare ${(D.rare || []).length} / forks ${(D.forks || []).length} / prologue ${((PRO && PRO.acts) || []).length} / crisis ${Object.keys(D.crisis || {}).length}）| id 唯一 ${seen.size}`);
console.log(`  锚点表一致性: ${anchorNote}`);
console.log(`  domain 计数: ${JSON.stringify(byDomain)}`);
console.log(`  layer 计数: ${JSON.stringify(byLayer)} | kind 计数: ${JSON.stringify(byKind)}`);
console.log(`  manifest: endings ${(ST && ST.manifest.endings.length) || 0} 条只登记 | micro ${(ST && ST.manifest.micro.count) || 0} 条 layer 4 只登记（字符串形态不挂 sl）`);
console.log(`错误 ${errors.length} 条:`); errors.forEach((m) => console.log("  ERROR", m));
console.log(errors.length ? "RESULT: FAIL" : "RESULT: PASS");
process.exit(errors.length ? 1 : 0);
