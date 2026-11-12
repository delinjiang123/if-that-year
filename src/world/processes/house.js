"use strict";
/* if-that-year · 住房进程（v0.30.0 住房线 MVP，规格 docs 外设计稿 housing-design/DESIGN.md）
 *
 * 住房不再是一次性的静态扣款，而是一本派生账：买入那一刻定档定地段（captureHouse 捕获），
 * 此后年度行（月供/免租/通勤）与终局变现全部由「档 × 地段 × 买入公历年」闭式派生，
 * 不存资产现值、不吃随机。涨幅只进资产账，现值不进可支配金钱——钱门事件与结局仍只读
 * 流动金钱；资产只在 Track 定案（finalize）时变现落账一次（houseSettleDue）。
 *
 * 纪律（仿 wage.js）：本模块的函数只读传入的 state（+ 同 state 的派生 IFY.housingOf /
 * IFY.wageTierOf / IFY.formOf），不读另一 Track 的状态、不碰 UI；年度钱行返回金额交由
 * wageDue 折进当年工资结算（统一结转、统一落账、统一进工资账本）；年度自由行走自己的
 * houseCarry 整数结转（仿 wageCarry）。新状态字段 houseTier/houseLoc/houseSettled/
 * houseCarry 不进 state.js 注册表：freshState 给初值、loadSave 走 backfillHouse 回填。
 *
 * 泄压阀（设计稿 §9 纪律，普查闸 ③⑦ 破线时才逐级动，本文件内三个常数即阀位）：
 *   阀1 MULT_CAP（涨幅倍数钳，R 档 MULT_CAP_R 不动）；阀2 SETTLE_CAP（变现钳）；
 *   阀3 COMMODITY_DISCOUNT（商品变现折价，房改 0.6 不动）。当前阀位：全部未动（2.0/30/0.8）。
 */
(function (IFY) {
  // —— §3.2 定价表：档 × 地段（asset0 = 首付 + 月供×20，与表内一致，由两项相加派生）——
  const PRICE = {
    A: { city: { down: 13, monthly: 0.62, rentFree: 0.50 }, suburb: { down: 9, monthly: 0.44, rentFree: 0.34 } },
    B: { city: { down: 10, monthly: 0.50, rentFree: 0.40 }, suburb: { down: 7, monthly: 0.36, rentFree: 0.28 } },
    C: { city: { down: 8, monthly: 0.40, rentFree: 0.30 }, suburb: { down: 5, monthly: 0.26, rentFree: 0.20 } },
    D: { city: { down: 6, monthly: 0.30, rentFree: 0.22 }, suburb: { down: 4, monthly: 0.18, rentFree: 0.14 } },
  };
  // —— §3.3 房改档 R：定额账（捕获扣款 −3、asset0 固定 5.0、无月供、次年起 +0.15/年）——
  const R_DOWN = 3, R_ASSET0 = 5.0, R_RENTFREE = 0.15;
  // —— §3.4 买入价系数（按买入公历年，只乘首付/月供/asset0，不乘免租）——
  function priceCoef(year) {
    if (year <= 1997) return 0.45;
    if (year <= 2003) return 0.50;
    if (year <= 2008) return 0.65;
    if (year <= 2015) return 0.85;
    if (year <= 2020) return 1.00;
    if (year === 2021) return 1.10;
    if (year <= 2024) return 0.95;
    return 0.85;
  }
  // —— §4.1/§4.2 涨幅：分段年率 × 地段系数 × 档位系数 ——
  // 2031 起 +0.5%/年：用户 2026-11-06 裁定（「30 年之后像日本一样，缓慢上升」），非稿内旧 0%。
  function segRate(year) {
    if (year < 1998) return 0;
    if (year <= 2003) return 0.05;
    if (year <= 2008) return 0.08;
    if (year <= 2015) return 0.09;
    if (year <= 2020) return 0.06;
    if (year === 2021) return 0.02;
    if (year <= 2024) return -0.06;
    if (year <= 2030) return -0.01;
    return 0.005;
  }
  const TIER_COEF = { A: 1.05, B: 1.00, C: 1.00, D: 0.90, R: 1.15 };
  const MULT_CAP = 2.0, MULT_CAP_R = 3.0, MULT_FLOOR = 0.55;   // 阀1 = MULT_CAP
  const SETTLE_CAP = 30;                                        // 阀2
  const COMMODITY_DISCOUNT = 0.8, REFORM_DISCOUNT = 0.6;        // 阀3 = COMMODITY_DISCOUNT
  const MORTGAGE_YEARS = 20;

  const BUY_FLAGS = ["bought_house", "boughtReform", "bought_fangai", "bought_commodity", "jizi_house"];

  // ——— 派生读取 ———
  function buyAgeOf(st) {
    const h = typeof IFY.housingOf === "function" ? IFY.housingOf(st) : null;
    return (h && typeof h.sinceAge === "number") ? h.sinceAge : 33; // §8.3：无落旗年龄时按 33 岁购房回填
  }
  function locCoefOf(st) {
    if (st.houseTier === "R") return 1.15;                        // §4.2：R 档地段恒按市区
    const homeRoute = !!(st.route && st.route.id === "home");     // 回家路线地段语义是县城中心/乡镇
    return st.houseLoc === "suburb" ? (homeRoute ? 0.50 : 0.75) : (homeRoute ? 0.85 : 1.15);
  }
  function assetBaseOf(st) {
    if (!st.houseTier) return 0;
    if (st.houseTier === "R") return R_ASSET0;
    const p = PRICE[st.houseTier][st.houseLoc === "suburb" ? "suburb" : "city"];
    return (p.down + p.monthly * MORTGAGE_YEARS) * priceCoef(st.birthYear + buyAgeOf(st));
  }
  function downPaidOf(st) { // §4.3 未偿本金口径里的「首付实付」= 表首付 × 买入价系数（价格侧全额，内容侧定金不抵本金）
    if (!st.houseTier) return 0;
    if (st.houseTier === "R") return R_DOWN;
    const p = PRICE[st.houseTier][st.houseLoc === "suburb" ? "suburb" : "city"];
    return p.down * priceCoef(st.birthYear + buyAgeOf(st));
  }
  // §4.2 闭式派生：现值 = asset0 × Π(1 + 分段率 × 地段系数 × 档位系数)，年取买入次年..atYear，倍数钳/地板在此收口
  function houseAssetValue(st, atYear) {
    if (!st || !st.houseTier) return 0;
    const base = assetBaseOf(st);
    if (!(base > 0)) return 0;
    const buyYear = st.birthYear + buyAgeOf(st);
    const lc = locCoefOf(st), tc = TIER_COEF[st.houseTier] || 1;
    let m = 1;
    for (let y = buyYear + 1; y <= atYear; y++) m *= 1 + segRate(y) * lc * tc;
    const cap = st.houseTier === "R" ? MULT_CAP_R : MULT_CAP;
    m = Math.max(MULT_FLOOR, Math.min(cap, m));
    return base * m;
  }
  function houseMultipleOf(st, atYear) {
    if (!st || !st.houseTier) return null;
    const base = assetBaseOf(st);
    return base > 0 ? houseAssetValue(st, atYear) / base : null;
  }

  // ——— 住房账本（普查对账读口：down/year/settle 三类分开）———
  const HLEDGER = new WeakMap();
  function houseLedgerOf(st) {
    if (!HLEDGER.has(st)) HLEDGER.set(st, []);
    return HLEDGER.get(st);
  }

  // ——— 捕获：购房落旗跃迁时调一次（钩子见 houseOnBuyFlag）。档位 = 购房当刻 wageTierOf。———
  function captureHouse(st, hint) {
    if (!st || st.houseTier) return false; // §5.2：只认第一套，再购房不改账
    const h = (hint && typeof hint === "object") ? hint : { loc: hint };
    let tier;
    if (h.channel === "reform" || h.flag === "bought_fangai" || h.flag === "boughtReform") tier = "R";
    else if (h.flag === "jizi_house") tier = "C"; // §9.7：集资房记 C 档
    else {
      const wt = typeof IFY.wageTierOf === "function" ? IFY.wageTierOf(st) : null;
      tier = wt === "X" ? "A" : (wt || "C");  // §3.1：X 档按 A 定价；档不可判读时回落 C
    }
    st.houseTier = tier;
    st.houseLoc = h.loc === "suburb" || (h && h.src && h.src.houseLoc === "suburb") ? "suburb" : "city";
    if (typeof st.houseSettled !== "boolean") st.houseSettled = false;
    if (typeof st.houseCarry !== "number") st.houseCarry = 0;
    // 首付：max(0, 表首付 × 买入价系数 − 内容侧该拍已付)；R 档定额 −3（价系数不乘，§3.3）
    const paid = Math.max(0, (typeof h.paid === "number" ? h.paid : 0));
    let price;
    if (tier === "R") price = R_DOWN;
    else { const p = PRICE[tier][st.houseLoc]; price = p.down * priceCoef(st.birthYear + st.age); }
    const owed = Math.max(0, price - paid);
    let charged = 0, frac = 0;
    if (owed > 0) {
      charged = Math.floor(owed + 1e-9);
      frac = +(owed - charged).toFixed(6);
      if (charged > 0) {
        // 与内容效果同一入账通道（applyEffects）：购房那一拍的数值变动里看得见；
        // 增量行追加而非覆盖——前一拍（内容效果）的 deltaLine 保留。
        const before = st.stats.money;
        if (IFY.S === st && typeof IFY.applyEffects === "function") {
          const prevDelta = IFY.S.lastDelta || "";
          IFY.applyEffects({ money: -charged });
          if (prevDelta) IFY.S.lastDelta = prevDelta + (IFY.S.lastDelta ? " · " + IFY.S.lastDelta : "");
        } else st.stats.money = Math.max(0, Math.min(100, before - charged));
        charged = before - st.stats.money;
      }
      // 小数部分走工资结转吸收：下一工资年结算时从工资净额里扣回（保 §4.4 全精度，不四舍五入丢数）
      if (frac > 0) st.wageCarry = (typeof st.wageCarry === "number" ? st.wageCarry : 0) - frac;
    }
    houseLedgerOf(st).push({ type: "down", age: st.age, tier, loc: st.houseLoc, price, paid, charged, frac });
    return true;
  }

  // 落旗钩子：全树「落购房旗」写入点统一调本函数。srcObj = 落旗的选项/条目数据
  //（paid 自其静态 effects.money 读；houseLoc/houseChannel 标记自其字段读）。
  function houseOnBuyFlag(st, flag, srcObj) {
    if (!st || st.houseTier || !flag || BUY_FLAGS.indexOf(flag) < 0) return;
    const F = st.flags || {};
    for (const f of BUY_FLAGS) if (f !== flag && F[f]) return; // 已有更早的购房旗 → 非首次跃迁
    const paid = srcObj && srcObj.effects && typeof srcObj.effects.money === "number" && srcObj.effects.money < 0 ? -srcObj.effects.money : 0;
    captureHouse(st, { flag, paid, loc: srcObj && srcObj.houseLoc, channel: srcObj && srcObj.houseChannel, src: srcObj });
  }

  // ——— 年度行（wageDue 调用）：返回当年住房钱行金额（月供为负/免租为正），折进工资结算；
  //     通勤/便利走自由面、经 houseCarry 整数结转，本函数内直接落自由（仿 wageCarry 纪律）。———
  function houseYearDue(st) {
    if (!st || !st.houseTier) return 0;
    const h = typeof IFY.housingOf === "function" ? IFY.housingOf(st) : null;
    if (!h || !h.owned) return 0;
    const buyAge = buyAgeOf(st);
    const yrs = st.age - buyAge; // 购房后第几年（购房当年 wageDue 先于落旗跑，yrs≥1 才真正进账）
    let money = 0;
    if (st.houseTier === "R") { if (yrs >= 1) money = R_RENTFREE; }
    else {
      const p = PRICE[st.houseTier][st.houseLoc === "suburb" ? "suburb" : "city"];
      if (yrs >= 1 && yrs <= MORTGAGE_YEARS) money = -(p.monthly * priceCoef(st.birthYear + buyAge));
      else if (yrs > MORTGAGE_YEARS) money = p.rentFree;
    }
    // §5.1 通勤/便利：持房、在职或半退、业态非务农；完全退休后停（workPhase 判读）
    let freedomRaw = 0;
    const phase = st.state && st.state.workPhase;
    if (phase === "working" || phase === "part") {
      const form = typeof IFY.formOf === "function" ? IFY.formOf(st) : null;
      if (form !== "farm") freedomRaw = st.houseLoc === "suburb" ? -0.12 : 0.06;
    }
    if (freedomRaw !== 0) {
      const due = freedomRaw + (typeof st.houseCarry === "number" ? st.houseCarry : 0);
      const payF = Math.trunc(due);
      st.houseCarry = +(due - payF).toFixed(6);
      if (payF !== 0) {
        if (IFY.S === st && typeof IFY.applyEffects === "function") IFY.applyEffects({ freedom: payF });
        else st.stats.freedom = Math.max(0, Math.min(100, st.stats.freedom + payF));
      }
    }
    houseLedgerOf(st).push({ type: "year", age: st.age, money, freedom: freedomRaw });
    return money;
  }

  // ——— 终局变现（§4.3）：Track 定案时、任何读终值的判定与文案之前调一次（houseSettled 防重）。
  //     净额 = max(0, 现值 − 未偿本金) × 折价，钳 +SETTLE_CAP，落 stats.money 一次。———
  function houseSettleDue(st) {
    if (!st || !st.houseTier || st.houseSettled) return 0;
    st.houseSettled = true;
    const endAge = (st.death && typeof st.death.age === "number") ? st.death.age : st.age;
    const value = houseAssetValue(st, st.birthYear + endAge);
    let unpaid = 0;
    if (st.houseTier !== "R") { // R 无贷款，未偿本金恒 0
      const paidYears = Math.max(0, Math.min(MORTGAGE_YEARS, endAge - buyAgeOf(st)));
      unpaid = Math.max(0, (assetBaseOf(st) - downPaidOf(st)) * (1 - paidYears / MORTGAGE_YEARS));
    }
    const discount = st.houseTier === "R" ? REFORM_DISCOUNT : COMMODITY_DISCOUNT;
    const amt = Math.min(SETTLE_CAP, Math.max(0, value - unpaid) * discount);
    const before = st.stats.money;
    st.stats.money = Math.max(0, Math.min(100, before + amt));
    const actual = st.stats.money - before;
    houseLedgerOf(st).push({ type: "settle", age: endAge, value: +value.toFixed(4), unpaid: +unpaid.toFixed(4), amt, actual });
    // 同步进工资账本变现分项（settle 键）：普查能把生涯住房现金与终局变现分开读
    if (typeof IFY.wageLedgerPush === "function")
      IFY.wageLedgerPush(st, { age: endAge, wage: 0, pension: 0, side: 0, housing: 0, settle: amt, gross: amt, pay: 0, actual });
    return actual;
  }

  // ——— §8.3 老档回填（loadSave 调用）：已购房无字段 → 按形态/当刻档位补档，地段默认 city ———
  function backfillHouse(st) {
    if (!st || typeof st !== "object") return;
    if (typeof st.houseCarry !== "number") st.houseCarry = 0;
    if (typeof st.houseSettled !== "boolean") st.houseSettled = false;
    if (st.houseTier == null) {
      const h = typeof IFY.housingOf === "function" ? IFY.housingOf(st) : null;
      if (h && h.owned && h.owned !== "selfbuilt") { // 自建房不进资产账：houseTier 恒 null，回填也不许给它派市场档
        if (h.owned === "reform") st.houseTier = "R";
        else {
          const wt = typeof IFY.wageTierOf === "function" ? IFY.wageTierOf(st) : null;
          st.houseTier = wt === "X" ? "A" : (wt || "C");
        }
        st.houseLoc = "city";
      } else { st.houseTier = null; st.houseLoc = null; }
    }
    if (st.houseTier && st.houseLoc == null) st.houseLoc = "city";
  }

  Object.assign(IFY, { captureHouse, houseOnBuyFlag, houseAssetValue, houseMultipleOf, houseYearDue, houseSettleDue, houseLedgerOf, backfillHouse, houseAssetBaseOf: assetBaseOf, houseBuyAgeOf: buyAgeOf });
})(window.IFY = window.IFY || {});
