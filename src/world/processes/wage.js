"use strict";
/* 《如果那年》工资进程（工资轮 MVP，设计稿 ~/workspace/wage-design/DESIGN.md）
 * 每年在世界进程层结算一次「年净额」：工资（或养老金）＋副业－按揭＋免租红利，
 * 净额＝当年劳动与资产的净现金流（已扣日常开销，0–100 标尺上的点数）。
 * 纪律（稿 §一/§三）：
 *  - 金额是既有派生状态（入行旗/formOf/任期/相位/住房/定居轨迹）的纯函数，零随机消耗——
 *    同种子逐字复现不许被本进程扰动（不读任何 rng 流）。
 *  - 小数不扔：结转字段 wageCarry 累积零头，攒够整数经 applyEffects 入账，
 *    落账的标注走 S.wageDelta＋流水账一行（fx-fix，见 wageDue 尾段），与事件标注同口径（实际落值）。
 *  - 主轨与影子轨同规：engine.step() 与 shadow-life.stepYearHeadless() 在 workPhaseDue()
 *    相邻处调同一个 wageDue()，靠 wageSettledAge 年龄戳保证每轨每年只结一次
 *    （step() 同一年会多次重入，年龄戳防重复结算）。
 * 档位（稿 §四.1）：档由 formOf() 定、档内高薪组由 mainEntryOf() 的入行旗定、
 * 年增进度由 tenureYears() 定（当前主线连续任职年数，不跨线累计——稿 MVP 简化口径）。
 * 无入行旗时按形态兜底定档（见 fallbackTierOf）、任期按 fallbackStartAge 起算——
 * 只改覆盖面，档额/增幅/顶/替代率不动（工资轮续施工，总指挥裁定）。
 * 增幅按复利 (1+g)^任期 后钳顶（稿：A 档「复利型」、B/D「平台型」由增幅与顶共同成形）。
 */
(function (IFY) {
  const TIERS = {
    A: { base: 0.50, growth: 0.020, cap: 0.90 },  // 高薪组（employee 且入行旗属下表）
    B: { base: 0.42, growth: 0.008, cap: 0.60 },  // 体制（public/exam_landed）
    C: { base: 0.36, growth: 0.010, cap: 0.52 },  // 普通（employee 其余＋self）
    D: { base: 0.26, growth: 0.003, cap: 0.32 },  // 低档（flex/farm）
    X: { base: 0.55, growth: 0.016, cap: 0.85 },  // 在外年 A−（abroadKind 对表见 wageTierOf 注）
  };
  const HIGH_GROUPS = { dev: 1, fin: 1, acct: 1, press: 1, med: 1, grad: 1 }; // med 含 med_work/med_hosp（同组前缀）
  const PENSION_RATE = { formal: 0.6, fallback: 0.45, informal: 0.3 };
  const SIDE_FULL = 0.15, SIDE_EARLY = 0.08;      // 稿 §四.3：side_job/xiahai 成型 / side_start 期

  // 逐年账本（仅内存，WeakMap 按 Track state 挂，不进存档）：验收归因与调试读
  // IFY.wageLedgerOf(state)——每条 {age, wage, pension, side, housing, gross, pay, actual}，
  // 分量为带符号的当年贡献（wage 已含相位折扣），actual 为入账后钱的实际变动（钳制后）。
  const LEDGER = new WeakMap();
  function ledgerOf(st) { return LEDGER.get(st) || []; }

  // —— 无入行旗兜底（工资轮续施工，总指挥裁定「按形态兜底」）——
  // 设计稿档位表本按 formOf() 形态定档、入行旗只分 A 档组别；首版实现把「无入行旗」
  // 一律判无档，与稿不合：formOf 的 R5 明文「含一切未落入行旗的局，22 岁出发即按
  // 受雇处理」，且 22 岁合流从不写就业事实（AN-3 既有结论），旗缺失是记账缺口、
  // 不是「此人没工作过」的叙事事实。故无旗时按形态定档：employee/self→C、
  // flex/farm→D、public→B（public 只能由 exam_landed 旗经 R1 读出，无旗实际不可达，
  // 此行只为口径完整）；A 档组别与在外 A−（X）仍只认入行旗，无旗者永不进 A/X。
  // 但路线「未决窗」内不发——与 record.js 的路线未决门逐项对齐（那道门在窗内把
  // 其他行当的入行拍全部挡住，工资若在窗内按受雇发，会与全游戏的未决口径打架）：
  //   · home 路线或少年 home 轨道：22–28 岁且 exam_passed/exam_landed/exam_failed
  //     三事实皆无 → 考试链未出结果，当年不发（备考未上岸者由此保持 0）；
  //   · study 路线：22–27 岁默认在读，当年不发；
  //   · gap 路线：22 岁是停年，当年不发（稿 §四.2 gap 停年 0）。
  function fallbackTierOf(st) {
    if (!st || !st.flags) return null;
    const F = st.flags;
    const routeId = st.route && st.route.id;
    const onHome = routeId === "home" || (st.state && st.state.track === "home");
    const examOpen = !(F.exam_passed || F.exam_landed || F.exam_failed);
    if (onHome && examOpen && st.age >= 22 && st.age <= 28) return null;
    if (routeId === "study" && st.age >= 22 && st.age < 28) return null;
    if (routeId === "gap" && st.age <= 22) return null;
    const form = IFY.formOf(st);
    if (form === "public") return "B";
    if (form === "employee" || form === "self") return "C";
    if (form === "flex" || form === "farm") return "D";
    return null;
  }

  // 无旗者任期起算年龄（派生现算，与兜底窗同口径，不新增存档字段）：
  //   home 线（路线或少年轨道）优先：在读/停年起算都被未决窗盖过——取考试链
  //   落定事实的落点年龄（exam_failed/exam_passed 先到者——record.js 门以
  //   exam_passed 起为「链落定」），无落定事实则取窗满的 29；study 取在读窗
  //   过后的 28；gap 取停年次年的 23；其余路线取落点 22（formOf R5 口径）。
  function fallbackStartAge(st) {
    const routeId = st.route && st.route.id;
    const onHome = routeId === "home" || (st.state && st.state.track === "home");
    if (onHome) { // home 未决窗盖过路线自身起算（窗封到 28 岁，与 fallbackTierOf 的挡窗同界）
      const ages = ["exam_failed", "exam_passed"].map((f) => (st.flagAges && typeof st.flagAges[f] === "number") ? st.flagAges[f] : null).filter((x) => x !== null);
      if (ages.length) return Math.min.apply(null, ages);
      return 29;
    }
    if (routeId === "study") return 28;
    if (routeId === "gap") return 23;
    return 22;
  }

  // 档位判定：返回 "A"/"B"/"C"/"D"/"X" 或 null（无档：未决窗内，或形态不落档）。
  // 在外年（abroad 路线且定居轨迹终点仍在外）一律走 A−（X）：稿 §四.2 的 abroadKind 对表
  // （劳务/留学/外派细分）未定版，MVP 按稿缺省「在外年按 A− 发」——不分 kind，登记于施工报告。
  function wageTierOf(st) {
    const entryFlag = typeof IFY.mainEntryOfState === "function" ? IFY.mainEntryOfState(st) : null; // 返回入行旗 id 字符串或 null
    if (!entryFlag) return fallbackTierOf(st);
    const form = IFY.formOf(st);
    if (form === "public") return "B";
    if (form === "employee" && typeof IFY.settledOf === "function" && IFY.settledOf(st).final === "abroad") return "X";
    if (form === "employee") return HIGH_GROUPS[entryFlag.split("_")[0]] ? "A" : "C";
    if (form === "self") return "C";
    if (form === "flex" || form === "farm") return "D";
    return null;
  }

  // 当年「未打折」档额：min(顶, 起薪 × (1+年增)^任期)。study 入职溢价（稿 §四.2）：
  // 入行旗为 grad_work 时起薪 +0.06、增幅 ×1.5（顶不变）。
  function tierAmount(tierKey, entryFlag, tenure) {
    const t = TIERS[tierKey];
    if (!t) return 0;
    let base = t.base, growth = t.growth;
    if (entryFlag === "grad_work") { base += 0.06; growth *= 1.5; }
    return Math.min(t.cap, base * Math.pow(1 + growth, Math.max(0, tenure | 0)));
  }

  function pensionOf(S) {
    const form = (S.retirePlan && S.retirePlan.form) || (typeof IFY.workForm === "function" ? IFY.workForm() : "fallback");
    const rate = PENSION_RATE[form] != null ? PENSION_RATE[form] : PENSION_RATE.fallback;
    const base = typeof S.wageLastNet === "number" ? S.wageLastNet : 0;
    return Math.min(0.45, Math.max(0.15, base * rate)); // 稿 §四.3：钳 [0.15, 0.45]，从没入行按 0.15 兜底
  }

  // —— 年结流水账行的文案（CL-146 修 F1「刷屏」：纯呈现，零随机、零数值影响）——
  // 病根：年净额零头结转后落账几乎恒为 +1，旧模板写死「工资年结：金钱 +1」，
  // 一局里逐字重播二十多次。修法：行首「工资年结」不动（结算/典藏按此前缀认
  // 系统行），其后按当年真实构成（工资/养老金/副业/住房行）选来源短语，再轮换
  // 一条当年成立的事实（工龄、退休年数、手里钱数、月供状态、里程碑），最后对
  // 本局已落账的年结正文做查重——撞了就换下一组组合，结构上保证同局正文不重。
  // 取材全是既有派生状态（账本/旗/相位/六维），不读任何 rng 流，漂移为零。
  function wageLogLine(S, c) {
    const amt = `金钱 ${c.actual > 0 ? "+" : ""}${c.actual}`;
    const led = ledgerOf(S);
    const prior = led.slice(0, -1); // 本年条目已在 wageDue 内先行入账
    const priorPaid = prior.filter((e) => e.actual !== 0).length;
    const firstPension = c.pension > 0 && !prior.some((e) => e.pension > 0 && e.actual !== 0);
    const F = S.flags || {};
    // 来源短语池（按当年构成）
    let pool;
    if (priorPaid === 0 && c.wage > 0) pool = ["头一回年结，工钱结清了", "第一回赶上年结，工钱到手"];
    else if (priorPaid === 0 && c.pension > 0) pool = ["头一回年结，领的是养老金"];
    else if (c.pension > 0 && c.wage > 0) pool = ["工资和养老金一块结", "一边养老金，一边还有份工钱，合着结", "工钱加上养老金，一块结清"];
    else if (c.pension > 0) pool = ["养老金按年结", "这一年结的是养老金", "养老金结清，一年一回", "退下来了，年结就是养老金"];
    else if (c.wage > 0 && c.side > 0) pool = ["工资和副业一块结", "正职副业，两头的钱合着结", "工资之外副业也添了一份，一块结", "工钱加副业，一年结这一回"];
    else if (c.wage > 0 && c.phase === "part") pool = ["半退了，工钱减着结", "活干一半，工钱也结一半", "半退的工钱，按年结"];
    else if (c.wage > 0) pool = ["一年的工钱结清了", "工资结到年底，清了", "这一年的工钱，结了", "工钱按年结清"];
    else if (c.side > 0 && c.laidOff) pool = ["工资断了，靠副业结了一份", "没了工资，副业的账结了", "正份工钱没了，零碎活结了账"];
    else if (c.side > 0) pool = ["这一年靠副业结的账", "工钱没成份，副业结了一份", "没工资进项，手边活计结了账"];
    else if (c.actual < 0) pool = ["没别的进项，房贷月供照结", "这一年光房贷在往外走"];
    else pool = ["房子供完了，省下的结成一笔", "这一年结的是房子省下的"];
    // 里程碑事实（优先于轮换事实，一次只挂一条）
    let prio = null;
    if (firstPension && priorPaid > 0) prio = "头一年领养老金";
    else if (c.tenure != null && c.wage > 0 && c.tenure + 1 >= 10 && (c.tenure + 1) % 10 === 0) prio = `这一行干满 ${c.tenure + 1} 年了`;
    else if (priorPaid + 1 >= 10 && (priorPaid + 1) % 10 === 0) prio = `年结这是第 ${priorPaid + 1} 回了`;
    // 轮换事实（只收当年成立的，按固定序）
    const facts = [];
    if (c.tenure != null && c.wage > 0) facts.push(`干这一行第 ${c.tenure + 1} 年`);
    if (c.pension > 0 && typeof S.retiredAt === "number") facts.push(`退下来第 ${S.age - S.retiredAt + 1} 年`);
    facts.push(c.actual > 0 ? `手里攒到 ${S.stats.money}` : `手里还剩 ${S.stats.money}`);
    facts.push(S.stats.money >= 70 ? "手里宽裕些了" : S.stats.money >= 45 ? "手里稳当些了" : S.stats.money >= 25 ? "手里不紧不松" : "手里还是紧");
    if (c.housing < 0) facts.push("月供还扣着");
    else if (c.housing > 0 && S.houseTier !== "R") facts.push("房贷供完了");
    if (c.side > 0 && c.wage > 0 && F.side_start && !F.side_job && !F.xiahai) facts.push("副业才起头");
    // 本局已用过的年结正文（查重集）
    const used = new Set();
    for (const l of S.log || []) { const m = typeof l === "string" && l.match(/^\d+ 岁 · (工资年结[\s\S]*)$/); if (m) used.add(m[1]); }
    const combos = pool.length * (facts.length + 1);
    for (let o = 0; o < combos; o++) {
      const src = pool[(priorPaid + o) % pool.length];
      let fact = prio;
      if (!fact) {
        const fi = (priorPaid + o) % (facts.length + 1);
        fact = fi < facts.length ? facts[fi] : null;
        if (!fact && o > 0 && facts.length) fact = facts[(priorPaid + o) % facts.length];
      }
      const body = `工资年结：${src}${fact ? `，${fact}` : ""}，${amt}`;
      if (!used.has(body)) return body;
    }
    return `工资年结：${pool[priorPaid % pool.length]}，${S.age} 岁这一年，${amt}`; // 兜底：带年龄事实，同局不可能重
  }

  function wageDue() {
    const S = IFY.S;
    if (!S || !S.route || S.phase === "prologue") return;
    if (S.wageSettledAge === S.age) return; // 每年只结一次（step 重入防重）
    S.wageSettledAge = S.age;
    const F = S.flags || {};
    const phase = S.state && S.state.workPhase;

    // —— 工资（工作收入）：下岗/单位没了（noCurrentUnit）当年 0，再入行自动恢复 ——
    const entryFlag = typeof IFY.mainEntryOfState === "function" ? IFY.mainEntryOfState(S) : null;
    const tierKey = wageTierOf(S);
    const laidOff = typeof IFY.noCurrentUnit === "function" ? IFY.noCurrentUnit() : false;
    let full = 0; // 未打折档额（养老金基数口径，稿 §四.3「末年工资」）
    if (tierKey && !laidOff && phase !== "retired") {
      // 任期：有主入行旗走 tenureYears() 派生；无旗兜底走 fallbackStartAge 起算——两路都是纯派生、零随机
      const tenure = entryFlag
        ? (typeof IFY.tenureYears === "function" ? IFY.tenureYears() : 0)
        : Math.max(0, S.age - fallbackStartAge(S));
      full = tierAmount(tierKey, entryFlag, tenure);
      if (full > 0) S.wageLastNet = full; // 最近一个有活计年份的未打折档额
    }
    const rehired = phase !== "retired" && S.retiredAt != null; // 返聘：相位回 working/part 但曾全退
    let wage = 0;
    if (full > 0) wage = (phase === "part" || rehired) ? full * 0.5 : full; // 半退/返聘 ×0.5（稿 §四.1/§四.3）

    // —— 养老金：全退后按替代率年发；返聘年份与半退工资并行（稿 §四.3）——
    let pension = 0;
    if (phase === "retired" || rehired) pension = pensionOf(S);

    // —— 副业周期收入：发到全退为止（稿 §四.3）——
    let side = 0;
    if (phase !== "retired") {
      if (F.side_job || F.xiahai) side = SIDE_FULL;
      else if (F.side_start) side = SIDE_EARLY;
    }

    // —— 住房行（v0.30.0 让位 house.js）：月供/免租由 houseYearDue 按「档×地段×买入年」派生，
    // 返回的钱行折进本年总额（结转与落账仍走下面同一纪律）；通勤自由行在 houseYearDue 内经 houseCarry 自结。
    const housingLine = typeof IFY.houseYearDue === "function" ? (IFY.houseYearDue(S) || 0) : 0;

    const gross = wage + pension + side + housingLine;
    // —— 结转取整入账：应发＝当年净额＋上年余数，取整（向零）后经 applyEffects 落账 ——
    const carryIn = typeof S.wageCarry === "number" ? S.wageCarry : 0;
    const due = gross + carryIn;
    const pay = Math.trunc(due);
    S.wageCarry = due - pay;
    let actual = 0;
    if (pay !== 0) {
      const before = S.stats.money;
      IFY.applyEffects({ money: pay });
      actual = S.stats.money - before;
    }
    if (!LEDGER.has(S)) LEDGER.set(S, []);
    LEDGER.get(S).push({ age: S.age, wage, pension, side, housing: housingLine, settle: 0, gross, pay, actual });
    // fx-fix：年结标注（纯呈现，不动数值/时机）——实际落账非零时记两处既有通道：
    // ① S.wageDelta：deltaLine 拼在本年后续屏（分岔回响/事件/危机/稀有/平年）标注行的首位；
    // ② 流水账一行：瞥视年/微年这类不渲染标注行的年份靠它留痕（流水账挂在每屏旁）。
    // 数字以钳制后的实际落值 actual 为准，与 applyEffects 的标注同口径；本年无落账时
    // wageDelta 清空，跨年清理由 advance() 兜底（本年进程拍屏在结算之前呈，不许读到去年的）。
    // 流水账只记受控 Track：无头步进的影子轨 log 是瞥视引文的取材池，工资行进去会污染选取。
    S.wageDelta = actual !== 0 ? `工资 ${actual > 0 ? "+" : ""}${actual}` : "";
    if (actual !== 0) {
      const ses = IFY.session;
      const ctl = ses && ses.tracks ? ses.tracks[ses.controlTrack || "A"] : null;
      if (!ctl || ctl.state === S) {
        // 文案取材的任期与工资结算同口径（有入行旗走 tenureYears、无旗走兜底起算），纯派生
        const tenureDisp = entryFlag
          ? (typeof IFY.tenureYears === "function" ? IFY.tenureYears() : null)
          : (tierKey ? Math.max(0, S.age - fallbackStartAge(S)) : null);
        S.log.push(`${S.age} 岁 · ${wageLogLine(S, { actual, wage, pension, side, housing: housingLine, phase, laidOff, rehired, tenure: tenureDisp })}`);
      }
    }
  }

  function ledgerPush(st, entry) { if (!LEDGER.has(st)) LEDGER.set(st, []); LEDGER.get(st).push(entry); } // house.js 终局变现落账口（settle 分项）
  Object.assign(IFY, { wageDue, wageTierOf, wageFallbackTierOf: fallbackTierOf, wageFallbackStartAge: fallbackStartAge, wageLedgerOf: ledgerOf, wageLedgerPush: ledgerPush, WAGE_TIERS: TIERS });
})(window.IFY);
