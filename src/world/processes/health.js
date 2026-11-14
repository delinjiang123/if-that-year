// [模块]《如果那年》引擎分片：死亡模型（主角死亡曲线与死因）。独立模块（包装器 + window.IFY 共享命名空间），加载顺序见 index.html。
(function (IFY) {
  "use strict";
  // 死亡模型 v3（v0.19.0 按世代重标）：年龄×健康风险，参数按出生世代分表——
  // 目标带与数据出处见 docs/MORTALITY-MODEL.md「v3 世代重标」节（旧 v2 全世代同一组参数、活到 80 约 90% 就此作废）。
  const MORTALITY = { accident: 0.00015, hfNum: 115, hfDen: 55, hfLo: 0.3, hfHi: 2.2 };

  const MORTALITY_BY_ERA = {
    // v0.19.0 按世代生存曲线重标（目标带与出处见 docs/MORTALITY-MODEL.md 修订节；旧三档死亡带作废）
    c1955: { a: 0.0038, g: 1.07 },
    c1965: { a: 0.00297, g: 1.075 },
    c1978: { a: 0.0024, g: 1.075 },
    c1985: { a: 0.00222, g: 1.075 }, // v0.23 WP7 已按定版带标定（4000 局实测落带；带见 work/g2-bands.md，登记见 docs/MORTALITY-MODEL.md）；数值与外推草案原值一致，未动
    c1995: { a: 0.00200, g: 1.075 }, // v0.23 WP8 已按定版带标定（1200 局实测落带；带见 work/g2-bands.md，登记见 docs/MORTALITY-MODEL.md）；数值与外推草案原值一致，未动
    c2000: { a: 0.00189, g: 1.075 },
  };

  const DEATH_CAUSES = {
    health: [
      "身体早几年就给过信儿。那天夜里胸口闷得睡不着，送到医院时已经晚了。",
      "复查拖了又拖。最后一次倒下是在家门口，邻居帮忙叫了车，人没能再醒过来。",
      "爬楼越来越吃力。那天下午在楼梯间坐下，就没再站起来。家里人赶到时，医生已经出来了。",
      "冬天那次感冒拖成了肺炎。输液的第三天夜里，监护仪先响，人没能再睁开眼。",
      "血压的药断过几天。早上洗脸时眼前一黑，摔在卫生间，送到医院时已经没有自主呼吸。",
      "体检单上圈出的那一项，你说过节后再查。节后第一周，病床上的管子比人还多，没撑过那一晚。",
      "体检单上那几项，医生圈出来有些年头了。那天夜里胸口发闷，你还想着天亮再说，天没亮，人就过去了。",
      "那天夜里睡下去，就没再醒来。前一天还跟人下棋，输了那盘说好明天扳回来。",
      "药一天没落下，复诊的单子还贴在冰箱上。那天早上起来，眼前一黑扶住门框，没能再直起身。",
      "八十多岁那年冬天，一场咳拖了半个多月，后来烧起来送进医院，肺炎没压住。家里人守了三天。",
      "复查只查了医生圈的那一项，另两项说下回再看。下回没来——那天你在菜市场提着菜，忽然就坐到了地上。",
      "睡了一夜，早晨没能醒来。家里人进屋时，被子还掖得好好的，像平时午睡一样。",
      "那天下午在阳台上晒太阳，靠在椅子里睡了过去，就没再醒来。",
      "吃过晚饭，在藤椅上歇着，歇着歇着睡了过去，就没再醒来。",
      "清早醒过一次，翻了个身又睡回去——这一睡，就没再醒来。",
      "夜里睡下，就没再醒来。这些年身体给过的信儿，你一回没含糊——该查的查了，该盯的一直盯着。走得安安静静的，家里人说，这也算福气。",
    ],
    accident: [
      "雨天路滑，路口一辆车失控撞过来。救护车赶到时，已经晚了。",
      "夜里那趟车在高速上出了事故。同行的人活了下来，这边没能回来。",
      "河边护栏外的一块地面塌了，人掉了下去。等找到时，已经晚了。",
      "工地外边的脚手架有一截没固定好，掉下来的钢管砸在经过的人身上。救护来时，现场已经围了人。",
      "夜里厨房煤气胶管老化漏气。邻居闻到味儿砸开门时，人已经没有了气息。",
      "过马路时有人闯红灯。刹车声比喇叭更刺耳，人被撞出了人行道外。",
    ],
  };

  // 死因文本按本局事实分流（v0.20.1 W5 立过滤；死因变体片·审议单 #4 重做为逐条事实门）：
  // 只动文案选取，不动死亡率、死因类型判定与年代带。旧过滤两道只留电梯一道——
  // 「终局健康 ≥60」是「有过待复查发现」的错位代理（健康低 ≠ 有过复查单），本片起拖延
  // 两段改挂预警类事实门；其余预设型文本各挂各自的事实门，另补按信号分流的变体与
  // 零预设兜底段（约一半健康死亡一生无任何健康史信号，无兜底则门越严复读越集中）。
  // 分流只读死亡时点当前轨的量（IFY.S / hasFact / flags / crisisUsed），信号与
  // diseaseState() 的 A 档同表（代谢预警/心脑在管/住院史/健康危机/先天体弱），不新造
  // 信号；选文仍由 writeDeath 恒抽 1 次 rngW——池构成随事实变，抽法与次数不变。
  // 编号沿 death-text-check 的 H/A 口径（下标 0–5 为原六段，6 起为本片新段），
  // 门表与验收登记见 docs/MORTALITY-MODEL.md「死因变体片」节。
  const DEATH_CAUSE_IDS = {
    health: ["H1", "H2", "H3", "H4", "H5", "H6", "H1m", "H1z", "H5b", "H4e", "H2p", "N1", "N2", "N3", "N4", "H1c"],
    accident: ["A1", "A2", "A3", "A4", "A5", "A6"],
  };
  const ELEVATOR_EVENT_IDS = ["p11_027", "p16_061", "p14_052", "e55_049", "p24_023"];
  function deathSignals() {
    const S = IFY.S, F = S.flags || {};
    const has = (id) => typeof IFY.hasFact === "function" && IFY.hasFact(id);
    const metabolicWarn = !!F.retired_checkup_done || has("p15_013") || has("p21_032");
    const cardioManaged = has("p22_027");
    const hospEver = !!F.self_hosp_done || has("p25_011");
    const crisis = !!(S.crisisUsed && S.crisisUsed.health);
    const frail = !!F.hook_frail;
    // CL-154 身体报警层加读（只读账，不新造判定）：回应账全走选项立的旗——
    // 查/复查=self_check_l1/l2、改过法=self_l1_habit、调养=self_l2_rest、放着=self_l1/l2_ignored；
    // 信号呈现过没有读账本里的进程拍（proc_self_signal1/2），与 S.selfSignal 的静默标记分工：
    // 静默标记（事实自带呈现拍时落）不算「信号层响过」，拖延形的口径以玩家真见过信号拍为准。
    const sigResponded = !!F.self_check_l1 || !!F.self_check_l2 || !!F.self_l1_habit || !!F.self_l2_rest;
    const sigIgnored = !!F.self_l1_ignored || !!F.self_l2_ignored;
    const sigProcShown = (S.ledger || []).some((e) => e && e.kind === "proc" && (e.id === "proc_self_signal1" || e.id === "proc_self_signal2"));
    return {
      metabolicWarn, cardioManaged, hospEver, crisis, frail,
      sigResponded, sigIgnored, sigProcShown,
      strict: metabolicWarn || cardioManaged || hospEver || crisis || frail, // 严格口径（与 diseaseState 同组）
      warnFacts: metabolicWarn || has("p26_015") || !!F.recheck_partial || !!F.recheck_full, // 预警类发现（H2/H6 门）
      medsGate: cardioManaged || !!F.meds_checked, // 用药在管（H5 族门：降压药日常 ∨ 用药记录经复查整理）
      recheckPartial: !!F.recheck_partial,
      finalHealth: S.stats ? (S.stats.health || 0) : 0,
      age: S.age || 0,
      elevator: ELEVATOR_EVENT_IDS.some((id) => has(id)),
      familyAlive: typeof IFY.anyFamilyAlive === "function" && IFY.anyFamilyAlive(S),
    };
  }
  // health 池门表（下标与 DEATH_CAUSES.health / DEATH_CAUSE_IDS.health 对位）：
  //   0 H1 信儿：住院史/危机/体弱/心脑在管任一（夜里急症送医的局）；仅代谢预警者走 6 号
  //   1 H2 拖延复查 / 5 H6 体检拖延：预警类事实在账，且没回应过信号——CL-154 起加读报警层
  //     回应账：回应过的局（查了/改了过法/调养）不再走拖延形；拖延形只给「选过放着」或
  //     「信号层从没响过（账本无进程信号拍）」的局。影子轨无回应概念：响过标记即不再走拖延形
  //   15 H1c 在管安详（CL-154 新增，追加在池末不挪既有下标）：回应过信号（查/改过法/调养任一）
  //   2 H3 楼梯：未装电梯（旧门 (a) 保留；文本本身与其家人预设本片不动，归家族事实族辖区）
  //   3 H4 肺炎：体弱/住院史/危机/终局健康 <60 任一。高龄单独不作门：验收硬线格
  //     （终局健康 ≥75 且无体弱/住院/危机）里实测年龄跨 66–90 岁（盘点 17+19 例），
  //     「年龄 ≥78 放行」与该格 H4 必须为 0 不能两立，从硬线；高龄肺炎由 9 号承接
  //   4 H5 血压药 / 8 H5b 未断药变体：用药在管（两段差别在断没断药，账上分不出，同门并列降复读）
  //   6 H1m 代谢变体：仅代谢预警（无住院/危机/体弱/心脑在管）——回指账上那张体检单
  //   7 H1z 零预设：无任何严格信号者专用（不提信儿、不提病史）
  //   9 H4e 高龄肺炎：年龄 ≥80（文本明写「八十多岁」）且家里有人（「家里人守了三天」）
  //   10 H2p 部分跟进：recheck_partial 在账（只复查了一项，其余仍拖着）
  //   11 N1 安详·有人：家里还有人（「家里人进屋」预设，挂判词批 D 的 anyFamilyAlive）
  //   12 N2 / 13 N3 / 14 N4 安详·通用：零预设，按年龄软分流（N2 <80 岁、N3/N4 ≥80 岁；
  //     文面不写年龄，软分流只为把通用段摊开降复读——初版 N2 一段占全池两成实测后立）
  function deathHealthOk(idx, sig) {
    switch (idx) {
      case 0: return sig.hospEver || sig.crisis || sig.frail || sig.cardioManaged;
      case 1: case 5: return sig.warnFacts && !sig.sigResponded && (sig.sigIgnored || !sig.sigProcShown);
      case 2: return !sig.elevator;
      case 3: return sig.frail || sig.hospEver || sig.crisis || sig.finalHealth < 60;
      case 4: case 8: return sig.medsGate;
      case 6: return sig.metabolicWarn && !sig.hospEver && !sig.crisis && !sig.frail && !sig.cardioManaged;
      case 7: return !sig.strict;
      case 9: return sig.age >= 80 && sig.familyAlive;
      case 10: return sig.recheckPartial;
      case 11: return sig.familyAlive;
      case 12: return sig.age < 80;
      case 13: case 14: return sig.age >= 80;
      case 15: return sig.sigResponded;
      default: return true;
    }
  }
  function deathCausePool(type) {
    const all = DEATH_CAUSES[type];
    if (type !== "health") return all.slice();
    const sig = deathSignals();
    return all.filter((_, i) => deathHealthOk(i, sig));
  }

  // ---------- 死亡机制 v4（v0.32.0 片 C：废 80 顶、四通道、疾病负担、保险丝 110） ----------
  // 设计与标定出处：docs/MORTALITY-MODEL.md v0.32.0 节＋ death-c-build/REPORT.md。
  // 通道与掷序写死：④意外基线 → 跌倒附加 → ②急性发作 → ①慢性累积；每年恒抽 4 骰
  // （顺序与次数不随年龄/状态漂移——下游随机流不因疾病状态增减而整批换账，设计稿 §4.5）。
  // 疾病状态暂由既有事实派生（片 B 的专属疾病旗未落，本片先读 A 档信号：住院旗与其落点
  // 年龄、健康危机、退休体检旗、先天体弱旗，及血糖临界/指标被圈/降压药日常/住院手术四个
  // 已呈现拍子的发生事实；片 B 落旗后只换 diseaseState() 的取数，不动公式）。
  const DEATH_CAL = {
    accSeg: [[30, 0.0004], [60, 0.0005], [75, 0.0008]], // 意外年龄分段基线（30 岁前为 0）
    accCarMul: 1.5,          // 有过车 → 交通暴露小抬
    accJobMul: 1.75,         // 高暴露职业且在职（working/part）→ 抬
    fallAge: 75, fallP: 0.00075, // 跌倒附加：75+ 且有住院史或先天体弱才掷；死法走健康池（含楼梯段）
    acuteCtrl: 0.0035,       // 急性发作·受控代理（心脑在管：有药有复诊）：0.35%/年
    acuteUnctrl: 0.012,      // 急性发作·未受控代理：1.2%/年（设计稿区间 0.8–1.5%）
    dfCap: 2.2,              // 疾病负担总乘数上限（与 hf 上限对齐）
    g2: 1.16, g2From: 82,    // 82 岁后慢性线斜率升档（保险丝标定杠杆 a；标定见 REPORT）
    driftFrom: 80, driftPerYear: 1, // 80 岁后每年健康 −1（保险丝标定杠杆 b：让高健康者的 hf 随高龄自然抬升；量级受子孙满堂等终局健康门约束，标定见 REPORT）
    eraMul: { c1955: 0.88, c1965: 0.98, c1978: 0.95, c1995: 0.88, c2000: 0.93 }, // df/急性接入后对年代 a 的重标（缺省 1.0；两轮标定定版，见 REPORT）
  };
  function eraMulOf(era) { const m = DEATH_CAL.eraMul; return typeof m === "object" ? (m[era] != null ? m[era] : 1) : m; }
  const CAR_FLAGS = ["car_bought", "bought_car", "e78_car"]; // 与 place.js 同口径：语义「有过车」
  const EXPOSED_JOBS = ["truck_work", "courier_work", "miner_work", "heavy_work"];

  function flagAgeOf(name) {
    const fa = IFY.S.flagAges;
    return fa && typeof fa[name] === "number" ? fa[name] : null;
  }

  // 疾病派生（判定表，登记在案）：df 乘慢性线；急性线仅在有疾病信号时激活。
  // 信号全部取自今日可读事实（片 B 专属疾病旗未落，先行代理，判定表写死在此）：
  //   代谢预警 = 退休体检旗（血脂血糖在边上）∨ 血糖临界拍 p15_013 ∨ 指标被圈拍 p21_032
  //   心脑在管 = 降压药日常拍 p22_027（每天吃药＋复诊贴冰箱：有药有复诊）
  //   住院史   = 住院旗 self_hosp_done ∨ 住院手术拍 p25_011；大病后窗口只认旗的落点年龄
  //   健康危机 = crisisUsed.health；先天体弱 = hook_frail
  // 「受控」代理 = 心脑在管（有药有复诊的日常管理在身）；其余激活情形按未受控档。
  function diseaseState() {
    const S = IFY.S, F = S.flags || {}, age = S.age;
    const has = (id) => typeof IFY.hasFact === "function" && IFY.hasFact(id);
    const hospEver = !!F.self_hosp_done || has("p25_011");
    const hospAge = F.self_hosp_done ? flagAgeOf("self_hosp_done") : null;
    const crisis = !!(S.crisisUsed && S.crisisUsed.health);
    const metabolicWarn = !!F.retired_checkup_done || has("p15_013") || has("p21_032");
    const cardioManaged = has("p22_027");
    const postWindow = hospAge != null && age - hospAge <= 3; // 大病后 3 年窗口
    let df = 1;
    if (F.hook_frail) df *= 1.15;          // 先天体弱：底子薄
    if (metabolicWarn) df *= 1.20;         // 代谢预警在身
    if (cardioManaged) df *= 1.20;         // 心脑线在管（在管也带负担，设计稿 1.15–1.3 档）
    if (crisis) df *= 1.20;                // 健康危机发过
    if (postWindow) df *= 1.40;            // 大病后窗口内（替代住院史常态档）
    else if (hospEver) df *= 1.15;         // 住院/手术史（窗口外）
    df = Math.min(df, DEATH_CAL.dfCap);
    const acuteActive = hospEver || crisis || metabolicWarn || cardioManaged;
    const acuteP = !acuteActive ? 0 : (cardioManaged ? DEATH_CAL.acuteCtrl : DEATH_CAL.acuteUnctrl);
    const fallRisk = age >= DEATH_CAL.fallAge && (hospEver || !!F.hook_frail);
    return { df, acuteP, fallRisk };
  }

  function accidentP() {
    const S = IFY.S, age = S.age;
    let base = 0;
    for (const [from, p] of DEATH_CAL.accSeg) if (age >= from) base = p;
    if (!base) return 0;
    const F = S.flags || {};
    if (CAR_FLAGS.some((f) => F[f])) base *= DEATH_CAL.accCarMul;
    const wp = S.state && S.state.workPhase;
    if ((wp === "working" || wp === "part") && EXPOSED_JOBS.some((f) => F[f])) base *= DEATH_CAL.accJobMul;
    return base;
  }

  function writeDeath(type, fuse) {
    const pool = deathCausePool(type);
    const text = pool[Math.floor(IFY.rngW() * pool.length)];
    IFY.S.death = { age: IFY.S.age, type, text };
    if (fuse) IFY.S.death.fuse = true; // 内部标定字段：玩家侧呈现与自然终局无区别，文案永不读它
    IFY.rec("death", type);
    IFY.S.log.push(`${IFY.S.age} 岁 · 这一生停在这里：${text}`);
    return true;
  }

  function rollDeath() {
    const S = IFY.S, age = S.age;
    // 80 岁后健康漂移：本函数是两条轨唯一的死亡入口，在此落账保证两轨同点同规。
    if (age > DEATH_CAL.driftFrom) S.stats.health = Math.max(0, S.stats.health - DEATH_CAL.driftPerYear);
    const ds = diseaseState();
    const rAcc = IFY.rngW(), rFall = IFY.rngW(), rAcute = IFY.rngW(), rChron = IFY.rngW(); // 恒 4 骰，序固定
    let type = null;
    if (rAcc < accidentP()) type = "accident";                                     // ④ 意外基线
    else if (ds.fallRisk && rFall < DEATH_CAL.fallP) type = "health";              // 跌倒附加（文本走健康池）
    else if (age >= 40 && rAcute < ds.acuteP) type = "health";                     // ② 急性发作（仅疾病线激活）
    else if (age >= 40) {                                                          // ① 慢性累积 × 疾病负担
      const mp = MORTALITY_BY_ERA[S.era] || MORTALITY_BY_ERA.c2000;
      const hf = Math.max(MORTALITY.hfLo, Math.min(MORTALITY.hfHi, (MORTALITY.hfNum - S.stats.health) / MORTALITY.hfDen));
      const bend = Math.min(age, DEATH_CAL.g2From);
      let lam = mp.a * eraMulOf(S.era) * Math.pow(mp.g, bend - 40) * hf * ds.df;
      if (age > DEATH_CAL.g2From) lam *= Math.pow(DEATH_CAL.g2, age - DEATH_CAL.g2From);
      if (rChron < lam) type = "health";
    }
    if (!type) return false;
    return writeDeath(type, false);
  }

  // 保险丝：活到 MAX_AGE(110) 仍未掷中死亡 → 强制终局。呈现与自然死亡完全一致
  // （正常死亡屏＋死法文本＋正常结算），玩家侧不存在「到顶局」这个概念。
  function forceFuseDeath() {
    if (IFY.S.death) return false;
    return writeDeath("health", true);
  }
  Object.assign(IFY, { MORTALITY, MORTALITY_BY_ERA, DEATH_CAUSES, DEATH_CAUSE_IDS, rollDeath, deathCausePool, DEATH_CAL, diseaseState, forceFuseDeath, eraMulOf, deathSignals });
})(window.IFY);
