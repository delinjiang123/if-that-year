// [模块]《如果那年》付费功能「人生纪录典藏」（v0.33.0）：结算页的导出台。
// 式样定稿见 paid-spec/SPEC.md：只卖「把这一生留下来」——一份数据、两个壳（长图＋可打印纪录册）；
// 不卖改命、不卖好结局、不插广告。结算页现有的一切原样全免，本模块只在分享台之后加一行入口
// 和一个导出面板；水印只落在导出成品（预览长图/预览纪录册）上，游戏内画面与现有分享卡一概不动。
// 导出全程只读结算数据（与结算页/分享卡同一批函数取数），不碰落账、不消耗随机流。
(function (IFY) {
"use strict";
const CFG = window.IFY_KEEPSAKE || {};
const LS_KEY = "ify-keepsake-v1"; // 本机解锁记录：{unlocked:true, code, at}
const PENDING_KEY = "ify-keepsake-pending"; // 领码页带回的码（sessionStorage，自动解锁失败时的预填兜底）
const BUY_PENDING_KEY = "ify-buy-pending-v1"; // 订购未完标记（父亲事故热修）：点过购买（典藏台「去订一册」或订购页付款按钮）即落，输码解锁即清；未清前结算页常驻「继续订购」入口
function markBuyPending() {
try { localStorage.setItem(BUY_PENDING_KEY, JSON.stringify({ at: new Date().toISOString()}));} catch (e) {}
}
function buyPending() {
try { return !!localStorage.getItem(BUY_PENDING_KEY);} catch (e) { return false;}
}
function clearBuyPending() {
try { localStorage.removeItem(BUY_PENDING_KEY);} catch (e) {}
}

// 统计升级批（2026-11-08）：典藏漏斗埋点——只报分类量与成败布尔，码值绝不进事件
// （收集端白名单里 code_verify / gift_claim 也只有 ok 字段，双保险）。口径见 docs/ANALYTICS.md。
function anaTrack(name, props) {
try { if (IFY.ANA && IFY.ANA.track) IFY.ANA.track(name, props || {});} catch (e) {}
}

// ---------- 本机权益 ----------
function keepsakeState() {
try { const v = JSON.parse(localStorage.getItem(LS_KEY)); if (v && v.unlocked) return v;} catch (e) {}
return { unlocked: false};
}
function keepsakeUnlocked() { return!!keepsakeState().unlocked;}
function saveUnlock(code) {
try { localStorage.setItem(LS_KEY, JSON.stringify({ unlocked: true, code: code || "", at: new Date().toISOString()}));} catch (e) {}
clearBuyPending(); // 已解锁：「继续订购」入口与未完标记一并收起（手动输码与领码页自动解锁共用此口）
}

// ---------- 导出数据（唯一口径：长图与纪录册共用，数字只许从这里出） ----------
// 年表条目形状 {age, year, text, choice, cat, beatKind}。账本（ledger）是引擎的原始记录：
// 状态流转 kind:"state"、id 形如 "spouse>partnered"；带选项的拍（fork/event/crisis/proc/
// rare/prologue）带 choice 字段存选项原文。流水行与账本的对应按引擎自己的认领口径
// （shadow.js 的 logLineFor 同理）：岔口/危机行把选项缀在行尾（「标题：选项」），事件/
// 过程行不带，只能靠同龄消去法配对——候选唯一且待认领记录唯一才认领，歧义不加小字。
function parseLogLines(logArr, birthYear) {
const out = [];
for (const l of logArr || []) {
const m = String(l).match(/^(\d+) 岁 · ([\s\S]*)$/);
if (m) out.push({ age: +m[1], year: birthYear? birthYear + (+m[1]): null, text: m[2], choice: null, cat: null, beatKind: null});
}
return out;
}

const KS_SYS_PREFIX = ["影子：", "两条路上都一样的是", "工资年结", "交换："];
function isSystemLine(text) {
return KS_SYS_PREFIX.some((p) => text.startsWith(p)) || text.includes("这一生停在这里") || text === "没有去看另一条路";
}
// 能承接选项回溯的候选行：系统行、仪式行（领证/孩子出生/父母离世是无选项的过程落点）除外
function isChoiceCandidate(e) {
const t = e.text;
if (e.choice || isSystemLine(t)) return false;
if (t.startsWith("出身：") || t.startsWith("出发：") || t.startsWith("立约：")) return false;
if (/把证领了|领证/.test(t) || /孩子出生/.test(t) || /葬礼办完/.test(t)) return false;
return true;
}

function traceChoices(entries, ledger) {
const led = Array.isArray(ledger)? ledger: [];
const microTexts = new Set(led.filter((e) => e.kind === "micro" && e.text).map((e) => e.text));
const recs = led.filter((e) => e.choice && e.kind !== "swap" && e.kind !== "route")
.map((e) => ({ age: e.age, kind: e.kind, choice: e.choice, used: false}));
const byAge = new Map();
for (const e of entries) { if (!byAge.has(e.age)) byAge.set(e.age, []); byAge.get(e.age).push(e);}
// 第一认领：行尾缀着选项原文（岔口/危机行）
for (const r of recs) {
const cs = (byAge.get(r.age) || []).filter((e) =>!e.choice && e.text.endsWith("：" + r.choice));
if (cs.length === 1) { cs[0].choice = r.choice; cs[0].beatKind = r.kind; r.used = true;}
}
// 第二认领：同龄消去法（事件/稀有/序章）——候选唯一且待认领记录唯一才配对。
// proc 不走消去法：过程的选择常常没有自己的流水行（只有触发行），硬配会把选项安到
// 同龄别人的行上，是猜不是记录——proc 的选择宁可不标，也不许认错行。
const ages = [...new Set(recs.filter((r) =>!r.used && r.kind !== "proc").map((r) => r.age))];
for (const age of ages) {
const rs = recs.filter((r) =>!r.used && r.age === age);
if (rs.length !== 1) continue;
const cs = (byAge.get(age) || []).filter((e) => isChoiceCandidate(e) &&!microTexts.has(e.text));
if (cs.length === 1) { cs[0].choice = rs[0].choice; cs[0].beatKind = rs[0].kind; rs[0].used = true;}
}
return { recs: recs.length, attached: recs.filter((r) => r.used).length};
}

// ---------- 大事记选材（定稿 §三＋§八.5 宪法 v2） ----------
// 必入位为地板（出生/抓周、选路出发、领证、孩子出生、父母离世一条、退休/落脚转折），
// 阶段上限作护栏（童年≤2 / 青年≤3 / 中年≤3 / 晚年≤2），其余名额优先带选择的事件，
// 其次稀有与人生大事词，被动平年最后。同一年至多一条，最终按年龄排序。
const MILESTONE_WORDS = ["领证", "结婚", "孩子出生", "生了孩子", "买房", "买了房", "去世", "离世", "退休", "录取", "上岸", "开业", "上市", "离婚", "毕业", "下岗", "返聘", "出国", "回国", "搬家", "高考", "中考"];
const STAGE_OF = (age) => (age <= 12? 0: age <= 29? 1: age <= 59? 2: 3);
const STAGE_CAPS = [2, 3, 3, 2];
const STAGE_NAMES = ["童年", "出发", "成家", "晚年"];
const CAT_LABEL = { grab: "抓周", origin: "出发", marry: "领证", kid: "孩子出生", parent: "父母离世", retire: "退休"};

function pickHighlightsV2(tr, target, min) {
const entries = tr.entries;
const transitions = {};
for (const e of tr.ledger || []) if (e.kind === "state" &&!(e.id in transitions)) transitions[e.id] = e.age;
const picked = [], usedAges = new Set();
const take = (e, cat) => { if (!e || usedAges.has(e.age)) return false; if (cat) e.cat = cat; picked.push(e); usedAges.add(e.age); return true;};
const poolAt = (age) => entries.filter((e) => e.age === age &&!isSystemLine(e.text) &&!e.text.startsWith("出发："));
const lineAt = (age, prefers) => {
const cs = poolAt(age);
if (!cs.length) return null;
for (const re of prefers || []) { const hit = cs.find((e) => re.test(e.text)); if (hit) return hit;}
return cs[0];
};
const lineAtStrict = (age, prefers) => {
const cs = poolAt(age);
for (const re of prefers || []) { const hit = cs.find((e) => re.test(e.text)); if (hit) return hit;}
return null;
};
// ① 出生/抓周（只有主轨合成整句；影子轨的共同童年写在册子的影子节开头，不在这里造行）
if (tr.grabText) { picked.push({ age: 1, year: tr.birthYear? tr.birthYear + 1: null, text: tr.grabText, choice: null, cat: "grab", beatKind: null}); usedAges.add(1);}
// ② 选路出发（出身行）
take(entries.find((e) => e.age === 22 && e.text.startsWith("出身：")) || null, "origin");
// ③ 领证：先找仪式行本体，再退到关系流转那一年
let marry = null;
for (const re of [/把证领了/, /领了证/, /领证/]) { marry = entries.find((e) => re.test(e.text) &&!isSystemLine(e.text)) || null; if (marry) break;}
if (!marry && "spouse>partnered" in transitions) marry = lineAt(transitions["spouse>partnered"], [/领证/, /结婚/, /成家/]);
take(marry, "marry");
// ④ 孩子出生：出生年以 kidsBornAt 为准（状态流转记的是立约/定下的年，不是出生年）；
// 必须命中出生行本体才算数，认不到就不占位
let kid = null;
if (tr.kidsBornAt != null) kid = lineAtStrict(tr.kidsBornAt, [/孩子出生/, /产房/, /生了/]);
if (!kid && "kids>has" in transitions) kid = lineAtStrict(transitions["kids>has"], [/孩子出生/, /产房/, /生了/]);
take(kid, "kid");
// ⑤ 父母离世：只入一条，取先走的那位
const pd = [transitions["dad>dead"], transitions["mom>dead"]].filter((a) => a != null);
if (pd.length) take(lineAt(Math.min(...pd), [/走了/, /去世/, /离世/]), "parent");
// ⑥ 退休/落脚转折
if ("workPhase>retired" in transitions) take(lineAt(transitions["workPhase>retired"], [/退休/, /退下来/, /退了/]), "retire");
// 填充：带选择的优先——其中岔口/危机（人生的大分岔）排在一般事件选择之前，其次稀有，
// 其次人生大事词，最后平年；同档按年龄
const rank = (e) => (e.choice? ((e.beatKind === "fork" || e.beatKind === "crisis")? 0: 1)
: e.text.startsWith("【稀有】")? 2: MILESTONE_WORDS.some((w) => e.text.includes(w))? 3: 4);
const rest = entries.filter((e) =>!usedAges.has(e.age) &&!isSystemLine(e.text)
&&!e.text.startsWith("出身：") &&!e.text.startsWith("出发：") &&!e.text.startsWith("立约："))
.sort((a, b) => (rank(a) - rank(b)) || (a.age - b.age));
const stageCount = [0, 0, 0, 0];
for (const e of picked) stageCount[STAGE_OF(e.age)]++;
for (const e of rest) {
if (picked.length >= target) break;
const st = STAGE_OF(e.age);
if (stageCount[st] >= STAGE_CAPS[st]) continue;
if (take(e, null)) stageCount[st]++;
}
// 低于下限时放宽阶段上限继续补（护栏让位于记满一生）
if (picked.length < min) for (const e of rest) { if (picked.length >= min) break; take(e, null);}
return picked.sort((a, b) => a.age - b.age);
}

function buildKeepsakeData() {
const S = IFY.S;
const slots = IFY.settlementSlots();
const slotMap = {};
for (const [k, t] of slots) slotMap[k] = t;
// 住房变现（与 renderEnd 来历行同读法：玩家本人轨账本 settle 条的实际落账额取整，只读）
let houseGain = 0;
try {
const ent = typeof IFY.houseLedgerOf === "function"? IFY.houseLedgerOf(S).filter((e) => e.type === "settle").pop(): null;
houseGain = ent? Math.round(ent.actual): 0;
} catch (e) {}
// 玩家轨记录：交换局读分段合并视图（playerFacts，与结算九槽同源），未交换局直读本轨
const view = typeof IFY.playerFacts === "function"? IFY.playerFacts(): null;
const pLog = view? view.mergedLog: (S.log || []);
const pLedger = view? view.mergedLedger: (S.ledger || []);
const timeline = parseLogLines(pLog, S.birthYear);
const pTrace = traceChoices(timeline, pLedger);
const grabMark = (S.marks || []).find((m) => m && /^grab_/.test(m.id) && m.item);
const highlights = pickHighlightsV2({
entries: timeline, ledger: pLedger, birthYear: S.birthYear || null,
kidsBornAt: S.kidsBornAt != null? S.kidsBornAt: null,
grabText: grabMark? `周岁那年，你抓了${grabMark.item}。`: null,
}, 10, 8);
// ---------- 影子轨：从不受控 Track 的真实状态整套取数 ----------
// 四件套（路线终龄/婚育/死因/终局句）＋他自己的年表选材＋终局六维，全部读影子本人的
// 记录：终局句用结算第八槽原句，婚育用瞥视骨架的登记句，死因用他流水里的死亡行原文，
// 落脚用居所/工作/阶段的事实短语拼。取不到的件整件缺席并记进 shadow.missing，不许顶替。
const shadow = { available: false, missing: [], routeName: "", finalAge: null, finalText: "", shortLine: "",
marryText: "", kidsText: "", deathText: "", landing: "", stats: null, highlights: [], timeline: [],
compareMain: "", compareOthers: []};
const cmp = typeof IFY.shadowCompareLines === "function"? IFY.shadowCompareLines(): { main: "", others: []};
shadow.compareMain = cmp.main || ""; shadow.compareOthers = cmp.others || [];
shadow.shortLine = typeof IFY.uncontrolledFinalLine === "function"? IFY.uncontrolledFinalLine(): "";
let B = null;
try {
const f = typeof IFY.uncontrolledEntry === "function"? IFY.uncontrolledEntry(): null;
B = f && f.entry && f.entry.state? f.entry.state: null;
} catch (e) {}
let sTrace = { recs: 0, attached: 0};
if (B) {
shadow.available = true;
shadow.routeName = B.route? B.route.name: "";
shadow.finalAge = B.death? B.death.age: null;
if (shadow.finalAge == null) shadow.missing.push("finalAge");
shadow.finalText = slotMap["另一条路"] || shadow.shortLine || "";
if (!shadow.finalText) shadow.missing.push("finalText");
const skel = typeof IFY.glimpseSkeleton === "function"? IFY.glimpseSkeleton(B): [];
shadow.marryText = skel[1] || ""; shadow.kidsText = skel[2] || "";
if (!shadow.marryText || !shadow.kidsText) shadow.missing.push("marriage");
let dl = typeof IFY.glimpseDeathLine === "function"? IFY.glimpseDeathLine(B): "";
if (dl) dl = dl.replace(/^\d+ 岁 · /, "");
if (!dl && B.death) dl = `这一生停在这里：${B.death.text}`;
shadow.deathText = dl || "";
if (!shadow.deathText) shadow.missing.push("death");
const facts = {};
try { for (const f of IFY.glimpseFactLines(B, B.death? B.death.age: B.age)) facts[f.slot] = f.text;} catch (e) {}
const landParts = [facts.residence, facts.work, facts.phase].filter(Boolean).map((t) => (/。$/.test(t)? t: t + "。"));
if (skel[3]) landParts.push(skel[3]);
shadow.landing = landParts.join("");
if (B.stats && IFY.STAT_META.every(([k]) => typeof B.stats[k] === "number")) {
shadow.stats = IFY.STAT_META.map(([k, label]) => ({ key: k, label, value: Math.round(B.stats[k])}));
} else shadow.missing.push("stats");
const sEntries = parseLogLines(B.log || [], S.birthYear || null);
sTrace = traceChoices(sEntries, B.ledger || []);
shadow.timeline = sEntries;
shadow.highlights = pickHighlightsV2({
entries: sEntries, ledger: B.ledger || [], birthYear: S.birthYear || null,
kidsBornAt: B.kidsBornAt != null? B.kidsBornAt: null, grabText: null,
}, 8, 5);
} else {
shadow.missing.push("track");
shadow.finalText = shadow.shortLine || "";
}
// ---------- 双生页：两条人生各自三件大事＋缺席对照（只取可核事实，取不到就不写） ----------
const everFrom = (ledger, state) => {
const ids = new Set((ledger || []).filter((e) => e.kind === "state").map((e) => e.id));
return {
partnered: ids.has("spouse>partnered") || ["partnered", "divorced", "widowed"].includes(state && state.spouse),
kids: ids.has("kids>has") || !!(state && state.kids === "has"),
retired: ids.has("workPhase>retired"),
leftHome: null,
};
};
const leftHomeOf = (T, fromAge, toAge) => {
try { const t = IFY.residenceTrailOf(T, fromAge, toAge); return t? ((t.spans.city || 0) + (t.spans.abroad || 0)) > 0: null;} catch (e) { return null;}
};
const pExp = everFrom(pLedger, S.state);
if (view && view.segments && view.segments.length) pExp.leftHome = view.segments.some((seg) => leftHomeOf(seg.state, seg.fromAge, seg.toAge) === true);
else pExp.leftHome = leftHomeOf(S, 22, IFY.finalAge());
const sExp = B? everFrom(B.ledger || [], B.state): null;
if (B) sExp.leftHome = leftHomeOf(B, 22, B.death? B.death.age: B.age);
// ---------- 类别型事实（玩家席审议单 #1）：既有四维之后再比三维粗类别 ----------
// 全部只从本局记录派生：派生不出记 null、该维不参与对比，绝不从路线名或文案猜。
// 落脚地：居所轨迹里「在不在家乡」这条轴已经由 leftHome 一维承担，重复计会把同一件
// 事写两遍——这里只补它分不出的两格：在外过又回到家乡（终点 home 且在外年数>0）、
// 去过国外（abroad 年数>0 且终点不在家乡）。一直在家乡与在城市落脚两格不另计。
const resCatFromTrail = (t) => {
if (!t || !t.spans) return null;
const away = (t.spans.city || 0) + (t.spans.abroad || 0);
if (!away) return null;
if (t.final === "home") return { cat: "backHome", phrase: "走出去，又回了家乡"};
if ((t.spans.abroad || 0) > 0) return { cat: "abroad", phrase: "去国外过日子"};
return null;
};
const trailOf = (T, toAge) => { try { return IFY.residenceTrailOf(T, 22, toAge);} catch (e) { return null;}};
const pResCat = (() => {
if (view && view.segments && view.segments.length) {
const spans = { home: 0, city: 0, abroad: 0};
let fin = null, ok = false;
for (const seg of view.segments) {
const t = trailOf(seg.state, seg.toAge);
if (t) { ok = true; fin = t.final; for (const k of ["home", "city", "abroad"]) spans[k] += t.spans[k] || 0;}
}
return ok? resCatFromTrail({ final: fin, spans }): null;
}
return resCatFromTrail(trailOf(S, IFY.finalAge()));
})();
const sResCat = B? resCatFromTrail(trailOf(B, B.death? B.death.age: B.age)): null;
// 职业形态：只认账本里的主入行旗——与引擎 mainEntryOfState 同一套两层裁（正职层
// 优先、机会层〈写稿/照护/零工/快递〉兜底，同层取最后落账的一面，年龄与账序定先后）。
// 副业成型（side_job/xiahai）不是主线职业；没有主入行旗就记 null，不替他安行当。
const WORK_CAT_PHRASE = { public: "在体制内做事", employee: "在企业里做事", flex: "靠接零活过日子", self: "自己开店做生意", farm: "靠种地过日子"};
const workCatFromLedger = (ledger) => {
try {
const F = IFY.FORM_OF_FLAG;
if (!F) return null;
const OPP = IFY.ENTRY_OPPORTUNITY_FLAGS || [];
const TIE = ["farm", "public", "self", "flex", "employee"];
const beats = (a, b) =>!b || a.age > b.age || (a.age === b.age && a.idx > b.idx)
|| (a.age === b.age && a.idx === b.idx && TIE.indexOf(a.form) < TIE.indexOf(b.form));
let main = null, opp = null;
for (const flag of Object.keys(F)) {
let cand = null;
const led = ledger || [];
for (let i = 0; i < led.length; i++) if (led[i].set === flag) cand = { form: F[flag], age: typeof led[i].age === "number"? led[i].age: 22, idx: i};
if (!cand) continue;
if (OPP.includes(flag)) { if (beats(cand, opp)) opp = cand;}
else if (beats(cand, main)) main = cand;
}
const best = main || opp;
return best && WORK_CAT_PHRASE[best.form]? { cat: best.form, phrase: WORK_CAT_PHRASE[best.form]}: null;
} catch (e) { return null;}
};
const pWorkCat = workCatFromLedger(pLedger);
const sWorkCat = B? workCatFromLedger(B.ledger || []): null;
// 居住方式：买过房只认住房派生（housingOf 的购房形态），主轨另加变现账一条；
// 没买过房必须有单位房或赁屋的记录才成立，两样都没有记 null。影子读他自己的派生。
const houseCatOf = (T, isMain) => {
try {
const h = typeof IFY.housingOf === "function"? IFY.housingOf(T): null;
if (!h) return null;
if (h.owned || (isMain && houseGain > 0)) return { cat: "bought", phrase: "买下自己的房"};
if (h.unit || h.unitLike) return { cat: "notBought", phrase: "住着单位分的房子"};
if (h.rentingEver) return { cat: "notBought", phrase: "一直租着房子住"};
return null;
} catch (e) { return null;}
};
const pHouseCat = houseCatOf(S, true);
const sHouseCat = B? houseCatOf(B, false): null;
const pCats = { res: pResCat, work: pWorkCat, house: pHouseCat};
const sCats = { res: sResCat, work: sWorkCat, house: sHouseCat};
const ABS_DEFS = [["partnered", "成家"], ["kids", "当父母"], ["leftHome", "离乡过日子"], ["retired", "退休"]];
const CAT_DIM_ORDER = ["res", "work", "house"];
const absenceFor = (me, other, myCats, otherCats) => {
if (!other) return null;
const items = ABS_DEFS.filter(([k]) => other[k] === true && me[k] === false).map(([, label]) => label);
if (myCats && otherCats) for (const k of CAT_DIM_ORDER) {
const a = myCats[k], b = otherCats[k];
if (a && b && a.cat !== b.cat) items.push(b.phrase);
}
const out = items.slice(0, 2);
return out.length? out.join("、"): null;
};
const shortLabel = (t) => { const s = String(t).replace(/。$/, ""); const cut = s.split(/[，。：；]/)[0]; return cut.length > 14? cut.slice(0, 14): cut;};
const twinEvents = (hls) => {
const prio = ["kid", "marry", "parent", "retire", "origin"];
const cats = hls.filter((h) => h.cat && prio.includes(h.cat)).sort((a, b) => prio.indexOf(a.cat) - prio.indexOf(b.cat));
const sel = [...cats, ...hls.filter((h) => !cats.includes(h))].slice(0, 3).sort((a, b) => a.age - b.age);
return sel.map((h) => ({ age: h.age, label: CAT_LABEL[h.cat] || shortLabel(h.text)}));
};
const arcNodes = (hls) => hls.filter((h) => ["marry", "kid", "parent", "retire"].includes(h.cat)).map((h) => ({ age: h.age, label: CAT_LABEL[h.cat]}));
const era = (IFY.ERAS || []).find((e) => e.id === S.era);
const refl = IFY.playerMeta && IFY.playerMeta().reflections && IFY.playerMeta().reflections.length
? IFY.playerMeta().reflections[IFY.playerMeta().reflections.length - 1].text: "";
const finalAge = IFY.finalAge();
const twinMainEvents = twinEvents(highlights);
const twinShadowEvents = twinEvents(shadow.highlights);
const mainAbsence = absenceFor(pExp, sExp, pCats, sCats);
const shadowAbsence = absenceFor(sExp, pExp, sCats, pCats);
// 兜底换式：两边都没有缺席句、且两列大事标签逐件相同时，双生页改单栏收尾——
// 只用记录拼：共同的大事标签、同一件事两边各自的年岁、两边终局岁数、两条路线名。
let twinSolo = null;
if (!mainAbsence && !shadowAbsence && shadow.available && shadow.finalAge != null) {
const ml = twinMainEvents.map((e) => e.label), sl = twinShadowEvents.map((e) => e.label);
if (ml.length && ml.length === sl.length && ml.every((l, i) => l === sl[i])) {
let txt = `两条路，竟走得像：大事都是那几件——${ml.join("、")}。`;
const diffs = [];
twinMainEvents.forEach((e, i) => { if (e.age !== twinShadowEvents[i].age) diffs.push(`${e.label}，你 ${e.age} 岁，他 ${twinShadowEvents[i].age} 岁`);});
if (diffs.length) txt += `只是年岁对不上：${diffs.join("；")}。`;
if (finalAge !== shadow.finalAge) txt += `差的只是年岁——你走到 ${finalAge} 岁，他走到 ${shadow.finalAge} 岁。`;
else txt += `连年岁都走到一处，差的只是路——你走的是「${S.route? S.route.name: ""}」，他走的是「${shadow.routeName}」。`;
twinSolo = txt;
}
}
return {
v: 2,
seed: S.seedStr,
eraLabel: era? era.label: "",
routeName: S.route? S.route.name: "",
birthYear: S.birthYear || null,
finalAge,
death: S.death? { age: S.death.age, text: S.death.text}: null,
special: S.special? { tierLabel: IFY.TIER_LABEL[S.special.tier] || "", title: S.special.title, text: S.special.text}: null,
verdictText: IFY.verdict().text,
lifeTags: IFY.lifeTags(),
slots,
slotMap,
houseGain,
houseLine: houseGain > 0? `房子最后折了 ${houseGain}，添进这一生的钱里。`: "",
stats: IFY.STAT_META.map(([k, label]) => ({ key: k, label, value: Math.round(S.stats[k])})),
origin: highlights.find((h) => h.cat === "origin") || null,
highlights,
timeline,
shadow,
arc: shadow.available && shadow.finalAge? {
axisMax: Math.max(90, Math.ceil(Math.max(finalAge, shadow.finalAge) / 10) * 10),
mainNodes: arcNodes(highlights), shadowNodes: arcNodes(shadow.highlights),
}: null,
twin: {
main: { events: twinMainEvents, absence: mainAbsence},
shadow: { events: twinShadowEvents, absence: shadowAbsence},
solo: twinSolo,
},
grabShadowText: grabMark && grabMark.shadow? grabMark.shadow: "",
reflection: refl,
// 施工自检（不出图，只供验收核对）：选项回溯覆盖、影子缺席件、必入位命中
diag: {
playerTrace: pTrace, shadowTrace: sTrace, shadowMissing: shadow.missing.slice(),
shadowAvailable: shadow.available,
mandatory: {
marry: highlights.some((h) => h.cat === "marry"), kid: highlights.some((h) => h.cat === "kid"),
shadowMarry: shadow.highlights.some((h) => h.cat === "marry"), shadowKid: shadow.highlights.some((h) => h.cat === "kid"),
},
},
};
}

// ---------- 种子档案（圆桌决议 S2）：长图与册子共用同一份内容，只许从这里出 ----------
// 像书的版权页：种子、出生年代与出生年、这一局的起止、游戏名与网址。安静朴素，
// 不写「防伪」「唯一码」一类字样——种子经 F2 本就公开分享，它是这一生的出生证兼
// 复活钥匙：照着它能在开始页原样再活这一局。
function seedArchive(d) {
const lines = [];
if (d.eraLabel || d.birthYear) lines.push(`出生：${d.eraLabel || ""}${d.eraLabel && d.birthYear? " · ": ""}${d.birthYear? d.birthYear + " 年": ""}`);
if (d.birthYear) lines.push(`这一生：${d.birthYear} 年 — ${d.birthYear + d.finalAge} 年`);
lines.push(`种子：${d.seed}`);
lines.push("《如果那年》 · if-that-year.pages.dev");
return lines;
}

// ---------- 面板本局事实（圆桌决议 S4）：面板打开先摆这一局的一条真事，再谈价格 ----------
// 固定优先级取一条（写进施工报告）：孩子出生 → 成家领证 → 影子终龄 → 本人终龄 → 路线。
// 只许并列陈述事实：不许两命差值、不许「比你早/晚」这类比较措辞。取数全走
// buildKeepsakeData 的既有账面（大事记必入位与影子终龄），派生不出就往下一档退。
function panelFact(d) {
const kid = d.highlights.find((h) => h.cat === "kid");
if (kid && kid.year) return `这一局，孩子出生在 ${kid.year} 年，那年你 ${kid.age} 岁。`;
const marry = d.highlights.find((h) => h.cat === "marry");
if (marry && marry.year) return `这一局，${marry.year} 年，你和对方把证领了。`;
if (d.shadow && d.shadow.available && d.shadow.finalAge != null) return `这一局，另一条路上的他走到了 ${d.shadow.finalAge} 岁。`;
if (d.finalAge != null) return `这一局，你走到了 ${d.finalAge} 岁。`;
return `这一局，你走的是「${d.routeName}」这条路。`;
}

// ---------- 长图（网格派 L1：版心 936、垂直模数 8、无衬线为骨、衬线只给主标与判词） ----------
const KS_INK = "#20241F", KS_PINE = "#2F4A3C", KS_GREY = "#8A948C", KS_MUT = "#6E6A5E",
KS_LINE = "#DDD6C9", KS_TRACK = "#E7E1D3", KS_PAPER = "#FAF8F4";
// 双轨弧线图的分离曲线：两条线共用同一条偏移函数、只换符号——任一横坐标上两线距主干的
// 垂直距离按构造相等（定稿 §五＋§八.4，验收取三点量）。曲线起点不是标记：图上不打岔点、
// 不立竖线、不标分开的年龄；主干走版心垂直中位。
function arcOff(age) {
if (age <= 22) return 0;
if (age >= 38) return 1;
const t = (age - 22) / 16;
return t * t * (3 - 2 * t);
}
function countLines(x, text, w) {
let n = 1, line = "";
for (const ch of String(text)) { if (x.measureText(line + ch).width > w && line) { n++; line = ch;} else line += ch;}
return n;
}
function ksTracked(x, v) { try { x.letterSpacing = v;} catch (e) {} }

function drawArcCanvas(x, MX, CW, top, d) {
const axisMax = d.arc.axisMax, midY = top + 168, D = 62;
const X = (age) => MX + ((age - 5) / (axisMax - 5)) * CW;
const OFF = (age) => D * arcOff(age);
// 底部尺子：每 20 年一条极淡网格线＋注记（与分开的位置无关）
x.strokeStyle = KS_TRACK; x.lineWidth = 1.5;
x.fillStyle = KS_GREY; x.font = "20px Menlo, Consolas, monospace"; x.textAlign = "center";
for (const g of [20, 40, 60, 80]) {
if (g >= axisMax) continue;
x.beginPath(); x.moveTo(X(g), top + 14); x.lineTo(X(g), top + 296); x.stroke();
x.fillText(String(g), X(g), top + 328);
}
x.textAlign = "left";
// 共同主干（实线）→ 两条线镜像离开：玩家实线在上、影子虚线在下，同色同宽
const path = (end, sign) => {
x.beginPath();
for (let a = 22; a <= end; a += 0.5) {
const px = X(a), py = midY + sign * OFF(a);
if (a === 22) x.moveTo(px, py); else x.lineTo(px, py);
}
x.stroke();
};
x.strokeStyle = KS_PINE; x.lineWidth = 3; x.setLineDash([]);
x.beginPath(); x.moveTo(X(5), midY); x.lineTo(X(22), midY); x.stroke();
path(d.finalAge, -1);
if (d.shadow.finalAge) { x.setLineDash([10, 7]); path(d.shadow.finalAge, 1); x.setLineDash([]);}
// 节点（只落本轨）＋终点
const drawNodes = (nodes, sign, endAge) => {
const lastRight = [-Infinity, -Infinity];
x.font = "21px " + IFY.SANS;
for (const n of [...nodes].sort((a, b) => a.age - b.age)) {
const px = X(n.age), py = midY + sign * OFF(n.age);
x.strokeStyle = KS_PINE; x.fillStyle = KS_PAPER; x.lineWidth = 3;
x.beginPath(); x.arc(px, py, 7, 0, Math.PI * 2); x.fill(); x.stroke();
const label = `${n.age} 岁 · ${n.label}`;
const w = x.measureText(label).width;
let row = 0;
let cx = Math.min(Math.max(px, MX + w / 2), MX + CW - w / 2);
if (cx - w / 2 < lastRight[0] + 10) row = 1;
lastRight[row] = cx + w / 2;
x.fillStyle = KS_GREY; x.textAlign = "center";
x.fillText(label, cx, sign < 0? py - 20 - row * 30: py + 42 + row * 30);
x.textAlign = "left";
}
const ex = X(endAge), ey = midY + sign * OFF(endAge);
x.fillStyle = KS_PINE; x.beginPath(); x.arc(ex, ey, 8, 0, Math.PI * 2); x.fill();
x.font = "700 24px " + IFY.SANS;
const label = `${endAge} 岁`;
const w = x.measureText(label).width;
const cx = Math.min(Math.max(ex, MX + w / 2), MX + CW - w / 2);
x.fillStyle = KS_INK; x.textAlign = "center";
x.fillText(label, cx, sign < 0? ey - 24: ey + 44);
x.textAlign = "left";
};
drawNodes(d.arc.mainNodes, -1, d.finalAge);
if (d.shadow.finalAge) drawNodes(d.arc.shadowNodes, 1, d.shadow.finalAge);
}

// 六维形状图（定稿 §八.7）：六角两层轮廓，主实线/影虚线，只有轮廓不填充，图上零数字
function drawShapeCanvas(x, cx, cy, R, d) {
const pts = (stats, f) => stats.map((st, i) => {
const a = -Math.PI / 2 + i * Math.PI / 3;
const r = R * f * Math.max(0, Math.min(100, st.value)) / 100;
return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
});
const ring = (f) => {
x.beginPath();
for (let i = 0; i < 6; i++) {
const a = -Math.PI / 2 + i * Math.PI / 3;
const px = cx + R * f * Math.cos(a), py = cy + R * f * Math.sin(a);
if (i === 0) x.moveTo(px, py); else x.lineTo(px, py);
}
x.closePath();
};
x.strokeStyle = KS_TRACK; x.lineWidth = 1.5; x.setLineDash([]);
ring(1 / 3); x.stroke(); ring(2 / 3); x.stroke(); ring(1); x.stroke();
x.strokeStyle = KS_PINE; x.lineWidth = 3;
const drawShape = (stats, dashed) => {
const ps = pts(stats, 1);
x.setLineDash(dashed? [10, 7]: []);
x.beginPath();
ps.forEach(([px, py], i) => { if (i === 0) x.moveTo(px, py); else x.lineTo(px, py);});
x.closePath(); x.stroke();
x.setLineDash([]);
};
drawShape(d.stats, false);
drawShape(d.shadow.stats, true);
// 角上只有维度名
x.fillStyle = KS_GREY; x.font = "22px " + IFY.SANS; x.textAlign = "center";
d.stats.forEach((st, i) => {
const a = -Math.PI / 2 + i * Math.PI / 3;
x.fillText(st.label, cx + (R + 38) * Math.cos(a), cy + (R + 38) * Math.sin(a) + 8);
});
x.textAlign = "left";
}

function drawKeepsake(x, d, W) {
const s = W / 1080;
x.save();
x.scale(s, s);
const UW = 1080, MX = 72, CW = UW - MX * 2;
x.fillStyle = KS_PAPER; x.fillRect(0, 0, UW, 24000);
x.textAlign = "left";
let secNo = 0;
const secHead = (y, title, dashed) => {
secNo++;
y += 64;
x.strokeStyle = KS_PINE; x.lineWidth = 3;
x.setLineDash(dashed? [10, 7]: []);
x.beginPath(); x.moveTo(MX, y); x.lineTo(MX + CW, y); x.stroke();
x.setLineDash([]);
x.fillStyle = KS_GREY; x.font = "22px Menlo, Consolas, monospace";
x.fillText(String(secNo).padStart(2, "0"), MX, y + 46);
x.fillStyle = KS_PINE; x.font = "700 30px " + IFY.SANS; ksTracked(x, "3px");
x.fillText(title, MX + 72, y + 46);
ksTracked(x, "0px");
return y + 46;
};
const drawEntry = (top, h, choicePrefix) => {
x.fillStyle = KS_GREY; x.font = "23px Menlo, Consolas, monospace";
x.fillText(h.year? `${h.year} 年 · ${h.age} 岁`: `${h.age} 岁`, MX, top + 24);
x.fillStyle = KS_INK; x.font = "30px " + IFY.SANS;
let lastBase = IFY.wrapText(x, h.text, MX + 248, top + 30, CW - 248, 46) - 46;
// 「你选了」小字：选项原文已在正文里（岔口行本身以「标题：选项」收尾）时不再重复加，免口吃
if (h.choice && !h.text.includes(h.choice)) {
x.fillStyle = KS_MUT; x.font = "22px " + IFY.SANS;
lastBase = IFY.wrapText(x, `${choicePrefix}：${h.choice}`, MX + 248, lastBase + 36, CW - 248, 32) - 32;
}
return lastBase + 12;
};
const drawHighlights = (y0, entries, choicePrefix, firstGap) => {
let y = y0, first = true;
for (let gi = 0; gi < 4; gi++) {
const g = entries.filter((h) => STAGE_OF(h.age) === gi);
if (!g.length) continue;
y += first? firstGap: 52;
x.fillStyle = KS_GREY; x.font = "700 22px " + IFY.SANS; ksTracked(x, "5px");
x.fillText(STAGE_NAMES[gi], MX, y + 22);
ksTracked(x, "0px");
y += 40;
for (const h of g) y = drawEntry(y, h, choicePrefix) + 30;
y -= 30;
first = false;
}
return y;
};
const factRow = (y, lab, text, labW, fontPx, lh) => {
const fb = y + 52;
x.fillStyle = KS_PINE; x.font = "700 24px " + IFY.SANS; ksTracked(x, "3px");
x.fillText(lab, MX, fb);
ksTracked(x, "0px");
x.fillStyle = KS_INK; x.font = `${fontPx}px ` + IFY.SANS;
return IFY.wrapText(x, text, MX + labW, fb, CW - labW, lh) - lh;
};
// ---- 版头三行 ----
x.fillStyle = KS_PINE; x.font = "700 22px " + IFY.SANS; ksTracked(x, "7px");
x.fillText("A TAKAE PRODUCTION", MX, 110);
ksTracked(x, "0px");
x.fillStyle = KS_INK; x.font = "26px " + IFY.SERIF; ksTracked(x, "5px");
x.fillText("人生RESTART", MX, 152);
ksTracked(x, "0px");
x.font = "700 52px " + IFY.SERIF;
x.fillText("《如果那年》 · 一生纪录", MX, 216);
x.fillStyle = KS_GREY; x.font = "24px " + IFY.SANS;
x.fillText(`人生纪录典藏 · ${d.routeName}${d.birthYear? ` · ${d.birthYear} — ${d.birthYear + d.finalAge}`: ""}`, MX, 264);
let y = 264;
// ---- 判词（全图最大字号）＋影子终局句引子＋小印/平年落款 ----
x.fillStyle = KS_INK; x.font = "56px " + IFY.SERIF;
y = IFY.wrapText(x, d.verdictText, MX, y + 48 + 56, CW, 95) - 95;
if (d.shadow.finalText) {
x.fillStyle = KS_GREY; x.font = "24px " + IFY.SANS;
y = IFY.wrapText(x, d.shadow.finalText, MX, y + 44, CW, 36) - 36;
}
if (d.special) {
const top = y + 28;
x.font = "26px " + IFY.SERIF;
const tw = x.measureText(`${d.special.tierLabel} · ${d.special.title}`).width;
x.strokeStyle = KS_LINE; x.lineWidth = 2;
x.strokeRect(MX, top, tw + 56, 68);
x.fillStyle = KS_PINE;
x.fillText(d.special.tierLabel, MX + 28, top + 44);
const w1 = x.measureText(d.special.tierLabel).width;
x.fillStyle = KS_INK;
x.fillText(` · ${d.special.title}`, MX + 28 + w1, top + 44);
y = top + 68;
} else {
// 平年落款（定稿 §八.2）：文案经总指挥定版 2026-11-07——照实说没有特殊结局、正面收在「稳稳当当」，不许读出安慰奖/次一等
const base = y + 28 + 24;
x.fillStyle = KS_PINE; x.font = "700 24px " + IFY.SANS;
x.fillText("平年", MX, base);
const w1 = x.measureText("平年").width;
x.fillStyle = KS_GREY; x.font = "24px " + IFY.SANS;
x.fillText("这一生没有惊动任何结局，稳稳当当过完的。", MX + w1 + 16, base);
y = base;
}
// ---- 标签行＋死亡行 ----
x.fillStyle = KS_GREY; x.font = "26px " + IFY.SANS;
y = IFY.wrapText(x, d.lifeTags, MX, y + 38 + 26, CW, 40) - 40;
if (d.death) {
x.fillStyle = KS_INK; x.font = "29px " + IFY.SANS;
y = IFY.wrapText(x, `${d.death.age} 岁那年，你走了。${d.death.text}`, MX, y + 14 + 29, CW, 46) - 46;
}
// ---- 01 双轨弧线图 ----
if (d.arc) {
y = secHead(y, "两条路", false);
y += 24;
drawArcCanvas(x, MX, CW, y, d);
y += 340;
}
// ---- 02 一生大事记 ----
y = secHead(y, "一生大事记", false);
y = drawHighlights(y, d.highlights, "你选了", 30);
// ---- 03 六维 · 落脚 ----
y = secHead(y, "六维 · 落脚", false);
y += 40;
for (let r = 0; r < 3; r++) {
for (let cix = 0; cix < 2; cix++) {
const st = d.stats[r * 2 + cix];
if (!st) continue;
const cx0 = MX + cix * 500;
x.fillStyle = KS_INK; x.font = "26px " + IFY.SANS;
x.fillText(st.label, cx0, y);
x.fillStyle = KS_TRACK; x.fillRect(cx0 + 76, y - 12, 300, 12);
x.fillStyle = KS_PINE; x.fillRect(cx0 + 76, y - 12, 300 * Math.max(0, Math.min(100, st.value)) / 100, 12);
x.fillStyle = KS_INK; x.font = "700 34px Menlo, Consolas, monospace"; x.textAlign = "right";
x.fillText(String(st.value), cx0 + 436, y);
x.textAlign = "left";
}
y += 48;
}
y -= 48;
const settleRows = [["落脚", d.slotMap["落脚"]], ["钱", d.slotMap["钱"]], ["房子", d.houseLine]].filter(([, t]) => t);
for (const [lab, t] of settleRows) y = factRow(y, lab, t, 120, 28, 46);
// ---- 稀有结局正文（细框整段，主轨半程内） ----
if (d.special) {
const top = y + 64;
x.font = "29px " + IFY.SANS;
const lines = countLines(x, d.special.text, CW - 80);
const boxH = 36 + 22 + 14 + 38 + 16 + lines * 51 + 30;
x.strokeStyle = KS_LINE; x.lineWidth = 2;
x.strokeRect(MX, top, CW, boxH);
x.fillStyle = KS_PINE; x.font = "700 22px " + IFY.SANS; ksTracked(x, "6px");
x.fillText(d.special.tierLabel, MX + 40, top + 58);
ksTracked(x, "0px");
x.fillStyle = KS_INK; x.font = "700 38px " + IFY.SERIF;
x.fillText(d.special.title, MX + 40, top + 58 + 14 + 38);
x.font = "29px " + IFY.SANS;
IFY.wrapText(x, d.special.text, MX + 40, top + 58 + 14 + 38 + 16 + 29, CW - 80, 51);
y = top + boxH;
}
// ---- 04 另一条路（后半主角） ----
if (d.shadow.available || d.shadow.finalText) {
y = secHead(y, "另一条路", true);
x.fillStyle = KS_INK; x.font = "38px " + IFY.SERIF;
y = IFY.wrapText(x, d.shadow.finalText, MX, y + 36 + 38, CW, 65) - 65;
if (d.shadow.available) {
const marryKids = [d.shadow.marryText, d.shadow.kidsText].filter(Boolean).join("");
if (marryKids) y = factRow(y, "婚育", marryKids, 200, 29, 48);
if (d.shadow.deathText) y = factRow(y, "死因", d.shadow.deathText, 200, 29, 48);
if (d.shadow.highlights.length) {
y += 46;
x.fillStyle = KS_GREY; x.font = "700 22px " + IFY.SANS; ksTracked(x, "5px");
x.fillText("大事记", MX, y + 22);
ksTracked(x, "0px");
y += 22;
y = drawHighlights(y, d.shadow.highlights, "他选了", 18);
}
if (d.shadow.landing) y = factRow(y, "落脚", d.shadow.landing, 120, 28, 46);
if (d.shadow.stats) {
const top = y + 52;
drawShapeCanvas(x, MX + CW / 2, top + 178, 138, d);
y = top + 356;
x.fillStyle = KS_GREY; x.font = "22px " + IFY.SANS; ksTracked(x, "4px"); x.textAlign = "center";
x.fillText("两条人生的形状", MX + CW / 2, y + 36);
ksTracked(x, "0px"); x.textAlign = "left";
y += 36;
}
// 双生页：通常两栏等宽，各自三件大事，栏底缺席对照（取不到可核事实就不写）；
// 两边都没有缺席句且两列大事逐件相同时换单栏收尾式（d.twin.solo，数据层已拼好）
y += 50;
x.fillStyle = KS_GREY; x.font = "700 22px " + IFY.SANS; ksTracked(x, "5px");
x.fillText("双生页", MX, y + 22);
ksTracked(x, "0px");
y += 46;
if (d.twin.solo) {
x.fillStyle = KS_INK; x.font = "27px " + IFY.SANS;
y = IFY.wrapText(x, d.twin.solo, MX, y + 27, CW, 44) - 44;
} else {
const colW = (CW - 48) / 2;
const cols = [
{ x0: MX, head: "你走的路", col: d.twin.main, absPrefix: "我没经历过的是："},
{ x0: MX + colW + 48, head: "没选的那条路", col: d.twin.shadow, absPrefix: "他没经历过的是："},
];
x.font = "27px " + IFY.SANS;
const evH = (col) => col.events.reduce((acc, ev) => acc + countLines(x, `${ev.age} 岁 · ${ev.label}`, colW) * 42 + 14, 0);
x.font = "24px " + IFY.SANS;
const absH = (c) => c.col.absence? 18 + countLines(x, `${c.absPrefix}${c.col.absence}。`, colW) * 36: 0;
const colH = Math.max(...cols.map((c) => 44 + evH(c.col) + absH(c)));
x.strokeStyle = KS_LINE; x.lineWidth = 2;
x.beginPath(); x.moveTo(MX + colW + 24, y); x.lineTo(MX + colW + 24, y + colH); x.stroke();
for (const c of cols) {
let cy = y;
x.fillStyle = KS_PINE; x.font = "700 26px " + IFY.SERIF;
x.fillText(c.head, c.x0, cy + 26);
cy += 44;
x.fillStyle = KS_INK; x.font = "27px " + IFY.SANS;
for (const ev of c.col.events) cy = IFY.wrapText(x, `${ev.age} 岁 · ${ev.label}`, c.x0, cy + 27, colW, 42) - 42 + 22;
if (c.col.absence) {
x.fillStyle = KS_GREY; x.font = "24px " + IFY.SANS;
IFY.wrapText(x, `${c.absPrefix}${c.col.absence}。`, c.x0, cy + 18 + 24, colW, 36);
}
}
y += colH;
}
}
}
// ---- 种子档案（S2：末尾一段，版权页气质，安静朴素） ----
y += 64;
x.fillStyle = KS_GREY; x.font = "700 22px " + IFY.SANS; ksTracked(x, "5px");
x.fillText("种子档案", MX, y + 22);
ksTracked(x, "0px");
y += 30;
x.fillStyle = KS_MUT; x.font = "24px " + IFY.SANS;
for (const line of seedArchive(d)) { x.fillText(line, MX, y + 24); y += 38;}
y -= 14;
// ---- 页脚落款 ----
y += 72;
x.strokeStyle = KS_PINE; x.lineWidth = 3;
x.beginPath(); x.moveTo(MX, y); x.lineTo(MX + CW, y); x.stroke();
x.fillStyle = KS_GREY; x.font = "22px Menlo, Consolas, monospace";
x.fillText(`种子 ${d.seed}`, MX, y + 42);
x.font = "22px " + IFY.SANS; x.textAlign = "right";
x.fillText("if-that-year.pages.dev", MX + CW, y + 42);
x.textAlign = "left";
x.fillStyle = KS_PINE; x.font = "28px " + IFY.SERIF; x.textAlign = "center";
x.fillText("同样的运气，你会怎么选？", MX + CW / 2, y + 42 + 50);
x.textAlign = "left";
const H = y + 42 + 50 + 64;
x.restore();
return H;
}

function drawWatermark(x, W, H) {
try {
if (typeof x.setTransform === "function") x.setTransform(1, 0, 0, 1);
x.save();
x.globalAlpha = 0.12;
x.fillStyle = "#2F4A3C";
x.font = "42px " + IFY.SANS;
x.textAlign = "center";
x.translate(W / 2, H / 2);
x.rotate(-Math.PI / 7);
for (let yy = -H; yy < H; yy += 330) for (let xx = -W; xx < W; xx += 540) x.fillText("纪录典藏 · 预览", xx, yy);
x.restore();
} catch (e) { /* 水印画不出也不能连累预览本身（v0.55.0：无头环境 setTransform 抛错的既存问题） */ }
}

// opts: {scale} 出图尺寸系数（1=全尺寸 1080 宽）；{watermark:true} 叠水印（预览专用）
function renderKeepsakeImage(d, opts) {
const scale = opts && opts.scale? opts.scale: 1;
const W = Math.round(1080 * scale);
const scratch = document.createElement("canvas");
scratch.width = W; scratch.height = 10;
const unitH = drawKeepsake(scratch.getContext("2d"), d, W);
const H = Math.ceil(unitH * scale);
const c = document.createElement("canvas");
c.width = W; c.height = H;
drawKeepsake(c.getContext("2d"), d, W);
if (opts && opts.watermark) drawWatermark(c.getContext("2d"), W, H);
return c;
}

// ---------- 纪录册（HTML：和式 L2，同数据＋全量年表，可打印） ----------
function yearAge(e) { return e.year? `${e.year} 年 · ${e.age} 岁`: `${e.age} 岁`;}
const KS_SVG_SANS = "'Hiragino Sans', 'Noto Sans SC', sans-serif";

// 双轨弧线图（册子版 inline SVG，与长图共用同一条偏移函数 arcOff，几何同源）
function arcSvg(d) {
const esc = IFY.esc;
const W = 936, midY = 168, D = 62, axisMax = d.arc.axisMax;
const X = (age) => ((age - 5) / (axisMax - 5)) * W;
const OFF = (age) => D * arcOff(age);
const pts = (end, sign) => {
const arr = [];
for (let a = 22; a <= end; a += 0.5) arr.push(`${X(a).toFixed(1)},${(midY + sign * OFF(a)).toFixed(1)}`);
return arr.join(" ");
};
let g = "";
for (const gv of [20, 40, 60, 80]) {
if (gv >= axisMax) continue;
g += `<line x1="${X(gv).toFixed(1)}" y1="14" x2="${X(gv).toFixed(1)}" y2="296" stroke="#E7E1D3" stroke-width="1.5"/><text x="${X(gv).toFixed(1)}" y="328" font-size="15" fill="#8A948C" text-anchor="middle" font-family="Menlo, Consolas, monospace">${gv}</text>`;
}
const nodes = (list, sign, endAge) => {
let out = "";
const lastRight = [-Infinity, -Infinity];
for (const n of [...list].sort((a, b) => a.age - b.age)) {
const px = X(n.age), py = midY + sign * OFF(n.age);
out += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="7" fill="#FFFDF8" stroke="#2F4A3C" stroke-width="3"/>`;
const label = `${n.age} 岁 · ${n.label}`;
const w = label.length * 16;
let row = 0;
const cx = Math.min(Math.max(px, w / 2), W - w / 2);
if (cx - w / 2 < lastRight[0] + 8) row = 1;
lastRight[row] = cx + w / 2;
out += `<text x="${cx.toFixed(1)}" y="${(sign < 0? py - 16 - row * 24: py + 36 + row * 24).toFixed(1)}" font-size="16" fill="#8A948C" text-anchor="middle" font-family="${KS_SVG_SANS}">${esc(label)}</text>`;
}
const ex = X(endAge), ey = midY + sign * OFF(endAge);
const el2 = `${endAge} 岁`;
const w2 = el2.length * 19;
const cx2 = Math.min(Math.max(ex, w2 / 2), W - w2 / 2);
out += `<circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="8" fill="#2F4A3C"/><text x="${cx2.toFixed(1)}" y="${(sign < 0? ey - 18: ey + 38).toFixed(1)}" font-size="19" font-weight="700" fill="#20241F" text-anchor="middle" font-family="${KS_SVG_SANS}">${esc(el2)}</text>`;
return out;
};
return `<svg class="book-arc-svg" viewBox="0 0 936 340" role="img" aria-label="两条路">${g}`
+ `<line x1="${X(5).toFixed(1)}" y1="${midY}" x2="${X(22).toFixed(1)}" y2="${midY}" stroke="#2F4A3C" stroke-width="3"/>`
+ `<polyline points="${pts(d.finalAge, -1)}" fill="none" stroke="#2F4A3C" stroke-width="3"/>`
+ (d.shadow.finalAge? `<polyline points="${pts(d.shadow.finalAge, 1)}" fill="none" stroke="#2F4A3C" stroke-width="3" stroke-dasharray="10 7"/>`: "")
+ nodes(d.arc.mainNodes, -1, d.finalAge)
+ (d.shadow.finalAge? nodes(d.arc.shadowNodes, 1, d.shadow.finalAge): "")
+ "</svg>";
}

// 六维形状图（册子版 inline SVG，零数字、无填充，与长图同源）
function shapeSvg(d) {
const esc = IFY.esc;
const cx = 240, cy = 196, R = 138;
const ringPts = (f) => [0, 1, 2, 3, 4, 5].map((i) => {
const a = -Math.PI / 2 + i * Math.PI / 3;
return `${(cx + R * f * Math.cos(a)).toFixed(1)},${(cy + R * f * Math.sin(a)).toFixed(1)}`;
}).join(" ");
const pts = (stats) => stats.map((st, i) => {
const a = -Math.PI / 2 + i * Math.PI / 3;
const r = R * Math.max(0, Math.min(100, st.value)) / 100;
return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
}).join(" ");
let out = `<svg class="book-shape-svg" viewBox="0 0 480 392" role="img" aria-label="两条人生的形状">`;
for (const f of [1 / 3, 2 / 3, 1]) out += `<polygon points="${ringPts(f)}" fill="none" stroke="#E7E1D3" stroke-width="1.5"/>`;
out += `<polygon points="${pts(d.stats)}" fill="none" stroke="#2F4A3C" stroke-width="3"/>`;
out += `<polygon points="${pts(d.shadow.stats)}" fill="none" stroke="#2F4A3C" stroke-width="3" stroke-dasharray="10 7"/>`;
d.stats.forEach((st, i) => {
const a = -Math.PI / 2 + i * Math.PI / 3;
out += `<text x="${(cx + (R + 34) * Math.cos(a)).toFixed(1)}" y="${(cy + (R + 34) * Math.sin(a) + 6).toFixed(1)}" font-size="17" fill="#8A948C" text-anchor="middle" font-family="${KS_SVG_SANS}">${esc(st.label)}</text>`;
});
return out + "</svg>";
}

function buildKeepsakeBook(d) {
const esc = IFY.esc;
const hlGroup = (entries, prefix) => {
let out = "";
for (let gi = 0; gi < 4; gi++) {
const g = entries.filter((h) => STAGE_OF(h.age) === gi);
if (!g.length) continue;
out += `<div class="book-group"><p class="book-gname">${STAGE_NAMES[gi]}</p>` + g.map((h) => `<div class="book-ev"><p class="book-ya">${esc(yearAge(h))}</p><p class="book-et">${esc(h.text)}</p>${h.choice && !h.text.includes(h.choice)? `<p class="book-choice">${prefix}：${esc(h.choice)}</p>`: ""}</div>`).join("") + "</div>";
}
return out;
};
const factHtml = (lab, text) => text? `<div class="book-fact"><span class="book-flab">${esc(lab)}</span><p>${esc(text)}</p></div>`: "";
const settleRows = [["落脚", d.slotMap["落脚"]], ["钱", d.slotMap["钱"]], ["房子", d.houseLine]].map(([k, t]) => factHtml(k, t)).join("");
const statsHtml = `<div class="book-stats">${d.stats.map((st) => `<div class="book-stat"><span>${esc(st.label)}</span><div class="book-bar"><i style="width:${Math.max(0, Math.min(100, st.value))}%"></i></div><b>${st.value}</b></div>`).join("")}</div>`;
const slotRows = d.slots.filter(([k]) => k !== "另一条路").map(([k, t]) => `<p class="slotline"><span class="slotk">${esc(k)}</span>${esc(t)}</p>`).join("");
const tl = d.timeline.map((e) => `<p class="book-tl"><span class="book-ya2">${esc(yearAge(e))}</span>${esc(e.text)}</p>`).join("");
// 页脚（种子＋页码）走 @page 页边盒：种子在生成时写死进规则，页码用 counter(page)
const seedCss = String(d.seed).replace(/[^A-Za-z0-9\-_ ]/g, "");
const pageStyle = `<style>@page{size:A4;margin:18mm 16mm 20mm 16mm;@bottom-left{content:"人生纪录典藏 · 种子 ${seedCss}";font-size:8pt;color:#8A8B85;}@bottom-right{content:counter(page);font-size:8pt;color:#8A8B85;}}</style>`;
// ---- 封面页（定稿 §二＋§八.1：版头→判词→稀有盒/平年落款→标签/死亡行，收完断页） ----
const cover = `<section class="book-cover">
<div class="cov-mast">
<p class="cov-prod">A TAKAE PRODUCTION</p>
<p class="cov-brand">人生RESTART</p>
<h1 class="cov-title">《如果那年》 · 一生纪录</h1>
<p class="cov-rule"></p>
<p class="cov-meta">人生纪录典藏 · ${esc(d.routeName)}${d.birthYear? ` · ${d.birthYear} — ${d.birthYear + d.finalAge}`: ""}</p>
</div>
<p class="cov-verdict">${esc(d.verdictText)}</p>
${d.special? `<div class="cov-rare"><p class="cov-rtag">${esc(d.special.tierLabel)}</p><p class="cov-rtitle">${esc(d.special.title)}</p><p class="cov-rtext">${esc(d.special.text)}</p></div>`
: `<p class="cov-plain"><span>平年</span>这一生没有惊动任何结局，稳稳当当过完的。</p>`}
<p class="cov-tags">${esc(d.lifeTags)}</p>
${d.death? `<p class="cov-death">${d.death.age} 岁那年，你走了。${esc(d.death.text)}</p>`: ""}
</section>`;
// ---- 另一条路 ----
const sh = d.shadow;
const marryKids = [sh.marryText, sh.kidsText].filter(Boolean).join("");
const twinCol = (col) => col.events.map((ev) => `<p class="book-twin-ev">${ev.age} 岁 · ${esc(ev.label)}</p>`).join("");
const shadowSec = (sh.available || sh.finalText)? `<section class="book-sec">
<h3 class="book-h">另一条路</h3>
${d.arc? `<div class="book-arc">${arcSvg(d)}</div>`: ""}
${sh.available? `
${d.grabShadowText? `<p class="book-common">${esc(d.grabShadowText)}</p>`: ""}
<p class="book-lead">${esc(sh.finalText)}</p>
${factHtml("婚育", marryKids)}
${factHtml("死因", sh.deathText)}
${sh.highlights.length? `<p class="book-sub">大事记</p>${hlGroup(sh.highlights, "他选了")}`: ""}
${factHtml("落脚", sh.landing)}
<div class="book-endblock">
${sh.stats? `<div class="book-shape">${shapeSvg(d)}<p class="book-shapecap">两条人生的形状</p></div>`: ""}
${d.twin.solo? `<p class="book-common">${esc(d.twin.solo)}</p>`: `<div class="book-twin">
<div class="book-twin-col"><p class="book-twin-head">你走的路</p>${twinCol(d.twin.main)}${d.twin.main.absence? `<p class="book-abs">我没经历过的是：${esc(d.twin.main.absence)}。</p>`: ""}</div>
<div class="book-twin-col"><p class="book-twin-head">没选的那条路</p>${twinCol(d.twin.shadow)}${d.twin.shadow.absence? `<p class="book-abs">他没经历过的是：${esc(d.twin.shadow.absence)}。</p>`: ""}</div>
</div>`}
</div>`: `<p class="book-lead">${esc(sh.finalText)}</p>`}
</section>`: "";
// ---- 种子档案页（S2：末页，与长图同一份 seedArchive 内容）＋末页落款＋手记页 ----
const seedPage = `<section class="book-seedpage"><div class="book-seedbox">
<h3 class="book-h">种子档案</h3>
${seedArchive(d).map((l) => `<p>${esc(l)}</p>`).join("")}
</div></section>`;
const colo = `<section class="book-colophon"><div class="book-colobox">
<h3 class="book-h">未走之路</h3>
${!sh.available && sh.compareMain? `<p>${esc(sh.compareMain)}</p>`: ""}
${sh.compareOthers.map((o) => `<p>${esc(o)}</p>`).join("")}
<p class="book-seed">种子 ${esc(d.seed)}</p>
<p class="book-url">if-that-year.pages.dev</p>
<p class="book-closing">同样的运气，你会怎么选？</p>
</div></section>
${seedPage}
<section class="book-note"><div class="book-notebox">
<h3 class="book-h">手记</h3>
<p class="book-dateline">日期：＿＿＿＿＿＿＿＿</p>
</div></section>`;
return pageStyle + `<div class="book-page">
${cover}
<section class="book-sec"><h3 class="book-h">一生大事记</h3>${hlGroup(d.highlights, "你选了")}</section>
<section class="book-sec"><h3 class="book-h">年表</h3><div class="book-tls">${tl}</div></section>
<section class="book-sec"><h3 class="book-h">六维 · 落脚</h3>${statsHtml}${settleRows}</section>
<section class="book-sec"><h3 class="book-h">这一生</h3>${slotRows}</section>
${shadowSec}
${colo}
</div>`;
}

function closeBook() {
const b = IFY.el("ify-book");
if (b) b.remove();
try {
document.body.classList.remove("has-book");
document.body.classList.remove("has-book-preview");
} catch (e) {}
}

function openBook(preview) {
closeBook();
const d = buildKeepsakeData();
const el = document.createElement("div");
el.className = "ify-book" + (preview? " preview": "");
el.setAttribute("id", "ify-book");
const wm = preview? `<div class="book-wm" aria-hidden="true">${"<span>纪录典藏 · 预览</span>".repeat(6)}</div>`: "";
el.innerHTML = `<div class="book-tools">
${preview? `<span class="hint">这是预览：订购后能打印、存成 PDF，这一版打不出来。</span>`: `<button type="button" class="ghost" id="book-print">打印 / 存成 PDF</button>`}
<button type="button" class="ghost" id="book-close">关上</button>
</div>` + buildKeepsakeBook(d) + wm;
IFY.app().appendChild(el);
try { document.body.classList.add(preview? "has-book-preview": "has-book");} catch (e) {}
const close = IFY.el("book-close");
if (close) close.addEventListener("click", closeBook);
const print = IFY.el("book-print");
if (print) print.addEventListener("click", () => { if (typeof window.print === "function") window.print();});
if (typeof el.scrollTo === "function") el.scrollTo(0, 0);
}

// ---------- 输码核验 ----------
const REASON_TEXT = {
not_found: "这个码没查到。看看是不是抄错了，码里没有 0、O、1 这几个字符。",
rate_limited: "刚才试得太多次了。过几分钟再输，这个码不会因此作废。",
unconfigured: "核验服务还没配好。先把码收好，等通道开通了再输，一样有效。",
};
async function verifyCode(code) {
const done = (r) => { anaTrack("code_verify", { ok:!!r.ok }); return r;}; // 统计升级批：核验返回后只报成败布尔
let res;
try {
res = await fetch(CFG.verifyPath || "/api/verify-code", {
method: "POST",
headers: { "content-type": "application/json"},
body: JSON.stringify({ code}),
});
} catch (e) {
return done({ ok: false, reason: "network"});
}
let data = null;
try { data = await res.json();} catch (e) {}
if (data && data.ok) return done({ ok: true, state: data.state || ""});
if (res.status === 429) return done({ ok: false, reason: "rate_limited"});
if (res.status === 503) return done({ ok: false, reason: "unconfigured"});
return done({ ok: false, reason: (data && data.reason) || "not_found"});
}
function reasonText(reason) {
if (reason === "network") return "现在连不上核验服务。检查一下网络再试，码不会因为这次失败作废。";
return REASON_TEXT[reason] || REASON_TEXT.not_found;
}

// ---------- 结算页导出台 ----------
function downloadImage(canvas) {
IFY.saveCanvasImage(canvas, "if-that-year-keepsake-" + IFY.S.seedStr + ".png");
}

// ---------- 赠予（圆桌决议 S3）：用自己的已激活码领一枚赠予码 ----------
// 显示形与 _codelib 的 displayCode 同制（4-4-4 连字符），前端不 import 服务端模块，这里同制拼。
function giftDisplay(c12) {
const c = String(c12 || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
return c.length === 12? `${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8)}`: c;
}
const GIFT_REASON_TEXT = {
not_eligible: "这枚码领不了赠予码。只有已经解锁过的码能领，你先用自己的码在这台设备上解锁一次。",
unconfigured: "赠予通道还没配好。等开通了再来领，你的码不会作废。",
unavailable: "现在领不出来。过些时候再试。",
network: "现在连不上。检查一下网络再试。",
};
async function requestGift(code) {
const done = (r) => { anaTrack("gift_claim", { ok:!!r.ok }); return r;}; // 统计升级批：领取返回后只报成败布尔（领到的码值不进事件）
let res;
try {
res = await fetch(CFG.giftPath || "/api/gift", {
method: "POST",
headers: { "content-type": "application/json"},
body: JSON.stringify({ code}),
});
} catch (e) {
return done({ ok: false, reason: "network"});
}
let data = null;
try { data = await res.json();} catch (e) {}
if (data && data.ok && data.code) return done({ ok: true, code: data.code, again:!!data.again});
if (res.status === 503 && data && data.reason === "unconfigured") return done({ ok: false, reason: "unconfigured"});
return done({ ok: false, reason: (data && data.reason) || "unavailable"});
}
function giftShareText(shown) {
return `我在《如果那年》里过完了一生，把典藏送你一份。打开 if-that-year.pages.dev 玩一局，到结算页展开「把这一生订成册子带走」，输这个码：${shown}，就能把你那一局的长图和纪录册导出来。`;
}
function wireGift() {
const btn = IFY.el("ks-gift");
const box = IFY.el("ks-giftbox");
if (!btn || !box) return;
btn.addEventListener("click", async () => {
const st = keepsakeState();
const esc = IFY.esc;
if (!st.code) {
box.innerHTML = `<p class="hint">这台设备上没存着你的码。先在这一页用你的码解锁一次，再来领赠予码。</p>`;
return;
}
btn.disabled = true;
box.innerHTML = `<p class="hint">正在领……</p>`;
const r = await requestGift(st.code);
btn.disabled = false;
if (!r.ok) {
box.innerHTML = `<p class="hint">${esc(GIFT_REASON_TEXT[r.reason] || GIFT_REASON_TEXT.unavailable)}</p>`;
return;
}
const shown = giftDisplay(r.code);
const share = giftShareText(shown);
box.innerHTML = `<p class="hint">${r.again? "你领过的赠予码就是这一枚，一枚码只能领一份。": "领好了。把下面这段话发给那个人就行。"}你的码还能照常用。</p>
<p class="ks-giftcode">${esc(shown)}</p>
<textarea class="ks-gifttext" id="ks-gifttext" rows="4" readonly>${esc(share)}</textarea>
<div class="row"><button type="button" class="ghost" id="ks-giftcopy">复制这段话</button></div>
<p class="hint" id="ks-gifthint"></p>`;
const cp = IFY.el("ks-giftcopy");
if (cp) cp.addEventListener("click", async () => {
const ta = IFY.el("ks-gifttext");
const hint = IFY.el("ks-gifthint");
let done = false;
try { await navigator.clipboard.writeText(share); done = true;} catch (e) {}
if (!done && ta) { ta.focus(); ta.select(); try { done = document.execCommand("copy");} catch (e) {}}
if (hint) hint.textContent = done? "复制好了，粘贴发给他就行。": "没复制成。长按上面那段话，全选复制也行。";
});
});
}

function renderPanel() {
const panel = IFY.el("keepsake-panel");
if (!panel) return;
const esc = IFY.esc;
// S4：面板一打开先摆本局的一条事实（两种状态都先见这一句），再谈导出与价格
const d = buildKeepsakeData();
const factHtml = `<p class="ks-fact">${esc(panelFact(d))}</p>`;
if (keepsakeUnlocked()) {
panel.innerHTML = `<div class="ks-block">
${factHtml}
<p class="ks-intro">这台设备已经解锁了。这一局能导出，以后每一局走完都能导出。</p>
<div class="row">
<button type="button" class="primary" id="ks-dl">下载长图（无水印）</button>
<button type="button" class="ghost" id="ks-book">打开纪录册（可打印）</button>
</div>
<div class="cardpreview" id="ks-prevbox"></div>
<p class="picklab">送一份给朋友</p>
<p class="hint">用你自己的码，能领出一枚新的码，送给一个人。他玩完一局，在结算页输这枚码，就能导出他那一局的典藏。一枚码只能领一份。</p>
<div class="row">
<button type="button" class="ghost" id="ks-gift">领一枚赠予码</button>
</div>
<div id="ks-giftbox"></div>
</div>`;
const img = renderKeepsakeImage(d, { scale: 1});
img.className = "card-img";
const box = IFY.el("ks-prevbox");
box.innerHTML = ""; box.appendChild(img);
IFY.el("ks-dl").addEventListener("click", () => { downloadImage(img); anaTrack("keepsake_export", { kind: "image" }); });
IFY.el("ks-book").addEventListener("click", () => { openBook(false); anaTrack("keepsake_export", { kind: "booklet" }); });
wireGift();
return;
}
let pending = "";
try { pending = sessionStorage.getItem(PENDING_KEY) || "";} catch (e) {}
panel.innerHTML = `<div class="ks-block">
${factHtml}
<p class="ks-intro">游戏本身免费。走到这里，如果这一局让你想支持作者继续做下去，可以付一次；作为纪念，这台设备以后每一局都能把这一生导出成长图和纪录册。长图能存下来发给家里人看，册子打印出来能送人。</p>
<div class="row">
<button type="button" class="ghost" id="ks-preview">先看长图预览（带水印）</button>
</div>
<div class="cardpreview" id="ks-prevbox"></div>
${buyPending()? `<div class="row">
<a class="ghost ks-resume" href="${esc(CFG.buyPage || "buy.html")}" target="_blank" rel="noopener">刚才那笔没付完，点这里接着付</a>
</div>`: ""}
<div class="row">
<a class="ghost ks-buy" href="${esc(CFG.buyPage || "buy.html")}" target="_blank" rel="noopener">支持作者 · ¥${CFG.priceJPY} / ¥${CFG.priceCNY}</a>
</div>
<p class="picklab">已经有兑换码了？</p>
<div class="seedrow">
<input id="ks-code" type="text" placeholder="输入兑换码" autocomplete="off" value="${esc(pending)}">
<button type="button" class="primary" id="ks-unlock">用码解锁</button>
</div>
<p class="hint" id="ks-hint">${pending? "你从领码页带回的码已经填好了，点「用码解锁」就行。": ""}</p>
<p class="hint">付完款会跳到领码页，码很大，抄下来也行。码丢了，凭付款订单能补发；换了设备，拿码再输一次就行。</p>
<p class="hint">订完回游戏，展开这一行输码就能导出。这一页关了也没事：下次打开游戏，首页「最近活过的人生」里点这一局，能接着弄。</p>
</div>`;
const buyA = panel.querySelector(".ks-buy");
if (buyA) buyA.addEventListener("click", () => { markBuyPending(); anaTrack("buy_click", {});});
const resumeA = panel.querySelector(".ks-resume");
if (resumeA) resumeA.addEventListener("click", () => anaTrack("buy_click", {}));
IFY.el("ks-preview").addEventListener("click", () => {
const box = IFY.el("ks-prevbox");
box.innerHTML = "";
const img = renderKeepsakeImage(buildKeepsakeData(), { scale: 0.55, watermark: true});
img.className = "card-img";
box.appendChild(img);
const note = document.createElement("p");
note.className = "hint";
note.textContent = "这是带水印的预览。支持作者后，拿到的是无水印的全尺寸长图，外加能打印的纪录册。";
box.appendChild(note);
anaTrack("keepsake_preview", {}); // 统计升级批：水印预览生成完成
});
IFY.el("ks-unlock").addEventListener("click", async () => {
const inp = IFY.el("ks-code");
const hint = IFY.el("ks-hint");
const code = (inp.value || "").trim();
if (!code) { hint.textContent = "先把码输进来。"; return;}
hint.textContent = "正在核验……";
const r = await verifyCode(code);
if (r.ok) {
saveUnlock(code);
try { sessionStorage.removeItem(PENDING_KEY);} catch (e) {}
refreshDesk();
const h2 = IFY.el("ks-hint");
if (h2) h2.textContent = "";
} else {
hint.textContent = reasonText(r.reason);
}
});
}

function refreshDesk() {
const line = IFY.el("keepsake-open");
if (!line) return;
line.textContent = keepsakeUnlocked()
? "这一生的纪念品 · 已解锁，导出"
: `支持作者 · 把这一生留成纪念 · ¥${CFG.priceJPY} / ¥${CFG.priceCNY}`;
// 订购回头路（父亲事故热修）：有未完标记且未解锁时，典藏台上方常驻「继续订购」直达订购页，
// 不用先展开面板才找得到；解锁或标记清除后自动收起（storage/visibilitychange 也走本函数）。
const rz = IFY.el("ks-resumebox");
if (rz) {
const showResume = !keepsakeUnlocked() && buyPending();
rz.hidden = !showResume;
if (showResume) rz.innerHTML = `<a class="ghost ks-buy" href="${IFY.esc(CFG.buyPage || "buy.html")}" target="_blank" rel="noopener">刚才那笔没付完，点这里接着付</a>`;
else rz.innerHTML = "";
}
const panel = IFY.el("keepsake-panel");
if (panel &&!panel.hidden) renderPanel();
}

function mountKeepsakeDesk() {
const desk = IFY.app().querySelector(".sharedesk");
if (!desk || IFY.el("keepsake-line")) return;
desk.insertAdjacentHTML("afterend", `<p class="keepsake-line" id="keepsake-line"><button type="button" class="textlink" id="keepsake-open"></button></p><p id="ks-resumebox" style="margin:6px 0 0" hidden></p><p class="hint" style="margin:2px 0 0">长图能存下来发给家里人看，册子能打印出来送人。</p><div class="keepsake-panel" id="keepsake-panel" hidden></div>`);
const btn = IFY.el("keepsake-open");
if (!btn) return;
btn.addEventListener("click", () => {
const p = IFY.el("keepsake-panel");
if (!p) return;
if (p.hidden) { anaTrack("keepsake_open", { state: keepsakeUnlocked()? "unlocked": "locked" }); renderPanel(); p.hidden = false;} else p.hidden = true;
});
refreshDesk();
}

// ---------- 领码页带回码：自动解锁（失败不打扰，码留作预填） ----------
try {
const kc = new URLSearchParams(location.search).get("kc");
if (kc &&!keepsakeUnlocked()) {
try { sessionStorage.setItem(PENDING_KEY, kc);} catch (e) {}
verifyCode(kc).then((r) => {
if (r.ok) {
saveUnlock(kc);
try { sessionStorage.removeItem(PENDING_KEY);} catch (e) {}
refreshDesk();
}
}).catch(() => {});
}
} catch (e) {}

// 在别的标签页完成订购/解锁时，本页展开着的导出台跟着刷新（结算页不用重开）
try {
window.addEventListener("storage", (e) => { if (e && e.key === LS_KEY) refreshDesk();});
document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshDesk();});
} catch (e) {}

Object.assign(IFY, { buildKeepsakeData, renderKeepsakeImage, buildKeepsakeBook, mountKeepsakeDesk, keepsakeUnlocked, verifyCode, seedArchive, panelFact});
})(window.IFY);
