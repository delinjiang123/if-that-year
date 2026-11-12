// [模块]《如果那年》引擎分片：居所/出国去向进程。独立模块（包装器 + window.IFY 共享命名空间），加载顺序见 index.html。
(function (IFY) {
  "use strict";
  // ---------- 出国去向（v0.19.0）：abroadKind 国家原型 ----------
  // 原型只是一组属性（离家距离/定居可能/语言墙/回国成本，表见内核稿 §3.4 与 registry 的 abroadKind 域），正文永远不写具体国名。
  // 入口拍 proc_abroad_kind（pack37）在 22–26 岁由进程呈现落值；窗口过了还没落值（含旧存档续玩）在这里按进程流（#world）推断补值，
  // 走的仍是注册表已声明的 unset→* 边（经 applyState），不会出现 abroadKind 为空、新包永不命中的局。
  const ABROAD_KIND_W = [["anglo", 0.34], ["eastasia", 0.61], ["europe", 0.83], ["dispatch", 1.01]]; // 推断权重（累计）：移民国 > 近邻 > 福利型 > 派遣

  function inferAbroadKind() {
    if (IFY.S.era === "c1955" || IFY.S.era === "c1965") return "dispatch"; // v0.23 WP6（S-6D）：这两代唯一的 abroadKind 形是 dispatch（定居形条目已被 eraIn 挡在两代之外）；提前 return 不消费 rngW，属设计内变化
    const r = IFY.rngW(); for (const [k, w] of ABROAD_KIND_W) if (r < w) return k; return "dispatch";
  }

  function settleAbroadDefault() {
    if (!IFY.S.route || IFY.S.route.id !== "abroad" || !IFY.S.state || IFY.S.state.abroadKind !== "unset" || IFY.S.age < 27) return;
    IFY.applyState({ setState: { abroadKind: inferAbroadKind() } });
    IFY.rec("proc", "abroad_kind_default", { set: IFY.S.state.abroadKind });
  }

  function abroadKindDue() {
    if (!IFY.S.route || IFY.S.route.id !== "abroad" || !IFY.S.state || IFY.S.state.abroadKind !== "unset") return null;
    if (IFY.S.age < 22 || IFY.S.age > 26) return null;
    return IFY.D.events.some((e) => e.id === "proc_abroad_kind") ? { item: "proc_abroad_kind" } : null;
  }

  // 居所轨迹（v0.18.0，审计急修 B7）：读账本里的路线起点与迁徙记录，数出各居所住过的年数与终点；
  // 结算标签与「终老在异国」类句子据此写。旧存档无账本时轨迹为空，按路线回落（起点即终点）。
  // v0.22.1 F4：通用化为 residenceTrailOf(state, fromAge, toAge)——对任意 Track 的账本在年龄窗内算轨迹：
  // 窗前的迁徙只定进窗时的所在地（承接），不计年数；窗后的迁徙不读（那一段不归本段）。residenceTrail()
  // 委托它跑全程窗口，与原实现逐项等价。「回老家住一阵之后回城」这条迁徙事实：v0.24.4 起由 p11_041
  // 落旗 back_to_city 驱动（轨迹只读旗）；旧存档没有这面旗，兼容读账本里的 p11_041 事件条目，保留一个
  // 版本周期。回城的目标地按本轨路线：出国线的人回的是他定居的国外，记 abroad 不记 city。
  function residenceTrailOf(st, fromAge, toAge) {
    const spans = { home: 0, city: 0, abroad: 0 };
    let place = null, since = IFY.START_AGE;
    const endFull = st && st.death ? st.death.age : (st && typeof st.age === "number" ? st.age : IFY.MAX_AGE);
    const endA = Math.min(typeof toAge === "number" ? toAge : endFull, endFull);
    const fromA = typeof fromAge === "number" ? fromAge : IFY.START_AGE;
    const addSpan = (p, a, b) => { const lo = Math.max(a, fromA), hi = Math.min(b, endA); if (hi > lo) spans[p] += hi - lo; };
    const move = (age, p) => { if (place && p !== place) { addSpan(place, since, age); place = p; since = age; } else if (!place) { place = p; since = age; } };
    const led = st && Array.isArray(st.ledger) ? st.ledger : [];
    for (const e of led) {
      if (typeof e.age === "number" && e.age > endA) continue;
      if (e.kind === "route") move(e.age, e.id === "abroad" ? "abroad" : (e.id === "home" || e.id === "gap" || e.id === "farm") ? "home" : "city"); // farm（农民路线）：村里记在 home 段（轨迹只有家乡/城市/国外三段，村庄属家乡）
      else if (e.set === "back_home_stay" || e.set === "near_family") move(e.age, "home");
      // 出国线的人 stayed_city（fork28「不回，把现在的城市过成家」）与 moved_city 说的都是在国外
      // 当地落脚/换城，不是回国进城——路线盲读成 city 会把定居国外的人整段读没（侦察 B78-04 实锤：
      // 28 岁一落 stayed_city，轨迹终点翻成 city，结算与距离派生跟着全错）。回国另有 back_home_stay/
      // near_family 两个落点，不经此处。
      else if (e.set === "moved_city" || e.set === "stayed_city") move(e.age, st && st.route && st.route.id === "abroad" ? "abroad" : "city");
      else if (e.set === "farm_left") move(e.age, "city"); // 农民路线退出层（fork28f 全家进城）：此后按城市记账
      else if (e.set === "back_to_city" || (e.kind === "event" && e.id === "p11_041")) move(e.age, st && st.route && st.route.id === "abroad" ? "abroad" : "city");
    }
    if (!place) place = !st || !st.route ? "home" : st.route.id === "abroad" ? "abroad" : (st.route.id === "home" || st.route.id === "gap" || st.route.id === "farm") ? "home" : "city";
    addSpan(place, since, endA);
    return { final: place, spans };
  }
  function residenceTrail() {
    return residenceTrailOf(IFY.S, IFY.START_AGE, IFY.finalAge());
  }

  // ===== 生活事实派生层（v0.24.4，AN-2 四段流水线③段 B2）=====
  // 住房／车辆／定居／与父母距离四类事实此前没有状态域，只散落在只增不减的里程碑旗里，
  // 「买过房」与「现在有房」被压成同一批布尔，结算、瞥视、事件池各读各的子集。照 formOf 的先例：
  // 派生是纯函数（只读传入 state 的旗/立旗年龄/账本/路线），不进存档、随用随算；旧旗只作存储层，
  // 一律不删不改名不清零。门（ctx.house/car/settle）与呈现（结算四处、瞥视三行）只许读派生，不许再读旗子集。

  // 住房派生。购房旗全集写死在这里一处：bought_house（通用买房）/boughtReform（房改买断，含只走到
  // bought_fangai 的半截链——e65_064 没被抽到也算买下了）/bought_commodity（商品房）/jizi_house（集资建房）。
  // unitHousing（单位分房）单记：是「有家可住」不是「买下了房」，结算措辞必须分开（现行 s3 优先序想表达的正是这个）。
  // owned 的形态取最早一次购房（按 flagAges 比立旗年龄；旧档无 flagAges 时按固定优先序回落）。
  // rentingNow = 租住旗在身且当前不是自有、也不是单位房——租与买互斥在这里收口，旧旗本身不动。
  // 例外一条：c1955 的 fork33 年代框选项「先不买，公房先住着」落的是 renting 旗，但那是公房不是私租
  // （房租从工资里扣）——账本里 fork33 落 renting 的 c1955 局按单位房读（unitLike），免得房东收房类条目打到公房住户头上。
  const HOUSE_BUY_FLAGS = [
    { f: "bought_house", form: "own" },
    { f: "boughtReform", form: "reform" },
    { f: "bought_fangai", form: "reform" },
    { f: "bought_commodity", form: "commodity" },
    { f: "jizi_house", form: "own" },
    { f: "selfbuilt_house", form: "selfbuilt" }, // 农民路线自建房（fork33f）：宅基地上的自家房——读作「有房可住」，但不进 house.js 购房旗全集（无档、无月供、终局不变现，土地不进资产账）
  ];
  function housingOf(st) {
    const F = (st && st.flags) || {};
    const ages = (st && st.flagAges) || {};
    let best = null; // {form, age|null}：最早购房优先；年龄缺失（旧档）时按 HOUSE_BUY_FLAGS 顺序取先到者
    for (const { f, form } of HOUSE_BUY_FLAGS) {
      if (!F[f]) continue;
      const a = typeof ages[f] === "number" ? ages[f] : null;
      if (!best || (a !== null && (best.age === null || a < best.age))) best = { form, age: a };
    }
    const owned = best ? best.form : null;
    const unit = !!F.unitHousing;
    let public55 = false;
    if (!owned && !unit && F.renting && st && st.era === "c1955" && Array.isArray(st.ledger)) {
      public55 = st.ledger.some((e) => e && e.kind === "fork" && e.id === "fork33" && e.set === "renting");
    }
    const unitLike = unit || public55;
    return {
      owned,                                    // null | "own" | "reform" | "commodity"（已购形态，按最早一次购房）
      form: owned,                              // 同 owned（形态别名，读点按语义取用）
      sinceAge: best ? best.age : null,         // 最早购房的立旗年龄；旧档无年龄时 null
      unit,                                     // 单位分房旗在身
      unitLike,                                 // 单位房口径（含 c1955 公房纠偏）
      rentingEver: !!F.renting,
      rentingNow: !!F.renting && !owned && !unitLike, // 当前确实在私租
    };
  }

  // 车辆派生。三面旗跨年代同义（car_bought 通用／bought_car c1965／e78_car c1978），语义都是「曾经有过车」；
  // 「现在还有车」= ever 且没卖过。卖车事实落在 p12_049 的条目级 set car_sold（新旗，注册表登记）；
  // 旧存档没有这面旗，now 回落为 ever（卖过车的老玩家在再卖一次之前仍按有车读——一次性偏差，版本说明登记）。
  const CAR_FLAGS = ["car_bought", "bought_car", "e78_car"];
  function carOf(st) {
    const F = (st && st.flags) || {};
    const ever = CAR_FLAGS.some((f) => F[f]);
    const sold = !!F.car_sold;
    return { ever, sold, now: ever && !sold };
  }

  // 定居派生：residenceTrailOf 是全游戏唯一的轨迹实现，这里只做收口（补起点地与在外年数两个读点常用量）。
  // 瞥视的 residenceOf 手抄副本已删，两边都读这一处。
  function settledOf(st, age) {
    const endA = typeof age === "number" ? age : (st && st.death ? st.death.age : (st && typeof st.age === "number" ? st.age : IFY.MAX_AGE));
    const t = residenceTrailOf(st, IFY.START_AGE, endA);
    const start = !st || !st.route ? "home" : st.route.id === "abroad" ? "abroad" : (st.route.id === "home" || st.route.id === "gap" || st.route.id === "farm") ? "home" : "city";
    return { final: t.final, spans: t.spans, start, awayYears: t.spans.city + t.spans.abroad, abroadYears: t.spans.abroad };
  }

  // 与父母距离派生：只有三档可判定——near（当前定居老家，父母在老家是全游戏的隐含前提）、
  // far（出国路线且轨迹终点仍在国外）、unknown（其余一律不拦不换词）。不假装算公里数。
  function distToParentsOf(st) {
    if (!st || !st.route) return "unknown";
    const so = settledOf(st);
    if (st.route.id === "abroad" && so.final === "abroad") return "far";
    if (so.final === "home") return "near";
    return "unknown";
  }

  Object.assign(IFY, { ABROAD_KIND_W, inferAbroadKind, settleAbroadDefault, abroadKindDue, residenceTrail, residenceTrailOf, housingOf, carOf, settledOf, distToParentsOf });
})(window.IFY);
