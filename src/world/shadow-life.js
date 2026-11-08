// [模块]《如果那年》引擎分片：双 Track 会话层（v0.21 WP1 会话层 + WP2 无头年步进，施工蓝图第二/三/五节）。
// 加载序：index.html 中置于 scheduler.js 之后、views 之前（见蓝图 WP1 行）。
// 本文件做：session 结构、上下文切换器 withLife、影子子流派生、Track_B 出生、stepUncontrolled
// （年龄+死亡掷点 + stepYearHeadless 无头年步进，WP2）、存档 v2 序列化与两形状回填。
// 政策（WP3，shadow-policy.js）不在本文件：无头步进只经 IFY.shadowPolicy.chooseForTrack 取选项下标。
// 纪律（蓝图裁定一）：两条 Track 模拟层零交叉读取；本文件唯一的跨 Track 动作是出生时的一次性
// 出身拷贝（裁定三：分岔之前是同一个人）与呈现层只读观察。决策层函数一行不改、只在切换后的
// 上下文里被复用。不受控上下文中禁止调用 render*、save()、ANA.track 与任何 DOM 操作。
//
// 【维护告示 · 无头解决与呈现层共用变更清单（蓝图第九节脆弱点 2 的落点）】
// stepYearHeadless 的每个解决器都是对应 render* 函数「状态变更清单」的逐项镜像——同一笔账，只是不画：
//   renderProcItem（parents.js） ↔ resolveProcHeadless；renderFork（year.js） ↔ resolveForkHeadless；
//   renderEventYear / renderRare / renderCrisis（year.js） ↔ resolvePlanHeadless 内各分支。
// 改任何一个 render* 的状态变更（applyState / 立旗 / applyEffects / rec 的 kind 与字段 / 流水行 /
// 进程拍专有机制如 deferDating 时钟回拨、deferRetire 节点后移 / usedRare·crisisUsed 的落记时机），
// 必须同步改本文件对应的无头解决器；反之亦然。父母 stage 推进是共享函数 IFY.advanceParentStage
// （parents.js），呈现层与无头共用一份，不许在任何一边另抄。抉择点清单对盘记录见 sim-v021/logs/wp2.md 第 1 节。
(function (IFY) {
  "use strict";

  // 玩家层字段（蓝图 3.1）：不属于任何一条 Track，只存 session.meta 一份；Track 的 state 里
  // 保留同名字段只为同形、恒不作数。存档序列化时从 Track 条目里剔除、在 meta 里单存。
  const PLAYER_FIELDS = ["reflections", "glimpsesSeen", "glimpsesSkipped", "autoMode", "speed"];
  // 存档 Track 条目里的流计数键：不属于 state 本体，序列化时从 streams 单独写入。
  const STREAM_KEYS = ["rngA", "rngW", "rngAmb"];

  IFY.session = null;    // 当前会话（裁定一结构图）；无 session 时（sim 自建主循环）一切函数按旧口径回落
  IFY._lifeDepth = 0;    // withLife 嵌套深度（裁定一开发断言）：save() 在 depth>0 时按调试/sim 口径报错

  // ---------- 裁定二：#shadow 三子流（只给 Track_B 派生；主线三股 + 序章流派生一字不动） ----------
  // 后缀与现行 #world/#ambient 同构。本函数只返回计数器初值，不触碰全局 RNG/RNGW/RNGA。
  function seedShadowStreams(seedStr) {
    return {
      n: IFY.seedFromString(seedStr + "#shadow"),          // Track_B 叙事流（保留派生；政策禁用，蓝图裁定二）
      w: IFY.seedFromString(seedStr + "#shadow#world"),    // Track_B 进程流（父母掷点、死亡、死因文本挑选）
      a: IFY.seedFromString(seedStr + "#shadow#ambient"),  // Track_B 环境流（planYear 全部抽取，WP2 起消费）
    };
  }

  // 调度计数零表（与 scheduler.js 的 schedStats 同键）：每条 Track 一份，withLife 切换时进出快照。
  function zeroSched() {
    return { crisis: 0, crisisPreempt: 0, rare: 0, chain: 0, examAnchor: 0, l3: 0, flat: 0, micro: 0, flavorYears: 0 };
  }

  // ---------- session 与 meta（蓝图裁定一结构图 / 3.1） ----------
  function defaultMeta(src) {
    return {
      reflections: src && Array.isArray(src.reflections) ? src.reflections : [],
      glimpsesSeen: (src && src.glimpsesSeen) || 0,
      glimpsesSkipped: (src && src.glimpsesSkipped) || 0,
      autoMode: (src && src.autoMode) || IFY.DEFAULT_AUTO_MODE || "off",
      speed: (src && src.speed) || "mid",
      swapped: false, swap: null,
      controlLog: [], shownFacts: [], policyV: 1,
    };
  }

  // 玩家层读取口（WP1 迁移点统一走这里）：有 session 读 meta；无 session（sim 自建主循环、
  // 旧档回填完成前）回落受控 Track state 的同名字段——旧口径逐字不变，parity 的结构保证。
  function playerMeta() {
    if (IFY.session && IFY.session.meta) return IFY.session.meta;
    const S = IFY.S;
    if (!S) return { reflections: [], glimpsesSeen: 0, glimpsesSkipped: 0, autoMode: IFY.DEFAULT_AUTO_MODE || "off", speed: "mid" };
    return {
      reflections: Array.isArray(S.reflections) ? S.reflections : [],
      glimpsesSeen: S.glimpsesSeen || 0, glimpsesSkipped: S.glimpsesSkipped || 0,
      autoMode: S.autoMode || IFY.DEFAULT_AUTO_MODE || "off", speed: S.speed || "mid",
    };
  }

  function trackEntry(state, streams, routeId) {
    return { state, streams, routeId: routeId || (state.route ? state.route.id : null), memorialShown: false, finalized: false, schedStats: zeroSched() };
  }

  // 以当前受控 Track（IFY.S + 全局三股流）建 session：controlTrack="A"、tracks.B=null。
  function buildSession(stateA) {
    const meta = defaultMeta(stateA);
    meta.reflections = Array.isArray(stateA.reflections) ? stateA.reflections : meta.reflections; // 与 Track_A state 同一数组：旧写入口（瞥视认领）与 meta 读口看到同一份
    meta.controlLog = [{ track: "A", fromAge: stateA.age, toAge: null }];
    return {
      controlTrack: "A",
      tracks: { A: trackEntry(stateA, { n: IFY.RNG.a, w: IFY.RNGW.a, a: IFY.RNGA.a }), B: null },
      meta,
    };
  }

  function ensureSession() {
    if (!IFY.session && IFY.S) IFY.session = buildSession(IFY.S);
    return IFY.session;
  }

  // ---------- withLife：上下文切换器（蓝图裁定一） ----------
  // 把 IFY.S 换成目标 Track 的 state、RNG/RNGW/RNGA 换成该 Track 的 streams、IFY.schedStats
  // 换成该 Track 的计数快照，执行 fn，finally 全部还原（异常路径同样还原）。
  // 进出时把当前 Track 的流计数与调度计数回写其条目，目标 Track 的计数在退出时回写其条目——
  // 每条 Track 的流只被它自己消费（withLife 切换保证，裁定二）。
  // 注意：任何缓存了 IFY.S 引用的代码不许跨交接存活，fn 内外都必须现读 IFY.S（蓝图 7.2 纪律，一期同样适用）。
  function withLife(track, fn) {
    const session = IFY.session;
    const saved = { S: IFY.S, n: IFY.RNG.a, w: IFY.RNGW.a, a: IFY.RNGA.a, sched: IFY.schedStats ? { ...IFY.schedStats } : null };
    // 离开当前 Track 前，把全局计数回写它自己的条目（按 state 引用认人）
    if (session) {
      for (const k of ["A", "B"]) {
        const t = session.tracks[k];
        if (t && t.state === saved.S) { t.streams = { n: saved.n, w: saved.w, a: saved.a }; if (saved.sched) t.schedStats = { ...saved.sched }; }
      }
    }
    IFY._lifeDepth += 1;
    try {
      IFY.S = track.state;
      IFY.RNG.a = track.streams.n; IFY.RNGW.a = track.streams.w; IFY.RNGA.a = track.streams.a;
      if (IFY.schedStats && track.schedStats) { for (const k of Object.keys(IFY.schedStats)) delete IFY.schedStats[k]; Object.assign(IFY.schedStats, track.schedStats); }
      return fn();
    } finally {
      // 目标 Track 本次消费后的计数回写其条目，再还原调用方上下文（含异常路径）
      track.streams = { n: IFY.RNG.a, w: IFY.RNGW.a, a: IFY.RNGA.a };
      if (IFY.schedStats && track.schedStats) track.schedStats = { ...IFY.schedStats };
      IFY.S = saved.S;
      IFY.RNG.a = saved.n; IFY.RNGW.a = saved.w; IFY.RNGA.a = saved.a;
      if (IFY.schedStats && saved.sched) { for (const k of Object.keys(IFY.schedStats)) delete IFY.schedStats[k]; Object.assign(IFY.schedStats, saved.sched); }
      IFY._lifeDepth -= 1;
    }
  }

  // ---------- Track_B 出生（蓝图 3.1 字段处置表 + 裁定三） ----------
  // 调用点：newGame()/mergeIntoRoute() 落路线后、首次 save() 之前（engine.js 挂点）。
  // B 的对象路线 = 现行 shadowRoute() 口径：受控 Track 的 S.unchosen 里第一条 route 条目。
  // B 的 state 由 freshState 同路径生成，字段处置逐项照 3.1 表（见函数内分段注释）。
  function birthShadow() {
    const A = IFY.S;
    if (!A || !A.route) return null;
    const first = (A.unchosen || []).find((u) => u && u.kind === "route");
    if (!first) return null;
    const routeB = (IFY.D.routes || []).find((r) => r.id === first.id);
    if (!routeB) return null;
    const session = ensureSession();
    if (!session) return null;
    if (session.tracks.B) return session.tracks.B; // 幂等：出生只发生一次

    // —— 出生前先把 A 侧「分岔之前的同一个人」的结论摘出来（出生拷贝是一次性动作，不是运行期交叉读取）——
    const cardsCopy = (A.cards || []).slice();                                   // 卡牌年代：玩家所选三张，同值拷贝（3.1）
    const marksCopy = JSON.parse(JSON.stringify(A.marks || []));                 // 序章年代：童年记号，同值拷贝（3.1）
    const proCopy = A.prologue ? {                                               // 序章年代：处境/性子/家底/时代结论（运行态字段如 stage 指针不拷，3.1）
      situation: A.prologue.situation, temperPick: A.prologue.temperPick,
      family: A.prologue.family, eraCard: A.prologue.eraCard, leftBehind: !!A.prologue.leftBehind,
    } : null;
    const schoolingCopy = A.state ? A.state.schooling : undefined;               // 序章年代：state.schooling / state.track（3.1）
    const trackCopy = A.state ? A.state.track : undefined;
    // v0.23 E8（WP1）：枚举事实全量逐项点名——examBand / schoolingDepth / sentdownForm / quotaHolder / studyForm
    // 都住在 S.facts 伴随容器里，整容器深拷贝即逐项同值（键缺失＝absent，两账同读法）；不改 v0.22 语义，只扩复制面。
    const factsCopy = A.facts ? JSON.parse(JSON.stringify(A.facts)) : {};
    // v0.23 E8（WP1）：familyFact 全量——按 GAME_REGISTRY.familyFacts 登记表逐项点名，只拷 A 已立的家庭事实旗；
    // S.flags 仍不整拷（其余旗的既有口径不变：出身牌 set 旗经下方牌 effects 重演、干后旗各走各账）。
    const FAM_FACTS = (typeof window !== "undefined" && window.GAME_REGISTRY && window.GAME_REGISTRY.familyFacts) || {};
    const famFlagsCopy = {};
    for (const name of Object.keys(FAM_FACTS)) if (A.flags && A.flags[name]) famFlagsCopy[name] = true;
    const unchosenBase = (A.unchosen || []).filter((u) => u.kind !== "route").map((u) => ({ ...u })); // 16 岁轨道的不选支与主线同（分岔之前）；route 条目在下面按 B 重走
    const parentsA = A.parents ? JSON.parse(JSON.stringify(A.parents)) : null;   // 裁定三：age0 出生拷贝的来源

    const B = IFY.freshState(A.seedStr); // 同路径生成（3.1）；freshState 给齐独立字段（state/flags/ledger/log/used*/进程运行态等各一份）
    B.era = A.era; B.birthYear = A.birthYear; // seedStr/era/birthYear 恒等（3.1 同值拷贝）
    const entry = trackEntry(B, seedShadowStreams(A.seedStr), routeB.id);
    session.tracks.B = entry;

    withLife(entry, () => {
      const S = IFY.S; // 此刻起 IFY.S 是 Track_B 的 state；下面的 applyEffects/rec/applyState 全落在 B 身上
      S.route = routeB;
      if (schoolingCopy !== undefined) S.state.schooling = schoolingCopy;
      if (trackCopy !== undefined) S.state.track = trackCopy;
      S.facts = factsCopy; // v0.23 E8：枚举事实整容器落 B（与 A 深拷贝同值，之后各走各账）
      if (typeof IFY.inheritSeedsAtBirth === "function") IFY.inheritSeedsAtBirth(S, A); // 第 1 期 P1-5（设计 §5.1）：22 岁前埋下的种子随出生整表深拷贝给 B——拷贝本体在 career.js（种子账的写侧归账本主，本文件不直读该账）；只读 A、不消费任何流，拷贝后两轨各记各的
      for (const [name, v] of Object.entries(famFlagsCopy)) S.flags[name] = v; // v0.23 E8：familyFact 已立旗逐项落 B
      S.marks = marksCopy;
      S.prologue = proCopy;
      S.cards = cardsCopy;
      // unchosen 按 B 重走（3.1）：B 的路线是选中的，其余四条入 B 自己的 unchosen（D.routes 原序，与 newGame/mergeIntoRoute 同口径）
      S.unchosen = unchosenBase;
      for (const r of IFY.D.routes) if (r.id !== routeB.id) S.unchosen.push({ kind: "route", label: r.name, id: r.id });
      // stats 按 B 重走（3.1）：初值 → 同一批出身牌 effects（数值+钩子旗同一拍）→ B 路线 route.stats，叠加顺序与 newGame 一致
      const CARDS = IFY.CARDS;
      if (CARDS && cardsCopy.length) {
        const ef = {};
        for (const id of cardsCopy) { const c = CARDS.byId[id]; if (!c) continue; for (const [k, v] of Object.entries(c.effects || {})) ef[k] = (ef[k] || 0) + v; if (c.set) S.flags[c.set] = true; }
        IFY.applyEffects(ef);
        const names = cardsCopy.map((id) => (CARDS.byId[id] || {}).name || "").filter(Boolean);
        if (names.length) S.log.push(`22 岁 · 出身：${names.join(" · ")}`);
      }
      const base = IFY.rhythmBase("route", routeB.id); // temp/rhythm 按 B 路线重走（3.1）：rhythmBase("route", …)
      if (base) { S.temp = base.temp; S.rhythm = base.rhythm; }
      IFY.applyEffects(routeB.stats); S.lastDelta = "";
      IFY.rec("route", routeB.id);
      S.log.push(`22 岁 · 出发：${routeB.name}`);
      // parents 按裁定三：age0 拷自主线（同值）；deathAge/careAge/hospAge 在 B 的进程流上同公式重掷。
      // 此刻 withLife 已把 RNGW 换成 B 的 #shadow#world 流，draw 包装即 IFY.rngW；掷序父先于母、与 initParents 同构。
      const cal = IFY.PARENT_CAL[S.era] || IFY.PARENT_CAL.c2000;
      const draw = () => IFY.rngW();
      if (parentsA) {
        S.parents = { dad: IFY.parentFate(parentsA.dad.age0, cal.dadLife, draw), mom: IFY.parentFate(parentsA.mom.age0, cal.momLife, draw) };
      } else if (typeof IFY.parentOne === "function") {
        // 兜底（理论不可达：engine 挂点保证先 initParents 再出生）：无主线 age0 可拷时按 B 自己的流整掷
        S.parents = { dad: IFY.parentOne(cal.dadAge, cal.dadLife, draw), mom: IFY.parentOne(cal.momAge, cal.momLife, draw) };
      }
    });
    return entry;
  }

  // ---------- 无头年步进（蓝图 5.1/5.2，WP2）：与呈现层同一笔账，只是不画 ----------
  // 抉择归政策（蓝图 4.3 末段分工）：一切有选项的条目，选项下标一律由政策纯函数
  // IFY.shadowPolicy.chooseForTrack(本 Track 的 state, 抉择点描述) 给出；政策不可用或出参
  // 越界时回落下标 0（防御口径：政策单元门保证正常路径恒有合法下标，此回落只防加载缺失）。
  // decision.choices 只放呈现层同口径下玩家能看到的选项（分岔按选项级门过滤、进程拍按
  // deferDating 过滤），F 面对的选项集与呈现层一致（蓝图 4.5「F 永远面对非空选项集」）。
  function policyIdx(decision) {
    const choices = decision && Array.isArray(decision.choices) ? decision.choices : [];
    if (!choices.length) return -1;
    let idx = -1;
    if (IFY.shadowPolicy && typeof IFY.shadowPolicy.chooseForTrack === "function") idx = IFY.shadowPolicy.chooseForTrack(IFY.S, decision);
    if (typeof idx !== "number" || !(idx >= 0) || idx >= choices.length) idx = 0;
    return idx;
  }

  // 进程拍无头解决（renderProcItem 的状态变更清单逐项镜像，清单见 wp2 日志清单 A）：
  // 父母 stage 推进走共享函数 advanceParentStage；选项落账序与呈现层一致
  // （applyEffects → 立旗 → applyState → defer 专有机制 → rec 带 choice）。
  function resolveProcHeadless(item, who, beat) {
    const S = IFY.S;
    S.flatCarry = null; // 进程年不是平年
    if (typeof IFY.advanceParentStage === "function") IFY.advanceParentStage(who, beat);
    if (item.set) S.flags[item.set] = true;
    if (typeof IFY.houseOnBuyFlag === "function") IFY.houseOnBuyFlag(S, item.set, item);
    if (typeof IFY.careerNote === "function") IFY.careerNote(S, item); // 第 1 期 P1-2：履历记账（与呈现层 renderProcItem 镜像同位；平行账，只写不读，下同）
    if (typeof IFY.plantSeed === "function") IFY.plantSeed(S, item); // 第 1 期 P1-3：埋种（与 careerNote 镜像同位，唯一写点 plantSeed，下同）
    IFY.applyState(item);
    if (!item.choices) { IFY.applyEffects(item.effects); } else S.lastDelta = "";
    IFY.rec("proc", item.id, { set: item.set || null, fx: !item.choices ? S.lastDelta : null });
    S.log.push(`${S.age} 岁 · ${IFY.procText(item)}`);
    if (!item.choices) return;
    const vis = item.choices.map((c, i) => [c, i]).filter(([c]) => !(c.deferDating && (S.datingDefers || 0) >= 2) && (!FORK_GATE_KEYS.some((k) => k in c) || IFY.met(c))); // dating 推迟两次后不再给推迟选项（呈现层同款过滤）；v0.23 WP6（S-6D）：选项级门同口径过滤（FORK_GATE_KEYS 含 eraIn，定义见 resolveForkHeadless 上方），与呈现层 renderProcItem 改后一致
    const visChoices = (vis.length ? vis : item.choices.map((c, i) => [c, i])).map(([c]) => c); // 全被过滤时回落全选项集（蓝图 4.5 口径；呈现层此情形为空屏，无头不许无解）
    const c = visChoices[policyIdx({ kind: "proc", item, choices: visChoices })];
    if (!c) return;
    IFY.applyEffects(c.effects);
    if (c.set) S.flags[c.set] = true;
    if (typeof IFY.houseOnBuyFlag === "function") IFY.houseOnBuyFlag(S, c.set, c);
    if (typeof IFY.careerNote === "function") IFY.careerNote(S, c);
    if (typeof IFY.plantSeed === "function") IFY.plantSeed(S, c, item.id);
    IFY.applyState(c);
    if (c.deferDating) { S.datingSince = S.age - 3; S.datingDefers = (S.datingDefers || 0) + 1; } // 推迟：时钟回拨，下次到期在约 4 年后
    if (c.deferRetire) { if (S.retirePlan) S.retirePlan.nodeAge = S.age + 3; S.retireDefers = (S.retireDefers || 0) + 1; } // 退休节点推迟：节点后移 3 年
    IFY.rec("proc", item.id, { choice: c.label, set: c.set || null, fx: S.lastDelta });
  }

  // 分岔无头解决（renderFork 的状态变更清单逐项镜像，清单见 wp2 日志清单 B）。
  // 与呈现层的唯一差别：不写 S.pendingFork（呈现挂起位，不受控 Track 恒为 null，蓝图 3.1）——
  // 分岔在这里当场解决完，不留复述拍。
  const FORK_GATE_KEYS = ["require", "forbid", "all", "any", "state", "stateAll", "stateNot", "era", "eraIn", "minYear", "route", "routeIn", "forbidRoute", "chain"];
  function resolveForkHeadless(fork) {
    const S = IFY.S;
    S.flatCarry = null; // 分岔年不是平年
    // 年代框变体（v0.23 WP1 E2，与呈现层 renderFork 同口径）：eraFrame 命中本 Track 年代时整框替换选项集（set 旗不变，政策仍按旗/效果面对同一组选项）
    if (fork.eraFrame && fork.eraFrame[S.era]) { const fr = fork.eraFrame[S.era]; fork = Object.assign({}, fork, { title: fr.title || fork.title, choices: fr.choices || fork.choices }); }
    let vis = fork.choices.map((c, i) => [c, i]).filter(([c]) => !FORK_GATE_KEYS.some((k) => k in c) || IFY.met(c)); // 选项级门（呈现层同款）
    if (!vis.length) vis = fork.choices.map((c, i) => [c, i]); // 过滤为空回落全选项集（呈现层同款回落）
    const visChoices = vis.map(([c]) => c);
    const c = visChoices[policyIdx({ kind: "fork", item: fork, choices: visChoices })];
    if (!c) return;
    IFY.applyEffects(c.effects);
    if (c.set) S.flags[c.set] = true;
    if (typeof IFY.houseOnBuyFlag === "function") IFY.houseOnBuyFlag(S, c.set, c);
    if (typeof IFY.careerNote === "function") IFY.careerNote(S, c);
    if (typeof IFY.plantSeed === "function") IFY.plantSeed(S, c, fork.id);
    IFY.applyState(c);
    IFY.applyTempDelta(c.temp); // 温度接点：只改质地字段
    if (fork.id === "fork_kid") IFY.kidForkCovenant(c); // 孩子线批次 S4：fork_kid 落点记账（流水行由 registerCovenant 在钩子内先行落，与呈现层同序）
    fork.choices.forEach((o) => { if (o !== c) S.unchosen.push({ kind: "fork", age: fork.age, label: IFY.labelText(o) }); }); // 未选支进本 Track 自己的 unchosen
    if (typeof IFY.noteSplitFork === "function") IFY.noteSplitFork(S, fork); // 分家记账（丙案第一步）：换轨级岔口在本轨也落同一笔（与呈现层同口径）
    S.log.push(`${fork.age} 岁 · ${fork.title.split("·")[1].trim()}：${IFY.labelText(c)}`);
    IFY.rec("fork", fork.id || ("fork" + fork.age), { choice: IFY.labelText(c), set: c.set || null, fx: S.lastDelta });
  }

  // 危机无头解决（renderCrisis 的状态变更清单逐项镜像，清单见 wp2 日志清单 C 危机段）：
  // health 危机先置 healthCrisisSeen；选项落账序 applyEffects → crisisUsed 落记 → 立旗 → applyState → 流水 → rec。
  function resolveCrisisHeadless(crisis) {
    const S = IFY.S;
    S.flatCarry = null; // 危机年不是平年
    if (crisis.key === "health") S.healthCrisisSeen = true;
    const choices = Array.isArray(crisis.choices) ? crisis.choices : [];
    const ch = choices[policyIdx({ kind: "crisis", itemId: "crisis_" + crisis.key, item: crisis, choices })];
    if (!ch) return;
    IFY.applyEffects(ch.effects); S.crisisUsed[crisis.key] = true;
    if (ch.set) S.flags[ch.set] = true; IFY.applyState(ch);
    if (typeof IFY.houseOnBuyFlag === "function") IFY.houseOnBuyFlag(S, ch.set, ch);
    if (typeof IFY.careerNote === "function") IFY.careerNote(S, ch);
    if (typeof IFY.plantSeed === "function") IFY.plantSeed(S, ch, crisis.id || crisis.key);
    S.log.push(`${S.age} 岁 · ${crisis.title}：${ch.label}`);
    IFY.rec("crisis", crisis.key, { choice: ch.label, set: ch.set || null, fx: S.lastDelta });
  }

  // 稀有无头解决（renderRare 的状态变更清单逐项镜像，清单见 wp2 日志清单 C 稀有段）：
  // usedRare 在解决前 push、第一笔 rec 先于立旗/流转——与 renderRare 同序。
  function resolveRareHeadless(r) {
    const S = IFY.S;
    S.flatCarry = null; // 稀有年不是平年
    S.usedRare.push(r.id);
    IFY.rec("rare", r.id, { set: r.set || null });
    if (r.set) S.flags[r.set] = true;
    if (typeof IFY.houseOnBuyFlag === "function") IFY.houseOnBuyFlag(S, r.set, r);
    if (typeof IFY.careerNote === "function") IFY.careerNote(S, r);
    if (typeof IFY.plantSeed === "function") IFY.plantSeed(S, r);
    IFY.applyState(r);
    if (!r.choices) { IFY.applyEffects(r.effects); } else S.lastDelta = "";
    const rtext = IFY.procText(r); // 呈现走同一变体解析，流水句子与真呈现时一致
    S.log.push(`${S.age} 岁 · 【稀有】${rtext}`);
    if (!r.choices) return;
    const c = r.choices[policyIdx({ kind: "rare", item: r, choices: r.choices })];
    if (!c) return;
    IFY.applyEffects(c.effects);
    if (c.set) S.flags[c.set] = true;
    if (typeof IFY.houseOnBuyFlag === "function") IFY.houseOnBuyFlag(S, c.set, c);
    if (typeof IFY.careerNote === "function") IFY.careerNote(S, c);
    if (typeof IFY.plantSeed === "function") IFY.plantSeed(S, c, r.id);
    IFY.applyState(c);
    IFY.rec("rare", r.id, { choice: c.label, set: c.set || null, fx: S.lastDelta });
  }

  // planYear 内容槽无头解决（renderEventYear 的状态变更清单逐项镜像，清单见 wp2 日志清单 C 事件段）：
  // flat / micro / event 三分支。flatCarry 的挂起与合并呈现是呈现屏数账，无头不做：
  // micro 年只落 rec + 流水一行、flatCarry 恒清零；flat 年的 flatYears 计数照记。
  function resolvePlanHeadless(plan) {
    const S = IFY.S, D = IFY.D;
    if (plan.kind === "flat") {
      const f = plan.flat;
      S.flatYears = (S.flatYears || 0) + 1;
      S.flatCarry = null;
      IFY.applyEffects(f.effects);
      S.log.push(`${S.age} 岁 · ${f.text}`);
      IFY.rec("flat", "flat_adult", { text: f.text });
      return;
    }
    if (plan.kind === "micro") {
      const idx = plan.microIdx;
      if (!S.microUsed.includes(idx)) S.microUsed.push(idx);
      const microText = D.micro[idx];
      S.log.push(`${S.age} 岁 · ${microText}`);
      IFY.rec("micro", "micro", { text: microText });
      S.flatCarry = null; // 无头不做平年合并呈现（见函数头注）
      return;
    }
    const e = plan.event; // kind === "event"（L2 链推进或 L3 saliency）
    S.flatCarry = null; // 事件年：挂起的平年只留在流水账里（无头恒无挂起）
    S.usedEvents.push(e.id);
    if (e.set) S.flags[e.set] = true; // 顶层 set 呈现即立
    if (typeof IFY.houseOnBuyFlag === "function") IFY.houseOnBuyFlag(S, e.set, e);
    if (typeof IFY.careerNote === "function") IFY.careerNote(S, e);
    if (typeof IFY.plantSeed === "function") IFY.plantSeed(S, e);
    IFY.applyState(e); // 状态流转与立旗同一时机
    if (!e.choices) { IFY.applyEffects(e.effects); } else S.lastDelta = "";
    IFY.rec("event", e.id, { set: e.set || null, fx: !e.choices ? S.lastDelta : null });
    const etext = IFY.procText(e); // 呈现走同一变体解析（applyState 之后解析，与 renderEventYear 同序）
    S.log.push(`${S.age} 岁 · ${etext}`);
    if (!e.choices) return;
    const c = e.choices[policyIdx({ kind: "event", item: e, choices: e.choices })];
    if (!c) return;
    IFY.applyEffects(c.effects);
    if (c.set) S.flags[c.set] = true;
    if (typeof IFY.houseOnBuyFlag === "function") IFY.houseOnBuyFlag(S, c.set, c);
    if (typeof IFY.careerNote === "function") IFY.careerNote(S, c);
    if (typeof IFY.plantSeed === "function") IFY.plantSeed(S, c, e.id);
    IFY.applyState(c);
    IFY.rec("event", e.id, { choice: c.label, set: c.set || null, fx: S.lastDelta });
  }

  // 无头年步进本体：决策序与 engine.js step() 严格对齐（蓝图 5.1/5.2）——
  // 进程拍（父母 → 出生保送 → 首次露面保底 → 领证保送 → dating → 出国去向 → 退休相位）→ 分岔 →（瞥视跳过）→ planYear 内容槽。
  // 父母进程已在出生时建好，这里只调 parentsDue()，且至多一件/年（蓝图 5.3，两条人生节奏同构）。
  // 不受控 Track 不瞥视、无反思、无呈现：GLIMPSE_AGES 年龄直接落进 planYear，与受控 Track 的
  // 瞥视年不同——瞥视是玩家层的观看动作，不占被瞥视者的年份（它在那一年照常过日子）。
  function stepYearHeadless() {
    const S = IFY.S, D = IFY.D;
    if (!S || !S.route) return;
    const pdue = IFY.parentsDue();
    if (pdue) { const pit = D.events.find((e) => e.id === pdue.item); if (pit) resolveProcHeadless(pit, pdue.who, pdue.beat); }
    // 出生保送（孩子线批次 S1）：与受控 step() 同位同规——立约「要」次年必达 p3_046，排在 dating 摊牌之前；
    // 无头进程解决同样不推 usedEvents（池路 resolvePlanHeadless 才推），在此补记防池抽二次呈现。
    if (IFY.bornDue()) { const bit = D.events.find((e) => e.id === "p3_046"); if (bit) { if (!S.usedEvents.includes(bit.id)) S.usedEvents.push(bit.id); resolveProcHeadless(bit); } }
    // 首次露面保底（孩子线批次 S2）：与受控 step() 同位同规——出生满 3 年未露面必达一条低龄孩子拍
    // （选拍 kidDebutItem，无合格条目落保底拍）；补记 usedEvents，呈现后当场 syncKidDebut 立旗闭环。
    if (IFY.kidDebutDue()) { const kit = IFY.kidDebutItem(); if (kit) { if (!S.usedEvents.includes(kit.id)) S.usedEvents.push(kit.id); resolveProcHeadless(kit); IFY.syncKidDebut(); } }
    // 成家接力（孩子线批次 S3）：与受控 step() 同位同规——定下满 1 年未领证必达 p3_086 本体；
    // 补记 usedEvents（同为 p3_003 的 chain 前置接点）。
    if (IFY.licenseDue()) { const lit = D.events.find((e) => e.id === "p3_086"); if (lit) { if (!S.usedEvents.includes(lit.id)) S.usedEvents.push(lit.id); resolveProcHeadless(lit); } }
    // 站稳门（孩子线批次 S4）：与受控 step() 同位同规——领证保送之后、dating 摊牌之前呈现
    // fork_kid（定形 kidForkView 与呈现层共用）；分岔独占本年，解决后 return（与下方年龄
    // 分岔同规），选择走 chooseForTrack 既有通用回落（按新 id 的规则登记是 S5 的事）。
    if (IFY.kidGateDue()) { const kf = IFY.kidForkView(); if (kf) { resolveForkHeadless(kf); return; } }
    if (IFY.datingDue()) { const dit = D.events.find((e) => e.id === "proc_dating"); if (dit) resolveProcHeadless(dit); }
    IFY.settleAbroadDefault();
    const akd = IFY.abroadKindDue();
    if (akd) { const ait = D.events.find((e) => e.id === akd.item); if (ait) resolveProcHeadless(ait); }
    const wpd = IFY.workPhaseDue();
    if (wpd) { const wit = D.events.find((e) => e.id === wpd.item); if (wit) resolveProcHeadless(wit); }
    if (typeof IFY.wageDue === "function") IFY.wageDue(); // 工资轮：与受控 step() 同点同规（影子不打折，设计稿 §二.3）
    // 入行关口（第 1 期 P1-6 激活）：与受控 step() 同位同规——工资轮之后、年龄分岔
    // 查找之前判定，命中即以政策 F 无头解决本年（resolveForkHeadless，政策本体与
    // 打分零改动）。gateDue 只读账零随机、组装随机走职业自有流的影子私有腿
    // （"#shadow#career"），与受控轨互不可见。
    if (typeof IFY.gateDue === "function" && typeof IFY.gateForkView === "function") {
      const gk = IFY.gateDue(S, "first") ? "first" : (IFY.gateDue(S, "switch") ? "switch" : null);
      if (gk) { const gv = IFY.gateForkView(S, gk); if (gv) { resolveForkHeadless(gv); return; } }
    }
    let fork = D.forks.find((f) => f.age === S.age && !f.procOnly && (!f.route || f.route === S.route.id) && (!f.forbidRoute || f.forbidRoute !== S.route.id) && (!f.forbid || !S.flags[f.forbid]) && (!f.anyParentAlive || S.state.dad === "alive" || S.state.mom === "alive") && (!f.state || IFY.met(f))); // 与 step() 同式（含 fork58 互锁，下行）
    if (fork && fork.age === 58 && typeof IFY.retireDecidedThisYear === "function" && IFY.retireDecidedThisYear()) fork = null;
    if (fork) { resolveForkHeadless(fork); return; }
    // 瞥视：跳过——不受控 Track 不瞥视任何人（蓝图 5.1 第 2 步注）
    const plan = IFY.planYear();
    if (plan.kind === "crisis") { resolveCrisisHeadless(plan.crisis); return; }
    if (plan.kind === "rare") { resolveRareHeadless(plan.rare); return; }
    resolvePlanHeadless(plan);
  }

  // ---------- stepUncontrolled（蓝图 5.1 挂点） ----------
  // advance() 在受控 Track 未终局时调用：切进不受控 Track 跑它的一年——
  // age+1 → 它自己的 rollDeath()（它自己的进程流 + 同一年代参数表，health.js 原样）→
  // 掷中落 death 并冻结（此后每年直接跳过）；未死则 stepYearHeadless() 过完这一年（WP2）。
  // v0.32.0 片 C：与受控 advance 同口径废顶——逐年掷死亡直到掷中或触保险丝（MAX_AGE=110，
  // 触顶由 forceFuseDeath 强制终局）；旧档里停在 80 的影子状态由此自动续活，不再冻结。
  function stepUncontrolled() {
    const session = IFY.session;
    if (!session) return;
    const other = session.tracks[session.controlTrack === "A" ? "B" : "A"];
    if (!other || !other.state) return;
    const st = other.state;
    if (st.death) return; // 已终局：冻结
    if (st.age >= IFY.MAX_AGE) { // 已及保险丝却无死亡（只可能来自构造/边界档）：补一次保险丝终局，不许留无终局状态进结算
      withLife(other, () => { if (typeof IFY.forceFuseDeath === "function") IFY.forceFuseDeath(); });
      return;
    }
    withLife(other, () => {
      IFY.S.age += 1;
      if (IFY.S.age > IFY.MAX_AGE) IFY.S.age = IFY.MAX_AGE;
      if (IFY.rollDeath()) return; // death 已由 rollDeath 落进本 Track 的账本与流水；冻结靠上方 death 检查
      if (IFY.S.age >= IFY.MAX_AGE) { if (typeof IFY.forceFuseDeath === "function") IFY.forceFuseDeath(); return; }
      stepYearHeadless();
    });
  }

  // ---------- 控制权交接 handControl（蓝图 7.2，二期 WP6）：只动指针，数据零搬运 ----------
  // 五步顺序写死，每步可断言。纯度构造保证：本函数不写任何 Track 的 state 字段——唯一的
  // state 内变更是第 3 步经 rec()/log.push 落进两本账的 swap 记账（账本与流水各 +1），那是
  // 记账不是搬运；玩家层字段（reflections 等）的镜像由各写入口自愈，权威恒在 session.meta，
  // 本函数只改 meta（controlLog/swap/swapped）与控制权指针，流计数只在全局与条目间等值搬运。
  function handControl() {
    const fail = (why) => { console.error("handControl 前置校验失败（提问本不该出现）：" + why); return false; };
    const session = IFY.session;
    // 1. 前置校验：任一不满足即断言失败——返回 false 且不改任何状态
    if (!session || !session.tracks || !session.meta) return fail("session 不存在");
    const fromKey = session.controlTrack;
    const fromEntry = session.tracks[fromKey];
    if (!fromEntry || fromEntry.state !== IFY.S) return fail("controlTrack 未指向当前受控 Track");
    const toKey = fromKey === "A" ? "B" : "A";
    const toEntry = session.tracks[toKey];
    if (!toEntry || !toEntry.state) return fail("目标 Track 不存在");
    if (toEntry.state.death) return fail("目标 Track 已终局");
    const X = IFY.S.age;
    if (!(typeof X === "number" && X < (IFY.MAX_AGE || 80)) || !(toEntry.state.age < (IFY.MAX_AGE || 80))) return fail("age 已达上限");
    const meta = session.meta;
    if (meta.swapped) return fail("已交换过（meta.swapped=true）");
    const fromName = (fromEntry.state.route && fromEntry.state.route.name) || fromEntry.routeId || "";
    const toName = (toEntry.state.route && toEntry.state.route.name) || toEntry.routeId || "";
    // 2. meta 记账：关当前段、开新段；落 swap 与 swapped
    if (!Array.isArray(meta.controlLog)) meta.controlLog = [];
    let openSeg = null;
    for (let i = meta.controlLog.length - 1; i >= 0; i--) { if (meta.controlLog[i] && meta.controlLog[i].toAge == null) { openSeg = meta.controlLog[i]; break; } }
    if (openSeg) openSeg.toAge = X; else meta.controlLog.push({ track: fromKey, fromAge: X, toAge: X });
    meta.controlLog.push({ track: toKey, fromAge: X, toAge: null });
    meta.swap = { age: X, from: fromName, to: toName };
    meta.swapped = true;
    // 3. 两本账各记一笔 + 各推一条流水行：交出侧在当前上下文直接落；接管侧进 withLife 落
    IFY.rec("swap", "swap_out", { choice: toName });
    IFY.S.log.push(`${X} 岁 · 交换：这条路交给了另一个你`);
    withLife(toEntry, () => {
      IFY.rec("swap", "swap_in", { choice: fromName });
      IFY.S.log.push(`${X} 岁 · 交换：从这一年起，由你来过这条路`);
    });
    // 4. 翻指针（数据零搬运）：全局三股流计数与 schedStats 先等值回写交出条目，翻转指针，
    //    再把接管条目的 streams/schedStats 装进全局（键处理照 withLife 写法），IFY.S 改绑接管 state
    fromEntry.streams = { n: IFY.RNG.a, w: IFY.RNGW.a, a: IFY.RNGA.a };
    if (IFY.schedStats) fromEntry.schedStats = { ...IFY.schedStats };
    session.controlTrack = toKey;
    IFY.RNG.a = toEntry.streams.n; IFY.RNGW.a = toEntry.streams.w; IFY.RNGA.a = toEntry.streams.a;
    if (IFY.schedStats && toEntry.schedStats) { for (const k of Object.keys(IFY.schedStats)) delete IFY.schedStats[k]; Object.assign(IFY.schedStats, toEntry.schedStats); }
    IFY.S = toEntry.state;
    // 5. 存档（存在时）
    if (typeof IFY.save === "function") IFY.save();
    return true;
  }

  // ---------- 存档 v2 序列化（蓝图 3.3） ----------
  function trackForSave(track, isControl) {
    const st = track.state;
    if (isControl) track.streams = { n: IFY.RNG.a, w: IFY.RNGW.a, a: IFY.RNGA.a }; // 受控 Track 的流计数以全局三股为现行值
    const out = {};
    for (const k of Object.keys(st)) {
      if (PLAYER_FIELDS.includes(k) || STREAM_KEYS.includes(k)) continue; // 玩家层字段只存 meta 一份（3.3）
      out[k] = st[k];
    }
    out.rngA = track.streams.n; out.rngW = track.streams.w; out.rngAmb = track.streams.a; // 沿用现行存档键名口径（rngA=叙事流、rngAmb=环境流，历史包袱照旧）
    out.routeId = track.routeId || (st.route ? st.route.id : null);
    out.memorialShown = !!track.memorialShown;
    out.finalized = !!track.finalized;
    return out;
  }

  function serializeSession() {
    const session = ensureSession();
    if (!session) return null;
    const meta = session.meta;
    if (IFY.prefs) { meta.autoMode = IFY.prefs.mode; meta.speed = IFY.prefs.speed; } // 推进设置权威 = prefs（与现行 S.autoMode 镜像口径一致），落盘进 meta
    return {
      v: 2,
      controlTrack: session.controlTrack,
      tracks: {
        A: trackForSave(session.tracks.A, session.controlTrack === "A"),
        B: session.tracks.B ? trackForSave(session.tracks.B, session.controlTrack === "B") : null,
      },
      meta: {
        reflections: meta.reflections, glimpsesSeen: meta.glimpsesSeen, glimpsesSkipped: meta.glimpsesSkipped,
        autoMode: meta.autoMode, speed: meta.speed,
        swapped: !!meta.swapped, swap: meta.swap || null,
        controlLog: meta.controlLog || [], shownFacts: meta.shownFacts || [], policyV: meta.policyV || 1,
      },
    };
  }

  // ---------- 存档回填（蓝图 3.3 两形状识别） ----------
  // v2 形状接管：逐项补缺（Track 条目 memorialShown/finalized 缺省 false、meta 的 controlLog/
  // shownFacts 缺省 []、policyV 缺省 1，其余 meta 子字段缺省从受控 state 同名字段接管）。
  // 返回受控 Track 的平铺 state（挂 rngA/rngW/rngAmb 过渡键，供 engine resume 处理器按现行口径读流），
  // 且该对象就是 session 里受控 Track 条目的 state 本体（回填改动直接落在 session 上）。
  function adoptSessionSave(raw) {
    const control = raw.controlTrack === "B" ? "B" : "A";
    const mkTrack = (entry) => {
      if (!entry) return null;
      const state = {};
      for (const k of Object.keys(entry)) {
        if (STREAM_KEYS.includes(k) || k === "routeId" || k === "memorialShown" || k === "finalized") continue;
        state[k] = entry[k];
      }
      return {
        state,
        streams: {
          n: typeof entry.rngA === "number" ? entry.rngA : 0,
          w: typeof entry.rngW === "number" ? entry.rngW : 0,
          a: typeof entry.rngAmb === "number" ? entry.rngAmb : 0,
        },
        routeId: entry.routeId || (state.route ? state.route.id : null),
        memorialShown: !!entry.memorialShown, finalized: !!entry.finalized, schedStats: zeroSched(),
        _flat: { rngA: entry.rngA, rngW: entry.rngW, rngAmb: entry.rngAmb },
      };
    };
    const tracks = { A: mkTrack(raw.tracks && raw.tracks.A), B: mkTrack(raw.tracks && raw.tracks.B) };
    const ctlState = tracks[control] ? tracks[control].state : (tracks.A ? tracks.A.state : {});
    const meta = defaultMeta(ctlState);
    const rm = raw.meta || {};
    if (Array.isArray(rm.reflections)) meta.reflections = rm.reflections;
    if (typeof rm.glimpsesSeen === "number") meta.glimpsesSeen = rm.glimpsesSeen;
    if (typeof rm.glimpsesSkipped === "number") meta.glimpsesSkipped = rm.glimpsesSkipped;
    if (rm.autoMode) meta.autoMode = rm.autoMode;
    if (rm.speed) meta.speed = rm.speed;
    meta.swapped = !!rm.swapped; meta.swap = rm.swap || null;
    meta.controlLog = Array.isArray(rm.controlLog) ? rm.controlLog : [];
    meta.shownFacts = Array.isArray(rm.shownFacts) ? rm.shownFacts : [];
    meta.policyV = typeof rm.policyV === "number" ? rm.policyV : 1;
    IFY.session = { controlTrack: control, tracks, meta };
    // Track state 的玩家层同名字段回填为 meta 镜像（同形保留、恒不作数，3.1）：reflections 与 meta 同一数组
    for (const k of ["A", "B"]) {
      const t = tracks[k]; if (!t) continue;
      t.state.reflections = meta.reflections;
      t.state.glimpsesSeen = meta.glimpsesSeen; t.state.glimpsesSkipped = meta.glimpsesSkipped;
      t.state.autoMode = meta.autoMode; t.state.speed = meta.speed;
    }
    const flat = tracks[control] ? tracks[control].state : ctlState;
    const fl = tracks[control] ? tracks[control]._flat : {};
    flat.rngA = fl.rngA; flat.rngW = fl.rngW; flat.rngAmb = fl.rngAmb; // 过渡键：engine resume 按现行口径从 flat 读三股流计数（serializeSession 写回时剔除、改从 streams 写）
    return flat;
  }

  // 旧平铺档（无 tracks 字段，v0.20.4 及更早）就地包成 session（蓝图 3.3）：
  // 旧 state = Track_A、controlTrack="A"、tracks.B=null、meta 从旧 state 同名字段接管。
  // 本局按无 Track_B 局玩完，不中途补生 Track_B（3.3）。
  function wrapLegacySession(flat) {
    const meta = defaultMeta(flat);
    meta.reflections = Array.isArray(flat.reflections) ? flat.reflections : meta.reflections;
    meta.controlLog = [{ track: "A", fromAge: flat.age, toAge: null }];
    IFY.session = {
      controlTrack: "A",
      tracks: {
        A: {
          state: flat,
          streams: {
            n: typeof flat.rngA === "number" ? flat.rngA : 0,
            w: typeof flat.rngW === "number" ? flat.rngW : 0,
            a: typeof flat.rngAmb === "number" ? flat.rngAmb : 0,
          },
          routeId: flat.route ? flat.route.id : null, memorialShown: false, finalized: false, schedStats: zeroSched(),
        },
        B: null,
      },
      meta,
    };
    return flat;
  }

  // 分家记账（丙案第一步）·B 的事实层：仅当分家点来自童年搬家预约时调用（mergeIntoRoute 在
  // birthShadow 之后同拍调用本函数；birthShadow 本体与调用点一字不动）。做两件事，都只落在
  // 事实/记号层：①童年是两条命共用的，预约同值落进 B 的存档（B 的分家记账与 A 同源）；
  // ②按 A 实选的反面给 B 立一面记号旗（A 搬了→B 立 split_not_moved；A 没搬→B 立 split_moved）。
  // 两面旗都无任何内容门读取，不影响 B 的人生走向与任何一股随机流。
  function applySplitFactToShadow() {
    const A = IFY.S;
    const ses = IFY.session;
    const B = ses && ses.tracks && ses.tracks.B && ses.tracks.B.state;
    if (!A || !B || !A.pendingSplit || A.pendingSplit.source !== "move") return;
    B.pendingSplit = { age: A.pendingSplit.age, eventId: A.pendingSplit.eventId, label: A.pendingSplit.label, source: "move", branch: A.pendingSplit.branch || "moved" };
    B.flags[A.pendingSplit.branch === "stayed" ? "split_moved" : "split_not_moved"] = true;
  }

  Object.assign(IFY, {
    seedShadowStreams, withLife, birthShadow, stepUncontrolled, stepYearHeadless, handControl,
    defaultMeta, playerMeta, buildSession, ensureSession,
    serializeSession, adoptSessionSave, wrapLegacySession, applySplitFactToShadow,
  });
})(window.IFY);
