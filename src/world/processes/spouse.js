// [模块]《如果那年》引擎分片：伴侣进程（dating 到期、立约）。独立模块（包装器 + window.IFY 共享命名空间），加载顺序见 index.html。
(function (IFY) {
  "use strict";
  // 伴侣状态闭环（v0.18.0，审计急修 B6）：dating 超过 6 年必须走向定下来或分手，不许冻结几十年
  function datingDue() {
    return !!(IFY.S.state && IFY.S.state.spouse === "dating" && typeof IFY.S.datingSince === "number" && IFY.S.age - IFY.S.datingSince >= 7);
  }

  // 摊牌分级视图（CL-45）：proc_dating 一生可发至多三遍，文本不许一字不差原样重播——
  // 按本局已推迟次数 S.datingDefers 取版（条目声明 textDefer、推迟项声明 labelDefer/
  // echoDefer，键＝推迟次数，登记见 registry.js 字段字典）：0 遍或未声明变体时原样返回
  // 条目本体（恒等，零影响）；命中时返回浅拷贝视图（换 text 与命中选项的 label/echo，
  // 其余字段与选项对象引用不动），不改条目本体——同页多命（影子无头）不会串版。
  // 呈现层（engine.js step）与无头侧（shadow-life.js stepYearHeadless）取拍点同调本函数，
  // 两侧看到的正文与选项集一致；第三遍（defers≥2）的推迟项撤下走两侧既有过滤，不经此处。
  function datingView(item) {
    if (!item) return item;
    const n = (IFY.S && IFY.S.datingDefers) || 0;
    if (n <= 0) return item;
    const key = String(Math.min(n, 2));
    const t = item.textDefer && item.textDefer[key];
    const hasChoiceVar = Array.isArray(item.choices) && item.choices.some((c) => c && ((c.labelDefer && c.labelDefer[key]) || (c.echoDefer && c.echoDefer[key])));
    if (!t && !hasChoiceVar) return item;
    const view = Object.assign({}, item);
    if (t) view.text = t;
    if (hasChoiceVar) view.choices = item.choices.map((c) => {
      if (!c) return c;
      const l = c.labelDefer && c.labelDefer[key], e = c.echoDefer && c.echoDefer[key];
      if (!l && !e) return c;
      const cc = Object.assign({}, c);
      if (l) cc.label = l;
      if (e) cc.echo = e;
      return cc;
    });
    return view;
  }

  // 出生保送（孩子线批次 S1）：立约「要」之后，出生这一幕不能再靠池抽碰运气——立约次年到期必达，
  // 由进程层呈现 p3_046 本体（呈现点在 engine.js step() 与 shadow-life.js stepYearHeadless() 的进程段，
  // 排在 dating 摊牌之前：立约时的伴侣状态还没被摊牌改动，出生拍按状态取的文本才对得上）。
  // 只服务 covenant has 这一条「先表态、后出生」的线：e_kid_settle / e_kid_final 的「要」是同拍落定，
  // kidsBornAt 按 apply.js 既有口径回落 kidsAt，不经此路；44 岁起才立的约不走出生保送（since 必须 <44），
  // 那条路按设计归晚育链（fork45 的 late_try / lk 链），lk_born 的概率落定不在此列、不许改成必出。
  // 旧存档无 covenant 字段时恒假，不炸。
  function bornDue() {
    const S = IFY.S;
    if (!S || !S.covenant || S.covenant.kind !== "has") return false;
    if (typeof S.covenant.since !== "number" || S.covenant.since >= 44) return false;
    if (!S.state || S.state.kids !== "has") return false;
    if (S.kidsBornAt != null) return false;
    // 旧档上界（v0.39.0 集成时加）：新局每年必查、立约次年必达，上界不碰新局；
    // 只挡本版之前的老档在立约多年后才载入时，把出生追演到四五十岁。
    return S.age > S.covenant.since && S.age <= S.covenant.since + 2;
  }

  // 首次露面保底（孩子线批次 S2）：出生之后，孩子不能一直只活在状态里——出生满 3 年还没有
  // 任何一拍让孩子正面露过面，这一年由进程层必达一条低龄孩子拍（kidDebutDue / kidDebutItem，
  // 呈现点在 engine.js step() 与 shadow-life.js stepYearHeadless() 的进程段，排在 dating 摊牌之前，
  // 与出生保送同位同理：候选拍按状态取版，要以当下状态为准）。
  // 露面事实由引擎同步旗 kid_debut 记账（登记见 registry）：syncKidDebut 扫账本，出生年之后
  // 首条孩子拍呈现即立旗、flagAges 记呈现年龄——与 work.js 的 syncGrandkidSeen 同型。
  // 出生年口径与 scheduler 的 kidAgeTrue 同源：kidsBornAt ?? kidsAt（e_kid_settle / e_kid_final
  // 同拍落定者 kidsBornAt 不落，认 kidsAt，不许只认一条出生路径）。
  const KID_BORN_IDS = new Set(["p3_046", "lk_born", "e55_057"]); // 出生拍本体（与 apply.js BORN_BEATS 同名单）：是「出生」不是「露面」，不计
  const KID_DEBUT_FALLBACK_ID = "proc_kid_debut"; // 保底拍（process-beats.js）：低龄池无合格条目时的兜底场面拍
  let kidDefById = null; // 条目定义索引（懒建：内容装载完成后首调时建，之后只读）
  function kidDefs() {
    if (!kidDefById) { kidDefById = new Map(); for (const e of (IFY.D && IFY.D.events) || []) if (e && e.id) kidDefById.set(e.id, e); }
    return kidDefById;
  }
  function kidBirthAge(S) { return S.kidsBornAt != null ? S.kidsBornAt : (S.kidsAt != null ? S.kidsAt : null); }
  // 「孩子拍」口径（与细案普查 analyze.js 的 isKidBeat 同源）：state/stateAll 以 kids=has 为门，
  // 或带 kidAgeMin/kidAgeMax 年龄门；出生拍本体除外。
  function isKidBeatDef(e) {
    if (!e || KID_BORN_IDS.has(e.id)) return false;
    const hasGate = (o) => !!o && (o.kids === "has" || (Array.isArray(o.kids) && o.kids.includes("has")));
    if (hasGate(e.state) || hasGate(e.stateAll)) return true;
    return e.kidAgeMin != null || e.kidAgeMax != null;
  }
  // 引擎同步：出生年起（含出生当年——出生拍走进程层时同年内容槽仍可再出孩子拍，那是真露面）
  // 首条孩子拍呈现即立 kid_debut。呈现种类认账本里一切呈现记录（event/rare/proc/crisis）。
  function syncKidDebut() {
    const S = IFY.S;
    if (!S || !S.flags || S.flags.kid_debut) return;
    const b = kidBirthAge(S);
    if (b == null || !Array.isArray(S.ledger)) return;
    const defs = kidDefs();
    for (const le of S.ledger) {
      if (le.age < b) continue;
      if (le.kind !== "event" && le.kind !== "rare" && le.kind !== "proc" && le.kind !== "crisis") continue;
      if (isKidBeatDef(defs.get(le.id))) {
        S.flags.kid_debut = true;
        if (!S.flagAges) S.flagAges = {};
        if (!("kid_debut" in S.flagAges)) S.flagAges.kid_debut = le.age;
        return;
      }
    }
  }
  // 到期判定：孩子已出生、还没露过面、出生满 3 年。判定前先同步——池抽已让孩子露过面的局
  // 在此自清，不进保底；判定本身不掷骰、不动随机流（未到期局与旧行为逐字一致）。
  function kidDebutDue() {
    syncKidDebut();
    const S = IFY.S;
    if (!S || !S.state || S.state.kids !== "has") return false;
    if (!S.flags || S.flags.kid_debut) return false;
    const b = kidBirthAge(S);
    if (b == null) return false;
    return S.age >= b + 3;
  }
  // 选拍：低龄孩子拍（kidAgeMax ≤3）里 met 过的按现行权重（w，缺省 1）掷一条——到期当年
  // kidAge 恰为 3，年龄门实际只放行 kidAgeMax=3 的几条；一条都不合格时落保底拍。
  // 已呈现过的（usedEvents）不重选；出生拍本体与进程专属拍不进候选。
  function kidDebutItem() {
    const S = IFY.S, D = IFY.D;
    if (!S || !D || !Array.isArray(D.events)) return null;
    const cands = D.events.filter((e) => e && e.kidAgeMax != null && e.kidAgeMax <= 3 && !e.procOnly && !KID_BORN_IDS.has(e.id) && !(S.usedEvents || []).includes(e.id) && IFY.met(e));
    if (!cands.length) return D.events.find((e) => e.id === KID_DEBUT_FALLBACK_ID) || null;
    let total = 0; for (const e of cands) total += (e.w || 1);
    let r = IFY.rngA() * total;
    for (const e of cands) { r -= (e.w || 1); if (r < 0) return e; }
    return cands[cands.length - 1];
  }

  // 成家接力·领证保送（孩子线批次 S3）：定下之后没有任何机制把人送到领证拍面前，是孩子线细案
  // 1.1 里记的断环（曾定下者 p3_086 呈现率只有 9.7%）——licenseDue 到期后由进程层以锚点拍呈现
  // p3_086 本体（呈现点在 engine.js step() 与 shadow-life.js stepYearHeadless() 的进程段，排在
  // dating 摊牌之前；与出生/露面保底同段，理由见呈现点注释）。无「不领」分支：p3_086 本身无选项、
  // 呈现即领证（呈现层落 married 旗），本判定只管「满 1 年还没领」这一件事。
  // 起算年读账本：partnered 的每一次落定都经 applyState 唯一执行点，同拍写下 kind:"state"、
  // id:"spouse>partnered" 的账本条目（年龄戳为落定当年）——取最后一条即当前这段 partnered 的
  // 起点。离婚/丧偶后再定下会再写一条，天然按新起点起算，不必另设字段。这与 datingSince 的
  // 差别：datingSince 是状态字段、离开 dating 即清空；partnered 起点没有对应字段，账本流转
  // 是唯一全程留痕的事实源（settlement 的 playerFacts 与 covenantSettleLineSeg 读的也是它）。
  // proc_dating「定下来」选项同拍自带 set:"married"——那条路的人账面上已婚，不进本判定
  // （婚礼拍也不走 p3_086 的 chain，细案 D-3 甲案：其落定文本自带仪式交代）。
  // 旧存档（账本无 spouse>partnered 条目，如账本制之前推导状态的局）起算事实缺失 → 恒假、不炸，
  // 那批局维持池抽领证的旧行为。
  function partneredSinceOf(S) {
    if (!S || !Array.isArray(S.ledger)) return null;
    let since = null;
    for (const le of S.ledger) {
      if (le && le.kind === "state" && le.id === "spouse>partnered" && typeof le.age === "number") since = le.age;
    }
    return since;
  }
  function licenseDue() {
    const S = IFY.S;
    if (!S || !S.state || S.state.spouse !== "partnered") return false;
    if (!S.flags || S.flags.married) return false;
    const since = partneredSinceOf(S);
    if (since == null) return false;
    return S.age - since >= 1;
  }

  // 分岔文案状态感知（v0.13.1，B2）：选项可带 labelBySpouse/echoBySpouse 变体——partnered 用原文字段，
  // dating 优先 dating 变体、其余状态（single/none/divorced/widowed）用 solo 变体，缺变体回落原文。
  function spouseText(c, kind) {
    const orig = kind === "label" ? c.label : (c.echo || "");
    const m = kind === "label" ? c.labelBySpouse : c.echoBySpouse;
    if (!m) return orig;
    const sp = IFY.S.state.spouse;
    if (sp === "partnered") return orig;
    if (sp === "dating" && m.dating) return m.dating;
    return m.solo || orig;
  }

  // 立约登记（v0.17.0 fork38 立约的参数化版，孩子线批次 S4）：选择登记为持续状态（S.covenant），
  // 后续由年度流事件读账、wait 到期由 kidGateDue 再问、结算行呈现。只记约与旗，kids 的 setState
  // 路径与价格结构一概不动。S4 起 since 不再写死 38、due 不再写死 45：since = 登记当年年龄，
  // wait 的 due = since + 7（D-2 裁定）。入参兼容两形：新调用方传 kind 字符串（"has"/"none"/"wait"）；
  // 旧形传选项对象时按其 set（cov38_*）推 kind，仅作存量调用兜底。
  function registerCovenant(kindOrChoice) {
    const kind = typeof kindOrChoice === "string" ? kindOrChoice
      : kindOrChoice && kindOrChoice.set === "cov38_has" ? "has"
      : kindOrChoice && kindOrChoice.set === "cov38_none" ? "none" : "wait";
    const S = IFY.S, since = S.age;
    S.covenant = { kind, since, due: kind === "wait" ? since + 7 : null };
    const line = kind === "has" ? "立约：孩子的事定了，要。往后的日子，按这个安排走。"
      : kind === "none" ? "立约：孩子的事定了，不要。往后的安排，照这个来。"
      : `立约：再等等。这份账先挂着，${since + 7} 岁到期，再对一回。`;
    S.log.push(`${since} 岁 · ${line}`);
  }

  // 站稳门（孩子线批次 S4，细案第 2.2 节 D7 门槛，用户裁定 D-1 取 dating 腿 7 年）：孩子的事
  // 不再钉在 38 岁问全体，而是随成家进度开门——进程判定 kidGateDue 为真那年，由进程层呈现
  // fork_kid（呈现点在 engine.js step() 与 shadow-life.js stepYearHeadless() 的进程段，排在
  // dating 摊牌之前，与出生/领证保底同段同理：门的两条腿都以摊牌前的伴侣状态为准）。
  // 红线：门只读伴侣状态与时间——partnered 起点读账本（partneredSinceOf，与 licenseDue 同源）、
  // dating 读 datingSince；不读钱、住房、家底、童年与父母状态。无年龄上下限。
  // 首问条件：kids 未定、covenant 未登记、未转晚育链（late_try 已落 = ≥44 选要已由 lk 链
  // 接手，门不再重问——fork45 时代靠年龄钉死天然不重问，状态门必须显式关这一口），且
  // (a) partnered 持续满 2 年，或 (b) dating 满 7 年。
  // 再问模式：covenant 为 wait 且 age ≥ due 且身边仍有伴侣（partnered/dating）——无伴侣者
  // 的悬账走 cov_solo_due 单身对账（细案 1.2 ⑤′），不由本门呈现。
  function kidGateDue() {
    const S = IFY.S;
    if (!S || !S.state || S.state.kids !== "undecided") return false;
    if (S.flags && S.flags.late_try) return false;
    const cov = S.covenant;
    if (cov) {
      if (cov.kind !== "wait" || typeof cov.due !== "number" || S.age < cov.due) return false;
      return S.state.spouse === "partnered" || S.state.spouse === "dating";
    }
    if (S.state.spouse === "partnered") {
      const since = partneredSinceOf(S);
      return since != null && S.age - since >= 2;
    }
    if (S.state.spouse === "dating") {
      return typeof S.datingSince === "number" && S.age - S.datingSince >= 7;
    }
    return false;
  }

  // fork_kid 呈现定形：分岔本体（events.js）一张表写全五种落点选项，呈现时按门况选对——
  // 年龄戳 = 当年岁数（账本/流水/未选支都按实岁记，与年龄分岔同形）；≥44 岁「要」换晚育版
  // （kidLate 选项：落 late_try、不带 setState，kids 落定走 lk 链既有口径，细案 1.2 ⑥）；
  // 再问模式收掉「再等等」、且「不要」换对账版（kidReask 选项：落 late_settle，细案第 5 节）。
  // 本体永远不被改动，呈现与无头解决共用此定形（两呈现点同调）。
  function kidForkView() {
    const S = IFY.S;
    const def = ((IFY.D && IFY.D.forks) || []).find((f) => f.id === "fork_kid");
    if (!def) return null;
    const reask = !!(S.covenant && S.covenant.kind === "wait");
    const late = S.age >= 44;
    const choices = (def.choices || []).filter((c) => {
      if (c.kidLate) return late;
      if (c.kidReask) return reask;
      if (c.set === "kid_yes") return !late;
      if (c.set === "kid_no") return !reask;
      if (c.set === "kid_wait") return !reask;
      return true;
    }).map((c) => Object.assign({}, c));
    return Object.assign({}, def, { age: S.age, choices });
  }

  // fork_kid 落点记账（呈现层与无头解决器在选项应用序的同一位置调用，与旧 registerCovenant
  // 钩子同位）：旗与 kids 流转由选项本体经通用应用序落账，这里只管约的登记与再问补旗——
  // 「要」（<44）登记 has 之约（since = 开门年龄，bornDue 次年接力）；「再等等」登记 wait 之约
  // （due = since + 7）；首问「不要」登记 none 之约；再问「不要」（选项本体落 late_settle）
  // 补落 kid_no、约保持 wait 原样（结算对账行据此读「挂起后定下来」版）；晚育版「要」
  // （late_try）不登记约——与 fork45 时代同口径，lk 链自有落定路。
  function kidForkCovenant(c) {
    const S = IFY.S;
    if (!c) return;
    if (c.set === "kid_yes") registerCovenant("has");
    else if (c.set === "kid_wait") registerCovenant("wait");
    else if (c.set === "kid_no") registerCovenant("none");
    else if (c.set === "late_settle") { if (S.flags) S.flags.kid_no = true; }
  }

  // 立约对账段版（v0.22.1 F3，交换局）：按段读账，口径与 settlement.playerFacts 同源。
  // 每段的约只认两种：约的 since 落在该段内（玩家在那一段亲自立的），或长在末段 Track 上
  // （换入的身体带着的约，是接手后要过的日子的一部分，与 playerFacts.covenant() 同规）。
  // 两段各有约且方向相反（has 对 none）时出事实句，绝不许再断言「安排没再改」；
  // 单段情形与下方原读法同构，只是数据来源换成跨段见证：孩子收尾读 domainEnd、
  // 45 岁实选读合并账本、治疗链与对账旗按 flagWitnessed 见证口径。
  function covenantSettleLineSeg(view) {
    const segs = view.segments, lastIdx = segs.length - 1;
    const covOf = (si) => {
      const c = segs[si].state.covenant;
      if (!c) return null;
      if (si === lastIdx) return c;
      return (typeof c.since === "number" && c.since >= segs[si].fromAge && c.since <= segs[si].toAge) ? c : null;
    };
    const covs = segs.map((_, si) => covOf(si));
    const present = covs.map((c, si) => (c ? si : -1)).filter((si) => si >= 0);
    if (!present.length) return "";
    const kids = view.domainEnd("kids");
    const sp = IFY.S.state ? IFY.S.state.spouse : "none";
    const f45 = view.mergedLedger.find((e) => e.kind === "fork" && e.id === "fork45");
    const tried45 = !!(view.flagWitnessed("late_try") || (f45 && f45.set === "late_try"));
    const treated = !!(view.flagWitnessed("late_tried") || view.hasFact("lk_check") || view.hasFact("lk_wait"));
    const together = sp === "partnered" || sp === "dating";
    const aloneTail = sp === "divorced" ? "后来你们散了，剩下的日子各过各的。"
      : sp === "widowed" ? "后来对方先走了一步，剩下的日子是你一个人过的。"
      : "剩下的日子，是你一个人过的。";
    const kidInSeg = (si) => view.segmentLedgers[si].some((e) => e.kind === "state" && e.id === "kids>has");
    if (present.length >= 2) {
      const first = present[0], lastP = present[present.length - 1];
      const k0 = covs[first].kind, k1 = covs[lastP].kind;
      if ((k0 === "has" && k1 === "none") || (k0 === "none" && k1 === "has")) {
        const hasSeg = k0 === "has" ? first : lastP;
        let line = k0 === "has"
          ? "38 岁立的约，前一段定的是要；换了路，后一段带着的约是不要。换了一条路，约也跟着变了。"
          : "38 岁立的约，前一段定的是不要；换了路，后一段成了要。换了一条路，约也跟着变了。";
        if (kidInSeg(hasSeg)) line += "孩子在定「要」的那一段来了。";
        else if (view.stateWitnessed("kids", "has")) line += "这一生里，孩子后来还是来了。";
        return line;
      }
      if (k0 !== k1) { // 含 wait 的异向组合：只陈述两段定得不一样，不编细节
        let line = "38 岁立的约，前后两段定得不一样。换了一条路，约也跟着变了。";
        if (kids === "has") line += "这一生里，孩子后来还是来了。";
        return line;
      }
    }
    const cov = covs[present[present.length - 1]];
    if (kids === "has") {
      if (cov.kind !== "wait") return "38 岁立的约，后来有了孩子，那几年围着孩子转，约算是走完了。";
      return tried45 ? "38 岁挂起的那份账，45 岁说再试一回。后来，孩子等来了。" : "38 岁挂起的那份账，后来等来了孩子。";
    }
    if (kids === "none") {
      if (tried45) {
        const head = treated
          ? "38 岁挂起的那份账，45 岁说再试一回。检查、吃药、等结果，前前后后折腾了几年，最后没等来。"
          : "38 岁挂起的那份账，45 岁说再试一回。话定下来了，可医院没正经跑起来，日子推着人往前走，最后也没等来。";
        return head + (together ? "日子还是两个人一起过。" : aloneTail);
      }
      if (cov.kind === "wait") {
        return together ? "38 岁挂起的那份账，后来定下来了：不要。两个人把日子照旧过。"
          : "38 岁挂起的那份账，后来定下来了：不要。" + aloneTail;
      }
      return "38 岁立的约，后来就照着过了，安排没再改。";
    }
    if (kids === "undecided" && view.flagWitnessed("cov_solo_done")) return "38 岁挂起的那份账，45 岁你一个人对过一回。孩子的事后来没落定，可那份约，到期那年算是对上了。";
    if (kids === "undecided" && tried45) return treated
      ? "38 岁挂起的那份账，45 岁说再试一回。后来医院跑了几趟，孩子的事还是没落定，这份账对到最后，也没对出个结果。"
      : "38 岁挂起的那份账，45 岁说再试一回。可医院没正经跑起来，日子推着人往前走，孩子的事就一直没落定。";
    return "38 岁挂起的那份账，到这一生走完，也没正式对完。";
  }

  // 对账行按账本事实分版（v0.20.1 返修，审计第一类）：38 岁所选（S.covenant.kind）之外，还读
  // 45 岁 fork45 的真实选择（账本 fork 记录的 set / late_try·late_settle 旗）、治疗链走没走过
  // （账本 lk_check/lk_wait 记录或 late_tried 旗）、孩子最终来没来（kids 状态）与当前伴侣状态。
  // 选过「再试」的人绝不出「定下来了：不要」那一版；已离婚/丧偶/单身的局不出「两个人把日子照旧过」。
  function covenantSettleLine() {
    const view = typeof IFY.playerFacts === "function" ? IFY.playerFacts() : null;
    if (view) return covenantSettleLineSeg(view); // v0.22.1 F3：交换局走段版，未交换局 playerFacts 恒 null、走原读法
    if (!IFY.S.covenant) return "";
    const cov = IFY.S.covenant;
    const kids = IFY.S.state ? IFY.S.state.kids : "undecided";
    const sp = IFY.S.state ? IFY.S.state.spouse : "none";
    const F = IFY.S.flags || {};
    const led = Array.isArray(IFY.S.ledger) ? IFY.S.ledger : [];
    const f45 = led.find((e) => e.kind === "fork" && e.id === "fork45");
    const tried45 = !!(F.late_try || (f45 && f45.set === "late_try"));
    const settled45 = !!(F.late_settle || (f45 && f45.set === "late_settle"));
    const treated = !!(F.late_tried || led.some((e) => e.id === "lk_check" || e.id === "lk_wait"));
    const together = sp === "partnered" || sp === "dating";
    // 伴侣已不在场时，「两个人」式收尾换成一个人对完账的说法
    const aloneTail = sp === "divorced" ? "后来你们散了，剩下的日子各过各的。"
      : sp === "widowed" ? "后来对方先走了一步，剩下的日子是你一个人过的。"
      : "剩下的日子，是你一个人过的。";
    if (kids === "has") {
      if (cov.kind !== "wait") return "38 岁立的约，后来有了孩子，那几年围着孩子转，约算是走完了。";
      return tried45 ? "38 岁挂起的那份账，45 岁说再试一回。后来，孩子等来了。" : "38 岁挂起的那份账，后来等来了孩子。";
    }
    if (kids === "none") {
      if (tried45) {
        const head = treated
          ? "38 岁挂起的那份账，45 岁说再试一回。检查、吃药、等结果，前前后后折腾了几年，最后没等来。"
          : "38 岁挂起的那份账，45 岁说再试一回。话定下来了，可医院没正经跑起来，日子推着人往前走，最后也没等来。";
        return head + (together ? "日子还是两个人一起过。" : aloneTail);
      }
      if (cov.kind === "wait") { // 45 岁选「定下来」，或后来在 e_kid_settle/final 落定不要
        return together ? "38 岁挂起的那份账，后来定下来了：不要。两个人把日子照旧过。"
          : "38 岁挂起的那份账，后来定下来了：不要。" + aloneTail;
      }
      return "38 岁立的约，后来就照着过了，安排没再改。";
    }
    if (kids === "undecided" && F.cov_solo_done) return "38 岁挂起的那份账，45 岁你一个人对过一回。孩子的事后来没落定，可那份约，到期那年算是对上了。";
    if (kids === "undecided" && tried45) return treated
      ? "38 岁挂起的那份账，45 岁说再试一回。后来医院跑了几趟，孩子的事还是没落定，这份账对到最后，也没对出个结果。"
      : "38 岁挂起的那份账，45 岁说再试一回。可医院没正经跑起来，日子推着人往前走，孩子的事就一直没落定。";
    return "38 岁挂起的那份账，到这一生走完，也没正式对完。";
  }
  Object.assign(IFY, { datingDue, datingView, bornDue, syncKidDebut, kidDebutDue, kidDebutItem, licenseDue, kidGateDue, kidForkView, kidForkCovenant, spouseText, registerCovenant, covenantSettleLine });
})(window.IFY);
