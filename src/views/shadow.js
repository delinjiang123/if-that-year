// [模块]《如果那年》引擎分片：呈现层——影子瞥视。独立模块（包装器 + window.IFY 共享命名空间），加载顺序见 index.html。
// v0.21 WP4（蓝图第六节）：有 Track_B 的新局，瞥视取材层改读不受控 Track 的真账本/真流水 + 现状事实表；
// 无 Track_B 的 legacy 局整屏走下方模板逻辑（renderGlimpseLegacy，一行未动）。呈现骨架两路共用同一套：
// 先标题、看/不看、计数真实（meta）、反思认领、首瞥机制说明、童年记号共同事实句。
(function (IFY) {
"use strict";
// ---------- 影子瞥视：先给标题，点开才看全文；不看的计数从此是真的 ----------
function shadowRoute() { const first = IFY.S.unchosen.find((u) => u.kind === "route"); return IFY.D.shadows[first.id];}

// 阶段标注（v0.20.1 W5）：下列细节按内容认定为「退休/晚年」阶段文本——瞥视发生在 30/40/50 岁，
// 目标人生还没走到退休，带退休/晚年语境的细节不出；结算揭晓走 shadowFinalText，不经本函数，照常出现。
// 认定清单逐条见 ~/workspace/sim-v0201/logs/w5-presuppose.md 第六部分。
const SHADOW_LATE_DETAILS = new Set([
"退休前把工位上的书分给了年轻人，自己只带走一个旧水杯。",
"社保和公积金都办完了，第一次在工作日上午去公园坐了很久。",
"退休后在院里支了张小桌，老同事隔三差五来下棋喝茶。",
"退休后把公寓卖了小一号，离华人超市近，买豆腐方便些。",
"退休那学期把教案留给了年轻教师，书架空出一大半。",
"退休后又背起包走了趟短途，回来把票根压在书桌玻璃下。",
"在异乡住了大半辈子，老了常去的那家诊所医生都换了两任。",
"办公室窗外有棵银杏，秋天给学生讲最后一课。",
]);

function shadowStageText(stage) {
const sh = shadowRoute();
const rawStages = sh.stages[stage];
// 年代变体（stagesEra，形状 { 原文行: { 年代id: 文本 } }，字段契约登记在 registry.js）：取到原数组后、既有过滤之前先逐行映射——
// 本局年代有变体的行替换为变体，无变体或路线未声明 stagesEra 时原样（恒等映射）；池大小不变，不多耗一抽随机。
const eraMap = sh.stagesEra;
const all = eraMap ? rawStages.map((t) => { const m = eraMap[t]; const v = m && IFY.S ? m[IFY.S.era] : null; return v != null ? v : t; }) : rawStages;
// 年代过滤（v0.20.1 W4）：瞥视目标年份=影子人生所处的日历年（出生年+当前年龄，与 scheduler 公历门口径一致）。
// 目标年份 <2000 时剔除带具体金额的细节（如「转了两千」「存下五百块」——1980 年代月工资不足百元，这类数额不成立）；
// 剔完为空则回退全池，保证瞥视永远有细节可看。
const shadowYear = (IFY.S.birthYear || 1978) + IFY.S.age;
const variants = shadowYear < 2000? (all.filter((t) =>!/两千|五百块/.test(t)).length? all.filter((t) =>!/两千|五百块/.test(t)): all): all;
// 阶段过滤（v0.20.1 W5）：剔除已标注的退休/晚年细节；剔完为空则回退上一级池。
const stageOk = variants.filter((t) =>!SHADOW_LATE_DETAILS.has(t));
const pool = stageOk.length? stageOk: variants;
return pool[Math.floor(IFY.rng() * pool.length)];
}

// 影子代价三选一（v0.10.0）：按种子+路线名哈希定值，同一局内结算页与分享卡取同一行；存量字符串原样返回。
function shadowCostText(sh) {
if (!sh) return "";
const c = sh.cost;
if (!Array.isArray(c)) return c || "";
if (c.length === 1) return c[0];
let h = 2166136261;
const s = String((IFY.S && IFY.S.seed) || "") + ":" + sh.name;
for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619);}
return c[Math.abs(h) % c.length];
}

function shadowFinalText(sh) {
const finals = sh && sh.stages && sh.stages[2];
if (!Array.isArray(finals) ||!finals.length) return "";
return finals.find((t) =>!(IFY.S.shadowSeenTexts || []).includes(t)) || finals[0] || "";
}

// 结算页与发帖文案共用同一组对照行：主影子拼入结局与代价，其余未选路线按 routes 原序各出一行。
function shadowCompareLines() {
if (!IFY.S ||!Array.isArray(IFY.S.unchosen)) return { main: "", others: []};
const routeEntries = IFY.S.unchosen.filter((u) => u && u.kind === "route");
if (!routeEntries.length) return { main: "", others: []};
const mainEntry = routeEntries[0];
const mainShadow = IFY.D.shadows && IFY.D.shadows[mainEntry.id];
const mainFinal = shadowFinalText(mainShadow);
const main = mainShadow && mainShadow.name && mainFinal && mainShadow.cost
? `另一条路（${mainShadow.name}）也走完了它的一生。${mainFinal}${shadowCostText(mainShadow)}`: "";
const routeOrder = new Map(IFY.D.routes.map((r, i) => [r.id, i]));
const others = routeEntries.slice(1)
.sort((a, b) => (routeOrder.has(a.id)? routeOrder.get(a.id): Number.MAX_SAFE_INTEGER)
- (routeOrder.has(b.id)? routeOrder.get(b.id): Number.MAX_SAFE_INTEGER))
.map((entry) => {
const sh = IFY.D.shadows && IFY.D.shadows[entry.id];
const final = shadowFinalText(sh);
return sh && sh.name && final? `${sh.name}：${final}`: "";
}).filter(Boolean);
return { main, others};
}

// =====================================================================
// v0.21 WP4 · 瞥视真账取材层（蓝图 6.1–6.3）
// 取材对象恒为「当前不受控的那条 Track」（一期 = Track_B）；本层只读它与（对照点所需的）
// 受控 Track 账本，不写回任何 Track、不消费任何随机流——唯一的 1 抽在 renderGlimpse 入口
// 单独消费（裁定二 1 抽不变式，见 renderGlimpseReal 头注）。
// =====================================================================

const GLIMPSE_AGES_ALL = [30, 40, 50]; // 与 engine.js GLIMPSE_AGES 键集同口径：stage 0/1/2 → 30/40/50

// 瞥视站表与文案（与 engine.js 的呈现判定同源）：本局真会出现的站 = glimpseStationsOf——
// 分家晚于 22 时，早站被漂移跳过、根本不呈现，文案只许诺站表里真有的站，不许再写死 30/40/50。
function glimpseStationAges() {
if (typeof IFY.glimpseStationsOf === "function") return IFY.glimpseStationsOf(IFY.S);
const fg = typeof IFY.firstGlimpseAge === "function"? IFY.firstGlimpseAge(IFY.S): 30;
return fg == null? []: GLIMPSE_AGES_ALL.filter((a) => a >= fg);
}
// 第一次瞥视的开场白：站数照站表说——三站全在时与旧文案逐字一致；缺站时只说真有的站；
// 只剩一站时「各来一次」不成立，换成「就这一次」。
function glimpseIntroHtml() {
const ages = glimpseStationAges();
const cn = { 30: "三十岁", 40: "四十岁", 50: "五十岁"};
const head = "这就是你当年没选的那条路。它过得怎么样，你只能远远看一眼";
if (!ages.length) return `<p class="body">${head}。</p>`;
const list = ages.map((a) => cn[a]).join("、");
return `<p class="body">${head}——${ages.length === 1? `${list}那年，就这一次`: `${list}，各来一次`}。</p>`;
}
// 换路提示：当前站是不是站表的最后一站，照站表认——末站不许再许诺「下次瞥视还能再想」。
function glimpseSwapHintHtml() {
const ages = glimpseStationAges();
const last = ages.length > 0 && (IFY.S? IFY.S.age: 0) >= ages[ages.length - 1];
return last
? "换过去，一生只能换这一次。这是最后一回瞥视——这次不换，往后就再没有能换的时候了。"
: "换过去，一生只能换这一次。这次不换，下次瞥视还能再想；换了，就再没有第二次。";
}

// ---- 现状事实表的来源登记（蓝图 6.2：清单即事实的边界——无登记来源就不出该行，宁缺不编） ----
// 住房行（v0.24.4 AN-2 改）：住房事实改读派生层 place.js housingOf（购房旗全集在那边写死一处，
// 含 boughtReform 半截链口径），本文件不再自备旗子集。旧版的「房贷还着」靠两组手维 id 清单
// （买房来源 id + 事后还贷条目 id）拼凑，其中混着本身无门的条目，是循环论证——且全游戏没有
// 「房贷还清/还在还」的事实源（结清证明只是文本），故此半句整句退役：住房行只断言到「有自己的
// 房子」为止，还没还清交给还贷链自己的文本去说。独立的非房贷债务同样无可靠现状来源，永不单独出此行。
// 警报来源 = 健康危机落账（账本 kind=crisis、id=health，即 crisisUsed.health 的账本形）
// + 健康线死亡落账本身（账本 kind=death、id=health，即引擎死因分类 type=health、rollDeath 的
// rec("death", type) 形）：影子走健康线离世时死亡条目本身即警报来源，悼念/回望的 health 行读
// 「身体出过警报」、不得再出否定形（与同屏死讯矛盾）；意外线死亡（id=accident）不入此来源。
// + 下列「本人」体检异常/查出问题/手术住院类条目 id（盘点全池后登记；父母/伴侣/孩子的体检与
// 生育复查条目一概不入——那不是本人的身体警报）：
// e_body（体检两个箭头朝上）、r_health_operation（体检圈出指标·手术）、p12_002（指标不对·住院检查）、
// p10_009（体检写明脂肪肝倾向）、p16_043（指标箭头）、e78_045（指标小箭头）、p15_013（血糖临界值）、
// p15_054（查出要长期吃药的毛病）、p21_013（报告三条标红提醒）、p21_032（指标圈出·建议复查）、
// p22_017（指标带箭头）、e65_050（箭头·血压血脂要控制）、e55_047（查出小毛病·按时吃药）、
// p24_007（要复查的箭头）、p23_023（箭头又多两个）、p26_015（三项箭头朝上）、
// p14_043（查出白内障·手术）、p20_061（眼睛查出要做小手术）、p4_045（颈椎查出问题）、
// p33_016（指标压线·复查）、p6_039（箭头比去年少——反推此前有箭头）。
// WP4 修复轮全池重盘补 63 条（逐条结论见 sim-v021/logs/wp4fix.md；口径同上：只认主文本断言，
// 不认选项回响）：体检/检查异常——p4_031 脂肪肝、p4_032 血压量出高、p4_053 复查单箭头史、
// p14_041 血脂血糖都在边上、p15_008 血压数值偏高、p18_039 体检几项飘红、p20_007 听力差一格、
// p20_017 体检表箭头、p20_027 片子肺上有影、p20_048 片子要多复查、p21_008 筛查召回先观察、
// p23_012 体检多了要复查的字、p23_028 血压不稳、p23_044 体检血压高一截、p23_064 复查耳朵在车间亏了、
// p23_069 量血压有高值、p24_028 数值贴合格线、p26_018 查听力一耳下降明显、p29_016 量三回都高；
// 查出/确诊——p4_033 牙髓炎、p4_042 浅表性胃炎、p12_020 牙拍片需拔种、p12_027 胃肠镜小息肉、
// p13_005 医院查明手腕老毛病、p15_048 腰椎退变、p16_064 膝片磨损厉害、p20_060 尘肺年年复查、
// p21_041/p25_024/p26_017 白内障、p23_019 胃肠镜小息肉、p23_036 医院查听力噪声落下、p27_007 胆结石确诊；
// 服药/慢病管理——p4_052 药盒三个、p4_058 药量调整、ab37_028 常吃的药、p12_022 常吃降压药、
// p12_025 腰老毛病康复理疗、p14_024 你俩药盒本人每日服药、p16_065 降压药日常、p20_062 药按时吃、
// p21_024 自己的降压药、p21_044 常吃慢病药、p21_049 一周药分格、p21_050 自己的药盒、p21_063 孩子查你药盒、
// p22_027 慢病日常、p22_051 颈椎老毛病理疗、p22_066 半年用药记录、p24_001 自己药盒分早晚、
// p25_002 每月药费、p25_023 一周药分格、p25_030 慢病复诊拿药、p26_019 慢病长处方、p28_009 清单有你的降压药、
// p29_020 一年的药钱（兼问血压）；手术/住院——p4_054 住院五天、p21_039 住院膝手术、p23_022 住院、
// p25_011 住院小手术、p25_028 病后出院恢复、p26_003 住院白内障手术、p26_009 住院复查五天。
// 「出过警报、后来没再听说」的后半句全池无登记的康复落账来源，永不带（宁缺不编）。
// CL-154 二期扩：主角身体报警层的进程信号拍 proc_self_signal1/2（影子轨只落账本标记、
// 主线轨为真呈现）——「身体出过警报」自此也认信号层响过的局，跟进拍 proc_self_recheck 是
// 回应不是警报，不登记。
const HEALTH_ALERT_IDS = ["proc_self_signal1", "proc_self_signal2", "e_body", "r_health_operation", "p12_002", "p10_009", "p16_043", "e78_045",
"p15_013", "p15_054", "p21_013", "p21_032", "p22_017", "e65_050", "e55_047", "p24_007", "p23_023",
"p26_015", "p14_043", "p20_061", "p4_045", "p33_016", "p6_039",
"p4_031", "p4_032", "p4_033", "p4_042", "p4_052", "p4_053", "p4_054", "p4_058", "ab37_028",
"p12_020", "p12_022", "p12_025", "p12_027", "p13_005", "p14_024", "p14_041", "p15_008", "p15_048",
"p16_064", "p16_065", "p18_039", "p20_007", "p20_017", "p20_027", "p20_048", "p20_060", "p20_062",
"p21_008", "p21_024", "p21_039", "p21_041", "p21_044", "p21_049", "p21_050", "p21_063", "p22_027",
"p22_051", "p22_066", "p23_012", "p23_019", "p23_022", "p23_028", "p23_036", "p23_044", "p23_064",
"p23_069", "p24_001", "p24_028", "p25_002", "p25_011", "p25_023", "p25_024", "p25_028", "p25_030",
"p26_003", "p26_009", "p26_017", "p26_018", "p26_019", "p27_007", "p28_009", "p29_016", "p29_020"];

// ---- 措辞表（蓝图 6.2b：同一事实全游戏一套句形，只陈述已发生/现在如此，将来时全禁） ----
const FACT_WORDS = {
spouse: { partnered: "成家了", divorced: "成过家，后来离了", widowed: "成过家，对方先走了", none: "还没成家", single: "还没成家", dating: "还没成家"},
kids: { has: "有了孩子", none: "没要孩子"}, // undecided 不出此行
houseOwned: "有自己的房子",
houseUnit: "住着单位分的房",
houseRenting: "租着房子住",
healthAlert: "身体出过警报",
healthNone: "没听说身体有什么异常", // 否定形以「没听说」收口：那是瞥视者的信息边界，不是体检结论
residenceHomeAlways: "还在老家",
residenceHomeBack: "回了老家",
residenceCity: "在大城市落脚",
residenceAbroad: "去了海外",
parentsBoth: "父母都还在",
parentsOne: "父母还剩一位",
parentsNone: "父母都送走了",
workForm: { farm: "靠种地过日子", public: "在体制内做事", self: "自己做着点小买卖", flex: "接零活干", employee: "在单位里上班"},
phase: { part: "兼职着，还没全退", retired: "已经退了"}, // working 不出此行
};
// 悼念收尾骨架的状态流转句（蓝图 6.3 第 2 段「最后一次流转」用；未登记的流转不硬编成句）
const STATE_PHRASE = {
"spouse>partnered": "成了家", "spouse>dating": "处了一个人", "spouse>single": "定下来一个人过",
"spouse>divorced": "离了婚", "spouse>widowed": "另一半先走了",
"kids>has": "有了孩子", "kids>none": "定下来不要孩子",
"dad>dead": "父亲走了", "mom>dead": "母亲走了",
"workPhase>part": "改成做半截活", "workPhase>retired": "退了下来",
"dog>home": "养了条狗", "dog>gone": "狗没了", "cat>home": "养了只猫", "cat>gone": "猫没了",
};
const STATE_DOMAINS_L1 = ["spouse", "kids", "dad", "mom", "workPhase", "dog", "cat"]; // 6.1 一级流转的域（abroadKind 不入）
const CARE_PROC_IDS = ["proc_dad_care", "proc_mom_care", "proc_dad_hosp", "proc_mom_hosp"]; // 6.1 五级：父母照护进程拍

function uncontrolledEntry() {
const ses = IFY.session;
if (!ses ||!ses.tracks) return null;
const key = ses.controlTrack === "A"? "B": "A";
const entry = ses.tracks[key];
return entry && entry.state? { key, entry}: null;
}

// 居所轨迹与活计形态（v0.24.4 AN-2 改）：本文件原有的两份手抄复刻（residenceOf / formOfState）已删——
// 轨迹直接调 place.js residenceTrailOf 本体（手抄版漏了 p11_041 回城特判，与结算同屏打架），
// 形态直接调 work.js formOf(B) 本体（formOf/mainEntryOf 已通用化为可传任意 Track 的 state）。
// 单一实现，今后规则只在一处改。

// 现状事实表（蓝图 6.2）：入参 = 不受控 Track 的 state 与定格年龄（活着 = 本瞥视岁；已故 = 去世岁）。
// 每一行只从该 Track 的 state/账本/旗标里读真事，无数字、无预后、无与受控 Track 的比较句。
// 返回 [{slot, text}]，槽序固定：route / spouse / kids / house / residence / parents / work / phase / health。
function glimpseFactLines(B, atAge) {
const out = [];
const st = B.state || {}, F = B.flags || {}, led = Array.isArray(B.ledger)? B.ledger: [];
const inLed = (pred) => led.some((e) => e.age <= atAge && pred(e));
if (B.route && B.route.name) out.push({ slot: "route", text: `走的是「${B.route.name}」那条路`});
if (FACT_WORDS.spouse[st.spouse]) out.push({ slot: "spouse", text: FACT_WORDS.spouse[st.spouse]});
if (FACT_WORDS.kids[st.kids]) out.push({ slot: "kids", text: FACT_WORDS.kids[st.kids]});
// 住房行：读派生 housingOf(B)（place.js）——已购房才说「有自己的房子」（只断言到此为止，
// 房贷半句已退役，见文件上方登记注）；单位房单说；当前在私租才说租着住；都没有来源时整行不出（宁缺不编）。
const housing = typeof IFY.housingOf === "function"? IFY.housingOf(B): null;
if (housing && housing.owned) out.push({ slot: "house", text: FACT_WORDS.houseOwned});
else if (housing && housing.unit) out.push({ slot: "house", text: FACT_WORDS.houseUnit});
else if (housing && housing.rentingNow) out.push({ slot: "house", text: FACT_WORDS.houseRenting});
const res = typeof IFY.settledOf === "function"? IFY.settledOf(B, atAge): IFY.residenceTrailOf(B, IFY.START_AGE || 22, atAge);
out.push({ slot: "residence", text: res.final === "abroad"? FACT_WORDS.residenceAbroad
: res.final === "city"? FACT_WORDS.residenceCity
: (res.spans.city + res.spans.abroad) > 0? FACT_WORDS.residenceHomeBack: FACT_WORDS.residenceHomeAlways});
const dadAlive = st.dad!== "dead", momAlive = st.mom!== "dead";
out.push({ slot: "parents", text: dadAlive && momAlive? FACT_WORDS.parentsBoth: (dadAlive || momAlive)? FACT_WORDS.parentsOne: FACT_WORDS.parentsNone});
out.push({ slot: "work", text: FACT_WORDS.workForm[typeof IFY.formOf === "function"? IFY.formOf(B): "employee"] || FACT_WORDS.workForm.employee});
if (FACT_WORDS.phase[st.workPhase]) out.push({ slot: "phase", text: FACT_WORDS.phase[st.workPhase]});
const alert = inLed((e) => (e.kind === "crisis" && e.id === "health") || (e.kind === "death" && e.id === "health") || HEALTH_ALERT_IDS.includes(e.id));
out.push({ slot: "health", text: alert? FACT_WORDS.healthAlert: FACT_WORDS.healthNone});
return out;
}

// 立约引文门（fix4-settle 第 3 条）：registerCovenant 给 fork38 落的「立约：…」流水行是两个人的
// 约句。这条 Track 38 岁之前没走过定关系/领证路径时，它只是一个人把孩子的事定下来——
// 引文解析时该行整行剔除，免得任一候选借同岁回落行把它引出来；先前成过家（离异/丧偶）的
// 不算单身轨，不在此门内。与 settlement.js 的 covenantHadPartner 同判法。
function glimpseCovenantOk(B) {
const led = Array.isArray(B.ledger)? B.ledger: [];
return led.some((e) => (e.id === "spouse>partnered" || e.id === "spouse>dating") && typeof e.age === "number" && e.age <= 38);
}

// 账本条目 → 它那一岁的流水原句（state 流转没有专属流水行，认同岁造成它的那条行）。
// 认领序：death 认「这一生停在这里」行 → fork 认含 choice 的行 → rare 认「」行 →
// crisis 认含标题的行（标题不在账本里，按「岁 · 」前缀 + choice 在行内匹配）→ 其余认同岁未被占用的第一行。
function logLineFor(B, e, used, covOk) {
const lines = (Array.isArray(B.log)? B.log: []).filter((l) => l.startsWith(`${e.age} 岁 · `) &&!used.has(l) && (covOk || !l.includes("· 立约：")));
if (!lines.length) return "";
let pick = "";
if (e.kind === "death") pick = lines.find((l) => l.includes("这一生停在这里")) || "";
else if (e.kind === "fork" && e.choice) pick = lines.find((l) => l.includes(e.choice)) || "";
else if (e.kind === "rare") pick = lines.find((l) => l.includes("")) || "";
else if (e.kind === "crisis" && e.choice) pick = lines.find((l) => l.includes(e.choice)) || "";
return pick || lines[0];
}

// 取材（蓝图 6.1）：窗内候选分级排序后取主素材 1 件 + 不同级的次素材至多 1 件。
// draw = renderGlimpse 入口已消费的那 1 抽的值：仅当第一名出现同级同龄并列时在并列组内决胜，无并列不使用。
// 纯读函数：不消费任何流（那一抽由调用方消费，见不变式注释）。
function glimpsePick(B, ctrlLedger, prevAge, age, draw) {
const covOk = glimpseCovenantOk(B); // fix4-settle 第 3 条：单身轨的「立约：」行不进引文解析（见 logLineFor）
const ctrlForkAges = new Set((ctrlLedger || []).filter((e) => e.kind === "fork").map((e) => e.age));
const cands = [];
(Array.isArray(B.ledger)? B.ledger: []).forEach((e, idx) => {
if (!(e.age > prevAge && e.age <= age)) return;
let level = -1;
if (e.kind === "state") { const dom = String(e.id).split(">")[0]; if (STATE_DOMAINS_L1.includes(dom)) level = 1;}
else if (e.kind === "fork") level = ctrlForkAges.has(e.age)? 2: 3;
else if (e.kind === "rare" || e.kind === "crisis") level = 4;
else if (e.kind === "proc" && CARE_PROC_IDS.includes(e.id)) level = 5;
if (level >= 0) cands.push({ e, idx, level});
});
cands.sort((a, b) => (a.level - b.level) || (b.e.age - a.e.age) || (b.idx - a.idx)); // 级升序、级内最近、同级同龄取后落账者
if (!cands.length) return { main: null, second: null};
// 同级同龄并列决胜：第一名的并列组（同级 + 同龄）长度 ≥2 时，用那 1 抽在组内定主素材（组内序 = 上列排序序）
const top = cands[0];
const tieGroup = cands.filter((c) => c.level === top.level && c.e.age === top.e.age);
let ordered = cands;
if (tieGroup.length >= 2) {
const win = tieGroup[Math.min(tieGroup.length - 1, Math.floor(draw * tieGroup.length))];
ordered = [win,...cands.filter((c) => c!== win)];
}
const used = new Set();
const resolve = (c) => { const text = logLineFor(B, c.e, used, covOk); if (!text) return null; used.add(text); return { id: c.e.id, kind: c.e.kind, age: c.e.age, level: c.level, text};};
let main = null;
for (const c of ordered) { main = resolve(c); if (main) break;}
if (!main) return { main: null, second: null};
let second = null;
for (const c of cands) { if (c.level === main.level) continue; const r = resolve(c); if (r) { second = r; break;}}
return { main, second};
}

// 悼念收尾骨架（蓝图 6.3 第 2 段）：出生路线 → 成家与否 → 子女 → 最后一次流转，各一句，全生取材。
function glimpseSkeleton(B) {
const st = B.state || {};
const out = [];
if (B.route && B.route.name) out.push(`后来走的是「${B.route.name}」那条路。`);
const sp = { partnered: "后来成了家。", divorced: "成过家，后来离了。", widowed: "成过家，对方先走了。", dating: "处过一个人，没走到成家那一步。", single: "一直没成家。", none: "一直没成家。"}[st.spouse];
if (sp) out.push(sp);
const kd = { has: "有了孩子。", none: "没要孩子。", undecided: "孩子的事，一直没定下来。"}[st.kids];
if (kd) out.push(kd);
const states = (Array.isArray(B.ledger)? B.ledger: []).filter((e) => e.kind === "state" && STATE_PHRASE[e.id]);
if (states.length) { const last = states[states.length - 1]; out.push(`最后一次落定的事，是${STATE_PHRASE[last.id]}，在 ${last.age} 岁。`);}
return out;
}

function glimpseDeathLine(B) {
const line = (Array.isArray(B.log)? B.log: []).find((l) => l.includes("这一生停在这里"));
if (line) return line;
return B.death? `${B.death.age} 岁 · 这一生停在这里：${B.death.text}`: "";
}

// ---------- v0.23 WP9 A线：童年记号瞥视轮换消费（Real/Legacy 两路共用；scripts/sim.js 同口径复刻） ----------
// 按落账序逐瞥一句：取 S.marks 中第一个未示且有可解析文本的条目——可解析文本＝条目自带 shadow
// ?? 注册表 PRO.marks[id].shadow（旧档条目无 shadow 字段时回落注册表、不报错；池记号旧条目注册表
// 里也没有、无文本可示，跳过）。条目（或注册表条目）带 shadowBySchooling 时，按消费当时
// S.state.schooling 解析：有该键用分文、否则缺省句。已示 id 记 S.prologue.shadowMarksShown；
// 旧档只有 shadowMarkShown===true 时，首次消费前把 marks[0].id 视为已示（迁移，不重示其句）。
// 纯状态函数、零 RNG 消费；第一瞥行为与旧口径逐字一致（首个未示恒为 marks[0] 的情形）。
function glimpseMarkLineNext() {
const S = IFY.S;
if (!IFY.PRO || !S || !S.prologue || !(S.marks || []).length) return "";
const P = S.prologue;
if (!Array.isArray(P.shadowMarksShown)) {
P.shadowMarksShown = [];
if (P.shadowMarkShown === true && S.marks[0] && S.marks[0].id) P.shadowMarksShown.push(S.marks[0].id);
}
const shown = new Set(P.shadowMarksShown);
const entry = (S.marks || []).find((m) => m && m.id &&!shown.has(m.id) && ((m.shadow != null) || (IFY.PRO.marks[m.id] && IFY.PRO.marks[m.id].shadow != null)));
if (!entry) return "";
let text = entry.shadow != null? entry.shadow: IFY.PRO.marks[entry.id].shadow;
const bySch = entry.shadowBySchooling || (IFY.PRO.marks[entry.id] && IFY.PRO.marks[entry.id].shadowBySchooling) || null;
if (bySch && S.state && bySch[S.state.schooling] != null) text = bySch[S.state.schooling];
if (!text) return "";
P.shadowMarksShown.push(entry.id);
P.shadowMarkShown = true; // 旧口径镜像：任一瞥视示句后置 true（旧档迁移判定只读它与 marks[0]）
S.log.push(`${S.age} 岁 · ${text}`);
return text;
}

// ---------- 真账瞥视（呈现骨架与 legacy 同一套，只换取材） ----------
function renderGlimpseReal(stage, found) {
const { entry} = found;
const B = entry.state;
IFY.curKind = "glimpse";
IFY.S.flatCarry = null; // 瞥视年不是平年：挂起的平年只留在流水账里
// 每次 renderGlimpse 恰好消费主线叙事流 1 抽，与现行
// shadowStageText 的口径逐位一致——瞥视年的主线叙事流相位不许因取材改版而动。
// 本抽只在一个地方用：主素材出现同级同龄并列时在并列组内决胜（glimpsePick）；无并列时抽了丢弃。
// legacy 路径的 1 抽在 shadowStageText 内消费，同样恰好 1 抽。改本函数的人先过这条。
const draw = IFY.rng();
const age = IFY.S.age;
const prevAge = stage <= 0? (IFY.START_AGE || 22): GLIMPSE_AGES_ALL[stage - 1];
const mode = B.death? (entry.memorialShown? "retro": "memorial"): "normal";
const atAge = B.death? B.death.age: age;
const facts = glimpseFactLines(B, atAge);
const pick = mode === "normal"? glimpsePick(B, IFY.S.ledger, prevAge, age, draw): { main: null, second: null};
const skeleton = mode === "normal"? []: glimpseSkeleton(B);
const deathLine = mode === "normal"? "": glimpseDeathLine(B);
const routeName = B.route? B.route.name: "";
const firstLook = (IFY.playerMeta().glimpsesSeen + IFY.playerMeta().glimpsesSkipped) === 0; // v0.20.1 第九项：影子机制的说明不在开局讲，挪到第一次瞥视当口说（只说这一次）；v0.21 WP1：瞥视计数改读 session.meta（蓝图 3.1 玩家层）
IFY.app().innerHTML = `<section class="card glimpse">${IFY.head()}
<h2>${IFY.S.age} 岁 · 另一条路上的你</h2>
${firstLook? glimpseIntroHtml(): ""}
<p class="teaser">${IFY.esc(routeName)}，那条路上的你。</p>
<p class="hint">细节只给你看一眼。看，还是不看，你自己定——不看的那几次，结算时会记着。</p>
<div class="row"><button class="primary" id="look">看细节</button><button class="ghost" id="skip">不看，继续过日子</button></div>
<div id="detail"></div></section>`;
IFY.finishRender();
const doSkip = () => { const mSkip = IFY.playerMeta(); mSkip.glimpsesSkipped += 1; IFY.S.glimpsesSkipped = mSkip.glimpsesSkipped; /* v0.21 WP1：计数权威在 meta，state 同名字段只作同形镜像 */ IFY.ANA.track("glimpse", { age: IFY.S.age, seen: false}); IFY.S.log.push(`${IFY.S.age} 岁 · 没有去看另一条路`); IFY.rec("glimpse", "skip"); IFY.advance(); };
IFY.el("skip").addEventListener("click", doSkip);
// 注：悼念模式下点「不看」同样只记跳过——memorialShown 不置位，悼念顺延到下一个瞥视点，不许被跳过吃掉（蓝图 6.3）。
const doLook = (autoSelected) => {
const mSeen = IFY.playerMeta(); mSeen.glimpsesSeen += 1; IFY.S.glimpsesSeen = mSeen.glimpsesSeen; /* v0.21 WP1：计数权威在 meta，state 同名字段只作同形镜像 */ IFY.ANA.track("glimpse", { age: IFY.S.age, seen: true});
// shownFacts 记账（蓝图 6.2b）：实际呈现的素材（id+age）与事实行（槽名）落 meta，供二期揭价对着清单选材
const meta = IFY.playerMeta();
if (!Array.isArray(meta.shownFacts)) meta.shownFacts = [];
const mainText = mode === "memorial"? deathLine: mode === "retro"? (skeleton[0] || ""): (pick.main? pick.main.text: "");
if (mode === "normal") {
for (const m of [pick.main, pick.second]) if (m) meta.shownFacts.push({ glimpseAge: age, type: "material", id: m.id, atAge: m.age});
}
if (mode === "memorial") meta.shownFacts.push({ glimpseAge: age, type: "memorial", id: "death", atAge: B.death.age});
if (mode === "retro" && skeleton[0]) meta.shownFacts.push({ glimpseAge: age, type: "material", id: "route", atAge: 22});
for (const f of facts) meta.shownFacts.push({ glimpseAge: age, type: "fact", slot: f.slot});
if (mainText) (IFY.S.shadowSeenTexts = IFY.S.shadowSeenTexts || []).push(mainText);
IFY.rec("glimpse", "seen", mainText? { text: mainText}: undefined);
IFY.S.log.push(mainText? `${IFY.S.age} 岁 · 影子：${mainText}`: `${IFY.S.age} 岁 · 看了另一条路`);
if (mode === "memorial") entry.memorialShown = true; // 悼念呈现后才置位（蓝图 6.3）
// 童年记号的影子回响（v0.17.0；v0.23 WP9 A线改轮换消费）：每次看瞥视按落账序附一句未示过的「两条路上共同的事实」——童年不进影子锚点，只留共同事实
const markLine = glimpseMarkLineNext();
const factsHtml = `<p class="hint">近况，一行一条：</p>` + facts.map((f) => `<p class="body">· ${IFY.esc(f.text)}</p>`).join("");
// v0.31.1 归属行（bantou-diag2 定根）：引文与玩家自家流水账版式全同、屏上无归属标记，玩家会读成
// 「游戏在引我的话还引错了」——引文与近况同属一区，区首加一行归属，只动呈现、不动取材与落账。
const ledgerHead = `<p class="hint">另一条路上的你 · 他的账：</p>`;
let detailHtml = "";
if (mode === "normal") {
detailHtml = `${ledgerHead}${pick.main? `<p class="body">「${IFY.esc(pick.main.text)}」</p>`: ""}${pick.second? `<p class="body">「${IFY.esc(pick.second.text)}」</p>`: ""}${factsHtml}`;
} else if (mode === "memorial") {
detailHtml = `${ledgerHead}<p class="body">「${IFY.esc(deathLine)}」</p>`
+ skeleton.map((s) => `<p class="body">${IFY.esc(s)}</p>`).join("")
+ factsHtml
+ `<p class="body">那条路，在 ${B.death.age} 岁走完了。</p>`;
} else { // retro 回望：定格事实表 + 收尾叙述第一句，不编新素材（蓝图 6.3）
detailHtml = `${ledgerHead}${skeleton[0]? `<p class="body">${IFY.esc(skeleton[0])}</p>`: ""}${factsHtml}`;
}
// 交换提问（蓝图 7.1 时机 A+，二期 WP6）：只在 normal 屏、未交换过时出，位置在 detail 内容里、
// 反思输入行之前；机会说明行只陈述机会存量，不劝换不劝留。悼念/回望 mode 天然不在 normal、不出；
// skip 路径不经本处理器，不出。拒绝只关本次（下个瞥视点照常出），接受走 IFY.handControl()。
const swapHtml = (mode === "normal" && !meta.swapped)
? `<div id="swapblock"><p class="hint">${glimpseSwapHintHtml()}</p><div class="row"><button class="primary" id="swap-yes">换过去，过它接下来的日子</button><button class="ghost" id="swap-no">不换，继续过我的</button></div></div>`
: "";
IFY.el("detail").innerHTML = `${detailHtml}${markLine? `<p class="hint">你们共同的童年：</p><p class="body">${IFY.esc(markLine)}</p>`: ""}${swapHtml}
<label class="refl-label">给现实里的自己留一句话（写下的话，会原样出现在这一生的结算里）<input id="refl" type="text" maxlength="60" placeholder="一句就好"></label>
<div class="row"><button class="primary" id="cont">记下，继续</button><button class="ghost" id="cont2">不写了，继续</button></div>`;
document.querySelector(".row").remove();
const done = () => { const v = (IFY.el("refl").value || "").trim(); if (v) IFY.playerMeta().reflections.push({ age: IFY.S.age, text: v}); /* v0.21 WP1：反思认领是玩家层，写 session.meta（蓝图 3.1） */ IFY.advance();};
IFY.el("cont").addEventListener("click", done);
IFY.el("cont2").addEventListener("click", IFY.advance);
if (swapHtml) {
IFY.el("swap-no").addEventListener("click", () => { const b = IFY.el("swapblock"); if (b) b.remove();});
IFY.el("swap-yes").addEventListener("click", () => {
let okSwap = false;
try { okSwap = typeof IFY.handControl === "function" && IFY.handControl();} catch (e) { console.error("交换提问：handControl 抛错，提问块保留待查", e);}
if (okSwap) { const b = IFY.el("swapblock"); if (b) b.outerHTML = `<p class="body">从这一年起，你过的是这条路的日子了。先前那条，由另一个你接着过。</p>`;}
else console.error("交换提问：handControl 返回失败，提问块保留待查");
});
}
IFY.save();
if (autoSelected) IFY.armAuto(mainText || "另一条路上的你", () => IFY.advance(), "advance"); // 全程自动：详情屏按 advance 流过（不写反思、不点交换提问，走 cont2 的路）
};
IFY.el("look").addEventListener("click", () => doLook(false));
// 全程自动选扩围（本批补漏）：瞥视屏无 arm 则零点击整局必卡。full 模式恒自动「看」——不随机抽看/不看：
// 抽到「不看」的话自动局全程见不到影子，撞产品主旨（活完一生，看见没走的那条路）。不另写「自动选」记账行：
// 本屏不是选项屏，看/不看的手动记账行（影子：…/没有去看）照旧由 doLook/doSkip 自己落。
IFY.armAuto(`${routeName}，那条路上的你。`, () => {
const lookBtn = IFY.el("look"), skipBtn = IFY.el("skip");
if (lookBtn) lookBtn.classList.add("picked");
if (skipBtn) skipBtn.classList.add("faded");
IFY.autoPhase2 = setTimeout(() => { IFY.autoPhase2 = null; doLook(true); }, 400);
}, "choice");
}

// ---------- legacy 瞥视（无 Track_B 的旧档局）：呈现与落账逻辑照旧，本批仅加全程自动「看」 ----------
function renderGlimpseLegacy(stage) {
IFY.curKind = "glimpse";
IFY.S.flatCarry = null; // 瞥视年不是平年：挂起的平年只留在流水账里
const sh = shadowRoute();
const text = shadowStageText(stage); // 先抽定，点不点开都是这一条（但只有点开才显示）
const firstLook = (IFY.playerMeta().glimpsesSeen + IFY.playerMeta().glimpsesSkipped) === 0; // v0.20.1 第九项：影子机制的说明不在开局讲，挪到第一次瞥视当口说（只说这一次）；v0.21 WP1：瞥视计数改读 session.meta（蓝图 3.1 玩家层）
IFY.app().innerHTML = `<section class="card glimpse">${IFY.head()}
<h2>${IFY.S.age} 岁 · 另一条路上的你</h2>
${firstLook? glimpseIntroHtml(): ""}
<p class="teaser">${IFY.esc(sh.name)}，今年：${IFY.esc(sh.teaser[stage])}</p>
<p class="hint">细节只给你看一眼。看，还是不看，你自己定——不看的那几次，结算时会记着。</p>
<div class="row"><button class="primary" id="look">看细节</button><button class="ghost" id="skip">不看，继续过日子</button></div>
<div id="detail"></div></section>`;
IFY.finishRender();
const doSkip = () => { const mSkip = IFY.playerMeta(); mSkip.glimpsesSkipped += 1; IFY.S.glimpsesSkipped = mSkip.glimpsesSkipped; /* v0.21 WP1：计数权威在 meta，state 同名字段只作同形镜像 */ IFY.ANA.track("glimpse", { age: IFY.S.age, seen: false}); IFY.S.log.push(`${IFY.S.age} 岁 · 没有去看另一条路`); IFY.rec("glimpse", "skip"); IFY.advance(); };
IFY.el("skip").addEventListener("click", doSkip);
const doLook = (autoSelected) => {
const mSeen = IFY.playerMeta(); mSeen.glimpsesSeen += 1; IFY.S.glimpsesSeen = mSeen.glimpsesSeen; /* v0.21 WP1：计数权威在 meta，state 同名字段只作同形镜像 */ IFY.ANA.track("glimpse", { age: IFY.S.age, seen: true});
(IFY.S.shadowSeenTexts = IFY.S.shadowSeenTexts || []).push(text);
IFY.rec("glimpse", "seen", { text});
IFY.S.log.push(`${IFY.S.age} 岁 · 影子：${text}`);
// 童年记号的影子回响（v0.17.0；v0.23 WP9 A线改轮换消费）：每次看瞥视按落账序附一句未示过的「两条路上共同的事实」——童年不进影子锚点，只留共同事实
const markLine = glimpseMarkLineNext();
IFY.el("detail").innerHTML = `<p class="body">「${IFY.esc(text)}」</p>${markLine? `<p class="body">${IFY.esc(markLine)}</p>`: ""}
<label class="refl-label">给现实里的自己留一句话（写下的话，会原样出现在这一生的结算里）<input id="refl" type="text" maxlength="60" placeholder="一句就好"></label>
<div class="row"><button class="primary" id="cont">记下，继续</button><button class="ghost" id="cont2">不写了，继续</button></div>`;
document.querySelector(".row").remove();
const done = () => { const v = (IFY.el("refl").value || "").trim(); if (v) IFY.playerMeta().reflections.push({ age: IFY.S.age, text: v}); /* v0.21 WP1：反思认领是玩家层，写 session.meta（蓝图 3.1） */ IFY.advance();};
IFY.el("cont").addEventListener("click", done);
IFY.el("cont2").addEventListener("click", IFY.advance);
IFY.save();
if (autoSelected) IFY.armAuto(text, () => IFY.advance(), "advance"); // 全程自动：详情屏按 advance 流过（不写反思，走 cont2 的路）
};
IFY.el("look").addEventListener("click", () => doLook(false));
// 全程自动选扩围（本批补漏）：与真账瞥视同一套——full 模式恒自动「看」，不随机抽看/不看（理由见 renderGlimpseReal 处注）
IFY.armAuto(`${sh.name}，今年：${sh.teaser[stage]}`, () => {
const lookBtn = IFY.el("look"), skipBtn = IFY.el("skip");
if (lookBtn) lookBtn.classList.add("picked");
if (skipBtn) skipBtn.classList.add("faded");
IFY.autoPhase2 = setTimeout(() => { IFY.autoPhase2 = null; doLook(true); }, 400);
}, "choice");
}

function renderGlimpse(stage) {
const found = uncontrolledEntry();
if (found) return renderGlimpseReal(stage, found);
return renderGlimpseLegacy(stage);
}

// 只读测试导出（v0.21 WP5）：把一次瞥视的呈现记录按 renderGlimpseReal 的同口径算出来，供
// 出处检查的批量快照法复用。纯函数：只读入参快照、不写任何 Track、不消费任何随机流——
// draw 是那一抽的值、由调用方按裁定二不变式在渲染当口取得后传入（与 glimpsePick 同口径）。
// B = 不受控 Track 的 state 快照；ctrlLedger = 受控 Track 账本（只读、只为对照点配对）；
// memorialShown = 该 Track 条目在本次瞥视之前的悼念置位（决定悼念/回望）。
// 返回 {mode, materials, facts, skeleton, closing, framing}，形状与 glimpse-provenance 的 case 对齐。
function glimpseTakeForTest(B, ctrlLedger, glimpseAge, draw, memorialShown) {
const stage = GLIMPSE_AGES_ALL.indexOf(glimpseAge);
const prevAge = stage <= 0? (IFY.START_AGE || 22): GLIMPSE_AGES_ALL[stage - 1];
const mode = B.death? (memorialShown? "retro": "memorial"): "normal";
const atAge = B.death? B.death.age: glimpseAge;
const facts = glimpseFactLines(B, atAge);
const framing = [`${B.route? B.route.name: ""}，那条路上的你。`];
if (mode === "normal") {
const pick = glimpsePick(B, ctrlLedger, prevAge, glimpseAge, draw);
const materials = [pick.main, pick.second].filter(Boolean).map((m) => m.text);
return { mode, materials, facts, skeleton: [], closing: "", framing};
}
const skeleton = glimpseSkeleton(B);
if (mode === "memorial") {
return { mode, materials: [glimpseDeathLine(B)], facts, skeleton, closing: `那条路，在 ${B.death.age} 岁走完了。`, framing};
}
return { mode, materials: [], facts, skeleton: skeleton.slice(0, 1), closing: "", framing};
}

Object.assign(IFY, {
shadowRoute, shadowStageText, shadowCostText, shadowFinalText, shadowCompareLines, renderGlimpse,
// WP4 取材层导出（供出处检查工具与断言复用同一套登记表与纯函数；呈现层之外不消费它们做决策）
glimpseFactLines, glimpsePick, glimpseSkeleton, glimpseDeathLine, uncontrolledEntry, glimpseTakeForTest, glimpseMarkLineNext,
// 瞥视文案构造器（只读：站表读 engine 的 glimpseStationsOf，不消费随机流）——供定向验证逐字比对
glimpseStationAges, glimpseIntroHtml, glimpseSwapHintHtml,
GLIMPSE_FACT_SOURCES: { HEALTH_ALERT_IDS, FACT_WORDS}, // v0.24.4：OWNED_FLAGS 与两组 MORTGAGE id 清单随派生化退役（住房改读 housingOf 单一源）
});
})(window.IFY);
