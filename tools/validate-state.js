#!/usr/bin/env node
/* 《如果那年》状态矩阵入库门（v0.12.0 起）——内容轮交付前必跑，绿了才入库。
   用法：node tools/validate-state.js
   检查：注册表为单一事实源——数据里出现的每个旗标/状态/流转都必须在 src/registry.js 登记，
   登记与数据实扫必须双向一致；不可逆边、互斥组合、终态自门控在数据层报错拦截；
   另含旗标可生产性 fixpoint（v0.13.1 起）：依赖环造成的不可达条目列为错误；
   及窗口 × 前置最早可达年龄检查（v0.14.0 起）：窗口终点早于状态门/chain 前置最早可达年龄、或 minYear 在全部允许年代下够不到的条目列为错误（推导口径见 docs/STATE-MATRIX.md §7）。
   退出码：0 = 通过（警告可存在，需在交付说明里交代）；1 = 有错误。 */
"use strict";
const fs = require("fs"), vm = require("vm"), path = require("path");
const ROOT = path.join(__dirname, "..");
const PACK_FILES = ["src/content/pool/pack1.js", "src/content/pool/pack2.js", "src/content/pool/pack3.js", "src/content/pool/pack4.js", "src/content/pool/pack5.js", "src/content/pool/pack6.js", "src/content/pool/pack9.js", "src/content/pool/pack10.js", "src/content/pool/pack11.js", "src/content/pool/pack12.js", "src/content/lines/side-and-steady.js", "src/content/pool/pack14.js", "src/content/pool/pack15.js", "src/content/lines/exam.js", "src/content/pool/pack17.js", "src/content/pool/pack18.js", "src/content/pool/pack19.js", "src/content/pool/pack20.js", "src/content/pool/pack21.js", "src/content/pool/pack22.js", "src/content/pool/pack23.js", "src/content/lines/late-life.js", "src/content/pool/pack25.js", "src/content/pool/pack26.js", "src/content/pool/pack27.js", "src/content/pool/pack28.js", "src/content/pool/pack29.js", "src/content/pool/pack30.js", "src/content/pool/pack33.js", "src/content/pool/pack31.js", "src/content/pool/pack32.js", "src/content/pool/pack34.js", "src/content/pool/pack35.js", "src/content/pool/pack36.js", "src/content/pool/pack37.js", "src/content/pool/pack38.js", "src/content/pool/pack39.js", "src/content/pool/pack40.js", "src/content/pool/pack41.js", "src/content/pool/pack42.js", "src/content/pool/pack43.js", "src/content/pool/pack44.js", "src/content/pool/pack45.js", "src/content/pool/pack46.js", "src/content/pool/pack47.js", "src/content/pool/pack48.js", "src/content/pool/pack49.js", "src/content/pool/pack50.js", "src/content/pool/pack51.js", "src/content/pool/pack52.js", "src/content/pool/pack53.js", "src/content/pool/pack54.js", "src/content/pool/pack55.js", "src/content/pool/pack56.js", "src/content/pool/pack57.js", "src/content/pool/pack58.js", "src/content/pool/pack59.js", "src/content/pool/pack60.js", "src/content/pool/pack61.js", "src/content/pool/pack62.js", "src/content/pool/pack63.js", "src/content/pool/pack64.js", "src/content/pool/pack65.js", "src/content/pool/pack66.js", "src/content/pool/pack67.js", "src/content/pool/pack68.js", "src/content/pool/pack69.js", "src/content/pool/pack70.js", "src/content/lines/covenant.js", "src/content/lines/process-beats.js", "src/content/lines/abroad.js", "src/content/era/era1955.js", "src/content/era/era1965.js", "src/content/era/era1978.js", "src/content/era/era1985.js", "src/content/era/era1995.js"];
const ld = (rel, key) => { const s = { window: {} }; vm.createContext(s); vm.runInContext(fs.readFileSync(path.join(ROOT, rel), "utf8"), s, { filename: rel }); return s.window[key]; };
const errors = [], warnings = [];
const err = (m) => errors.push(m), warn = (m) => warnings.push(m);

const REG = (() => { const s = { window: {} }; vm.createContext(s); for (const rel of ["src/content/registry-v023.js", "src/content/registry-wp2.js", "src/content/registry-wp3.js", "src/content/registry-wp4.js", "src/content/registry-wp5.js", "src/content/registry-wp6.js", "src/content/registry-wp7.js", "src/content/registry-wp8.js", "src/content/registry-retire.js", "src/world/state.js", "src/content/trades.js", "src/registry.js"]) vm.runInContext(fs.readFileSync(path.join(ROOT, rel), "utf8"), s, { filename: rel }); return s.window.GAME_REGISTRY; })(); // v0.20.0 拆分：domains 在 src/world/state.js，milestones 在 src/registry.js，须同沙盒顺序载入；v0.23 WP1：登记数据文件（registry-v023.js）先行，registry.js 尾部合入
const D = ld("src/events.js", "GAME_DATA");
let events = [...D.events];
for (const p of PACK_FILES) events = events.concat(ld(p, "GAME_PACKS") || []); // v0.20.0 M1-B：内容按领域重组至 src/content/，PACK_FILES 为 index.html 相对顺序的完整路径
const syn = ld("src/content/rare/synergy.js", "GAME_SYNERGY");
events = events.concat(syn.combos || [], syn.rare || [], syn.endings || []);
const byId = new Map();
for (const e of events) { if (byId.has(e.id)) err(`重复 id: ${e.id}`); byId.set(e.id, e); }

const DOMAINS = REG.domains || {}, MILESTONES = REG.milestones || {};
const ENUM_FACTS = REG.enumFacts || {}, FAMILY_FACTS = REG.familyFacts || {}; // v0.23 WP1（E11/E4）：枚举事实与家庭事实旗登记
const ERA_VALUES_ALL = ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"]; // v0.23 WP1（E12 后六代）：年代变体/年代框的键值域，与 engine.js ERAS 表同步
const DOMAIN_FLAGS = new Set(["partner","single_ok","slow_love","divorced","spouse_dead","has_kid","no_kid","undecided_kid","dad_dead","mom_dead","dog_home","dog_gone","cat_gone"]); // v0.11 时代的域旗，数据中不得再出现
const asArr = (v) => v == null ? [] : (Array.isArray(v) ? v : [v]);
const edgeKey = (d, f, t) => `${d}:${f}>${t}`;
const declaredEdges = new Map(); // edgeKey -> edge
for (const [dom, def] of Object.entries(DOMAINS)) for (const e of def.edges || []) declaredEdges.set(edgeKey(dom, e.from, e.to), { dom, ...e });

// ---- 数据实扫 ----
const seenSetters = new Map(); // flag -> Set(itemId)
const seenCarriers = new Map(); // edgeKey -> Set(itemId)
const stateRefs = new Set(); // "dom=value" 正向要求出现过
// 载体 from 推断（v0.13.0 口径补强，docs/STATE-MATRIX.md §7）：setState 的 from 优先按条目自身（含从父事件继承）的正向 state/stateAll 门控推断；
// 无门控的分岔条目按此表声明前态——分岔是一次性年龄节点，前态由结构保证（fork31 在 31 岁触发，此前无任何条目能写 spouse；fork38 同理于 kids）。
const UNGATED_FORK_FROM = { fork31: { spouse: "none" }, fork38: { kids: "undecided" }, fork45: { kids: "undecided" }, pr_origin: { schooling: "pre" }, pr_fork16: { track: "pre" } }; // v0.17.0：序章两个结构节点同理（来历幕落定处境、16 岁分岔写入轨道，前态由结构保证）
// familyBeat 拍型断言（v0.23 WP1 E4）：处境陈述＋小应对（effects 白名单 relation/wisdom ±1、记号 set、
// familyFact 旗）＋回声；不许 setState、不许 setFact——其中 quotaHolder 单独点名报错：顶替名额归属
// 只能由 L65-家 的发放规则函数写（蓝图 §3.3 评审 B1 的可判定落点）。
function checkFamilyBeat(item, itemId) {
  if (typeof item.text !== "string" || !item.text) err(`${itemId}: familyBeat 缺处境陈述 text`);
  if (item.setState) err(`${itemId}: familyBeat 不许带 setState（小应对不许改处境本身）`);
  if (item.setFact) {
    if ("quotaHolder" in item.setFact) err(`${itemId}: familyBeat.setFact 写了 quotaHolder——归属只能由 L65-家发放规则函数写（E4 专门断言）`);
    else err(`${itemId}: familyBeat 不许带 setFact`);
  }
  if (item.echo !== undefined && typeof item.echo !== "string") err(`${itemId}: familyBeat.echo 不是文本`);
  if (item.familyFact !== undefined && !(item.familyFact in FAMILY_FACTS)) err(`${itemId}: familyBeat familyFact ${item.familyFact} 未登记（GAME_REGISTRY.familyFacts）`);
  for (const c of item.choices || []) {
    if (c.setState) err(`${itemId}: familyBeat 小应对带 setState（白名单外）`);
    if (c.setFact) {
      if ("quotaHolder" in c.setFact) err(`${itemId}: familyBeat 小应对 setFact 写了 quotaHolder——归属只能由 L65-家发放规则函数写（E4 专门断言）`);
      else err(`${itemId}: familyBeat 小应对带 setFact（白名单外）`);
    }
    if (c.effects) for (const [k, v] of Object.entries(c.effects)) {
      if (!["relation", "wisdom"].includes(k)) err(`${itemId}: familyBeat 小应对 effects 含白名单外键 ${k}（只许 relation/wisdom）`);
      else if (typeof v !== "number" || Math.abs(v) > 1) err(`${itemId}: familyBeat 小应对 effects.${k}=${v} 超过 ±1 小幅线`);
    }
    if (c.familyFact !== undefined && !(c.familyFact in FAMILY_FACTS)) err(`${itemId}: familyBeat 小应对 familyFact ${c.familyFact} 未登记（GAME_REGISTRY.familyFacts）`);
  }
}
// eraFrame 形状（v0.23 WP1 E2）：键为已登记年代、框 text 非空、框选项与本体选项同规实扫（scan 在下方定义，函数声明提升可用）
function checkEraFrameShape(owner, itemId) {
  if (!owner.eraFrame) return;
  for (const [ev, fr] of Object.entries(owner.eraFrame)) {
    if (!ERA_VALUES_ALL.includes(ev)) { err(`${itemId}: eraFrame 含非法年代键 ${ev}`); continue; }
    if (!fr || typeof fr !== "object" || typeof fr.text !== "string" || !fr.text) err(`${itemId}: eraFrame.${ev}.text 不是非空文本`);
    if (fr && fr.choices !== undefined) {
      if (!Array.isArray(fr.choices) || !fr.choices.length) err(`${itemId}: eraFrame.${ev}.choices 不是非空数组`);
      else for (const c of fr.choices) scan(c, itemId);
    }
  }
}
function scan(item, itemId, inhGate) {
  const effGate = Object.assign({}, inhGate);
  for (const fld of ["state", "stateAll"]) if (item[fld]) for (const [dom, v] of Object.entries(item[fld])) effGate[dom] = asArr(v);
  for (const fld of ["require", "forbid", "all", "any"]) for (const f of asArr(item[fld])) {
    if (DOMAIN_FLAGS.has(f)) err(`${itemId}: 域旗 ${f} 仍出现在 ${fld}（v0.12 起改用 state/stateNot）`);
    else if (!(f in MILESTONES) && !(f in FAMILY_FACTS)) err(`${itemId}: ${fld} 引用未登记旗标 ${f}`); // v0.23 合并二期（裁定 D① 同族）：家庭事实旗也是真登记（如 era1985 回响 require originLB/famLaidOff85）——引用面与 requiresFlag 同口径兼认两表，两表皆无仍报错
  }
  if (item.set) {
    if (DOMAIN_FLAGS.has(item.set)) err(`${itemId}: set 仍在立域旗 ${item.set}（改用 setState）`);
    else if (!(item.set in MILESTONES)) err(`${itemId}: set 未登记旗标 ${item.set}`);
    else { if (!seenSetters.has(item.set)) seenSetters.set(item.set, new Set()); seenSetters.get(item.set).add(itemId); }
  }
  // familyFact 立旗产出承认（v0.23 合并一期，wp4-tools-patch (b)）：familyBeat 幕级 familyFact 在 present()
  // 呈现即立、选项级 familyFact 在 choose() 落旗，两路产出原不被 scan 承认——已登记者（里程碑或家庭事实旗表）计入 seenSetters。
  if (item.familyFact && (item.familyFact in MILESTONES || item.familyFact in FAMILY_FACTS)) { if (!seenSetters.has(item.familyFact)) seenSetters.set(item.familyFact, new Set()); seenSetters.get(item.familyFact).add(itemId); }
  for (const [fld] of [["state"], ["stateAll"], ["stateNot"]]) {
    if (!item[fld]) continue;
    for (const [dom, v] of Object.entries(item[fld])) {
      if (!DOMAINS[dom]) { err(`${itemId}: ${fld} 引用未登记域 ${dom}`); continue; }
      for (const val of asArr(v)) {
        if (!DOMAINS[dom].states.includes(val)) err(`${itemId}: ${fld} 引用域 ${dom} 的未登记状态 ${val}`);
        if (fld === "state") stateRefs.add(`${dom}=${val}`);
      }
    }
  }
  if (item.stateNot) for (const fld of ["state", "stateAll"]) if (item[fld]) for (const [dom, v] of Object.entries(item[fld])) {
    const nots = asArr(item.stateNot[dom]);
    for (const val of asArr(v)) if (nots.includes(val)) err(`${itemId}: 互斥组合——${fld}.${dom} 要求 ${val} 又被 stateNot 排除`);
  }
  if (item.state && item.stateAll) for (const dom of Object.keys(item.stateAll)) if (item.state[dom] !== undefined) {
    const a = asArr(item.state[dom]), b = asArr(item.stateAll[dom]);
    if (!b.every((v) => a.includes(v))) err(`${itemId}: 互斥组合——state.${dom} 与 stateAll.${dom} 候选集不一致`);
  }
  // 选项级 requiresState 是真门控（prologue.js choiceGateOk 强制过滤），载体 from 推断须认它（v0.23 合并二期）：
  // 否则带门 setState 选项（如 c1985 pr_y18 对口升学 requiresState{track:craft}）会被误记到所有同向边上。
  if (item.requiresState) for (const [dom, v] of Object.entries(item.requiresState)) effGate[dom] = asArr(v);
  if (item.setState) for (const [dom, to] of Object.entries(item.setState)) {
    if (!DOMAINS[dom]) { err(`${itemId}: setState 引用未登记域 ${dom}`); continue; }
    // 载体 from 推断：有正向门控（含继承）只登记 from∈门控值的边；无门控分岔按 UNGATED_FORK_FROM；其余无门控条目登记为所有指向 to 的已启用边的载体出现
    const froms = effGate[dom] || (UNGATED_FORK_FROM[itemId] && UNGATED_FORK_FROM[itemId][dom] ? [UNGATED_FORK_FROM[itemId][dom]] : null);
    let matched = false;
    for (const [k, e] of declaredEdges) if (e.dom === dom && e.to === to && (e.by || []).length && (!froms || froms.includes(e.from))) { matched = true; if (!seenCarriers.has(k)) seenCarriers.set(k, new Set()); seenCarriers.get(k).add(itemId); }
    if (!matched) err(`${itemId}: setState ${dom}→${to} 无已启用的声明边（未登记或 reserved 边，或门控 from 与声明边不符）`);
    // 终态自门控：进入 terminal 状态的条目必须自带前态门（state 正向=前态，或 chain 指向进入前态的载体且 stateNot 排除终态）
    const term = DOMAINS[dom].terminal || [];
    if (term.includes(to)) {
      const pres = [...declaredEdges.values()].filter((e) => e.dom === dom && e.to === to).map((e) => e.from);
      const selfGated = (item.state && pres.some((p) => asArr(item.state[dom]).includes(p))) || (item.stateAll && pres.some((p) => asArr(item.stateAll[dom]).includes(p)));
      let chainGated = false;
      if (!selfGated && item.chain && item.stateNot && asArr(item.stateNot[dom]).includes(to)) {
        const anchor = byId.get(item.chain);
        const anchorInto = anchor && anchor.setState && anchor.setState[dom];
        if (pres.includes(anchorInto)) chainGated = true;
      }
      if (!selfGated && !chainGated) err(`${itemId}: 进入终态 ${dom}=${to} 未自门控前态（需 state.${dom}∈{${pres}} 或 chain+stateNot 组合）`);
    }
  }
  if (item.setStateBySit) for (const variant of Object.values(item.setStateBySit)) { // v0.18.0：来历幕按处境落定（setStateBySit），与 setState 同规实扫
    for (const [dom, to] of Object.entries(variant || {})) {
      if (!DOMAINS[dom]) { err(`${itemId}: setStateBySit 引用未登记域 ${dom}`); continue; }
      if (!DOMAINS[dom].states.includes(to)) { err(`${itemId}: setStateBySit 引用域 ${dom} 的未登记状态 ${to}`); continue; }
      let matched = false;
      for (const [k, e] of declaredEdges) if (e.dom === dom && e.to === to && (e.by || []).includes(itemId)) { matched = true; if (!seenCarriers.has(k)) seenCarriers.set(k, new Set()); seenCarriers.get(k).add(itemId); }
      if (!matched) err(`${itemId}: setStateBySit ${dom}→${to} 无已启用的声明边（未登记或 by 未含本条目）`);
    }
  }
  if (item.chain && !byId.has(item.chain)) err(`${itemId}: chain 指向不存在的 ${item.chain}`);
  // 通用门/变体字段登记核对（v0.19.0 三相）：kidMin/kidMax 须为数字且下限不大于上限；
  // flagAgeWithin.flag 须为已登记里程碑、years 须为非负数；echoState/textState 须为 { 域: { 状态值: 非空文本 } }，域与状态值须已登记。
  if (item.kidMin != null && typeof item.kidMin !== "number") err(`${itemId}: kidMin 不是数字`);
  if (item.kidMax != null && typeof item.kidMax !== "number") err(`${itemId}: kidMax 不是数字`);
  if (item.kidMin != null && item.kidMax != null && item.kidMin > item.kidMax) err(`${itemId}: kidMin ${item.kidMin} 大于 kidMax ${item.kidMax}`);
  // 真实年龄门（v0.20.1，W3）：kidAgeMin/kidAgeMax（锚出生年 kidsBornAt ?? kidsAt）与 petMin/petMax（锚抱回年 catAt/dogAt），
  // 形状与 kidMin 同口径——须为数字且下限不大于上限；语义与物种推断见 src/registry.js 登记与 src/scheduler.js 的 kidAgeTrue/petAgesTrue。
  if (item.kidAgeMin != null && typeof item.kidAgeMin !== "number") err(`${itemId}: kidAgeMin 不是数字`);
  if (item.kidAgeMax != null && typeof item.kidAgeMax !== "number") err(`${itemId}: kidAgeMax 不是数字`);
  if (item.kidAgeMin != null && item.kidAgeMax != null && item.kidAgeMin > item.kidAgeMax) err(`${itemId}: kidAgeMin ${item.kidAgeMin} 大于 kidAgeMax ${item.kidAgeMax}`);
  if (item.petMin != null && typeof item.petMin !== "number") err(`${itemId}: petMin 不是数字`);
  if (item.petMax != null && typeof item.petMax !== "number") err(`${itemId}: petMax 不是数字`);
  if (item.petMin != null && item.petMax != null && item.petMin > item.petMax) err(`${itemId}: petMin ${item.petMin} 大于 petMax ${item.petMax}`);
  if (item.flagAgeWithin) {
    const fw = item.flagAgeWithin;
    if (!(fw.flag in MILESTONES)) err(`${itemId}: flagAgeWithin.flag 引用未登记里程碑 ${fw.flag}`);
    else if (typeof fw.years !== "number" || fw.years < 0) err(`${itemId}: flagAgeWithin.years 不是非负数`);
  }
  // 旗标落点下限门（内容修复批）：flagAgeMin 与 flagAgeWithin 同形状 {flag, years}，语义为下限（置旗未满 years 年不出）。
  if (item.flagAgeMin) {
    const fm = item.flagAgeMin;
    if (!(fm.flag in MILESTONES)) err(`${itemId}: flagAgeMin.flag 引用未登记里程碑 ${fm.flag}`);
    else if (typeof fm.years !== "number" || fm.years < 0) err(`${itemId}: flagAgeMin.years 不是非负数`);
  }
  // 返聘后复退门与退休年数变体（v0.20.1 W7 登记）：rehireAfterRetire 须为布尔；
  // textRetireYears 须为 { mid, long 非空文本 }，且条目 text 须真含「没多久」（替换锚点，防变体静默失效）。
  if (item.rehireAfterRetire !== undefined && typeof item.rehireAfterRetire !== "boolean") err(`${itemId}: rehireAfterRetire 不是布尔`);
  if (item.textRetireYears !== undefined) {
    const ry = item.textRetireYears;
    if (!ry || typeof ry !== "object" || Array.isArray(ry)) err(`${itemId}: textRetireYears 不是对象`);
    else {
      for (const k of ["mid", "long"]) if (typeof ry[k] !== "string" || !ry[k]) err(`${itemId}: textRetireYears.${k} 不是非空文本`);
      if (typeof item.text === "string" && !item.text.includes("没多久")) err(`${itemId}: textRetireYears 已声明但 text 不含「没多久」（变体替换无锚点）`);
    }
  }
  for (const fld of ["echoState", "textState"]) {
    if (!item[fld]) continue;
    for (const [dom, variants] of Object.entries(item[fld])) {
      if (!DOMAINS[dom]) { err(`${itemId}: ${fld} 引用未登记域 ${dom}`); continue; }
      for (const [val, txt] of Object.entries(variants || {})) {
        if (!DOMAINS[dom].states.includes(val)) err(`${itemId}: ${fld} 引用域 ${dom} 的未登记状态 ${val}`);
        else if (typeof txt !== "string" || !txt) err(`${itemId}: ${fld}.${dom}.${val} 不是非空文本`);
      }
    }
  }
  // 活计形态字段登记核对（v0.20.0 M2）：ctx.form/notForm 须为形态值域（farm/public/self/flex/employee）内的非空数组；
  // textForm/echoForm 须为 { 形态: 非空文本 }。形态是派生量（work.js formOf 规则表），此处只核形状与值域。
  const FORM_VALUES = ["farm", "public", "self", "flex", "employee"];
  if (item.ctx) for (const fld of ["form", "notForm"]) {
    if (item.ctx[fld] === undefined) continue;
    const v = item.ctx[fld];
    if (!Array.isArray(v) || !v.length) err(`${itemId}: ctx.${fld} 应为非空数组`);
    else for (const fv of v) if (!FORM_VALUES.includes(fv)) err(`${itemId}: ctx.${fld} 含非法形态值 ${fv}`);
  }
  // 主线门（v0.20.0 M2 第二批）：ctx.mainLine 须为入行旗 id 或其非空数组，值必须是
  // work.js FORM_OF_FLAG 的键（与形态派生同一张表）；标量字符串与数组两种形状都认。
  const ENTRY_FLAGS = ["farm_work", "exam_landed", "shop_work", "gig_work", "courier_work", "care_work", "write_work", "factory_work", "fab_work", "craft_work", "heavy_work", "miner_work", "truck_work", "med_hosp", "med_work", "nurse_work", "img_work", "teach_work", "acct_work", "fin_work", "press_work", "dev_work", "driver_taxi", "grad_work"];
  if (item.ctx && item.ctx.mainLine !== undefined) {
    const v = item.ctx.mainLine;
    const arr = Array.isArray(v) ? v : [v];
    if (!arr.length || arr.some((x) => typeof x !== "string")) err(`${itemId}: ctx.mainLine 应为入行旗 id 或其非空数组`);
    else for (const fv of arr) if (!ENTRY_FLAGS.includes(fv)) err(`${itemId}: ctx.mainLine 含非入行旗 ${fv}`);
  }
  // 在护对象门（v0.20.1 W8 登记）：ctx.anyCareTarget 出现时须为 true（求值口径见 registry.js 头注释与 record.js ctxOk）
  if (item.ctx && item.ctx.anyCareTarget !== undefined && item.ctx.anyCareTarget !== true) err(`${itemId}: ctx.anyCareTarget 应为 true`);
  // 生活事实门（v0.24.4 AN-2 登记）：ctx.house/car/settle 值域核对（派生口径见 place.js housingOf/carOf/settledOf 与 record.js ctxOk）
  if (item.ctx && item.ctx.house !== undefined && !["owned", "renting", "unit", "any"].includes(item.ctx.house)) err(`${itemId}: ctx.house 含非法值 ${item.ctx.house}`);
  if (item.ctx && item.ctx.car !== undefined && !["now", "ever", "none"].includes(item.ctx.car)) err(`${itemId}: ctx.car 含非法值 ${item.ctx.car}`);
  if (item.ctx && item.ctx.settle !== undefined && !["home", "city", "abroad"].includes(item.ctx.settle)) err(`${itemId}: ctx.settle 含非法值 ${item.ctx.settle}`);
  // 与父母距离变体（v0.24.4 AN-2 登记）：textDist/echoDist 须为 { far: 非空文本 }
  for (const fld of ["textDist", "echoDist"]) {
    if (item[fld] === undefined) continue;
    const v = item[fld];
    if (!v || typeof v !== "object" || Array.isArray(v)) { err(`${itemId}: ${fld} 不是对象`); continue; }
    for (const [k, txt] of Object.entries(v)) {
      if (k !== "far") err(`${itemId}: ${fld} 含非法距离键 ${k}（只许 far）`);
      else if (typeof txt !== "string" || !txt) err(`${itemId}: ${fld}.far 不是非空文本`);
    }
  }
  // 职业身份派生门（AN-3 登记）：ctx.employed/notEmployed/gradGate/studyLine 出现时须为 true；
  // ctx.tenureIn 须为 [lo,hi] 非负整数对且 lo≤hi；ctx.lineSwitchWithin 须为非负数（求值口径见 record.js ctxOk）。
  if (item.ctx) for (const fld of ["employed", "notEmployed", "gradGate", "studyLine"]) {
    if (item.ctx[fld] !== undefined && item.ctx[fld] !== true) err(`${itemId}: ctx.${fld} 应为 true`);
  }
  if (item.ctx && item.ctx.tenureIn !== undefined) {
    const v = item.ctx.tenureIn;
    if (!Array.isArray(v) || v.length !== 2 || v.some((x) => typeof x !== "number" || x < 0) || v[0] > v[1]) err(`${itemId}: ctx.tenureIn 应为 [lo,hi] 非负数对且 lo≤hi`);
  }
  if (item.ctx && item.ctx.lineSwitchWithin !== undefined && (typeof item.ctx.lineSwitchWithin !== "number" || item.ctx.lineSwitchWithin < 0)) err(`${itemId}: ctx.lineSwitchWithin 应为非负数`);
  for (const fld of ["textForm", "echoForm", "labelForm"]) {
    if (!item[fld]) continue;
    for (const [fv, txt] of Object.entries(item[fld])) {
      if (!FORM_VALUES.includes(fv)) err(`${itemId}: ${fld} 含非法形态键 ${fv}`);
      else if (typeof txt !== "string" || !txt) err(`${itemId}: ${fld}.${fv} 不是非空文本`);
    }
  }
  // 年代变体（v0.20.1 面板急修登记）：textEra/echoEra/labelEra 须为 { 年代id: 非空文本 }，键值域为六个年代 id（v0.23 WP1 E12 后）。
  const ERA_VALUES = ERA_VALUES_ALL;
  for (const fld of ["textEra", "echoEra", "labelEra"]) {
    if (!item[fld]) continue;
    for (const [ev, txt] of Object.entries(item[fld])) {
      if (!ERA_VALUES.includes(ev)) err(`${itemId}: ${fld} 含非法年代键 ${ev}`);
      else if (typeof txt !== "string" || !txt) err(`${itemId}: ${fld}.${ev} 不是非空文本`);
    }
  }
  checkEraFrameShape(item, itemId); // 年代框变体（v0.23 WP1 E2）
  // 枚举事实声明（v0.23 WP1 E11）：setFact/requiresFact 的事实名须已登记、值须在值集内（absent 是缺省读法、不许显式写入值集校验面）
  for (const fld of ["setFact", "requiresFact"]) {
    if (!item[fld]) continue;
    if (typeof item[fld] !== "object" || Array.isArray(item[fld])) { err(`${itemId}: ${fld} 不是对象`); continue; }
    for (const [name, v] of Object.entries(item[fld])) {
      const def = ENUM_FACTS[name];
      if (!def) { err(`${itemId}: ${fld} 引用未登记枚举事实 ${name}`); continue; }
      for (const val of asArr(v)) if (!def.values.includes(val)) err(`${itemId}: ${fld}.${name} 值 ${val} 不在值集 {${def.values.join("/")}} 内`);
    }
  }
  // 序章选项门（v0.23 WP1 E3）：requiresSit 须为处境值；requiresFlag 须为已登记里程碑或家庭事实旗；requiresState 的域/值须已登记
  if (item.requiresSit !== undefined) for (const v of asArr(item.requiresSit)) if (!["school", "half", "never"].includes(v)) err(`${itemId}: requiresSit 含非法处境值 ${v}`);
  if (item.requiresFlag !== undefined) for (const f of asArr(item.requiresFlag)) if (!(f in MILESTONES) && !(f in FAMILY_FACTS)) err(`${itemId}: requiresFlag 引用未登记旗 ${f}`);
  if (item.requiresState !== undefined) for (const [dom, v] of Object.entries(item.requiresState || {})) {
    if (!DOMAINS[dom]) { err(`${itemId}: requiresState 引用未登记域 ${dom}`); continue; }
    for (const val of asArr(v)) if (!DOMAINS[dom].states.includes(val)) err(`${itemId}: requiresState 引用域 ${dom} 的未登记状态 ${val}`);
  }
  // gateNote 声明面（v0.23 WP1 E3）：带 gateNote 必须同带非空 gateNoteNeeds（元素为已登记旗/家庭事实旗/枚举事实）；文案逐字规格在 validate-storylet 核
  if (item.gateNote !== undefined) {
    if (typeof item.gateNote !== "string" || !item.gateNote) err(`${itemId}: gateNote 不是非空文本`);
    if (!Array.isArray(item.gateNoteNeeds) || !item.gateNoteNeeds.length) err(`${itemId}: gateNote 已声明但 gateNoteNeeds 缺失或为空（声明面必须齐，缺省不渲染靠它判定）`);
    else for (const n of item.gateNoteNeeds) if (!(n in MILESTONES) && !(n in FAMILY_FACTS) && !(n in ENUM_FACTS)) err(`${itemId}: gateNoteNeeds 引用未登记事实 ${n}`);
  }
  if (item.familyBeat) checkFamilyBeat(item, itemId); // familyBeat 拍型断言（v0.23 WP1 E4，含 quotaHolder 专门断言）
  for (const c of (item.choices || [])) scan(c, itemId, effGate);
  for (const c of (item.choicesTown || [])) scan(c, itemId, effGate); // v0.23 合并二期：城镇形整拍选项（WP2 choicesTown）是运行时真选项，其 set/setFact 与普通选项同规实扫（原实扫看不见，sent_down 等旗的 setter 被误报缺失）
  for (const v of (item.variants || [])) scan(v, itemId, effGate); // v0.21.1：序章变体池与选项同规实扫（变体级 set 记在幕 id 名下）
}
for (const e of events) scan(e, e.id);
// 出身牌（v0.13.0）：牌是钩子旗的 setter 本体，一并实扫（id 与事件不得撞名）
const CARDS = ld("src/content/prologue/cards.js", "GAME_CARDS");
let cardCount = 0;
if (CARDS && CARDS.byId) for (const c of Object.values(CARDS.byId)) { cardCount++; if (byId.has(c.id)) err(`重复 id: 牌 ${c.id} 与事件撞名`); scan(c, c.id); }
for (const f of D.forks) for (const c of f.choices) scan(c, f.id || `fork${f.age}`); // v0.18.0：同龄双分岔（fork28/fork28m）以显式 id 为键
for (const f of D.forks) { // v0.23 WP1（E1/E2）：分岔本体级的年代变体与年代框也要核——本体不在 events 集合里，上方实扫只覆盖到选项级
  const fid = f.id || `fork${f.age}`;
  for (const fld of ["textEra", "echoEra", "labelEra"]) {
    if (!f[fld]) continue;
    for (const [ev, txt] of Object.entries(f[fld])) {
      if (!ERA_VALUES_ALL.includes(ev)) err(`${fid}: ${fld} 含非法年代键 ${ev}`);
      else if (typeof txt !== "string" || !txt) err(`${fid}: ${fld}.${ev} 不是非空文本`);
    }
  }
  checkEraFrameShape(f, fid);
}
for (const [k, c] of Object.entries(D.crisis || {})) for (const ch of c.choices) scan(ch, `crisis_${k}`);
// 序章幕（v0.17.0，src/content/prologue/prologue.js）：与事件同规实扫（顶层 set/setState 与选项递归）
const PRO = (() => { const s = { window: {} }; vm.createContext(s); for (const rel of ["src/content/prologue/prologue-c1955.js", "src/content/prologue/prologue-c1965.js", "src/content/prologue/prologue-c1978.js", "src/content/prologue/prologue-c1985.js", "src/content/prologue/prologue-c1995.js", "src/content/prologue/prologue.js"]) vm.runInContext(fs.readFileSync(path.join(ROOT, rel), "utf8"), s, { filename: rel }); const g = s.window.GAME_PROLOGUE; g.__packs = s.window.GAME_PROLOGUE_PACKS || {}; return g; })(); // v0.23 合并一期（wp4-tools-patch (a)）：同沙盒先载全部序章包再载 prologue.js，使 PRO.acts 含各代幕（setter 可达性按全集判）；合并二期起同沙盒留住 GAME_PROLOGUE_PACKS 供按包实扫与年代归属
if (PRO && PRO.acts) for (const a of PRO.acts) scan(a, a.id);

// ---- 池条目实扫（v0.23 合并二期，裁定 D②／WP3 B-2）----
// 池条目（pack.poolActs／pool／pool95）不是固定幕，原实扫完全看不见它们的 setter（11 条误报之源）。
// 按 prologue.js 池调度的运行时物化形状摊平成伪条目、与固定幕同规实扫（familyBeat 型检同样适用）；
// scan 读不到的产出面（poolSetByStage 旗名、变体 markGrant/marks、poolExtraFact、逐变体 familyFact）
// 汇入 extras，在条目 id 名下按 scan 的 familyFact 承认口径补记 seenSetters（运行时均在呈现点真立）。
const poolPseudos = []; // { item, extras:Set }
function creditExtra(flag, itemId) {
  if (flag in MILESTONES || flag in FAMILY_FACTS) { if (!seenSetters.has(flag)) seenSetters.set(flag, new Set()); seenSetters.get(flag).add(itemId); }
}
for (const pk of Object.values(PRO.__packs || {})) {
  for (const e of pk.poolActs || []) { // WP2 形：按段（bands）逐段物化
    for (const b of Object.values(e.bands || {})) {
      poolPseudos.push({ item: { id: e.id, familyBeat: true, familyFact: b.familyFact || e.familyFact, set: e.set || b.mark, text: b.text, echo: b.echo, choices: b.choices || [] }, extras: new Set(), win: e.window });
    }
  }
  for (const e of pk.pool || []) {
    if (e.act) { // WP3 形：act 模板本体实扫（variants/choices 递归覆盖变体 set 与选项 set）
      const extras = new Set(Object.values(e.act.poolSetByStage || {}));
      for (const cs of Object.values(e.act.stageChoices || {})) for (const c of cs || []) { scan(c, e.id); if (c.set) extras.add(c.set); if (c.familyFact) extras.add(c.familyFact); }
      poolPseudos.push({ item: Object.assign({}, e.act, { id: e.id }), extras, win: e.window });
    } else { // WP7 形：变体选项合并实扫，markGrant/extraFact 入 extras
      const extras = new Set();
      for (const v of e.variants || []) { if (v.markGrant) extras.add(v.markGrant.id); if (v.extraFact) extras.add(v.extraFact); }
      poolPseudos.push({ item: { id: e.id, familyBeat: true, familyFact: e.familyFact, text: (e.variants || []).map((v) => v.text).find(Boolean) || "池条目", echo: (e.variants || []).map((v) => v.echo).find(Boolean), choices: (e.variants || []).flatMap((v) => v.choices || []) }, extras, win: e.window });
    }
  }
  for (const e of pk.pool95 || []) { // WP8 形：逐变体 familyFact 与记号入 extras，选项合并实扫
    const extras = new Set();
    for (const v of e.variants || []) { if (v.familyFact) extras.add(v.familyFact); for (const m of v.marks || []) extras.add(m); }
    poolPseudos.push({ item: { id: e.id, familyBeat: true, text: (e.variants || []).map((v) => v.text).find(Boolean) || "池条目", echo: (e.variants || []).map((v) => v.echo).find(Boolean), choices: (e.variants || []).flatMap((v) => v.choices || []) }, extras, win: e.window });
  }
}
for (const p of poolPseudos) { scan(p.item, p.item.id); for (const f of p.extras) creditExtra(f, p.item.id); }
// 钩子写旗承认（v0.23 合并二期，裁定 D③／WP3 B-3）：quota_decided65 由 prologue.js 的 quotaBeat 钩子
// 在归属发放命中时与 quotaHolder 同步立（注册表注记同此口径），任何条目都不以 set 声明它——
// 仅当树里真有 quotaBeat 拍（钩子的载体）时，承认其拍 id（pr_teen2）为 setter；无载体则不承认（校验器不钝化）。
if (PRO && (PRO.acts || []).some((a) => a.quotaBeat)) { if (!seenSetters.has("quota_decided65")) seenSetters.set("quota_decided65", new Set()); seenSetters.get("quota_decided65").add("pr_teen2"); }

// ---- 注册表双向一致性 ----
const allItemIds = new Set([...byId.keys(), ...(PRO && PRO.acts ? PRO.acts.map((a) => a.id) : []), ...poolPseudos.map((p) => p.item.id), ...(CARDS && CARDS.byId ? Object.keys(CARDS.byId) : [])]); // 消费点自登记的实存核对面（合并二期）
for (const [flag, def] of Object.entries(MILESTONES)) {
  const declared = new Set(def.setters || []);
  const seen = seenSetters.get(flag) || new Set();
  for (const id of declared) {
    // 消费点自登记承认（v0.23 合并二期）：registry-wp7 的 echo_*85 是「回响条目自身不立新旗、只登记归属」
    // 的消费点登记（setters＝条目自身 id）——仅当同名条目在数据中实存时承认；条目不存在仍报错（校验器不钝化）。
    if (id === flag && allItemIds.has(id)) continue;
    if (!seen.has(id)) err(`注册表里程碑 ${flag}: 声明 setter ${id} 在数据中未找到`);
  }
  for (const id of seen) if (!declared.has(id)) err(`里程碑 ${flag}: 数据中 ${id} 立了此旗但注册表未登记该 setter`);
}
for (const [flag, seen] of seenSetters) if (!(flag in MILESTONES) && !(flag in FAMILY_FACTS)) err(`数据中出现未登记里程碑 ${flag}（setter: ${[...seen].join(",")}）`); // v0.23 合并二期（裁定 D①）：familyFact 立旗的产出已在 scan 按 familyFacts 登记承认计入 seenSetters，下游终检须兼认家庭事实旗表——只认里程碑表会把 migrantExam/famCare00 这类已登记者误报为「未登记」；两表皆无登记者仍报错（校验器不钝化）
for (const [k, e] of declaredEdges) {
  if (!(e.by || []).length) continue; // reserved 边单列警告
  const seen = seenCarriers.get(k) || new Set();
  for (const id of e.by) if (!seen.has(id)) err(`注册表边 ${k}: 声明载体 ${id} 在数据中未产生该流转`);
  for (const id of seen) if (!e.by.includes(id)) err(`边 ${k}: 数据中 ${id} 产生该流转但注册表 by 未登记`);
}

// ---- 不可逆与可达性 ----
const reservedInfo = []; // v0.17.0：注册表显式 reserved 登记（域 reservedStates / 边 reserved:true）是「已设计未开放」，单列信息行，不算警告——与意外死内容区分
for (const [dom, def] of Object.entries(DOMAINS)) {
  for (const t of (def.terminal || [])) for (const e of (def.edges || [])) if (e.from === t) err(`不可逆违规: 域 ${dom} 终态 ${t} 存在出边 →${e.to}`);
  // 可达性 BFS（只走已启用边）
  const reach = new Set([def.initial]);
  let grew = true;
  while (grew) { grew = false; for (const e of (def.edges || [])) if ((e.by || []).length && reach.has(e.from) && !reach.has(e.to)) { reach.add(e.to); grew = true; } }
  for (const s of def.states) {
    if ((def.reservedStates || []).includes(s)) { reservedInfo.push(`域 ${dom} 状态 ${s}（reserved，已登记未开放）`); continue; }
    if (!reach.has(s)) warn(`域 ${dom} 状态 ${s} 无已启用可达路径`);
  }
  for (const e of (def.edges || [])) if (!(e.by || []).length) {
    if (e.reserved) { reservedInfo.push(`域 ${dom} 边 ${e.from}→${e.to}（reserved：${e.note || ""}）`); continue; }
    warn(`域 ${dom} 边 ${e.from}→${e.to} 为 reserved（已设计无载体）：${e.note || ""}`);
  }
  for (const s of def.states) if (s !== def.initial && ![...declaredEdges.values()].some((e) => e.dom === dom && e.to === s)) warn(`域 ${dom} 状态 ${s} 无任何入边声明`);
}

// ---- 旗标可生产性（v0.13.1 补盲，B1 教训：chain 方向写反造成的「立旗环」旧检查全绿却整线死亡）----
// 可达 fixpoint：条目可呈现 ⟺ 其正向依赖全可满足（require/all 旗可生产、any 至少一可生产、chain 前置可呈现、正向状态值可达）；
// 旗可生产 ⟺ 至少一个 setter 条目可呈现；状态值可达 ⟺ 初始值，或存在已声明边 u→v 且 u 可达、某载体条目可呈现并写出该流转。
// 负向门（forbid/stateNot）不影响可生产性；数值门（when/stats/危机阈值）、年代/路线/公历年不建模（视为可满足）。口径见 docs/STATE-MATRIX.md §7。
const prodItems = new Map();
function newAcc() { return { flags: new Set(), any: new Set(), chain: null, states: new Map(), sets: new Set(), setStates: [] }; }
function collectDeps(item, acc) {
  for (const f of asArr(item.require)) acc.flags.add(f);
  for (const f of asArr(item.all)) acc.flags.add(f);
  for (const f of asArr(item.any)) acc.any.add(f);
  if (item.chain) acc.chain = item.chain;
  for (const fld of ["state", "stateAll"]) if (item[fld]) for (const [dom, v] of Object.entries(item[fld])) { if (!acc.states.has(dom)) acc.states.set(dom, new Set()); for (const val of asArr(v)) acc.states.get(dom).add(val); }
  if (item.set) acc.sets.add(item.set);
  if (item.familyFact) acc.sets.add(item.familyFact); // v0.23 合并一期（wp4-tools-patch (b)）：familyFact 立旗产出计入可生产性，与 scan 的 seenSetters 同口径
  if (item.setState) for (const [dom, to] of Object.entries(item.setState)) acc.setStates.push([dom, to]);
  if (item.setStateBySit) for (const variant of Object.values(item.setStateBySit)) for (const [dom, to] of Object.entries(variant || {})) acc.setStates.push([dom, to]);
  for (const c of (item.choices || [])) collectDeps(c, acc);
  for (const c of (item.choicesTown || [])) collectDeps(c, acc); // 城镇形选项与 scan 同规（合并二期）
  for (const v of (item.variants || [])) collectDeps(v, acc); // v0.21.1：变体级 set 计入可生产性，与 scan 同规
}
for (const e of events) { const acc = newAcc(); collectDeps(e, acc); prodItems.set(e.id, acc); }
for (const f of D.forks) { const acc = newAcc(); for (const c of f.choices) collectDeps(c, acc); prodItems.set(f.id || `fork${f.age}`, acc); }
for (const [k, c] of Object.entries(D.crisis || {})) { const acc = newAcc(); for (const ch of c.choices) collectDeps(ch, acc); prodItems.set(`crisis_${k}`, acc); }
if (CARDS && CARDS.byId) for (const c of Object.values(CARDS.byId)) { const acc = newAcc(); collectDeps(c, acc); prodItems.set(c.id, acc); }
// 年代归属（v0.23 合并二期，裁定 MB-1）：PRO.acts 是全部年代包同 id 幕的拼接（同 act 槽、一代一本），
// 裸 id 建键会让后载包覆盖先载包的依赖账、吞掉别代 setter。可生产性/年龄两本账按「年代:id」建键；
// 旗与边仍按裸名对账（注册表声明本是裸 id 口径，任一年代的产出即算该旗可生产——与 fixpoint 既有「年代不建模」口径一致）。
const eraOfAct = new Map();
for (const [era, pk] of Object.entries(PRO.__packs || {})) {
  for (const a of pk.acts || []) eraOfAct.set(a, era);
  for (const lst of Object.values(pk.sitActs || {})) for (const a of lst || []) eraOfAct.set(a, era);
}
const qidOf = (a) => `${eraOfAct.get(a) || "c2000"}:${a.id}`;
if (PRO && PRO.acts) for (const a of PRO.acts) { const acc = newAcc(); collectDeps(a, acc); prodItems.set(qidOf(a), acc); }
for (const p of poolPseudos) { const acc = newAcc(); collectDeps(p.item, acc); for (const f of p.extras) acc.sets.add(f); prodItems.set(p.item.id, acc); } // 池条目与固定幕同规入可生产性账（合并二期 D②）
{ const qb = (PRO && PRO.acts || []).find((a) => a.quotaBeat); if (qb) { const acc = prodItems.get(qidOf(qb)); if (acc) acc.sets.add("quota_decided65"); } } // 钩子写旗的可生产性（合并二期 D③）：quota_decided65 由 quotaBeat 钩子写、计入其载体拍的产出，与 seenSetters 承认同口径
const structural = new Set([...D.forks.map((f) => f.id || `fork${f.age}`), ...Object.keys(D.crisis || {}).map((k) => `crisis_${k}`), ...(CARDS && CARDS.byId ? Object.keys(CARDS.byId) : []), ...(PRO && PRO.acts ? PRO.acts.map((a) => qidOf(a)) : [])]); // 序章幕是序列驱动的结构节点，与分岔同规
const presentable = new Set(structural);
const producible = new Set();
const attainable = new Map(); for (const [dom, def] of Object.entries(DOMAINS)) attainable.set(dom, new Set([def.initial]));
const edgeList = [...declaredEdges.values()];
let grewP = true;
while (grewP) {
  grewP = false;
  for (const [id, acc] of prodItems) {
    if (presentable.has(id)) continue;
    let ok = true;
    for (const f of acc.flags) if (!producible.has(f)) { ok = false; break; }
    if (ok && acc.any.size && ![...acc.any].some((f) => producible.has(f))) ok = false;
    if (ok && acc.chain && !presentable.has(acc.chain)) ok = false;
    if (ok) for (const [dom, vals] of acc.states) { if (![...vals].some((v) => attainable.get(dom).has(v))) { ok = false; break; } }
    if (ok) { presentable.add(id); grewP = true; }
  }
  for (const [id, acc] of prodItems) {
    if (!presentable.has(id)) continue;
    for (const f of acc.sets) if (!producible.has(f)) { producible.add(f); grewP = true; }
    for (const [dom, to] of acc.setStates) {
      const att = attainable.get(dom);
      if (!att.has(to) && edgeList.some((e) => e.dom === dom && e.to === to && att.has(e.from))) { att.add(to); grewP = true; }
    }
  }
}
for (const [id, acc] of prodItems) {
  if (structural.has(id) || presentable.has(id)) continue;
  const why = [];
  for (const f of acc.flags) if (!producible.has(f)) why.push(`旗标 ${f} 无可达 setter`);
  if (acc.any.size && ![...acc.any].some((f) => producible.has(f))) why.push(`any 旗标组 [${[...acc.any].join("/")}] 无一可生产`);
  if (acc.chain && !presentable.has(acc.chain)) why.push(`chain 前置 ${acc.chain} 不可达`);
  for (const [dom, vals] of acc.states) if (![...vals].some((v) => attainable.get(dom).has(v))) why.push(`状态 ${dom}∈{${[...vals].join("/")}} 不可达`);
  err(`不可达条目 ${id}: ${why.join("；") || "依赖链不可达"}`);
}

// ---- 窗口 × 前置最早可达年龄（v0.14.0 补盲，逻辑学家复审 11 条死事件教训：旧检查只问「状态/旗可达吗」，不问「在窗口内来得及吗」）----
// 推导方法（口径同步写进 docs/STATE-MATRIX.md §7）：
//   状态值最早年龄 = 各载体「最早可呈现年龄」的最小值——载体在呈现拍即写出流转（分岔年龄固定；出身牌在开局 22 岁）；
//   条目最早可呈现年龄 = max(自身 min, 正向状态门各域「候选值最早年龄的最小值」的最大值, chain 前置条目的最早年龄,
//     require/all 旗标 setter 最早年龄的最大值, any 旗标组 setter 最早年龄的最小值)。自下而上 fixpoint，单调上升必收敛。
//   只在数学上不可能时报错（宁漏不误）：(A) 条目 max < 其正向状态门某域候选值的最早年龄；
//   (B) 条目 max < chain 前置条目的最早可呈现年龄；(C) 条目全部允许年代下 birth+max < minYear。
//   负向门（forbid/stateNot）、数值门（when/stats）、路线门不建模（不产生年龄互斥）；结局无年龄窗不查。
const ERA_BIRTH = { c1955: 1955, c1965: 1965, c1978: 1978, c1985: 1985, c1995: 1995, c2000: 2000 }; // 与 engine.js ERAS 表同步（v0.23 WP1 E12 后六代）
const ageItems = new Map(); // id -> {min,max,gates:Map(dom->Set(vals)),flags:Set,any:Set,chain,sets:Set,setStates:[[dom,to]],eraGate:[eras],minYear}
function ageAcc(item, min, max, bareId) {
  const a = { min, max, bareId: bareId || item.id, gates: new Map(), flags: new Set(), any: new Set(), chain: item.chain || null, sets: new Set(), setStates: [], eraGate: null, minYear: item.minYear || null }; // bareId：账按年代键建、边载体对账用条目裸 id（无 id 的分岔以其账键 forkNN 为裸 id，合并二期 MB-1）
  if (item.era) a.eraGate = [item.era]; else if (item.eraIn) a.eraGate = asArr(item.eraIn);
  const walk = (o) => {
    for (const fld of ["state", "stateAll"]) if (o[fld]) for (const [dom, v] of Object.entries(o[fld])) { if (!a.gates.has(dom)) a.gates.set(dom, new Set()); for (const val of asArr(v)) a.gates.get(dom).add(val); }
    for (const f of asArr(o.require)) a.flags.add(f);
    for (const f of asArr(o.all)) a.flags.add(f);
    for (const f of asArr(o.any)) a.any.add(f);
    if (o.set) a.sets.add(o.set);
    if (o.setState) for (const [dom, to] of Object.entries(o.setState)) a.setStates.push([dom, to]);
    if (o.setStateBySit) for (const variant of Object.values(o.setStateBySit)) for (const [dom, to] of Object.entries(variant || {})) a.setStates.push([dom, to]);
    for (const c of (o.choices || [])) walk(c);
    for (const c of (o.choicesTown || [])) walk(c); // 城镇形选项同规（合并二期）
  };
  walk(item);
  return a;
}
for (const e of events) if (typeof e.min === "number" && typeof e.max === "number") ageItems.set(e.id, ageAcc(e, e.min, e.max));
for (const f of D.forks) ageItems.set(f.id || `fork${f.age}`, ageAcc(f, f.age, f.age, f.id || `fork${f.age}`));
if (PRO && PRO.acts) for (const a of PRO.acts) ageItems.set(qidOf(a), ageAcc(a, a.age, a.age)); // 序章幕：单一年龄节点，与分岔同规（年代键，合并二期 MB-1）
for (const p of poolPseudos) if (p.win) ageItems.set(p.item.id, ageAcc(p.item, p.win[0], p.win[1])); // 池条目：窗口即年龄窗（合并二期 D②）
if (CARDS && CARDS.byId) for (const c of Object.values(CARDS.byId)) ageItems.set(c.id, { min: 22, max: 22, gates: new Map(), flags: new Set(), any: new Set(), chain: null, sets: new Set(c.set ? [c.set] : []), setStates: [], eraGate: null, minYear: null });
const stateEarliest = new Map(); // "dom=value" -> age
// 年龄基线（v0.17.0 重建）：人生从 5 岁来历幕起算（旧版按 22 岁开局写死）——域初值在 5 岁即成立；
// 出身牌的结算点仍是 22 岁（旧年代开局与试点汇入点相同），牌条目自身的 min/max 在下方单独写 22，不随基线动。
for (const [dom, def] of Object.entries(DOMAINS)) stateEarliest.set(`${dom}=${def.initial}`, 5);
const flagEarliest = new Map(); // flag -> age
const itemEarliest = new Map();
for (const [id, a] of ageItems) itemEarliest.set(id, a.min);
let grewA = true, guardA = 0;
while (grewA && guardA++ < 500) {
  grewA = false;
  // 载体写出：状态值/旗标的最早年龄随载体最早年龄更新（只降不升，取最小）
  for (const [id, a] of ageItems) {
    const ea = itemEarliest.get(id);
    for (const f of a.sets) if (!flagEarliest.has(f) || ea < flagEarliest.get(f)) { flagEarliest.set(f, ea); grewA = true; }
    for (const [dom, to] of a.setStates) {
      const k = `${dom}=${to}`;
      // 写出须同时满足：该边在注册表里就是由本载体承担（by 含本条目裸 id），且前态在载体年龄时已可达
      const pres = [...declaredEdges.values()].filter((e) => e.dom === dom && e.to === to && (e.by || []).includes(a.bareId));
      const okPre = pres.some((e) => stateEarliest.has(`${dom}=${e.from}`) && ea >= stateEarliest.get(`${dom}=${e.from}`));
      if (okPre && (!stateEarliest.has(k) || ea < stateEarliest.get(k))) { stateEarliest.set(k, ea); grewA = true; }
    }
  }
  // 条目最早年龄：随前置最早年龄上升（只升不降，取所需最大值）
  for (const [id, a] of ageItems) {
    let need = a.min;
    for (const [dom, vals] of a.gates) {
      let best = Infinity;
      for (const v of vals) { const k = `${dom}=${v}`; if (stateEarliest.has(k)) best = Math.min(best, stateEarliest.get(k)); }
      if (best === Infinity) { need = Infinity; break; }
      need = Math.max(need, best);
    }
    if (need !== Infinity) {
      for (const f of a.flags) { if (!flagEarliest.has(f)) { need = Infinity; break; } need = Math.max(need, flagEarliest.get(f)); }
    }
    if (need !== Infinity && a.any.size) {
      let best = Infinity;
      for (const f of a.any) if (flagEarliest.has(f)) best = Math.min(best, flagEarliest.get(f));
      if (best === Infinity) need = Infinity; else need = Math.max(need, best);
    }
    if (need !== Infinity && a.chain) {
      if (!itemEarliest.has(a.chain) || itemEarliest.get(a.chain) === Infinity) need = Infinity;
      else need = Math.max(need, itemEarliest.get(a.chain));
    }
    if (need !== Infinity && need > itemEarliest.get(id)) { itemEarliest.set(id, need); grewA = true; }
    if (need === Infinity && itemEarliest.get(id) !== Infinity) { itemEarliest.set(id, Infinity); grewA = true; }
  }
}
const AGE_STRUCTURAL = new Set([...D.forks.map((f) => f.id || `fork${f.age}`), ...(CARDS && CARDS.byId ? Object.keys(CARDS.byId) : []), ...(PRO && PRO.acts ? PRO.acts.map((a) => qidOf(a)) : [])]);
for (const [id, a] of ageItems) {
  if (AGE_STRUCTURAL.has(id)) continue; // 分岔/出身牌无窗口可查
  // (A) 窗口终点早于正向状态门要求值的最早年龄
  for (const [dom, vals] of a.gates) {
    let best = Infinity;
    for (const v of vals) { const k = `${dom}=${v}`; if (stateEarliest.has(k)) best = Math.min(best, stateEarliest.get(k)); }
    if (best !== Infinity && a.max < best) err(`窗×前置 ${id}: 窗口终点 ${a.max} 早于状态 ${dom} 候选值最早可达年龄 ${best}（该窗内此门永无可能满足）`);
  }
  // (B) 窗口终点早于 chain 前置最早可呈现年龄
  if (a.chain && itemEarliest.has(a.chain)) {
    const pe = itemEarliest.get(a.chain);
    if (pe !== Infinity && a.max < pe) err(`窗×前置 ${id}: 窗口终点 ${a.max} 早于 chain 前置 ${a.chain} 的最早可呈现年龄 ${pe}（后继窗整体早于前置）`);
  }
  // (C) minYear × 年代：全部允许年代下公历都够不到
  if (a.minYear) {
    const eras = a.eraGate || Object.keys(ERA_BIRTH);
    if (eras.every((er) => (ERA_BIRTH[er] || 0) + a.max < a.minYear)) err(`窗×前置 ${id}: minYear ${a.minYear} 在全部允许年代下不可达（最晚 ${Math.max(...eras.map((er) => (ERA_BIRTH[er] || 0) + a.max))} < ${a.minYear}）`);
  }
}

// ---- 枚举事实与家庭事实旗登记自检（v0.23 WP1 E11/E4）----
for (const [name, def] of Object.entries(ENUM_FACTS)) {
  if (!def || !Array.isArray(def.values) || !def.values.length) { err(`枚举事实 ${name}: values 缺失或为空`); continue; }
  if (new Set(def.values).size !== def.values.length) err(`枚举事实 ${name}: values 有重复`);
  if (def.values.includes("absent")) err(`枚举事实 ${name}: values 不许含 absent（absent 是缺省读法、不是一个值）`);
  if (def.host && !DOMAINS[def.host]) err(`枚举事实 ${name}: host 宿主域 ${def.host} 未登记`);
}
for (const [name, def] of Object.entries(FAMILY_FACTS)) if (!def || typeof def !== "object" || Array.isArray(def)) err(`家庭事实旗 ${name}: 登记形状非法（应为 {beat, note} 对象）`);

// ---- 行当注册表值集校验（第 1 期 P1-1）：GAME_TRADES（src/content/trades.js）与 work.js
// FORM_OF_FLAG 必须双向一致——trade id 集由旗机械派生（去尾 "_work"、无尾者原名），
// 每行的 flag 须是入行旗、form 须与 FORM_OF_FLAG 逐字同值；字段形状（eraIn/eduGate/
// coldKinds 值域、coldOk 与 coldKinds/coldWeight 的联动）逐项核。REG.trades 是同一份
// 登记经 GAME_REGISTRY_EXTRA 合入 registry.js 后的镜像，键集须与 GAME_TRADES 全等
// （合入链在本工具的加载序里实跑：trades.js 先于 registry.js 载入）。
const TRADES = ld("src/content/trades.js", "GAME_TRADES");
const COLD_KIND_ERA = ld("src/content/trades.js", "GAME_COLD_KIND_ERA");
const FORM_OF_FLAG_CHK = (() => { const s = { window: { IFY: {} } }; vm.createContext(s); vm.runInContext(fs.readFileSync(path.join(ROOT, "src/world/processes/work.js"), "utf8"), s, { filename: "src/world/processes/work.js" }); return s.window.IFY.FORM_OF_FLAG || {}; })();
const COLD_KINDS_ALL = ["assign", "recruit", "follow", "near", "wage"];
let tradeCount = 0;
if (!TRADES || typeof TRADES !== "object") err("行当注册表 GAME_TRADES 缺失或不是对象（src/content/trades.js）");
else {
  const tradeIds = Object.keys(TRADES);
  tradeCount = tradeIds.length;
  const seenFlags = new Set();
  for (const [tid, t] of Object.entries(TRADES)) {
    if (!t || typeof t !== "object") { err(`行当 ${tid}: 登记不是对象`); continue; }
    if (!(t.flag in FORM_OF_FLAG_CHK)) { err(`行当 ${tid}: flag ${t.flag} 不是 work.js FORM_OF_FLAG 的入行旗`); continue; }
    if (seenFlags.has(t.flag)) err(`行当 ${tid}: flag ${t.flag} 被两行登记（trade 与旗须一一对应）`);
    seenFlags.add(t.flag);
    const derivedId = t.flag.endsWith("_work") ? t.flag.slice(0, -"_work".length) : t.flag;
    if (derivedId !== tid) err(`行当 ${tid}: id 与旗 ${t.flag} 的机械派生 ${derivedId} 不符`);
    if (t.form !== FORM_OF_FLAG_CHK[t.flag]) err(`行当 ${tid}: form ${t.form} 与 FORM_OF_FLAG[${t.flag}]=${FORM_OF_FLAG_CHK[t.flag]} 不符`);
    if (!Array.isArray(t.eraIn) || !t.eraIn.length) err(`行当 ${tid}: eraIn 缺失或为空`);
    else for (const er of t.eraIn) if (!ERA_VALUES_ALL.includes(er)) err(`行当 ${tid}: eraIn 含非法年代 ${er}`);
    if (!(t.eduGate === null || t.eduGate === "half" || t.eduGate === "gate")) err(`行当 ${tid}: eduGate ${t.eduGate} 不在 {null, half, gate} 内`);
    if (typeof t.gateDirect !== "boolean") err(`行当 ${tid}: gateDirect 不是布尔`);
    if (typeof t.coldOk !== "boolean") err(`行当 ${tid}: coldOk 不是布尔`);
    else if (!t.coldOk) {
      if (!Array.isArray(t.coldKinds) || t.coldKinds.length) err(`行当 ${tid}: coldOk=false 时 coldKinds 必须为空数组`);
      if (t.coldWeight !== 0) err(`行当 ${tid}: coldOk=false 时 coldWeight 必须为 0`);
    } else {
      if (!Array.isArray(t.coldKinds) || !t.coldKinds.length) err(`行当 ${tid}: coldOk=true 时 coldKinds 不得为空`);
      else for (const k of t.coldKinds) if (!COLD_KINDS_ALL.includes(k)) err(`行当 ${tid}: coldKinds 含非法类型 ${k}`);
      if (typeof t.coldWeight !== "number" || !(t.coldWeight > 0)) err(`行当 ${tid}: coldOk=true 时 coldWeight 必须为正数`);
    }
    if (!Array.isArray(t.inheritFrom)) err(`行当 ${tid}: inheritFrom 不是数组`);
    else for (const src of t.inheritFrom) if (!(src in FAMILY_FACTS) && !(CARDS && CARDS.byId && src in CARDS.byId)) err(`行当 ${tid}: inheritFrom 来源 ${src} 既非家庭事实旗也非出身牌`);
    if (!("seedEcho" in t) || !("inheritEcho" in t)) err(`行当 ${tid}: seedEcho/inheritEcho 模板位缺失（P1-1 占位也须在场）`);
  }
  // 同族分区完备校验（第 2 期 P2-1，DESIGN-41 §4.1.0／FAMILY-TABLE 冻结版）：26 行当
  // 恰属一族——family 字段必须在场且是 9 族名单内的标量 id（缺失/非法/非标量即红）；
  // 9 族每族须有成员，且至少一行 gateDirect=true（全 false 的族是死族：外溢进不去
  // 也点不亮，落数据即红）。族籍冻结后改动＝改点亮分布，须走裁定（见 FAMILY-TABLE）。
  const TRADE_FAMILIES = ["land", "plant", "hand", "road", "medic", "word", "counter", "market", "tech"];
  const famMembers = new Map(); // family -> { n, direct }
  for (const [tid, t] of Object.entries(TRADES)) {
    if (!t || typeof t !== "object") continue;
    if (typeof t.family !== "string" || !TRADE_FAMILIES.includes(t.family)) { err(`行当 ${tid}: family ${JSON.stringify(t.family)} 缺失或不在 9 族名单内（同族分区：每行当恰属一族）`); continue; }
    if (!famMembers.has(t.family)) famMembers.set(t.family, { n: 0, direct: 0 });
    const fm = famMembers.get(t.family);
    fm.n++; if (t.gateDirect === true) fm.direct++;
  }
  for (const fam of TRADE_FAMILIES) {
    const fm = famMembers.get(fam);
    if (!fm || fm.n === 0) err(`同族分区：族 ${fam} 无任何成员（分区须覆盖冻结族表 9 族）`);
    else if (fm.direct === 0) err(`同族分区：族 ${fam} 无 gateDirect=true 成员（死族：外溢无处点亮）`);
  }
  for (const f of Object.keys(FORM_OF_FLAG_CHK)) if (!seenFlags.has(f)) err(`入行旗 ${f} 未在行当注册表登记（FORM_OF_FLAG 与 GAME_TRADES 须双向一致）`);
  const regTrades = REG.trades || {};
  for (const tid of tradeIds) if (!(tid in regTrades)) err(`行当 ${tid}: 未经 GAME_REGISTRY_EXTRA 合入 GAME_REGISTRY.trades`);
  for (const tid of Object.keys(regTrades)) if (!(tid in TRADES)) err(`GAME_REGISTRY.trades 含未登记行当 ${tid}`);
  if (!COLD_KIND_ERA || typeof COLD_KIND_ERA !== "object") err("COLD_KIND_ERA 表缺失（src/content/trades.js）");
  else for (const k of COLD_KINDS_ALL) {
    const row = COLD_KIND_ERA[k];
    if (!row) { err(`COLD_KIND_ERA 缺冷门类型 ${k} 行`); continue; }
    for (const er of ERA_VALUES_ALL) if (typeof row[er] !== "boolean") err(`COLD_KIND_ERA.${k}.${er} 不是布尔`);
  }
}

// ---- 职业账映射校验（第 1 期 P1-2）：world/career.js 记账用到的 flag → trade/form
// 必须与行当注册表逐行一致。career.js 运行时从 GAME_TRADES 现读映射、不另存副本，
// 本节用真实文件行为验：同沙盒载入 trades.js + work.js + career.js（seedFromString/
// mulberry 以 engine.js 同算法在沙盒内替身——career.js 对这两件优先取 IFY 的，替身只
// 为让本文件可独立装载，职业流序列口径由整局对账另行实证），对每面入行旗合成一拍
// careerNote，断言记下的段 trade/form 与注册表该行及 FORM_OF_FLAG 逐字同值；另验
// 非入行 src 不建壳、注册表缺失时 careerNote 整点 no-op（fail-closed）。
(() => {
  const careerPath = path.join(ROOT, "src/world/career.js");
  if (!fs.existsSync(careerPath)) { err("职业账模块缺失（src/world/career.js）"); return; }
  const mkSandbox = (withTrades) => {
    const s = { window: { IFY: {} } };
    vm.createContext(s);
    if (withTrades) vm.runInContext(fs.readFileSync(path.join(ROOT, "src/content/trades.js"), "utf8"), s, { filename: "src/content/trades.js" });
    vm.runInContext(fs.readFileSync(path.join(ROOT, "src/world/processes/work.js"), "utf8"), s, { filename: "src/world/processes/work.js" });
    s.window.IFY.seedFromString = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
    s.window.IFY.mulberry = (st) => { st.a |= 0; st.a = (st.a + 0x6D2B79F5) | 0; let t = Math.imul(st.a ^ (st.a >>> 15), 1 | st.a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    vm.runInContext(fs.readFileSync(careerPath, "utf8"), s, { filename: "src/world/career.js" });
    return s.window.IFY;
  };
  const IFYC = mkSandbox(true);
  if (typeof IFYC.careerNote !== "function" || typeof IFYC.backfillCareer !== "function") err("career.js 未导出 careerNote/backfillCareer");
  else if (TRADES && typeof TRADES === "object") {
    for (const [tid, t] of Object.entries(TRADES)) {
      const st = { seedStr: "validate-state", age: 30, flags: {}, ledger: [], flagAges: {}, career: null, seeds: [] };
      IFYC.careerNote(st, { set: t.flag });
      const sp = st.career && Array.isArray(st.career.spells) ? st.career.spells[0] : null;
      if (!sp) { err(`职业账：入行旗 ${t.flag} 的 careerNote 未记段`); continue; }
      if (sp.trade !== tid) err(`职业账：旗 ${t.flag} 记下的 trade ${sp.trade} 与注册表行 ${tid} 不符`);
      if (sp.form !== t.form) err(`职业账：旗 ${t.flag} 记下的 form ${sp.form} 与注册表 ${t.form} 不符`);
      if (sp.form !== FORM_OF_FLAG_CHK[t.flag]) err(`职业账：旗 ${t.flag} 记下的 form ${sp.form} 与 FORM_OF_FLAG ${FORM_OF_FLAG_CHK[t.flag]} 不符`);
    }
    const st2 = { seedStr: "validate-state", age: 30, flags: {}, career: null, seeds: [] };
    IFYC.careerNote(st2, { set: "house_own" }); // 非入行旗：不许建壳记账
    if (st2.career !== null) err("职业账：非入行 src 不应建 career 壳");
    const IFYN = mkSandbox(false);
    const st3 = { seedStr: "validate-state", age: 30, flags: {}, career: null, seeds: [] };
    IFYN.careerNote(st3, { set: Object.keys(FORM_OF_FLAG_CHK)[0] });
    if (st3.career !== null) err("职业账：注册表缺失时 careerNote 必须整点 no-op（fail-closed）");
  }
})();

console.log(`validate-state: 条目 ${events.length}（含核心/扩展/协同/稀有/结局）+ 出身牌 ${cardCount} + 序章幕 ${PRO && PRO.acts ? PRO.acts.length : 0} | 域 ${Object.keys(DOMAINS).length} | 里程碑 ${Object.keys(MILESTONES).length} | 枚举事实 ${Object.keys(ENUM_FACTS).length} | 家庭事实旗 ${Object.keys(FAMILY_FACTS).length} | 行当 ${tradeCount}`);
if (reservedInfo.length) { console.log(`已登记未开放（reserved）${reservedInfo.length} 项:`); reservedInfo.forEach((m) => console.log("  RESERVED", m)); }
console.log(`错误 ${errors.length} 条:`); errors.forEach((m) => console.log("  ERROR", m));
console.log(`警告 ${warnings.length} 条:`); warnings.forEach((m) => console.log("  WARN", m));
console.log(errors.length ? "RESULT: FAIL" : "RESULT: PASS");
process.exit(errors.length ? 1 : 0);
