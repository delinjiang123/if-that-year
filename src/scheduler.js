// [模块]《如果那年》引擎分片：调度层（v0.20.0 M2 五层仲裁 + saliency）。
// 年份计划由 planYear() 统一组织，engine.step() 与模拟器只消费计划、不再各自仲裁：
//   L0 锚点（src/anchors.js 登记）：进程拍 / 分岔 / 瞥视——触发机制不变，仍在 step() 里先于
//      本层处理；planYear 只把本年锚点信息带进计划（plan.anchors），内容时槽从 L1 起。
//   L1 危机抢占：危机到期（pickCrisis 命中）优先于稀有与普通事件占本年内容时槽。
//   L2 链推进与稀有：稀有保留现行概率门（条件是门票、骰子是第二道门）；普通事件先在
//      「链后继候选」（chain 前置已发生且 met 过）里分层抽取（层内按现行权重），废除旧
//      CHAIN_BOOST ×48 权重硬顶——层本身就是保底，不再靠权重堆。考试链头（p16_001）对
//      home 路线另有同层锚点（v0.20.1 W9，见 planYear 内注），保证 22–25 岁窗内到达。
//   L3 saliency 抽取：普通事件按具体度分排序分段，最高分段内加权随机（见 saliencyScore）。
//      温度 derive 的消费也收进本层：平淡年（温度出口）在 L1/L2 落空后、L3 之前按
//      rhythmOf().flatShare 掷骰决定（公式在 src/rhythm.js，本层只消费、不另算）。
//   L4 风味填充：微年（平年微文本）只在本年没有任何 L1–L3 内容时填充（显式规则，计数
//      在 IFY.schedStats.flavorYears）。
// 全程只用既有环境流 rngA（与旧 pickEvent/pickRare 同流），不新增随机源、不用 Math.random。
(function (IFY) {
  "use strict";
  const ANCHORS = (typeof window !== "undefined" && window.GAME_ANCHORS) || null; // 加载位在 anchors.js 之后

  // 调度计数（诊断/模拟对照用；只增不改游戏状态，存档不带它）
  const schedStats = { crisis: 0, crisisPreempt: 0, rare: 0, chain: 0, examAnchor: 0, l3: 0, flat: 0, micro: 0, flavorYears: 0 };
  IFY.schedStats = schedStats;

  // ---------- 结算事实过滤（v0.17.0，F1/F2）：片段与结局声明的预设事实逐项核对本局事实，对不上不出 ----------
  function factOk(needs) {
    if (!needs) return true;
    if (needs.flag && !IFY.S.flags[needs.flag]) return false;
    if (needs.notFlag && IFY.S.flags[needs.notFlag]) return false;
    if (needs.notAnyFlag && needs.notAnyFlag.some((f) => IFY.S.flags[f])) return false; // AN-5 R1：多旗负向门（与单旗 notFlag 对偶）——判词租房句与 s7 的 WP9 住房三旗守卫同口径靠它表达
    if (needs.anyFlag && !needs.anyFlag.some((f) => IFY.S.flags[f])) return false;
    if (needs.state) for (const [dom, vals] of Object.entries(needs.state)) if (!vals.includes(IFY.S.state[dom])) return false;
    if (needs.stateNot) for (const [dom, vals] of Object.entries(needs.stateNot)) if (vals.includes(IFY.S.state[dom])) return false;
    if (needs.eraIn && !needs.eraIn.includes(IFY.S.era)) return false;
    return true;
  }

  function factAnyOk(clauses) { // WP2（补丁稿 wp2-scheduler-year-patch，合并二期落）: clause={事实名:值, _flag:旗名}; 任一 clause 的全部条件合即过
    const F = (IFY.S && IFY.S.facts) || {};
    return (clauses || []).some((cl) => Object.entries(cl).every(([k, v]) => k === "_flag" ? !!IFY.S.flags[v] : ((F[k] == null ? "absent" : F[k]) === v)));
  }
  function evidenceCount(e) { // F4 证据点：evidence 组内任一备选命中算一点（备选 = 事件/稀有/旗标 id 或 {stat} 数值门）
    if (!e.evidence) return 99; // 未声明证据组的条目按满证据（现行 17 条结局已全部声明）
    let n = 0;
    for (const group of e.evidence) {
      const hit = group.some((alt) => {
        if (typeof alt === "string") return IFY.hasFact(alt); // v0.18.0：证据点改读账本并读（flags/usedEvents/usedRare/ledger 同一口径）
        if (alt && alt.stat) return alt.stat.gt !== undefined ? IFY.S.stats[alt.stat.k] > alt.stat.gt : IFY.S.stats[alt.stat.k] < alt.stat.lt;
        if (alt && alt.state) return Object.entries(alt.state).every(([dom, v]) => IFY.S.state[dom] === v);
        if (alt && alt.rec) return IFY.hasRec(alt.rec);
        return false;
      });
      if (hit) n++;
    }
    return n;
  }

  // --- 子女/宠物真实岁数（v0.20.1）：阶段文本按他们自己的岁数读，不按玩家岁数读 ---
  // kidAgeTrue = 当前年龄 − (kidsBornAt ?? kidsAt)：出生拍（apply.js BORN_BEATS）落过出生年就按
  // 出生年算；没落过（e_kid_settle/final 无专属出生拍、或出生拍还没轮到呈现）回落落定年龄 kidsAt，
  // 与 kidMin/kidMax 的既有口径同源——两套门的区别只在锚点：kidMin/kidMax 锚落定年（存量标定不动），
  // kidAgeMin/kidAgeMax 锚出生年（新挂的阶段文本用它，出生晚几年就整体晚几年，不再错位）。
  function kidAgeTrue() {
    const b = IFY.S.kidsBornAt != null ? IFY.S.kidsBornAt : IFY.S.kidsAt;
    return b == null ? null : IFY.S.age - b;
  }
  // petAgesTrue(e)：本条目所指宠物的真实岁数数组。物种按条目自身的门/链/流转推断——
  // state/stateAll/stateNot/setState 里带 cat 或 dog 的按该物种取；chain 指向抱回拍的
  // （p5_043=猫、p11_049=狗）按该物种取；分不清物种的条目两边都查，任一满足即可（见 met 的 petMin/petMax）。
  function petAgesTrue(e) {
    const S = IFY.S, ages = [];
    const blob = JSON.stringify([e.state || {}, e.stateAll || {}, e.stateNot || {}, e.setState || {}]);
    const wantCat = blob.includes("cat") || e.chain === "p5_043" || e.id === "p5_043";
    const wantDog = blob.includes("dog") || e.chain === "p11_049" || e.id === "p11_049";
    if ((wantCat || (!wantCat && !wantDog)) && S.catAt != null) ages.push(S.age - S.catAt);
    if ((wantDog || (!wantCat && !wantDog)) && S.dogAt != null) ages.push(S.age - S.dogAt);
    return ages;
  }

  // --- 农民路线退出层关门（立项新增）：farm_left 立后，务农线条目整系退出抽取池 ---
  // 判据派生而非逐条 forbid：给存量条目逐条加 forbid 键会抬高它们的 saliency 具体度，
  // 把全部老路线的同种子抽取序搅乱（集成实测）；关门写在 met 一处，条目数据零改动。
  // 覆盖：pack29 全系（id 前缀）＋带 farmLine 标记／routeIn 含 farm／require 含
  // farm_work·township_work 的条目（pack35 与 p23_009 这类挂种地旗的条目）。
  function isFarmLineItem(e) {
    if (!e) return false;
    if (typeof e.id === "string" && e.id.startsWith("p29_")) return true;
    if (e.ctx && e.ctx.farmLine) return true;
    if (Array.isArray(e.routeIn) && e.routeIn.includes("farm")) return true;
    const req = e.require ? (Array.isArray(e.require) ? e.require : [e.require]) : [];
    return req.includes("farm_work") || req.includes("township_work");
  }

  // --- 考试链身预防性关门（考试门片·审议单 #5）：require exam_retry 且不靠 chain 承接的
  // 链身拍（现行唯 p16_006/p16_007）一律过宽学历门 eduGateHalf。链身封口本靠 chain 前置
  // 与 require 旗的传递性：将来任何新拍在链外新立 exam_retry 时，不许直通这两拍、把没读
  // 书记录的人放进链身无门区。关门写在 met 一处、条目数据零改动——与农民路线退出层同
  // 口径：给条目补 ctx 键会抬高 specificity、搅动 L3 saliency 权重梯度，school 组同种子
  // parity 实测即破（定位见 exam-build 报告）；凡 require exam_retry 且无 chain 的拍自动
  // 入关，未来同形新拍不待逐条补门。
  function examRetryGateApplies(e) {
    if (!e || e.chain) return false;
    const req = e.require ? (Array.isArray(e.require) ? e.require : [e.require]) : [];
    return req.includes("exam_retry");
  }

  // --- 统一条件求值：路线/标记组合/数值形状/前置链 ---
  function met(e) {
    if (IFY.S.flags && IFY.S.flags.farm_left && isFarmLineItem(e)) return false; // 退出层：全家进城后土地线关门
    if (examRetryGateApplies(e) && !IFY.ctxOk({ eduGateHalf: true })) return false; // 链身关门：require 型后继过宽学历门（见 examRetryGateApplies）
    if (e.procOnly) return false; // 进程条目只由进程呈现，不进普通抽取池（v0.18.0）
    if (e.ctx && !IFY.ctxOk(e.ctx)) return false; // 职业语境门（v0.18.0）
    if (e.anyParentAlive && IFY.S.state.dad !== "alive" && IFY.S.state.mom !== "alive") return false;
    if (e.anyFamilyAlive && !(typeof IFY.anyFamilyAlive === "function" && IFY.anyFamilyAlive(IFY.S))) return false; // 判词批 D：家里还有人门，求值本体在 record.js 的派生层，与 unmetConditions 同读一处，不许两处各拼一份
    if (e.kidMin != null && (IFY.S.kidsAt == null || IFY.S.age - IFY.S.kidsAt < e.kidMin)) return false; // v0.18.0：孩子年龄门（按 kids 落定年龄推孩子岁数，挡「孩子 9 岁脱产备考」类错位） // 与父母进程对齐（fork52：父母都不在了不出此岔）
    if (e.kidMax != null && (IFY.S.kidsAt == null || IFY.S.age - IFY.S.kidsAt > e.kidMax)) return false; // v0.19.0 三相：孩子年龄上限门（与 kidMin 对称，挡「孩子 9 岁入园」类错位；字段形状在 tools/validate-state.js 登记核对）
    if (e.kidAgeMin != null) { const ka = kidAgeTrue(); if (ka == null || ka < e.kidAgeMin) return false; } // v0.20.1：孩子真实年龄下限门（锚出生年，口径见 kidAgeTrue）
    if (e.kidAgeMax != null) { const ka = kidAgeTrue(); if (ka == null || ka > e.kidAgeMax) return false; } // v0.20.1：孩子真实年龄上限门（婴儿期文本用它封顶）
    if (e.petMin != null) { const pa = petAgesTrue(e); if (!pa.length || Math.max(...pa) < e.petMin) return false; } // v0.20.1：宠物真实年龄下限门（老龄文本 ≥9；分不清物种时任一宠物达龄即过）
    if (e.petMax != null) { const pa = petAgesTrue(e); if (!pa.length || Math.min(...pa) > e.petMax) return false; } // v0.20.1：宠物真实年龄上限门（幼宠文本用；任一宠物够小即过）
    if (e.flagAgeWithin && (IFY.S.flagAges == null || IFY.S.flagAges[e.flagAgeWithin.flag] == null || IFY.S.age - IFY.S.flagAges[e.flagAgeWithin.flag] > e.flagAgeWithin.years)) return false; // v0.19.0 三相：旗标落点时间窗门（通用形状 {flag, years}，读 flagAges 底子；挡身后手续隔多年重办类复发）
    if (e.flagAgeMin && (IFY.S.flagAges == null || IFY.S.flagAges[e.flagAgeMin.flag] == null || IFY.S.age - IFY.S.flagAges[e.flagAgeMin.flag] < e.flagAgeMin.years)) return false; // 内容修复批：旗标落点下限门（flagAgeWithin 的对偶——置旗未满 N 年不出；挡刚落点即被同题追问类紧贴复发，如刚搬完家又问搬不搬；字段形状在 tools/validate-state.js 登记核对）
    if (e.rehireAfterRetire && !(typeof IFY.hasRehireAfterRetire === "function" && IFY.hasRehireAfterRetire())) return false; // v0.20.1 W7：返聘后复退门（条目级布尔）——账本里首次全退流转之后真有过 retired→part 返聘边才可抽（work.js hasRehireAfterRetire，读账本不读旧旗）
    if (e.route && e.route !== IFY.S.route.id) return false;
    if (e.routeIn && !e.routeIn.includes(IFY.S.route.id) && !(IFY.S.route.id == null && e.routeIn.includes("home") && IFY.S.state && IFY.S.state.track === "home")) return false;
    if (e.forbidRoute && e.forbidRoute === IFY.S.route.id) return false;
    if (e.requiresFactHard && !factAnyOk(e.requiresFactHard)) return false; // WP2（补丁稿 wp2-scheduler-year-patch，合并二期落）: 枚举事实硬门
    if (e.era && IFY.S.era !== e.era) return false;
    if (e.minYear && (IFY.S.birthYear || 1978) + IFY.S.age < e.minYear) return false; // 公历门（v0.11.0）：事件标注的最早公历年，出生年+年龄换算
    if (e.maxYear && (IFY.S.birthYear || 1978) + IFY.S.age > e.maxYear) return false; // 公历门下限对偶（v0.23 合并二期 F）：事件标注的最晚公历年；此前 maxYear 字段只有 p1_035 在用而 met 未消费，本轮起真生效（该条可达公历本就在界内，行为不变）
    if (e.eraIn && !e.eraIn.includes(IFY.S.era || "c2000")) return false;
    if (e.require && !(Array.isArray(e.require) ? e.require : [e.require]).every((f) => IFY.S.flags[f])) return false;
    if (e.forbid && (Array.isArray(e.forbid) ? e.forbid : [e.forbid]).some((f) => IFY.S.flags[f])) return false;
    if (e.all && !e.all.every((f) => IFY.S.flags[f])) return false;
    if (e.any && !e.any.some((f) => IFY.S.flags[f])) return false;
    if (e.state && !Object.entries(e.state).every(([dom, v]) => (Array.isArray(v) ? v.includes(IFY.S.state[dom]) : IFY.S.state[dom] === v))) return false; // 状态门（v0.12.0）：值可为单值或候选数组
    if (e.stateAll && !Object.entries(e.stateAll).every(([dom, v]) => (Array.isArray(v) ? v.includes(IFY.S.state[dom]) : IFY.S.state[dom] === v))) return false; // 与 state 同语义；区别只在抽取权重（state 对应旧 require 的 ×3，stateAll 对应旧 all/forbid 的 ×1，迁移按来源保真，见 docs/STATE-MATRIX.md §6）
    if (e.stateNot && Object.entries(e.stateNot).some(([dom, v]) => (Array.isArray(v) ? v.includes(IFY.S.state[dom]) : IFY.S.state[dom] === v))) return false;
    if (e.chain && !IFY.S.usedEvents.includes(e.chain) && !(IFY.S.usedRare || []).includes(e.chain)) return false;
    if (e.when && (e.when.lt !== undefined ? IFY.S.stats[e.when.stat] >= e.when.lt : IFY.S.stats[e.when.stat] <= e.when.gt)) return false;
    if (e.stats && !e.stats.every((c) => (c.lt !== undefined ? IFY.S.stats[c.k] < c.lt : IFY.S.stats[c.k] > c.gt))) return false;
    return true;
  }

  // ---------- 差一项求值（v0.20.0 M2 结算「差一步」）：与 met() 同口径逐项核对，返回未满足项清单 ----------
  // 纯读求值：不掷骰、不改状态。unmet 每项为结构化描述 {kind, ...}，呈现层（settlement.js）据此写人话；
  // evidenceMissing = 结局证据组还差几点（无 evidence 声明按 0）。判定逻辑只此一份，呈现层不复制 met。
  function unmetConditions(e) {
    const out = [];
    const S = IFY.S, F = (S && S.flags) || {};
    if (e.ctx && !IFY.ctxOk(e.ctx)) out.push({ kind: "ctx" });
    if (e.anyParentAlive && S.state.dad !== "alive" && S.state.mom !== "alive") out.push({ kind: "parents" });
    if (e.anyFamilyAlive && !(typeof IFY.anyFamilyAlive === "function" && IFY.anyFamilyAlive(S))) out.push({ kind: "family" }); // 判词批 D：与 met() 同读 record.js 派生本体
    if (e.kidMin != null && (S.kidsAt == null || S.age - S.kidsAt < e.kidMin)) out.push({ kind: "kidAge", need: e.kidMin, have: S.kidsAt == null ? null : S.age - S.kidsAt });
    if (e.kidMax != null && (S.kidsAt == null || S.age - S.kidsAt > e.kidMax)) out.push({ kind: "kidAgeMax", need: e.kidMax, have: S.kidsAt == null ? null : S.age - S.kidsAt });
    { const kb = S.kidsBornAt != null ? S.kidsBornAt : S.kidsAt; const ka = kb == null ? null : S.age - kb;
      if (e.kidAgeMin != null && (ka == null || ka < e.kidAgeMin)) out.push({ kind: "kidAgeTrue", need: e.kidAgeMin, have: ka });
      if (e.kidAgeMax != null && (ka == null || ka > e.kidAgeMax)) out.push({ kind: "kidAgeTrueMax", need: e.kidAgeMax, have: ka }); }
    if (e.petMin != null || e.petMax != null) { const pa = petAgesTrue(e);
      if (e.petMin != null && (!pa.length || Math.max(...pa) < e.petMin)) out.push({ kind: "petAge", need: e.petMin, have: pa.length ? Math.max(...pa) : null });
      if (e.petMax != null && (!pa.length || Math.min(...pa) > e.petMax)) out.push({ kind: "petAgeMax", need: e.petMax, have: pa.length ? Math.min(...pa) : null }); }
    if (e.flagAgeWithin && (S.flagAges == null || S.flagAges[e.flagAgeWithin.flag] == null || S.age - S.flagAges[e.flagAgeWithin.flag] > e.flagAgeWithin.years)) out.push({ kind: "flagAge", flag: e.flagAgeWithin.flag });
    if (e.flagAgeMin && (S.flagAges == null || S.flagAges[e.flagAgeMin.flag] == null || S.age - S.flagAges[e.flagAgeMin.flag] < e.flagAgeMin.years)) out.push({ kind: "flagAgeMin", flag: e.flagAgeMin.flag }); // 内容修复批：与 met() 的 flagAgeMin 同口径
    if (e.rehireAfterRetire && !(typeof IFY.hasRehireAfterRetire === "function" && IFY.hasRehireAfterRetire())) out.push({ kind: "rehireAfter" });
    if (e.route && (!S.route || e.route !== S.route.id)) out.push({ kind: "route", need: e.route });
    if (e.routeIn && !(S.route && e.routeIn.includes(S.route.id))) out.push({ kind: "routeIn", need: e.routeIn });
    if (e.forbidRoute && S.route && e.forbidRoute === S.route.id) out.push({ kind: "forbidRoute", need: e.forbidRoute });
    if (e.era && S.era !== e.era) out.push({ kind: "era", need: e.era });
    if (e.minYear && (S.birthYear || 1978) + S.age < e.minYear) out.push({ kind: "minYear", need: e.minYear });
    if (e.maxYear && (S.birthYear || 1978) + S.age > e.maxYear) out.push({ kind: "maxYear", need: e.maxYear }); // 出生年内容片 R5：与 minYear 对偶登记（此前只有 met() 消费 maxYear，「差一步」解释对 maxYear 条目缺一侧）；纯解释层，不改任何呈现判定
    if (e.eraIn && !e.eraIn.includes(S.era || "c2000")) out.push({ kind: "eraIn", need: e.eraIn });
    const reqList = e.require ? (Array.isArray(e.require) ? e.require : [e.require]) : [];
    for (const f of reqList) if (!F[f]) out.push({ kind: "flag", flag: f });
    if (e.forbid) for (const f of (Array.isArray(e.forbid) ? e.forbid : [e.forbid])) if (F[f]) out.push({ kind: "forbidFlag", flag: f });
    if (e.all) for (const f of e.all) if (!F[f]) out.push({ kind: "flag", flag: f });
    if (e.any && !e.any.some((f) => F[f])) out.push({ kind: "anyFlag", flags: e.any.slice() });
    for (const obj of [e.state, e.stateAll]) {
      if (!obj) continue;
      for (const [dom, v] of Object.entries(obj)) {
        const vals = Array.isArray(v) ? v : [v];
        if (!vals.includes(S.state[dom])) out.push({ kind: "state", dom, need: vals });
      }
    }
    if (e.stateNot) for (const [dom, v] of Object.entries(e.stateNot)) {
      const vals = Array.isArray(v) ? v : [v];
      if (vals.includes(S.state[dom])) out.push({ kind: "stateNot", dom, need: vals });
    }
    if (e.chain && !S.usedEvents.includes(e.chain) && !(S.usedRare || []).includes(e.chain)) out.push({ kind: "chain", chain: e.chain });
    if (e.when) {
      const have = S.stats[e.when.stat];
      const ok = e.when.lt !== undefined ? have < e.when.lt : have > e.when.gt;
      if (!ok) out.push({ kind: "stat", stat: e.when.stat, gt: e.when.gt, lt: e.when.lt, have });
    }
    if (e.stats) for (const c of e.stats) {
      const have = S.stats[c.k];
      const ok = c.lt !== undefined ? have < c.lt : have > c.gt;
      if (!ok) out.push({ kind: "stat", stat: c.k, gt: c.gt, lt: c.lt, have });
    }
    const ev = evidenceCount(e);
    return { unmet: out, evidence: ev, evidenceMissing: e.evidence ? Math.max(0, 2 - ev) : 0 };
  }

  // --- 稀有事件：条件是门票，骰子是第二道门（现行概率门不变，归 L2） ---
  function pickRare() {
    for (const r of IFY.D.rare || []) {
      if ((IFY.S.usedRare || []).includes(r.id)) continue;
      if (IFY.S.age < r.min || IFY.S.age > r.max) continue;
      if (!met(r)) continue;
      if (IFY.rngA() < (r.chance !== undefined ? r.chance : 0.1)) return r;
    }
    return null;
  }

  // 稀有「有资格」判定（不掷骰、不耗随机流）：只供 L1 抢占计数——危机顶掉的是「本年本可
  // 进稀有判定」的年份，抢占次数按此口径记账，不冒充骰子结果。
  function rareEligible() {
    for (const r of IFY.D.rare || []) {
      if ((IFY.S.usedRare || []).includes(r.id)) continue;
      if (IFY.S.age < r.min || IFY.S.age > r.max) continue;
      if (met(r)) return true;
    }
    return false;
  }

  function pickCrisis() {
    for (const [k] of IFY.STAT_META) {
      const c = IFY.D.crisis[k];
      if (c && !IFY.S.crisisUsed[k] && IFY.S.stats[k] < c.threshold) return { key: k, ...c };
    }
    return null;
  }

  // ---------- L2/L3 共用：候选池与层内权重（现行权重口径原样保留） ----------
  function eventPool() {
    return IFY.D.events.filter((e) =>
      IFY.S.age >= e.min && IFY.S.age <= e.max && !IFY.S.usedEvents.includes(e.id) && met(e));
  }
  function baseWeight(e) { // 回响事件（require/state 命中）与本年代事件权重更高；e.w 为数据权重倍数
    let n = 1;
    if (e.require || e.state) n = 3;
    if (e.era && e.era === IFY.S.era) n = Math.max(n, 3);
    if (e.w) n *= e.w;
    return n;
  }
  function weightedPick(cands) {
    const weighted = cands.flatMap((e) => Array(baseWeight(e)).fill(e));
    return weighted[Math.floor(IFY.rngA() * weighted.length)];
  }

  // ---------- L3 saliency（定版公式） ----------
  // 具体度 specificity：条目声明的非默认约束逐项计 1——require/forbid/any/all/state/stateAll/
  // stateNot/ctx/eraIn/minYear/kidMin/kidMax/kidAgeMin/kidAgeMax/petMin/petMax/flagAgeWithin 各算一，route 类（route/routeIn/
  // forbidRoute 任一）合算一，era（单年代）算一。when/stats 数值门不在此列（属阈值形状，不计）。
  // score = specificity
  //       + 本局未见加成（不在 usedEvents 记 1；候选池本已滤掉已用条目，此项恒生效，
  //         写进公式是为口径完整——「没活过的事优先于活过的」在池层面由过滤保证）
  //       + 最久未见加成 3 × 窗口相对进度 (age − min)/(max − min)（在本条窗口里已经等了
  //         多大比例：窄窗条目等比例涨分，不被宽窗条目的绝对年数压死）
  //       + 关窗加成（max − age ≤ 1 时 1：窗口快关了，再不讲就讲不成了）
  // 抽取：全池按分加权——权重 = baseWeight × (1 + round(score))，用 rngA 抽一条。
  // 分数即权重梯度：具体、久候、临窗的事占先数倍，但人人有份、谁都不归零。
  // （定版注，两次实测修正：①初版 ×2 具体度 + 1 分硬分段把低具体度条目成批饿死——4000 局
  // 零命中从 178 涨到 1163，故具体度改 ×1、久候改窗口相对进度；②3 分硬分段仍系统性排除
  // 「资格窗口短」的条目（父母状态门的晚年事件、无门窄窗事件：62 条 watchlist 在 4000 局
  // 里命中合计 541 → 1，16000 局零命中净增 33）——段外零权重对这类条目是绝杀，与具体度
  // 分值无关。故分段由硬门改权重梯度：分值公式一字未动，段外不再归零。）
  const SPEC_KEYS = ["require", "forbid", "any", "all", "state", "stateAll", "stateNot", "ctx", "eraIn", "minYear", "kidMin", "kidMax", "kidAgeMin", "kidAgeMax", "petMin", "petMax", "flagAgeWithin", "rehireAfterRetire"];
  function specificity(e) {
    let n = 0;
    for (const k of SPEC_KEYS) if (e[k] !== undefined) n++;
    if (e.route !== undefined || e.routeIn !== undefined || e.forbidRoute !== undefined) n++;
    if (e.era !== undefined) n++;
    return n;
  }
  function saliencyScore(e) {
    let s = specificity(e);
    if (!IFY.S.usedEvents.includes(e.id)) s += 1;
    const span = Math.max(1, e.max - e.min);
    s += 3 * Math.min(1, Math.max(0, (IFY.S.age - e.min) / span));
    if (e.max - IFY.S.age <= 1) s += 2; // 关窗加成（v3 定版取 2：16000 局后残余新零命中集中在关窗即死的窄窗/晚年条目，1 分不够顶进权重前列）
    return s;
  }
  // 路线开局配额（AN-3 D-3B）：study/gap/corp 路线在 22–27 岁的开局年里，若本路线
  // 专属条目（route===本路线，或 routeIn 恰为单值本路线）抽得太少——24 岁起应 ≥1、
  // 27 岁起应 ≥2——未抽过的专属条目权重 ×4。只加权不点名：池里有就显著占先，
  // 池里没有不硬造（与平淡年机制不冲突）；home 专属池深、abroad 专属池深且与
  // abroad 全面禁入行拍（D-2a）相冲，不设配额。已抽计数只读 usedEvents/usedRare
  // 现算，不进存档。
  const ROUTE_QUOTA_ROUTES = { study: true, gap: true, corp: true, farm: true }; // farm（农民路线立项补）：入口拍 routeIn 恰单值 farm，22–27 未抽到时 ×4 保线成立；本函数对非 farm 路线恒早退，老路线零影响
  let _routeItemById = null;
  function routeItemById(id) {
    if (!_routeItemById) {
      _routeItemById = {};
      for (const coll of [IFY.D.events, IFY.D.rare]) if (Array.isArray(coll)) for (const e of coll) if (e && e.id) _routeItemById[e.id] = e;
    }
    return _routeItemById[id] || null;
  }
  function routeDebtBoost(e) {
    const S = IFY.S;
    if (!S || !S.route || !ROUTE_QUOTA_ROUTES[S.route.id]) return false;
    if (S.age < 22 || S.age > 27) return false;
    const rid = S.route.id;
    const specific = (x) => !!x && (x.route === rid || (Array.isArray(x.routeIn) && x.routeIn.length === 1 && x.routeIn[0] === rid));
    if (!specific(e)) return false;
    const used = [...(S.usedEvents || []), ...(S.usedRare || [])];
    if (used.includes(e.id)) return false;
    const drawn = used.filter((id) => specific(routeItemById(id))).length;
    const want = (S.age >= 24 ? 1 : 0) + (S.age >= 27 ? 1 : 0);
    return drawn < want;
  }
  // ---------- 跨局避重（antirepeat 原型）：上一局见过的池事件，在本局 L3 抽取时软避 ----------
  // 数据面：IFY.avoidPrev 是开局时由 engine 侧装填的 Set（上一完局 usedEvents 的快照，见
  // engine.js 的 armAvoidance）；null/空集 = 未装填，本函数走原路径逐字不变（parity 基线）。
  // 作用域三重收窄：①只在本函数（L3 普通池）生效——链层 pickChain、稀有、危机、考试链头锚
  // 都不经此路，链条拍与结构拍一概不碰；②只对受控 Track 本人（IFY._lifeDepth===0）生效——
  // 影子无头步进恒在 withLife 内（depth≥1），读不到这份快照，影子抽取零影响；③指定种子局
  // （手填/链接/每日）开局不装填，复刻局与无历史时逐项一致。
  // 随机流纪律：三种模式（硬避/降权/关闭）都只改加权数组的构成，恒只消费一次 rngA()，
  // 与原口径同计数；不新增随机源、不用 Math.random——同种子＋同装填状态恒同局。
  // 断供纪律：降权模式下见过的条目至少保留 1 份权重、永不归零；新条目为 0 时整段关闭、
  // 原样抽取——避重最坏情况退化为现行行为，绝不因避重断供。
  const AVOID_MIN_FRESH = 10;  // 本抽候选里「没见过」的条数 ≥ 此值 → 硬避（本抽只在新条目里选）
  const AVOID_PENALTY = 0.12;  // 新条目只有 1..9 条 → 见过的条目权重 ×0.12（软避，不排除）
  IFY.avoidStats = { draws: 0, hard: 0, soft: 0, off: 0 }; // 诊断计数（原型用；不入存档、不入统计埋点）
  IFY.avoidDiag = []; // 诊断：受控 Track 的历次 L3 抽中 id（原型实测用；集成时可删）
  function pickSaliency(pool) {
    if (!pool.length) return null;
    const avoid = (IFY._lifeDepth || 0) === 0 ? IFY.avoidPrev : null;
    let eff = pool, penalty = false;
    if (avoid && avoid.size) {
      const fresh = pool.filter((e) => !avoid.has(e.id));
      if (fresh.length >= AVOID_MIN_FRESH) { eff = fresh; IFY.avoidStats.hard++; }
      else if (fresh.length > 0) { penalty = true; IFY.avoidStats.soft++; }
      else IFY.avoidStats.off++;
      IFY.avoidStats.draws++;
    }
    const weighted = [];
    for (const e of eff) {
      let n = baseWeight(e) * (1 + Math.round(saliencyScore(e))) * (routeDebtBoost(e) ? 4 : 1);
      if (penalty && avoid.has(e.id)) n = Math.max(1, Math.round(n * AVOID_PENALTY));
      for (let i = 0; i < n; i++) weighted.push(e);
    }
    const picked = weighted[Math.floor(IFY.rngA() * weighted.length)];
    if ((IFY._lifeDepth || 0) === 0) IFY.avoidDiag.push(picked.id);
    return picked;
  }

  // ---------- L2 链推进：分层抽取（替代 CHAIN_BOOST 权重硬顶） ----------
  function pickChain(pool) {
    const cands = pool.filter((e) => e.chain); // met() 已保证 chain 前置（usedEvents/usedRare）成立
    if (!cands.length) return null;
    // 关窗保底（沿 v0.14.0 意）：后继只剩最后两年窗口时，先以 1/2 概率在关窗后继中等概率直抽
    const closing = cands.filter((e) => IFY.S.age >= e.max - 1);
    if (closing.length && IFY.rngA() < 0.5) return closing[Math.floor(IFY.rngA() * closing.length)];
    return weightedPick(cands);
  }

  // pickEvent 兼容入口（探针/旧调用点）：分层抽取 = 链层 → saliency 层，不含平淡年/微年判定。
  function pickEvent() {
    const pool = eventPool();
    return pickChain(pool) || pickSaliency(pool);
  }

  // ---------- L0 锚点信息（只读登记表，不改触发机制） ----------
  function anchorInfo(age) {
    if (!ANCHORS) return { fork: false, glimpse: false, procBeats: [] };
    return {
      fork: ANCHORS.forks.some((f) => f.age === age && (!f.route || (IFY.S.route && f.route === IFY.S.route.id))),
      glimpse: ANCHORS.glimpseAges.includes(age),
      procBeats: ANCHORS.procBeats.map((b) => b.id),
    };
  }

  // ---------- 年份计划：五层仲裁的唯一入口 ----------
  // 返回 { kind: "crisis"|"rare"|"event"|"flat"|"micro", ... }；进程拍/分岔/瞥视（L0）已由
  // step() 在调用本函数之前处理，本函数只仲裁内容时槽（稀有/危机/事件/平淡/微年）。
  function planYear() {
    const plan = { age: IFY.S.age, anchors: anchorInfo(IFY.S.age), kind: null, layer: null };
    // L1 危机抢占
    const crisis = pickCrisis();
    if (crisis) {
      plan.kind = "crisis"; plan.layer = 1; plan.crisis = crisis;
      schedStats.crisis++;
      if (rareEligible()) schedStats.crisisPreempt++; // 同年有合格稀有候选：抢占实际发生
      return plan;
    }
    // L2 稀有（概率门不变）
    const rare = pickRare();
    if (rare) { plan.kind = "rare"; plan.layer = 2; plan.rare = rare; schedStats.rare++; return plan; }
    const pool = eventPool();
    // L2 考试链头锚（v0.20.1 W9）：home 路线（route=home 或序章 home 轨道 track=home）在
    // 22–25 岁窗内、岗位表 p16_001 尚未呈现且本年 met 通过时，链头优先占本年内容时槽——
    // 与 L2 链推进同层（链头落下后，后续拍自走 pickChain 的分层保底）。这是 anchors.js
    // 「锚点」口径在调度层的落点：锚点不新造抽取层，只在既有 L2 内先认链头。
    const headAnchor = (IFY.D.events || []).find((e) => e.id === "p16_001");
    if (headAnchor && IFY.S.age >= 22 && IFY.S.age <= 25 && IFY.S.route &&
        (IFY.S.route.id === "home" || (IFY.S.state && IFY.S.state.track === "home")) &&
        !IFY.S.usedEvents.includes("p16_001") && met(headAnchor)) {
      plan.kind = "event"; plan.layer = 2; plan.event = headAnchor; schedStats.examAnchor++; schedStats.chain++;
      return plan;
    }
    // L2 链推进（分层抽取）
    const chained = pickChain(pool);
    if (chained) { plan.kind = "event"; plan.layer = 2; plan.event = chained; schedStats.chain++; return plan; }
    // 温度 derive 消费：平淡年判定（L1/L2 落空后、L3 之前；flatShare 公式在 rhythm.js）
    const flatShare = IFY.rhythmOf(IFY.S).flatShare;
    if (IFY.RHYTHM && flatShare > 0 && IFY.rngA() < flatShare) {
      plan.kind = "flat"; plan.layer = 4;
      const fa = IFY.RHYTHM.flatAdult;
      let cand = fa.map((_, i) => i).filter((i) => flatLineOk("flat", i));
      if (!cand.length) cand = fa.map((_, i) => i).filter((i) => !FLAT_ADULT_NEEDS[i]); // 滤空回落无预设行
      if (!cand.length) cand = fa.map((_, i) => i);
      plan.flat = fa[cand[Math.floor(IFY.rngA() * cand.length)]];
      schedStats.flat++; schedStats.flavorYears++;
      return plan;
    }
    // L3 saliency
    const e = pickSaliency(pool);
    if (e) { plan.kind = "event"; plan.layer = 3; plan.event = e; schedStats.l3++; return plan; }
    // L4 风味填充：本年无任何 L1–L3 内容才落微年（候选先经事实守卫，未用行被事实全拦时回落无预设行）
    plan.kind = "micro"; plan.layer = 4;
    const allIdx = IFY.D.micro.map((_, i) => i);
    let fresh = allIdx.filter((i) => !IFY.S.microUsed.includes(i) && flatLineOk("micro", i));
    if (!fresh.length) fresh = allIdx.filter((i) => !MICRO_FLAT_NEEDS[i]);
    if (!fresh.length) fresh = allIdx;
    plan.microIdx = fresh[Math.floor(IFY.rngA() * fresh.length)];
    schedStats.micro++; schedStats.flavorYears++;
    return plan;
  }

  // ---------- 平年两池事实守卫（判词批 E）：预设型平年文在抽点过滤，不落渲染层 ----------
  // micro 是纯字符串数组、条目没有字段位，事实要求用「下标 → factOk 的 needs」侧表表达；
  // 池本体（events.js）一字不动——老存档 microUsed 存的正是下标，顺序/长度/文本冻结才不串位。
  // flatAdult 同走一套（侧表按下标记忆）：现 5 条逐条审计均无事实预设、表为空——防线先立，
  // 将来往任一池加带预设的行，只需在对应侧表登记，不必再动抽点。
  // 判定复用 factOk 词表、只读现行 state（state/stateNot），不读只增不减的旧旗（与 D 片纪律同）。
  // 过滤必须落在 planYear 的两个抽点：year.js 的 flatCarry 挂起行是上一年已抽定的文本，
  // 渲染侧再过滤会被合并呈现绕过；抽点过滤后，挂起行天然只来自合格候选。
  // 影子轨（shadow-life stepYearHeadless）消费同一 planYear、按影子自身状态求值，同受此守卫。
  const MICRO_FLAT_NEEDS = {
    1: { stateNot: { workPhase: ["retired"] } }, // 「工资照发，饭照吃」：完全退休后领的是退休金，不发工资（part 半退仍有工钱，不拦）
    4: { state: { mom: ["alive"] } }, // 「母亲寄来一箱橘子」：母亲已故即不出
  };
  const FLAT_ADULT_NEEDS = {
    // 退休可能性池回响行（下标 5–13，退休池批）：与 MICRO 侧表的事实纪律同——文本不得与
    // 当前事实打架：一次性落定的旗用回望口径（「那年」「那几年」），持续性状态（店还开着、
    // 还在带学员、还在卖货）才用现在时；摆摊行另以 notFlag 挡已收摊的局。
    5: { flag: "travel_paused" }, // 没出远门的那年（回望口径）
    6: { flag: "travel_kept" }, // 相册在茶几上（常设物，无时点断言）
    7: { flag: "cruise_world" }, // 手头紧的那阵子（回望口径）
    8: { flag: "shop_kept" }, // 小店还开着（kept 与 closed/grew 互斥，恒真）
    9: { flag: "grandkid_full" }, // 带娃那几年（回望口径）
    10: { flag: "house_fixed" }, // 修完那年冬天（事件锚，回望口径）
    11: { flag: "stall_started", notFlag: "stall_paused" }, // 小摊进项（收摊后不出）
    12: { flag: "class_helper" }, // 带新学员（持续角色）
    13: { flag: "stream_sold" }, // 直播进项（sold 与 closed/fun 互斥，恒真）
  };
  function flatLineOk(pool, idx) {
    return factOk((pool === "micro" ? MICRO_FLAT_NEEDS : FLAT_ADULT_NEEDS)[idx]);
  }

  Object.assign(IFY, { factOk, evidenceCount, met, unmetConditions, kidAgeTrue, petAgesTrue, pickRare, pickCrisis, pickEvent,
    planYear, saliencyScore, specificity, eventPool, pickChain, pickSaliency, rareEligible,
    flatLineOk, flatMicroNeeds: MICRO_FLAT_NEEDS, flatAdultNeeds: FLAT_ADULT_NEEDS,
    anchors: ANCHORS, anchorInfo, schedStats });
})(window.IFY);
