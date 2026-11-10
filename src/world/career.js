// [模块]《如果那年》引擎分片：职业层地基（第 1 期 P1-2）——伏笔种子账 seeds 与履历账 career
// 的唯一写点（careerNote）与只读派生（careerOf / careerSpells / seedsOf），外加老档回填
// （backfillCareer）与职业自有派生流（careerRng）。加载顺序见 index.html：
// src/world/processes/work.js 之后、src/scheduler.js 之前。
// 第 1 期 P1-4 追加（文件尾段）：入行关口的开门判定 gateDue、菜单组装 gateForkView、
// 回指句纯函数 gateEchoLine（P1-6 已激活：总开关打开、step/无头两侧已接线，详见尾段头注）。
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
  const OPPORTUNITY_FLAGS = { write_work: true, care_work: true, gig_work: true, courier_work: true, photo_work: true };

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

  // 记账本体（设计 §1.2 的语义表逐行）：age / via / viaNote / coldKind 由调用方
  // 给——实机走 careerNote（当岁；P1-6 激活后关口兑现项带 seed/inherit/cold 来源
  // 与出处注记，余者 chain），回填走 backfillCareer（历史年龄、via="legacy"）。
  // src 是触发拍的条目/选项本体，只读它的 set / id / setState 三个声明字段（关口
  // 兑现项另读 via/trade/seedBeat/seedAge/viaFact/coldKind 六个来源字段，careerNote
  // 先验自洽才透传），不读任何已算出的行为结果。
  // 退休的读法：同一应用点的 src 带 setState.workPhase === "retired" 声明即给当前段
  // 收尾——各挂点 applyState 的先后不一律，以声明为准，不看流转是否已发生。
  function noteAt(S, src, age, via, viaNote, coldKind) {
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
        cc.spells.push({ trade: row.trade, flag, form: row.form, from: age, to: null, via, viaNote: viaNote || null, coldKind: coldKind || null, fond: false });
      }
    }
    if (idleHit) {
      const cur = peek();
      if (cur) { cur.to = age; const cc = getC(); if (!openIdle(cc)) cc.idle.push({ from: age, to: null }); }
    }
    if (retired) { const cur = peek(); if (cur) cur.to = age; }
  }

  // 唯一写点：挂在立入行旗的应用序同一步（紧贴 houseOnBuyFlag 之后，呈现层与无头
  // 解决器镜像同位）。P1-6 激活后兼数件事：关口推后项只记推后账（gateDefers/
  // gateDeferAge，gateCooling 读）、关口兑现项按选项上的来源字段落 via/viaNote/
  // coldKind、干出感情项按 careerFond 声明给当前段置 fond（第 2 期 P2-3）、其余
  // 一律 chain（既有挂点行为一字不变）。
  function careerNote(S, src) {
    try {
      if (!S || typeof S !== "object" || !src || typeof src !== "object") return;
      if (src.gateDefer === true) {
        const c = ensureCareer(S);
        if (c) {
          c.gateDefers = (typeof c.gateDefers === "number" ? c.gateDefers : 0) + 1;
          if (typeof S.age === "number") c.gateDeferAge = S.age;
        }
        return;
      }
      // 干出感情（第 2 期 P2-3）：选项带 careerFond 声明（如 cr_fond_cold 的「长干
      // 下去」）即给当前未收尾段置 fond=true。形状照 gateDefer 分支（声明在选项上、
      // 本点只落这一笔、落完即回），但只读现有账找当前段——无当前段（未入行/待业/
      // 已退休）即无段可记，不许为一面感情旗建空壳（§1.1 空壳纪律）。
      if (src.careerFond === true) {
        const c = (S.career && typeof S.career === "object" && !Array.isArray(S.career) && Array.isArray(S.career.spells)) ? S.career : null;
        const cur = c ? openSpell(c) : null;
        if (cur) cur.fond = true;
        return;
      }
      let via = "chain", viaNote = null, coldKind = null;
      if (src.via === "seed" || src.via === "inherit" || src.via === "cold") {
        const TR = (typeof window !== "undefined" && window.GAME_TRADES) || null;
        const row = TR && typeof src.trade === "string" ? TR[src.trade] : null;
        if (row && typeof src.set === "string" && row.flag === src.set) {
          via = src.via;
          if (via === "seed") viaNote = { beatId: typeof src.seedBeat === "string" ? src.seedBeat : null, age: typeof src.seedAge === "number" ? src.seedAge : null };
          else if (via === "inherit") viaNote = { factId: typeof src.viaFact === "string" ? src.viaFact : null };
          if (via === "cold" && typeof src.coldKind === "string" && src.coldKind) coldKind = src.coldKind;
        }
      }
      noteAt(S, src, S.age, via, viaNote, coldKind);
    } catch (e) { /* 记账失败不带崩游玩 */ }
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

  // 埋种唯一写点（第 1 期 P1-3，设计 §2.1/§2.3）：内容在拍上声明 seed（选项，所选
  // 才落，kind=choice）/ seedOnShow（条目或变体呈现即落，kind=seen）+ seedNote
  // （回指句出处，必填），呈现层各挂点把声明对象递进来，本函数统一落账：
  // 记录 { trade, age, beatId, kind, seedNote }，只写 seeds 一本账，不碰任何状态
  // 与任何一条流（埋种零随机：只看选了什么、呈现了什么）。fail-closed：注册表
  // 缺席、行当未登记、缺 seedNote、岁数/拍 id 对不上——一律不落（数据层的缺口
  // 由 validate-storylet 在仓内拦，不靠运行时兜底）；同拍同行当只记一颗（读侧
  // seedStrengthOf 同口径去重）；一拍至多 2 颗在此再截一道。
  function plantSeed(S, src, beatId, age) {
    try {
      if (!S || !src || typeof src !== "object") return;
      const TR = (typeof window !== "undefined" && window.GAME_TRADES) || null;
      if (!TR) return;
      const bid = typeof beatId === "string" && beatId ? beatId : (typeof src.id === "string" && src.id ? src.id : null);
      const at = typeof age === "number" ? age : (typeof S.age === "number" ? S.age : null);
      if (!bid || at == null) return;
      const note = typeof src.seedNote === "string" && src.seedNote ? src.seedNote : null;
      if (!note) return;
      const decls = [];
      const collect = (v, kind) => {
        if (v == null) return;
        for (const t of Array.isArray(v) ? v : [v]) if (typeof t === "string" && t) decls.push({ trade: t, kind });
      };
      collect(src.seedOnShow, "seen");
      collect(src.seed, "choice");
      if (!decls.length) return;
      if (!Array.isArray(S.seeds)) S.seeds = [];
      let planted = 0;
      for (const d of decls) {
        if (planted >= 2) break;
        if (!TR[d.trade]) continue;
        if (S.seeds.some((r) => r && r.beatId === bid && r.trade === d.trade)) continue;
        S.seeds.push({ trade: d.trade, age: at, beatId: bid, kind: d.kind, seedNote: note });
        planted++;
      }
    } catch (e) { /* 埋种永不许打断呈现 */ }
  }

  // 出生拷贝（第 1 期 P1-5，设计 §5.1/§5.3）：影子在选路合流时诞生，政策是「分岔
  // 之前是同一个人」——src（主轨）在 22 岁前埋下的种子整表深拷贝给 dst（影子），
  // 拷贝后两轨各记各的、互不可见（withLife 纪律）。拷贝是种子账的写侧动作，归本
  // 文件（账本主）执行：birthShadow 只调这一口，不直读种子账（§2.3.1 白名单纪律，
  // validate-storylet 的静态扫描同口径）。只读 src、零随机、不碰任何一条流；记录
  // 逐条验形——trade 为非空串、age 为数字且 <22 才拷（§5.3 的边界：22 岁起两轨
  // 的种互不可见，恰 22 与更大的不拷），坏记录按无此种读（§1.4 炸档防线）。
  // fail-closed：任何异常按没拷成处理，绝不带崩出生。返回实拷条数（只供验收）。
  function inheritSeedsAtBirth(dst, src) {
    try {
      if (!dst || typeof dst !== "object" || !src || typeof src !== "object") return 0;
      const list = Array.isArray(src.seeds) ? src.seeds : [];
      const picked = [];
      for (const r of list) {
        if (!r || typeof r !== "object") continue;
        if (typeof r.trade !== "string" || !r.trade) continue;
        if (typeof r.age !== "number" || !(r.age < 22)) continue;
        picked.push(r);
      }
      dst.seeds = JSON.parse(JSON.stringify(picked));
      return dst.seeds.length;
    } catch (e) { return 0; }
  }

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

  // ================= 第 1 期 P1-4：入行关口（P1-6 激活） =================
  // 关口 = 进程呈现的 procOnly 分岔（fork_gate_first / fork_gate_switch，本体已于
  // P1-6 毕业进 src/events.js 的 GAME_DATA.forks 并登记锚点，只写框骨架与兜底
  // 选项、呈现层永不改动本体），照 fork_kid 的全套形状：开门判定 gateDue、呈现
  // 定形 gateForkView、回指句纯函数 gateEchoLine，三者都在本文件（D7：职业代码
  // 归 career.js；与 kidGateDue/kidForkView 在 spouse.js 的进程归属同理）。
  // P1-6 激活接线：engine 的 step() 与 shadow-life 的 stepYearHeadless() 在
  // workPhaseDue/工资轮之后、年龄分岔之前同点判定（两轨同规，政策 F 本体与打分
  // 零改动）；总开关 GAME_GATE_SWITCH（trades.js）已打开，gateDue 先查开关、
  // 关时恒假——回滚只改那一处。careerNote 已接线认选项上的 via/coldKind/指针
  // 字段与推后账（见 careerNote 本体）。
  // 读账纪律：gateDue 只读账、零随机、fail-closed；gateForkView 的一切随机只走
  // 职业自有流 careerRng（冷门抽取与类型抽取），主流一格不动。seeds 的读取点
  // 只许在本段（关口组装）与 seedsOf/plantSeed 一侧——§2.3.1 白名单，本段之外
  // 不许新增 seeds 读点。

  // 行当与冷门类型的工作文案名（P1-6 文案审定稿后换；机制只消费 trade id，
  // 名字错位不影响任何判定）。冷门类型的 sub 是「平摆」的渠道说明句，无回指。
  const GATE_TRADE_LABEL = {
    farm: "种地", township: "进乡镇企业", farm_returned: "回地里种地", exam_landed: "考公上岸",
    shop: "开个小店", gig: "接零活干", courier: "送快递", care: "做陪护", write: "靠写稿吃饭",
    factory: "进厂", fab: "进半导体厂", craft: "学门手艺", heavy: "进钢铁厂", miner: "下矿",
    truck: "跑长途货车", med_hosp: "进医院", med: "当医生", nurse: "当护士", img: "去影像科",
    teach: "去教书", acct: "做财会", fin: "去证券营业部", press: "进报社", dev: "做软件开发",
    driver_taxi: "开出租车", grad: "进课题组深造", photo: "当摄影师", builder: "上工地",
  };
  // 关口选项的六维效果（P1-6 激活批定实，§5.2 硬要求：影子无头轨政策 F 第 3 级
  // 靠 effects 打分，空对象会让关口选项对影子恒 0 分、政策退化到位置兜底）。
  // 口径：与存量年龄分岔的选项同量级（±2..5），按行当的真实形状分——挣钱的行
  // 伤身或费自由、养人的行长关系，代价写在数字里不另贴价签。只在 gateForkView
  // 组装时消费（经 gateFx 拷贝），工资/调度一概不读本表。
  const GATE_TRADE_FX = {
    farm: { health: 2, money: -2, freedom: 3 }, shop: { money: 3, freedom: 2, growth: 2, health: -1 },
    gig: { freedom: 4, money: 1, health: -1 }, courier: { money: 3, health: -3, freedom: 1 },
    care: { relation: 3, money: 2, health: -2 }, write: { growth: 3, wisdom: 2, money: 1, freedom: 2 },
    factory: { money: 3, growth: 1, health: -2, freedom: -1 }, fab: { money: 4, growth: 3, health: -2 },
    craft: { growth: 4, money: 2, freedom: 1 }, heavy: { money: 3, health: -4, relation: 1 },
    miner: { money: 4, health: -5, freedom: -1 }, truck: { money: 4, health: -3, freedom: 2, relation: -2 },
    med_hosp: { money: 3, growth: 3, relation: 1, health: -1 }, med: { growth: 4, wisdom: 3, relation: 2, money: 2, health: -2 },
    teach: { relation: 3, wisdom: 3, growth: 2, money: 1, freedom: 1 }, acct: { money: 2, growth: 3, wisdom: 1, freedom: -1 },
    fin: { money: 4, growth: 2, wisdom: 1, health: -1 }, press: { growth: 3, wisdom: 3, relation: 1, money: 1 },
    dev: { money: 4, growth: 4, health: -2, freedom: 1 }, driver_taxi: { money: 3, freedom: 3, health: -2 },
    grad: { growth: 5, wisdom: 4, money: 1, freedom: -1 },
    photo: { growth: 4, money: 2, freedom: 2 }, builder: { money: 3, health: -4, freedom: 1 },
  };
  function gateFx(trade) { return Object.assign({}, GATE_TRADE_FX[trade] || {}); }
  const GATE_KIND_SUB = {
    assign: "分配下来的名额", recruit: "招工，你去报了名", follow: "有人带着你去",
    near: "离家近，来回方便", wage: "这一行眼下给的钱多",
  };
  // 回指句工作模板（§3.4）：注册表 seedEcho/inheritEcho 定稿前（P1-6）用这两条
  // 骨架，只许填 {age}/{note} 两个槽，槽数据全来自账（种子记录 / 出身牌名），
  // 拼不出处即不拼（gateEchoLine fail-closed 返 null），不许现编。
  const GATE_ECHO_SEED_STRONG = "{age} 岁那年，{note}。这颗种子，今天冒了头。";
  const GATE_ECHO_SEED_WEAK = "{age} 岁那年，{note}。那点心思，今天又想起来了。";
  const GATE_ECHO_INHERIT = "家里「{note}」，这一行你打小就熟。";

  function tradesTable() {
    const T = typeof window !== "undefined" ? window.GAME_TRADES : null;
    return T && typeof T === "object" ? T : null;
  }
  // 总开关（§6.1）：字段缺失、非 true、注册表不在场，一律按关读（fail-closed）。
  function gateSwitchOpen() {
    const sw = typeof window !== "undefined" ? window.GAME_GATE_SWITCH : null;
    return !!(sw && sw.open === true && tradesTable());
  }
  // 事实在账（与 record.js examPending 内的 fact 同口径镜像：旗 / 用过事件 /
  // 用过稀有 / 账本条目任一命中）。
  function factOn(S, id) {
    if (!S || typeof S !== "object") return false;
    return !!((S.flags && S.flags[id]) ||
      (Array.isArray(S.usedEvents) && S.usedEvents.includes(id)) ||
      (Array.isArray(S.usedRare) && S.usedRare.includes(id)) ||
      (Array.isArray(S.ledger) && S.ledger.some((e) => e && e.id === id)));
  }
  // 学历门（§4.2.2）：与 record.js ctxOk 的 eduGate / eduGateHalf 逐项同口径——
  // "gate" 严口径（schooling ∈ {school, pre} 或 edu_bridge），"half" 宽口径另放行
  // half；schooling 未判定（pre 年代无处境判定）恒过。不许在此另拼第二套口径。
  function gateEduPass(S, row) {
    if (!row || !row.eduGate) return true;
    const sc = S.state && S.state.schooling;
    if (!sc || sc === "school" || sc === "pre") return true;
    if (row.eduGate === "half" && sc === "half") return true;
    return factOn(S, "edu_bridge");
  }
  // 可行公共层（§4.2 的 1/3/4）：年代在 eraIn 内、入行旗未落、forbidState 不命中
  // （注册表当前无 forbidState 字段，防御性读，字段出现即生效）。
  function gateRowCommon(S, row) {
    if (!row || typeof row !== "object") return false;
    if (Array.isArray(row.eraIn) && S.era && !row.eraIn.includes(S.era)) return false;
    if (row.flag && S.flags && S.flags[row.flag]) return false;
    if (row.forbidState && typeof row.forbidState === "object") {
      for (const [dom, vals] of Object.entries(row.forbidState)) {
        const cur = S.state && S.state[dom];
        if (Array.isArray(vals) ? vals.includes(cur) : cur === vals) return false;
      }
    }
    return true;
  }
  // 推掉后的冷却在账判定：gateDefers 计数与最近一次推掉的落点年龄 gateDeferAge
  // 都在账才卡（本批只读不写：推掉的落账——计数＋落点年龄——归激活批在选项
  // 应用序接，见施工报告的接线清单）；只读到计数没有落点年龄时不硬卡。
  function gateCooling(S, years) {
    const c = S.career;
    if (!c || typeof c !== "object" || !(c.gateDefers > 0)) return false;
    if (typeof c.gateDeferAge !== "number") return false;
    return typeof S.age === "number" && S.age < c.gateDeferAge + years;
  }
  // 只读派生（P1-4 新增，只读不建壳）：当前未合上的待业段；无账/无段/坏账 null。
  function careerIdleOf(S) {
    if (!S || !S.career || typeof S.career !== "object" || !Array.isArray(S.career.idle)) return null;
    const d = openIdle(S.career);
    return d ? { from: d.from, to: d.to } : null;
  }
  // 最近一次入行落点（距今几年用）：履历段起点与 flagAges 两处取大者（旗为准、
  // 履历补老档落点，§1.1 双账纪律）；无考返 null，调用方 fail-closed。
  function gateLastEntryAge(S) {
    let last = null;
    const byFlag = tradesByFlag();
    if (byFlag && S.flags) {
      for (const flag of Object.keys(byFlag)) {
        if (!S.flags[flag]) continue;
        const a = S.flagAges && S.flagAges[flag];
        if (typeof a === "number") last = last == null ? a : Math.max(last, a);
      }
    }
    for (const sp of careerSpells(S)) {
      if (sp && typeof sp.from === "number") last = last == null ? sp.from : Math.max(last, sp.from);
    }
    return last;
  }

  // 关口一 · 毕业/首次入行（§3.2）：尚无正职层入行旗（机会层四旗不算）、不在
  // 未决窗内、年龄落窗。处境推入（exam_failed 落定）跳过窗下限与冷却（§3.3），
  // 上限照卡。窗的口径：study 在读窗照工资轮 fallbackTierOf（22–27 在读，
  // 28 起算读毕、读毕后 2 年内即 ≤30）；corp 22–24、farm 22–28 未落定窗过后；
  // gap 停年（22）次年起。各轨上限同为 30（§3.2 点名 work/craft/home 22–30，
  // 其余轨施工同顶，见报告裁量）。
  function gateFirstDue(S) {
    const byFlag = tradesByFlag();
    if (!byFlag) return false;
    for (const flag of Object.keys(byFlag)) {
      if (!OPPORTUNITY_FLAGS[flag] && S.flags[flag]) return false; // 正职层已入行
    }
    if (S.state.workPhase === "retired") return false;
    const age = S.age;
    if (typeof age !== "number" || age < 22 || age > 30) return false;
    const pushIn = factOn(S, "exam_failed");
    if (!pushIn) {
      if (typeof IFY.examPending === "function" && IFY.examPending(S)) return false;
      const routeId = S.route && S.route.id, track = S.state.track;
      if ((routeId === "study" || track === "study") && age < 28) return false;
      if (routeId === "corp" && age <= 24) return false;
      if (routeId === "farm" && age <= 28) return false;
      if (routeId === "gap" && age < 23) return false;
      if (gateCooling(S, 2)) return false;
    }
    return true;
  }
  // 关口三 · 大转行（§3.2/§4.4）：入过行、距上次入行 ≥3 年（硬推也不豁免）、
  // 未退休，且触发任一：unit_gone 硬推；待业段满 1 年且想走（switch_wanted）
  // 或已下岗（laid_off，§4.4 处境推力同列）；在职想走（switch_wanted 已立、
  // 不在待业段）。冷却 1 年，unit_gone 硬推跳冷却（§3.3 推入通则）。
  function gateSwitchDue(S) {
    const byFlag = tradesByFlag();
    if (!byFlag) return false;
    let entered = careerSpells(S).length > 0;
    if (!entered) for (const flag of Object.keys(byFlag)) if (S.flags[flag]) { entered = true; break; }
    if (!entered) return false;
    if (S.state.workPhase === "retired") return false;
    if (typeof S.age !== "number") return false;
    const last = gateLastEntryAge(S);
    if (last == null || S.age - last < 3) return false;
    const hardPush = unitGoneRecent(S);
    if (!hardPush && gateCooling(S, 1)) return false;
    if (hardPush) return true;
    const idle = careerIdleOf(S);
    let idleYearPlus = !!(idle && typeof idle.from === "number" && S.age - idle.from >= 1);
    if (!idleYearPlus && S.flags.laid_off && S.flagAges && typeof S.flagAges.laid_off === "number") {
      // 履历账缺段时以旗落点为准（§1.1）——但只认「下岗后还没再入行」：laid_off
      // 是一次性落旗、永不清除，若只按落旗年龄算待业时长，再入行后每满 3 年
      // 都会被这面旧旗二次触发转行门（P1-6 差异报告 P12X-c1955-0 实测：49 岁
      // 下岗、50 岁经关口再入行后，53/56/60/63 仍连环开门）。last 是最近入行岁。
      idleYearPlus = S.age - S.flagAges.laid_off >= 1 && !(typeof last === "number" && last > S.flagAges.laid_off);
    }
    if (idleYearPlus && (S.flags.switch_wanted || S.flags.laid_off)) return true;
    if (S.flags.switch_wanted && !idle) return true;
    return false;
  }
  // 开门判定总入口（进程层将来在 step 的进程段同点调用，本批无调用点）：
  // kind = "first" | "switch"；只读账、零随机、异常一律按不开门读。
  function gateDue(S, kind) {
    try {
      if (!S || typeof S !== "object" || !S.state || !S.flags || !S.route) return false;
      if (!gateSwitchOpen()) return false;
      if (kind === "first") return gateFirstDue(S);
      if (kind === "switch") return gateSwitchDue(S);
      return false;
    } catch (e) { return false; }
  }
  // 选框（§3.2 + D3 同门两副框）：gate_first 三框——处境推入 fact 优先；刚出
  // 学习窗（study 轨 28–29，或考试链落定一年内）走毕业框 grad；其余 job。
  // gate_switch 两框——unit_gone 走 fact，其余 want。
  // 处境硬推的「当年」口径（设计 §3.2/§七：unit_gone 落下当年开 gate_switch）：
  // factOn 是「曾经发生过」，而单位散了是一次性事件——落旗多年后再入行，不许
  // 隔几年二次硬推（P1-6 差异报告实测：旧口径下转行门在单位散后每满 3 年重开
  // 一次、且硬推跳冷却，推后也挡不住）。窗口取落旗当年起 2 年：关口判定在
  // step 里排在内容呈现之前，落旗当年赶不上本年判定，次年起算；同年再被别的
  // 独占屏占掉一年也还算「这阵子」。落旗年龄以 flagAges 为准（work.js 同步
  // 保证恒有记录）；无年龄记录时回落 factOn（理论不到达，与 work.js 兜底同口径）。
  function unitGoneRecent(S) {
    if (!factOn(S, "unit_gone")) return false;
    const fa = S.flagAges && typeof S.flagAges.unit_gone === "number" ? S.flagAges.unit_gone : null;
    if (fa == null || typeof S.age !== "number") return true;
    return S.age - fa >= 0 && S.age - fa <= 2;
  }

  function gateFrameOf(S, kind) {
    if (kind === "switch") return unitGoneRecent(S) ? "fact" : "want";
    if (factOn(S, "exam_failed")) return "fact";
    const routeId = S.route && S.route.id;
    if (routeId === "study" && typeof S.age === "number" && S.age <= 29) return "grad";
    for (const f of ["exam_passed", "exam_landed"]) {
      const a = S.flagAges && S.flagAges[f];
      if (S.flags[f] && typeof a === "number" && typeof S.age === "number" && S.age - a <= 1) return "grad";
    }
    return "job";
  }

  // 种子强度三账（第 2 期 P2-1，DESIGN-41 §4.1.0 修订；只读派生、现算不落存档）：
  //   direct = 指向本行当的记录权重（choice 记 1、seen 记 0.5，同拍同行当按
  //     beatId 去重——与第 1 期口径逐字同，plantSeed 写侧纪律互为保险）；
  //   spill = 0.5 × 指向同族其他行当的记录条数（不挑 kind，choice 与 seen 同价；
  //     按 (beatId, 来源行当) 去重——同一拍给同族两行各埋一颗时各算各的，
  //     §4.1.0 账规矩 3）；spillEarliest = 最早一颗外溢来源的埋种年龄（排序用）；
  //   total = direct + min(spill, SPILL_CAP)——外溢封顶 1.0（账规矩 2：防种密
  //     行当把全族平推高位、配额被同族轮流坐满；封顶是标定参数、不是门槛）。
  // 外溢只在读时算、永不写进 S.seeds（账规矩 1）：spillRecs 只是本次现算的来源
  // 记录引用；回指与 viaNote 只许认 recs（直系），外溢天然进不了履历账。
  // 族籍读 trades.js 的 family 字段（FAMILY-TABLE 冻结版，T3 裁定 township 归
  // 田土族）；注册表不在场或本行无族籍时 spill 恒 0（fail-closed，回落直系
  // 口径）。strength 保留为 total 的兼容别名，earliest/recs 语义与第 1 期逐字同。
  const SPILL_PER = 0.5, SPILL_CAP = 1.0;
  function tradeFamilyOf(T, tid) {
    const row = T && typeof tid === "string" ? T[tid] : null;
    return row && typeof row.family === "string" && row.family ? row.family : null;
  }
  function seedStrengthOf(S, tradeId) {
    let direct = 0, earliest = null;
    const seenBeats = new Set(), recs = [];
    for (const r of seedsOf(S)) {
      if (!r || r.trade !== tradeId) continue;
      const w = r.kind === "choice" ? 1 : r.kind === "seen" ? 0.5 : 0;
      if (w <= 0) continue;
      if (r.beatId != null) { if (seenBeats.has(r.beatId)) continue; seenBeats.add(r.beatId); }
      direct += w; recs.push(r);
      if (typeof r.age === "number") earliest = earliest == null ? r.age : Math.min(earliest, r.age);
    }
    let spill = 0, spillEarliest = null;
    const spillSeen = new Set(), spillRecs = [];
    const T = tradesTable();
    const fam = tradeFamilyOf(T, tradeId);
    if (fam) {
      for (const r of seedsOf(S)) {
        if (!r || typeof r.trade !== "string" || r.trade === tradeId) continue;
        if (tradeFamilyOf(T, r.trade) !== fam) continue;
        if (r.beatId != null) {
          const key = r.beatId + "|" + r.trade;
          if (spillSeen.has(key)) continue;
          spillSeen.add(key);
        }
        spill += SPILL_PER; spillRecs.push(r);
        if (typeof r.age === "number") spillEarliest = spillEarliest == null ? r.age : Math.min(spillEarliest, r.age);
      }
    }
    const total = direct + Math.min(spill, SPILL_CAP);
    return { direct, spill, total, strength: total, earliest, recs, spillEarliest, spillRecs };
  }
  // 承继命中：来源 id 是出身牌时认 S.prologue.family；是家庭事实时认事实在账。
  // famQuota65 例外（P1-4 裁，见 trades.js 表头）：名额定下且归我才算承继机会——
  // 归属本体是枚举事实 quotaHolder，famQuota65 本身只记「桌上定下过」。
  function gateInheritHit(S, id) {
    if (id === "famQuota65") return !!(S.facts && S.facts.quotaHolder === "mine");
    if (S.prologue && S.prologue.family === id) return true;
    return factOn(S, id);
  }
  // 冷门类型在本局的可用集（§4.3）：行当 coldKinds ∩ COLD_KIND_ERA 年代表
  // （只有格子明写 false 才排除）∩ 类型×路线细分（本批只落一格：assign 不在
  // farm 轨出——种地的人没有「被分配进厂」这回事，trades.js 表尾点名归本批）。
  function gateColdKindsFor(S, row) {
    const eraTab = typeof window !== "undefined" ? window.GAME_COLD_KIND_ERA : null;
    return (Array.isArray(row.coldKinds) ? row.coldKinds : []).filter((k) => {
      if (eraTab && eraTab[k] && eraTab[k][S.era] === false) return false;
      if (k === "assign" && S.route && S.route.id === "farm") return false;
      return true;
    });
  }
  // 冷门类型权重（§4.4 处境加权，只作用于类型抽取、不动任何老权重表）：
  // 父母进程进入照护段（care/hosp）→ near ×2；家底欠账（cf_13）→ wage ×2。
  // （设计稿 §4.4 写「家底牌 cf_11 等穷家」——cf_11 在现行牌表是独生牌、不是
  // 穷家，施工按牌表事实改认 cf_13「家里欠着账」，见报告裁量。）
  function gateKindWeight(S, kind) {
    let w = 1;
    if (kind === "near" && S.parents) {
      for (const who of ["dad", "mom"]) {
        const p = S.parents[who];
        if (p && (p.stage === "care" || p.stage === "hosp")) { w *= 2; break; }
      }
    }
    if (kind === "wage" && S.prologue && S.prologue.family === "cf_13") w *= 2;
    return w;
  }
  // D5 说明行（裁定硬条件）：种子点亮却被学历门挡住的行当不许无声消失——
  // 不占选项位、不可选，只在菜单外留一行，写清哪一行、差什么门槛。工作文案，
  // P1-6 文案审定稿。门槛说法与 gateEduPass 的口径一一对应（严口径＝正经文凭、
  // 宽口径＝读过书，两者都认夜校/自考的桥）。
  function gateEduNote(tid, row) {
    const name = GATE_TRADE_LABEL[tid] || tid;
    return row.eduGate === "half"
      ? `${name}这一行，你早年动过心思，只是它要读过书——正经读完，或是夜校、自考补出来。你眼下还差这一样，这一回先摆不出来。`
      : `${name}这一行，你早年动过心思，只是它要文凭——得正经读完书，或是夜校、自考补出来。你眼下还差这一样，这一回先摆不出来。`;
  }
  // 配额溢出回响行（第 2 期 P2-1，DESIGN-41 §4.1.3）：被配额裁掉的点亮项不许
  // 无声——菜单外留一行「惦记」（与 D5 的「规则」行分工：D5 说为什么不行，
  // 本行说它来过）。一次关口只一行：行内列被裁行当的菜单名（按 §4.1.2 排序
  // 取前 3 个，多出以「等」收尾）；措辞不点名出处——直系与只有外溢的项混列
  // 时同句照用，不给外溢项编来历。工作文案取 DESIGN-41 示例语义，正式文案另审。
  const GATE_ECHO_OVERFLOW = "还有没摆上桌的：{names}——小时候那点心思在这儿响了一声，这回先紧着眼前的。";
  function gateOverflowLine(overflow) {
    const names = overflow.slice(0, 3).map((x) => GATE_TRADE_LABEL[x.trade] || x.trade);
    let s = names.join("、");
    if (overflow.length > 3) s += "等";
    return GATE_ECHO_OVERFLOW.replace("{names}", s);
  }
  // 回指句填槽：模板只许 {age}/{note} 两槽，任一被引用的槽无值即整句作废
  // （指不出处不许现编）。
  function fillEcho(tmpl, slots) {
    if (typeof tmpl !== "string" || !tmpl) return null;
    let bad = false;
    const out = tmpl.replace(/\{(age|note)\}/g, (m, k) => {
      const v = slots[k];
      if (v == null || v === "") { bad = true; return m; }
      return String(v);
    });
    return bad ? null : out;
  }
  // 回指句纯函数（§3.4）：零随机、只读账。item = { via, trade, seed?, factId?,
  // direct? }。via=seed：种子记录缺 seedNote 或缺埋种年龄 → 不拼（返 null）；
  // 模板优先读注册表 seedEcho（本批全 null），回落工作骨架，强弱点亮分版。
  // 口气只认直系账（第 2 期 P2-1，DESIGN-41 §4.1.2）：强弱由 item.direct 定
  // （≥2 陈述式、其余试探式），外溢再高也不升格；item.strength 是旧调用点的
  // 入参名，仅在 direct 缺席时回落读它（旧单测兼容），新调用点一律传 direct。
  // via=inherit：说明只认出身牌名（GAME_CARDS.byId 的 name 是玩家文案）；
  // familyFacts 的 note 是登记说明、含元信息，不许直接上屏——认不出干净
  // 来源（如 famQuota65）即不拼。via=cold：定法无回指，恒 null。
  function gateEchoLine(S, item) {
    try {
      if (!S || !item || typeof item !== "object") return null;
      const T = tradesTable();
      const row = item.trade && T ? T[item.trade] : null;
      if (item.via === "seed") {
        const rec = item.seed;
        if (!rec || typeof rec.seedNote !== "string" || !rec.seedNote) return null;
        if (typeof rec.age !== "number") return null;
        const toneBase = typeof item.direct === "number" ? item.direct : item.strength;
        const tmpl = (row && typeof row.seedEcho === "string" && row.seedEcho)
          || (typeof toneBase === "number" && toneBase >= 2 ? GATE_ECHO_SEED_STRONG : GATE_ECHO_SEED_WEAK);
        return fillEcho(tmpl, { age: rec.age, note: rec.seedNote });
      }
      if (item.via === "inherit") {
        const fid = item.factId;
        if (!fid) return null;
        let note = null;
        const C = typeof window !== "undefined" ? window.GAME_CARDS : null;
        const card = C && C.byId ? C.byId[fid] : null;
        if (card && typeof card.name === "string" && card.name) note = card.name;
        if (!note) return null;
        const tmpl = (row && typeof row.inheritEcho === "string" && row.inheritEcho) || GATE_ECHO_INHERIT;
        return fillEcho(tmpl, { note });
      }
      return null;
    } catch (e) { return null; }
  }
  // 加权抽一（只走职业自有流）：items 非空、权重全正才抽；抽不出返 null。
  function gateDrawOne(S, items, weightOf) {
    let total = 0;
    for (const it of items) total += weightOf(it);
    if (!(total > 0)) return null;
    const r = careerRng(S);
    if (r == null) return null;
    let x = r * total, idx = 0;
    while (idx < items.length - 1 && x >= weightOf(items[idx])) { x -= weightOf(items[idx]); idx++; }
    return items[idx];
  }

  // 菜单组装（§3.3 + §3.5；点亮口径第 2 期 P2-1 按 DESIGN-41 §4.1.1–4.1.3
  // 修订）：构成序＝承继（≤2）→ 种子点亮（≤3，§4.1.2 排序：total 降序、同分
  // 有直系者在前、再按最早记录年龄、仍同分按注册表行序）→ 冷门（2–4，职业
  // 自有流加权抽）→ 兜底（本体自带，恒 1），总选项 ≤8；溢出裁剪序：先裁冷门
  // 到 2、再裁种子到 2（承继与兜底不裁）。处境推入只改开门时机与框
  // （gateDue/gateFrameOf），不占选项位。
  // 同一行当承继与种子同时命中时只出承继项（来处以承继为准，种子不再单列，
  // 也不另出 D5 行——它已经在菜单上）。D5 分直系/外溢：种子候选含直系
  // （direct ≥0.5）被学历门挡者进 gateNotes（菜单外）；只有外溢的候选被挡
  // 不出行（§4.1.3 衔接修订）。承继被学历门挡者照 §3.3 其余不可行例不摆、无声。
  // 被配额裁掉的点亮项（配额外＋挤压被裁）收进溢出集，在 gateEchoes 留一行
  // 回响（§4.1.3），与 gateNotes 平行、数据与计数都分开。
  // 返回形状与 kidForkView 同构：本体副本 + age 实岁戳 + 组装 choices（每项带
  // group: "lit"|"cold"|"defer" 供 D4 分组呈现，标题在 gateGroupTitles）+
  // gateFrame + gateNotes + gateEchoes。本体永不被改动。
  function gateForkView(S, kind) {
    try {
      if (!S || typeof S !== "object" || !S.flags || !S.state) return null;
      const wantId = kind === "switch" ? "fork_gate_switch" : kind === "first" ? "fork_gate_first" : "";
      // 本体认 GAME_DATA.forks（P1-6 已毕业合入 events.js；原 GAME_GATES 登记处已撤）。
      const gateDefs = (typeof window !== "undefined" && window.GAME_GATES && window.GAME_GATES.forks) || [];
      const def = gateDefs.find((f) => f.id === wantId) || ((IFY.D && IFY.D.forks) || []).find((f) => f.id === wantId);
      if (!def) return null;
      const T = tradesTable();
      if (!T) return null;
      const frame = gateFrameOf(S, kind);
      const notes = [];
      // 上层一：承继
      const inheritItems = [];
      for (const [tid, row] of Object.entries(T)) {
        if (!row || !Array.isArray(row.inheritFrom) || !row.inheritFrom.length) continue;
        if (row.gateDirect !== true || !gateRowCommon(S, row)) continue;
        const srcId = row.inheritFrom.find((id) => gateInheritHit(S, id));
        if (!srcId) continue;
        if (!gateEduPass(S, row)) continue;
        inheritItems.push({ trade: tid, row, srcId });
        if (inheritItems.length >= 2) break;
      }
      const litTrades = new Set(inheritItems.map((x) => x.trade));
      // 上层二：种子点亮（第 2 期 P2-1，DESIGN-41 §4.1.1）：候选门槛统一放低
      // 为 total ≥ 0.5——一颗直系 choice、直系 seen 半颗、或只有外溢，都进候选。
      const regOrder = {};
      Object.keys(T).forEach((tid, i) => { regOrder[tid] = i; });
      const seedAgeKey = (x) => {
        const a = x.direct > 0 ? x.earliest : x.spillEarliest;
        return a == null ? Number.MAX_SAFE_INTEGER : a;
      };
      const seedLit = [];
      for (const [tid, row] of Object.entries(T)) {
        if (!row || row.gateDirect !== true || litTrades.has(tid)) continue;
        if (!gateRowCommon(S, row)) continue;
        const agg = seedStrengthOf(S, tid);
        if (agg.total < 0.5) continue;
        if (!gateEduPass(S, row)) {
          if (agg.direct >= 0.5) notes.push(gateEduNote(tid, row)); // D5：只认直系（§4.1.3）
          continue;
        }
        seedLit.push({ trade: tid, row, direct: agg.direct, spill: agg.spill, total: agg.total, earliest: agg.earliest, spillEarliest: agg.spillEarliest, agg });
      }
      seedLit.sort((a, b) => (b.total - a.total) ||
        ((b.direct > 0 ? 1 : 0) - (a.direct > 0 ? 1 : 0)) ||
        (seedAgeKey(a) - seedAgeKey(b)) ||
        ((regOrder[a.trade] || 0) - (regOrder[b.trade] || 0)));
      const seedItems = seedLit.slice(0, 3);
      for (const it of seedItems) litTrades.add(it.trade);
      // 下层：冷门（先按默认 3 抽，溢出再按裁剪序收）
      const pool = [];
      for (const [tid, row] of Object.entries(T)) {
        if (!row || row.coldOk !== true || litTrades.has(tid)) continue;
        if (!gateRowCommon(S, row) || !gateEduPass(S, row)) continue;
        if (!(row.coldWeight > 0)) continue;
        const kinds = gateColdKindsFor(S, row);
        if (!kinds.length) continue;
        pool.push({ trade: tid, row, kinds });
      }
      let coldTarget = 3;
      while (inheritItems.length + seedItems.length + coldTarget + 1 > 8) {
        if (coldTarget > 2) coldTarget--;
        else if (seedItems.length > 2) { litTrades.delete(seedItems.pop().trade); }
        else if (coldTarget > 0) coldTarget--;
        else break;
      }
      const coldItems = [];
      const drawPool = pool.slice();
      while (coldItems.length < coldTarget && drawPool.length) {
        const picked = gateDrawOne(S, drawPool, (p) => p.row.coldWeight);
        if (!picked) break;
        drawPool.splice(drawPool.indexOf(picked), 1);
        const kindPick = gateDrawOne(S, picked.kinds.map((k) => ({ kind: k })), (e) => gateKindWeight(S, e.kind));
        coldItems.push({ trade: picked.trade, row: picked.row, coldKind: kindPick ? kindPick.kind : picked.kinds[0] });
      }
      // 落成选项（正式选项在此组装，本体 choices 只留兜底）
      const choices = [];
      for (const it of inheritItems) {
        choices.push({
          label: GATE_TRADE_LABEL[it.trade] || it.trade, effects: gateFx(it.trade), set: it.row.flag,
          via: "inherit", trade: it.trade, viaFact: it.srcId, group: "lit",
          sub: gateEchoLine(S, { via: "inherit", trade: it.trade, factId: it.srcId }),
        });
      }
      for (const it of seedItems) {
        // 回指只认直系记录（§4.1.2）：echoRec 只从直系 recs 里取带 seedNote 的
        // 那条；只有外溢点亮的项 recs 为空 → echoRec 恒 null → seedBeat/
        // seedAge 恒 null、sub 恒 null（分组标题就是它的说明，不许编出处）。
        // 口气入参传 direct：外溢再高也不升格（§4.1.2 不变量的呈现面）。
        const echoRec = it.agg.recs.find((r) => typeof r.seedNote === "string" && r.seedNote) || it.agg.recs[0] || null;
        choices.push({
          label: GATE_TRADE_LABEL[it.trade] || it.trade, effects: gateFx(it.trade), set: it.row.flag,
          via: "seed", trade: it.trade, group: "lit",
          seedBeat: echoRec ? echoRec.beatId : null, seedAge: echoRec ? echoRec.age : null,
          sub: gateEchoLine(S, { via: "seed", trade: it.trade, seed: echoRec, direct: it.direct }),
        });
      }
      for (const it of coldItems) {
        choices.push({
          label: GATE_TRADE_LABEL[it.trade] || it.trade, effects: gateFx(it.trade), set: it.row.flag,
          via: "cold", trade: it.trade, coldKind: it.coldKind, group: "cold",
          sub: GATE_KIND_SUB[it.coldKind] || null,
        });
      }
      const fb = (def.choices || []).find((c) => c && c.gateDefer) || (def.choices || [])[0];
      if (fb) choices.push(Object.assign({}, fb, { group: "defer" }));
      // 溢出回响（§4.1.3）：点亮候选里最终没摆上桌的（配额 3 之外＋8 项挤压时
      // 被裁的——挤压裁掉的已不在 seedItems 里，按「候选集减上桌集」一并收）
      // 不许无声，按 §4.1.2 排序（seedLit 原序）收成一行 gateEchoes。上桌集
      // 含冷门项：候选若被冷门层抽上桌，它就在桌上，回响行再说它「没摆上」
      // 是假话——故按最终上桌集减（只改回响的收集面，不动任何抽取与随机）。
      const tabledSeed = new Set([...seedItems, ...coldItems].map((x) => x.trade));
      const overflow = seedLit.filter((x) => !tabledSeed.has(x.trade));
      const gateEchoes = overflow.length ? [gateOverflowLine(overflow)] : [];
      const view = Object.assign({}, def, {
        age: S.age, choices, gateFrame: frame, gateNotes: notes, gateEchoes,
        gateGroupTitles: { lit: "有来处的", cold: "眼下的" },
      });
      if (def.gateFrames && def.gateFrames[frame]) view.text = def.gateFrames[frame];
      return view;
    } catch (e) { return null; }
  }

  // ---------- 职业层事实账（新冠簇尾巴，2026-11-09 施工） ----------
  // careerNote 的记账位只记 spells/idle/gateDefers，没有自由事实位；本簇尾巴
  // （初入职面与白领/IT 面共用的同一条事实账）按本文件的既有纪律落一张声明式
  // 事实表：只落账、本批无消费者，第 2 期行当后段拍按 trade 读表＋workFactOf。
  // 两个读面（初入职／白领 IT）是同一条账，不许拆两条各记一遍。
  // 读口 fail-closed：出生年或年龄不可知（旧档）时恒假，与全游戏公历门口径一致
  // （呈现公历＝出生年＋年龄，唯一定义）。本批只读不写、不改任何现行行为。
  const WORK_FACTS = [
    { id: "wfh_normalized", fromYear: 2023, trades: ["dev", "fin", "acct", "press", "grad"],
      note: "2023 年起，远程/混合办公在白领与 IT 岗位上留了下来，成为常态工作形态的一部分。初入职与在职白领两个读面同源此账。（新冠簇尾巴落账；无比例数字，不作统计宣称。）" },
  ];
  function workFactOf(S, id) {
    try {
      if (!S || typeof S.birthYear !== "number" || typeof S.age !== "number") return false;
      const f = WORK_FACTS.find((x) => x.id === id);
      if (!f) return false;
      return S.birthYear + S.age >= f.fromYear;
    } catch (e) { return false; }
  }

  Object.assign(IFY, { careerNote, careerOf, careerSpells, seedsOf, plantSeed, inheritSeedsAtBirth, careerRng, backfillCareer, careerIdleOf, gateDue, gateForkView, gateEchoLine, seedStrengthOf, workFactOf, WORK_FACTS });
})(window.IFY);
