#!/usr/bin/env node
/* 《如果那年》v0.19.0 三相机制断言——点名样本：
   ① p11_043 / p11_044 带 spouse=partnered 状态门（离异后两地链后继不出）；
   ② p28_002 带 flagAgeWithin 时间窗门（配偶离世后 ≤2 年才可抽），且落点旗 spouse_passed 由 p28_001 立；
   ③ p14_053 回响按 spouse 状态分版（echoState；partnered 用原版，widowed/divorced/single/none 用独居版）；
   附带：kidMax 与 kidMin 对称生效（p3_052）、proc_dad_care 正文按母亲状态分版（textState）。
   ⑥ 判词批 B：陪伴槽认伴侣史（partnerHistoryOf 账本回放）——手组账本直调 settlementSlots，
   覆盖丧偶再结伴 / 离婚再结伴 / 两任终局丧偶 / 此前成过家的终局 dating 四形多任分开写，
   单任四形与无账本老档与现行文案逐字比对；lifeTags 收尾段多任改写一条；
   verdictTop.relation「一起买菜」片段的 singlePartner 门（多任局 40 局零命中、单任局有命中）。
   ⑦ 判词批 C：六维一生峰值（statsPeak）——freshState 初值、sampleStatsPeak 纯 max 幂等、
   verdict 按峰值选维（峰值与终局背离时 top/bottom 均走峰值）、无峰值时回落终局选维、
   loadSave 老档迁移（无 statsPeak 按现值初始化、单维缺失逐维补、既有值不覆盖）。
   数据断言（字段在数据里）+ 功能断言（用真实引擎 met/echoText/procText 跑）两层都过才算 PASS。
   ⑬ 判词升格片（审议单 #6）：定调 verdictTone 纯函数表测（壮阔/欢快/散文三调的账本
   派生判定）、合议 verdictCouncil（故事维三腿/钱封顶三条/statsLate 晚年加分/固定维序）、
   判词纯函数化（同记录同判词、不消费游戏随机流、判词专属子流）、健康现在时断言的
   minFinal 硬门、篇幅 ≤110 与提及维度 ≥2 的构造批、statsLate 记账（60 岁定格/老档回填）。
   ⑥ 的片段门手组局自本片起钉散文调（选段带调偏向后，不钉调测不到门本身，见该组内注）。
   ⑭ 出生年内容片 c1955 批：D 表条目按公历十年 [1950,1959] 重算落点——恢复高考簇挂
   1977 公历门（年龄带派生 [18,27]）、返城镜像补 maxYear 1982、下岗根/房改/票证等 C 化
   （补 minYear/maxYear 并放宽年龄带）；ce55_01 牌文去年龄断言改公历叙事；R5：
   unmetConditions 补 maxYear 登记（与 met 同口径，差一步解释两侧完整）。
   ⑮ 序章变体扩容：0–4 小段（pr_early2 三形六文 / pr_early3 / pr_early4 各六文）与
   间隔平年（FLATS_BY_AGE 每岁四款）、c2000 包 pr_child1/pr_child2/pr_teen1 补到六款——
   索引 0 与原三文逐字比对、定款函数 2,000 种子分布、2 岁三形概率保持、新记号纯发放
   （全仓扫描只许见于 prologue.js 与 registry.js 登记）、start() 落 key 一致性。
   ⑯ 变体扩容第二轮（⑮ 的水位随本轮上调：early 三拍十文、平年六款）：early/flats 既有
   下标逐字、pr_child4 补到六款（带内扩轮换：新款挂旧记号、child4KeyFor 的 r 全域
   记号与旧版逐点全等扫描）、pr_teen2 单文扩四款（altTexts 逐款配齐 never/left 分文、款 0 逐字）、pr_y17/pr_y18
   单套扩四套（altSets 每套四轨＋尾句、套 0 逐字）、幕级定款 actVariantKeyFor 分布。
   ⑰ 结局扩容批：人生形状 15 条（结局表 17→32）数据形状 + 手组终局直调
   specialEnding——纯数据条走 met/evidence 本体，形状门条（终局年龄/伴侣史/statsLate/
   usedRare）正反两侧都测：形状不合必须剔除。
   ⑱ 退休可能性池（游戏性波次第一波）：52 条 rt_* 新拍数据形状（minYear 硬门、邮轮
   stats 双档门、链锚旗落账、p24_051 同落 class_joined、shop_wound_down 与本体
   shop_closed 分立）＋ met 功能断言（直播 2016 公历年门按出生年派生、游山玩水链
   露面/经手的时间窗接力、带孙辈链的孩子年龄门、邮轮钱档分流）＋平年回响侧表
   （FLAT_ADULT 5–13 下标旗守卫、旧行 0–4 无守卫）。
   用法：node scripts/stateline-assert.js */
"use strict";
const fs = require("fs"), vm = require("vm"), path = require("path");
const ROOT = path.join(__dirname, "..");
const PACK_FILES = ["src/content/pool/pack1.js", "src/content/pool/pack2.js", "src/content/pool/pack3.js", "src/content/pool/pack4.js", "src/content/pool/pack5.js", "src/content/pool/pack6.js", "src/content/pool/pack9.js", "src/content/pool/pack10.js", "src/content/pool/pack11.js", "src/content/pool/pack12.js", "src/content/lines/side-and-steady.js", "src/content/pool/pack14.js", "src/content/pool/pack15.js", "src/content/lines/exam.js", "src/content/pool/pack17.js", "src/content/pool/pack18.js", "src/content/pool/pack19.js", "src/content/pool/pack20.js", "src/content/pool/pack21.js", "src/content/pool/pack22.js", "src/content/pool/pack23.js", "src/content/lines/late-life.js", "src/content/pool/pack25.js", "src/content/pool/pack26.js", "src/content/pool/pack27.js", "src/content/pool/pack28.js", "src/content/pool/pack29.js", "src/content/pool/pack30.js", "src/content/pool/pack33.js", "src/content/pool/pack31.js", "src/content/pool/pack32.js", "src/content/pool/pack34.js", "src/content/pool/pack35.js", "src/content/pool/pack36.js", "src/content/pool/pack37.js", "src/content/pool/pack38.js", "src/content/pool/pack39.js", "src/content/pool/pack40.js", "src/content/pool/pack41.js", "src/content/pool/pack42.js", "src/content/pool/pack43.js", "src/content/pool/pack44.js", "src/content/pool/pack45.js", "src/content/pool/pack46.js", "src/content/pool/pack47.js", "src/content/pool/pack48.js", "src/content/pool/pack49.js", "src/content/lines/covenant.js", "src/content/lines/process-beats.js", "src/content/lines/abroad.js", "src/content/era/era1955.js", "src/content/era/era1965.js", "src/content/era/era1978.js", "src/content/era/era1985.js"];

let pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log("  PASS", name); } else { fail++; console.log("  FAIL", name); } }

// ---- 装载（与 stateline-scan 同法：VM 载入真实数据与引擎探针导出） ----
const store = new Map();
const appEl = { addEventListener() {}, classList: { remove() {}, add() {}, toggle() {} }, set innerHTML(v) {}, get innerHTML() { return ""; } };
const sandbox = {
  window: { addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }), innerWidth: 390 },
  document: { getElementById: (id) => (id === "app" ? appEl : null), addEventListener() {}, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({ getContext: () => null, style: {} }), hidden: false },
  localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
  location: { search: "", origin: "http://assert", pathname: "/" }, navigator: {}, setTimeout, clearTimeout, requestAnimationFrame: () => {}, console,
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
const load = (rel) => vm.runInContext(fs.readFileSync(path.join(ROOT, rel), "utf8"), sandbox, { filename: rel });
load("src/events.js");
for (const p of PACK_FILES) load(p);
load("src/content/prologue/cards.js"); load("src/content/rare/synergy.js"); load("src/content/registry-v023.js"); load("src/content/registry-wp2.js"); load("src/content/registry-wp3.js"); load("src/content/registry-wp4.js"); load("src/content/registry-wp5.js"); load("src/content/registry-wp6.js"); load("src/content/registry-wp7.js"); load("src/content/registry-wp8.js"); load("src/content/registry-retire.js"); load("src/world/state.js"); load("src/registry.js"); load("src/anchors.js"); load("src/rhythm.js"); load("src/content/prologue/prologue-c1955.js"); load("src/content/prologue/prologue-c1965.js"); load("src/content/prologue/prologue-c1978.js"); load("src/content/prologue/prologue-c1985.js"); load("src/content/prologue/prologue-c1995.js"); load("src/content/prologue/prologue.js"); load("src/storylet.js"); // v0.20.0 M1-B：storylet 在 prologue 之后、引擎之前并入并挂 sl（序同 index.html）；v0.23 WP1：登记数据文件在 state.js 之前（序同 index.html）
const ENGINE_FILES = ["src/engine.js", "src/world/apply.js", "src/record.js", "src/world/processes/parents.js", "src/world/processes/spouse.js", "src/world/processes/work.js", "src/world/processes/place.js", "src/world/processes/health.js", "src/scheduler.js", "src/world/shadow-life.js", "src/world/shadow-policy.js", "src/views/stream.js", "src/views/year.js", "src/views/shadow.js", "src/views/settlement.js", "src/views/share.js"]; // v0.20.0 引擎模块（各自独立包装器，共享 window.IFY），按 index.html 顺序逐个真实载入，不再拼接（engine-boot.js 不载：断言不需要开局渲染）；判词批 B 起补载 shadow-life/shadow-policy（settlementSlots 的 playerMeta 依赖，同 sim.js 装载序）
for (const rel of ENGINE_FILES) load(rel);
vm.runInContext("window.__P = { get S() { return window.IFY.S; }, set S(v) { window.IFY.S = v; }, freshState: window.IFY.freshState, met: window.IFY.met, echoText: window.IFY.echoText, procText: window.IFY.procText, settlementSlots: window.IFY.settlementSlots, lifeTags: window.IFY.lifeTags, verdict: window.IFY.verdict, partnerHistoryOf: window.IFY.partnerHistoryOf, D: window.IFY.D };", sandbox, { filename: "probe-export" });
vm.runInContext("window.__P.sampleStatsPeak = window.IFY.sampleStatsPeak; window.__P.loadSave = window.IFY.loadSave;", sandbox, { filename: "probe-export-c" });
vm.runInContext("window.__P.unmetConditions = window.IFY.unmetConditions; window.__P.anyFamilyAlive = window.IFY.anyFamilyAlive; window.__P.specificity = window.IFY.specificity;", sandbox, { filename: "probe-export-d" });
vm.runInContext("window.__P.flatLineOk = window.IFY.flatLineOk; window.__P.flatMicroNeeds = window.IFY.flatMicroNeeds; window.__P.flatAdultNeeds = window.IFY.flatAdultNeeds; window.__P.flatAdult = window.IFY.RHYTHM.flatAdult;", sandbox, { filename: "probe-export-e" });
vm.runInContext("window.__P.deathCausePool = window.IFY.deathCausePool; window.__P.deathCauses = window.IFY.DEATH_CAUSES; window.__P.deathCauseIds = window.IFY.DEATH_CAUSE_IDS; window.__P.withLife = window.IFY.withLife;", sandbox, { filename: "probe-export-f" });
vm.runInContext("window.__P.examPending = window.IFY.examPending;", sandbox, { filename: "probe-export-g" });
vm.runInContext("window.__P.verdictTone = window.IFY.verdictTone; window.__P.verdictCouncil = window.IFY.verdictCouncil; window.__P.sampleStatsLate = window.IFY.sampleStatsLate; window.__P.RNG = window.IFY.RNG; window.__P.RNGW = window.IFY.RNGW; window.__P.RNGA = window.IFY.RNGA;", sandbox, { filename: "probe-export-h" });
vm.runInContext("window.__P.eventPool = window.IFY.eventPool;", sandbox, { filename: "probe-export-i" }); // ⑱：81+ 年龄窗只能经 eventPool 实测（met 不查年龄；项目 sim 驱动 advance 钉顶 80 岁，81+ 拍在 sim 里不可达）
const P = sandbox.window.__P;
const byId = {};
for (const e of P.D.events || []) if (e.id) byId[e.id] = e;

// ---- ① 数据断言：两地链后继的 spouse 门 ----
console.log("① p11_043 / p11_044 spouse 门");
for (const id of ["p11_043", "p11_044"]) {
  const e = byId[id];
  ok(!!e, `${id} 存在`);
  ok(e && e.stateAll && e.stateAll.spouse === "partnered", `${id} stateAll.spouse === "partnered"`);
  ok(e && e.require === "two_cities" && !!e.chain, `${id} 原 two_cities require 与 chain 保留`);
}
// ---- ② 数据断言：身后手续时间窗 ----
console.log("② p28_002 flagAgeWithin 时间窗门");
{
  const e2 = byId.p28_002, e1 = byId.p28_001;
  ok(!!e2 && !!e1, "p28_001 / p28_002 存在");
  ok(e1 && e1.set === "spouse_passed", "p28_001 立落点旗 spouse_passed");
  ok(e2 && e2.flagAgeWithin && e2.flagAgeWithin.flag === "spouse_passed" && e2.flagAgeWithin.years === 2, "p28_002 flagAgeWithin = {flag: spouse_passed, years: 2}");
  const reg = sandbox.window.GAME_REGISTRY;
  ok(reg && reg.milestones && reg.milestones.spouse_passed && reg.milestones.spouse_passed.setters.includes("p28_001"), "registry 里程碑 spouse_passed 已登记（setter p28_001）");
}
// ---- ③ 数据断言：p14_053 回响分版 ----
console.log("③ p14_053 echoState 回响分版");
{
  const e = byId.p14_053, c0 = e && e.choices && e.choices[0];
  ok(!!c0, "p14_053 首选项存在");
  ok(c0 && c0.echo.includes("对方说：是我定的。"), "partnered 原版回响保留在 echo 字段");
  const m = c0 && c0.echoState && c0.echoState.spouse;
  ok(!!m, "echoState.spouse 存在（通用形状 {域:{状态值:文本}}）");
  ok(m && typeof m.widowed === "string" && !m.widowed.includes("对方说"), "widowed 版为独居口径（无伴侣开口）");
  ok(m && typeof m.divorced === "string" && !m.divorced.includes("对方说"), "divorced 版为独居口径");
  ok(m && typeof m.single === "string" && typeof m.none === "string", "single / none 版齐备");
}

// ---- 功能断言：真实引擎 met / echoText / procText ----
function freshS() {
  const S = P.freshState("ASSERT-SEED");
  P.S = S;
  S.route = { id: "home" }; S.era = "c2000"; S.birthYear = 2000; S.age = 40;
  return S;
}
console.log("功能：met() 门行为");
{
  let S = freshS();
  S.flags.two_cities = true; S.usedEvents = ["p11_042"]; S.age = 40;
  S.state.spouse = "divorced";
  ok(P.met(byId.p11_043) === false && P.met(byId.p11_044) === false, "离异时 p11_043/044 不出");
  S.state.spouse = "partnered";
  ok(P.met(byId.p11_043) === true, "partnered 时 p11_043 可出（其余门满足）");
  S.age = 44; // p11_044 窗口 32–50、chain p11_043 需先行
  S.usedEvents = ["p11_042", "p11_043"];
  ok(P.met(byId.p11_044) === true, "partnered + chain 已行时 p11_044 可出");
}
{
  let S = freshS();
  S.state.spouse = "widowed"; S.age = 60;
  S.flagAges = { spouse_passed: 57 };
  ok(P.met(byId.p28_002) === false, "离世后 3 年 p28_002 不出（超 2 年窗）");
  S.flagAges = { spouse_passed: 58 };
  ok(P.met(byId.p28_002) === true, "离世后 2 年 p28_002 可出（窗内）");
  S.flagAges = {};
  ok(P.met(byId.p28_002) === false, "无落点年龄记录时 p28_002 不出（fail-closed）");
}
{
  let S = freshS();
  S.state.kids = "has"; S.kidsAt = 38;
  S.age = 46; // kidAge 8 > kidMax 6
  ok(P.met(byId.p3_052) === false, "kidAge 8 时 p3_052 不出（kidMax 6）");
  S.age = 44; // kidAge 6
  ok(P.met(byId.p3_052) === true, "kidAge 6 时 p3_052 可出");
  S.age = 40; // kidAge 2 < kidMin 3
  ok(P.met(byId.p3_052) === false, "kidAge 2 时 p3_052 不出（kidMin 3）");
}
console.log("功能：echoText / procText 分版");
{
  let S = freshS();
  const c0 = byId.p14_053.choices[0];
  S.state.spouse = "partnered";
  ok(P.echoText(c0) === c0.echo, "partnered 回响 = 原版");
  S.state.spouse = "widowed";
  ok(P.echoText(c0) === c0.echoState.spouse.widowed && !P.echoText(c0).includes("对方说"), "widowed 回响 = 独居版");
  S.state.spouse = "divorced";
  ok(P.echoText(c0) === c0.echoState.spouse.divorced, "divorced 回响 = 独居版");
  const proc = byId.proc_dad_care;
  S.state.mom = "alive";
  ok(P.procText(proc) === proc.text, "母亲在世时 proc_dad_care = 原版");
  S.state.mom = "dead";
  const solo = P.procText(proc);
  ok(solo === proc.textState.mom.dead && !solo.includes("你妈在电话"), "母亲已故时 proc_dad_care = 父亲单人版（母亲不开口）");
}

// ---- ⑥ 判词批 B：陪伴槽认伴侣史（手组账本直调 settlementSlots） ----
console.log("⑥ 判词批 B：陪伴槽 / 收尾段认伴侣史 + 判词片段门");
const LE = (age, to) => ({ age, kind: "state", id: "spouse>" + to });
function slotS2(entries, spouseFinal) {
  const S = freshS();
  S.age = 84; S.death = { age: 84, type: "health", text: "" };
  S.ledger = entries.map(([a, t]) => LE(a, t));
  S.state.spouse = spouseFinal;
  const row = P.settlementSlots().find(([k]) => k === "陪伴");
  return row && row[1];
}
{ // 数据断言：farm 对照行 + relation 片段门字段
  ok(!!P.D.shadows.farm && Array.isArray(P.D.shadows.farm.stages) && P.D.shadows.farm.stages.length === 3 && P.D.shadows.farm.stages.every((s) => s.length === 4) && P.D.shadows.farm.teaser.length === 3 && P.D.shadows.farm.cost.length === 3, "D.shadows.farm 同形补齐（name/teaser×3/stages 3×4/cost×3）");
  const frag = (P.D.verdictTop.relation || []).find((f) => typeof f !== "string" && f.t.includes("一起买菜"));
  ok(!!frag && frag.needs && frag.needs.singlePartner === true && frag.needs.notFlag === "spouse_passed", "verdictTop.relation 买菜片段带 singlePartner + notFlag spouse_passed 门");
}
{ // 多任四形：分开写
  ok(slotS2([[31, "partnered"], [61, "widowed"], [71, "partnered"]], "partnered") === "61岁那年，对方先走了一步。后来遇上的这个，陪着走到了最后。到老了，还是一张桌上吃饭。", "丧偶再结伴（61 逝、71 再结伴）：先逝一段 + 再结伴一段分开写");
  ok(slotS2([[31, "partnered"], [45, "divorced"], [52, "partnered"]], "partnered") === "先前那段婚姻，中途散了。后来遇上的这个，陪着走到了最后。到老了，还是一张桌上吃饭。", "离婚再结伴：离异一段 + 再结伴一段分开写");
  ok(slotS2([[31, "partnered"], [50, "divorced"], [55, "partnered"], [70, "widowed"]], "widowed") === "先前那段婚姻，中途散了。后来的这位，也先走了一步。最后一段路，是自己走完的。", "两任终局丧偶：前段离异 + 后段病故分开写");
  ok(slotS2([[31, "partnered"], [61, "widowed"], [70, "dating"]], "dating") === "61岁那年，对方先走了一步。后来又遇上一个人，没领证，也没散，就这么处到了老。", "此前成过家、终局 dating：不写成连续的「一直有个人」");
  ok(slotS2([[31, "partnered"], [50, "widowed"], [55, "partnered"], [68, "divorced"]], "divorced") === "50岁那年，对方先走了一步。后来的这段，也散了。后来的日子，各过各的。", "前任病故、终局离异：先逝一段 + 离异一段分开写");
  ok(slotS2([[31, "partnered"], [50, "widowed"], [55, "partnered"], [70, "widowed"]], "widowed") === "50岁那年，对方先走了一步。后来的这位，也先走了一步。最后一段路，是自己走完的。", "两任皆逝：两位先后病故分开写（自然局未筛到，构造断言坐实）");
  ok(slotS2([[31, "partnered"], [40, "widowed"], [48, "partnered"], [58, "divorced"], [66, "partnered"]], "partnered") === "再往前的日子里，有人先走了一步，也有婚姻中途散了。后来遇上的这个，陪着走到了最后。到老了，还是一张桌上吃饭。", "三任压缩形：前任合成一句 + 最后一段收尾");
}
{ // 单任四形 + 相处期散了 + 无账本：与现行文案逐字比对
  ok(slotS2([[31, "partnered"]], "partnered") === "另一半陪着走到了最后。几十年里吵过，也和好过，到老了还是一张桌上吃饭。", "单任 partnered = 现行原文（逐字）");
  ok(slotS2([[31, "partnered"], [66, "widowed"]], "widowed") === "另一半先走了一步。最后一段路，是自己走完的。", "单任 widowed = 现行原文（逐字）");
  ok(slotS2([[31, "partnered"], [45, "divorced"]], "divorced") === "中间那段婚姻散了。后来的日子，各过各的。", "单任 divorced = 现行原文（逐字）");
  ok(slotS2([[31, "dating"], [40, "partnered"]], "partnered") === "另一半陪着走到了最后。几十年里吵过，也和好过，到老了还是一张桌上吃饭。", "相处转定下来是同一任 = 现行原文（逐字）");
  ok(slotS2([[28, "dating"], [30, "single"], [35, "partnered"]], "partnered") === "另一半陪着走到了最后。几十年里吵过，也和好过，到老了还是一张桌上吃饭。", "相处期散了不算一任 = 现行原文（逐字）");
  ok(slotS2([[31, "dating"]], "dating") === "身边一直有个人，没领证，也没散，就这么处到了老。", "单任 dating = 现行原文（逐字）");
  ok(slotS2([], "partnered") === "另一半陪着走到了最后。几十年里吵过，也和好过，到老了还是一张桌上吃饭。", "无账本老档 partnered = 现行原文（回落，逐字）");
  ok(slotS2([], "widowed") === "另一半先走了一步。最后一段路，是自己走完的。", "无账本老档 widowed = 现行原文（回落，逐字）");
}
{ // lifeTags 收尾段：多任改写、单任逐字
  const tagsOf = (entries, spouseFinal, extra) => {
    const S = freshS();
    S.age = 84; S.death = { age: 84, type: "health", text: "" };
    S.ledger = entries.map(([a, t]) => LE(a, t));
    S.state.spouse = spouseFinal;
    if (extra) extra(S);
    return P.lifeTags();
  };
  ok(tagsOf([[31, "partnered"], [61, "widowed"], [71, "partnered"]], "partnered").endsWith("送走过一位，后来和老伴走完这一生"), "lifeTags 多任 partnered：收尾认先逝的前任");
  ok(tagsOf([[31, "partnered"], [55, "widowed"], [63, "partnered"], [77, "widowed"]], "widowed").endsWith("两位老伴都先走，最后一段自己过"), "lifeTags 两任终局丧偶：收尾认两位");
  ok(tagsOf([[31, "partnered"]], "partnered").endsWith("和老伴走完这一生"), "lifeTags 单任 partnered：收尾 = 现行原文（逐字）");
  ok(tagsOf([[31, "partnered"], [66, "widowed"]], "widowed").endsWith("老伴先走，最后一段自己过"), "lifeTags 单任 widowed：收尾 = 现行原文（逐字）");
}
{ // 判词片段门：relation 顶维下，多任局抽不到「一起买菜」、单任局抽得到
  const fragRun = (seed, entries, spouseFinal, flags) => {
    const S = P.freshState(seed);
    P.S = S;
    S.route = { id: "home" }; S.era = "c2000"; S.birthYear = 2000; S.age = 80;
    S.stats = { health: 10, money: 10, growth: 10, freedom: 10, relation: 95, wisdom: 10 };
    S.statsPeak = { ...S.stats }; // 判词批 C 适配：选维改读峰值后，手组局须给自洽峰值（峰值=终局的退化形），本组只验片段门不验选维
    S.state.spouse = spouseFinal;
    S.ledger = entries.map(([a, t]) => LE(a, t));
    if (flags) Object.assign(S.flags, flags);
    // 判词升格片（⑬）适配：选段自本片起带调偏向——本组手组局（关系峰值 95）天然判欢快，
    // 欢快标志段会先行占位、测不到片段门本身。故把变故数钉在 2（散文带：<3 不壮阔、
    // >1 不欢快、总跌幅 0），选段落回无标记池；片段门（factOkHere 的 singlePartner
    // 复合判）与下方三条断言一字不变，验的仍是门本身。
    S.flags.laid_off = true;
    if (!entries.some(([, t]) => t === "widowed" || t === "divorced")) S.crisisUsed = { assert_probe: 1 };
    return P.verdict().text;
  };
  let hitSingle = 0, hitMulti = 0, hitMultiNoFlag = 0;
  for (let i = 0; i < 40; i++) {
    if (fragRun("FRAG-S-" + i, [[31, "partnered"]], "partnered").includes("一起买菜")) hitSingle++;
    if (fragRun("FRAG-M-" + i, [[31, "partnered"], [61, "widowed"], [71, "partnered"]], "partnered", { spouse_passed: true }).includes("一起买菜")) hitMulti++;
    if (fragRun("FRAG-D-" + i, [[31, "partnered"], [45, "divorced"], [52, "partnered"]], "partnered").includes("一起买菜")) hitMultiNoFlag++;
  }
  ok(hitMulti === 0, `丧偶再结伴局 40 局「一起买菜」命中 ${hitMulti}（应为 0）`);
  ok(hitMultiNoFlag === 0, `离婚再结伴局（无专属旗）40 局「一起买菜」命中 ${hitMultiNoFlag}（应为 0，靠 singlePartner 账本门）`);
  ok(hitSingle > 0, `单任局 40 局「一起买菜」命中 ${hitSingle}（应 > 0，片段仍在池中）`);
}

// ---- ⑦ 判词批 C：六维一生峰值 statsPeak ----
console.log("⑦ 判词批 C：峰值记录 / 采样 / 按峰值选维 / 老档迁移");
{
  const KEYS6 = ["health", "money", "growth", "freedom", "relation", "wisdom"];
  const S0 = P.freshState("PEAK-INIT");
  ok(!!S0.statsPeak && KEYS6.every((k) => S0.statsPeak[k] === S0.stats[k]), "freshState：statsPeak 以开局六维初始化");
  // 采样纯 max + 幂等 + 不动 stats 本身
  const S1 = freshS();
  S1.stats = { health: 70, money: 80, growth: 40, freedom: 50, relation: 60, wisdom: 35 };
  S1.statsPeak = { health: 60, money: 45, growth: 50, freedom: 50, relation: 50, wisdom: 40 };
  P.sampleStatsPeak();
  ok(KEYS6.every((k) => S1.statsPeak[k] === Math.max({ health: 60, money: 45, growth: 50, freedom: 50, relation: 50, wisdom: 40 }[k], S1.stats[k])), "sampleStatsPeak：逐维 max 并入");
  const snap = JSON.stringify(S1.statsPeak);
  S1.stats = { health: 10, money: 10, growth: 10, freedom: 10, relation: 10, wisdom: 10 };
  P.sampleStatsPeak();
  ok(JSON.stringify(S1.statsPeak) === snap && S1.stats.health === 10, "sampleStatsPeak：低值再采样峰值不降（幂等）、stats 本身不被改写");
  // verdict 按峰值选维：终局 top=relation/bottom=health，峰值 top=health/bottom=wisdom
  const vRun = (withPeak) => {
    const S = P.freshState("PEAK-V-" + (withPeak ? "Y" : "N"));
    P.S = S;
    S.route = { id: "home" }; S.era = "c2000"; S.birthYear = 2000; S.age = 80;
    S.stats = { health: 20, money: 30, growth: 40, freedom: 50, relation: 60, wisdom: 35 };
    if (withPeak) S.statsPeak = { health: 90, money: 85, growth: 40, freedom: 50, relation: 60, wisdom: 35 };
    else delete S.statsPeak;
    S.state.spouse = "partnered";
    return P.verdict();
  };
  const vP = vRun(true);
  ok(vP.top === "health" && vP.bottom === "wisdom", `verdict 有峰值时按峰值选维（top=${vP.top} 应 health、bottom=${vP.bottom} 应 wisdom）`);
  const vF = vRun(false);
  ok(vF.top === "relation" && vF.bottom === "health", `verdict 无峰值（迁移前保险读法）回落终局选维（top=${vF.top} 应 relation、bottom=${vF.bottom} 应 health）`);
  // loadSave 老档迁移：无 statsPeak → 按现值初始化；单维缺失 → 逐维补、既有不覆盖
  const mkSave = (peakVal) => {
    const S = P.freshState("PEAK-OLD");
    S.route = { id: "corp" };
    S.stats = { health: 33, money: 44, growth: 55, freedom: 66, relation: 77, wisdom: 88 };
    if (peakVal === undefined) delete S.statsPeak; else S.statsPeak = peakVal;
    return JSON.stringify(S);
  };
  store.set("ify-save-v2", mkSave(undefined));
  const back1 = P.loadSave();
  ok(!!back1 && KEYS6.every((k) => back1.statsPeak[k] === back1.stats[k]), "loadSave 老档（无 statsPeak）：按载入时六维现值初始化峰值");
  store.set("ify-save-v2", mkSave({ health: 99 }));
  const back2 = P.loadSave();
  ok(!!back2 && back2.statsPeak.health === 99 && KEYS6.every((k) => k === "health" || back2.statsPeak[k] === back2.stats[k]), "loadSave 老档（statsPeak 只剩一维）：既有 99 不覆盖、其余逐维按现值补");
  store.delete("ify-save-v2");
}

// ---- ⑧ 判词批 D：家族事实门一族 ----
console.log("⑧ 判词批 D：anyFamilyAlive 派生 / 「你们」现行伴侣门 / p21_030 分版 / 「家里人」门");
const byIdD = {};
for (const e of [...(P.D.events || []), ...(P.D.rare || [])]) if (e.id) byIdD[e.id] = e;
{ // 派生真值表：空屋全假、任一成立即真；旧状态（divorced/widowed/single）与未定不算
  const fam = (patch) => { const S = freshS(); Object.assign(S.state, { dad: "dead", mom: "dead", spouse: "none", kids: "none" }, patch); return P.anyFamilyAlive(S); };
  ok(fam({}) === false, "D 派生: 空屋（双亲故、无伴侣、无子女）= false");
  ok(fam({ dad: "alive" }) === true && fam({ mom: "alive" }) === true, "D 派生: 父或母任一在世 = true");
  ok(fam({ spouse: "partnered" }) === true && fam({ spouse: "dating" }) === true, "D 派生: partnered/dating = true");
  ok(fam({ spouse: "divorced" }) === false && fam({ spouse: "widowed" }) === false && fam({ spouse: "single" }) === false, "D 派生: divorced/widowed/single 不算 = false");
  ok(fam({ kids: "has" }) === true && fam({ kids: "undecided" }) === false, "D 派生: 有子女 = true、未定 = false");
}
{ // 「你们」门矩阵：坏状态（none/single/divorced/widowed）全灭、partnered/dating 可过
  const BAD = ["none", "single", "divorced", "widowed"], GOOD = ["partnered", "dating"];
  const cases = [
    ["p3_044", (S) => { S.flags.together = true; S.usedEvents = ["p3_043"]; S.age = 45; }],
    ["p3_048", (S) => { S.state.kids = "has"; S.age = 40; S.kidsAt = 40; S.kidsBornAt = 40; }],
    ["p3_057", (S) => { S.state.kids = "has"; S.age = 50; S.kidsAt = 40; S.kidsBornAt = 40; }],
    ["p3_061", (S) => { S.state.kids = "has"; S.age = 55; S.kidsAt = 42; S.kidsBornAt = 42; }],
    ["p3_062", (S) => { S.state.kids = "has"; S.age = 58; S.kidsAt = 40; S.kidsBornAt = 40; }],
    ["p3_072", (S) => { S.state.kids = "none"; S.age = 45; }],
    ["p2_075", (S) => { S.age = 33; }],
    ["p4_001", (S) => { S.age = 45; }],
    ["lk_none", (S) => { S.flags.late_try = true; S.usedEvents = ["lk_wait"]; S.state.kids = "undecided"; S.age = 52; }],
    ["lk_fade", (S) => { S.flags.late_try = true; S.state.kids = "undecided"; S.age = 54; }],
  ];
  for (const [id, setup] of cases) {
    const e = byIdD[id];
    ok(!!e, `D 「你们」: ${id} 存在`);
    let badAll = true, goodAll = true; const detail = [];
    for (const sp of BAD) { const S = freshS(); setup(S); S.state.spouse = sp; const m = P.met(e); detail.push(`${sp}:${m ? "过" : "灭"}`); if (m) badAll = false; }
    for (const sp of GOOD) { const S = freshS(); setup(S); S.state.spouse = sp; const m = P.met(e); detail.push(`${sp}:${m ? "过" : "灭"}`); if (!m) goodAll = false; }
    ok(badAll && goodAll, `D 「你们」: ${id} 坏状态全灭、partnered/dating 可过（${detail.join(" ")}）`);
  }
  // p3_078 不挂门、补 textState none 变体：任何无伴侣状态下解析文本不得含「你们」
  const e78 = byIdD.p3_078;
  ok(!!e78 && e78.textState && typeof e78.textState.spouse.none === "string", "D 「你们」: p3_078 textState.spouse.none 变体已补");
  for (const sp of ["none", "single", "divorced", "widowed"]) {
    const S = freshS(); S.state.kids = "none"; S.state.spouse = sp; S.age = 54;
    const t = P.procText(e78);
    ok(typeof t === "string" && !t.includes("你们"), `D 「你们」: p3_078 在 spouse=${sp} 时文本无「你们」`);
  }
  { const S = freshS(); S.state.kids = "none"; S.state.spouse = "partnered"; S.age = 54;
    ok(P.procText(e78).includes("你们把次卧"), "D 「你们」: p3_078 在 partnered 时仍出原文"); }
}
{ // p21_030 分版：双亲在世出原版、只剩一位出单人版
  const e = byIdD.p21_030;
  ok(!!e && e.textState && e.textState.dad && e.textState.mom, "D p21_030: textState dad/mom 变体已补");
  const setup = (S) => { S.state.kids = "has"; S.age = 60; S.kidsAt = 35; S.kidsBornAt = 35; };
  let S = freshS(); setup(S);
  ok(P.procText(e).includes("父母这边复查"), "D p21_030: 双亲在世出原版（父母这边复查）");
  S = freshS(); setup(S); S.state.dad = "dead";
  ok(P.procText(e).includes("母亲这边复查") && !P.procText(e).includes("父母这边"), "D p21_030: 父故母存出单人版（母亲这边复查）");
  S = freshS(); setup(S); S.state.mom = "dead";
  ok(P.procText(e).includes("父亲这边复查") && !P.procText(e).includes("父母这边"), "D p21_030: 母故父存出单人版（父亲这边复查）");
}
{ // 「家里人」39 条：数据形状 + met/unmetConditions 同判（空屋灭、家里有人过）
  const FAM39 = [
    ["p3_033", (S) => { S.state.spouse = "single"; S.age = 40; }],
    ["p4_049", (S) => { S.age = 60; }],
    ["p10_012", (S) => { S.flags.run_marathon = true; S.age = 55; }],
    ["p10_037", (S) => { S.age = 35; }],
    ["p10_056", (S) => { S.age = 50; }],
    ["p10_073", (S) => { S.flags.warned_family_scam = true; S.age = 55; }],
    ["p12_028", (S) => { S.age = 42; }],
    ["p13_048", (S) => { S.flags.stay_put = true; S.flags.factory_work = true; S.age = 52; }],
    ["p14_013", (S) => { S.age = 66; }],
    ["p15_010", (S) => { S.flags.factory_work = true; S.age = 42; }],
    ["p15_031", (S) => { S.era = "c1955"; S.age = 37; }],
    ["p15_032", (S) => { S.era = "c1955"; S.flags.bought_renzheng = true; S.age = 40; }],
    ["p15_035", (S) => { S.era = "c1955"; S.flags.factory_work = true; S.age = 38; }],
    ["p17_050", (S) => { S.age = 44; }],
    ["p17_053", (S) => { S.age = 46; }],
    ["p19_031", (S) => { S.flags.shop_work = true; S.age = 42; }],
    ["p19_041", (S) => { S.era = "c1955"; S.age = 33; }],
    ["p19_042", (S) => { S.era = "c1955"; S.age = 33; }],
    ["p19_060", (S) => { S.era = "c1965"; S.age = 39; }],
    ["p19_063", (S) => { S.era = "c1965"; S.age = 41; }],
    ["p19_069", (S) => { S.era = "c1965"; S.age = 45; }],
    ["p20_025", (S) => { S.flags.factory_work = true; S.age = 37; }],
    ["p20_062", (S) => { S.age = 60; }],
    ["p21_013", (S) => { S.age = 47; }],
    ["p21_062", (S) => { S.age = 76; }],
    ["p22_028", (S) => { S.age = 62; }],
    ["p23_022", (S) => { S.age = 63; }],
    ["p23_036", (S) => { S.era = "c1955"; S.flags.factory_work = true; S.age = 62; }],
    ["p30_001", (S) => { S.flags.factory_work = true; S.age = 45; }],
    ["p30_008", (S) => { S.flags.shop_work = true; S.age = 45; }],
    ["p30_010", (S) => { S.flags.factory_work = true; S.age = 42; }],
    ["p30_011", (S) => { S.flags.bought_house = true; S.age = 40; }],
    ["p33_018", (S) => { S.flags.hook_era_tape = true; S.age = 35; }],
    ["p33_021", (S) => { S.flags.hook_era_olympic = true; S.age = 32; }],
    ["farm_township", (S) => { S.flags.farm_work = true; S.route = { id: "farm" }; S.era = "c1985"; S.age = 30; }],
    ["farm_township_back", (S) => { S.flags.township_work = true; S.usedEvents = ["farm_township"]; S.route = { id: "farm" }; S.era = "c1985"; S.age = 40; }],
    ["ab37_023", (S) => { S.route = { id: "abroad" }; S.state.abroadKind = "dispatch"; S.age = 60; }],
    ["ab37_027", (S) => { S.route = { id: "abroad" }; S.age = 72; }],
    ["e78_055", (S) => { S.era = "c1978"; S.age = 58; }],
  ];
  ok(FAM39.length === 39, "D 家里人: 挂门清单 39 条");
  for (const [id, setup] of FAM39) {
    const e = byIdD[id];
    ok(!!e && e.anyFamilyAlive === true, `D 家里人: ${id} 已挂 anyFamilyAlive`);
    let S = freshS(); setup(S); Object.assign(S.state, { dad: "dead", mom: "dead", kids: "none" }); if (id !== "p3_033") S.state.spouse = "none"; else S.state.kids = "none";
    const mEmpty = P.met(e), uEmpty = P.unmetConditions(e).unmet.some((u) => u.kind === "family");
    S = freshS(); setup(S); S.state.dad = "alive";
    const mFam = P.met(e), uFam = P.unmetConditions(e).unmet.some((u) => u.kind === "family");
    ok(mEmpty === false && uEmpty === true && mFam === true && uFam === false,
      `D 家里人: ${id} 空屋 met 灭 + unmet 报 family、父在世 met 过 + unmet 无 family（met ${mEmpty}/${mFam}）`);
  }
}
{ // specificity 位移：仅 p3_044 因新增 stateAll 键 +1；合并入既有键与 anyFamilyAlive/textState 均 +0
  const strip = (e, fn) => { const c = JSON.parse(JSON.stringify(e)); fn(c); return P.specificity(c); };
  const e44 = byIdD.p3_044;
  ok(P.specificity(e44) - strip(e44, (c) => delete c.stateAll) === 1, "D specificity: p3_044 新增 stateAll 键 +1");
  const e48 = byIdD.p3_048;
  ok(P.specificity(e48) - strip(e48, (c) => delete c.state.spouse) === 0, "D specificity: p3_048 spouse 合并入既有 state 键 +0");
  const e14 = byIdD.p14_013;
  ok(P.specificity(e14) - strip(e14, (c) => delete c.anyFamilyAlive) === 0, "D specificity: anyFamilyAlive 不在计分键表 +0（p14_013）");
  const e21 = byIdD.p21_030;
  ok(P.specificity(e21) - strip(e21, (c) => delete c.textState) === 0, "D specificity: p21_030 textState 不计分 +0");
}

// ---- ⑨ 判词批 D 扩展：晚育链/两地线/孩子对双亲说话型 同病条目 ----
console.log("⑨ 判词批 D 扩展：lk_born/lk_check 现行伴侣门 / 两地线 stateAll 门 / 双亲说话型 spouse 门 / pack34 分版条目文本断言");
{ // 门矩阵：坏状态（none/single/divorced/widowed）全灭、partnered/dating 可过
  const BAD = ["none", "single", "divorced", "widowed"], GOOD = ["partnered", "dating"];
  const cases = [
    ["lk_born", (S) => { S.flags.late_try = true; S.usedEvents = ["lk_wait"]; S.state.kids = "undecided"; S.age = 50; }],
    ["lk_check", (S) => { S.flags.late_try = true; S.age = 47; }],
    ["lk_wait", (S) => { S.flags.late_try = true; S.usedEvents = ["lk_check"]; S.age = 48; }],
    ["p13_026", (S) => { S.flags.two_cities = true; S.age = 42; }],
    ["p13_027", (S) => { S.flags.two_cities = true; S.age = 48; }],
    ["p13_028", (S) => { S.flags.two_cities = true; S.age = 52; }],
    ["p14_034", (S) => { S.state.kids = "has"; S.age = 70; S.kidsAt = 32; S.kidsBornAt = 32; }],
    ["p23_061", (S) => { S.state.kids = "has"; S.era = "c1965"; S.birthYear = 1965; S.age = 63; }],
    ["p12_030", (S) => { S.state.kids = "has"; S.age = 50; S.kidsAt = 31; S.kidsBornAt = 31; }],
  ];
  for (const [id, setup] of cases) {
    const e = byIdD[id];
    ok(!!e, `D-ext 门矩阵: ${id} 存在`);
    let badAll = true, goodAll = true; const detail = [];
    for (const sp of BAD) { const S = freshS(); setup(S); S.state.spouse = sp; const m = P.met(e); detail.push(`${sp}:${m ? "过" : "灭"}`); if (m) badAll = false; }
    for (const sp of GOOD) { const S = freshS(); setup(S); S.state.spouse = sp; const m = P.met(e); detail.push(`${sp}:${m ? "过" : "灭"}`); if (!m) goodAll = false; }
    ok(badAll && goodAll, `D-ext 门矩阵: ${id} 坏状态全灭、partnered/dating 可过（${detail.join(" ")}）`);
  }
  // 两地线未动两条的形状登记：p13_029 既有 partnered 门保留、p13_030 不挂门
  const e29 = byIdD.p13_029, e30 = byIdD.p13_030;
  ok(!!e29 && e29.stateAll && e29.stateAll.spouse === "partnered", "D-ext 登记: p13_029 既有 stateAll.spouse=partnered 保留未动");
  ok(!!e30 && !(e30.stateAll && e30.stateAll.spouse) && !(e30.state && e30.state.spouse), "D-ext 登记: p13_030 未挂 spouse 门（过去时、只讲玩家自己人脉）");
}
{ // pack34 分版条目：textState.spouse 四坏状态变体齐备且解析文本无伴侣断言；partnered/dating 出原文
  const VAR4 = [
    ["lk_night", (S) => { S.flags.late_parent = true; S.state.kids = "has"; S.age = 50; S.kidsAt = 49; S.kidsBornAt = 49; }],
    ["lk_stuff", (S) => { S.flags.late_tried = true; S.age = 52; }],
    ["lk_settle1", (S) => { S.flags.late_settle = true; S.age = 50; }],
    ["lk_retire_kid", (S) => { S.flags.late_parent = true; S.state.kids = "has"; S.state.workPhase = "retired"; S.age = 65; S.kidsAt = 50; S.kidsBornAt = 50; }],
  ];
  for (const [id, setup] of VAR4) {
    const e = byIdD[id];
    const m = e && e.textState && e.textState.spouse;
    ok(!!m && ["single", "none", "divorced", "widowed"].every((k) => typeof m[k] === "string"), `D-ext 分版: ${id} textState.spouse 四坏状态变体齐备`);
    let clean = true; const detail = [];
    for (const sp of ["none", "single", "divorced", "widowed"]) { const S = freshS(); setup(S); S.state.spouse = sp; const t = P.procText(e); const bad = typeof t !== "string" || t.includes("你们") || t.includes("对方"); detail.push(`${sp}:${bad ? "漏" : "净"}`); if (bad) clean = false; }
    ok(clean, `D-ext 分版: ${id} 坏状态解析文本无「你们/对方」（${detail.join(" ")}）`);
    let goodOk = true;
    for (const sp of ["partnered", "dating"]) { const S = freshS(); setup(S); S.state.spouse = sp; const t = P.procText(e); if (typeof t !== "string" || !(t.includes("你们") || t.includes("对方"))) goodOk = false; }
    ok(goodOk, `D-ext 分版: ${id} partnered/dating 仍出原文（伴侣口径）`);
    ok(!!e && !(e.stateAll && e.stateAll.spouse) && !(e.state && e.state.spouse), `D-ext 分版: ${id} 未挂 spouse 门（分版已覆盖，照 p3_078 先例）`);
  }
}
{ // specificity 位移：合并入既有 state 键 +0；新增 stateAll 键 +1（lk_check / p13_026 / p13_027 / p13_028）
  const strip = (e, fn) => { const c = JSON.parse(JSON.stringify(e)); fn(c); return P.specificity(c); };
  const eBorn = byIdD.lk_born;
  ok(P.specificity(eBorn) - strip(eBorn, (c) => delete c.state.spouse) === 0, "D-ext specificity: lk_born spouse 合并入既有 state 键 +0");
  const e34 = byIdD.p14_034;
  ok(P.specificity(e34) - strip(e34, (c) => delete c.state.spouse) === 0, "D-ext specificity: p14_034 spouse 合并入既有 state 键 +0");
  const eCheck = byIdD.lk_check;
  ok(P.specificity(eCheck) - strip(eCheck, (c) => delete c.stateAll) === 1, "D-ext specificity: lk_check 新增 stateAll 键 +1");
  const eWait = byIdD.lk_wait;
  ok(P.specificity(eWait) - strip(eWait, (c) => delete c.stateAll) === 1, "D-ext specificity: lk_wait 新增 stateAll 键 +1（总指挥集成时并入，与 lk_check 同形）");
  const e27 = byIdD.p13_027;
  ok(P.specificity(e27) - strip(e27, (c) => delete c.stateAll) === 1, "D-ext specificity: p13_027 新增 stateAll 键 +1");
}

// ---- ⑩ 判词批 E：平年两池事实守卫 ----
console.log("⑩ 判词批 E：平年两池事实守卫（micro 下标侧表 / flatAdult 同机制 / 抽点过滤谓词 flatLineOk）");
{ // 数据断言：micro 池本体冻结（8 条、点名两条在原下标原文本）；侧表只登记这两条
  const micro = P.D.micro;
  ok(Array.isArray(micro) && micro.length === 8, "E 数据: micro 池 8 条（顺序/长度冻结，老存档下标不串位）");
  ok(micro[1] === "这一年没什么大事。工资照发，饭照吃，觉照睡。", "E 数据: micro[1] 工资行原文在原下标");
  ok(micro[4] === "母亲寄来一箱橘子，吃到最后两个，坏了。你扔的时候有点舍不得。", "E 数据: micro[4] 橘子行原文在原下标");
  const mn = P.flatMicroNeeds;
  ok(mn && Object.keys(mn).length === 2 && !!mn[1] && !!mn[4], "E 数据: micro 侧表只登记下标 1 与 4");
  ok(mn[1] && mn[1].stateNot && mn[1].stateNot.workPhase && mn[1].stateNot.workPhase.includes("retired"), "E 数据: micro[1] 侧表 = stateNot{workPhase:[retired]}");
  ok(mn[4] && mn[4].state && mn[4].state.mom && mn[4].state.mom.includes("alive"), "E 数据: micro[4] 侧表 = state{mom:[alive]}");
  ok(P.flatAdultNeeds && Object.keys(P.flatAdultNeeds).length === 9, "E 数据: flatAdult 侧表 9 条（退休池批水位：原 5 条无事实预设仍无守卫，追加回响行 5–13 各挂旗守卫，逐项见 ⑱）");
  ok(Array.isArray(P.flatAdult) && P.flatAdult.length === 14, "E 数据: flatAdult 池 14 条（退休池批水位：原 5 条下标 0–4 不动，末尾追加 9 行回响）");
}
{ // 功能断言：flatLineOk 是 planYear 两抽点共用的唯一过滤谓词
  let S = freshS();
  S.state.workPhase = "retired";
  ok(P.flatLineOk("micro", 1) === false, "E 功能: retired 时 micro[1] 工资行不可达");
  S.state.workPhase = "working";
  ok(P.flatLineOk("micro", 1) === true, "E 功能: working 时 micro[1] 工资行可达");
  S.state.workPhase = "part";
  ok(P.flatLineOk("micro", 1) === true, "E 功能: part 半退（仍有工钱）时 micro[1] 可达");
  S = freshS();
  S.state.mom = "dead";
  ok(P.flatLineOk("micro", 4) === false, "E 功能: 母亲已故时 micro[4] 橘子行不可达");
  S.state.mom = "alive";
  ok(P.flatLineOk("micro", 4) === true, "E 功能: 母亲在世时 micro[4] 橘子行可达");
  S = freshS(); // 最坏状态：双亲皆故＋完全退休＋丧偶——无预设行一条都不许误伤
  S.state.mom = "dead"; S.state.dad = "dead"; S.state.workPhase = "retired"; S.state.spouse = "widowed";
  ok([0, 2, 3, 5, 6, 7].every((i) => P.flatLineOk("micro", i) === true), "E 功能: 无预设的 6 条 micro 在最坏状态下仍全可达");
  ok([0, 1, 2, 3, 4].every((i) => P.flatLineOk("flat", i) === true), "E 功能: flatAdult 5 条在最坏状态下仍全可达（侧表为空）");
}

// ---- ⑪ 死因变体片（审议单 #4）：死因文按事实分流 ----
console.log("⑪ 死因变体片：deathCausePool 逐条事实门（信号分流/零预设兜底/池下限）");
const DC11 = P.deathCauses, DCI11 = P.deathCauseIds;
const poolIds11 = () => P.deathCausePool("health").map((t) => DCI11.health[DC11.health.indexOf(t)]);
function deathS(mutate) {
  const S = freshS();
  S.age = 75; S.stats.health = 61; S.usedEvents = []; S.usedRare = [];
  if (mutate) mutate(S);
  return S;
}
const noFamily11 = (S) => { S.state.dad = "dead"; S.state.mom = "dead"; S.state.spouse = "none"; S.state.kids = "none"; };
{ // 数据：原六段逐字保留、新段追加在 6 起、编号表对位、accident 池不动
  ok(DC11.health.length === 15 && DC11.accident.length === 6, "⑪ 数据: health 池 15 段（原 6＋新 9）、accident 池 6 段");
  ok(DC11.health[0] === "身体早几年就给过信儿。那天夜里胸口闷得睡不着，送到医院时已经晚了。" && DC11.health[3] === "冬天那次感冒拖成了肺炎。输液的第三天夜里，监护仪先响，人没能再睁开眼。" && DC11.health[4] === "血压的药断过几天。早上洗脸时眼前一黑，摔在卫生间，送到医院时已经没有自主呼吸。", "⑪ 数据: H1/H4/H5 原文逐字未动（下标 0/3/4）");
  ok(DCI11.health.join(",") === "H1,H2,H3,H4,H5,H6,H1m,H1z,H5b,H4e,H2p,N1,N2,N3,N4" && DCI11.accident.join(",") === "A1,A2,A3,A4,A5,A6", "⑪ 数据: DEATH_CAUSE_IDS 编号表与下标对位");
  deathS(); ok(P.deathCausePool("accident").length === 6, "⑪ 数据: accident 池不挂门、全 6 段照出");
}
{ // 断言 1：第 15 局形状复刻——无任何信号＋终局健康 61＋无电梯
  deathS();
  const p = poolIds11();
  ok(!p.includes("H1") && !p.includes("H5") && !p.includes("H5b") && !p.includes("H2") && !p.includes("H6"), "⑪ 断言1: 无信号局池中无 H1/H5/H5b/H2/H6（第 15 局回归守卫）");
  ok(!p.includes("H4"), "⑪ 断言1: 终局健康 61、无体弱/住院/危机时 H4 不在池");
  ok(p.includes("H1z") && p.includes("N2") && p.length >= 2, "⑪ 断言1: 零预设段在池（H1z/N2）且池长 ≥2");
}
{ // 断言 2：代谢预警在账——信号版与拖延两段在池、H5 不在池、H1 原段被分流走
  deathS((S) => { S.flags.retired_checkup_done = true; });
  const p = poolIds11();
  ok(p.includes("H1m") && p.includes("H2") && p.includes("H6"), "⑪ 断言2: 代谢预警 → H1m/H2/H6 在池");
  ok(!p.includes("H5") && !p.includes("H5b") && !p.includes("H1") && !p.includes("H1z"), "⑪ 断言2: 代谢预警 → H5 族不在池、H1 原段走分流、H1z 不在池");
}
{ // 断言 3：降压药日常在账——H5 两段在池（心脑在管同时打开 H1 原段）
  deathS((S) => { S.usedEvents.push("p22_027"); });
  const p = poolIds11();
  ok(p.includes("H5") && p.includes("H5b"), "⑪ 断言3: p22_027 在账 → H5/H5b 在池");
  ok(p.includes("H1") && !p.includes("H1m"), "⑪ 断言3: 心脑在管 → H1 原段在池、H1m（仅代谢）不在池");
  deathS((S) => { S.flags.meds_checked = true; });
  const p2 = poolIds11();
  ok(p2.includes("H5") && p2.includes("H5b"), "⑪ 断言3: meds_checked 在账 → H5/H5b 同门在池（用药在管并联）");
}
{ // 断言 4：预警事实（p15_013）在账、无跟进旗 → H2/H6 在池；再置 recheck_partial → 部分跟进变体在池
  deathS((S) => { S.usedEvents.push("p15_013"); });
  let p = poolIds11();
  ok(p.includes("H2") && p.includes("H6") && !p.includes("H2p"), "⑪ 断言4: p15_013 在账 → H2/H6 在池、H2p 不在池");
  deathS((S) => { S.usedEvents.push("p15_013"); S.flags.recheck_partial = true; });
  p = poolIds11();
  ok(p.includes("H2p"), "⑪ 断言4: 再置 recheck_partial → H2p 部分跟进变体在池");
}
{ // 断言 5：体弱 → H4 在池；终局健康 80＋无体弱/住院/危机 → H4 原段不在池（70 岁与 85 岁同验，年龄不作门）
  deathS((S) => { S.flags.hook_frail = true; });
  ok(poolIds11().includes("H4"), "⑪ 断言5: 先天体弱 → H4 在池");
  deathS((S) => { S.stats.health = 80; S.age = 70; });
  ok(!poolIds11().includes("H4"), "⑪ 断言5: 终局健康 80＋无体弱/住院/危机＋70 岁 → H4 不在池");
  deathS((S) => { S.stats.health = 80; S.age = 85; S.state.spouse = "partnered"; });
  const p = poolIds11();
  ok(!p.includes("H4") && p.includes("H4e"), "⑪ 断言5: 85 岁同形状 → H4 原段仍不在池（年龄不作门）、H4e 高龄变体在池");
}
{ // 断言 6（旧门回归）：装电梯事实在账 → H3 不在池
  deathS((S) => { S.usedEvents.push("p11_027"); });
  ok(!poolIds11().includes("H3"), "⑪ 断言6: 装过电梯 → H3 不在池（旧门 (a) 回归）");
}
{ // 附加钉子：N1 的 anyFamilyAlive 门与 H4e 的年龄下限（文本明写「八十多岁」）
  deathS((S) => { noFamily11(S); });
  ok(!poolIds11().includes("N1"), "⑪ 附加: 空屋（双亲故/无伴侣/无子女）→ N1 不在池");
  deathS((S) => { S.age = 79; });
  ok(!poolIds11().includes("H4e"), "⑪ 附加: 79 岁 → H4e 不在池（八十多岁须字面成立）");
  deathS((S) => { S.age = 85; noFamily11(S); });
  ok(!poolIds11().includes("H4e"), "⑪ 附加: 85 岁但空屋 → H4e 不在池（「家里人守了三天」须有账）");
}
{ // 附加钉子：安详段年龄软分流（N2 <80、N3/N4 ≥80；文面不写年龄，仅路由摊开复读）
  deathS((S) => { S.age = 79; });
  let p = poolIds11();
  ok(p.includes("N2") && !p.includes("N3") && !p.includes("N4"), "⑪ 附加: 79 岁无信号 → 安详只走 N2（<80 段）");
  deathS((S) => { S.age = 85; });
  p = poolIds11();
  ok(!p.includes("N2") && p.includes("N3") && p.includes("N4"), "⑪ 附加: 85 岁无信号 → 安详走 N3/N4（≥80 段）、N2 不在池");
}
{ // 断言 7：影子轨作用域——withLife 切到 B 轨后 deathCausePool 读 B 的账，不串主轨
  deathS((S) => { S.flags.retired_checkup_done = true; });
  const mainPool = poolIds11();
  const SB = P.freshState("ASSERT-SHADOW-B");
  SB.age = 75; SB.stats.health = 61; SB.usedEvents = []; SB.usedRare = [];
  const trackB = { state: SB, streams: { n: 0, w: 0, a: 0 }, schedStats: null };
  const shadowPool = P.withLife(trackB, () => poolIds11());
  ok(mainPool.includes("H1m") && !mainPool.includes("H1z"), "⑪ 断言7: 主轨（代谢预警）池含 H1m、不含 H1z");
  ok(!shadowPool.includes("H1m") && shadowPool.includes("H1z") && !shadowPool.includes("H2"), "⑪ 断言7: B 轨（无信号）池不含 H1m/H2、含 H1z——读的是 B 的账");
  ok(poolIds11().join() === mainPool.join(), "⑪ 断言7: withLife 退出后主轨作用域还原、池不变");
}
{ // 断言 8：池下限网格扫——信号×终局健康×电梯×年龄×家里有人，逐格池长 ≥2
  const sigSets = [
    ["无信号", () => {}],
    ["代谢预警", (S) => { S.flags.retired_checkup_done = true; }],
    ["心脑在管", (S) => { S.usedEvents.push("p22_027"); }],
    ["住院史", (S) => { S.flags.self_hosp_done = true; }],
    ["健康危机", (S) => { S.crisisUsed = { health: true }; }],
    ["先天体弱", (S) => { S.flags.hook_frail = true; }],
    ["仅recheck_partial", (S) => { S.flags.recheck_partial = true; }],
    ["仅meds_checked", (S) => { S.flags.meds_checked = true; }],
  ];
  let cells = 0, minPool = 99; const badCells = [];
  for (const [sigName, apply] of sigSets) for (const fh of [50, 61, 80]) for (const elev of [false, true]) for (const age of [65, 77, 85]) for (const fam of [true, false]) {
    deathS((S) => { apply(S); S.stats.health = fh; S.age = age; if (elev) S.usedEvents.push("p11_027"); if (!fam) noFamily11(S); });
    const n = P.deathCausePool("health").length;
    cells++; if (n < minPool) minPool = n;
    if (n < 2) badCells.push(`${sigName}/FH${fh}/${elev ? "电梯" : "无电梯"}/${age}岁/${fam ? "有人" : "空屋"}=${n}`);
  }
  ok(badCells.length === 0, `⑪ 断言8: 池下限网格 ${cells} 格全 ≥2（最小 ${minPool}）${badCells.length ? " 违规: " + badCells.slice(0, 4).join("; ") : ""}`);
}

// ---- ⑫ 考试门片（审议单 #5）：home 桥拍 / 链头宽门 / 考试窗派生谓词 / 链身预防性加固 ----
console.log("⑫ 考试门片：p16_077 home 桥拍（门/立桥回路/表态旗）/ p16_001·p16_012 宽门 / examPending 出窗两侧 / p16_006·007 加固 / 影子同口径");
const E12 = (mutate) => { const S = freshS(); S.age = 24; S.usedEvents = []; S.usedRare = []; S.state.schooling = "never"; if (mutate) mutate(S); return S; };
{ // 数据：新拍形状、两链头宽门、加固两拍、registry 登记
  const b = byId.p16_077;
  ok(!!b, "⑫ 数据: p16_077 存在（pack16 最大号顺延）");
  ok(b && JSON.stringify(b.routeIn) === "[\"home\"]" && JSON.stringify(b.state && b.state.schooling) === "[\"never\",\"left\"]" && b.w === 3 && b.min === 22 && b.max === 26, "⑫ 数据: p16_077 门 = routeIn home + schooling never/left + w3 + 22–26 岁");
  ok(b && Array.isArray(b.forbid) && b.forbid.includes("edu_bridge"), "⑫ 数据: p16_077 forbid edu_bridge（立桥后不再出）");
  ok(b && typeof b.text === "string" && !b.text.includes("你选了接着念") && b.text.includes("夜校") && b.text.includes("自考"), "⑫ 数据: p16_077 正文为回家乡语境新写（无 study 版开头、夜校＋自考学历界在文内）");
  const c0 = b && b.choices && b.choices[0], c1 = b && b.choices && b.choices[1];
  ok(c0 && c0.set === "edu_bridge" && c0.effects && c0.effects.growth === 3 && c0.effects.health === -1, "⑫ 数据: p16_077 选项一立 edu_bridge、效果与 p16_073 同值（成长+3/健康−1）");
  ok(c1 && c1.set === "exam_bridge_declined" && c1.effects && c1.effects.money === 1, "⑫ 数据: p16_077 选项二立 exam_bridge_declined（轻旗记「已明确不补」）、钱+1");
  ok(byId.p16_001.ctx && byId.p16_001.ctx.eduGateHalf === true && !byId.p16_001.ctx.eduGate, "⑫ 数据: p16_001 链头 ctx 改 eduGateHalf（half 纳入）");
  ok(byId.p16_012.ctx && byId.p16_012.ctx.eduGateHalf === true && !byId.p16_012.ctx.eduGate, "⑫ 数据: p16_012 第二链头 ctx 改 eduGateHalf");
  ok(!byId.p16_006.ctx && byId.p16_006.require === "exam_retry" && P.specificity(byId.p16_006) === 2, "⑫ 数据: p16_006 条目数据零改动（无 ctx 键、specificity 仍 2）——加固走 met 派生关门，不抬具体度");
  ok(!byId.p16_007.ctx && byId.p16_007.require === "exam_retry" && byId.p16_007.minYear === 2012 && P.specificity(byId.p16_007) === 3, "⑫ 数据: p16_007 条目数据零改动（无 ctx 键、specificity 仍 3）、require/minYear 原样");
  const reg12 = sandbox.window.GAME_REGISTRY;
  ok(reg12 && reg12.milestones && reg12.milestones.edu_bridge && reg12.milestones.edu_bridge.setters.includes("p16_077"), "⑫ 数据: registry edu_bridge setters 含 p16_077");
  ok(reg12 && reg12.milestones && reg12.milestones.exam_bridge_declined && reg12.milestones.exam_bridge_declined.setters.includes("p16_077"), "⑫ 数据: registry 已登记 exam_bridge_declined（setter p16_077）");
  ok(typeof P.examPending === "function", "⑫ 数据: IFY.examPending 已导出（record.js 派生谓词）");
}
{ // 断言 1：never/left + home + 24——链头关、桥拍开；立桥后链头开、桥拍关
  let S = E12();
  ok(P.met(byId.p16_001) === false, "⑫ 断言1: never+home+24 链头 p16_001 不出（无读书记录进不了考场）");
  ok(P.met(byId.p16_077) === true, "⑫ 断言1: never+home+24 桥拍 p16_077 可出");
  S = E12((s) => { s.state.schooling = "left"; });
  ok(P.met(byId.p16_077) === true && P.met(byId.p16_001) === false, "⑫ 断言1: left 同形（桥开、链头关）");
  S = E12((s) => { s.flags.edu_bridge = true; });
  ok(P.met(byId.p16_001) === true, "⑫ 断言1: 立 edu_bridge 后链头 p16_001 可出（桥真的通向考场）");
  ok(P.met(byId.p16_077) === false, "⑫ 断言1: 立桥后桥拍 p16_077 不再出");
  S = E12((s) => { s.state.schooling = "school"; });
  ok(P.met(byId.p16_077) === false && P.met(byId.p16_001) === true, "⑫ 断言1: school 者桥拍不出（只给没记录的人）、链头照常");
}
{ // 断言 2：考试窗出窗两侧——表态立即出窗、无表态 26 仍等/27 兜底出窗（entry 代表拍 p16_016）
  const entry = byId.p16_016;
  let S = E12((s) => { s.age = 25; s.flags.exam_bridge_declined = true; });
  ok(P.examPending(S) === false && P.met(entry) === true, "⑫ 断言2: never+home 置 exam_bridge_declined 后 25 岁已出窗（entry 拍可出）");
  S = E12((s) => { s.age = 25; });
  ok(P.examPending(S) === true && P.met(entry) === false, "⑫ 断言2: never+home 无桥无表态 25 岁仍在窗内等（entry 拍不出）");
  S = E12((s) => { s.age = 26; });
  ok(P.examPending(S) === true && P.met(entry) === false, "⑫ 断言2: 26 岁仍在窗内（年龄兜底不提前漏）");
  S = E12((s) => { s.age = 27; });
  ok(P.examPending(S) === false && P.met(entry) === true, "⑫ 断言2: 27 岁年龄兜底出窗（桥窗 22–26 已过）");
  S = E12((s) => { s.age = 24; s.flags.edu_bridge = true; });
  ok(P.examPending(S) === true, "⑫ 断言2: 已立桥者算有指望、照常等结果（examPending=true）");
  S = E12((s) => { s.age = 28; s.state.schooling = "half"; });
  ok(P.examPending(S) === true, "⑫ 断言2: half 换门后恒算有指望——28 岁仍等结果（年龄兜底不许误伤 half）");
  S = E12((s) => { s.age = 25; s.state.schooling = "school"; });
  ok(P.examPending(S) === true && P.met(entry) === false, "⑫ 断言2: school 组窗行为不变（25 岁未出结果仍等）");
  S = E12((s) => { s.age = 25; s.state.schooling = "school"; s.flags.exam_passed = true; });
  ok(P.examPending(S) === false && P.met(entry) === true, "⑫ 断言2: school 组落 exam_passed 照常放行（谓词与旧窗同形）");
}
{ // 断言 3：链身封口回归 + p16_006/p16_007 新加固
  let S = E12((s) => { s.usedEvents = ["p16_001"]; s.age = 24; });
  ok(P.met(byId.p16_002) === true, "⑫ 断言3: 伪造 usedEvents 含 p16_001 时 p16_002 可出（chain 语义不变）");
  const retry = (sc) => E12((s) => { s.state.schooling = sc; s.flags.exam_retry = true; s.age = 26; });
  S = retry("never");
  ok(P.met(byId.p16_006) === false && P.met(byId.p16_007) === false, "⑫ 断言3: never+exam_retry 下 p16_006/p16_007 不出（新加固：require 型后继不再无门）");
  S = retry("school");
  ok(P.met(byId.p16_006) === true && P.met(byId.p16_007) === true, "⑫ 断言3: school+exam_retry 下 p16_006/p16_007 照常可出");
  S = retry("half");
  ok(P.met(byId.p16_006) === true && P.met(byId.p16_007) === true, "⑫ 断言3: half+exam_retry 下 p16_006/p16_007 可出（宽门）");
  S = retry("left");
  ok(P.met(byId.p16_006) === false && P.met(byId.p16_007) === false, "⑫ 断言3: left+exam_retry 下 p16_006/p16_007 不出（与 never 同口径）");
}
{ // 断言 4：宽门人群边界——half 两链头全开、never 第二链头仍关
  let S = E12((s) => { s.state.schooling = "half"; s.age = 28; });
  ok(P.met(byId.p16_001) === true, "⑫ 断言4: half+home 链头 p16_001 可出（换门后可达）");
  ok(P.met(byId.p16_012) === true, "⑫ 断言4: half+home 第二链头 p16_012 可出");
  S = E12((s) => { s.age = 28; });
  ok(P.met(byId.p16_012) === false, "⑫ 断言4: never+home 第二链头 p16_012 仍关（没记录者不许凭空进第二个考场）");
}
{ // 断言 5：影子轨同口径——withLife 作用域内桥拍/链头 met 与主轨逐项一致
  const S = E12();
  const mainBefore = [P.met(byId.p16_077), P.met(byId.p16_001)];
  const SB = P.freshState("ASSERT-SHADOW-EXAM");
  SB.route = { id: "home" }; SB.era = "c2000"; SB.birthYear = 2000; SB.age = 24;
  SB.usedEvents = []; SB.usedRare = []; SB.state.schooling = "never";
  const trackB = { state: SB, streams: { n: 0, w: 0, a: 0 }, schedStats: null };
  const shadowBefore = P.withLife(trackB, () => [P.met(byId.p16_077), P.met(byId.p16_001)]);
  ok(shadowBefore[0] === mainBefore[0] && shadowBefore[1] === mainBefore[1] && shadowBefore[0] === true && shadowBefore[1] === false,
    "⑫ 断言5: 影子 never+home+24——桥拍开/链头关，与主轨逐项一致");
  const shadowAfter = P.withLife(trackB, () => { SB.flags.edu_bridge = true; return [P.met(byId.p16_077), P.met(byId.p16_001), P.examPending(SB)]; });
  ok(shadowAfter[0] === false && shadowAfter[1] === true && shadowAfter[2] === true,
    "⑫ 断言5: 影子立桥后——桥拍关/链头开/窗继续等，与主轨同读同效");
  ok(P.met(byId.p16_077) === mainBefore[0] && P.met(byId.p16_001) === mainBefore[1], "⑫ 断言5: withLife 退出后主轨作用域还原、门结果不变");
}


// ---- ⑬ 判词升格片（审议单 #6）：定调纯函数 / 合议选维与钱封顶 / 同记录同判词 / statsLate ----
console.log("⑬ 判词升格片：verdictTone 定调表测 / verdictCouncil 合议与钱封顶 / 纯函数判词 / 硬门与篇幅 / statsLate 记账");
{
  const K6 = ["health", "money", "growth", "freedom", "relation", "wisdom"];
  const LE13 = (age, id) => ({ age, kind: "state", id });
  // 手组记录：freshState 为底，覆写六维/峰值/晚年快照/账本/旗/危机/稀有/配偶/死因。
  const mkRec = (seed, o) => {
    const S = P.freshState(seed);
    P.S = S;
    S.route = { id: "home" }; S.era = "c2000"; S.birthYear = 2000; S.age = 80;
    S.stats = o.stats; S.statsPeak = o.peak || { ...o.stats };
    S.statsLate = o.late !== undefined ? o.late : null;
    S.ledger = o.ledger || [];
    if (o.flags) Object.assign(S.flags, o.flags);
    if (o.crisis) S.crisisUsed = o.crisis;
    if (o.rare) S.usedRare = o.rare;
    if (o.spouse) S.state.spouse = o.spouse;
    if (o.death !== undefined) S.death = o.death;
    return S;
  };
  const st6 = (h, m, g, f, r, w) => ({ health: h, money: m, growth: g, freedom: f, relation: r, wisdom: w });
  const FLAT = st6(50, 50, 50, 50, 50, 50);
  const toneOf = (S, special) => P.verdictTone(S, { special: !!special });

  // 数据断言：新池形状
  {
    const D = P.D;
    ok(K6.every((k) => (D.verdictTop[k] || []).filter((f) => typeof f !== "string" && f.tone === "grand").length === 1 && (D.verdictTop[k] || []).filter((f) => typeof f !== "string" && f.tone === "joy").length === 1), "⑬ 数据: verdictTop 六维各恰有壮阔/欢快标志段各 1");
    ok(K6.every((k) => (D.verdictCost[k] || []).filter((f) => typeof f !== "string" && f.tone === "grand").length === 1), "⑬ 数据: verdictCost 六维各恰有壮阔代价段 1");
    ok(D.verdictFrame && K6.length === 6 && ["grand", "joy", "prose"].every((t) => D.verdictFrame.open[t].length === 2 && D.verdictFrame.close[t].length === 1), "⑬ 数据: 框架件 开场 3 调×2 / 收尾 3 调×1");
    ok(K6.every((k) => typeof D.verdictLightStory[k] === "string" && typeof D.verdictLightLow[k] === "string") && D.verdictLightPair.length >= 2 && D.verdictLightPair.every((t) => t.includes("{a}") && t.includes("{b}")), "⑬ 数据: 轻提两家六维齐备 + 并列模板 ≥2");
    const hh = D.verdictTop.health;
    ok(hh.length === 8 && hh.filter((f) => typeof f !== "string" && f.minFinal).length === 5 && hh.some((f) => typeof f === "string"), "⑬ 数据: 健康上句 8 段（原 6＋新 2）、5 段挂 minFinal、留无门兜底段");
    const segMoneySave = (D.verdictTop.money || []).find((f) => typeof f !== "string" && f.t && f.t.includes("账上留着两年的生活费"));
    ok(!!segMoneySave && segMoneySave.minFinal && segMoneySave.minFinal.money === 55, "⑬ 数据: 钱上句「账上留着两年生活费」挂 minFinal{money:55}");
  }

  // 定调表测（纯函数：只读账本派生事实与峰值形状）
  {
    let S = mkRec("T1", { stats: FLAT, spouse: "single", death: { age: 78, type: "health", text: "" } });
    let t = toneOf(S);
    ok(t.tone === "prose" && t.adv === 0 && t.joy === 0, `⑬ 定调: 平局无签名 → 散文（adv=${t.adv} joy=${t.joy}）`);
    S = mkRec("T2", { stats: FLAT, spouse: "widowed", ledger: [LE13(31, "spouse>partnered"), LE13(61, "spouse>widowed")], flags: { laid_off: true }, crisis: { x: 1 }, death: { age: 80, type: "health", text: "" } });
    t = toneOf(S);
    ok(t.tone === "grand" && t.adv === 3, `⑬ 定调: 丧偶+下岗+危机 ADV=3 → 壮阔（adv=${t.adv}）`);
    S = mkRec("T3", { stats: st6(60, 50, 50, 50, 50, 50), peak: st6(90, 50, 50, 50, 50, 50), spouse: "widowed", ledger: [LE13(31, "spouse>partnered"), LE13(61, "spouse>widowed")], flags: { laid_off: true }, death: { age: 80, type: "health", text: "" } });
    t = toneOf(S);
    ok(t.tone === "grand" && t.adv === 2 && t.drop === 30, `⑬ 定调: ADV=2 且总跌幅 30 ≥22 → 壮阔（adv=${t.adv} drop=${t.drop}）`);
    S = mkRec("T4", { stats: st6(50, 50, 50, 50, 92, 50), spouse: "partnered", flags: { hobby_fishing: true }, death: { age: 82, type: "health", text: "" } });
    t = toneOf(S);
    ok(t.tone === "joy" && t.joy === 3 && t.adv === 0, `⑬ 定调: 关系峰值 92+爱好+伴侣在侧 JOY=3 → 欢快（joy=${t.joy}）`);
    S = mkRec("T5", { stats: st6(50, 50, 50, 50, 92, 50), spouse: "partnered", death: { age: 82, type: "health", text: "" } });
    t = toneOf(S);
    ok(t.tone === "joy" && t.joy === 2, `⑬ 定调: ADV=0、JOY=2、总跌幅 0 ≤25 → 欢快第二支（joy=${t.joy}）`);
    S = mkRec("T6", { stats: st6(50, 50, 50, 50, 92, 50), peak: st6(63, 50, 50, 50, 92, 50), spouse: "partnered", ledger: [LE13(31, "spouse>partnered"), LE13(61, "spouse>widowed")], flags: { laid_off: true, hobby_fishing: true }, death: { age: 82, type: "health", text: "" } });
    t = toneOf(S);
    ok(t.tone === "prose" && t.adv === 2 && t.joy === 3 && t.drop === 13, `⑬ 定调: 变故与顺遂都中等（ADV=2/JOY=3/跌 13）→ 散文兜底（adv=${t.adv} joy=${t.joy} drop=${t.drop}）`);
    S = mkRec("T7", { stats: FLAT, spouse: "widowed", ledger: [LE13(30, "dad>dead"), LE13(31, "spouse>partnered"), LE13(61, "spouse>widowed")], rare: ["r_a", "r_b"], death: { age: 80, type: "health", text: "" } });
    t = toneOf(S);
    ok(t.tone === "grand" && t.adv === 3, `⑬ 定调: 38 岁前丧父+稀有≥2+丧偶 ADV=3 → 壮阔（adv=${t.adv}）`);
    S = mkRec("T7b", { stats: FLAT, spouse: "single", ledger: [LE13(45, "dad>dead")], death: { age: 80, type: "health", text: "" } });
    t = toneOf(S);
    ok(t.adv === 0 && t.tone === "prose", `⑬ 定调: 45 岁丧父不入变故（区分度收紧到 38 岁，adv=${t.adv}）`);
    S = mkRec("T8", { stats: FLAT, spouse: "widowed", ledger: [LE13(31, "spouse>partnered"), LE13(55, "spouse>widowed")], flags: { laid_off: true }, death: { age: 60, type: "health", text: "" } });
    t = toneOf(S);
    ok(t.tone === "grand" && t.adv === 3, `⑬ 定调: 65 岁前去世计入变故（adv=${t.adv}）`);
    const tA = toneOf(S), tB = toneOf(S);
    ok(JSON.stringify(tA) === JSON.stringify(tB), "⑬ 定调: 同记录两次求调逐项一致（纯函数）");
  }

  // 合议表测（选维 / 钱封顶三条 / 晚年加分 / 固定维序）
  {
    let S = mkRec("C1", { stats: st6(40, 72, 70, 45, 88, 42), peak: st6(40, 74, 72, 45, 90, 42), spouse: "partnered" });
    let C = P.verdictCouncil(S);
    ok(C.moneyMain === false && JSON.stringify(C.full) === "[\"relation\",\"growth\"]" && C.light.some((x) => x.k === "money" && x.kind === "story"), `⑬ 合议: 钱站位入选非主线 → 降轻提、满句位让给成长（full=${C.full}）`);
    S = mkRec("C2", { stats: st6(30, 45, 85, 50, 90, 50), peak: st6(30, 72, 90, 50, 95, 50), spouse: "partnered" });
    C = P.verdictCouncil(S);
    ok(C.moneyMain === true && JSON.stringify(C.full) === "[\"relation\",\"money\"]" && C.light.some((x) => x.k === "growth" && x.kind === "story"), `⑬ 合议: 钱主线（挣到过又跌下来）未入选 → 必提占第二正维位、成长降轻提（full=${C.full}）`);
    S = mkRec("C3", { stats: st6(50, 72, 60, 55, 60, 55), peak: st6(55, 74, 70, 60, 74, 60), spouse: "single" });
    C = P.verdictCouncil(S);
    ok(JSON.stringify(C.full) === "[\"money\"]" && !C.light.some((x) => x.k === "money"), "⑬ 合议: 钱是唯一故事维 → 保险丝保留满句、不降轻提");
    S = mkRec("C4", { stats: st6(50, 40, 55, 45, 88, 52), peak: st6(55, 40, 60, 45, 90, 58), spouse: "partnered" });
    C = P.verdictCouncil(S);
    ok(C.cost === null && JSON.stringify(C.pair) === "[\"money\",\"freedom\"]" && C.light.some((x) => x.k === "money" && x.kind === "low") && C.light.some((x) => x.k === "freedom" && x.kind === "low"), `⑬ 合议: L1=钱非主线 → 轻提对{钱,自由}、代价满句为空（pair=${C.pair}）`);
    S = mkRec("C5", { stats: st6(70, 45, 78, 72, 80, 71), peak: st6(74, 70, 82, 76, 85, 75), spouse: "partnered" });
    C = P.verdictCouncil(S);
    ok(C.moneyMain === true && C.cost === "money" && !C.full.includes("money"), `⑬ 合议: L1=钱且主线 → 钱出满句代价（cost=${C.cost}）`);
    const c6stats = st6(40, 50, 80, 50, 60, 77);
    S = mkRec("C6", { stats: c6stats, peak: { ...c6stats }, late: st6(40, 50, 80, 50, 60, 65), spouse: "single" });
    C = P.verdictCouncil(S);
    ok(C.full[0] === "wisdom", `⑬ 合议: statsLate 晚年加分（智慧 60 岁后涨 12、+4）翻盘排序（full=${C.full}）`);
    S = mkRec("C6b", { stats: c6stats, peak: { ...c6stats }, late: null, spouse: "single" });
    C = P.verdictCouncil(S);
    ok(C.full[0] === "growth", `⑬ 合议: 无 statsLate 时无加分、按峰值原序（full=${C.full}）`);
    S = mkRec("C7", { stats: st6(40, 45, 50, 48, 62, 44), peak: st6(40, 45, 50, 48, 62, 44), spouse: "single" });
    C = P.verdictCouncil(S);
    ok(C.full.length === 1 && C.full[0] === "relation" && C.cost === "health", `⑬ 合议: 零故事维 → 回落最高峰维满句、代价照走（full=${C.full} cost=${C.cost}）`);
    S = mkRec("C8", { stats: st6(80, 80, 40, 40, 40, 40), peak: st6(80, 80, 40, 40, 40, 40), spouse: "single" });
    C = P.verdictCouncil(S);
    ok(C.full[0] === "health" && C.full[1] === "money", `⑬ 合议: 同分并列按固定维序（健康先于金钱，full=${C.full}）`);
  }

  // 判词整体：同记录同判词 / 不消费主随机流 / 钱封顶文本级 / 健康硬门 / 篇幅与提及下限
  {
    const rich = { stats: st6(30, 45, 85, 50, 90, 50), peak: st6(30, 72, 90, 50, 95, 50), spouse: "partnered", ledger: [LE13(31, "spouse>partnered")], death: { age: 84, type: "health", text: "" } };
    const S1 = mkRec("V1-SAME", rich);
    const v1 = P.verdict();
    const S2 = mkRec("V1-SAME", JSON.parse(JSON.stringify(rich)));
    const v2 = P.verdict();
    ok(v1.text === v2.text && v1.tone === v2.tone && JSON.stringify(v1.full) === JSON.stringify(v2.full) && v1.cost === v2.cost, "⑬ 判词: 同记录克隆两份、各自独立求判词 → 逐字一致");
    ok(v1.v === 2, "⑬ 判词: _verdict 带 v:2 标记");
    const S3 = mkRec("V2-RNG", rich);
    const before = [P.RNG.a, P.RNGW.a, P.RNGA.a];
    P.verdict();
    ok(P.RNG.a === before[0] && P.RNGW.a === before[1] && P.RNGA.a === before[2], "⑬ 判词: 求判词不消费三股游戏随机流（子流独立）");
    const moneyTopTexts = (P.D.verdictTop.money || []).map((f) => (typeof f === "string" ? f : f.t));
    let capOk = true, lightSeen = false;
    for (let i = 0; i < 12; i++) {
      mkRec("V3-CAP-" + i, { stats: st6(40, 72, 70, 45, 88, 42), peak: st6(40, 74, 72, 45, 90, 42), spouse: "partnered", death: { age: 80, type: "health", text: "" } });
      const vv = P.verdict();
      if (moneyTopTexts.some((tx) => vv.text.includes(tx)) || vv.full.includes("money") || vv.cost === "money") capOk = false;
      if (vv.text.includes(P.D.verdictLightStory.money)) lightSeen = true;
    }
    ok(capOk && lightSeen, "⑬ 判词: 非主线钱满句 12 子扫描零出现（合议+文本双证）、钱只以轻提短句活进文本（封顶文本级）");
    const S5 = mkRec("V4-GATE", { stats: st6(30, 40, 40, 40, 80, 40), peak: st6(95, 40, 40, 40, 85, 40), spouse: "single", death: { age: 82, type: "health", text: "" } });
    const v5 = P.verdict();
    ok(v5.text.includes("体检单年年就那几项") && !v5.text.includes("提着菜篮") && !v5.text.includes("绕着小区走三圈") && !v5.text.includes("雷打不动") && !v5.text.includes("一觉睡到五点多") && !v5.text.includes("牙口还算行"), "⑬ 判词: 终局健康 30 → 现在时身体断言段全被 minFinal 硬门挡下、只出无门兜底段");
    let lenOk = true, menOk = true, worst = 0;
    for (let i = 0; i < 60; i++) {
      const base = 35 + (i * 7) % 55;
      const stats = st6(base, 30 + (i * 11) % 65, 30 + (i * 13) % 65, 30 + (i * 17) % 65, 30 + (i * 19) % 68, 30 + (i * 23) % 65);
      const peak = {}; for (const k of K6) peak[k] = Math.min(98, stats[k] + (i * 3) % 18);
      const S = mkRec("V5-LEN-" + i, { stats, peak, spouse: i % 3 ? "partnered" : "single", flags: i % 4 ? { laid_off: true } : null, crisis: i % 5 ? { x: 1 } : null, death: { age: 55 + (i % 40), type: i % 7 ? "health" : "accident", text: "" } });
      const v = P.verdict();
      worst = Math.max(worst, v.text.length);
      if (v.text.length > 110) lenOk = false;
      const mentioned = new Set([...v.full, ...v.light, ...(v.cost ? [v.cost] : [])]);
      if (mentioned.size < 2) menOk = false;
    }
    ok(lenOk, `⑬ 判词: 60 局构造批篇幅全 ≤110 字（最长 ${worst}）`);
    ok(menOk, "⑬ 判词: 60 局构造批每局提及维度 ≥2（升格地板）");
  }

  // statsLate 记账：初值 / 60 岁定格 / 定格后不动 / 老档回填
  {
    const S0 = P.freshState("LATE-INIT");
    ok(S0.statsLate === null, "⑬ statsLate: freshState 初值 null（未到 60 不落账）");
    const S = mkRec("LATE-S", { stats: st6(55, 50, 60, 52, 66, 58), spouse: "single" });
    S.age = 59; P.sampleStatsPeak();
    ok(S.statsLate === null, "⑬ statsLate: 59 岁收口不落快照");
    S.age = 60; P.sampleStatsPeak();
    ok(!!S.statsLate && K6.every((k) => S.statsLate[k] === S.stats[k]), "⑬ statsLate: 60 岁收口整份定格六维");
    const frozen = JSON.stringify(S.statsLate);
    S.stats = st6(40, 70, 61, 52, 70, 66); S.age = 61; P.sampleStatsPeak();
    ok(JSON.stringify(S.statsLate) === frozen, "⑬ statsLate: 定格后六维再涨不重写（只作晚年加分的原点）");
    const old = P.freshState("LATE-OLD");
    old.route = { id: "corp" };
    old.stats = st6(33, 44, 55, 66, 77, 88);
    delete old.statsLate;
    store.set("ify-save-v2", JSON.stringify(old));
    const back = P.loadSave();
    ok(!!back && !!back.statsLate && K6.every((k) => back.statsLate[k] === back.stats[k]), "⑬ statsLate: 老档（无字段）载入按现值回填起账");
    store.delete("ify-save-v2");
  }
}

console.log("⑭ 出生年内容片 c1955 批：公历门落点（高考簇/返城镜像/下岗根/盘仓）+ 牌文去年龄 + R5 maxYear 登记");
{ // 数据形状：本批 22 条参数逐条对齐（null = 不许有此字段）
  const SHAPE = [
    ["e55_001", 18, 27, 1977, 1977], ["e55_002", 18, 27, 1977, 1979], ["e55_003", 18, 27, 1977, 1979],
    ["e55_004", 18, 28, 1977, 1981], ["e55_058", 18, 27, null, null], ["e55_059", 18, 28, null, null],
    ["e55_005w", 23, 26, null, 1982], ["e55_006w", 23, 26, null, 1982],
    ["e55_033", 35, 50, 1995, 2005], ["e55_034", 35, 50, 1995, 2005], ["p15_025", 35, 50, 1995, 2005],
    ["e55_062", 38, 50, 1998, 2003], ["e55_014", 25, 33, 1979, 1992], ["e55_029", 32, 44, 1992, 2002],
    ["e55_010", 22, 30, null, 1993], ["e55_011", 22, 32, null, 1991], ["e55_012", 24, 34, null, 1993],
    ["e55_013", 25, 35, null, 1994], ["e55_030", 33, 45, 1988, 2002], ["e55_031", 35, 46, null, 2002],
    ["p19_035", 18, 27, 1977, 1977], ["p29_003", 19, 30, 1978, 1984],
  ];
  for (const [id, mn, mx, y0, y1] of SHAPE) {
    const e = byId[id];
    ok(!!e && e.min === mn && e.max === mx && (e.minYear || null) === y0 && (e.maxYear || null) === y1,
      `⑭ 形状 ${id}: 龄带 [${mn},${mx}] 年门 ${y0}/${y1}`);
  }
  const card = sandbox.window.GAME_CARDS && sandbox.window.GAME_CARDS.byId && sandbox.window.GAME_CARDS.byId.ce55_01;
  ok(!!card && card.text.includes("一九七七年") && !card.text.includes("二十二岁"), "⑭ 牌文 ce55_01: 公历叙事、去年龄断言（hook 旗不在牌面字段内、未动）");
}
{ // 落点功能断言：构造状态直调 met()，呈现公历 = birthYear + age
  const at = (birthYear, age, setup) => { const S = freshS(); S.era = "c1955"; S.birthYear = birthYear; S.age = age; if (setup) setup(S); return S; };
  const gk = (S) => { S.facts = { schoolingDepth: "full" }; };
  const farm = (S) => { S.flags.farm_work = true; };
  // ① e55_001 / p19_035：呈现公历恒 = 1977（窗内三端出生年同验）
  ok(!!at(1955, 22, gk) && P.met(byId.e55_001) === true, "⑭ e55_001: 1955 生 22 岁（1977）可出");
  ok(!!at(1955, 21, gk) && P.met(byId.e55_001) === false && !!at(1955, 23, gk) && P.met(byId.e55_001) === false, "⑭ e55_001: 同生 21/23 岁（1976/1978）不出——公历恒 1977");
  ok(!!at(1950, 27, gk) && P.met(byId.e55_001) === true && !!at(1950, 22, gk) && P.met(byId.e55_001) === false, "⑭ e55_001: 1950 生 27 岁可出、22 岁（1972）不出");
  ok(!!at(1959, 18, gk) && P.met(byId.e55_001) === true && !!at(1959, 22, gk) && P.met(byId.e55_001) === false, "⑭ e55_001: 1959 生 18 岁可出、22 岁（1981）不出");
  ok(JSON.stringify(byId.e55_001.requiresFactAny) === JSON.stringify([{ schoolingDepth: "full" }, { schoolingDepth: "cut", _flag: "literacy_gain" }, { schoolingDepth: "cut", _flag: "half_grown" }]) && !!byId.e55_001.textFact && !!byId.e55_001.choicesFact, "⑭ e55_001: requiresFactAny 软门与 textFact/choicesFact 原样未动（软门在呈现层选本人形/目击形，不拦 met）");
  ok(!!at(1955, 22) && P.met(byId.e55_002) === false, "⑭ e55_002: 无 schoolingDepth 事实不出（requiresFactHard 硬门保留，met 层拦）");
  ok(!!at(1955, 22) && P.met(byId.p19_035) === true && !!at(1955, 21) && P.met(byId.p19_035) === false && !!at(1959, 18) && P.met(byId.p19_035) === true && !!at(1950, 26) && P.met(byId.p19_035) === false, "⑭ p19_035: 与 era 版同门（1977 恒定，1950 生 26 岁=1976 不出）");
  ok(!!at(1950, 27, gk) && P.met(byId.e55_002) === true && !!at(1955, 24, gk) && P.met(byId.e55_002) === true && !!at(1955, 25, gk) && P.met(byId.e55_002) === false, "⑭ e55_002: 落点 1977–1979（1955 生 25 岁=1980 出窗）");
  ok(!!at(1955, 26, gk) && P.met(byId.e55_004) === true && !!at(1955, 27, gk) && P.met(byId.e55_004) === false, "⑭ e55_004: 落点至 1981（1955 生 27 岁=1982 出窗）");
  // ② 返城镜像：呈现公历 ≤1982
  ok(!!at(1955, 25) && P.met(byId.e55_005w) === true && !!at(1959, 23) && P.met(byId.e55_005w) === true && !!at(1959, 24) && P.met(byId.e55_005w) === false, "⑭ e55_005w: 1982 可出（1959 生 23 岁）、1983 不出");
  ok(!!at(1959, 24) && P.met(byId.e55_006w) === false && !!at(1950, 26) && P.met(byId.e55_006w) === true, "⑭ e55_006w: 同门（1983 不出、1976 可出）");
  // ③ p29_003：呈现公历 ∈[1978,1984]
  ok(!!at(1955, 25, farm) && P.met(byId.p29_003) === true && !!at(1955, 29, farm) && P.met(byId.p29_003) === true && !!at(1955, 30, farm) && P.met(byId.p29_003) === false, "⑭ p29_003: 1955 生 25–29 岁（1980–1984）可出、30 岁（1985）不出");
  ok(!!at(1950, 28, farm) && P.met(byId.p29_003) === true && !!at(1950, 25, farm) && P.met(byId.p29_003) === false && !!at(1959, 19, farm) && P.met(byId.p29_003) === true && !!at(1959, 26, farm) && P.met(byId.p29_003) === false, "⑭ p29_003: 1950 生 28 岁（1978）可出/25 岁（1975）不出；1959 生 19 岁（1978）可出/26 岁（1985）不出");
  // ④ 下岗根窗 [1995,2005]（以无 ctx 的 e55_034 为功能样本，e55_033 同参另有 ctx 门、形状已验）
  ok(!!at(1955, 39) && P.met(byId.e55_034) === false && !!at(1950, 45) && P.met(byId.e55_034) === true && !!at(1959, 36) && P.met(byId.e55_034) === true && !!at(1959, 46) && P.met(byId.e55_034) === true && !!at(1959, 47) && P.met(byId.e55_034) === false, "⑭ e55_034: 1994 不出、1995/2005 界内可出、2006 不出");
  // R5：unmetConditions 登记 maxYear（与 met 同口径）
  { const S = at(1959, 24); const u = P.unmetConditions(byId.e55_005w).unmet;
    ok(P.met(byId.e55_005w) === false && u.some((x) => x.kind === "maxYear" && x.need === 1982), "⑭ R5: e55_005w 超窗时 unmet 报 maxYear 1982（met 灭与解释同判）"); }
  { let S = freshS(); S.era = "c1978"; S.birthYear = 1978; S.age = 44;
    const u1 = P.unmetConditions(byId.p1_035).unmet;
    S = freshS(); S.era = "c1978"; S.birthYear = 1978; S.age = 43;
    const u2 = P.unmetConditions(byId.p1_035).unmet;
    ok(u1.some((x) => x.kind === "maxYear" && x.need === 2021) && !u2.some((x) => x.kind === "maxYear"), "⑭ R5: 既有 maxYear 条目 p1_035 超窗报 maxYear、界内不报"); }
}

// ---- ⑮ 序章变体扩容：变体数 / 原文逐字 / 定款分布 / 新记号纯发放 ----
console.log("⑮ 序章变体扩容：early2/3/4 十文 / 平年六款 / child1/child2/teen1 六款 / 定款分布 / 纯发放扫描");
{
  const PRO = sandbox.window.GAME_PROLOGUE;
  const first = (id) => PRO.acts.find((a) => a.id === id);
  const e2 = first("pr_early2"), e3 = first("pr_early3"), e4 = first("pr_early4");
  ok(!!e2 && !!e2.texts && e2.texts.length === 10, "⑮ pr_early2 texts = 10（第二轮水位）");
  ok(!!e3 && !!e3.texts && e3.texts.length === 10 && e3.text === undefined, "⑮ pr_early3 texts = 10（原单 text 已改数组）");
  ok(!!e4 && !!e4.texts && e4.texts.length === 10 && e4.text === undefined, "⑮ pr_early4 texts = 10（原单 text 已改数组）");
  ok(e2.texts[0].text === "两岁这一年，你没病没灾，吃得香睡得稳，个头往上蹿了一截。大人说，这孩子好带，省心。" && e2.texts[0].log === "平稳长大", "⑮ pr_early2[0] 原平稳文逐字");
  ok(e2.texts[1].text === "两岁这一年，你病过一场，夜里烧得满脸通红，家里人轮流抱着你，在屋里走了一夜。天快亮时烧退了，你趴在大人肩上睡着了，谁也没敢大声说话。" && e2.texts[1].log === "病过一场", "⑮ pr_early2[1] 原小病文逐字");
  ok(e2.texts[2].text === "两岁这一年，你走路走稳了，满屋满院地跑，大人一错眼你就不见了。家里把门边都收拾干净，省得你绊着。" && e2.texts[2].log === "满地跑", "⑮ pr_early2[2] 原满地跑文逐字");
  ok(JSON.stringify(e2.texts.map((t) => t.log)) === JSON.stringify(["平稳长大", "病过一场", "满地跑", "平稳长大", "病过一场", "满地跑", "平稳长大", "平稳长大", "病过一场", "满地跑"]), "⑮ pr_early2 标题按形：同形诸文共用标题（标题进账面）");
  ok(e3.texts[0].text === "三岁那年，你开始跟在大人后头学话。大人说一句，你跟一句，学得一本正经，音还咬不准。家里人笑，你也跟着笑，以为自己说得对极了。", "⑮ pr_early3[0] 原文逐字");
  ok(e4.texts[0].text === "四岁那年，你开始记事了。谁给过你一块糖，谁答应的事没算数，你都记得。家里人说，这孩子记性好，往后吃不了亏。", "⑮ pr_early4[0] 原文逐字");
  ok(e3.texts.every((t) => !t.log) && e4.texts.every((t) => !t.log), "⑮ pr_early3/4 各文不带 log（流水账标题恒为幕题）");
  ok(e2.keyProp === "early2Key" && e3.keyProp === "early3Key" && e4.keyProp === "early4Key", "⑮ 三拍 keyProp 与 P 字段对位");
  const FL = PRO.flatsByAge;
  const ORIG_FLAT = {
    6: "六岁那年，你学会了自己系鞋带，头一回没让大人帮忙，就是系成了死结，最后还是大人蹲下来解的。",
    8: "这一年没什么大事。你的乳牙掉了一颗，压在枕头底下，第二天枕头底下多了一块糖，你到现在也不确定是谁放的。",
    10: "十岁那年，家里换了台新电视，旧的那台搬去了奶奶屋里。你负责上房顶转天线，转准了画面，全家都说你手稳。",
    14: "初二这一年，你的个子蹿了一截，校服裤子眼看着短下去，露着脚脖子过了一冬天，谁也没顾上给你换。",
    19: "这一年过得平。手机换了张新卡，旧号码的联系人导过来，少了几个，你也没太在意。",
  };
  for (const [age, orig] of Object.entries(ORIG_FLAT)) {
    const f = FL[age];
    ok(!!f && !!f.texts && f.texts.length === 6 && f.texts[0] === orig && f.text === orig, `⑮ flat ${age}: texts 6 款、[0] 与 text 字段均为原句逐字`);
  }
  ok(FL[14].textBySchooling && Array.isArray(FL[14].textBySchooling.never) && FL[14].textBySchooling.never.length === 2 && FL[14].textBySchooling.never[0] === "十四岁这一年，你的个子蹿了一截，裤子眼看着短下去，露着脚脖子过了一冬天，谁也没顾上给你换。" && FL[14].textBySchooling.never[1] === "十四岁这一年，你的个子蹿了一截，鞋先小了，脚趾顶得疼。你把鞋后跟踩下去，当拖鞋穿，走路趿拉趿拉的。家里说等过年置办新的，这一等，就等到了天暖和。", "⑮ flat 14 never 分文两款（B+C 组补款：[0] 原串逐字）");
  ok(FL[14].texts.slice(1).every((t) => !t.includes("校服") && !t.includes("初二") && !t.includes("上学")), "⑮ flat 14 新款不预设上过学（无校服/初二/上学）");
  ok(JSON.stringify(FL[10].effects) === JSON.stringify({ relation: 1 }) && JSON.stringify(FL[6].effects) === "{}", "⑮ flat effects 与原值一致（10 岁 relation+1、6 岁空）");
  const c1 = first("pr_child1"), c2 = first("pr_child2"), t1 = first("pr_teen1");
  ok(!!c1 && c1.variants.length === 6, "⑮ pr_child1（c2000 包）variants = 6");
  ok(!!c2 && c2.variants.length === 6, "⑮ pr_child2（c2000 包）variants = 6");
  ok(!!t1 && t1.variants.length === 6, "⑮ pr_teen1（c2000 包）variants = 6");
  ok(t1.variants.every((v) => v.textBySchooling && typeof v.textBySchooling.never === "string" && v.textBySchooling.never.length > 10), "⑮ pr_teen1 六款全带 never 分文");
  const NEW_MARKS = ["mark_pencil", "mark_namecall", "mark_hopscotch", "mark_jumprope"];
  ok(NEW_MARKS.every((m) => PRO.marks[m] && typeof PRO.marks[m].shadow === "string" && PRO.marks[m].shadow.length > 5), "⑮ 新记号四枚在 MARKS 均有影子句");
  const newVars = c1.variants.slice(4).concat(c2.variants.slice(4));
  ok(newVars.length === 4 && newVars.every((v) => v.set === v.mark && NEW_MARKS.includes(v.mark)), "⑮ child1/2 新增四款 set=mark 且均为新记号");
  { // 纯发放扫描：新记号全仓只许出现在 prologue.js（定义）与 registry.js（登记）
    const hits = new Set();
    const exact = NEW_MARKS.map((m) => [m, new RegExp(m + "(?![0-9A-Za-z_])")]); // 精确 id 匹配：mark_pencil55/65 是他代既有记号，不算引用
    const walk = (dir) => { for (const name of fs.readdirSync(dir)) { const p = path.join(dir, name); const st = fs.statSync(p); if (st.isDirectory()) walk(p); else if (name.endsWith(".js")) { const src = fs.readFileSync(p, "utf8"); for (const [m, re] of exact) if (re.test(src)) hits.add(m + " @ " + path.relative(ROOT, p)); } } };
    walk(path.join(ROOT, "src"));
    const allowed = new Set(NEW_MARKS.flatMap((m) => [m + " @ src/content/prologue/prologue.js", m + " @ src/registry.js"]));
    ok([...hits].every((h) => allowed.has(h)), `⑮ 新记号纯发放：引用面只在定义与登记（实测 ${[...hits].join("；") || "无"}）`);
  }
  { // 定款分布：2,000 个种子，十款拍每款 ≥6%（第二轮水位）；平年六款 ≥10%
    const N = 2000, cE2 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], cE3 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], cE4 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const cFlat = { 6: [0, 0, 0, 0, 0, 0], 8: [0, 0, 0, 0, 0, 0], 10: [0, 0, 0, 0, 0, 0], 14: [0, 0, 0, 0, 0, 0], 19: [0, 0, 0, 0, 0, 0] };
    for (let i = 0; i < N; i++) {
      const s = "EV15-" + i;
      cE2[PRO.early2KeyFor(s)]++; cE3[PRO.early34KeyFor(s, "#early3")]++; cE4[PRO.early34KeyFor(s, "#early4")]++;
      for (const age of [6, 8, 10, 14, 19]) cFlat[age][PRO.flatKeyFor(s, age, 6)]++;
    }
    ok(cE2.every((c) => c >= N * 0.06), `⑮ early2 定款分布十款全 ≥6%（${cE2.join("/")}）`);
    ok(cE3.every((c) => c >= N * 0.06), `⑮ early3 定款分布十款全 ≥6%（${cE3.join("/")}）`);
    ok(cE4.every((c) => c >= N * 0.06), `⑮ early4 定款分布十款全 ≥6%（${cE4.join("/")}）`);
    const shape = [cE2[0] + cE2[3] + cE2[6] + cE2[7], cE2[1] + cE2[4] + cE2[8], cE2[2] + cE2[5] + cE2[9]];
    ok(shape[0] >= N * 0.45 && shape[0] <= N * 0.55 && shape[1] >= N * 0.20 && shape[1] <= N * 0.30 && shape[2] >= N * 0.20 && shape[2] <= N * 0.30, `⑮ early2 三形概率保持 1/2、1/4、1/4（${shape.join("/")}）`);
    ok(Object.entries(cFlat).every(([, cs]) => cs.every((c) => c >= N * 0.10)), `⑮ 平年五岁定款分布六款全 ≥10%（${Object.entries(cFlat).map(([a, cs]) => a + ":" + cs.join("/")).join(" ")}）`);
  }
  { // start() 集成：key 与 seedStr 落盘、且与定款函数同值
    const S = P.freshState("EV15-START");
    S.era = "c2000";
    PRO.start(S, "EV15-START");
    ok(S.prologue.early2Key === PRO.early2KeyFor("EV15-START") && S.prologue.early3Key === PRO.early34KeyFor("EV15-START", "#early3") && S.prologue.early4Key === PRO.early34KeyFor("EV15-START", "#early4") && S.prologue.seedStr === "EV15-START", "⑮ start(): early2/3/4Key 与 seedStr 落盘且与定款函数一致");
  }
}

// ---- ⑯ 变体扩容第二轮：既有下标逐字 / child4 新记号 / teen2 四款 / y17/y18 四套 / 幕级定款分布 ----
console.log("⑯ 变体扩容第二轮：early/flats 既有下标逐字 / pr_child4 六款 / pr_teen2 四款 / pr_y17/y18 四套 / 幕级定款分布");
{
  const PRO = sandbox.window.GAME_PROLOGUE;
  const first = (id) => PRO.acts.find((a) => a.id === id);
  const e2 = first("pr_early2"), e3 = first("pr_early3"), e4 = first("pr_early4");
  // early2 下标 3–5（首轮三形新文）逐字（下标 0–2 见 ⑮）
  ok(e2.texts[3].text === "两岁这一年，你长得结实，饭量比大人想的还大。喂什么吃什么，不挑。家里人说，这样的孩子好养活，省了不少心。" && e2.texts[3].log === "平稳长大", "⑯ pr_early2[3] 首轮平稳新文逐字");
  ok(e2.texts[4].text === "两岁这一年，你出过一回疹子，身上起了一片红点，夜里痒得睡不踏实。大人轮着抱你，在屋里慢慢走，走着走着你就睡了。疹子退下去之后，你又满屋跑了。" && e2.texts[4].log === "病过一场", "⑯ pr_early2[4] 首轮小病新文逐字");
  ok(e2.texts[5].text === "两岁这一年，你学会了开门——够着门把手，踮着脚，使大劲往下压。门一开你就往外钻，大人一天里不知道追回来多少回，最后拿根绳把门拴上了。" && e2.texts[5].log === "满地跑", "⑯ pr_early2[5] 首轮满地跑新文逐字");
  // early3/4 下标 0–5 逐字（0 已在 ⑮ 单钉，此处整段比对）
  const E3_OLD = [
    "三岁那年，你开始跟在大人后头学话。大人说一句，你跟一句，学得一本正经，音还咬不准。家里人笑，你也跟着笑，以为自己说得对极了。",
    "三岁那年，你话多得收不住，见着什么都要问一句「这是啥」。大人答得口干，你还在问。到后来，大人指着桌子先开了口：这是桌子，别问了。",
    "三岁那年，你学会了头一句完整的话，是跟大人要吃的。手里明明还拿着半块，又指着锅里说，还要。说得清清楚楚，一点不含糊。",
    "三岁那年，你把家里人的称呼喊了个遍，就是分不清辈分，见谁都喊哥哥。喊错了，大人纠正一回，你下回还照旧，喊得理直气壮。",
    "三岁那年，你学了一首儿歌，是大人一句一句喂会的。唱到中间总忘词，就拿「啦啦啦」顶上，调还跑得老远，谁也不忍心打断你。",
    "三岁那年，你说话带上了大人的口头禅，连叹气的样子都学。家里来人，你背着手站在门口说一句「坐吧」，把一屋子人说愣了，随后全笑了。",
  ];
  ok(E3_OLD.every((s, i) => e3.texts[i].text === s), "⑯ pr_early3 下标 0–5 与扩容前逐字一致");
  const E4_OLD = [
    "四岁那年，你开始记事了。谁给过你一块糖，谁答应的事没算数，你都记得。家里人说，这孩子记性好，往后吃不了亏。",
    "四岁那年，你记住了去小卖部的路，能自己跑个来回，找回来的零钱一分不少。家里人开始打发你跑腿，多给你一毛钱，算是辛苦费。",
    "四岁那年，你认得家里每样东西的位子。谁的东西找不着，来问你，你一指一个准。大人说，这孩子眼睛尖，心里有数。",
    "四岁那年，你头回一个人睡，半夜醒过一回，抱着枕头坐了一阵，没喊人，又躺下了。第二天大人看被子叠得整整齐齐，还以为是别人帮你叠的。",
    "四岁那年，你学会了看大人的脸色。家里人吵了两句，你就安安静静地摆弄手里的东西，不闹人。等气氛缓过来，你才凑过去要吃的。",
    "四岁那年，家里来过一个远房亲戚，住了一礼拜。走的时候你抱着人家的腿不撒手。过了半年，人家再来，你还认得，跑过去喊，就是把称呼喊错了一辈。",
  ];
  ok(E4_OLD.every((s, i) => e4.texts[i].text === s), "⑯ pr_early4 下标 0–5 与扩容前逐字一致");
  // 平年五岁下标 0–3 逐字
  const FLAT_OLD = {
    6: ["六岁那年，你学会了自己系鞋带，头一回没让大人帮忙，就是系成了死结，最后还是大人蹲下来解的。",
      "六岁那年，你学会了自己穿衣服，就是扣子总扣错一格，斜着一排到了学校才被同学指出来。你也不嫌丢人，中午回家重扣了一遍。",
      "六岁那年，你掉了一颗下牙，哭了半天，怕它长不出来。大人说，长，掉一颗长一颗，新的还更结实。你天天伸舌头去舔那个缺口，舔了好些日子。",
      "六岁那年，你学会了看表，认不全数字，就记长针短针的位子。家里人问几点，你能报个八九不离十，自己得意得不行。"],
    8: ["这一年没什么大事。你的乳牙掉了一颗，压在枕头底下，第二天枕头底下多了一块糖，你到现在也不确定是谁放的。",
      "八岁那年，你学会了骑家里那辆旧自行车，腿还够不着座，就站在横梁下头蹬。在院里摔了两回，膝盖磕青了，也没哭，扶起来接着骑。",
      "八岁那年，你攒了一个月的零钱，买了个想要好久的玩具，没拿热乎两天，借给同学，拿回来时少了个零件。你心疼，也没好意思要人家赔。",
      "八岁那年，你头回自己洗衣服，肥皂下多了，漂了四遍水还是滑的。大人晾出去时直摇头，你倒觉得洗得挺干净，穿在身上还有股肥皂味。"],
    10: ["十岁那年，家里换了台新电视，旧的那台搬去了奶奶屋里。你负责上房顶转天线，转准了画面，全家都说你手稳。",
      "十岁那年，你学会了包饺子，捏出来的个个站不稳，下锅一煮，露了一半馅。家里人捞出来照样吃，说，下回就好了。",
      "十岁那年，你迷上了集卡片，零花钱大半换成了卡，厚厚一摞拿橡皮筋捆着。跟人对着拍，赢回来的揣兜里，输了就回家翻箱倒柜找自己的存货。",
      "十岁那年，家里停电停了一晚上，你点了蜡烛写作业，影子在墙上晃。来电的时候你正写到一半，倒有点舍不得那支蜡烛了。"],
    14: ["初二这一年，你的个子蹿了一截，校服裤子眼看着短下去，露着脚脖子过了一冬天，谁也没顾上给你换。",
      "十四岁这一年，你开始爱照镜子了，出门前总要扒拉两下头发。家里人笑你臭美，你嘴上不认，镜子还是天天照。",
      "十四岁这一年，你的饭量涨得吓人，一顿吃两碗还盯着锅。家里人添饭时直念叨：这哪是吃饭，这是往里倒。",
      "十四岁这一年，你学会了跟大人顶嘴，顶完又后悔，一个人在屋里闷半天。等家里人喊吃饭，你低着头出去，谁也不提刚才的事，饭桌上又好了。"],
    19: ["这一年过得平。手机换了张新卡，旧号码的联系人导过来，少了几个，你也没太在意。",
      "十九岁这一年，你学会了自己去医院挂号，排了一上午队，看了个感冒。回来路上买了点水果，觉得自己也算能照顾自己了。",
      "十九岁这一年，你的作息彻底乱了，夜里两三点还醒着，中午才起。家里人说你几回，你答应得好好的，到晚上又照旧。",
      "十九岁这一年，你把头发剪短了，剪完对着镜子看了半天，不太习惯。家里人说精神，你也就留下了，没再往长里续。"],
  };
  ok(Object.entries(FLAT_OLD).every(([age, arr]) => arr.every((s, i) => PRO.flatsByAge[age].texts[i] === s)), "⑯ 平年五岁下标 0–3 与扩容前逐字一致");
  // pr_child4 六款：带内扩轮换（旧四记号都带成年回响，整体重掷会洗全线轨迹——新款挂旧记号）
  const c4 = first("pr_child4");
  ok(!!c4 && c4.variants.length === 6, "⑯ pr_child4（c2000 包）variants = 6");
  ok(JSON.stringify(c4.variants.map((v) => v.key)) === JSON.stringify(["tree", "shop", "yearbook", "classphoto", "shoestand", "lastpage"]), "⑯ pr_child4 六款 key 序（既有四款未动、新款追加在尾）");
  ok(c4.variants[0].text === "小学门口有棵老梧桐，树底下有个修鞋摊。你毕业那年夏天，学校要拓宽校门，树留不留，议论了一阵。后来树留下了，修鞋摊挪到树影的另一边，大爷说，挪几步没事，照样修鞋。", "⑯ pr_child4[0] 原文逐字");
  ok(c4.variants[4].set === "mark_tree" && c4.variants[4].mark === "mark_tree" && c4.variants[5].set === "mark_yearbook" && c4.variants[5].mark === "mark_yearbook", "⑯ pr_child4 新款挂旧记号（shoestand→梧桐、lastpage→留言册），记号面与旧版全等");
  { // 带内扩轮换审计：r 全域扫描——每一点映射出的记号须与旧版 floor(r*4) 落带记号相同，且六款份额各 ≥6%
    ok(typeof PRO.child4KeyFor === "function", "⑯ PRO_API 暴露 child4KeyFor");
    const OLD4_MARKS = ["mark_tree", "mark_shop", "mark_yearbook", "mark_classphoto"];
    const markOf = {}; for (const v of c4.variants) markOf[v.key] = v.mark;
    const cnt = {}; let markOk = true;
    const NC = 4000;
    for (let i = 0; i < NC; i++) { const r = (i + 0.5) / NC; const k = PRO.child4KeyFor(r); cnt[k] = (cnt[k] || 0) + 1; if (markOf[k] !== OLD4_MARKS[Math.floor(r * 4)]) markOk = false; }
    ok(markOk, "⑯ pr_child4 带内扩轮换：r 全域记号与旧版逐点全等（成年回响/轨迹零扰动）");
    ok(["tree", "shop", "yearbook", "classphoto", "shoestand", "lastpage"].every((k) => (cnt[k] || 0) >= NC * 0.06), `⑯ pr_child4 六款定款份额各 ≥6%（${JSON.stringify(cnt)}）`);
  }
  // pr_teen2 四款：款 0 逐字 + 新款分文结构
  const t2 = first("pr_teen2");
  ok(t2.text === "十五岁那年，你开始想一件事：往后的日子，是接着念书，还是早点出去挣钱。想归想，日子还是一天一天过——作业要交，饭要照吃。", "⑯ pr_teen2 款0 正文逐字");
  ok(t2.textBySchooling && t2.textBySchooling.never === "十五岁那年，你开始想一件事：往后的日子，是守着家里这一摊，还是早点出去挣钱。想归想，日子还是一天一天过——活要干，饭要照吃。" && t2.textBySchooling.left === "十五岁那年，你开始想一件事：书已经放下了，往后的日子，是守着家里这一摊，还是早点出去挣钱。想归想，日子还是一天一天过——活要干，饭要照吃。", "⑯ pr_teen2 款0 never/left 分文逐字");
  ok(Array.isArray(t2.altTexts) && t2.altTexts.length === 3, "⑯ pr_teen2 altTexts = 3（连原款共四款）");
  ok(t2.altTexts.every((e) => typeof e.text === "string" && e.text.length > 20 && e.textBySchooling && typeof e.textBySchooling.never === "string" && e.textBySchooling.never.length > 20 && typeof e.textBySchooling.left === "string" && e.textBySchooling.left.length > 20), "⑯ pr_teen2 新款逐款配齐 never/left 分文");
  ok(t2.altTexts.every((e) => !e.textBySchooling.never.includes("作业") && !e.textBySchooling.left.includes("作业") && !e.textBySchooling.never.includes("上学") && !e.textBySchooling.left.includes("上学")), "⑯ pr_teen2 新款 never/left 分文不预设在校（无作业/上学）");
  ok(!t2.variants, "⑯ pr_teen2 不走 variants 机制（序章流零新增掷格）");
  // pr_y17 / pr_y18 四套：套 0 逐字 + 新套结构
  const y17 = first("pr_y17"), y18 = first("pr_y18");
  const Y17_0 = { study: "高二分了科。你选的那一科，班里走了一半人，又从别的班补进来一半。晚自习的灯管换了一根，亮得有点晃眼。",
    work: "打工第一年，你在流水线上学到一件事：手上的活要快，眼睛还得盯着前一个工位。工资发下来，头一笔给你妈转了三百。",
    craft: "职校第二年，开始进实训车间。师傅让你先练基本功，同一个件磨了四十遍，手上的茧先起来了。",
    home: "留在家里的第一年，你跟着把一季庄稼从头走到尾。播种的时候腰是弯的，收的时候也是。晒场上的谷子，你翻了不下二十遍。" };
  ok(["study", "work", "craft", "home"].every((k) => y17.textByTrack[k] === Y17_0[k]) && y17.tail === "你把闹钟定得比别人早十分钟，后来慢慢成了习惯。", "⑯ pr_y17 套0 四轨＋尾句逐字");
  const Y18_0 = { study: "高三这一年，日子是按周过的：周考、月考、模拟。教室后墙贴了张倒计时，数字一天少一个。你的水杯上贴着名字，怕拿错。",
    work: "你满十八了。厂里把你从临时工转成正式的，工牌换了颜色。夜班排到你的时候，你在休息室的长椅上睡过几个整觉。",
    craft: "毕业这一年，你开始跟师傅出活。头一回独立干完一件，验收的人点了点头。你回去把那件工具擦了三遍。",
    home: "这一年收成还行。你爸把卖粮的钱数了两遍，分出一份，说给你留着。村里同龄的走了大半，晚饭桌上常听见他们打工地方的名字。" };
  ok(["study", "work", "craft", "home"].every((k) => y18.textByTrack[k] === Y18_0[k]) && y18.tail === "成年这天，你请要好的几个吃了顿饭，一人一瓶汽水，瓶子碰在一起，声音很脆。", "⑯ pr_y18 套0 四轨＋尾句逐字");
  for (const [act, nm] of [[y17, "pr_y17"], [y18, "pr_y18"]]) {
    ok(Array.isArray(act.altSets) && act.altSets.length === 3 && act.altSets.every((s) => ["study", "work", "craft", "home"].every((k) => typeof s.textByTrack[k] === "string" && s.textByTrack[k].length > 15) && typeof s.tail === "string" && s.tail.length > 5), `⑯ ${nm} altSets = 3，每套四轨＋尾句齐全（连原套共四套）`);
  }
  { // 幕级定款分布：2,000 个种子，四款全 ≥15%
    const N = 2000;
    ok(typeof PRO.actVariantKeyFor === "function", "⑯ PRO_API 暴露 actVariantKeyFor");
    for (const id of ["pr_teen2", "pr_y17", "pr_y18"]) {
      const c = [0, 0, 0, 0];
      for (let i = 0; i < N; i++) c[PRO.actVariantKeyFor("EV16-" + i, id, 4)]++;
      ok(c.every((x) => x >= N * 0.15), `⑯ ${id} 幕级定款四款全 ≥15%（${c.join("/")}）`);
    }
  }
}

// ---- ⑰ 结局扩容批（人生形状 15 条，17→32）：数据形状 + 手组终局直调 specialEnding ----
// 纯数据五条走 met/evidence 本体；形状门六条（终局年龄/伴侣史/statsLate/usedRare）走
// settlement.js specialEnding() 的形状门段——正反两侧都测：形状不合时必须剔除。
console.log("⑰ 结局扩容批：人生形状 15 条数据形状 / specialEnding 命中与形状门剔除");
vm.runInContext("window.__P.specialEnding = window.IFY.specialEnding;", sandbox, { filename: "probe-export-14" });
{
  const NEW_ENDS = ["end_care_parents", "end_solo_free", "end_two_home", "end_late_partner", "end_return_home", "end_farm_life", "end_comeback", "end_rent_free", "end_abroad_rest", "end_old_hand", "end_one_partner", "end_long_life", "end_steady_life", "end_late_learner", "end_early_full"];
  const ends = P.D.endings || [];
  const byEnd = {}; for (const e of ends) byEnd[e.id] = e;
  ok(ends.length === 32, "⑰ 数据: 结局表共 32 条（17 旧 + 15 新）");
  ok(NEW_ENDS.every((id) => byEnd[id] && byEnd[id].tier === "rare" && byEnd[id].title && byEnd[id].clue && byEnd[id].text), "⑰ 数据: 15 条新结局齐备（tier=rare、title/clue/text 非空）");
  ok(NEW_ENDS.every((id) => Array.isArray(byEnd[id].evidence) && byEnd[id].evidence.length === 2 && byEnd[id].evidence.every((g) => Array.isArray(g) && g.length > 0)), "⑰ 数据: 15 条新结局各恰有 2 组非空证据点（与旧 17 条同纪律）");

  const st6 = (h, m, g, f, r, w) => ({ health: h, money: m, growth: g, freedom: f, relation: r, wisdom: w });
  const FLAT = st6(50, 50, 50, 50, 50, 50);
  const LE = (age, to) => ({ age, kind: "state", id: "spouse>" + to });
  const mkEnd = (seed, o) => {
    const S = P.freshState(seed);
    P.S = S;
    S.route = { id: o.route || "corp" }; S.era = "c2000"; S.birthYear = 2000;
    S.age = o.age != null ? o.age : (o.deathAge || 80);
    S.death = { age: o.deathAge || 80, type: "health", text: "" };
    S.stats = o.stats || FLAT;
    S.statsLate = o.late !== undefined ? o.late : null;
    S.ledger = o.ledger || [];
    S.usedEvents = o.used || [];
    S.usedRare = o.rare || [];
    if (o.flags) Object.assign(S.flags, o.flags);
    if (o.flagAges) S.flagAges = o.flagAges;
    if (o.spouse) S.state.spouse = o.spouse;
    if (o.kids) S.state.kids = o.kids;
    if (o.dad) S.state.dad = o.dad;
    if (o.mom) S.state.mom = o.mom;
    return S;
  };
  const spId = () => { const sp = P.specialEnding(); return sp ? sp.id : null; };

  mkEnd("E14-LL1", { deathAge: 92, flags: { retired_full: true } });
  ok(spId() === "end_long_life", "⑰ 功能: 92 岁终局 + retired_full + 健康 50 → 九十多岁");
  mkEnd("E14-LL2", { deathAge: 85, flags: { retired_full: true } });
  ok(spId() === null, "⑰ 功能: 85 岁终局同形 → 形状门剔除九十多岁（无其他结局落定）");
  mkEnd("E14-CP", { deathAge: 85, dad: "dead", mom: "dead", flags: { care_self: true }, used: ["cb_care_near"] });
  ok(spId() === "end_care_parents", "⑰ 功能: 双亲已逝 + care_self + 照护组合 → 在父母跟前");
  mkEnd("E14-TH", { deathAge: 80, spouse: "partnered", kids: "none", flags: { kid_no: true }, used: ["c_partner"] });
  ok(spId() === "end_two_home", "⑰ 功能: partnered + kids none + kid_no → 两个人的家");
  mkEnd("E14-SF", { deathAge: 84, spouse: "single", stats: st6(50, 50, 50, 70, 50, 50), flags: { hobby_run: true }, used: ["c_single"] });
  ok(spId() === "end_solo_free", "⑰ 功能: 终局 single + 自由 70 + 一人过年组合 → 一个人也热闹");
  mkEnd("E14-LP", { deathAge: 78, spouse: "partnered", stats: st6(50, 50, 50, 50, 55, 50), used: ["c_partner"], ledger: [LE(25, "partnered"), LE(50, "widowed"), LE(52, "partnered")] });
  ok(spId() === "end_late_partner", "⑰ 功能: 丧偶后再结伴（伴侣史 2 任）+ 终局 partnered → 迟来的伴");
  mkEnd("E14-OP", { deathAge: 80, spouse: "partnered", stats: st6(50, 50, 50, 50, 60, 50), used: ["c_partner"], ledger: [LE(28, "partnered")] });
  ok(spId() === "end_one_partner", "⑰ 功能: 伴侣史恰 1 任、28 岁成伴至 80 岁 → 白头偕老");
  mkEnd("E14-LN1", { deathAge: 80, stats: st6(50, 50, 62, 50, 50, 60), late: st6(50, 50, 45, 50, 50, 50) });
  ok(spId() === "end_late_learner", "⑰ 功能: 成长 60 岁快照 45 → 终局 62（涨 17）→ 越老越学");
  mkEnd("E14-LN2", { deathAge: 80, stats: st6(50, 50, 62, 50, 50, 60), late: st6(50, 50, 57, 50, 50, 50) });
  ok(spId() === null, "⑰ 功能: 成长涨幅仅 5 → 形状门剔除越老越学");
  mkEnd("E14-ST1", { deathAge: 80, flags: { retired_full: true }, used: ["c_partner"] });
  ok(spId() === "end_steady_life", "⑰ 功能: 80 岁 + 六维全中段 + 无稀有 + retired_full → 安稳一生");
  mkEnd("E14-ST2", { deathAge: 80, flags: { retired_full: true }, used: ["c_partner"], rare: ["r_lottery"] });
  ok(spId() === null, "⑰ 功能: 有稀有事件在账 → 形状门剔除安稳一生");
  mkEnd("E14-EF", { deathAge: 58, spouse: "partnered", stats: st6(50, 50, 50, 50, 70, 65), used: ["c_partner"] });
  ok(spId() === "end_early_full", "⑰ 功能: 58 岁终局 + 关系 70/智慧 65 + 有伴 → 送行的人多");
  mkEnd("E14-RH", { deathAge: 80, route: "corp", stats: st6(50, 50, 50, 50, 70, 50), flags: { back_home_stay: true, moved_city: true }, ledger: [{ age: 22, kind: "route", id: "corp" }, { age: 45, kind: "event", id: "p11_040", set: "back_home_stay" }] });
  ok(spId() === "end_return_home", "⑰ 功能: corp 路线 + 45 岁回乡定居（轨迹终点 home）→ 落叶归根");
  mkEnd("E14-FL", { deathAge: 82, route: "farm", flags: { farm_work: true }, used: ["p29_003"], ledger: [{ age: 22, kind: "route", id: "farm" }] });
  ok(spId() === "end_farm_life", "⑰ 功能: farm 路线 + farm_work + 轨迹终点 home → 守着土地");
  mkEnd("E14-AR", { deathAge: 80, route: "abroad", flags: { stayed_city: true }, used: ["ab37_003"], ledger: [{ age: 22, kind: "route", id: "abroad" }] });
  ok(spId() === "end_abroad_rest", "⑰ 功能: abroad 路线 + 轨迹终点 abroad + 永住/扎根事实 → 异乡终老");
  mkEnd("E14-RF", { deathAge: 78, stats: st6(50, 50, 50, 92, 50, 50), flags: { renting: true } });
  ok(spId() === "end_rent_free", "⑰ 功能: 终局私租（派生 renting）+ 自由 92 → 无房一身轻");
  mkEnd("E14-RF2", { deathAge: 45, stats: st6(50, 50, 50, 92, 50, 50), flags: { renting: true } });
  ok(spId() === null, "⑰ 功能: 45 岁终局同形 → 形状门剔除无房一身轻（一辈子未走完）");
  mkEnd("E14-CB", { deathAge: 80, stats: st6(55, 68, 50, 50, 50, 50), flags: { laid_off: true } });
  ok(spId() === "end_comeback", "⑰ 功能: laid_off 在账 + 钱回到 68/健康 55 → 重新站起来");
  mkEnd("E14-OH", { deathAge: 85, age: 70, stats: st6(50, 50, 70, 50, 50, 50), flags: { factory_work: true, mentor_bond: true }, flagAges: { factory_work: 25 }, ledger: [{ age: 25, kind: "event", id: "p15_006", set: "factory_work" }] });
  ok(spId() === "end_old_hand", "⑰ 功能: 同一主线工龄 45 年 + 成长 70 + 带过徒弟 → 老把式");
}

// ---- ⑱ 退休可能性池：数据形状 / 年份门 / 链条三件 / 关联旗落账 / 平年守卫 ----
console.log("⑱ 退休可能性池：52 拍数据 / minYear 硬门 / 链条接力 / 旗落账 / 平年侧表");
{
  const RT_IDS = ["rt_travel_duo","rt_travel_solo","rt_travel_show","rt_travel_decide","rt_travel_echo_kept","rt_travel_echo_packed","rt_stream_open","rt_stream_show","rt_stream_decide","rt_stream_echo_sold","rt_stream_echo_closed","rt_cruise_world","rt_cruise_near","rt_cruise_echo","rt_winter_home","rt_winter_away","rt_winter_decide","rt_shop_open","rt_shop_chair","rt_shop_decide","rt_shop_echo","rt_grand_open","rt_grand_show","rt_grand_decide","rt_grand_echo","rt_kin_far","rt_grand_watch","rt_stall_open","rt_stall_show","rt_class_open","rt_class_show","rt_class_decide","rt_class_edit","rt_unit_open","rt_unit_echo","rt_garden_yard","rt_garden_balcony","rt_garden_show","rt_garden_big","rt_house_open","rt_house_show","rt_old_friends","rt_old_neighbors","rt_late_owned","rt_late_kids","rt_late_solo","rt_skill_pass","rt_move_kid","rt_health_club","rt_health_echo","rt_pet_old_cat","rt_pet_old_dog"];
  ok(RT_IDS.length === 52 && RT_IDS.every((id) => !!byId[id]), "⑱ 52 条 rt_* 新拍全部在册");
  ok(byId.rt_stream_open.minYear === 2016 && byId.rt_stream_show.minYear === 2016 && byId.rt_stream_decide.minYear === 2016, "⑱ 直播链三拍 minYear=2016 硬门齐全（§7 绑公历）");
  ok(byId.rt_class_edit.minYear === 2012 && byId.rt_class_edit.require === "stream_begun", "⑱ 剪辑班 minYear=2012 且读 stream_begun（与直播链互链）");
  ok(byId.p24_051.set === "class_joined", "⑱ p24_051 本批起同落 class_joined（旧拍即链的一张脸）");
  ok(JSON.stringify(byId.rt_cruise_world.stats) === JSON.stringify([{ k: "money", gt: 69 }, { k: "health", gt: 49 }]) && JSON.stringify(byId.rt_cruise_near.stats) === JSON.stringify([{ k: "money", gt: 57 }, { k: "health", gt: 39 }]), "⑱ 邮轮双档门：长线 钱>69/健康>49、短线 钱>57/健康>39");
  ok(byId.rt_cruise_near.forbid === "cruise_world", "⑱ 邮轮短线 forbid cruise_world（先远后近不出，近→远经手保留）");
  const reg17 = sandbox.window.GAME_REGISTRY;
  const st17 = (f) => (reg17.milestones[f] && reg17.milestones[f].setters) || [];
  ok(st17("travel_begun").join() === "rt_travel_duo,rt_travel_solo" && st17("stream_begun").join() === "rt_stream_open" && st17("shop_opened").join() === "rt_shop_open" && st17("grandkid_begun").join() === "rt_grand_open", "⑱ 链锚旗登记：travel/stream/shop/grandkid begun 的 setter 与数据一致");
  ok(st17("class_joined").includes("p24_051") && st17("class_joined").includes("rt_class_open") && st17("class_joined").includes("rt_class_edit"), "⑱ class_joined 三 setter 齐（p24_051＋rt_class_open＋rt_class_edit）");
  ok(st17("shop_wound_down").join() === "rt_shop_decide" && st17("shop_closed").join() === "p2_040,p30_008", "⑱ shop_wound_down 独立登记、本体 shop_closed 的 setter 未被污染（防撞名回归）");
  ok(byId.rt_travel_duo.set === "travel_begun" && byId.rt_travel_show.require === "travel_begun" && byId.rt_travel_decide.require === "travel_begun", "⑱ 游山玩水链：开启落锚、露面/经手 require 同锚");
  ok(byId.rt_shop_chair.require === "shop_opened" && byId.rt_shop_decide.require === "shop_opened" && byId.rt_garden_yard.set === "garden_begun" && byId.rt_garden_balcony.forbid === "garden_begun" && byId.rt_winter_away.forbid === "winter_begun", "⑱ 小店/种菜/过冬链：锚旗与防双呈 forbid 落账");
  ok(P.flatAdult.length === 14 && [0, 1, 2, 3, 4].every((i) => !P.flatAdultNeeds[i]), "⑱ FLAT_ADULT 共 14 行、旧行 0–4 无守卫（旧局逐字不变）");
  ok(P.flatAdultNeeds[5].flag === "travel_paused" && P.flatAdultNeeds[7].flag === "cruise_world" && P.flatAdultNeeds[11].flag === "stall_started" && P.flatAdultNeeds[11].notFlag === "stall_paused" && P.flatAdultNeeds[13].flag === "stream_sold", "⑱ 平年回响侧表：下标 5–13 旗守卫与 rhythm 追加行一一对应");
  // 功能：合成退休局
  function retiredS(by, age, retireAge) {
    const S = freshS();
    S.birthYear = by; S.age = age; S.state.workPhase = "retired";
    S.flags = { retired_begun: true }; S.flagAges = { retired_begun: retireAge };
    S.usedEvents = []; S.usedRare = [];
    return S;
  }
  { // 直播年份门：1950 年生、2015 年（65 岁）不出，2016 年（66 岁）出——门锁公历年不锁年龄
    let S = retiredS(1950, 65, 60);
    ok(P.met(byId.rt_stream_open) === false, "⑱ 功能：1950 年生 65 岁（公历 2015）直播拍不出（minYear 门）");
    S = retiredS(1950, 66, 60);
    ok(P.met(byId.rt_stream_open) === true, "⑱ 功能：1950 年生 66 岁（公历 2016）直播拍可出");
    S = retiredS(2000, 60, 58); // 出生年换代、年龄更小，公历 2060 照样出——门不绑年龄
    ok(P.met(byId.rt_stream_open) === true, "⑱ 功能：2000 年生 60 岁（公历 2060）直播拍可出（门绑公历不绑年龄）");
  }
  { // 游山玩水链：露面在开启后 1–4 年、经手在 2–7 年，窗口外自动落空
    let S = retiredS(1960, 62, 60);
    S.state.spouse = "partnered";
    ok(P.met(byId.rt_travel_show) === false, "⑱ 功能：未开启时露面拍不出");
    S.flags.travel_begun = true; S.flagAges.travel_begun = 61; // 开启后 1 年
    ok(P.met(byId.rt_travel_show) === true && P.met(byId.rt_travel_decide) === false, "⑱ 功能：开启后 1 年露面可出、经手未到（flagAgeMin 2）");
    S.flagAges.travel_begun = 60; // 开启后 2 年
    ok(P.met(byId.rt_travel_decide) === true, "⑱ 功能：开启后 2 年经手可出");
    S.age = 67; // 开启后 7 年：露面窗（≤6）已过、经手窗（≤7）还在
    ok(P.met(byId.rt_travel_show) === false && P.met(byId.rt_travel_decide) === true, "⑱ 功能：开启后 7 年露面窗已关、经手窗未关");
    S.state.spouse = "widowed";
    ok(P.met(byId.rt_travel_duo) === false && P.met(byId.rt_travel_solo) === false, "⑱ 功能：退休已满 6 年，两张开启脸都过首呈窗（flagAgeWithin 3）");
  }
  { // 带孙辈链：孩子年龄门与 kid_abroad 负向门
    let S = retiredS(1955, 68, 66);
    S.state.kids = "has"; S.kidsAt = 38; // 孩子 30 岁
    ok(P.met(byId.rt_grand_open) === true, "⑱ 功能：孩子 30 岁、退休 2 年，带孙辈开启可出");
    S.kidsAt = 50; // 孩子 18 岁：孙辈无从谈起
    ok(P.met(byId.rt_grand_open) === false, "⑱ 功能：孩子 18 岁，带孙辈开启不出（kidAgeMin 25）");
    S.kidsAt = 38; S.flags.kid_abroad = true;
    ok(P.met(byId.rt_grand_open) === false && P.met(byId.rt_kin_far) === true, "⑱ 功能：孩子在国外时近身带娃不出、视频/探亲脸可出");
  }
  { // 邮轮钱档分流
    let S = retiredS(1960, 63, 61);
    S.stats.money = 75; S.stats.health = 60;
    ok(P.met(byId.rt_cruise_world) === true, "⑱ 功能：钱 75/健康 60，邮轮长线可出");
    S.stats.money = 62;
    ok(P.met(byId.rt_cruise_world) === false && P.met(byId.rt_cruise_near) === true, "⑱ 功能：钱 62，长线关、短线开");
    S.stats.money = 40;
    ok(P.met(byId.rt_cruise_near) === false, "⑱ 功能：钱 40，邮轮两线都关（不贴价签、不判低，只是不出这拍）");
  }
  { // 平年守卫功能：无旗局读不到回响行
    let S = freshS();
    ok(P.flatLineOk("adult", 0) === true && P.flatLineOk("adult", 5) === false, "⑱ 功能：无 travel_paused 旗时平年回响行不出、旧行照常");
    S.flags.travel_paused = true;
    ok(P.flatLineOk("adult", 5) === true, "⑱ 功能：落 travel_paused 后回响行可出");
    S.flags.stall_started = true; S.flags.stall_paused = true;
    ok(P.flatLineOk("adult", 11) === false, "⑱ 功能：已收摊的局读不到小摊进项行（notFlag 守卫）");
  }
  { // 76+ 可调度：年龄窗在数据层（eventPool 按 min/max 过滤，met 不查年龄）；状态/年龄代理门在 met 层
    ok(byId.rt_old_friends.min === 77 && byId.rt_old_friends.max === 88 && byId.rt_old_neighbors.min === 84 && byId.rt_old_neighbors.max === 98, "⑱ 数据：老朋友局 77–88、老邻居脸 84–98（年龄分脸，无虚构的朋友存殁旗）");
    ok(byId.rt_late_owned.min === 82 && byId.rt_late_kids.min === 82 && byId.rt_late_solo.min === 82 && byId.rt_grand_watch.min === 74 && byId.rt_grand_watch.max === 92, "⑱ 数据：82+ 三脸与孙辈守望（74–92）的年龄窗在册——81 岁以后仍有可调度拍");
    let S = freshS();
    S.age = 86; S.state.kids = "has"; S.kidsAt = 40; // 孩子 46 岁
    ok(P.met(byId.rt_late_kids) === true && P.met(byId.rt_grand_watch) === true, "⑱ 功能：86 岁、有孩子且孩子 46 岁时，孩子脸/孙辈守望脸的 met 门全过");
    S.state.kids = "none"; S.kidsAt = null;
    ok(P.met(byId.rt_late_kids) === false && P.met(byId.rt_grand_watch) === false, "⑱ 功能：无孩子局两脸都不出（读本局真账，不预设子孙）");
  }
  { // 81+ 实测经 eventPool（真实池过滤含年龄窗）：86 岁局里四拍在池、80 岁局里 84+ 拍不在池
    let S = freshS();
    S.age = 86; S.state.kids = "has"; S.kidsAt = 40; S.flags.bought_house = true; S.usedEvents = []; S.usedRare = [];
    const pool86 = P.eventPool().map((e) => e.id);
    ok(pool86.includes("rt_old_neighbors") && pool86.includes("rt_late_owned") && pool86.includes("rt_late_kids"), "⑱ 功能：86 岁（有孩子、自有房）事件池含老邻居脸/老屋脸/孩子脸——81+ 有可调度拍");
    S.age = 80;
    const pool80 = P.eventPool().map((e) => e.id);
    ok(pool80.includes("rt_old_friends") && !pool80.includes("rt_old_neighbors") && !pool80.includes("rt_late_kids"), "⑱ 功能：80 岁池含老朋友局、不含 84+/82+ 拍（年龄窗经池过滤真生效）");
  }
}



console.log(`\nstateline-assert: ${pass} passed, ${fail} failed`);
console.log(fail ? "RESULT: FAIL" : "RESULT: PASS");
process.exit(fail ? 1 : 0);
