// 《如果那年》v0.21 一期 WP3：「另一个你」决策政策（纯函数）——蓝图第四节落点，policyV=3（v2 于 2026-11-09 随孩子线 S5 升版：fork_kid 具名规则登记＋两条删除；v3 于 2026-11-10 随 CL-41 落榜岔口升版：新增落榜去向权重小表 MISS_PATH_W 与选点函数 missPathFor，见 docs/SHADOW-POLICY.md）。
// 纯度纪律（硬约束 6）：本模块零可变模块级状态（只有冻结的常量表）、零随机流消费、
// 不调用任何随机函数、不读时钟、不读另一条 Track、不设备忘缓存。F 不修改任何入参。
// 入参只有三个来源：该 Track 自己的状态（State）、性子向量（W）、路线倾向（A）；
// 抉择点（选项集）随调用给出——没有选项集，F 无从知道在选什么。
// 加载位：index.html 中 scheduler.js 之后。无头步进（WP2）经 chooseForTrack 调用本模块。
(function () {
  "use strict";
  var root = typeof window !== "undefined" ? window : globalThis;
  var IFY = root.IFY || (root.IFY = {});

  var KEYS = ["health", "money", "growth", "freedom", "relation", "wisdom"];
  var POLICY_V = 3;

  function vec(h, m, g, f, r, w) { return { health: h, money: m, growth: g, freedom: f, relation: r, wisdom: w }; }
  // 性子缺失时的中性向量（蓝图 4.1 兜底）：六维都取 1，不偏向任何一边。
  var NEUTRAL = Object.freeze(vec(1, 1, 1, 1, 1, 1));

  // ---------- 4.1 性子向量 W：16 张性子牌逐张配六维权重（0–3 浮点） ----------
  // 每张的依据是牌面文字本身（cards.js TEMPER），注释里逐张写明；effects 只作旁证，不直接照抄。
  var W = Object.freeze({
    // ct_01「打小坐不住」：板凳上像有钉子，爬墙上树从来第一个——身子骨与自在最重，书本最轻。
    ct_01: vec(2.5, 0.5, 1, 2.5, 1, 0.5),
    // ct_02「坐得住」：一本书从天亮看到天黑，喊吃饭要喊三遍——学与想最重。
    ct_02: vec(0.5, 1, 3, 1, 0.5, 2.5),
    // ct_03「嘴甜，会来事」：见人先打招呼，话说得好听路就宽一点——人和最重。
    ct_03: vec(1, 1.5, 2, 1.5, 3, 1),
    // ct_04「手巧」：拆过的闹钟能装回去，邻居电器出毛病先敲他家门——手艺与长进最重。
    ct_04: vec(1, 1.5, 2.5, 1, 1.5, 1),
    // ct_05「慢性子」：干什么都不紧不慢，交到手里的事很少出错——稳当、身体与分寸。
    ct_05: vec(2, 1.5, 2, 0.5, 1, 2),
    // ct_06「心直口快」：心里存不住话，跟他打交道不用猜——直来直去的人和与自在。
    ct_06: vec(1, 0.5, 1, 1.5, 2.5, 1),
    // ct_07「爱较真」：账算不清能对一晚上，交给他数字从没出过大错——本事与账目最重。
    ct_07: vec(1, 2.5, 3, 1, 0.5, 2),
    // ct_08「怕生」：当众说话要提前排练好几遍——独处时攒下的学与想最重。
    ct_08: vec(1.5, 1, 2.5, 0.5, 0.5, 2.5),
    // ct_09「贪玩」：弹珠、卡片、河沟里的鱼，哪样都比课本有意思——玩与自在最重。
    ct_09: vec(2, 0.5, 0.5, 3, 1.5, 0.5),
    // ct_10「懂事得早」：第一个被喊去商量，也是第一个睡不着的——人和与分寸最重。
    ct_10: vec(0.5, 1, 1, 0.5, 3, 2.5),
    // ct_11「上台不怵」：汇演总点他上台，这份胆量带了半辈子——出头、长进与自在。
    ct_11: vec(1, 1.5, 2.5, 2, 2, 1),
    // ct_12「胆子大」：敢爬最高的树，敢一个人走夜路——自在与闯劲最重。
    ct_12: vec(1, 0.5, 1.5, 3, 1, 0.5),
    // ct_13「病历本比课本厚」：三天两头往医院跑，坐在边上把课本翻到尾——先护住身体，其次学与想。
    ct_13: vec(3, 1, 2, 1, 1, 2),
    // ct_14「性子闷」：好多事心里明白，就是不说——想得最深，人和最轻。
    ct_14: vec(1.5, 1, 1.5, 1.5, 0.5, 3),
    // ct_15「急脾气」：话赶话就上头，事后又后悔——先动起来再说，自在与长进在前。
    ct_15: vec(0.5, 1.5, 1.5, 2, 1, 0.5),
    // ct_16「念书不开窍」：同一道题要三遍，台灯底下坐到半夜——不在书本上争，护身体、日子与分寸。
    ct_16: vec(2, 1.5, 1, 1, 1.5, 2),
  });

  // ---------- 4.2 路线倾向 A：六维亲和（按 route.stats 签名定）+ 具名立场表 ----------
  // 立场 matcher 与分岔规则共用形状：{set} / {setState} / {labelIncludes}，命中给 bonus 分。
  var A = Object.freeze({
    // corp「去大城市，进大厂」：stats 签名 money+8/growth+10——亲和压在钱与成长上。
    corp: { affinity: vec(0.5, 2.5, 3, 0.5, 1, 1), stances: Object.freeze([
      { fork: "fork25", match: { set: "job_hop" }, bonus: 5, text: "在大厂这条路上，换岗往上走是常事，25 岁先给跳槽留一分。" },
      { fork: "fork44", match: { set: "side_job" }, bonus: 6, text: "44 岁搞个副业留后路，合这条路一贯的算盘。" },
      { fork: "fork33", match: { set: "bought_house" }, bonus: 5, text: "在大城市落脚，买房是这条路上迟早要办的一件事。" },
      { item: "proc_retire_node", match: { set: "slow_life" }, bonus: 4, text: "退休节点上先半退、慢慢交棒，是这条路稳妥的收法。" },
    ]) },
    // home「回家乡，进体制内」：stats 签名 relation+8/health+6——亲和压在关系与健康上。
    home: { affinity: vec(2.5, 0.5, 0.5, 1, 3, 1.5), stances: Object.freeze([
      { fork: "fork28m", match: { set: "near_family" }, bonus: 6, text: "回家乡这条路，28 岁问出不出去，先偏向把县里的日子过扎实。" },
      { fork: "fork52", match: { set: "care_self" }, bonus: 6, text: "52 岁父母要人陪，这条路离得近，先偏向自己多回去陪。" },
      { fork: "fork33", match: { set: "near_family" }, bonus: 6, text: "33 岁住在哪儿，这条路先偏向搬去离家人近的地方。" },
      { fork: "fork31", match: { setState: { spouse: "partnered" } }, bonus: 5, text: "31 岁感情的路口，这条路先偏向认真往结婚的方向走。" },
      { item: "proc_dating", match: { setState: { spouse: "partnered" } }, bonus: 6, text: "处了多年到期要个说法，这条路先偏向把关系定下来。" },
    ]) },
    // abroad「出国，从头开始」：stats 签名 growth+10/freedom+8/relation-8——亲和压在成长与自由上。
    abroad: { affinity: vec(1, 1, 3, 3, 0.5, 1.5), stances: Object.freeze([
      { fork: "fork28", match: { set: "stayed_city" }, bonus: 6, text: "28 岁问回不回老家，这条路人已经在外头了，先偏向把现在的城市过成家。" },
      { fork: "fork52", match: { set: "care_hired" }, bonus: 6, text: "52 岁父母要人陪，这条路隔得远，先偏向请靠谱的护工、自己出钱出力协调。" },
      { fork: "fork31", match: { setState: { spouse: "single" } }, bonus: 4, text: "31 岁感情的路口，这条路先偏向一个人把自己过明白，立足要紧。" },
      { fork: "fork33", match: { set: "renting" }, bonus: 5, text: "33 岁住在哪儿，这条路行李搬得多，先偏向继续租、把钱留在手里。" },
    ]) },
    // study「继续读下去」：stats 签名 growth+10/money-10——亲和压在成长与智慧上。
    study: { affinity: vec(1, 0.5, 3, 1.5, 1, 3), stances: Object.freeze([
      { fork: "fork25", match: { set: "stay_put" }, bonus: 6, text: "读下去这条路，25 岁先偏向留下把手头的事做深。" },
      { fork: "fork33", match: { set: "renting" }, bonus: 5, text: "33 岁住在哪儿，这条路是同学里最晚买房的一批，先偏向继续租。" },
    ]) },
    // gap「先停一年」：stats 签名 freedom+12/health+4——亲和压在自由与健康上。
    gap: { affinity: vec(2.5, 0.5, 0.5, 3, 1, 1.5), stances: Object.freeze([
      { fork: "fork25", match: { set: "side_start" }, bonus: 6, text: "停过一年这条路，25 岁先偏向工作照旧、下班折腾点自己的事。" },
      { fork: "fork44", match: { set: "less_work" }, bonus: 6, text: "44 岁中年的岔路，这条路先偏向主动降速，钱少点就少点。" },
      { fork: "fork58", match: { set: "retired_full" }, bonus: 5, text: "58 岁退还是不退，这条路先偏向退下来，把欠自己的时间还给自己。" },
      { fork: "fork31", match: { setState: { spouse: "dating" } }, bonus: 4, text: "31 岁感情的路口，这条路先偏向不排斥也不将就，慢慢来。" },
    ]) },
    // farm「留下来，种地」：stats 签名 relation+6/health+4/money-6/growth-2——亲和压在关系与健康上。
    farm: { affinity: vec(2, 0.5, 0.5, 1, 2.5, 1.5), stances: Object.freeze([
      { fork: "fork28f", match: { labelIncludes: "冬闲出去打短工" }, bonus: 5, text: "留下来种地这条路，28 岁问走不走，先偏向冬闲出去打短工、农忙回来——地不丢，外头的钱也挣一点。" },
      { fork: "fork33f", match: { set: "selfbuilt_house" }, bonus: 6, text: "33 岁房子怎么办，这条路先偏向拆了老房、在原地基上盖新的，根不动。" },
      { fork: "fork52", match: { set: "care_self" }, bonus: 6, text: "52 岁父母要人陪，这条路人就在跟前，先偏向自己多回去陪。" },
    ]) },
  });

  // ---------- 入参归一化与只读视图（4.5 定义域补全） ----------
  // 数值先过 0–100 clamp 再用；缺失或非有限的数值按中点 50 读，保证规则在极端值下仍可求值。
  function clampStat(v) { return typeof v === "number" && isFinite(v) ? Math.max(0, Math.min(100, v)) : 50; }
  function saneWeight(v) { return typeof v === "number" && isFinite(v) ? Math.max(0, Math.min(3, v)) : 0; }
  function saneVector(x) {
    var out = {};
    for (var i = 0; i < KEYS.length; i++) out[KEYS[i]] = x ? saneWeight(x[KEYS[i]]) : 0;
    return out;
  }
  // W 入参：向量对象直接用；字符串按性子牌 id 查表；查不到或缺失回中性向量。
  function resolveW(arg) {
    if (typeof arg === "string") return W[arg] ? saneVector(W[arg]) : saneVector(NEUTRAL);
    if (arg && typeof arg === "object") return saneVector(arg);
    return saneVector(NEUTRAL);
  }
  // A 入参：路线 id 查表；{affinity, stances} 条目拆开；纯向量只取亲和、不带立场。
  function resolveA(arg) {
    if (typeof arg === "string") { var e = A[arg]; return e ? { vec: saneVector(e.affinity), stances: e.stances } : { vec: saneVector(null), stances: [] }; }
    if (arg && typeof arg === "object") {
      if (arg.affinity) return { vec: saneVector(arg.affinity), stances: Array.isArray(arg.stances) ? arg.stances : [] };
      return { vec: saneVector(arg), stances: [] };
    }
    return { vec: saneVector(null), stances: [] };
  }
  function deferCount(state, key) {
    var v = state ? state[key] : 0;
    return typeof v === "number" && isFinite(v) && v > 0 ? v : 0;
  }
  // viewOf：把 (state, W, A) 整理成规则与打分共用的只读视图。新建对象，不回写入参。
  // 导出供政策审计与单元测试复算——审计侧用同一份视图读规则，不另写一套口径。
  function viewOf(state, wArg, aArg) {
    var s = state || {};
    var stats = {};
    var raw = s.stats || {};
    for (var i = 0; i < KEYS.length; i++) stats[KEYS[i]] = clampStat(raw[KEYS[i]]);
    var wv = resolveW(wArg), av = resolveA(aArg);
    var T = {};
    for (var j = 0; j < KEYS.length; j++) T[KEYS[j]] = wv[KEYS[j]] + av.vec[KEYS[j]];
    return {
      state: s, stats: stats, dom: s.state || {}, flags: s.flags || {},
      covenant: s.covenant || null,
      routeId: s.route && typeof s.route.id === "string" ? s.route.id : null,
      age: typeof s.age === "number" && isFinite(s.age) ? s.age : 0,
      datingDefers: deferCount(s, "datingDefers"), retireDefers: deferCount(s, "retireDefers"),
      W: wv, A: av.vec, stances: av.stances, T: T,
    };
  }

  // 选项匹配子：{set} 看选项立旗、{setState} 看状态流转、{labelIncludes} 看标签原文包含。
  function matchChoice(match, c) {
    if (!c) return false;
    if (match.set != null && c.set !== match.set) return false;
    if (match.setState) for (var k in match.setState) if (!c.setState || c.setState[k] !== match.setState[k]) return false;
    if (match.labelIncludes != null && (typeof c.label !== "string" || c.label.indexOf(match.labelIncludes) < 0)) return false;
    return true;
  }

  // ---------- 4.3 第 1 级：具名分岔规则表 FORKS ----------
  // 覆盖 D.forks 十一条中的九条（键 = 引擎记账 id 口径：fork.id 或 "fork"+age；28 岁两条靠 id 区分）。
  // fork28f/fork33f 自 farm 线加入起无具名规则（纯打分岔，既成状态）；fork38/fork45 已随孩子线 S4
  // 退役，其规则于 S5 按新岔 id 移植登记到 fork_kid（见该表头注释的逐条对应）。
  // 每条规则 = 状态/数值条件（when，只读 view）→ 选项匹配子（match）；命中才生效，第一匹配优先。
  // 互斥纪律：同岔内指向不同选项的规则，条件里写明对前序触发条件的否定（守卫），
  // 构造上不可能同真——单元测试用网格枚举机械复核（sim-v021/scripts/policy-unit.js）。
  // text 是能印进公示文档的人话，与 docs/SHADOW-POLICY.md 逐字同句。
  var FORKS = Object.freeze({
    fork25: Object.freeze([
      { id: "F25-1", text: "25 岁：健康已经不高于 30 的人，先选不伤身的那条——跳槽换个活法，不在下班后继续折腾自己。", match: { set: "job_hop" },
        when: function (v) { return v.stats.health <= 30; } },
      { id: "F25-2", text: "25 岁：最看重自由（性子与路线合算不低于 4.5）的人，工作照旧，下班折腾点自己的事。", match: { set: "side_start" },
        when: function (v) { return v.stats.health > 30 && v.T.freedom >= 4.5; } },
      { id: "F25-3", text: "25 岁：最看重成长（合算不低于 5）的人，跳槽，换个活法。", match: { set: "job_hop" },
        when: function (v) { return v.stats.health > 30 && v.T.freedom < 4.5 && v.T.growth >= 5; } },
    ]),
    fork28: Object.freeze([
      { id: "F28-1", text: "28 岁：最看重关系（合算不低于 5）的人，认真考虑回老家，先打听好岗位。", match: { set: "saw_home" },
        when: function (v) { return v.T.relation >= 5; } },
      { id: "F28-2", text: "28 岁：既放不下家里（关系合算 3.5 以上）又舍不得外头的自在（自由合算 3.5 以上）的人，不回，但把探亲假用满，一年回四趟。", match: { set: "often_back" },
        when: function (v) { return v.T.relation < 5 && v.T.relation >= 3.5 && v.T.freedom >= 3.5; } },
      { id: "F28-3", text: "28 岁：家里牵挂不重（关系合算低于 3.5）、最看重成长（合算不低于 5）的人，不回，把现在的城市过成家。", match: { set: "stayed_city" },
        when: function (v) { return v.T.relation < 3.5 && v.T.growth >= 5; } },
    ]),
    fork28m: Object.freeze([
      { id: "F28M-1", text: "28 岁（家乡线）：最看重关系（合算不低于 5）的人，不出去，把县里的日子过扎实。", match: { set: "near_family" },
        when: function (v) { return v.T.relation >= 5; } },
      { id: "F28M-2", text: "28 岁（家乡线）：既看重自在（自由合算不低于 4.5）又看重长进（成长合算不低于 4）的人，出去闯几年，看看外面的世界。", match: { set: "moved_city" },
        when: function (v) { return v.T.relation < 5 && v.T.freedom >= 4.5 && v.T.growth >= 4; } },
      { id: "F28M-3", text: "28 岁（家乡线）：想开眼界（自由合算不低于 3.5）但还没到非走不可的人，不去，但每年出去走一趟。", match: { labelIncludes: "每年出去走一趟" },
        when: function (v) { return v.T.relation < 5 && !(v.T.freedom >= 4.5 && v.T.growth >= 4) && v.T.freedom >= 3.5; } },
    ]),
    fork31: Object.freeze([
      { id: "F31-1", text: "31 岁：看重关系（性子本身不低于 2）且当下关系不低（不低于 40）的人，认真谈一场，往结婚的方向走。", match: { setState: { spouse: "partnered" } },
        when: function (v) { return v.W.relation >= 2 && v.stats.relation >= 40; } },
      { id: "F31-2", text: "31 岁：最看重自由（合算不低于 5）且当下关系偏低（低于 45）的人，一个人也很好，先把自己过明白。", match: { setState: { spouse: "single" } },
        when: function (v) { return !(v.W.relation >= 2 && v.stats.relation >= 40) && v.T.freedom >= 5 && v.stats.relation < 45; } },
      { id: "F31-3", text: "31 岁：关系与自由都放不下（两边合算都不低于 3.5）的人，不排斥，也不将就，慢慢来。", match: { setState: { spouse: "dating" } },
        when: function (v) { return !(v.W.relation >= 2 && v.stats.relation >= 40) && !(v.T.freedom >= 5 && v.stats.relation < 45) && v.T.relation >= 3.5 && v.T.freedom >= 3.5; } },
    ]),
    fork33: Object.freeze([
      { id: "F33-1", text: "33 岁：已经买过房的人，现在这套住着挺好，不折腾。", match: { labelIncludes: "不折腾" },
        when: function (v) { return !!v.flags.bought_house; } },
      { id: "F33-2", text: "33 岁：还没买房、最看重关系（合算不低于 5）的人，搬去离家人近的地方住。", match: { set: "near_family" },
        when: function (v) { return !v.flags.bought_house && v.T.relation >= 5; } },
      { id: "F33-3", text: "33 岁：还没买房、金钱已经不高于 30 的人，先继续租，把钱留在手里。", match: { set: "renting" },
        when: function (v) { return !v.flags.bought_house && v.T.relation < 5 && v.stats.money <= 30; } },
      { id: "F33-4", text: "33 岁：还没买房、手里宽裕（金钱不低于 62）又不把自由看得最重（自由合算不高于 2.5）的人，咬牙买一套，先上车。", match: { set: "bought_house" },
        when: function (v) { return !v.flags.bought_house && v.T.relation < 5 && v.stats.money >= 62 && v.T.freedom <= 2.5; } },
    ]),
    // fork_kid（孩子线 S4 的新岔；具名规则于 S5 在此登记）：呈现由 kidGateDue 说了算（定下满 2 年／
    // 处满 7 年首问；首问选「再等等」立约、到期再问），政策只管摆出后怎么选。同一岔两副面孔，
    // 规则按立约状态分两班、班间以约状态互斥：无约在身＝首问（FK-1..FK-5），有「再等等」的约
    // 在身＝再问（FK-6..FK-9）。逐条对应：FK-2..FK-5 ← 原 F38-1..F38-4（条件照搬，另加首问班
    // 的约状态守卫），落点 cov38_has/none/wait → kid_yes/kid_no/kid_wait；FK-6..FK-9 ← 原
    // F45-1/F45-2/F45-3（条件照搬，另加再问班的约状态守卫），落点 late_settle/late_try 岔 id
    // 不变、直接沿用。FK-1 与 FK-8 是 S5 新规（公司线路线键，细案 4.2 修 1/修 2）：公司线合算
    // 关系上限 4.0，够不着 FK-2 的「合算不低于 5」与 FK-7 的「不低于 4.5」，故以路线+伴侣+
    // 健康+钱包立规；FK-4/FK-9 的条件里写明对这两条新规触发条件的否定（守卫），照本表纪律。
    fork_kid: Object.freeze([
      { id: "FK-1", text: "孩子的事：走公司线、身边有人、身体还行（健康高于 35）、钱包也撑得住（金钱不低于 30）的人，要孩子，日子会变样，心里有数。", match: { set: "kid_yes" },
        when: function (v) { return !(v.covenant && v.covenant.kind === "wait") && v.routeId === "corp" && (v.dom.spouse === "partnered" || v.dom.spouse === "dating") && v.stats.health > 35 && v.stats.money >= 30; } },
      { id: "FK-2", text: "孩子的事：身边有人、最看重关系（合算不低于 5）、身体也还行（健康高于 35）的人，要孩子，日子会变样，心里有数。", match: { set: "kid_yes" },
        when: function (v) { return !(v.covenant && v.covenant.kind === "wait") && (v.dom.spouse === "partnered" || v.dom.spouse === "dating") && v.T.relation >= 5 && v.stats.health > 35; } },
      { id: "FK-3", text: "孩子的事：健康已经不高于 35 的人，再等等，先看看身体和钱包。", match: { set: "kid_wait" },
        when: function (v) { return !(v.covenant && v.covenant.kind === "wait") && v.stats.health <= 35; } },
      { id: "FK-4", text: "孩子的事：最看重自由（合算不低于 5.5）、关系牵挂不重（合算低于 5）的人，不要，两个人的日子也完整。", match: { set: "kid_no" },
        when: function (v) { return !(v.covenant && v.covenant.kind === "wait") && v.stats.health > 35 && v.T.relation < 5 && v.T.freedom >= 5.5 && !(v.routeId === "corp" && (v.dom.spouse === "partnered" || v.dom.spouse === "dating") && v.stats.money >= 30); } },
      { id: "FK-5", text: "孩子的事：钱包已经见紧（金钱不高于 25）且把钱看得不轻（金钱合算不低于 3）的人，再等等，看看身体和钱包。", match: { set: "kid_wait" },
        when: function (v) { return !(v.covenant && v.covenant.kind === "wait") && v.stats.health > 35 && v.T.relation < 5 && v.T.freedom < 5.5 && v.stats.money <= 25 && v.T.money >= 3; } },
      { id: "FK-6", text: "孩子的事：先前那份「再等等」的约到期了，健康已经不高于 40 的人，就这样定下来，两个人好好过。", match: { set: "late_settle" },
        when: function (v) { return !!v.covenant && v.covenant.kind === "wait" && v.stats.health <= 40; } },
      { id: "FK-7", text: "孩子的事：最看重关系（合算不低于 4.5）、身体还行（健康不低于 45）、钱包也撑得住（金钱不低于 30）的人，再试一回，这次正经去治。", match: { set: "late_try" },
        when: function (v) { return !!v.covenant && v.covenant.kind === "wait" && v.T.relation >= 4.5 && v.stats.health >= 45 && v.stats.money >= 30; } },
      { id: "FK-8", text: "孩子的事：走公司线、身边有人、身体还行（健康不低于 45）、钱包也撑得住（金钱不低于 30）的人，再试一回，这次正经去治。", match: { set: "late_try" },
        when: function (v) { return !!v.covenant && v.covenant.kind === "wait" && v.routeId === "corp" && (v.dom.spouse === "partnered" || v.dom.spouse === "dating") && v.stats.health >= 45 && v.stats.money >= 30; } },
      { id: "FK-9", text: "孩子的事：最看重自由（合算不低于 5）、关系牵挂没那么重（合算低于 4.5）的人，就这样定下来，两个人好好过。", match: { set: "late_settle" },
        when: function (v) { return !!v.covenant && v.covenant.kind === "wait" && v.T.freedom >= 5 && v.T.relation < 4.5 && !(v.routeId === "corp" && (v.dom.spouse === "partnered" || v.dom.spouse === "dating") && v.stats.money >= 30 && v.stats.health >= 45); } },
    ]),
    fork44: Object.freeze([
      { id: "F44-1", text: "44 岁：健康已经不高于 35 的人，稳住主业，把身体找回来。", match: { set: "steady_job" },
        when: function (v) { return v.stats.health <= 35; } },
      { id: "F44-2", text: "44 岁：最看重自由（合算不低于 5）的人，主动降速，钱少点就少点。", match: { set: "less_work" },
        when: function (v) { return v.stats.health > 35 && v.T.freedom >= 5; } },
      { id: "F44-3", text: "44 岁：金钱已经不高于 30 且把钱看得不轻（金钱合算不低于 3.5）的人，搞个副业，给自己留条后路。", match: { set: "side_job" },
        when: function (v) { return v.stats.health > 35 && v.T.freedom < 5 && v.stats.money <= 30 && v.T.money >= 3.5; } },
    ]),
    fork52: Object.freeze([
      { id: "F52-1", text: "52 岁：走家乡线的人，父母需要人时，调整工作，自己多回去陪。", match: { set: "care_self" },
        when: function (v) { return v.routeId === "home"; } },
      { id: "F52-2", text: "52 岁：走出国线的人，父母需要人时，请靠谱的护工，自己出钱出力协调。", match: { set: "care_hired" },
        when: function (v) { return v.routeId === "abroad"; } },
      { id: "F52-3", text: "52 岁：上有姐姐下有弟弟（有兄弟姐妹）且看重关系（合算不低于 3.5）的人，和兄弟姐妹排班，一人一段。", match: { set: "care_rotate" },
        when: function (v) { return v.routeId !== "home" && v.routeId !== "abroad" && !!v.flags.hook_siblings && v.T.relation >= 3.5; } },
      { id: "F52-4", text: "52 岁：最看重关系（合算不低于 5.5）的人，调整工作，自己多回去陪。", match: { set: "care_self" },
        when: function (v) { return v.routeId !== "home" && v.routeId !== "abroad" && v.T.relation >= 5.5; } },
      { id: "F52-5", text: "52 岁：手里宽裕（金钱不低于 60）的人，请靠谱的护工，自己出钱出力协调。", match: { set: "care_hired" },
        when: function (v) { return v.routeId !== "home" && v.routeId !== "abroad" && !(!!v.flags.hook_siblings && v.T.relation >= 3.5) && v.T.relation < 5.5 && v.stats.money >= 60; } },
    ]),
    fork58: Object.freeze([
      { id: "F58-1", text: "58 岁：健康已经不高于 35 的人，退下来，把欠自己的时间还给自己。", match: { set: "retired_full" },
        when: function (v) { return v.stats.health <= 35; } },
      { id: "F58-2", text: "58 岁：金钱已经不高于 30 且把钱看得不轻（金钱合算不低于 3）的人，返聘几年，慢慢交棒。", match: { set: "rehire" },
        when: function (v) { return v.stats.health > 35 && v.stats.money <= 30 && v.T.money >= 3; } },
      { id: "F58-3", text: "58 岁：看重关系（合算不低于 4.5）的人，半退，去做点不挣钱但喜欢的事。", match: { set: "slow_life" },
        when: function (v) { return v.stats.health > 35 && !(v.stats.money <= 30 && v.T.money >= 3) && v.T.relation >= 4.5; } },
      { id: "F58-4", text: "58 岁：最看重自由（合算不低于 5）的人，退下来，把欠自己的时间还给自己。", match: { set: "retired_full" },
        when: function (v) { return v.stats.health > 35 && !(v.stats.money <= 30 && v.T.money >= 3) && v.T.relation < 4.5 && v.T.freedom >= 5; } },
    ]),
  });

  // ---------- 落榜去向（CL-41，policyV=3 新增）：影子自己的 missPath ----------
  // 影子的 examResult 随出生事实拷贝与玩家同值（现行派生不变）；同为 miss 时，影子走的
  // 不是玩家在岔口选的那条——由这张按年代给的权重小表定（方向经裁定：早年代复读与
  // 当兵权重高，晚年代打工与学手艺升）。设计参数，无统计出处（与 examBandTables 同性质）。
  // 选点是纯函数：种子字符串＋"#shadowMissPath" 走与序章 derivedRoll 同式的哈希一掷，
  // 不读任何随机流、不读玩家那条 Track 的 missPath。c1955 无高考环、永不掷（无表即 null）。
  var MISS_PATH_W = Object.freeze({
    c1965: Object.freeze({ repeat: 0.40, army: 0.30, work: 0.20, craft: 0.10 }),
    c1978: Object.freeze({ repeat: 0.35, army: 0.25, work: 0.25, craft: 0.15 }),
    c1985: Object.freeze({ repeat: 0.30, army: 0.15, work: 0.35, craft: 0.20 }),
    c1995: Object.freeze({ repeat: 0.25, army: 0.10, work: 0.40, craft: 0.25 }),
    c2000: Object.freeze({ repeat: 0.22, army: 0.08, work: 0.42, craft: 0.28 }),
  });
  var MISS_PATH_ORDER = ["repeat", "work", "craft", "army"];
  function missRoll(seedStr, tag) {
    var s = String(seedStr) + tag, a = 2166136261;
    for (var i = 0; i < s.length; i++) { a ^= s.charCodeAt(i); a = Math.imul(a, 16777619); }
    a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function missPathFor(seedStr, era) {
    var row = MISS_PATH_W[era];
    if (!row || seedStr == null) return null;
    var roll = missRoll(seedStr, "#shadowMissPath"), acc = 0;
    for (var i = 0; i < MISS_PATH_ORDER.length; i++) { acc += row[MISS_PATH_ORDER[i]] || 0; if (roll < acc) return MISS_PATH_ORDER[i]; }
    return "army";
  }

  // ---------- 四级瀑布 ----------
  function effectOf(c, k) {
    var v = c && c.effects ? c.effects[k] : 0;
    return typeof v === "number" && isFinite(v) ? v : 0;
  }
  function isDeferBlocked(v, c) {
    if (!c) return false;
    if (c.deferDating && v.datingDefers >= 1) return true; // 推迟硬规则：一生至多一次（蓝图 4.3 第 3 级）
    if (c.deferRetire && v.retireDefers >= 1) return true;
    return false;
  }
  function resolveForkId(state, decision) {
    if (decision.forkId) return decision.forkId;
    var item = decision.item || null;
    if (item && item.id) return item.id;
    if (decision.kind === "fork") {
      if (item && typeof item.age === "number") return "fork" + item.age;
      if (state && typeof state.age === "number") return "fork" + state.age;
    }
    return null;
  }
  // F(state, W, A, decision, opts?) → 选中下标；选项集为空返回 -1（4.5 兜底，行为由单元测试固定）。
  // opts.explain 为真时返回 {idx, rule, scores, blocked}（政策审计模式，默认关）。
  function F(state, wArg, aArg, decision, opts) {
    var explain = !!(opts && opts.explain);
    var choices = decision && Array.isArray(decision.choices) ? decision.choices : [];
    if (!choices.length) return explain ? { idx: -1, rule: null, scores: [], blocked: [] } : -1;
    var v = viewOf(state, wArg, aArg);
    var n = choices.length, i, k;
    // 推迟硬规则先落成资格表；万一全部选项都被挡（真实数据里不会发生），回落全选项集，保证 F 恒有定义。
    var blocked = [], eligible = [];
    for (i = 0; i < n; i++) { var b = isDeferBlocked(v, choices[i]); blocked.push(b); if (!b) eligible.push(i); }
    if (!eligible.length) { eligible = choices.map(function (_, j) { return j; }); blocked = choices.map(function () { return false; }); }
    // 第 2 级立场加成 + 第 3 级性子打分，先算全（审计复算也要用），再按瀑布裁断。
    var forkId = resolveForkId(state, decision);
    var itemId = decision.itemId || (decision.item && decision.item.id) || null;
    var totals = [], pos = [], neg = [];
    for (i = 0; i < n; i++) {
      var c = choices[i], bonus = 0;
      for (var si = 0; si < v.stances.length; si++) {
        var st = v.stances[si];
        if (st.fork && st.fork !== forkId) continue;
        if (st.item && st.item !== itemId) continue;
        if (!st.fork && !st.item) continue;
        if (matchChoice(st.match, c)) bonus += typeof st.bonus === "number" && isFinite(st.bonus) ? st.bonus : 0;
      }
      var sc = bonus, ps = 0, ng = 0;
      for (k = 0; k < KEYS.length; k++) {
        var d = effectOf(c, KEYS[k]), t = v.T[KEYS[k]];
        sc += t * d;
        ps += t * Math.max(0, d);
        ng += t * Math.min(0, d);
      }
      totals.push(sc); pos.push(ps); neg.push(ng);
    }
    // 第 1 级：具名分岔规则（只覆盖大分岔），第一条「条件成立且目标选项在场」的规则定选。
    if (forkId && FORKS[forkId]) {
      var rules = FORKS[forkId];
      for (var ri = 0; ri < rules.length; ri++) {
        if (!rules[ri].when(v)) continue;
        for (var ei = 0; ei < eligible.length; ei++) {
          var idx = eligible[ei];
          if (matchChoice(rules[ri].match, choices[idx])) {
            return explain ? { idx: idx, rule: rules[ri].id, scores: totals, blocked: blocked } : idx;
          }
        }
      }
    }
    // 第 3 级落点：第 2+3 级合计分取最高。
    var max = -Infinity;
    for (var mi = 0; mi < eligible.length; mi++) if (totals[eligible[mi]] > max) max = totals[eligible[mi]];
    // 第 4 级：并列带（与最高分差 < 0.5）内确定性全序——正向对齐分 → 负向规避分 → 下标小者。零随机。
    var band = eligible.filter(function (j) { return max - totals[j] < 0.5; });
    var best = band[0];
    for (var bi = 1; bi < band.length; bi++) {
      var j2 = band[bi];
      if (pos[j2] > pos[best] + 1e-9) { best = j2; continue; }
      if (pos[j2] < pos[best] - 1e-9) continue;
      if (neg[j2] > neg[best] + 1e-9) { best = j2; continue; }
      if (neg[j2] < neg[best] - 1e-9) continue;
      if (j2 < best) best = j2;
    }
    return explain ? { idx: best, rule: null, scores: totals, blocked: blocked } : best;
  }

  // ---------- chooseForTrack：给无头步进的薄封装 ----------
  // 性子来源与序章/卡牌同一套牌：序章局读 state.prologue.temperPick，卡牌局读 state.cards 里的性子牌 id；
  // 都没有（理论不可达）回中性向量。路线读 state.route.id。内部只调 F 的四级瀑布，不另作决定。
  function temperIdOf(state) {
    if (!state) return null;
    if (state.prologue && typeof state.prologue.temperPick === "string" && W[state.prologue.temperPick]) return state.prologue.temperPick;
    if (Array.isArray(state.cards)) for (var i = 0; i < state.cards.length; i++) if (W[state.cards[i]]) return state.cards[i];
    return null;
  }
  function chooseForTrack(state, decision, opts) {
    var tid = temperIdOf(state);
    var rid = state && state.route && typeof state.route.id === "string" ? state.route.id : null;
    return F(state, tid ? W[tid] : NEUTRAL, rid && A[rid] ? A[rid] : null, decision, opts);
  }

  // 表格整体冻结：政策即数值，运行时不许任何人改表（改政策 = 改代码 + 升 policyV）。
  for (var wk in W) Object.freeze(W[wk]);
  for (var ak in A) Object.freeze(A[ak].affinity);
  for (var fk in FORKS) for (var fi = 0; fi < FORKS[fk].length; fi++) Object.freeze(FORKS[fk][fi]);

  IFY.shadowPolicy = { F: F, W: W, A: A, FORKS: FORKS, chooseForTrack: chooseForTrack, viewOf: viewOf, matchChoice: matchChoice, NEUTRAL: NEUTRAL, POLICY_V: POLICY_V, MISS_PATH_W: MISS_PATH_W, missPathFor: missPathFor };
})();
