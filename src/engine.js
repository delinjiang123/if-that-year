// 《如果那年》引擎 v0.60.10 —— 版本号规则见 docs/DEVLOG.md 卷首// 要点：选择写标记→回响事件 / 年度小选择+当场回响 / 数值阈值危机 / 瞥视先给标题、点开才看全文（计数真实）
//      / 判词按数值形状拼装 / 全程自动存档可续玩 / 种子可输入、可复制分享链接 / 在线零 LLM 调用
// [模块]本引擎自 v0.20.0 起拆为各自独立的模块文件（独立包装器 + window.IFY 共享命名空间），按 index.html 的顺序加载：本文件（建 IFY + 编排）→ src/world/apply.js → src/record.js → src/world/processes/{parents,spouse,work,place,health}.js → src/scheduler.js → src/views/{stream,year,shadow,settlement,share}.js → src/engine-boot.js（收尾，调用 IFY.renderStart()）。跨模块引用一律 IFY.<名>，可变量收编为 IFY 属性。
window.IFY = window.IFY || {};
(function (IFY) {
  "use strict";
  const D = window.GAME_DATA;
  if (!D || !Array.isArray(D.events) || !D.routes || !D.forks) { // 数据缺失守卫（v0.13.1）：脚本加载不全时渲染提示，不白页
    const appEl = document.getElementById("app");
    if (appEl) appEl.innerHTML = "<section class=\"card\"><h2>如果那年 · 另一条路</h2><p>这一生的账本没能打开：游戏数据没有加载完。检查一下网络，再刷新一次。</p></section>";
    return;
  }
  // 并入与 storylet 归一化已由 src/storylet.js 在本文件之前完成（v0.20.0 M1-B，加载序见 index.html）：
  // 此处 D.events 已含扩展包与 combos、D.rare/D.endings 已赋值、全条目已挂 sl；本文件只保留上方数据守卫与常量读取。

  const CARDS = window.GAME_CARDS || null; // 出身牌（v0.13.0，src/content/prologue/cards.js；设计 docs/DESIGN-V013.md §A）

  const PRO = window.GAME_PROLOGUE || null; // 序章（v0.17.0，src/content/prologue/prologue.js；试点年代 c2000 的开局：来历→童年→少年→16 岁分岔→17–21 段→22 岁汇入）

  const RHYTHM = window.GAME_RHYTHM || null; // 节奏档案与温度（v0.17.0，src/rhythm.js；派生公式单一来源）

  const PROLOGUE_ERA = "c2000"; // 首个序章年代（兼容导出保留）；v0.22.0 起六代全量走序章开局，判定走 hasPrologue（有年代包即走）
  const hasPrologue = (era) => !!(PRO && typeof PRO.hasPack === "function" && PRO.hasPack(era));

  const ANA = window.GAME_ANALYTICS || { track() {}, flush() {} }; // 匿名埋点（v0.13.1，src/analytics.js；默认关闭、关闭时无操作，口径见 docs/ANALYTICS.md）
  // 统计升级批（2026-11-08）：prologue_done / retire_reached 的本局已发标记——只存内存、
  // 不进存档、不碰 RNG，新局（newGame / newGamePrologue）重置。口径见 docs/ANALYTICS.md。
  let anaPrologueDone = false, anaRetireSent = false;

  const START_AGE = 22, MAX_AGE = 110; // v0.32.0 片 C：MAX_AGE 只保留机制语义＝保险丝（110 岁仍未掷中死亡才强制终局）；80 不再是任何终点，呈现轴一律按真实终局岁画（settlement 道路图 fix5 已如此），任何文案不许把某个岁数写成终点

  // 维度定义表：[键, 名, 初始值]。所有渲染（游玩数值条、分享卡）都从这张表生成，不写死根数——加新维度只改这里与数据。
  // v0.9.0 第六维「智慧」：成长=本事（学与练，前半生为主），智慧=判断（阅历与吃亏换来，全程可涨）。
  // 初值 40 为六维最低：22 岁的人本事可以现学，判断还没攒下——留出一生去涨的空间。取 40 而非更低，是 16000 局模拟校准的结果：
  // 关系终局中位约 99（存量生态），初值 35 时智慧登顶率为 0；初值 40＋改挂幅度校准后登顶约 5%、打满约 3% 以内（见 DEVLOG v0.9.0）。
  // 智慧不进危机表（D.crisis 无此键，pickCrisis 自动跳过）。
  const STAT_META = [["health", "健康", 60], ["money", "金钱", 45], ["growth", "成长", 50], ["freedom", "自由", 50], ["relation", "关系", 50], ["wisdom", "智慧", 40]];

  const GLIMPSE_AGES = { 30: 0, 40: 1, 50: 2 };

  // 分家记账（丙案第一步）：叙事分家点只活在存档字段 pendingSplit {age, eventId, label, source, branch?}——
  // 它是记账不是机制：影子仍在 22 岁出生、重演与 RNG 一字不动。旧档无此字段一律按 22 岁路口默认读。
  function splitPointOf(S) {
    const p = S && S.pendingSplit;
    if (p && typeof p.age === "number") return p;
    return { age: START_AGE, eventId: "route", label: "", source: "route" };
  }
  // 第一瞥站位：三站 30/40/50 中第一个 ≥ 分家岁+5 的站；分家点 22 时恒为 30（与旧行为一致）。
  function firstGlimpseAge(S) {
    const need = splitPointOf(S).age + 5;
    for (const a of [30, 40, 50]) if (a >= need) return a;
    return null;
  }
  // 本局实际瞥视站表：三站中不早于第一瞥的那些——早于第一瞥的站位在 step() 里只消费 1 抽、
  // 不呈现，不算一站。瞥视文案（开场白站数、换路提示的「下次」）与呈现共用这一份，不许另写死。
  function glimpseStationsOf(S) {
    const fg = firstGlimpseAge(S);
    if (fg == null) return [];
    return [30, 40, 50].filter((a) => a >= fg);
  }
  // 22 后换轨级岔口落账（renderFork 与影子无头结算共用）：全程只留最后一个（时间序覆盖），封顶 45 岁。
  const SPLIT_FORKS = { fork28: "回不回老家", fork28m: "出不出去", fork28f: "走不走" };
  function noteSplitFork(S, fork) {
    if (!S || !fork || !(fork.id in SPLIT_FORKS) || fork.age > 45) return;
    S.pendingSplit = { age: fork.age, eventId: fork.id, label: SPLIT_FORKS[fork.id], source: "fork" };
  }

  // 出生年窗口 win（出生年抽选）：六代一律整段十年全开——用户 2026-11-04 原裁定、2026-11-07 亲口复位：
  // 没选时在十年里随机抽一年，玩家可逐年步进改选任意一年。v0.42.1 的 {2000,2004,2008} 非连续集与
  // 其余五代的单年钉窗都是施工侧公历锚盘点后的收窄产物，已被用户撤销，不许再以内容锚为由收窄窗口。
  // 咬着具体年份的内容（盘点 ~/workspace/birth-decade/SCOPE.md：D 类 77 条、E 类真钉子 3 件、c1995 五条
  // 年龄窗、奥运拍 pr_kid8_00）由后续内容片逐条改派生/改窗解决，c1955 先行，不回头动窗口。抽法见 drawBirthYear。
  const ERAS = [
    { id: "c1955", birth: 1955, win: [1950, 1959], label: "50年代出生", cap: "过年的肉，妈妈切得很薄", descs: ["家里几个孩子挤着盖一条被子。粮票收在妈妈抽屉里，买东西前总要数一遍。", "衣服是哥哥姐姐穿小了传给你的。膝盖上的补丁，是妈妈晚上就着灯缝的。", "一年到头，过年才见到肉。妈妈把肉切得很薄，一人夹一片。", "生产队的钟一响，全村都起了。你端着碗蹲在门口吃完，才去上学。"] },
    { id: "c1965", birth: 1965, win: [1960, 1969], label: "60年代出生", cap: "谁家炒菜，整层楼都知道", descs: ["煤球炉放在楼道里，谁家炒菜，整层楼都闻得到。", "院子里只有一个水龙头，早上全院的人排队接水。", "冬天的大白菜堆在阳台上，一进家门就是菜味。", "村口的大喇叭一响，全村都听得见。井台边排队挑水，扁担压得肩膀疼。"] },
    { id: "c1978", birth: 1978, win: [1970, 1979], label: "70年代出生", cap: "钥匙挂在脖子上，自己开门", descs: ["放学自己开门，钥匙挂在脖子上。", "家里买了第一台电视，邻居搬着小板凳来看，你站在最前面。", "晚上整栋楼的窗户里，传出同一个节目的声音。", "晒场上放露天电影，你搬着小板凳跑在最前面。幕布被风吹得直晃。"] },
    { id: "c1985", birth: 1985, win: [1980, 1989], label: "80年代出生", cap: "过生日，碗里多卧个鸡蛋", descs: ["家里添了彩电，你爸不让你随便调台。", "放学后同学挤在小卖部门口，看别人打红白机。你兜里只有五毛钱。", "过生日，碗里多卧一个鸡蛋。", "赶集要走五里路。你坐在爸的自行车后座上，脚不敢乱晃。"] },
    { id: "c1995", birth: 1995, win: [1990, 1999], label: "90年代出生", cap: "周末爸爸租碟回来，全家挤着看", descs: ["家里有了电话和VCD。周末你爸租碟回来，全家挤在一起看。", "初中同学开始去网吧，你爸一提起网吧就皱眉。", "小卖部的辣条一毛钱一包，放学路上买一包，得在进家门前吃完。", "村里年轻人陆续往南走。你爸过年才回来，行李里有一双新球鞋。"] },
    { id: "c2000", birth: 2000, win: [2000, 2009], label: "2000年代出生", cap: "作业没写完，不许开电脑", descs: ["作业写完才能开电脑。你妈在客厅，听着你房间里键盘一直响。", "你爸的手机被你拿去玩游戏，还回去的时候只剩一格电。", "家里装上宽带那天，你爸研究了一晚上路由器。", "镇上的快递能到村口小卖部了。你奶奶学会了视频通话，屏幕举得老远。"] },
  ];

  const SAVE_KEY = "ify-save-v2";

  const LIVES_KEY = "ify-lives-v1"; // 「活过的人生」本地记录（v0.13.0，docs/DESIGN-V013.md §B）：只存 id + 首次活到的本地日期，无次数、无上传

  const PREFS_KEY = "ify-prefs";

  // 停留按刚显示的文字长度算（v0.16.1）：基础 0.8 秒 + 字数 ÷ 每秒字数。三档是读法——
  // 慢·细读约 9 字/秒、中·通读约 16 字/秒、快·扫读约 25 字/秒；单屏上限 20 秒（慢档约 173 字触顶）。
  // 纯界面计时：只喂 setTimeout 与倒计时细线，不碰 RNG、不入游戏状态，同种子复现不受影响。
  const SPEED_CPS = { slow: 9, mid: 16, fast: 25 }; // 每秒字数（细读 / 通读 / 扫读）

  const SPEED_LABEL = { slow: "慢", mid: "中", fast: "快" };

  const SPEED_STYLE = { slow: "细读", mid: "通读", fast: "扫读" };

  const AUTO_BASE_MS = 800, AUTO_CAP_MS = 20000;

  const AUTO_MODES = [["off", "关"], ["plain", "平年"], ["full", "全程"]];

  const DEFAULT_AUTO_MODE = "off"; // v0.17.0 定案（地基 v2.1）：新玩家默认关——第一局先手动过完；老玩家已存的偏好不动（loadPrefs 优先读存档值）。完局后结算页提示一次可开平年自动。

  // --- 可序列化的种子随机（状态可存档） ---
  // v0.18.0 随机流分家（内核一期）：主种子派生三股流，各走各的计数器——叙事流 RNG（判词/瞥视/呈现层抽取，即旧 rng()）、
  // 进程流 RNGW（主角死亡判定与父母进程等世界进程）、环境流 RNGA（事件/稀有/平淡年的环境抽取）。
  // 序章流（种子+"#prologue"，prologue.js 内）并入此体系，为第四股。种子语义自 v0.18 起按此口径：
  // 同一种子在新口径下是一局新的人生；旧分享链接打开同一种子但不保证同一局（兼容策略见 DEVLOG v0.18.0 条目）；新链接带 k=3 版本位。
  const RNG = { a: 0 }, RNGW = { a: 0 }, RNGA = { a: 0 };

  function mulberry(st) {
    st.a |= 0; st.a = (st.a + 0x6D2B79F5) | 0;
    let t = Math.imul(st.a ^ (st.a >>> 15), 1 | st.a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function rng() { return mulberry(RNG); }

  function rngW() { return mulberry(RNGW); }

  function rngA() { return mulberry(RNGA); }

  function seedStreams(seedStr) { RNG.a = seedFromString(seedStr); RNGW.a = seedFromString(seedStr + "#world"); RNGA.a = seedFromString(seedStr + "#ambient"); }

  function seedFromString(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  // 出生年抽选：独立派生的一掷函数（种子+"#birth:"+年代 id），不消费任何游戏随机流——同一记录
  // （种子+年代）永远抽出同一年，重开存档不重抽（年份开局时已落进 S.birthYear）。窗口宽为 1 时恒为该年。
  // 玩家只能在此基础上手动步进调整（开始屏出生年行），没有「重抽」入口。
  function drawBirthYear(seedStr, era) {
    if (!era) return 2000;
    if (!era.win) return era.birth;
    const lo = era.win[0], hi = era.win[1];
    if (hi <= lo) return lo;
    const st = { a: seedFromString(String(seedStr) + "#birth:" + era.id) };
    return lo + Math.floor(mulberry(st) * (hi - lo + 1));
  }

  const clamp = (v) => Math.max(0, Math.min(100, v));

  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const routeDesc = (r) => (r.descEra && IFY.S && r.descEra[IFY.S.era]) || r.desc; // v0.23 WP6（S-6A）：路线 desc 年代变体消费（descEra 与 desc 并列、同形于事件 textEra，契约见 registry-wp6.js）；未声明该年代回落 desc 原文
  // 分岔选项认人（v0.33.x）：22 岁汇入屏的路线名/描述按「到达状态」换文案——引子早已按 track 认人，
  // 选项却一直只有大学生一版（打工六年的人也读到「四年的书」「继续读下去」）。此处只换呈现：
  // 路线 id/顺序/可选性/数值与落账名（S.route、出发日志、unchosen）一律走数据原名，不经此层。
  // 到达状态键（routeStateKey）：
  //   grad      —— study 轨且非中专形（含无序章开局 track=pre：没有已活的学业状态，沿用缺省文案口径）
  //   zhongzhuan—— study 轨＋枚举事实 studyForm=zhongzhuan（中专毕业已工作约两年；仅 c1965/c1978/c1985/c1995 包可达）
  //   work/craft/home —— 16 岁分岔后的少年轨道（schooling 为 school/half/pre 时）
  //   never_<轨>/left_<轨> —— schooling=never（没进过校门）/left（读了又离开）叠加在非 study 轨上；
  //     查文案时先全键、后轨道键回落（如 never_craft 无专属格则用 craft 格——前提是轨道格本身不预设学业）。
  //   study 轨先于 schooling 判：补录回校者（track=study＋schooling=left）的 17–21 岁幕文按在校生走，grad 口径与幕文一致。
  const routeStateKey = (S) => {
    const st = (S && S.state) || {};
    const track = st.track || "pre";
    if (track === "study") return (S.facts && S.facts.studyForm) === "zhongzhuan" ? "zhongzhuan" : "grad";
    if (track === "pre") return "grad";
    const sc = st.schooling || "pre";
    if (sc === "never" || sc === "left") return sc + "_" + track;
    return track;
  };
  const routeStateKeys = (S) => { const k = routeStateKey(S); const us = k.indexOf("_"); return us > 0 ? [k, k.slice(us + 1)] : [k]; };
  const routeDescState = (r) => {
    if (!IFY.S) return null;
    const era = IFY.S.era;
    for (const k of routeStateKeys(IFY.S)) {
      const se = r.descStateEra && r.descStateEra[era];
      if (se && se[k]) return se[k];
      if (r.descState && r.descState[k]) return r.descState[k];
    }
    return null;
  };
  const routeDescFork = (r) => routeDescState(r) || routeDesc(r); // 汇入屏专用：状态变体优先于年代变体与原文
  const routeNameFork = (r) => { // 汇入屏专用显示名：只换这一屏的按钮字，数据 name 不动
    if (IFY.S && r.nameState) for (const k of routeStateKeys(IFY.S)) if (r.nameState[k]) return r.nameState[k];
    return r.name;
  };
  const el = (id) => document.getElementById(id);

  const app = () => el("app");

  const reducedMotion = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  // v0.8.0 呈现层状态：上一屏数值快照（数值条旧值→新值）、画面类型（分级入场）、续玩定位标记、流水账跟随状态
  IFY.prevStats = null;
  IFY.prevKind = null;
  IFY.curKind = null;
  IFY.resumeMark = false;

  IFY.streamFollow = true;
  IFY.streamSeen = 0;
  IFY.streamTop = 0;
  IFY.streamProgUntil = 0;

  IFY.S = null;

  function freshState(seedStr) {
    return {
      seedStr, age: START_AGE, era: "c2000", birthYear: 2000,
      stats: Object.fromEntries(STAT_META.map(([k, , init]) => [k, init])),
      statsPeak: Object.fromEntries(STAT_META.map(([k, , init]) => [k, init])), // 判词批 C（偷艺 4.2）：六维一生峰值，初值 = 开局六维；由 sampleStatsPeak 在年度收口纯 max 并入，判词按峰值选维。旧档无此字段走 backfillStatsPeak 迁移
      statsLate: null, // 判词升格片（审议单 #6）：60 岁六维快照，与 statsPeak 同位采样（sampleStatsLate 挂在 sampleStatsPeak 的收口点上）：当年收口年龄首次 ≥60 时整份定格，此后不动。只供判词合议的晚年加分排序，不当任何门。旧档无此字段走 backfillStatsLate 回填（以载入时现值起账，只少记不多记）
      route: null, unchosen: [], log: [], reflections: [], // v0.21 WP1：reflections 是玩家层字段——本字段只为 Track 同形保留、恒不作数，权威在 session.meta（蓝图 3.1）
      usedEvents: [], flags: {}, state: IFY.initialState(), crisisUsed: {}, microUsed: [], usedRare: [], cards: [],
      glimpsesSeen: 0, glimpsesSkipped: 0, lastDelta: "", wageDelta: "", // wageDelta：工资年结的标注通道（fx-fix）——wageDue 每年结算时刷新（非零整数落账记「工资 ±N」、否则清空），deltaLine 与 lastDelta 拼行呈现；旧档无此字段按空读
      healthCrisisSeen: false, death: null, pendingFork: null,
      glimpseDue: null, // 瞥视不占年（本批）：站位年 step() 判定呈现时只落此挂起位（站位下标），本年照常过完，advance() 在过年之前拦截呈现瞥视屏后清除；非站位年恒 null，旧档无此字段按 null 读
      // v0.17.0 地基字段：阶段机 phase/stage（origin/child/teen/youth/adult/late）、温度 temp（0–100）与节奏型 rhythm（只管质地，不做玩家可见数值）、
      // 童年记号 marks、fork38 立约 covenant、序章运行态 prologue、平年合并 flatCarry 与温度平淡年计数 flatYears
      phase: "adult", stage: "adult", temp: null, rhythm: null,
      marks: [], covenant: null, prologue: null, flatCarry: null, flatYears: 0,
      // v0.23 WP1（E11 枚举事实）：干上多值事实的持久化伴随容器——{ 事实名: 值 }，缺失键按 absent（未发生）读；
      // 登记（名/值集/缺省）在 src/registry.js 的 GAME_REGISTRY.enumFacts，validate-state 按值集校验。
      // 不进 S.state（域内互斥模型装不下多值事实）、不进 S.flags（布尔模型装不下三值以上），故另立伴随容器随存档走。
      facts: {},
      // v0.18.0 内核一期：结构化账本 ledger、父母进程 parents、dating 起点 datingSince 与推迟计数 datingDefers、旗标落点年龄 flagAges、子女落点 kidsAt
      ledger: [], parents: null, datingSince: null, datingDefers: 0, flagAges: {}, kidsAt: null,
      // v0.20.1：子女出生年 kidsBornAt（出生拍首次呈现时由 apply.js 落点，缺失时 kidAge 回落 kidsAt）、宠物抱回年 catAt/dogAt（cat/dog 流转到 home 时落点）
      kidsBornAt: null, catAt: null, dogAt: null,
      // v0.19.0：退休相位运行态 retirePlan（{form, nodeAge}，50 岁后按活计形态定一次）、part 落点 partAt/partYears、退休落点 retiredAt、节点推迟计数 retireDefers
      retirePlan: null, partAt: null, partYears: null, retiredAt: null, retireDefers: 0,
      // 工资轮：年净额结转余数 wageCarry（小数攒够整数才入账）、养老金基数 wageLastNet（最近一个有活计年份的未打折档额）、已结算年龄戳 wageSettledAge（防 step 重入重复结算）
      wageCarry: 0, wageLastNet: 0, wageSettledAge: 0,
      // 住房线：购房定档 houseTier/houseLoc（捕获时写死，终生不变）、变现落账标记 houseSettled、通勤自由结转 houseCarry（仿 wageCarry）
      houseTier: null, houseLoc: null, houseSettled: false, houseCarry: 0,
      // 第 1 期 P1-2（职业层地基）：伏笔种子账 seeds（拍上埋下的入行伏笔，形状见 p1-design §一）与
      // 履历账 career（入行段 spells 多段实账，唯一写点 world/career.js 的 careerNote）——平行账，
      // 只写不读：现行逻辑一律不读它们改行为。career 诞生时为 null（未建壳＝一格未消费），首次
      // 入行/关口开门时才由唯一写点建壳；老档读入走 backfillCareer 按账本重建（D1 存实账）。
      seeds: [], career: null,
      autoMode: DEFAULT_AUTO_MODE, speed: "mid", // 推进设定在本局的副本；权威来源是 localStorage 的 ify-prefs；v0.21 WP1：同形保留、恒不作数，存档时只进 session.meta（蓝图 3.1）
    };
  }

  function save() {
    // v0.21 WP1（蓝图裁定一）：不受控上下文（IFY._lifeDepth>0）里不许存档——那会把别条人生的状态写进档。
    // 调试/sim 口径下抛错（置 IFY.LIFE_DEBUG 或 window.IFY_LIFE_DEBUG），防施工手滑；常规口径静默跳过本次。
    if (IFY._lifeDepth > 0) {
      if (IFY.LIFE_DEBUG || (typeof window !== "undefined" && window.IFY_LIFE_DEBUG)) throw new Error("save() called inside withLife (IFY._lifeDepth=" + IFY._lifeDepth + ")");
      return;
    }
    try {
      // v0.21 WP1（蓝图 3.3）：存档改为序列化 session（v:2 形状），仍写 ify-save-v2 键；会话层不可用时回落旧平铺形状。
      const payload = typeof IFY.serializeSession === "function" ? IFY.serializeSession() : null;
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload || { ...IFY.S, rngA: RNG.a, rngW: RNGW.a, rngAmb: RNGA.a }));
    } catch (e) { /* 存不了不阻塞游玩 */ }
  }

  // 存档判活（v0.17.0 改为按阶段判）：成年段存档有 route；序章段存档没有 route（路线 22 岁才定），凭 phase=prologue + prologue 运行态判活。
  // 旧版（v0.15/v0.16）存档恒有 route，走原判活路径；坏档仍按 null 处理。
  // v0.21 WP1（蓝图 3.3）：v2 形状（有 tracks）按受控 Track 条目判活；旧平铺形状照旧。
  // v0.24.0（首页重做）：无序章开局先落 22 岁汇入拍，未选路的存档凭 mergePending 标记判活（路线落定即清标记）。
  // X-1 旧档回填：考试链 p16_071 已落而 exam_admitted 未立（旧版无此旗）的存档，读入时按账本补立——
  // 否则 p16_072 的 require 永远凑不齐、链尾断档。幂等、只补不删；年龄取账本 071 条目年龄，缺条目取当前年龄。
  function backfillAdmitted(t) {
    if (!t || t.route == null || !t.flags || t.flags.exam_admitted) return;
    if (!t.flags.exam_passed || !(t.usedEvents || {}).p16_071) return;
    t.flags.exam_admitted = true;
    let age = null;
    for (const e of t.ledger || []) if (e && e.id === "p16_071") { age = e.age; break; }
    if (t.flagAges) t.flagAges.exam_admitted = age != null ? age : (t.age != null ? t.age : (t.state && t.state.age != null ? t.state.age : 23));
  }

  // 工资轮旧档回填：v0.27 及更早的存档没有工资三字段，读入时逐轨补缺省（结转 0、养老金基数 0、
  // 年龄戳 0＝本年尚未结算）。只补缺、不覆盖既有值；wage.js 侧另有 typeof 防御读，双保险。
  function backfillWage(t) {
    if (!t || typeof t !== "object") return;
    if (typeof t.wageCarry !== "number") t.wageCarry = 0;
    if (typeof t.wageLastNet !== "number") t.wageLastNet = 0;
    if (typeof t.wageSettledAge !== "number") t.wageSettledAge = 0;
  }

  // 住房线旧档回填：已购房无 house 字段的存档，读入时按 §8.3 补档（形态 reform→R、其余按当刻档位、
  // 地段默认 city、购房年取落旗年龄缺则 33 岁）。实现走 house.js 的 IFY.backfillHouse（形态/档位派生都在它那边）。
  function backfillHouse(t) { if (typeof IFY.backfillHouse === "function") IFY.backfillHouse(t); }

  // 职业层旧档回填（第 1 期 P1-2）：无 seeds/career 的存档读入时逐轨补——seeds 补空账，
  // career 由 world/career.js 的 IFY.backfillCareer 按现有旗与账本重建一份履历（与
  // mainEntryOf 派生对账，D1 存实账、D12 只记账不堵门）。实现走 career.js，此处只转发。
  function backfillCareer(t) { if (typeof IFY.backfillCareer === "function") IFY.backfillCareer(t); }

  // 判词批 C 旧档回填：无 statsPeak 的存档读入时以载入时六维现值逐维初始化峰值（峰值只从
  // 载入点起算——只少记不多记，不追溯、不编造）；容器在但单维缺失时逐维按现值补，既有值不覆盖。
  function backfillStatsPeak(t) {
    if (!t || typeof t !== "object" || !t.stats) return;
    if (!t.statsPeak || typeof t.statsPeak !== "object" || Array.isArray(t.statsPeak)) t.statsPeak = {};
    for (const [k, , init] of STAT_META) if (typeof t.statsPeak[k] !== "number") t.statsPeak[k] = typeof t.stats[k] === "number" ? t.stats[k] : init;
  }

  // 判词升格片（审议单 #6）旧档回填：与 backfillStatsPeak 同法——无 statsLate 的存档读入时
  // 以载入时六维现值整份起账（60 岁前的档起账后仍会被 60 岁收口的真快照覆盖，见
  // sampleStatsLate 的 backfilled 标记；60 岁后的档只能以载入点为界，晚年涨幅只少记不多记）。
  // 容器在但单维缺失时逐维按现值补，既有值不覆盖。
  function backfillStatsLate(t) {
    if (!t || typeof t !== "object" || !t.stats) return;
    if (!t.statsLate || typeof t.statsLate !== "object" || Array.isArray(t.statsLate)) { t.statsLate = {}; t.statsLateBackfilled = true; }
    for (const [k, , init] of STAT_META) if (typeof t.statsLate[k] !== "number") t.statsLate[k] = typeof t.stats[k] === "number" ? t.stats[k] : init;
  }

  function loadSave() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!s) return null;
      // v2 的 Track 条目本体即平铺 state（route/flags 直挂条目上，与 backfillAdmitted 同口径）
      if (s.tracks) { for (const k of Object.keys(s.tracks)) { backfillAdmitted(s.tracks[k]); backfillWage(s.tracks[k]); backfillHouse(s.tracks[k]); backfillStatsPeak(s.tracks[k]); backfillStatsLate(s.tracks[k]); backfillCareer(s.tracks[k]); } const a = s.tracks[s.controlTrack || "A"] || s.tracks.A; return a && (a.route || a.mergePending || (a.phase === "prologue" && a.prologue)) ? s : null; }
      backfillAdmitted(s); backfillWage(s); backfillHouse(s); backfillStatsPeak(s); backfillStatsLate(s); backfillCareer(s);
      return (s.route || s.mergePending || (s.phase === "prologue" && s.prologue)) ? s : null;
    } catch (e) { return null; }
  }

  function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

  // ---------- 「活过的人生」记录：读/写 ify-lives-v1 ----------
  IFY.livesCache = null;

  function loadLives() {
    if (IFY.livesCache) return IFY.livesCache;
    try { const v = JSON.parse(localStorage.getItem(LIVES_KEY)); if (v && v.endings && v.rares) { IFY.livesCache = v; return v; } } catch (e) { /* 损坏数据按空记录走 */ }
    IFY.livesCache = { v: 1, endings: {}, rares: {} };
    return IFY.livesCache;
  }

  function todayStr() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }

  // 结算时落盘本局活到的结局与稀有际遇；返回本局是否有「第一次」。落盘以当前数据为准：记录里的孤儿 id 不显示不计数、也不删（§B1）
  function recordLives(endingId, rareIds) {
    const rec = loadLives();
    const t = todayStr();
    let newEnding = false, newRare = false;
    if (endingId && !rec.endings[endingId]) { rec.endings[endingId] = t; newEnding = true; }
    for (const id of rareIds || []) if (!rec.rares[id]) { rec.rares[id] = t; newRare = true; }
    if (newEnding || newRare) { try { localStorage.setItem(LIVES_KEY, JSON.stringify(rec)); } catch (e) { /* 存不了不阻塞结算 */ } }
    return { newEnding, newRare };
  }

  // ---------- 留存记录（v0.15.0）：只记录，不奖励、不催促，断了不指责 ----------
  // ify-streak-v1：{ v:1, days:["YYYY-MM-DD", ...] } —— 有「完成一局」的日子（结算时落盘，升序去重，只留最近 400 天）。
  // ify-lastlife-v1：{ v:1, date, era, route, endAge, tags, verdictLine } —— 最近完成的一局，供开局屏回看。
  // 两键与进行中存档（ify-save-v2）、「活过的人生」（ify-lives-v1）互不相干；旧档没有这两键，按空记录走。
  const STREAK_KEY = "ify-streak-v1";
  const LASTLIFE_KEY = "ify-lastlife-v1";

  function loadStreak() {
    try { const v = JSON.parse(localStorage.getItem(STREAK_KEY)); if (v && Array.isArray(v.days)) return v; } catch (e) { /* 损坏数据按空记录走 */ }
    return { v: 1, days: [] };
  }

  function loadLastLife() {
    try { const v = JSON.parse(localStorage.getItem(LASTLIFE_KEY)); if (v && v.date && v.route) return v; } catch (e) { /* 同上 */ }
    return null;
  }

  function dateStrOf(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }

  function shiftedDateStr(n) { const d = new Date(); d.setDate(d.getDate() + n); return dateStrOf(d); }

  // 结算时落盘：今天记进日子表，最近一局整条存下；同一天重复结算幂等。
  function recordDayAndLife() {
    const t = todayStr();
    const rec = loadStreak();
    if (!rec.days.includes(t)) {
      rec.days.push(t); rec.days.sort();
      if (rec.days.length > 400) rec.days = rec.days.slice(-400);
      try { localStorage.setItem(STREAK_KEY, JSON.stringify(rec)); } catch (e) { /* 存不了不阻塞结算 */ }
    }
    const v = IFY.verdict();
    const last = { v: 1, date: t, era: IFY.S.era, route: IFY.S.route.name, endAge: finalAge(), tags: IFY.lifeTags(), verdictLine: v.text.split("。")[0] + "。" };
    try { localStorage.setItem(LASTLIFE_KEY, JSON.stringify(last)); } catch (e) { /* 同上 */ }
  }

  // ---------- 最近活过的人生（父亲事故热修）：ify-history-v1 = { v:1, runs:[entry, ...] } ----------
  // entry = { at, era, routeName, endAge, verdictLine, endInfo, save }：save 是整局会话快照（与
  // ify-save-v2 同形状），新局在前、环形保留最近 5 局；开局屏逐局列出，点开按快照重渲染结算页。
  // 与 ify-lastlife-v1 的分工：lastlife 只剩「列表为空时的旧局一行回看」兜底（见 renderStart），
  // 首页呈现以本列表为唯一口径，列表首行字段是 lastlife 的超集，不两套并行展示。
  // 写入带容量兜底：超限依次丢最旧快照重试，至少保住最近一局；一局都写不下就静默放弃——
  // 留档失败绝不许带崩结算与游戏主流程（全程 try/catch，调用方 renderEnd 亦有兜底）。
  const HISTORY_KEY = "ify-history-v1";
  const HISTORY_MAX = 5;

  function loadHistory() {
    try {
      const v = JSON.parse(localStorage.getItem(HISTORY_KEY));
      if (v && Array.isArray(v.runs)) return v.runs.filter((e) => e && e.save && typeof e.endAge === "number");
    } catch (e) { /* 损坏数据按空列表走 */ }
    return [];
  }

  function writeHistory(runs) {
    let cur = runs.slice(0, HISTORY_MAX);
    for (;;) {
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify({ v: 1, runs: cur })); return; }
      catch (e) { if (cur.length <= 1) return; cur = cur.slice(0, -1); } // 超限丢最旧再试；只剩一局还写不下就放弃
    }
  }

  function recordHistory(endInfo, endDisplay) {
    try {
      const payload = typeof IFY.serializeSession === "function" ? IFY.serializeSession() : null;
      const data = payload || { ...IFY.S, rngA: RNG.a, rngW: RNGW.a, rngAmb: RNGA.a };
      const entry = { ...(endDisplay || {}), endInfo: endInfo || { newEnding: false, newRare: false }, save: JSON.parse(JSON.stringify(data)) };
      if (!entry.at) entry.at = todayStr();
      const runs = loadHistory();
      runs.unshift(entry);
      writeHistory(runs);
    } catch (e) { /* 留档失败静默，不阻塞结算 */ }
  }

  // ---------- 跨局避重（antirepeat 原型）：上一局见过的池事件 id ----------
  // ify-seen-v1 = { v:1, at, seedStr, era, ids:[...] }：最近一个「完局」见过的池事件 id 集合，
  // 完局时由 recordSeen 落盘（结算 !endRerun 同挂点，与 recordHistory 并列），只留最近一局、
  // 每局整表覆盖——玩家的不满集中在紧邻的上一局；存两局会把薄切片（如 76+ 底盘约 30 条）
  // 的可避余粮再吃掉一半，且两局前的局玩家多半已记不清，收益低、断供风险高，故只存一局。
  // ids 取本局 usedEvents（池路记账的全部条目，去重、上限 300 条兜底；一局实际约 40–80 条，
  // JSON 约 3KB 上下，远低于 localStorage 容量）。中途弃局不写：seen 恒指「上一局完整人生」。
  // ify-avoid-v1 = { v:1, seedStr, ids:[...] }：本局开局那一刻的装填快照，只为续局恢复用——
  // 续局时 seedStr 与存档种子对得上才恢复（防 A 局的快照串进 B 局）；完局时随 recordSeen 清除。
  // 两键与 ify-save-v2 / ify-history-v1 互不相干：避重状态不进会话存档，旧档无此二键按未装填走。
  const SEEN_KEY = "ify-seen-v1";
  const AVOID_KEY = "ify-avoid-v1";
  function loadSeen() {
    try { const v = JSON.parse(localStorage.getItem(SEEN_KEY)); if (v && Array.isArray(v.ids)) return v; } catch (e) { /* 损坏数据按无记录走 */ }
    return null;
  }
  function recordSeen() { // 完局落盘：本局见过的 id 整表覆盖 ify-seen-v1，并清掉本局的装填快照
    try {
      const ids = [...new Set(IFY.S.usedEvents || [])].slice(0, 300);
      localStorage.setItem(SEEN_KEY, JSON.stringify({ v: 1, at: todayStr(), seedStr: IFY.S.seedStr, era: IFY.S.era, ids }));
    } catch (e) { /* 存不了不阻塞结算 */ }
    try { localStorage.removeItem(AVOID_KEY); } catch (e) {}
    IFY.avoidPrev = null;
  }
  function armAvoidance(explicitSeed) { // 开局装填（newGame/newGamePrologue 调用）：决定本局 scheduler 读不读得到快照
    IFY.avoidPrev = null;
    try { localStorage.removeItem(AVOID_KEY); } catch (e) {}
    if (explicitSeed) return; // 指定种子局（手填种子/种子链接/每日一局，种子都经 #seedin 或 seedParam 进来）：玩家主动复刻，不许历史改动其走向
    const seen = loadSeen();
    if (!seen || !seen.ids.length) return; // 无历史（首次玩/清过缓存）：未装填，与现行版本逐项一致
    IFY.avoidPrev = new Set(seen.ids);
    try { localStorage.setItem(AVOID_KEY, JSON.stringify({ v: 1, seedStr: IFY.S.seedStr, ids: seen.ids })); } catch (e) { /* 快照存不下只是续局不恢复避重，不阻塞开局 */ }
  }
  function restoreAvoidance() { // 续局恢复（restoreFromSave 尾）：快照种子与本档种子对得上才恢复本局的避重
    IFY.avoidPrev = null;
    try {
      const v = JSON.parse(localStorage.getItem(AVOID_KEY));
      if (v && v.seedStr === IFY.S.seedStr && Array.isArray(v.ids) && v.ids.length) IFY.avoidPrev = new Set(v.ids);
    } catch (e) { /* 损坏数据按未装填走 */ }
  }

  // 开局屏的记录行：总天数 + 最近连续天数；连续只在 ≥2 天时提，断档时只报总数、只字不提断不断。
  function streakLine() {
    const days = loadStreak().days;
    if (!days.length) return "";
    let streak = 0;
    const d = new Date();
    if (!days.includes(dateStrOf(d))) d.setDate(d.getDate() - 1); // 今天还没玩，就从昨天往前数
    while (days.includes(dateStrOf(d))) { streak++; d.setDate(d.getDate() - 1); }
    return `活完过一生的日子，到今天一共 ${days.length} 天${streak >= 2 ? `，最近连着 ${streak} 天` : ""}。`;
  }

  // 开局屏的回看行：最近一局是昨天或今天才出现，就是一句事实回放。
  function lastLifeLine() {
    const last = loadLastLife();
    if (!last) return "";
    const when = last.date === todayStr() ? "今天" : last.date === shiftedDateStr(-1) ? "昨天" : null;
    if (!when) return "";
    const era = ERAS.find((e) => e.id === last.era);
    return `${when}那一生：${era ? era.label : ""}，${esc(last.route)}，活到 ${last.endAge} 岁。${esc(last.verdictLine)}`;
  }

  // 每日一局（v0.15.0）：种子就是日期本身（与旧「今日种子」按钮行为一致）；年代与路线由日期字符串哈希派生，
  // 人人同日同题。派生只读日期，不碰主 RNG，普通局的种子复现不受影响。
  function dailyFor(dateStr) {
    const h = seedFromString("ify-daily-" + dateStr);
    return { seed: dateStr, era: ERAS[h % ERAS.length], route: D.routes[Math.floor(h / ERAS.length) % D.routes.length] };
  }

  // ---------- 自动推进：偏好 (ify-prefs 为权威) + 单一全局计时器 ----------
  // 三态：off=全手动；plain=只有无抉择年份自动走；full=无抉择年份自动走，所有选择点也自动选
  // （本批扩围：事件/序章/选路/岔口/危机/稀有/进程拍/瞥视，全走与手动同一落定函数）。结算页不设自动动作。
  // step() 每次渲染前清旧计时，防串局。
  IFY.prefs = loadPrefs();

  function loadPrefs() {
    try {
      const p = JSON.parse(localStorage.getItem(PREFS_KEY));
      if (p && AUTO_MODES.some(([k]) => k === p.mode) && SPEED_CPS[p.speed]) return { mode: p.mode, speed: p.speed, autoHintSeen: !!p.autoHintSeen, foldIntroSeen: !!p.foldIntroSeen, foldOpen: !!p.foldOpen, foldTouched: !!p.foldTouched, autoPanelOpen: !!p.autoPanelOpen };
    } catch (e) { /* 旧结构或损坏数据不报错，按新默认走 */ }
    return { mode: DEFAULT_AUTO_MODE, speed: "mid", autoHintSeen: false, foldIntroSeen: false, foldOpen: false, foldTouched: false, autoPanelOpen: false }; // foldIntroSeen（v0.24.0 首页重做）：「设置与对局」折叠区首局后自动展开一次的已见标记；旧 prefs 缺字段按未见过处理，无迁移。foldOpen/foldTouched/autoPanelOpen（本批）：两处设置面板的开合存进 prefs——foldTouched=玩家手动切换过开始页折叠，之后以存住的状态为准；旧 prefs 缺字段一律按 false 补齐
  }

  function savePrefs() {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(IFY.prefs)); } catch (e) { /* 存不了不阻塞 */ }
    if (IFY.S) { IFY.S.autoMode = IFY.prefs.mode; IFY.S.speed = IFY.prefs.speed; }
    if (IFY.session && IFY.session.meta) { IFY.session.meta.autoMode = IFY.prefs.mode; IFY.session.meta.speed = IFY.prefs.speed; } // v0.21 WP1：推进设置的玩家层权威同步进 session.meta（蓝图 3.1）
  }

  IFY.autoTimer = null;  // 主 setTimeout 句柄（choice 模式下到点触发的是「预高亮」动作）
  IFY.autoPhase2 = null; // §4.3 全程自动选的第二段：预高亮后 400ms 真正执行选择的句柄
  IFY.autoRemain = 0;    // 剩余毫秒（暂停/恢复用；choice 模式为距预高亮的剩余）
  IFY.autoStamp = 0;     // 本段计时起点
  IFY.autoText = null;   // 当前画面若可自动推进，其正文；必停画面恒为 null
  IFY.autoAction = null; // 当前画面可执行的自动动作（advance 或普通事件自动选）
  IFY.autoKind = null;   // "advance" | "choice"
  IFY.autoPanelOpen = !!IFY.prefs.autoPanelOpen; // v0.20.4 局内「推进设置」面板展开态（重渲染不自动合上）；本批起开合存进 prefs，刷新/重开页面也保持上次状态
  IFY.autoTotal = 0;     // 本屏总停留（细线用，choice 模式含最后 400ms 预高亮段）
  // §4.1 倒计时细线：纯计时账（总时长/已耗），不读布局，暂停冻结、恢复续走、切档由 scheduleAuto 干净重启
  IFY.lineTotal = 0;
  IFY.lineElapsedBase = 0;
  IFY.lineSegT = 0;

  document.addEventListener("visibilitychange", () => { if (document.hidden) IFY.pauseAuto(); else IFY.resumeAuto(); });
  window.addEventListener("blur", () => IFY.pauseAuto());
  window.addEventListener("focus", () => IFY.resumeAuto());

  // 暂停手势（§4.2）：全程模式点任意非控制区即回手动；平年模式点正文区（非控件）同样暂停本屏并切到关——两模式语义统一。
  // 被点的控件本身仍按原动作执行（例如点中某个选项，就按手动选它）。
  app().addEventListener("click", (ev) => {
    const t = ev.target;
    if (!t || !t.closest) return;
    if (!IFY.autoText || t.closest("#autorow, .autopanelwrap")) return; // v0.20.4：推进设置面板内点击不算「夺回手动」
    if (IFY.autoEligible && !IFY.autoEligible()) return; // v0.33.2：本屏根本不推进时（如平年模式下的选项屏）没有可夺回的手动——点正文不许把存好的偏好改成关
    const turnOff = () => {
      IFY.prefs.mode = "off";
      savePrefs();
      IFY.clearAuto();
      IFY.refreshAutoRow();
      if (IFY.S && IFY.S.route) save();
    };
    if (IFY.prefs.mode === "full") turnOff();
    else if (IFY.prefs.mode === "plain" && IFY.autoKind === "advance" && !t.closest("button, a, input, select, textarea, summary, label")) turnOff();
  }, true);

  // 游戏中控制行用事件委托接线：卡片每次重渲染都不丢监听
  app().addEventListener("click", (ev) => {
    const t = ev.target;
    if (!t || !t.closest) return;
    const tog = t.closest("#autosetbtn"); // v0.20.4 局内推进设置面板的展开/收起
    if (tog) {
      IFY.autoPanelOpen = !IFY.autoPanelOpen;
      IFY.prefs.autoPanelOpen = IFY.autoPanelOpen; savePrefs(); // 本批：开合存进 prefs，与开始页折叠同一规矩
      const p = el("autopanel");
      if (p) p.hidden = !IFY.autoPanelOpen;
      tog.setAttribute("aria-expanded", String(IFY.autoPanelOpen));
      return;
    }
    const mode = t.closest("[data-automode]");
    const spd = t.closest("[data-autospeed]");
    if (mode) {
      IFY.setAutoMode(mode.getAttribute("data-automode"));
    } else if (spd) {
      const k = spd.getAttribute("data-autospeed");
      if (SPEED_CPS[k] && k !== IFY.prefs.speed) {
        IFY.prefs.speed = k;
        savePrefs();
        IFY.scheduleAuto();
      }
      IFY.refreshAutoRow();
      if (IFY.S && IFY.S.route) save();
    }
  });

  // ---------- 节奏与温度（v0.17.0）：派生只走 src/rhythm.js 的 derive()，本文件不另算公式 ----------
  // 红线：温度只影响年份质地（平淡年出口），不进入 rollDeath / specialEnding / pickRare 的任何条件；界面不渲染温度数字。
  function rhythmOf(s) {
    if (!RHYTHM || !s || typeof s.temp !== "number") return { flatShare: 0, density: 1, volatility: 1 };
    return RHYTHM.derive(s.temp, s.rhythm);
  }

  function rhythmBase(kind, id) { // 轨道/路线基线（旧存档回填与开局赋值用）
    if (!RHYTHM) return null;
    const t = RHYTHM.profiles[kind];
    return (t && t[id]) || null;
  }

  function applyTempDelta(d) { // 分岔选项的 temp 增减：只改这一生的质地字段，不耗随机流、同种子确定
    if (!d || !IFY.S || typeof IFY.S.temp !== "number") return;
    IFY.S.temp = Math.max(0, Math.min(100, IFY.S.temp + d));
  }

  function applyEffects(ef) {
    if (!ef) { IFY.S.lastDelta = ""; return; }
    const parts = [];
    // 标注印钳制后的实际落值（fx-fix 定根）：声明原值在触顶/触底时与条的实际动量对不上，
    // 玩家按标注对账必然差一截。变化为 0 的维度不出现；全部为 0 时标注为空。
    // lastDelta 同时是账本 fx 与 deltaLine 的唯一来源，改在此处三处同源。
    for (const [k, label] of STAT_META) if (ef[k]) {
      const before = IFY.S.stats[k];
      IFY.S.stats[k] = clamp(before + ef[k]);
      const d = Math.round((IFY.S.stats[k] - before) * 1e6) / 1e6; // 浮点保险：声明值恒为整数、钳界为整数，实际差额取整到 1e-6
      if (d) parts.push(`${label} ${d > 0 ? "+" : ""}${d}`);
    }
    IFY.S.lastDelta = parts.join(" · ");
  }

  // 判词批 C（偷艺 4.2）：六维一生峰值采样——把当前六维以纯 max 并入 S.statsPeak。
  // 六维写入口分散（applyEffects 主通道、工资年结经 applyEffects、住房 house.js 直写
  // money/freedom、rollDeath 内健康漂移只降不升），逐个挂钩必漏，故只在「当年写入全部
  // 落定」的收口点采样，共三处、同调此函数、幂等可重入：① mergeIntoRoute 落路线后
  // （序章段不经 advance()，以汇入拍为序章段收口，22 岁定格含出身与路线结算）；
  // ② advance() 顶部（上一年收口——进程拍/事件/分岔/工资/住房诸写入都在 step 年内落定）；
  // ③ renderDeath() 落终局变现后（死亡年收口——房产变现写入发生在最后一次年度收口之后，
  // 不补此样峰值会低于终局值）。纯 max 运算：不掷骰、不消费任何随机流，同种子轨迹不变。
  // 容器缺失时按当前值逐维起账（与 backfillStatsPeak 同口径，只少记不多记）。
  function sampleStatsPeak() {
    const S = IFY.S;
    if (!S || !S.stats) return;
    if (!S.statsPeak || typeof S.statsPeak !== "object" || Array.isArray(S.statsPeak)) S.statsPeak = {};
    for (const [k] of STAT_META) {
      const v = S.stats[k];
      if (typeof v !== "number") continue;
      if (typeof S.statsPeak[k] !== "number" || v > S.statsPeak[k]) S.statsPeak[k] = v;
    }
    sampleStatsLate();
  }

  // 判词升格片（审议单 #6）：60 岁快照采样——与 sampleStatsPeak 同位（三收口点经它同调），
  // 当年收口年龄首次 ≥60 时把当前六维整份定格进 S.statsLate，此后不再动。回填档（载入时
  // 以现值起账、带 statsLateBackfilled 标记）在跨过 60 的首个收口被真快照覆盖一次，覆盖后
  // 清标记；60 岁后载入的回填档在载入后首个收口定格（与载入点只差一年内，只少记不多记）。
  // 纯赋值：不掷骰、不消费任何随机流，同种子轨迹不变。
  function sampleStatsLate() {
    const S = IFY.S;
    if (!S || !S.stats) return;
    if (S.statsLate && !S.statsLateBackfilled) return;
    if (typeof S.age !== "number" || S.age < 60) return;
    const snap = {};
    for (const [k, , init] of STAT_META) snap[k] = typeof S.stats[k] === "number" ? S.stats[k] : init;
    S.statsLate = snap;
    delete S.statsLateBackfilled;
  }

  function finalAge() { return IFY.S && IFY.S.death ? IFY.S.death.age : MAX_AGE; }

  // ---------- 开局 ----------
  function renderStart() {
    IFY.curKind = "start";
    IFY.prevStats = null;
    IFY.clearAutoContext();
    app().classList.remove("playwrap");
    clearSave0();
    const saved = loadSave();
    // 终局档（父亲事故热修）：走完的局带 ended 标记留在 ify-save-v2 里，但它不是「进行中」——
    // 续玩入口只认没走完的局（liveSaved）；终局回看走下面的历史列表（最近一局置顶即原「回到
    // 刚才那一局」，不再单设入口）。
    const liveSaved = saved && !saved.ended ? saved : null;
    const histRuns = loadHistory();
    // 列表为空但手里有一份终局档（列表写入被容量兜底放弃时）：把那一局合成列表首行，点开走同一条回看路
    if (!histRuns.length && saved && saved.ended && saved.endDisplay) histRuns.push({ ...saved.endDisplay, endInfo: saved.endInfo || null, save: saved });
    const eraNameOf = (id) => { const e = ERAS.find((x) => x.id === id); return e ? e.label : ""; };
    const sLine = streakLine(), lLine = lastLifeLine(), tomDaily = dailyFor(shiftedDateStr(1)); // 留存三行（v0.15.0）：记录/回看/明日预告，无数据则不出
    // v0.24.0（首页重做，docs 方案 PROPOSAL §2）：回访形态＝有存档或活过至少一局；折叠区「设置与对局」默认收起，
    // 只有三种展开：带 seed/cards 链接打开（让玩家看见链接带来的牌，不写 foldIntroSeen）、打完第一局回来（展开一次
    // 带引导句并记 foldIntroSeen）、玩家手动点开。
    const livesRec = loadLives();
    const livesCount = Object.keys(livesRec.endings || {}).length + Object.keys(livesRec.rares || {}).length;
    const returning = !!saved || livesCount > 0;
    const seedParam = new URLSearchParams(location.search).get("seed");
    const eraParam = new URLSearchParams(location.search).get("era");
    const cardsParam = new URLSearchParams(location.search).get("cards"); // v0.13.2：同局链接可带三张已选牌 id
    // ---------- 出身牌（v0.13.0，docs/DESIGN-V013.md §A）：候选种子在开局页渲染时即生成并据此发牌（§A3.2）；
    // 发牌走 cards.js 的独立派生流，主 RNG 不动；屏幕上的手牌恒等于开局将用的手牌（种子输入即重发）。
    const CARDS_ON = !!CARDS;
    const candSeed = String(Math.floor(Math.random() * 1e6));
    const startEra = eraParam && ERAS.some((e) => e.id === eraParam) ? eraParam : "c2000";
    let dealt = CARDS_ON ? CARDS.deal(seedParam || candSeed, startEra) : null;
    const picked = { family: 0, temper: 0, era: 0 };
    // 同局链接带来的牌面：在已发的三选一里对齐选中下标；不在手牌中则忽略（防篡改/旧链）
    if (CARDS_ON && dealt && cardsParam) {
      const ids = cardsParam.split(",").map((s) => s.trim()).filter(Boolean);
      const cats = ["family", "temper", "era"];
      ids.forEach((id, i) => {
        const cat = cats[i]; if (!cat || !dealt[cat]) return;
        const idx = dealt[cat].indexOf(id); if (idx >= 0) picked[cat] = idx;
      });
    }
    const cardFx = (c) => { const parts = []; for (const [k, label] of STAT_META) if (c.effects && c.effects[k]) parts.push(`${label} ${c.effects[k] > 0 ? "+" : ""}${c.effects[k]}`); return parts.join(" · "); };
    const cardBtn = (id, i, cat) => { const c = CARDS.byId[id]; const fx = cardFx(c); return `<button type="button" class="cardpick${picked[cat] === i ? " sel" : ""}" data-cat="${cat}" data-i="${i}"><b>${esc(c.name)}</b><span>${esc(c.text)}</span>${fx ? `<small>${esc(fx)}</small>` : ""}</button>`; };
    const deckHtml = () => [["family", "家底"], ["temper", "性子"], ["era", "时代"]].map(([cat, lab]) => `<p class="setlab">${lab}</p><div class="cardrow" data-cat="${cat}">${dealt[cat].map((id, i) => cardBtn(id, i, cat)).join("")}</div>`).join("");
    const eraShort = (e) => `${String(e.birth % 100).padStart(2, "0")[0]}0后`; // 年代卡短名：1955→50后、2000→00后（卡面用，e.label 长名仍供对局文案）
    // 旧同局链接可能带 end 参数：从本版起忽略，不报错。
    const savedCtl = saved && saved.tracks ? (saved.tracks[saved.controlTrack || "A"] || saved.tracks.A || {}) : saved; // v0.21 WP1：v2 档的展示字段在受控 Track 条目里
    const savedLabel = saved ? (savedCtl.route ? savedCtl.route.name : (savedCtl.mergePending ? "选路前" : (STAGE_LABEL[savedCtl.stage] || "序章"))) : "";
    // v0.52.1：0–4 岁小段期间存档的 age 恒是开局时盖的 5（序章的基准岁），按钮若照读会把停在 3 岁的人写成 5 岁——
    // 链还在演时按当前幕报岁数，链还没建（出生幕）报 0；链演完/旧档无武装位时照旧读存档岁数。
    const EARLY_AGES = { pr_grab: 1, pr_early2: 2, pr_early3: 3, pr_early4: 4 };
    let savedAge = saved ? savedCtl.age : null;
    const spx = saved ? savedCtl.prologue : null;
    if (saved && savedCtl.phase === "prologue" && spx && !spx.done && spx.earlyArmed) {
      if (spx.earlyBuilt && spx.earlyStep < 4 && EARLY_AGES[spx.earlyOn] != null) savedAge = EARLY_AGES[spx.earlyOn];
      else if (spx.earlyStep === 0 && !spx.earlyOn) savedAge = 0; // 链已建但一幕未演＝停在出生幕（来历幕物化时就建链，earlyBuilt 出生屏上已是 true）
    }
    const linkDriven = !!(seedParam || cardsParam);
    // 本批：折叠开合存进 prefs——玩家手动切换过（foldTouched）之后，renderStart 一律读存住的状态，
    // 重画、点年代卡等任何开始页内交互都不许改它；没切换过时仍走原介绍逻辑（链接带入展开 / 首局后展开一次）。
    let foldOpen = false, foldGuide = false;
    if (IFY.prefs.foldTouched) foldOpen = !!IFY.prefs.foldOpen;
    else if (linkDriven) foldOpen = true;
    else if (livesCount > 0 && !IFY.prefs.foldIntroSeen) { foldOpen = true; foldGuide = true; IFY.prefs.foldIntroSeen = true; savePrefs(); }
    let dailyCtx = null; // 今日一局的待选路线（{eraId, routeId}）：点今日一局时记下，开局时随存档带进局内，22 岁选路拍预选高亮、仍须点选
    app().innerHTML = `
      <section class="card">
        <header class="masthead">
          <p class="prodcredit">A TAKAE PRODUCTION</p>
          <p class="eyebrow2">从出生，活到老</p>
          <p class="eyebrow">人生RESTART</p>
          <h1 class="gametitle">如果那年</h1>
          <p class="leadline" id="starttitle">你没走的那条路，过得怎么样？</p>
        </header>
        <div id="intro">
        <p>选一个年代，从小时候活到老。你没选的那条路，也会自己走完，你会时不时看见它过得怎么样。</p>
        </div>
        <div class="setblock" id="erablock">
          <p class="bighero" id="bighero" aria-hidden="true"></p>
          <p class="setlab erahead">你是哪个年代的孩子？</p>
          <div class="eragrid" id="erapick">${ERAS.map((e) => `<button type="button" class="segbtn eracard${e.id === "c2000" ? " sel" : ""}" data-era="${e.id}" data-birth="${e.birth}"><b>${eraShort(e)}</b><span>${e.cap}</span></button>`).join("")}</div>
          <div class="scenerow">
            <div class="scenecard">
              <p class="hint eradesc-lab">那个年代，家里常有的一幕</p>
              <p id="eradesc"></p>
            </div>
            <div class="birthcol">
              <div class="birthyear-row">
                <span class="birthyear-lab">生在</span>
                <span class="birthyear-val" id="birthyear"></span>
              </div>
              <div class="yearstrip" id="yearstrip"></div>
              <p class="hint" id="birthhint"></p>
            </div>
          </div>
        </div>
        ${returning ? `<div class="row"><button class="textlink" id="liveslink">活过的人生</button></div>` : ""}
        ${sLine ? `<p class="hint">${sLine}</p>` : ""}
        ${lLine && !histRuns.length ? `<p class="hint">${lLine}</p>` : ""}
      </section>
      <div class="actions">
        ${liveSaved ? `<button class="primary" id="resume">继续上次的人生（${savedAge} 岁 · ${esc(savedLabel)}）</button>` : ""}
        <button id="startgo" class="${liveSaved ? "ghost" : "primary"}">${liveSaved ? "重新开始一局" : "开始这一生"}</button>
      </div>
      ${histRuns.length ? `<section class="card histcard">
        <p class="setlab">最近活过的人生</p>
        ${histRuns.map((h, i) => `<button type="button" class="histrow" data-hist="${i}"><b>${esc(h.at || "")}</b><span>${esc(eraNameOf(h.era))} · ${esc(h.routeName || "")} · 活到 ${h.endAge} 岁</span><small>${esc(h.verdictLine || "")}</small></button>`).join("")}
        <p class="hint">点一局，回到那一局的结算页。订册子、导出，都在那一页上。</p>
        <p class="hint">这份记录只留在这台设备、这个浏览器里。换个浏览器打开，或者清掉浏览器存的东西，就看不到了。</p>
      </section>` : ""}
      <section class="card foldcard">
        <div class="foldblock${foldOpen ? " open" : ""}" id="foldblock">
          <button type="button" class="foldhead" id="foldtoggle" aria-expanded="${foldOpen ? "true" : "false"}"><span class="foldtitle">设置与对局</span><small>平时不用打开</small><span class="foldchev" aria-hidden="true">▾</span></button>
          <div id="foldbody"${foldOpen ? "" : " hidden"}>
            ${foldGuide ? `<p class="hint foldguide">第二局想换个推进方式，或者跟朋友比同一局，东西都在这儿。</p>` : ""}
            ${CARDS_ON ? `<div class="setblock" id="deckblock"${hasPrologue(startEra) ? " hidden" : ""}>
              <p class="setlab">出身</p>
              <div class="carddeck" id="carddeck">${deckHtml()}</div>
            </div>` : ""}
            <div class="setblock" id="pushblock">
              <p class="setlab">推进</p>
              <p class="picklab">自动推进</p>
              <div class="switchpicks" id="autopick">
                ${AUTO_MODES.map(([mode, label]) => `<button type="button" class="switchbtn" data-mode="${mode}"><b>${label}</b></button>`).join("")}
              </div>
              <p class="picklab">速度</p>
              <div class="segpicks" id="speedpick">
                ${["slow", "mid", "fast"].map((k) => `<button type="button" class="segbtn" data-speed="${k}">${IFY.speedButtonLabel(k)}</button>`).join("")}
              </div>
            </div>
            <div class="setblock" id="matchblock">
              <p class="setlab">对局</p>
              <p class="picklab">种子码</p>
              <div class="seedrow">
                <input id="seedin" type="text" placeholder="种子码（不填就是随机）">
              </div>
              <p class="hint">不填就是随机。跟朋友比同一局，两边填同一个码。</p>
              <div class="dailyrow"><button class="ghost" id="daily">今日一局 · 今天的固定局，点这先备好</button></div>
              <p class="hint" id="dailyline"></p>
              <p class="hint tomorrow-note">明天一局：${tomDaily.era.label} · ${hasPrologue(tomDaily.era.id) ? "从小时候开始" : esc(tomDaily.route.name)}。</p>
            </div>
            <div class="foldcloserow"><button type="button" class="ghost" id="foldclose">收起</button></div>
          </div>
        </div>
      </section>
      <section class="card seedentry">
        <p class="setlab">用种子开一局</p>
        <p class="hint">填朋友给的种子码，用同一个种子开一局。年代还是在上面选。</p>
        <div class="seedrow">
          <input id="seedentryin" type="text" placeholder="填种子码" autocomplete="off">
          <button type="button" class="ghost" id="seedentrygo">用这个种子开始</button>
        </div>
        <p class="hint" id="seedentrymsg"></p>
      </section>`;
    let startLock = false; // §6.1 防连点：双击不能在同一帧触发两次开局（统一挂在 #startgo 上）
    const llBtn = el("liveslink"); // v0.24.0：首访（无存档、无已完成局）不渲染此入口，取不到时跳过接线
    if (llBtn) llBtn.addEventListener("click", () => { ANA.track("lives_view", {}); IFY.renderLives(); });
    const foldBody = el("foldbody"), foldBlock = el("foldblock");
    const setFold = (open) => { // 本批：折叠头与底部「收起」走同一条切换路径——切换即存 prefs 并置手动标记，此后以存住的状态为准
      foldBody.hidden = !open;
      foldBlock.classList.toggle("open", open);
      el("foldtoggle").setAttribute("aria-expanded", String(open));
      IFY.prefs.foldOpen = open; IFY.prefs.foldTouched = true; savePrefs();
    };
    el("foldtoggle").addEventListener("click", () => setFold(foldBody.hidden));
    const foldCloseBtn = el("foldclose");
    if (foldCloseBtn) foldCloseBtn.addEventListener("click", () => setFold(false));
    // 存档还原（续玩与历史回看共用同一条路，防两处口径漂移）：两形状识别＋逐字段回填＋三股流
    // 复位都在这里做完；坏档（缺 seedStr 且无合法 rngA）返回 null，调用方各自处置。
    const restoreFromSave = (raw) => {
      // v0.13.2：缺 seedStr 且无合法 rngA 的残档会在 seedFromString 处炸——按坏档处理，不抛错
      // v0.21 WP1（蓝图 3.3）：存档两形状识别——v2（有 tracks）由 shadow-life 接管成 session 并返回受控 Track 的
      // 平铺态；旧平铺档就地包成 session（tracks.B=null、meta 从旧 state 同名字段接管、序章段档同样 B=null）。
      // 下文逐字段回填对两形状同口径作用于受控 Track 的平铺态（flat），后续读流一律读 flat。
      const ctlSaved = raw.tracks ? (raw.tracks[raw.controlTrack || "A"] || raw.tracks.A || {}) : raw;
      if (!ctlSaved.seedStr && typeof ctlSaved.rngA !== "number") return null;
      const flat = raw.tracks ? IFY.adoptSessionSave(raw) : (typeof IFY.wrapLegacySession === "function" ? IFY.wrapLegacySession(raw) : raw);
      IFY.S = flat;
      IFY.S.seedStr = IFY.S.seedStr || String(flat.rngA); // 仅有 rngA 的旧残档：用数字串兜底展示，RNG 仍走 rngA
      IFY.S.usedRare = IFY.S.usedRare || []; IFY.S.era = IFY.S.era || "c2000"; IFY.S.birthYear = IFY.S.birthYear || 2000;
      IFY.S.cards = IFY.S.cards || []; // v0.13.0：旧存档（无牌局）续玩不补发、不追溯改数值，出身行不出（§A3.3）
      IFY.S.healthCrisisSeen = !!IFY.S.healthCrisisSeen || !!(IFY.S.crisisUsed && IFY.S.crisisUsed.health);
      IFY.S.death = IFY.S.death || null;
      IFY.S.pendingFork = IFY.S.pendingFork || null;
      delete IFY.S.endAge;
      IFY.S.stats = IFY.S.stats || {};
      for (const [k, , init] of STAT_META) if (typeof IFY.S.stats[k] !== "number") IFY.S.stats[k] = init; // 新维度迁移：旧存档缺的维度按初值补齐（如 v0.9.0 新增的智慧），不清档不报错
      backfillStatsPeak(IFY.S); // 判词批 C：峰值迁移同处兜底（loadSave 已回填，此处防 adoptSessionSave 重组后的 Track 漏填）
      if (!IFY.S.state || typeof IFY.S.state !== "object") IFY.S.state = IFY.deriveStateFromLegacy(flat); // v0.12.0：旧存档无 state，由旧 flags 推导（docs/STATE-MATRIX.md §5）
      else for (const [dom, def] of Object.entries(IFY.REG.domains || {})) if (!(dom in IFY.S.state)) IFY.S.state[dom] = def.initial;
      // v0.17.0 回填：旧存档（v0.15/v0.16）没有阶段/温度/记号等字段——阶段按有无 route 定（老玩家恒成年段），温度按路线基线回填，序章态为空
      IFY.S.phase = IFY.S.phase || "adult"; IFY.S.stage = IFY.S.stage || "adult";
      IFY.S.marks = IFY.S.marks || []; if (!("covenant" in IFY.S)) IFY.S.covenant = null; if (!("prologue" in IFY.S)) IFY.S.prologue = null;
      if (!("flatCarry" in IFY.S)) IFY.S.flatCarry = null; IFY.S.flatYears = IFY.S.flatYears || 0;
      if (typeof IFY.S.temp !== "number") { const b = IFY.S.route ? rhythmBase("route", IFY.S.route.id) : null; IFY.S.temp = b ? b.temp : null; IFY.S.rhythm = b ? b.rhythm : null; }
      // v0.18.0 回填：旧存档无账本/父母进程/dating 起点——账本从空起（读账本处都有旧读法回落），父母进程在下一步 step 时按当前年龄惰性初始化，dating 中的按已处 3 年计
      IFY.S.ledger = Array.isArray(IFY.S.ledger) ? IFY.S.ledger : [];
      if (!("parents" in IFY.S)) IFY.S.parents = null;
      if (!("datingSince" in IFY.S)) IFY.S.datingSince = IFY.S.state && IFY.S.state.spouse === "dating" ? Math.max(START_AGE, IFY.S.age - 3) : null;
      IFY.S.datingDefers = IFY.S.datingDefers || 0; IFY.S.flagAges = IFY.S.flagAges || {}; if (!("kidsAt" in IFY.S)) IFY.S.kidsAt = null;
      // v0.20.1 回填：旧存档无出生年/抱回年——三字段补 null；kidsBornAt 为 null 时 kidAge 口径回落 kidsAt（scheduler.js 单一口径），catAt/dogAt 为 null 时宠物年龄门不过（旧档宠物岁数无从推断，不猜）
      if (!("kidsBornAt" in IFY.S)) IFY.S.kidsBornAt = null; if (!("catAt" in IFY.S)) IFY.S.catAt = null; if (!("dogAt" in IFY.S)) IFY.S.dogAt = null;
      // v0.23 WP1 回填（E11）：旧存档无枚举事实容器——补空对象，全部事实按 absent（未发生）读，不掷、不补写
      if (!IFY.S.facts || typeof IFY.S.facts !== "object" || Array.isArray(IFY.S.facts)) IFY.S.facts = {};
      // v0.19.0 回填：旧存档无退休运行态——节点计划为空（step 时按当前年龄与活计形态惰性生成），abroadKind/workPhase 缺域已由上方 initialState 补齐（出国线由 settleAbroadDefault 补推断）
      if (!("retirePlan" in IFY.S)) IFY.S.retirePlan = null; if (!("partAt" in IFY.S)) IFY.S.partAt = null; if (!("partYears" in IFY.S)) IFY.S.partYears = null; if (!("retiredAt" in IFY.S)) IFY.S.retiredAt = null; IFY.S.retireDefers = IFY.S.retireDefers || 0;
      IFY.S.autoMode = IFY.prefs.mode; IFY.S.speed = IFY.prefs.speed;
      if (IFY.session && IFY.session.meta) { IFY.session.meta.autoMode = IFY.prefs.mode; IFY.session.meta.speed = IFY.prefs.speed; } // v0.21 WP1：推进设置回填同步 meta（蓝图 3.1）
      RNG.a = typeof flat.rngA === "number" ? flat.rngA : seedFromString(flat.seedStr);
      RNGW.a = typeof flat.rngW === "number" ? flat.rngW : seedFromString(String(flat.rngA) + "#world-legacy"); // 旧存档无进程/环境流存档值：由旧随机态派生续玩（不承诺与旧口径同一局，见 DEVLOG）
      RNGA.a = typeof flat.rngAmb === "number" ? flat.rngAmb : seedFromString(String(flat.rngA) + "#ambient-legacy");
      restoreAvoidance(); // 跨局避重：续局按开局快照恢复（种子对不上不装填）；历史回看走同一路但回放不抽取，无实际作用
      return flat;
    };
    if (liveSaved) el("resume").addEventListener("click", () => {
      const flat = restoreFromSave(saved);
      if (!flat) { clearSave(); renderStart(); return; } // 坏档：清掉回开局（原处置不变）
      IFY.prevStats = null; IFY.resumeMark = true; // §6.2 续玩第一屏给一句定位
      if (IFY.S.death) renderDeath(); else step();
    });
    // 历史回看（父亲事故热修）：按那一局的快照还原整局，置回放标记后重渲染结算页——回放不写
    // 存档、不重新留档（renderEnd 侧守口），进行中存档原样保留，看完回来还能接着续玩。
    document.querySelectorAll("[data-hist]").forEach((b) => b.addEventListener("click", () => {
      const entry = histRuns[Number(b.dataset.hist)];
      if (!entry || !entry.save) return;
      const flat = restoreFromSave(entry.save);
      if (!flat) return; // 快照坏了就不动，不清任何东西
      IFY.prevStats = null;
      IFY._endRerun = true; IFY._endInfo = entry.endInfo || null;
      IFY.renderEnd();
    }));
    const pickSeg = (id) => { const box = el(id); if (!box) return; box.querySelectorAll(".segbtn").forEach((b) => b.addEventListener("click", () => { box.querySelectorAll(".segbtn").forEach((o) => o.classList.remove("sel")); b.classList.add("sel"); })); };
    pickSeg("erapick");
    const preSel = (id, attr, val) => { const box = el(id); if (!box || !val) return; const btns = box.querySelectorAll(".segbtn"); btns.forEach((o) => { if (o.dataset[attr] === val) { btns.forEach((p) => p.classList.remove("sel")); o.classList.add("sel"); } }); };
    preSel("erapick", "era", eraParam);
    // 出身牌接线：点选改选（每行恒有一张预选=所发第一张，选路不拦截）；改年代只重发时代行；种子变更重发三行（所选位置重置为第一张）
    const effSeed = () => (el("seedin").value || "").trim() || seedParam || candSeed;
    const selEra = () => { const eb = document.querySelector("#erapick .segbtn.sel"); return eb ? eb.dataset.era : "c2000"; };
    const renderDeck = () => { const d = el("carddeck"); if (d) d.innerHTML = deckHtml(); };
    const redealAll = () => { if (!CARDS_ON) return; dealt = CARDS.deal(effSeed(), selEra()); picked.family = 0; picked.temper = 0; picked.era = 0; renderDeck(); };
    const redealEra = () => { if (!CARDS_ON) return; dealt.era = CARDS.deal(effSeed(), selEra()).era; picked.era = 0; renderDeck(); };
    // 出生年（抽选）：年份只由「有效种子＋年代」抽定（drawBirthYear），屏幕明示；玩家可手动步进调整
    // （birthOverride，本屏内有效），换年代/改种子即失效回到抽出的年份。没有重抽入口：种子不变，年份不变。
    let birthOverride = null;
    const eraObj = () => ERAS.find((e) => e.id === selEra()) || ERAS[ERAS.length - 1];
    const birthYears = () => { const e = eraObj(); const ys = []; for (let y = e.win[0]; y <= e.win[1]; y++) ys.push(y); return ys; };
    const shownBirth = () => { const ys = birthYears(); return birthOverride != null && ys.includes(birthOverride) ? birthOverride : drawBirthYear(effSeed(), eraObj()); };
    const syncBirth = () => {
      const e = eraObj(); if (!e.win) return;
      const ys = birthYears();
      const y = shownBirth();
      const hero = el("bighero"); if (hero) hero.textContent = String(y);
      const val = el("birthyear"); if (val) val.textContent = `${y} 年`;
      const strip = el("yearstrip");
      if (strip) strip.innerHTML = ys.map((yy) => `<button type="button" class="yearbtn${yy === y ? " sel" : ""}" data-year="${yy}" aria-label="生在${yy}年">${String(yy % 100).padStart(2, "0")}</button>`).join("");
      const bh = el("birthhint");
      if (bh) bh.textContent = birthOverride != null && ys.includes(birthOverride) ? "就定在这一年了。点别的数字，可以再换。" : "这一年，你出生了。点一个数字，就能换一年。";
      const sg0 = el("startgo"); if (sg0 && !liveSaved) sg0.textContent = `从${y}年开始这一生`;
    };
    const stripEl = el("yearstrip");
    if (stripEl) stripEl.addEventListener("click", (ev) => { const b = ev.target.closest(".yearbtn"); if (!b) return; birthOverride = Number(b.dataset.year); syncBirth(); });
    document.querySelectorAll("#erapick .segbtn").forEach((b) => b.addEventListener("click", () => { birthOverride = null; syncBirth(); }));
    if (CARDS_ON) {
      el("carddeck").addEventListener("click", (ev) => {
        const b = ev.target.closest(".cardpick"); if (!b) return;
        picked[b.dataset.cat] = Number(b.dataset.i);
        renderDeck();
      });
      document.querySelectorAll("#erapick .segbtn").forEach((b) => b.addEventListener("click", () => { redealEra(); }));
    }
    const syncAutoPick = () => {
      document.querySelectorAll("#autopick .switchbtn").forEach((o) => o.classList.toggle("sel", o.dataset.mode === IFY.prefs.mode));
      document.querySelectorAll("#speedpick .segbtn").forEach((o) => o.classList.toggle("sel", o.dataset.speed === IFY.prefs.speed));
      const sp = el("speedpick"); if (sp) sp.classList.toggle("dim", IFY.prefs.mode === "off");
    };
    document.querySelectorAll("#autopick .switchbtn").forEach((b) => b.addEventListener("click", () => { IFY.prefs.mode = b.dataset.mode; savePrefs(); syncAutoPick(); }));
    document.querySelectorAll("#speedpick .segbtn").forEach((b) => b.addEventListener("click", () => { IFY.prefs.speed = b.dataset.speed; savePrefs(); syncAutoPick(); }));
    syncAutoPick();
    // 年代分流（v0.17.0）：试点年代走序章开局——藏牌面、亮序章入口；其余年代照旧。切换只改呈现，开局函数在点击时按年代走
    // v0.24.0：路线卡已撤出首页（选路回局内 22 岁汇入拍），此处只切标题/介绍/出身子区/序章提示与开始按钮文案
    const startLabel = () => liveSaved ? "重新开始一局" : `从${shownBirth()}年开始这一生`; // 有进行中存档时主按钮让位给续玩：文案恒为重开（存档优先）；只有终局档时不算占用
    const eraToggle = () => {
      const pro = hasPrologue(selEra());
      const t = el("starttitle"); if (t) t.textContent = "你没走的那条路，过得怎么样？";
      const db = el("deckblock"); if (db) db.hidden = pro;
      const ed = el("eradesc"); if (ed) { const pool = (eraObj().descs || []); if (pool.length) ed.textContent = pool[seedFromString(effSeed() + "#eradesc:" + eraObj().id) % pool.length]; } // 年代说明行：按种子+年代选条——同一开局恒同一条（与「同种子同人生」一致），换种子才换条；纯呈现，不入局不入存档
      const sg = el("startgo"); if (sg) sg.textContent = startLabel();
    };
    document.querySelectorAll("#erapick .segbtn").forEach((b) => b.addEventListener("click", eraToggle));
    eraToggle();
    syncBirth(); // 出生年行首帧即明示（与年代预选/链接参数对齐后的抽出年份）
    el("seedin").addEventListener("input", () => { redealAll(); birthOverride = null; eraToggle(); syncBirth(); }); // 种子一变手牌即重发：屏幕上的手牌恒等于开局将用的手牌（输入即生效，无单独确认按钮）；出生年同理随种子重抽，年代说明行也随种子重选条
    el("daily").addEventListener("click", () => {
      const dd = dailyFor(todayStr());
      dailyCtx = { eraId: dd.era.id, routeId: dd.route.id }; // 待选路线记下：开局随存档带入，22 岁选路拍预选高亮那一张、仍须玩家点选（两条流程一致）
      el("seedin").value = dd.seed;
      const eb = document.querySelector(`#erapick .segbtn[data-era="${dd.era.id}"]`);
      if (eb) eb.click(); // 年代走既有接线（重发时代牌 + 切换呈现）
      redealAll();
      if (hasPrologue(dd.era.id)) {
        el("dailyline").textContent = `今日一局：${dd.era.label}，从小时候开始。种子替你备好了，点开始就是今日这局；选路时今日那条会先亮着，你也可以改。`;
      } else {
        el("dailyline").textContent = `今日一局：${dd.era.label}。种子替你备好了，点开始就是今日这局；进局选路时，今日那条会先亮着，你也可以改。`;
      }
      el("daily").textContent = "今日一局已备好";
      birthOverride = null; syncBirth(); // 今日一局换了种子：出生年回到该种子抽出的年份
    });
    // F2 种子正式入口（圆桌决议）：安静的次要入口，与折叠区里的 #seedin 是同一个输入——
    // 这里填的码同步写进 #seedin 并触发它既有的 input 接线（重发牌面、按种子重抽出生年），
    // 再点开始走的仍是统一开局按钮那一条路，与带 ?seed= 链接打开完全同路，不另起开局逻辑。
    const seIn = el("seedentryin"), seGo = el("seedentrygo"), seMsg = el("seedentrymsg");
    if (seIn && seGo) {
      if (seedParam && !seIn.value) seIn.value = seedParam; // 链接带来的种子在正式入口里也看得见
      const syncEntry = () => { const si = el("seedin"); if (si && si.value !== seIn.value) { si.value = seIn.value; si.dispatchEvent(new Event("input", { bubbles: true })); } };
      seIn.addEventListener("input", syncEntry); // 填了不用入口按钮、直接点主开始钮，也用这个种子
      seGo.addEventListener("click", () => {
        const v = (seIn.value || "").trim();
        if (!v) { if (seMsg) seMsg.textContent = "先填种子码，再点开始。"; seIn.focus(); return; } // 引擎对种子无格式限制（任意非空串都按哈希成局），空着没法开，只提示这一句
        syncEntry();
        el("startgo").click();
      });
      seIn.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); seGo.click(); } });
    }
    // 统一开局按钮：序章年代走序章开局；无序章年代先落出身、路线留到局内 22 岁汇入拍选（newGame 只建局不落路线）
    el("startgo").addEventListener("click", () => {
      if (startLock) return;
      startLock = true;
      el("startgo").disabled = true;
      const seedStr = (el("seedin").value || "").trim() || seedParam || candSeed; // 随机开局用开局页渲染时已生成的候选种子（牌面据此而发，§A3.2）
      const explicitSeed = !!((el("seedin").value || "").trim() || seedParam); // 跨局避重：种子是玩家给的（手填/链接/每日一局写入 #seedin）＝指定局，不装填避重；只有走 candSeed 的新随机局才装填
      const eb = document.querySelector("#erapick .segbtn.sel");
      const eraId = eb ? eb.dataset.era : "c2000";
      const dRoute = dailyCtx && dailyCtx.eraId === eraId ? dailyCtx.routeId : null; // 年代被手改过则待选路线作废，不带进局
      if (hasPrologue(selEra())) {
        newGamePrologue(seedStr, eraId, shownBirth(), dRoute, explicitSeed); // 出生年：屏上明示的那一年（抽出或手动拨定），两条人生共用（影子在出生时拷 S.birthYear）
        return;
      }
      if (CARDS_ON && dealt) for (const cat of ["family", "temper", "era"]) ANA.track("card_pick", { cat, pick: picked[cat], changed: picked[cat] !== 0 });
      newGame(seedStr, { era: eraId, birth: shownBirth(), cards: CARDS_ON && dealt ? [dealt.family[picked.family], dealt.temper[picked.temper], dealt.era[picked.era]] : [], dailyRoute: dRoute, explicitSeed });
    });
    IFY.finishRender();
  }

  function clearSave0() { /* 开局页不清除存档，续玩入口要用 */ }

  // v0.24.0（首页重做）：无序章开局改为「只建局、先落出身，路线留到局内 22 岁汇入拍选」——与序章流程共用
  // renderRouteMerge/mergeIntoRoute。原 newGame 的路线落定段（路线 stats、unchosen、game_start、温度基线、
  // initParents、影子出生）整体随选路拍走，叠加顺序仍是 初值 → 出身 → 路线；三股流的消费顺序与旧口径一致
  // （出身结算不耗流，initParents 与影子出生仍在首次 step 之前、同序发生）。
  function newGame(seedStr, opts) {
    IFY.S = freshState(seedStr);
    anaPrologueDone = false; anaRetireSent = false; // 统计升级批：新局重置埋点已发标记
    IFY.session = null; // v0.21 WP1：新局先弃旧会话，Track_B 出生时由 shadow-life 重建 session
    IFY.prevStats = null; IFY.resumeMark = false;
    IFY.streamFollow = true; IFY.streamSeen = 0; IFY.streamTop = 0;
    seedStreams(seedStr); // v0.18.0：三股流由主种子派生
    if (opts) { IFY.S.era = opts.era; IFY.S.birthYear = opts.birth; }
    IFY.S.autoMode = IFY.prefs.mode; IFY.S.speed = IFY.prefs.speed;
    IFY.S.mergePending = true; // 待选路标记：存档凭此判活（loadSave）、step 凭此落汇入拍，路线落定即清
    // 出身层（v0.13.0，§A2.1）：叠加顺序 初值 → 牌面修正（数值+钩子旗同一拍） → 路线 stats；出身行记在出发之前
    IFY.S.cards = (opts && opts.cards) || [];
    if (CARDS && IFY.S.cards.length) {
      const ef = {};
      for (const id of IFY.S.cards) { const c = CARDS.byId[id]; if (!c) continue; for (const [k, v] of Object.entries(c.effects || {})) ef[k] = (ef[k] || 0) + v; if (c.set) IFY.S.flags[c.set] = true; }
      applyEffects(ef);
      const names = IFY.S.cards.map((id) => (CARDS.byId[id] || {}).name || "").filter(Boolean);
      if (names.length) IFY.S.log.push(`22 岁 · 出身：${names.join(" · ")}`);
    }
    if (opts && opts.dailyRoute) IFY.S.dailyRoute = opts.dailyRoute; // 今日一局待选路线：汇入拍预选高亮用，落定即清
    armAvoidance(!!(opts && opts.explicitSeed)); // 跨局避重装填：须在首个 step() 抽取之前、S.seedStr 落定之后
    save();
    step(); // 无路线 + mergePending → step 落 22 岁汇入拍
  }

  // ---------- 序章（v0.17.0，试点年代 c2000）：独立推进循环，汇入点在 22 岁 ----------
  const STAGE_LABEL = { origin: "来历", child: "童年", teen: "少年", youth: "少年", adult: "成年", late: "晚年" };

  function newGamePrologue(seedStr, eraId, birth, dailyRoute, explicitSeed) {
    IFY.S = freshState(seedStr);
    anaPrologueDone = false; anaRetireSent = false; // 统计升级批：新局重置埋点已发标记
    IFY.session = null; // v0.21 WP1：序章段会话由 save() 惰性建（tracks.B=null，蓝图 3.3），Track_B 待 22 岁汇入时出生
    IFY.prevStats = null; IFY.resumeMark = false;
    IFY.streamFollow = true; IFY.streamSeen = 0; IFY.streamTop = 0;
    seedStreams(seedStr); // v0.18.0：三股流由主种子派生
    if (eraId) { IFY.S.era = eraId; IFY.S.birthYear = birth; }
    IFY.S.autoMode = IFY.prefs.mode; IFY.S.speed = IFY.prefs.speed;
    if (dailyRoute) IFY.S.dailyRoute = dailyRoute; // v0.24.0：今日一局待选路线随档带入序章，22 岁汇入拍预选高亮、落定即清
    armAvoidance(!!explicitSeed); // 跨局避重装填（序章幕次不走池抽取，快照只在 22 岁汇入后的成人段 L3 生效）
    PRO.start(IFY.S, seedStr); // 处境发放与童年基线在此落定（序章独立流，主 RNG 一格不动）
    IFY.rec("prologue", "sit_" + (IFY.S.prologue ? IFY.S.prologue.situation : "school")); // 处境发放进账本（v0.18.0）
    save();
    step();
  }

  function prologueHead(age, stage) {
    const yr = IFY.S.birthYear ? ` · 公元 ${IFY.S.birthYear + age} 年` : "";
    return `<p class="meta">${age} 岁${yr} · ${STAGE_LABEL[stage] || ""} · 种子 ${esc(IFY.S.seedStr)}</p>`;
  }

  function renderPrologue() {
    IFY.curKind = "prologue";
    if (!PRO || !IFY.S.prologue) { IFY.S.phase = "adult"; step(); return; } // 序章模块缺失时不卡死（结构上不会发生）
    if (IFY.S.prologue.done) { renderRouteMerge(); return; }
    const view = PRO.present(IFY.S);
    if (!view) { renderRouteMerge(); return; }
    if (view.pendingState) { IFY.applyState({ setState: view.pendingState }); IFY.S.prologue.pendingState = null; } // 处境落定走状态边（pr_origin → schooling）
    if (view.gapFx) applyEffects(view.gapFx); // fix8：间隙平年的数值在其画面呈现时结算（present 只在首次物化时带出 gapFx，重演同一画面不双计）
    save();
    app().innerHTML = `<section class="card">${prologueHead(view.age, view.stage)}${IFY.autoPanelHtml()}
      ${view.title ? `<h2>${esc(view.title)}</h2>` : ""}
      ${view.text.split("\n").map((p) => `<p class="body">${esc(p)}</p>`).join("")}
      ${view.gateNote ? `<p class="hint">${esc(view.gateNote)}</p>` : ""}
      <div id="echo"></div>
      ${view.choices ? `<div class="choices">${view.choices.map((c, i) => `<button class="choice" data-i="${i}">${esc(c.label)}</button>`).join("")}</div>`
                     : `<button class="primary" id="cont">${view.id === "pr_y21" ? "到 22 岁" : "继续"}</button>`}
      </section>`;
    IFY.finishRender();
    if (!view.choices) {
      const goNext = () => {
        IFY.rec("prologue", view.id);
        const r = PRO.choose(IFY.S, -1);
        if (r.gapFx && Object.keys(r.gapFx).length) applyEffects(r.gapFx); else IFY.S.lastDelta = "";
        save();
        step();
      };
      el("cont").addEventListener("click", goNext);
      // v0.20.4：自动推进走序章自己的继续动作（原先用成人段 advance 只涨年龄不推幕次，全程模式会卡在来历屏空转）
      IFY.armAuto(view.text, goNext);
      return;
    }
    const choosePrologueChoice = (i, autoSelected) => {
      const c = view.choices[i];
      IFY.clearAuto();
      applyEffects(c.effects);
      if (c.set) IFY.S.flags[c.set] = true;
      IFY.applyState(c);
      // 第 1 期 P1-3：序章选项埋种——所选项带 seed 声明时落账（唯一写点 plantSeed，与职业记账同批挂点纪律）。
      if (typeof IFY.plantSeed === "function") IFY.plantSeed(IFY.S, c, view.id, view.age);
      IFY.rec("prologue", view.id, { choice: c.label, set: c.set || null });
      if (view.isFork) view.choices.forEach((o, j) => { if (j !== i) IFY.S.unchosen.push({ kind: "track", age: 16, label: o.label }); });
      if (autoSelected) IFY.S.log.push(`${view.age} 岁 · 自动选：${c.label}`);
      const r = PRO.choose(IFY.S, i);
      if (r.gapFx && Object.keys(r.gapFx).length) applyEffects(r.gapFx);
      const box = document.querySelector(".choices");
      if (box) box.remove();
      el("echo").innerHTML = `${IFY.deltaLine()}${autoSelected ? `<p class="autonote">自动推进 · 已选「${esc(c.label)}」</p>` : `<p class="pickednote">已选「${esc(c.label)}」</p>`}${IFY.echoText(c) ? `<p class="echo">${esc(IFY.echoText(c))}</p>` : ""}<button class="primary" id="cont">继续</button>`;
      save(); el("cont").addEventListener("click", () => step());
      if (autoSelected) IFY.armAuto(IFY.echoText(c) || c.label, () => step(), "advance"); // 照事件屏：自动选后回响「继续」接着 arm
    };
    document.querySelectorAll(".choice").forEach((b) => b.addEventListener("click", () => {
      const i = Number(b.dataset.i);
      IFY.choiceBeat(b, () => choosePrologueChoice(i, false));
    }));
    // 全程自动选扩围（本批）：序章选项与事件屏同一套两段式——主计时到点先预高亮 400ms，再走同一落定函数
    IFY.armAuto(view.text, () => {
      const idx = Math.floor(IFY.rng() * view.choices.length);
      const btns = document.querySelectorAll(".choices .choice");
      btns.forEach((o, j) => {
        o.disabled = true;
        o.classList.toggle("picked", j === idx);
        o.classList.toggle("faded", j !== idx);
      });
      IFY.autoPhase2 = setTimeout(() => { IFY.autoPhase2 = null; choosePrologueChoice(idx, true); }, 400);
    }, "choice");
  }

  // 22 岁汇入：五路线在这里选；出身（家底+性子+时代）同一拍结算，叠加顺序与旧开局一致（初值 → 出身 → 路线）
  // v0.24.0 起两条流程共用这一拍：序章流程经 renderPrologue 到达，无序章流程经 step 的 mergePending 分支到达。
  // 今日一局的待选路线在此预选高亮（.dailymark），仍须玩家点选，不自动落定。
  function renderRouteMerge() {
    IFY.curKind = "fork";
    // 统计升级批：prologue_done——选路界面出现即序章走完（两条流程共用此拍）；
    // 与 game_start（点选路线才发）的差就是选路前流失。本局只发一次（内存标记）。
    if (!anaPrologueDone) { anaPrologueDone = true; ANA.track("prologue_done", { era: IFY.S.era }); }
    const trackName = { study: "念书", work: "打工", craft: "学手艺", home: "守家里" }[IFY.S.state.track] || "";
    const mergeText = `${trackName ? `这几年，你是${trackName}过来的。` : ""}到了 22 岁，路一下子宽了。往哪边走，这一回你自己定。没选的那几条也不会消失——往后隔些年，它们还会远远地看你一眼。`;
    app().innerHTML = `<section class="card">${prologueHead(START_AGE, "adult")}${IFY.autoPanelHtml()}
      <h2>22 岁 · 往后的路</h2>
      <p>${mergeText}</p>
      <div class="choices">${D.routes.map((r, i) => `<button class="choice${IFY.S.dailyRoute === r.id ? " dailymark" : ""}" data-i="${i}"><b>${esc(routeNameFork(r))}</b><small>${esc(routeDescFork(r))}</small></button>`).join("")}</div>
      </section>`;
    IFY.finishRender();
    const chooseRoute = (route, autoSelected) => {
      IFY.clearAuto();
      if (autoSelected) IFY.S.log.push(`22 岁 · 自动选：${route.name}`);
      mergeIntoRoute(route); // 手动与自动走同一条落定路径（出身结算/路线落账/影子出生都在里面，一格不差）
    };
    document.querySelectorAll(".choice").forEach((b) => b.addEventListener("click", () => {
      const route = D.routes[Number(b.dataset.i)];
      IFY.choiceBeat(b, () => chooseRoute(route, false));
    }));
    // 全程自动选扩围（本批）：选路与事件屏同一套两段式——今日一局的 .dailymark 不特殊照顾，纯随机抽
    IFY.armAuto(mergeText, () => {
      const idx = Math.floor(IFY.rng() * D.routes.length);
      const btns = document.querySelectorAll(".choices .choice");
      btns.forEach((o, j) => {
        o.disabled = true;
        o.classList.toggle("picked", j === idx);
        o.classList.toggle("faded", j !== idx);
      });
      IFY.autoPhase2 = setTimeout(() => { IFY.autoPhase2 = null; chooseRoute(D.routes[idx], true); }, 400);
    }, "choice");
  }

  function mergeIntoRoute(route) {
    const P = IFY.S.prologue;
    IFY.S.phase = "adult"; IFY.S.stage = "adult"; IFY.S.age = START_AGE;
    IFY.S.route = route;
    IFY.S.unchosen = (IFY.S.unchosen || []).filter((u) => u.kind !== "route");
    for (const r of D.routes) if (r.id !== route.id) IFY.S.unchosen.push({ kind: "route", label: r.name, id: r.id });
    if (P) { // 序章流程：出身三牌在此同拍结算。无序章流程的出身已在 newGame 建局时结算（S.cards 已定），不重入
      const cardIds = [P.family, P.temperPick, P.eraCard].filter(Boolean);
      IFY.S.cards = cardIds;
      if (CARDS && cardIds.length) {
        const ef = {};
        for (const id of cardIds) { const c = CARDS.byId[id]; if (!c) continue; for (const [k, v] of Object.entries(c.effects || {})) ef[k] = (ef[k] || 0) + v; if (c.set) IFY.S.flags[c.set] = true; }
        applyEffects(ef);
        // 选幕制片一（抉择 4）：出身行的性子段改印落账短语（幕名＋动作，如「过年那天躲进了里屋」），
        // 不再印性子卡名；家底/时代保留事实名不变。旧档无 temperDeed 时回落卡名，行为与旧版一致。
        const names = cardIds.map((id) => (id === P.temperPick && P.temperDeed) ? P.temperDeed : ((CARDS.byId[id] || {}).name || "")).filter(Boolean);
        if (names.length) IFY.S.log.push(`22 岁 · 出身：${names.join(" · ")}`);
        const temperIdx = P.temperPick ? P.temper.indexOf(P.temperPick) : -1;
        if (temperIdx >= 0) ANA.track("card_pick", { cat: "temper", pick: temperIdx, changed: temperIdx !== 0 }); // 序章里只有性子是真选择，埋点照口径只报这一类（家底是发放、时代是自动绑定）
      }
    }
    if (IFY.S.mergePending) delete IFY.S.mergePending; // 路线落定：待选路标记与今日待选路线一并消费删除——落定后的状态形状与旧开局逐字一致（字段不出席即未挂起，判活/分支都按真值读）
    if (IFY.S.dailyRoute) delete IFY.S.dailyRoute;
    ANA.track("game_start", { era: IFY.S.era, route: route.id });
    const base = rhythmBase("route", route.id); // 进成年段，温度基线换成路线基线（轨道基线已在 16 岁写入）；之后由分岔改温
    if (base) { IFY.S.temp = base.temp; IFY.S.rhythm = base.rhythm; }
    applyEffects(route.stats); IFY.S.lastDelta = "";
    sampleStatsPeak(); // 判词批 C：汇入收口采样——序章段（0–21 岁）的积累在此定格为峰值基线
    IFY.rec("route", route.id);
    IFY.S.log.push(`22 岁 · 出发：${route.name}`);
    // 分家记账（丙案第一步）：22 岁路口是默认分家点——序章没有搬家预约时在此落默认笔；有预约时
    // 不动它（预约是更早的路线级岔口，只有 22 后的换轨岔口能按时间序覆盖它）。出国路线的分家
    // 标签不用选路说法，记「落地那天」（路线文案自带说法：落地那天，谁也不认识你）。
    if (!IFY.S.pendingSplit) IFY.S.pendingSplit = { age: START_AGE, eventId: "route", label: route.id === "abroad" ? "落地那天" : route.name, source: "route" };
    // v0.21 WP1（蓝图裁定三施工注）：同 newGame 口径——落路线后、首次 save() 前显式 initParents（Track_A 传 rngW），随后 Track_B 出生
    IFY.initParents(IFY.rngW);
    if (typeof IFY.birthShadow === "function") IFY.birthShadow();
    if (typeof IFY.applySplitFactToShadow === "function") IFY.applySplitFactToShadow(); // 分家记账：搬家预约的反面事实在影子出生同拍标到 B（只动事实层，出生机制一字不改）
    save();
    step();
  }

  // ---------- 主推进 ----------
  function step() {
    IFY.clearAutoContext(); // 每进一个新画面，先清掉上一个画面的自动上下文，防串局
    // 统计升级批：retire_reached——退休只认单一事实源 S.retiredAt（applyState 在 workPhase→retired
    // 流转时落定，见 world/apply.js）。不把埋点挂进 applyState：影子轨共用 applyState 且其上下文
    // 禁用埋点（shadow-life.js 卷首注）；step() 是玩家本局的主推进，影子不走这里。本局只发一次
    // （内存标记）；跨会话续玩已退休存档时可能再报一次，口径见 docs/ANALYTICS.md。
    if (!anaRetireSent && IFY.S && typeof IFY.S.retiredAt === "number") {
      anaRetireSent = true;
      ANA.track("retire_reached", { era: IFY.S.era, route: IFY.S.route ? IFY.S.route.id : undefined, age: IFY.S.retiredAt });
    }
    if (IFY.S.phase === "prologue") { renderPrologue(); return IFY.mountStream(); } // 序章段有自己的推进循环（v0.17.0）
    if (IFY.S.mergePending && !IFY.S.route && !IFY.S.death) { renderRouteMerge(); return IFY.mountStream(); } // v0.24.0：无序章开局（及待选路存档续玩）先落 22 岁汇入拍；序章汇入走上面 renderPrologue 分支，不经此路
    if (IFY.S.death) return renderDeath();
    if (IFY.S.age >= MAX_AGE) { if (typeof IFY.forceFuseDeath === "function") IFY.forceFuseDeath(); return renderDeath(); } // v0.32.0：无死亡而岁数已及保险丝（只可能来自构造/旧档边界）→ 补一次保险丝终局再进死亡屏，不许裸进结算
    save();
    if (IFY.S.pendingFork && IFY.S.pendingFork.age === IFY.S.age) { IFY.renderForkEcho(); return IFY.mountStream(); } // 分岔复述拍未走时，续玩/重入都回到复述拍
    // 进程拍（v0.18.0，内核一期）：父母进程到期与 dating 到期结算排在分岔/瞥视之前，呈现完仍回到本年（不独占年份）
    if (IFY.S.route) IFY.initParents();
    const pdue = IFY.parentsDue();
    if (pdue) { const pit = D.events.find((e) => e.id === pdue.item); if (pit) { IFY.renderProcItem(pit, pdue.who, pdue.beat); return IFY.mountStream(); } }
    // 出生保送（孩子线批次 S1）：立约「要」的次年必达出生拍 p3_046 本体（绕其池窗，进程呈现本来就绕池）。
    // 排在 dating 摊牌之前——摊牌可能在同年改伴侣状态（定下/分手），出生拍按状态取版，必须以立约时的状态为准。
    // 进程呈现不走池路的 usedEvents 记账（year.js 池路才推），在此补记，防 39–43 窗内池抽二次呈现同一出生。
    if (IFY.bornDue()) { const bit = D.events.find((e) => e.id === "p3_046"); if (bit) { if (!IFY.S.usedEvents.includes(bit.id)) IFY.S.usedEvents.push(bit.id); IFY.renderProcItem(bit); return IFY.mountStream(); } }
    // 首次露面保底（孩子线批次 S2）：出生满 3 年孩子还没露过面，当年必达一条低龄孩子拍（选拍在
    // spouse.js 的 kidDebutItem：kidAgeMax≤3 且 met 按 w 加权，无合格条目落保底拍 proc_kid_debut）。
    // 排在 dating 摊牌之前与出生保送同理（候选拍按状态取版，以当下状态为准）。进程呈现不走池路的
    // usedEvents 记账，在此补记；呈现后当场 syncKidDebut 立旗，防本年 step 重入二次保底。
    if (IFY.kidDebutDue()) { const kit = IFY.kidDebutItem(); if (kit) { if (!IFY.S.usedEvents.includes(kit.id)) IFY.S.usedEvents.push(kit.id); IFY.renderProcItem(kit); IFY.syncKidDebut(); return IFY.mountStream(); } }
    // 成家接力（孩子线批次 S3）：定下满 1 年还没领证，当年以锚点拍呈现 p3_086 本体（绕其 32–45
    // 池窗与池抽，仍走它自己的文本与落账，呈现即立 married 旗）。位置在出生/露面保底之后、
    // dating 摊牌之前：licenseDue 只读 partnered 在场者、datingDue 只对 dating 者触发，人群不
    // 交叠，无同年抢占；且本呈现只立 married 旗、不改 spouse 状态，不扰出生/露面两拍的状态取版。
    // 进程呈现不走池路的 usedEvents 记账，在此补记——这一记同时是婚礼接力的接点：p3_003 的
    // chain 前置正读 usedEvents 认领证已呈现（细案 1.2 ④、D-3 甲案）。
    if (IFY.licenseDue()) { const lit = D.events.find((e) => e.id === "p3_086"); if (lit) { if (!IFY.S.usedEvents.includes(lit.id)) IFY.S.usedEvents.push(lit.id); IFY.renderProcItem(lit); return IFY.mountStream(); } }
    // 站稳门（孩子线批次 S4）：成家进度到点（定下满 2 年 / 处满 7 年，或 wait 之约到期再问），
    // 当年以进程分岔呈现 fork_kid（呈现定形 kidForkView：年龄戳实岁、≥44 换晚育版「要」、
    // 再问收成两选）。位置在领证保送之后、dating 摊牌之前——门的两条腿与分岔的伴侣变体
    // 文本都以摊牌前的状态为准（与出生/领证保底同段同理）。与年龄分岔同级：呈现独占本年
    // （复述拍后过年），故不走进程拍的「呈现完回到本年」路。
    if (IFY.kidGateDue()) { const kf = IFY.kidForkView(); if (kf) { IFY.renderFork(kf); return IFY.mountStream(); } }
    if (IFY.datingDue()) { const dit = D.events.find((e) => e.id === "proc_dating"); if (dit) { IFY.renderProcItem(dit); return IFY.mountStream(); } }
    // 出国去向拍与退休相位拍（v0.19.0）：同为进程拍，呈现完回到本年；去向默认推断先于去向拍检查之外的年份静默补值
    IFY.settleAbroadDefault();
    const akd = IFY.abroadKindDue();
    if (akd) { const ait = D.events.find((e) => e.id === akd.item); if (ait) { IFY.renderProcItem(ait); return IFY.mountStream(); } }
    const wpd = IFY.workPhaseDue();
    if (wpd) { const wit = D.events.find((e) => e.id === wpd.item); if (wit) { IFY.renderProcItem(wit); return IFY.mountStream(); } }
    if (typeof IFY.wageDue === "function") IFY.wageDue(); // 工资轮：年净额结算（进程层、work 相位拍之后；年龄戳防 step 重入重复结算，影子轨同点同规）
    // 入行关口（第 1 期 P1-6 激活）：与 workPhaseDue/工资轮相邻同点——进程拍都结完
    // 之后、年龄分岔查找之前判定（影子轨 stepYearHeadless 同位同规）。与年龄分岔
    // 同级：呈现独占本年（复述拍后过年）。gateDue 只读账零随机、关口组装的一切
    // 随机只走职业自有流；first 与 switch 互斥（gateDue 自身已按账判定，先问 first）。
    if (typeof IFY.gateDue === "function" && typeof IFY.gateForkView === "function") {
      const gk = IFY.gateDue(IFY.S, "first") ? "first" : (IFY.gateDue(IFY.S, "switch") ? "switch" : null);
      if (gk) { const gv = IFY.gateForkView(IFY.S, gk); if (gv) { IFY.renderFork(gv); return IFY.mountStream(); } }
    }
    // 年龄分岔查找：procOnly 分岔（如 fork_kid）只由进程层呈现，不走此查找（S4 起）
    let fork = D.forks.find((f) => f.age === IFY.S.age && !f.procOnly && (!f.route || f.route === IFY.S.route.id) && (!f.forbidRoute || f.forbidRoute !== IFY.S.route.id) && (!f.forbid || !IFY.S.flags[f.forbid]) && (!f.anyParentAlive || IFY.S.state.dad === "alive" || IFY.S.state.mom === "alive") && (!f.state || IFY.met(f))); // v0.18.0 审计急修：分岔门接线补齐 route/forbidRoute/forbid/anyParentAlive（fork28 镜像、fork52 双亲已不在不出）；原 v0.16.0 口径只认 state 门 // v0.16.0：分岔可带状态门（如 fork45 只给 kids 未定且有伴侣的人）；无门分岔行为不变 // v0.20.0 M2 收尾：fork33 的 bought_house 门由分岔级改选项级（已购房者不再整岔口消失，只隐买/租两项，近家人项保留）
    if (fork && fork.age === 58 && typeof IFY.retireDecidedThisYear === "function" && IFY.retireDecidedThisYear()) fork = null; // v0.20.1 W2 互锁：退休进程拍已在当年落过决定（呈现过 node/full/auto 或 workPhase 当年已流转），58 岁分岔当年不再以未退口吻重问（同一年不许双决）；已全退者另由 fork58 自带 workPhase 状态门挡下
    if (fork) { IFY.renderFork(fork); return IFY.mountStream(); }
    if (IFY.S.age in GLIMPSE_AGES) {
      // 分家记账（丙案第一步）：第一瞥漂移——三站不动，第一瞥改取三站中第一个 ≥ 分家岁+5 的站；
      // 分家点 22（默认与旧档）时第一瞥仍是 30，与旧行为一致。早于第一瞥的站位不算一次瞥视：
      // 与 renderGlimpse 入口同口径先消费叙事流恰好 1 抽（裁定二不变式），本年照常往下过。
      // 瞥视不占年（本批）：站位年不再被瞥视独占——判定呈现时只落 glimpseDue 挂起位，
      // 本年照常往下走完内容时槽，过年之前由 advance() 拦截、把瞥视作收尾屏呈现（其入口
      // 的 1 抽在那时消费，每站恰好 1 抽的账不变；站位规则与第一瞥判定一字未动）。
      // 续玩回到本年且挂起位还在（内容已呈现过、瞥视还没看），直接补呈现、不重跑内容。
      const fg = IFY.firstGlimpseAge(IFY.S);
      if (IFY.S.glimpseDue != null) { const gst = IFY.S.glimpseDue; IFY.S.glimpseDue = null; IFY.renderGlimpse(gst); return IFY.mountStream(); }
      if (fg != null && IFY.S.age >= fg) IFY.S.glimpseDue = GLIMPSE_AGES[IFY.S.age];
      else IFY.rng();
    }
    // 内容时槽五层仲裁（v0.20.0 M2，src/scheduler.js 的 planYear）：L1 危机抢占 → L2 稀有/链推进
    // → 温度平淡年 → L3 saliency 事件 → L4 微年填充。step() 只按计划分发呈现，不再自行抽取。
    const plan = IFY.planYear();
    if (plan.kind === "crisis") { IFY.renderCrisis(plan.crisis); return IFY.mountStream(); }
    if (plan.kind === "rare") { IFY.renderRare(plan.rare); return IFY.mountStream(); }
    IFY.renderEventYear(plan);
    IFY.mountStream();
  }

  function advance() {
    if (IFY.S.death) return renderDeath();
    // 瞥视不占年（本批）：站位年的内容已过完、过年之前先把瞥视作收尾屏呈现——清挂起位
    // 后调 renderGlimpse，其出口照旧走 advance()（挂起位已清，正常过年、收口采样在那时
    // 落）。死亡已在上方拦下：终局之年不补瞥视。内容各呈现的出口（事件/危机/稀有/平年/
    // 微年挂起）全经本函数过年，故拦截点只此一处。
    if (IFY.S.glimpseDue != null && (IFY.S.age in GLIMPSE_AGES)) {
      const gst = IFY.S.glimpseDue; IFY.S.glimpseDue = null;
      IFY.renderGlimpse(gst); return IFY.mountStream();
    }
    sampleStatsPeak(); // 判词批 C：上一年收口采样——当年进程拍/事件/分岔/工资/住房诸写入已在 step 年内全部落定
    IFY.S.age += 1;
    IFY.S.wageDelta = ""; // fx-fix：跨年先清工资标注——新一年的进程拍屏在工资结算之前呈，不许读到去年的；本年结算后由 wageDue 重记
    if (IFY.S.age > MAX_AGE) IFY.S.age = MAX_AGE;
    if (IFY.rollDeath()) { save(); return renderDeath(); } // 受控终局：不受控 Track 冻结在同龄处，不再步进（蓝图 5.1）
    if (IFY.S.age >= MAX_AGE) { if (typeof IFY.forceFuseDeath === "function") IFY.forceFuseDeath(); save(); return renderDeath(); } // v0.32.0 保险丝：110 岁仍未掷中 → 强制终局，呈现与自然死亡无区别
    // v0.21 WP1（蓝图 5.1 唯一挂点）：受控未终局才步进不受控 Track——瞥视在 step() 呈现阶段读到的对面已是同龄最新状态。特性守卫：会话层不可用时跳过。
    if (typeof IFY.stepUncontrolled === "function") IFY.stepUncontrolled();
    step();
  }

  function renderDeath() {
    // 终局变现提前落账（v0.30.3）：死亡既已定案、死亡屏渲染之前（顶栏六维在此屏同显），
    // 主角轨先落 houseSettleDue——死亡屏、结算、分享卡从此同读变现后的数值；houseSettled
    // 防重，结算处（renderEnd）再调为空转。影子轨没有自己的死亡屏，仍在结算处落账，
    // 结算时两条轨都已落账，口径不冲突。v0.32.0 起主角轨终局必经此屏（含保险丝终局），无「未死进结算」的路径。
    if (typeof IFY.houseSettleDue === "function") IFY.houseSettleDue(IFY.S);
    sampleStatsPeak(); // 判词批 C：死亡年收口采样——终局变现（money/freedom 增量）落账后再定格，保证峰值不低于判词取数时的终局值
    IFY.curKind = "death";
    IFY.clearAutoContext();
    app().classList.remove("playwrap");
    app().innerHTML = `<section class="card death">${IFY.head(null, true)}
      <h2>${IFY.S.death.age} 岁那年，你走了</h2>
      <p class="body">${esc(IFY.S.death.text)}</p>
      <button class="primary" id="toend">看这一生的结算</button>
    </section>`;
    IFY.finishRender();
    el("toend").addEventListener("click", IFY.renderEnd);
    // 本批施工判断（与任务书「死亡屏不许自动点任何按钮」一句有张力，报告里单独标出、给出回退点）：
    // 死亡屏是无抉择屏，按 advance 规矩自动进结算——否则验收「零点击走到结算页」在最后一屏断掉。
    // 结算页本身不设任何自动动作（到了结算就停，「再活一次」之类绝不自动点）。plain/full 流过，off 不动。
    IFY.armAuto(IFY.S.death.text, () => IFY.renderEnd());
  }

  const TIER_ORDER = { legendary: 0, epic: 1, rare: 2 };

  const TIER_LABEL = { legendary: "传说结局", epic: "史诗结局", rare: "稀有结局" };

  // ---------- 分享台出图：buildCard(type, ratio) 参数化绘制 ----------
  // type: "verdict" 判词卡（模板 A：特殊结局标题+判词+分岔路图+六维）
  //       "log"     流水账卡（公元年轴+关键节点+判词节选+六维小条）
  // ratio: "45" 1080×1350 | "916" 1080×1920
  const SERIF = "Georgia, 'Songti SC', 'Noto Serif SC', serif";
  const SANS = "'Hiragino Sans', 'Noto Sans SC', sans-serif";
  IFY.currentCanvas = null; // 分享台当前预览的 canvas，分享/保存都用它

  // 主按钮：优先 Web Share API 带图片文件；不支持或失败退化为下载 PNG（用户取消分享则不打扰）
  async function shareCurrent() {
    if (!IFY.currentCanvas) return;
    try {
      const blob = await new Promise((res) => IFY.currentCanvas.toBlob(res, "image/png"));
      const file = blob ? new File([blob], "if-that-year-" + IFY.S.seedStr + ".png", { type: "image/png" }) : null;
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: IFY.shareCopy() });
        return;
      }
    } catch (e) {
      if (e && e.name === "AbortError") return;
    }
    IFY.downloadCurrent();
  }
  Object.assign(IFY, { D, CARDS, PRO, RHYTHM, PROLOGUE_ERA, hasPrologue, ANA, START_AGE, MAX_AGE, STAT_META, GLIMPSE_AGES, ERAS, SAVE_KEY,
    LIVES_KEY, PREFS_KEY, SPEED_CPS, SPEED_LABEL, SPEED_STYLE, AUTO_BASE_MS, AUTO_CAP_MS, AUTO_MODES,
    DEFAULT_AUTO_MODE, RNG, RNGW, RNGA, mulberry, rng, rngW, rngA, seedStreams, seedFromString, drawBirthYear, clamp, esc,
    el, app, reducedMotion, freshState, sampleStatsPeak, sampleStatsLate, save, loadSave, clearSave, loadLives, todayStr, recordLives,
    STREAK_KEY, LASTLIFE_KEY, loadStreak, loadLastLife, dateStrOf, shiftedDateStr, recordDayAndLife,
    HISTORY_KEY, loadHistory, recordHistory, recordSeen, armAvoidance, restoreAvoidance,
    streakLine, lastLifeLine, dailyFor, loadPrefs, savePrefs, rhythmOf, rhythmBase, applyTempDelta,
    applyEffects, finalAge, renderStart, clearSave0, newGame, STAGE_LABEL, newGamePrologue, prologueHead,
    renderPrologue, renderRouteMerge, mergeIntoRoute, step, advance, renderDeath, TIER_ORDER, TIER_LABEL,
    splitPointOf, firstGlimpseAge, glimpseStationsOf, noteSplitFork, SPLIT_FORKS,
    SERIF, SANS, shareCurrent });
})(window.IFY);
