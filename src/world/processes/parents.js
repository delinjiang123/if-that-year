// [模块]《如果那年》引擎分片：父母进程。独立模块（包装器 + window.IFY 共享命名空间），加载顺序见 index.html。
// [模块]注：renderProcItem 是进程拍通用渲染（父母/dating/退休/出国等进程条目共用），随本文件存放。
(function (IFY) {
  "use strict";
  // ---------- 父母进程（v0.18.0，内核一期）：父亲、母亲各一条身体进程 ----------
  // 出生时父母年龄、父母一代人寿命均值与散布按年代标定（标定说明见 docs/PARENTS-PROCESS.md）；
  // 需照护、住院、离世由进程越线发作成动静（pack36 的 proc_* 条目），不再等事件抽中。主角自身死亡曲线不在此列，一字未动。
  const PARENT_CAL = {
    // 2026-11-10 重标（v0.60.59，用户母亲亲测点出）：旧均值取的是父母那代人「从出生算的平均寿命」，
    // 被没活到当父母就去世的人拉低了——能把孩子拉扯大的父母，是已经活过三四十岁的人，
    // 他们的寿命要按「活到生育年龄之后」的口径算。旧标定下 c1955 的父亲在主角中位 35 岁离世、
    // c1965 中位 38 岁，等于大多数局里主角三十多岁就送走父亲，失真且伤人。新均值按条件寿命重标、
    // 再按用户亲定的暖向与高寿口径上浮放宽，并补 c1985/c1995 两行（此前缺行、借用 c2000 行）。
    // 标定与实测见 docs/PARENTS-PROCESS.md 修订节。
    c1955: { dadAge: [27, 35], momAge: [25, 33], dadLife: [79, 11], momLife: [83, 11] },
    c1965: { dadAge: [27, 35], momAge: [25, 33], dadLife: [81, 11], momLife: [86, 11] },
    c1978: { dadAge: [26, 34], momAge: [24, 32], dadLife: [83, 11], momLife: [88, 11] },
    c1985: { dadAge: [26, 34], momAge: [24, 32], dadLife: [84, 11], momLife: [89, 11] },
    c1995: { dadAge: [25, 33], momAge: [24, 32], dadLife: [85, 12], momLife: [90, 12] },
    c2000: { dadAge: [25, 33], momAge: [23, 31], dadLife: [84, 12], momLife: [90, 12] },
    // 用户 2026-11-10 亲定方向：这条线宁可暖过头，不再拿「真实分布」压着——父母活到八九十是常景，
    // 主角六十岁上下、父母八十多岁还在，是这游戏该有的寻常画面。最终口径按父母自己的年纪放：
    // 父亲那代往八十上下想、母亲往八十五去想，尾巴留厚（散布放宽到 ±11/12，长寿抽把 94–99 这段接上，
    // 不留 89–95 的断档）。抽法与百岁彩蛋的切法在 parentFate 内，百岁有专属进程拍。
  };

  function triW(draw) { const d = draw || (() => IFY.rngW()); return (d() + d() + d() - 1.5) / 1.5; } // [-1,1] 近正态扰动（进程流；v0.21 WP1：抽取函数可注入，缺省即进程流 rngW，公式不动）

  // 照护预警信号点（v0.20.0 M2 收尾，可见检定）：care 起点前 2–4 年的一个呈现点。
  // 由已掷出的 careAge/deathAge 确定性派生、不消费进程流——父母各时点（care/hosp/dead）的掷点序列与旧版逐位一致，死亡分布不动。
  // 旧存档的父母对象没有 signalAge/signalShown 字段：读时现算现补（signalShown 缺省未呈现），口径与新局一致。
  function signalAgeOf(P) {
    const a = Math.max(22, P.careAge - (2 + ((P.deathAge + P.careAge) % 3)));
    return a < P.careAge ? a : P.careAge - 1;
  }

  // 离世走法派生（CL-152 二期五样化于 CL-153 二期，用户 2026-11-13 点题「不要父亲病了过几年走了，
  // 母亲过几年再走同样路线」「样式可以再多一些」）：每位父母按已掷出的三个数派生走法——
  // 缓降 slow（全管线）/ 短病 short（无照护拍、住院改在临终前一年）/ 突然 sudden（无照护、无住院，
  // signal 作唯一伏笔）/ 反复 repeat（照护段内住两回院，首住 careAge+1、二住临终前一年，中间有
  // 好起来的日子）/ 病后安然 recovered（早年大病一场住院扛过来、又活好些年，终局按 sudden 形收尾）。
  // 纯函数、零抽数：只读 age0/deathAge/careAge，掷序与死亡分布逐位不动。走法在掷命瞬间冻结；
  // 延寿只移 deathAge、不重算（parentsDue 与结算侧只读 P.route，不许拿现行 deathAge 反复重派生）。
  // 切片（CL-153 一期 Monte Carlo 定案，96,000 人实测 45.9/20.2/11.9/12.6/9.3）：k<42 slow /
  // 42–61 short / 62–73 sudden / 74–90 repeat / ≥91 recovered；改判两条——repeat 但照护间隙
  // gap<3（两住装不下回暖间隔）改判 slow、recovered 但早年窗口 span<4 改判 sudden（实测零触发，
  // 只防将来标定重调）。老存档缺 route 字段：initParents／parentsDue 入口按载入时数值现算写回、
  // 一次冻死（同 signalAge 口径）；已存 route 字段的档冻死不重派生，新切片只及新局与无字段补齐。
  function routeOf(P) {
    const k = (P.deathAge * 31 + P.careAge * 17 + P.age0 * 7) % 100;
    if (k < 42) return "slow";
    if (k < 62) return "short";
    if (k < 74) return "sudden";
    if (k < 91) return P.deathAge - P.careAge < 3 ? "slow" : "repeat";
    return earlySpanOf(P) < 4 ? "sudden" : "recovered";
  }
  function ensureRoute(P) { if (P && !P.route) P.route = routeOf(P); return P; }

  // 病后安然型的早年住院窗口（CL-153 二期）：主角年龄 lo=22（住院拍本体下限、陪护选项要主角成年）
  // 到 hi=careAge−5（与照护段至少隔 5 年，插曲才不与前奏混）；落点由已掷三数派生、零抽数。
  // signalAge≥careAge−4 恒在窗口关闭之后，时序由构造保证不打架。
  function earlySpanOf(P) { return (P.careAge - 5) - 22 + 1; }
  function earlyHospAtOf(P) {
    const span = earlySpanOf(P);
    if (span < 1) return null;
    return 22 + ((P.age0 * 13 + P.deathAge * 7 + P.careAge * 3) % span);
  }

  // 住院呈现次数（呈现层记账，与 signalShown/bdayShown 同类、非掷数）：advanceParentStage 每呈现
  // 一次住院拍累加；字段缺失（老档）时按 stage 读时推定（已在 hosp 段＝住过 1 次、余 0 次）——
  // 只供反复型二住判定消费，对 slow/short/sudden/recovered 恒不参与判定。
  function hospCountOf(P) {
    if (!P) return 0;
    if (typeof P.hospCount === "number") return P.hospCount;
    return P.stage === "hosp" ? 1 : 0;
  }

  // v0.21 WP1（蓝图裁定三）：掷点函数 one() 改为可注入流抽取函数——Track_A 传 rngW、Track_B 传它自己的
  // #shadow#world 流包装；公式与 PARENT_CAL 一字不动，缺省抽取即现行 rngW，主线消费顺序与数值逐位不变。
  // parentFate 是 one() 去掉 age0 掷点后的同一条公式：影子出生时 age0 拷自主线（出身共享），只在影子
  // 进程流上重掷 deathAge/careAge/hospAge（命运各自），掷序与 one() 的后半段逐位同构。
  function parentFate(age0, lifeBand, draw) {
    const d = draw || (() => IFY.rngW());
    let life = Math.round(lifeBand[0] + triW(d) * lifeBand[1]);
    // 长寿抽（v0.60.59，用户亲定，含当晚回调）：3% 的父母寿命抬进 94–99 岁——留厚尾巴，把常规散布上沿
    // 与高寿段接上、不留断档；其中再约一成半抬进 100–102 岁，这才是百岁彩蛋本体：折算约 0.45%/人、
    // 每局约 1% 至少一位——是稀罕事，不是常景（用户当晚回调：「百岁又太多了」，初版 1.75%/人过密）。
    // 百岁当年由 parentsDue 发专属拍。
    if (d() < 0.03) { life = 94 + Math.floor(d() * 6); if (d() < 0.15) life = 100 + Math.floor(d() * 3); }
    const deathAge = Math.max(26, life - age0); // 换算成主角年龄口径的离世点；下限保证此事不出在童年段（序章不处理）
    const careAge = Math.max(24, deathAge - (2 + Math.floor(d() * 4))); // 需照护段起点：离世前 2–5 年
    const hospAge = deathAge - careAge >= 2 ? careAge + 1 + Math.floor(d() * (deathAge - careAge - 1)) : null;
    return { age0, deathAge, careAge, hospAge, route: routeOf({ age0, deathAge, careAge }), stage: "well", signalAge: signalAgeOf({ careAge, deathAge }), signalShown: false, centuryShown: false, bdayShown: [] }; // stage: well → care → hosp → dead；route 为离世走法（CL-152 二期，掷命瞬间冻结，见 routeOf）；signal 为 care 前的呈现层前置标记（进程内部状态，不进存档状态域、不改 care/hosp/dead 时点）；centuryShown 为百岁拍已呈现标记、bdayShown 为已呈现过的整十寿辰岁数数组（CL-42，同 signal 口径，老档缺字段读时按未呈现）
  }

  function one(ageBand, lifeBand, draw) {
    const d = draw || (() => IFY.rngW());
    const age0 = ageBand[0] + Math.floor(d() * (ageBand[1] - ageBand[0] + 1));
    return parentFate(age0, lifeBand, d);
  }

  function initParents(draw) {
    if (IFY.S.parents) { ensureRoute(IFY.S.parents.dad); ensureRoute(IFY.S.parents.mom); return; } // 老档补齐（CL-152 二期）：父母对象已在档时只补走法——按载入时数值现算写回、一次冻死，掷命不重跑
    if (!IFY.S.route) return;
    const cal = PARENT_CAL[IFY.S.era] || PARENT_CAL.c2000;
    IFY.S.parents = { dad: one(cal.dadAge, cal.dadLife, draw), mom: one(cal.momAge, cal.momLife, draw) };
  }

  // 本年到期的进程动静（每岁至多一件：离世 > 住院 > 照护，父先于母）；已被事件写过世的父母不再发作
  function parentsDue() {
    if (!IFY.S.parents) return null;
    // 内容修复批二轮（双亲进程防重入）：52 岁分岔 fork52「父母需要人了」已把照护落定（住院＋请人/轮流/自己陪），
    // 但分岔不推进进程段位——此后段位仍停在 well 的在世父母，在本函数口径上一律视同已进 care 段：
    // 早段信号与照护拍不再回头发，进程住院拍凭 care 段照常可出，离世不受影响。判据只读账本落账
    // （引擎与无头解决器记账同形：kind="fork"、id="fork52"），不改掷点、段位字段与存档形状，老档同口径。
    const fork52Done = Array.isArray(IFY.S.ledger) && IFY.S.ledger.some((e) => e && e.kind === "fork" && e.id === "fork52");
    const due = [];
    for (const who of ["dad", "mom"]) {
      const P = IFY.S.parents[who];
      if (!P || IFY.S.state[who] !== "alive") continue;
      ensureRoute(P); // CL-152 二期：走法补齐兜底（直调本函数的路径——含影子无头侧——同口径冻死）
      const stage = fork52Done && P.stage === "well" ? "care" : P.stage; // fork52 已落账时 well 视同 care（仅本函数判定用，不写回）
      const page = IFY.S.age + P.age0; // 父母今年的实岁
      const bday = [60, 70, 80, 90].includes(page) && !(P.bdayShown || []).includes(page) ? page : 0; // 整十寿辰（CL-42）：恰满该岁数、当年未呈现过才发
      // 住院发作岁按走法分流（CL-152 二期、CL-153 二期扩）：缓降照旧读 hospAge；短病改在临终前一年
      // （按现行 deathAge 算——延寿移动 deathAge 时病程整体后移）；反复首住在照护段开年 careAge+1
      // （原掷 hospAge 就此闲置，与短病/突然闲置同例）；突然与病后安然无终局住院拍（null 关门，
      // 病后安然的住院走下方早年分支、与临终脱钩）。
      const hospAt = P.route === "sudden" || P.route === "recovered" ? null : P.route === "short" ? P.deathAge - 1 : P.route === "repeat" ? P.careAge + 1 : P.hospAge;
      if (IFY.S.age >= P.deathAge) due.push({ pr: 0, item: "proc_" + who + "_dead", who, beat: "dead" });
      else if (P.route === "repeat" && stage === "hosp" && hospCountOf(P) === 1 && IFY.S.age >= P.deathAge - 1) due.push({ pr: 1, item: "proc_" + who + "_hosp", who, beat: "hosp" }); // 反复型二住（CL-153 二期）：临终前一年再住一回；必须插在下方续查分支之前——否则二住年份被寿辰/百岁续查吞掉。二住与寿辰同年时靠同年重入在二住呈现后由续查补发
      else if (hospAt !== null && IFY.S.age >= hospAt && stage === "hosp") {
        // 住院拍已呈现：衰老段本年无新拍，但喜事拍不被这一档吞没——百岁/寿辰在此续查（同为 pr 4 档，
        // 排在衰老拍之后；不续查的话，住过院的父母将永远等不到寿辰与百岁拍）。
        if (!P.centuryShown && page >= 100) due.push({ pr: 4, item: "proc_" + who + "_century", who, beat: "century" });
        else if (bday) due.push({ pr: 4, item: "proc_" + who + "_bday" + bday, who, beat: "bday" + bday });
      }
      else if (hospAt !== null && IFY.S.age >= hospAt && (stage === "care" || (P.route === "short" && stage === "well"))) due.push({ pr: 1, item: "proc_" + who + "_hosp", who, beat: "hosp" }); // 短病无照护段：住院凭 well 段直发（fork52 后 stage 视同 care 亦同路）
      else if (IFY.S.age >= P.careAge && stage === "well" && (P.route === "slow" || P.route === "repeat")) due.push({ pr: 2, item: "proc_" + who + "_care", who, beat: "care" }); // 照护拍属缓降与反复（CL-152 二期立、CL-153 二期扩）：短病/突然/病后安然不发，链条自然落到信号/喜事分支
      else if (P.route === "recovered" && !P.earlyHospShown && P.stage === "well" && earlyHospAtOf(P) !== null && IFY.S.age >= earlyHospAtOf(P) && IFY.S.age <= P.careAge - 5) due.push({ pr: 1, item: "proc_" + who + "_hosp", who, beat: "hosp" }); // 病后安然的早年住院（CL-153 二期）：读原始 stage——fork52 落账后 well 在本函数口径视同 care，那顶的是照护段、不是这场病，按视同值判会误吞；窗口上限（careAge−5）兼作老档补齐的关门线，过窗未发即不再补发
      else if (stage === "well" && !P.signalShown && IFY.S.age >= signalAgeOf(P) && IFY.S.age < P.careAge) due.push({ pr: 3, item: "proc_" + who + "_signal", who, beat: "signal" }); // 预警信号：care 之前、每位父母至多一次，优先级最低
      else if (!P.centuryShown && page >= 100) due.push({ pr: 4, item: "proc_" + who + "_century", who, beat: "century" }); // 百岁彩蛋拍：父母年满一百且在世时发作一次（能活着到这一年，本身就是长寿抽命中的人）；排在一切衰老拍之后，喜事不抢丧事的位
      else if (bday) due.push({ pr: 4, item: "proc_" + who + "_bday" + bday, who, beat: "bday" + bday }); // 整十寿辰拍（CL-42，用户亲定）：60/70/80/90 恰满当年发作一次，与百岁同档、排在衰老拍之后；呈现完回到本年，当年分岔/事件照常
    }
    if (!due.length) return null;
    due.sort((a, b) => a.pr - b.pr);
    return due[0];
  }

  // 父母进程段位推进（v0.21 WP2 抽共享）：节拍解决即推进父母进程段位（离世的状态流转走条目自身的 setState）。
  // 呈现层 renderProcItem 与无头解决器（shadow-life.js 的 stepYearHeadless）共用这一份——蓝图 5.2 点名抽取处：
  // 改这段逻辑两边同时生效，不许在无头侧另抄一份。函数体与抽取前 renderProcItem 内的原段逐字相同。
  function advanceParentStage(who, beat) {
    if (beat && IFY.S.parents && IFY.S.parents[who]) { // 节拍呈现即推进父母进程段位（离世的状态流转走条目自身的 setState）
      if (beat === "signal") { IFY.S.parents[who].signalShown = true; } // 信号拍只记呈现过：不推进段位、不立 care_stage 旗
      else if (beat === "century") { IFY.S.parents[who].centuryShown = true; } // 百岁拍同 signal 口径：只记呈现过，不推进段位
      else if (typeof beat === "string" && beat.indexOf("bday") === 0) { const P = IFY.S.parents[who]; const arr = P.bdayShown || (P.bdayShown = []); const n = Number(beat.slice(4)); if (!arr.includes(n)) arr.push(n); } // 寿辰拍（CL-42）同 signal 口径：只记该岁数已呈现，不推进段位
      else if (beat === "hosp" && IFY.S.parents[who].route === "recovered" && IFY.S.parents[who].stage === "well" && IFY.S.age <= IFY.S.parents[who].careAge - 5) {
        IFY.S.parents[who].earlyHospShown = true; // 病后安然的早年住院（CL-153 二期）：只是中年插曲——判据与 parentsDue 早年分支同口径（原始 stage 仍在 well、未入照护窗口）；只记呈现过，不推进段位、不立任何旗，此后终局段按 sudden 门走
      }
      else {
        const P = IFY.S.parents[who];
        const nextHospCount = beat === "hosp" ? hospCountOf(P) + 1 : null; // 住院呈现记账（CL-153 二期）：反复型二住判定读它；累加值必须按呈现前段位推定——先改段位再推定，缺字段时会被新段位污染（首住即误记 2 次、二住永不发作）
        P.stage = beat === "dead" ? "dead" : beat === "hosp" ? "hosp" : "care";
        if (nextHospCount !== null) P.hospCount = nextHospCount;
        if (beat === "care") IFY.S.flags.care_stage = true;
      }
    }
  }

  // 陪伴延寿共享函数（v0.60.59 落点、CL-42 一般化，用户亲定）：玩家在一位父母身上的照护投入，
  // 换成这位父母实实在在的年头——在世才移，总寿命封顶 105 岁（deathAge 口径封顶 105−age0）。
  // 返回实际后移年数（0＝未移：在世不满足/年数不正/已到封顶）。玩家侧不显示数字，效果就是父母真的还在。
  // 调用方：进程拍落定（chooseProcChoice / resolveProcHeadless）与普通事件选项的 care 声明（chooseEventChoice / 无头事件解决）。
  function parentCareExtend(who, years) {
    if (who !== "dad" && who !== "mom") return 0;
    if (!IFY.S || !IFY.S.parents || !IFY.S.parents[who] || IFY.S.state[who] !== "alive") return 0;
    const n = Math.floor(Number(years));
    if (!Number.isFinite(n) || n <= 0) return 0;
    const P = IFY.S.parents[who];
    const cap = 105 - P.age0;
    const before = P.deathAge;
    if (before < cap) P.deathAge = Math.min(cap, before + n);
    return P.deathAge - before;
  }

  // 进程条目呈现（pack36 的 proc_* 条目）：与事件年同形，但过完回到本年 step（进程拍不独占这一年，年内的分岔/瞥视照常）
  function renderProcItem(item, who, beat) {
    IFY.curKind = "proc";
    IFY.S.flatCarry = null; // 进程年不是平年
    advanceParentStage(who, beat); // v0.21 WP2：父母 stage 推进改调共享函数（原段代码搬家，逻辑一字不动）
    if (item.set) IFY.S.flags[item.set] = true;
    if (typeof IFY.houseOnBuyFlag === "function") IFY.houseOnBuyFlag(IFY.S, item.set, item);
    if (typeof IFY.careerNote === "function") IFY.careerNote(IFY.S, item); // 第 1 期 P1-2：履历记账（平行账，只写不读，下同）
    if (typeof IFY.plantSeed === "function") IFY.plantSeed(IFY.S, item); // 第 1 期 P1-3：埋种（与 careerNote 镜像同位，唯一写点 plantSeed，下同）
    IFY.applyState(item);
    if (!item.choices) { IFY.applyEffects(item.effects); } else IFY.S.lastDelta = "";
    IFY.rec("proc", item.id, { set: item.set || null, fx: !item.choices ? IFY.S.lastDelta : null });
    IFY.S.log.push(`${IFY.S.age} 岁 · ${IFY.procText(item)}`);
    const GATE_KEYS = ["require", "forbid", "all", "any", "state", "stateAll", "stateNot", "era", "eraIn", "minYear", "route", "routeIn", "forbidRoute", "chain"]; // v0.23 WP6（S-6D）：选项级门与 renderFork 同口径（原只过滤 deferDating，proc_abroad_kind 的 eraIn 不生效）
    let visChoices = item.choices ? item.choices.map((c, i) => [c, i]).filter(([c]) => !(c.deferDating && (IFY.S.datingDefers || 0) >= 2) && (!GATE_KEYS.some((k) => k in c) || IFY.met(c))) : null; // dating 推迟两次后不再给推迟选项
    if (visChoices && !visChoices.length && item.choices) visChoices = item.choices.map((c, i) => [c, i]); // 全被过滤时回落全选项集（与 renderFork 同款，防空屏/abroadKind 永远落不了值）
    IFY.app().innerHTML = `<section class="card">${IFY.head()}<p class="body">${IFY.esc(IFY.procText(item))}</p>${IFY.deltaLine()}
      ${visChoices ? `<div class="choices">${visChoices.map(([c, i]) => `<button class="choice" data-i="${i}">${IFY.esc(c.label)}</button>`).join("")}</div><div id="echo"></div>`
                  : `<button class="primary" id="cont">继续</button>`}</section>`;
    IFY.finishRender();
    if (!visChoices) {
      IFY.save(); IFY.el("cont").addEventListener("click", () => IFY.step());
      // 全程自动选扩围（本批补漏）：无选项的进程拍也是无抉择屏，按 advance 规矩 arm——
      // 否则零点击整局会卡在退休/照护这类叙述拍上。plain/full 都可流过。
      IFY.armAuto(IFY.procText(item), () => IFY.step());
      return;
    }
    const chooseProcChoice = (c, autoSelected) => {
      IFY.clearAuto();
      IFY.applyEffects(c.effects);
      if (c.set) IFY.S.flags[c.set] = true;
      // 陪伴延寿（v0.60.59，用户亲定）：父母照护/住院拍里，玩家亲自回去陪（care_self）让这位父母
      // 实实在在多活 3 年，不只涨关系；请护工照护（care_hired）也有照护之功，多活 1 年；
      // 「先观察」不移。数值与封顶都在共享函数 parentCareExtend 里（CL-42 一般化，本处只传档位）。
      if ((who === "dad" || who === "mom") && (beat === "care" || beat === "hosp") && (c.set === "care_self" || c.set === "care_hired")) {
        parentCareExtend(who, c.set === "care_self" ? 3 : 1);
      }
      // 进程拍选项的 care 声明（CL-42，寿辰拍「正经操办」用）：与普通事件同字段同函数，who 以选项声明为准。
      if (c.care) parentCareExtend(c.care.who, c.care.yrs);
      if (typeof IFY.houseOnBuyFlag === "function") IFY.houseOnBuyFlag(IFY.S, c.set, c);
      if (typeof IFY.careerNote === "function") IFY.careerNote(IFY.S, c);
      if (typeof IFY.plantSeed === "function") IFY.plantSeed(IFY.S, c, item.id);
      IFY.applyState(c);
      if (c.deferDating) { IFY.S.datingSince = IFY.S.age - 3; IFY.S.datingDefers = (IFY.S.datingDefers || 0) + 1; } // 推迟：时钟回拨，下次到期在约 4 年后
      if (c.deferRetire) { if (IFY.S.retirePlan) IFY.S.retirePlan.nodeAge = IFY.S.age + 3; IFY.S.retireDefers = (IFY.S.retireDefers || 0) + 1; } // 退休节点推迟（v0.19.0）：节点后移 3 年，推迟两次后由 proc_retire_auto 收束
      if (autoSelected) IFY.S.log.push(`${IFY.S.age} 岁 · 自动选：${c.label}`);
      IFY.rec("proc", item.id, { choice: c.label, set: c.set || null, fx: IFY.S.lastDelta });
      document.querySelector(".choices").remove();
      IFY.el("echo").innerHTML = `${IFY.deltaLine()}${autoSelected ? `<p class="autonote">自动推进 · 已选「${IFY.esc(c.label)}」</p>` : `<p class="pickednote">已选「${IFY.esc(c.label)}」</p>`}${IFY.echoText(c) ? `<p class="echo">${IFY.esc(IFY.echoText(c))}</p>` : ""}<button class="primary" id="cont">继续</button>`;
      IFY.refreshStatsBar(); // fx-fix：进程拍选项落账后就地刷条（与事件/危机的 v0.31.2 修复对齐，此前漏了这一处，账落了条要等下一整屏才跟上）
      IFY.save(); IFY.el("cont").addEventListener("click", () => IFY.step());
      if (autoSelected) IFY.armAuto(IFY.echoText(c) || c.label, () => IFY.step(), "advance"); // 照事件屏：自动选后回响「继续」接着 arm
    };
    document.querySelectorAll(".choice").forEach((b) => b.addEventListener("click", () => {
      const c = item.choices[Number(b.dataset.i)];
      IFY.choiceBeat(b, () => chooseProcChoice(c, false));
    }));
    // 全程自动选扩围（本批补漏）：带选项的进程拍（摊牌/退休节点等）与事件屏同一套两段式——
    // 抽选只在玩家看得见的选项（visChoices）里抽，走同一落定函数；不补则零点击整局必卡在这类拍上。
    IFY.armAuto(IFY.procText(item), () => {
      const p = Math.floor(IFY.rng() * visChoices.length);
      const btns = document.querySelectorAll(".choices .choice");
      btns.forEach((o, j) => {
        o.disabled = true;
        o.classList.toggle("picked", j === p);
        o.classList.toggle("faded", j !== p);
      });
      IFY.autoPhase2 = setTimeout(() => { IFY.autoPhase2 = null; chooseProcChoice(visChoices[p][0], true); }, 400);
    }, "choice");
  }
  Object.assign(IFY, { PARENT_CAL, triW, signalAgeOf, routeOf, earlyHospAtOf, hospCountOf, initParents, parentsDue, renderProcItem, advanceParentStage, parentOne: one, parentFate, parentCareExtend });
})(window.IFY);
