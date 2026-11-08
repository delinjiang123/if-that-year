// [模块]《如果那年》引擎分片：职业层地基（第 1 期 P1-2）——伏笔种子账 seeds 与履历账 career
// 的唯一写点（careerNote）与只读派生（careerOf / careerSpells / seedsOf），外加老档回填
// （backfillCareer）与职业自有派生流（careerRng）。加载顺序见 index.html：
// src/world/processes/work.js 之后、src/scheduler.js 之前。
//
// 平行账纪律（本批的命门）：career / seeds 只写不读——现行任何逻辑（工资、退休、
// scheduler、结算、判词）都不许读这两本账改行为；本文件自身也不读它们做任何裁决，
// 只按立旗应用序把事实记下来，供第 1 期后续批次（埋种/关口/影子）消费。
// 记账失败绝不许带崩游玩：careerNote 全程 fail-closed（注册表缺失即整点 no-op、
// 异常吞掉），与 engine.save() 的容错纪律同款。
//
// flag → trade / form 的单一事实源是行当注册表 src/content/trades.js（GAME_TRADES，
// 经 index.html 在 state.js 之前载入）：本文件不另存映射表，运行时从注册表惰性现读；
// 注册表不在场（旧工具沙盒等）时记账整体停摆，绝不凭记忆硬记。
(function (IFY) {
  "use strict";

  // 下岗 / 单位没了：落下即当前段收尾、开一段 idle（设计 §1.2 点名的两条；
  // p13_023 是 p7_034 的同型变体）。退休不在此列——退休靠 src 的 setState 声明读。
  const IDLE_EVENT_IDS = { p7_034: true, p13_023: true };
  // 机会层入行旗：与 work.js ENTRY_OPPORTUNITY_FLAGS 逐字同步（回填候选口径要用）。
  // work.js 那份是主线派生的源头；本处漂移会被 validate-state 的回填对账测试逮住。
  const OPPORTUNITY_FLAGS = { write_work: true, care_work: true, gig_work: true, courier_work: true };

  // 职业流的哈希/步进优先用 engine.js 的 IFY.seedFromString / IFY.mulberry（同种子同
  // 序列的正主）；两者不在场（隔离工具沙盒）时回落本文件内的同算法副本——算法与
  // engine.js 逐字一致（FNV-1a + mulberry32 单步），回落只为可独立装载，不改序列。
  function fnv1a(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function mulberryStep(st) {
    st.a |= 0; st.a = (st.a + 0x6D2B79F5) | 0;
    let t = Math.imul(st.a ^ (st.a >>> 15), 1 | st.a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const seedHash = () => (typeof IFY.seedFromString === "function" ? IFY.seedFromString : fnv1a);
  const stepFn = () => (typeof IFY.mulberry === "function" ? IFY.mulberry : mulberryStep);

  // 注册表惰性现读：{ 入行旗: { trade, form } }；注册表缺失返回 null（调用方 no-op）。
  function tradesByFlag() {
    const T = typeof window !== "undefined" ? window.GAME_TRADES : null;
    if (!T || typeof T !== "object") return null;
    const m = {};
    for (const id of Object.keys(T)) {
      const row = T[id];
      if (row && typeof row.flag === "string") m[row.flag] = { trade: id, form: row.form };
    }
    return m;
  }

  // career 壳（设计 §1.1）：诞生时不建（一格未消费），首次关口开门或首次入行时
  // 由唯一写点建。legacy 只记账（D12：老档转行门不堵），无任何门读它。
  function newCareerShell() { return { v: 1, rngA: 0, gateDefers: 0, spells: [], idle: [] }; }
  function ensureCareer(S) {
    if (!S.career || typeof S.career !== "object" || Array.isArray(S.career)) S.career = newCareerShell();
    const c = S.career;
    if (!Array.isArray(c.spells)) c.spells = [];
    if (!Array.isArray(c.idle)) c.idle = [];
    if (typeof c.rngA !== "number") c.rngA = 0;
    if (typeof c.gateDefers !== "number") c.gateDefers = 0;
    if (c.v == null) c.v = 1;
    return c;
  }
  function openSpell(c) {
    for (let i = c.spells.length - 1; i >= 0; i--) if (c.spells[i] && c.spells[i].to == null) return c.spells[i];
    return null;
  }
  function openIdle(c) {
    for (let i = c.idle.length - 1; i >= 0; i--) if (c.idle[i] && c.idle[i].to == null) return c.idle[i];
    return null;
  }
  function closeIdle(c, age) { const d = openIdle(c); if (d) d.to = age; }

  // 记账本体（设计 §1.2 的语义表逐行）：age / via 由调用方给——实机走 careerNote
  // （当岁、via="chain"，关口批落地后才有 seed/inherit/cold 来源），回填走
  // backfillCareer（历史年龄、via="legacy"）。src 是触发拍的条目/选项本体，只读它
  // 的 set / id / setState 三个声明字段，不读任何已算出的行为结果。
  // 退休的读法：同一应用点的 src 带 setState.workPhase === "retired" 声明即给当前段
  // 收尾——各挂点 applyState 的先后不一律，以声明为准，不看流转是否已发生。
  function noteAt(S, src, age, via) {
    if (!S || typeof S !== "object" || !src || typeof src !== "object") return;
    const byFlag = tradesByFlag();
    if (!byFlag) return; // 注册表不在场：整点 no-op（fail-closed）
    const flag = typeof src.set === "string" ? src.set : null;
    const row = flag ? byFlag[flag] : null;
    const idleHit = !!(src.id && IDLE_EVENT_IDS[src.id]);
    const retired = !!(src.setState && src.setState.workPhase === "retired");
    if (!row && !idleHit && !retired) return; // 与本账无关的拍：不建壳、不记账
    // 壳只在真要落一笔时才建（§1.1：首次入行/关口开门才建壳）：从没入过行的人被
    // 下岗/退休拍擦过，不许留一副空壳——peek 只读现有账，getC 才建壳。
    const peek = () => (S.career && typeof S.career === "object" && !Array.isArray(S.career) && Array.isArray(S.career.spells)) ? openSpell(S.career) : null;
    let c = null;
    const getC = () => { if (!c) c = ensureCareer(S); return c; };
    if (row) {
      const cur = peek();
      if (!cur || cur.flag !== flag) { // 同旗且段未收尾再落 = no-op（防重复 set 记重账）
        const cc = getC();
        if (cur) cur.to = age; // 已有当前段又落别旗：旧段当岁收尾、新段当岁起（同岁双段都记）
        closeIdle(cc, age); // 段从 idle 里接上：合上待业段
        cc.spells.push({ trade: row.trade, flag, form: row.form, from: age, to: null, via, viaNote: null, coldKind: null, fond: false });
      }
    }
    if (idleHit) {
      const cur = peek();
      if (cur) { cur.to = age; const cc = getC(); if (!openIdle(cc)) cc.idle.push({ from: age, to: null }); }
    }
    if (retired) { const cur = peek(); if (cur) cur.to = age; }
  }

  // 唯一写点：挂在立入行旗的应用序同一步（紧贴 houseOnBuyFlag 之后，呈现层与无头
  // 解决器镜像同位）。本批只记账、无消费者。
  function careerNote(S, src) {
    try { noteAt(S, src, S ? S.age : null, "chain"); } catch (e) { /* 记账失败不带崩游玩 */ }
  }

  // 只读派生（设计 §1.1）：当前段（未收尾的那段）；无账/无段/坏账一律 null（fail-closed）。
  function careerOf(S) {
    if (!S || !S.career || typeof S.career !== "object" || !Array.isArray(S.career.spells)) return null;
    const cur = openSpell(S.career);
    if (!cur) return null;
    return { trade: cur.trade, flag: cur.flag, form: cur.form, from: cur.from, years: typeof S.age === "number" ? S.age - cur.from : null };
  }
  function careerSpells(S) {
    return S && S.career && typeof S.career === "object" && Array.isArray(S.career.spells) ? S.career.spells : [];
  }
  function seedsOf(S) { return S && Array.isArray(S.seeds) ? S.seeds : []; }

  // 职业自有派生流（设计 §六）：种子 + "#career"（影子轨 "#shadow#career"，认人法与
  // applySplitFactToShadow 同款：session.tracks.B.state === S 即影子轨；无 session
  // 的 sim 口径一律按主轨）。流状态不落对象：计数存 career.rngA，取数时按种子重建
  // 流、快进 rngA 次再取下一值（照 prologue P.a 的存法——计数可序列化、跨存档稳定）。
  // 本批无消费者，只供后续批次与对账测试。
  function careerSeedOf(S) {
    const base = S && S.seedStr != null ? String(S.seedStr) : "";
    const sess = IFY.session;
    const isB = !!(sess && sess.tracks && sess.tracks.B && sess.tracks.B.state === S);
    return base + (isB ? "#shadow#career" : "#career");
  }
  function careerRng(S) {
    if (!S || typeof S !== "object") return null;
    const c = ensureCareer(S);
    const st = { a: seedHash()(careerSeedOf(S)) };
    const step = stepFn();
    const n = c.rngA | 0;
    for (let i = 0; i < n; i++) step(st);
    const v = step(st);
    c.rngA = n + 1;
    return v;
  }

  // 老档回填（设计 §3.2 + D1 存实账 + D12 不堵门）：读入时（engine.js loadSave 的
  // 回填链经同名转发调到这里）对没有 career 的 Track 逐轨执行——
  //   候选集与 work.js mainEntryOfState 同口径再收一层：机会旗恒候选，其余旗须
  //   账本里真有该旗的 set 载体条目（无载体的旗落点年龄无从考证，不硬凑段）；
  //   按账本顺序把 set 记录 / 下岗与单位没了 / workPhase>retired 流转逐条过
  //   noteAt 的同一套语义（via 记 "legacy"），候选里账本无 set 记录的旗以
  //   flagAges 落点（缺则 22，与 work.js 缺省同值）补一条；
  //   最后对账护栏：现行 mainEntryOfState 的答案与走账当前段不一致时，以派生
  //   为准修正当前段（只动当前段归属，历史段一字不动）；护栏补不开（主入行旗
  //   最近落点早于当前段起点，硬补会造出负长段）时留原账并打 guardSkipped 记号，
  //   只记账、无任何门读它。已有 career 的档（本批起的新档）只修形状不重建。
  function backfillCareer(t) {
    if (!t || typeof t !== "object") return;
    if (!Array.isArray(t.seeds)) t.seeds = [];
    if (t.career && typeof t.career === "object" && !Array.isArray(t.career)) { ensureCareer(t); return; }
    const byFlag = tradesByFlag();
    if (!byFlag) return; // 注册表不在场：不建账，career 留空——各读点按无账读（fail-closed）
    const c = ensureCareer(t);
    c.legacy = true;
    const flags = t.flags || {};
    const flagAges = t.flagAges || {};
    const ledger = Array.isArray(t.ledger) ? t.ledger : [];
    const ledgerSet = new Set();
    for (const e of ledger) if (e && typeof e.set === "string") ledgerSet.add(e.set);
    const isCand = (f) => !!(byFlag[f] && flags[f] && (OPPORTUNITY_FLAGS[f] || ledgerSet.has(f)));
    const evs = [];
    ledger.forEach((e, i) => {
      if (!e || typeof e !== "object") return;
      const age = typeof e.age === "number" ? e.age : (typeof t.age === "number" ? t.age : 22);
      if (typeof e.set === "string" && isCand(e.set)) evs.push({ age, ord: i, src: { set: e.set } });
      else if (e.id && IDLE_EVENT_IDS[e.id]) evs.push({ age, ord: i, src: { id: e.id } });
      else if (e.kind === "state" && e.id === "workPhase>retired") evs.push({ age, ord: i, src: { setState: { workPhase: "retired" } } });
    });
    const seen = new Set();
    for (const x of evs) if (x.src.set) seen.add(x.src.set);
    for (const f of Object.keys(byFlag)) {
      if (isCand(f) && !seen.has(f)) evs.push({ age: typeof flagAges[f] === "number" ? flagAges[f] : 22, ord: Number.MAX_SAFE_INTEGER, src: { set: f } });
    }
    evs.sort((a, b) => (a.age - b.age) || (a.ord - b.ord));
    for (const x of evs) { try { noteAt(t, x.src, x.age, "legacy"); } catch (e) { /* 单条坏记录不拦整档读入 */ } }
    const m = typeof IFY.mainEntryOfState === "function" ? IFY.mainEntryOfState(t) : null;
    if (m && byFlag[m]) {
      const cur = openSpell(c);
      // 护栏只修两种情形：(a) 走账有未收尾段但归属与派生不一致；(b) 走账一段都没有
      // （主入行旗无 set 载体记录、walk 无从起段）而派生有答案。走账已把当前段以
      // 下岗/退休正常收尾时 careerOf 为空本就是对的——mainEntryOf 不认退休/下岗，
      // 这种档不许护栏把已收尾的段再补开。
      if (cur && cur.flag !== m) {
        let age = typeof flagAges[m] === "number" ? flagAges[m] : 22;
        for (let i = ledger.length - 1; i >= 0; i--) { const e = ledger[i]; if (e && e.set === m && typeof e.age === "number") { age = e.age; break; } }
        if (age >= cur.from) {
          cur.to = age;
          closeIdle(c, age);
          c.spells.push({ trade: byFlag[m].trade, flag: m, form: byFlag[m].form, from: age, to: null, via: "legacy", viaNote: null, coldKind: null, fond: false });
        } else c.guardSkipped = true; // 补不开：留原账、打记号（只记账，无门读）
      } else if (!cur && c.spells.length === 0 && !(t.state && t.state.workPhase === "retired")) {
        const age = typeof flagAges[m] === "number" ? flagAges[m] : 22;
        c.spells.push({ trade: byFlag[m].trade, flag: m, form: byFlag[m].form, from: age, to: null, via: "legacy", viaNote: null, coldKind: null, fond: false });
      }
    }
  }

  Object.assign(IFY, { careerNote, careerOf, careerSpells, seedsOf, careerRng, backfillCareer });
})(window.IFY);
