// [模块]《如果那年》引擎分片：结构化人生账本。独立模块（包装器 + window.IFY 共享命名空间），加载顺序见 index.html。
(function (IFY) {
  "use strict";
  // ---------- 结构化人生账本（v0.18.0，内核一期）：文字流水是显示层，账本是事实层 ----------
  // 每条记录 { age, kind, id, choice?, set?, fx?, text? }；kind ∈ event/rare/fork/crisis/glimpse/flat/micro/proc/state/route/prologue/death。
  // 判词与特殊结局的证据、结算九槽、居所轨迹都读账本（与 flags/usedEvents 并读；旧存档无账本时各处回落旧读法）。
  function rec(kind, id, extra) {
    if (!IFY.S) return;
    if (!Array.isArray(IFY.S.ledger)) IFY.S.ledger = [];
    const e = { age: IFY.S.age, kind, id };
    if (extra) for (const [k, v] of Object.entries(extra)) if (v !== undefined && v !== null && v !== "") e[k] = v;
    IFY.S.ledger.push(e);
    if (extra && extra.set) { if (!IFY.S.flagAges) IFY.S.flagAges = {}; if (!(extra.set in IFY.S.flagAges)) IFY.S.flagAges[extra.set] = IFY.S.age; }
  }

  function hasRec(id) { return Array.isArray(IFY.S.ledger) && IFY.S.ledger.some((e) => e.id === id); }

  function hasFact(id) { return !!IFY.S.flags[id] || IFY.S.usedEvents.includes(id) || (IFY.S.usedRare || []).includes(id) || hasRec(id); }

  // 职业语境门（v0.18.0，审计急修 B5）：条目声明所需活计形态/关键经历（ctx），抽取层按本局实际状态与账本核对——
  // 没有从医经历不出村医，没有长途职业线不出「跑满一百万公里」。
  function ctxOk(ctx) {
    if (!ctx) return true;
    if (ctx.flag && !hasFact(ctx.flag)) return false;
    if (ctx.anyFlag && !ctx.anyFlag.some((f) => hasFact(f))) return false;
    if (ctx.state) for (const [dom, vals] of Object.entries(ctx.state)) if (!vals.includes(IFY.S.state[dom])) return false;
    // 活计形态门（v0.20.0 M2）：form 命中任一即过、notForm 命中任一即拦。形态是派生量
    // （规则表见 world/processes/work.js formOf），只随本局事实现算，不进存档状态域。
    if (ctx.form || ctx.notForm) {
      const f = typeof IFY.formOf === "function" ? IFY.formOf() : "employee";
      if (ctx.form && ![].concat(ctx.form).includes(f)) return false;
      if (ctx.notForm && [].concat(ctx.notForm).includes(f)) return false;
    }
    // 主线门（v0.20.0 M2 形态补修第二批）：mainLine 为入行旗 id 或其数组——条目可抽
    // 当且仅当本局主入行旗（work.js mainEntryOf，R1 最近入行）∈ mainLine。治「入行旗
    // 只进不出」：旧线条目（如焊工终身文本）自带 require 只认旗存在过、不认主线是否
    // 已换人；mainLine 按当前主线裁。无主入行旗（mainEntryOf 为 null）时一律不过。
    // 同为派生量，不进存档。
    if (ctx.mainLine) {
      const m = typeof IFY.mainEntryOf === "function" ? IFY.mainEntryOf() : null;
      if (!m || ![].concat(ctx.mainLine).includes(m)) return false;
    }
    // 入行防叠门（v0.20.1 W6）：ctx.entry=true 的纯入行拍只在本局尚无主入行旗时可抽——
    // 已有当前主线的人不再凭空叠新职业；带明确转行/接管叙事的条目与线内分科条目不声明此门，照旧可走。
    if (ctx.entry && typeof IFY.mainEntryOf === "function" && IFY.mainEntryOf()) return false;
    // 路线未决门（v0.20.1 W9，ctx.entry 的路线口径扩展，不另立键）：home 路线（route=home，
    // 或序章 home 轨道 track=home）在考试链出结果之前（22–28 岁、未落 exam_passed/exam_landed、
    // 也未落 exam_failed），其他行当的纯入行拍一律不可抽——邀约只能以没落成形态缺席，
    // 不得抢先落成主入行旗；链落定（exam_passed 起）或明确落空（exam_failed，或 29 岁窗已过）
    // 后本门自动失效，其他行当照常放行。派生量，只读现算，不进存档。
    // 考试门片（审议单 #5）起，等待条件改读派生谓词 examPending（本文件尾，与 anyFamilyAlive
    // 同层）：链头对本人可达才值得等；schooling=never/left 且无桥的人，明确表态不补
    // （exam_bridge_declined）立即出窗、27 岁起年龄兜底出窗，不再为不可能的结果空等满窗。
    if (ctx.entry) {
      const S = IFY.S;
      if (examPending(S)) return false;
      // study 在读窗（AN-3 D-2b，与 home 考试窗对称的路线未决窗）：深造路线 22–27 岁
      // 默认在读，其他行当的纯入行拍不可抽——邀约只能缺席，不得抢先落成主入行旗
      // 把「在读」叙事顶掉。带 ctx.studyLine 的条目是深造线自己的入行拍（如立研究旗
      // 的课题组拍），豁免本窗；28 岁起自动失效，毕业去向照常放行。
      if (S && S.route && S.route.id === "study" && S.age >= 22 && S.age < 28 && !ctx.studyLine) return false;
      // corp 开局窗（AN-3 D-2c）：单位路线 22–24 岁是路线自带的入职叙事期，其他
      // 行当的纯入行拍不可抽（挡「大厂开局第一年还在进小作坊学徒」类串行）；25 岁
      // 起自动失效，跳槽/转行叙事照常。
      if (S && S.route && S.route.id === "corp" && S.age >= 22 && S.age <= 24) return false;
      // farm 种地窗（农民路线立项补，与 home 考试窗/study 在读窗同构）：留乡路线 22–26 岁
      // 是下地立线的叙事期（22–28，与 home 考试窗同宽），farm_work 未落定前，其他行当的纯入行拍不可抽——挡「选了留
      // 下来种地、开局却先被城里入行拍抢走主线，此后种地入口被入行防叠门永久关死」。
      // 带 ctx.farmLine 的条目是种地线自己的入口拍（p29_001/p29_002 与 pack35 入口），豁免
      // 本窗；farm_work 落定或 27 岁窗过后自动失效。
      if (S && S.route && S.route.id === "farm" && S.age >= 22 && S.age <= 28 && !(S.flags && S.flags.farm_work) && !ctx.farmLine) return false;
    }
    // 在职门（AN-3 D-1）：ctx.employed=true 须本局已有入行事实（work.js isEmployed）；
    // ctx.notEmployed=true 反之。治「叙事旗冒充就业事实」：只落 job_hop/stay_put 的人
    // 仍是未入行，工龄/单位/在职口径文本不得命中他。
    if (ctx.employed && !(typeof IFY.isEmployed === "function" && IFY.isEmployed())) return false;
    if (ctx.notEmployed && typeof IFY.isEmployed === "function" && IFY.isEmployed()) return false;
    // 主线工龄门（AN-3 D-4）：ctx.tenureIn=[lo,hi]——当前主线工龄（work.js tenureYears
    // 派生）须落在闭区间内；无主线或落点年龄缺失（tenureYears=null）一律不过
    // （fail-closed：旧档不硬凑工龄）。
    if (ctx.tenureIn) {
      const t = typeof IFY.tenureYears === "function" ? IFY.tenureYears() : null;
      if (t == null || t < ctx.tenureIn[0] || t > ctx.tenureIn[1]) return false;
    }
    // 换线时窗门（AN-3 D-4）：ctx.lineSwitchWithin=n——主线切换落点距今 ≤ n 年才可抽
    // （「刚换线」回响专用）；从没换过线（entrySwitchAge=null）不过。
    if (ctx.lineSwitchWithin != null) {
      const sw = typeof IFY.entrySwitchAge === "function" ? IFY.entrySwitchAge() : null;
      if (sw == null || IFY.S.age - sw > ctx.lineSwitchWithin) return false;
    }
    // 职业履历门（第 2 期 P2-3，设计 §4.5 键族子集）：ctx.careerTrade / careerVia /
    // careerTenureIn——当前段行当 / 来处 / 在段年数（当岁 − from）读 career 账现算：
    // 行当与年数走 career.js 的只读派生 careerOf，来处取未收尾段的 via（careerOf 的
    // 形状不带 via，故读 careerSpells 的未收尾段，与 careerOf 同源同段）。fail-closed：
    // 无当前段（未入行 / 待业 / 已退休）或 career 账、派生函数不在场，三键全不过。
    // 值形：careerTrade/careerVia 为 id 或其数组（命中任一即过，与 form 同口径）、
    // careerTenureIn 为 [lo,hi] 闭区间。此组键只许职业族新拍（cr_ 前缀）用，存量
    // 条目零回填——validate-storylet 静态检查把门（career 键出现在非 cr_ 条目即红）。
    if (ctx.careerTrade !== undefined || ctx.careerVia !== undefined || ctx.careerTenureIn !== undefined) {
      const co = typeof IFY.careerOf === "function" ? IFY.careerOf(IFY.S) : null;
      if (!co) return false;
      if (ctx.careerTrade !== undefined && ![].concat(ctx.careerTrade).includes(co.trade)) return false;
      if (ctx.careerVia !== undefined) {
        let via = null;
        if (typeof IFY.careerSpells === "function") {
          const sps = IFY.careerSpells(IFY.S);
          for (let i = sps.length - 1; i >= 0; i--) if (sps[i] && sps[i].to == null) { via = sps[i].via; break; }
        }
        if (via == null || ![].concat(ctx.careerVia).includes(via)) return false;
      }
      if (ctx.careerTenureIn !== undefined) {
        const y = co.years;
        if (typeof y !== "number" || y < ctx.careerTenureIn[0] || y > ctx.careerTenureIn[1]) return false;
      }
    }
    // 研究在行门（AN-3 D-5c）：ctx.gradGate=true——须已立研究旗 grad_work，或旧档宽门：
    // 已走过药研轨迹旗 traj_drug1/traj_drug2。grad_work 是新立的旗，旧档局内年龄窗已过、
    // 永远补不上立旗拍，只认新旗会把旧档研究者终身挡在实验室文本之外，故留轨迹旗回落。
    if (ctx.gradGate && !hasFact("grad_work") && !hasFact("traj_drug1") && !hasFact("traj_drug2")) return false;
    // 反主线门（v0.20.1 W6）：ctx.notMainLine 为入行旗 id 数组——当前主线命中任一即拦
    // （如医护在行期间不出「回公司开会」口径的公司纹理；形态派生分不出医护与公司同为 employee 时用它）。
    if (ctx.notMainLine) {
      const m = typeof IFY.mainEntryOf === "function" ? IFY.mainEntryOf() : null;
      if (m && [].concat(ctx.notMainLine).includes(m)) return false;
    }
    // 学历门（v0.20.1 W6）：ctx.eduGate=true——须 schooling=school，或已走过夜校/自考桥（edu_bridge 旗）。
    // schooling=pre 的年代没有序章处境判定（未判定不等于未上学），不在此门内，恒过。
    if (ctx.eduGate) {
      const sc = IFY.S.state && IFY.S.state.schooling;
      if (sc && sc !== "school" && sc !== "pre" && !hasFact("edu_bridge")) return false;
    }
    // 宽学历门（v0.23 WP8 fix4）：ctx.eduGateHalf=true——在 eduGate 口径上另放行 schooling=half。
    // 用于考试链链身与同类质地条目：它们在补门前本就可被 half 玩家单独抽到（链头 eduGate 只管
    // 链的入口、不管链身单抽），硬约束 school/half 续读行为不变，故链身用宽门；只挡 never/left
    // 未立桥者。考试门片（审议单 #5）起，链头 p16_001 与第二链头 p16_012 也改用本宽门——half 是
    // 「读了一半」的人，游戏现行「有读书记录」标准即宽口径；eduGate 严口径保留给在职读研
    // （p16_014）等学位级条目。
    if (ctx.eduGateHalf) {
      const sc = IFY.S.state && IFY.S.state.schooling;
      if (sc && sc !== "school" && sc !== "pre" && sc !== "half" && !hasFact("edu_bridge")) return false;
    }
    // 在护对象门（v0.20.1 W8 登记）：ctx.anyCareTarget=true——陪床/等喊号/护工排班类文本必须有
    // 「当下还在的在护对象」：父母任一在世且本局处于父母照护情境（care_self/care_hired/care_rotate
    // 任一事实在账），或伴侣在场（partnered/dating）且有伴侣照护事实（care_hired_spouse 在账）。
    // 只认旧旗不认人还在不在，正是审计 run-13「父母双亡多年还在陪床」的病根；此门是派生量，不进存档。
    if (ctx.anyCareTarget) {
      const st = IFY.S.state || {};
      const parentTarget = (st.dad === "alive" || st.mom === "alive") &&
        (hasFact("care_self") || hasFact("care_hired") || hasFact("care_rotate"));
      const spouseTarget = (st.spouse === "partnered" || st.spouse === "dating") && hasFact("care_hired_spouse");
      if (!parentTarget && !spouseTarget) return false;
    }
    // 生活事实门（v0.24.4，AN-2）：住房/车辆/定居三类当前事实只许问派生层（place.js 的
    // housingOf/carOf/settledOf，纯函数现算、不进存档），不许条目再直接认单面旗——这正是
    // 「买过商品房的人被房东收房」一族的病根（旗只增不减、每处读点各读一个子集）。
    //   ctx.house："owned" 已购房（own/reform/commodity 任一形态；单位分房不算买下）/
    //     "renting" 当前确实在私租（租旗在身且未购房未住单位房）/"unit" 当前住单位房口径
    //     （含 c1955 公房纠偏）/"any" 三者居其一。
    //   ctx.car："now" 现在有车（买过且没卖）/"ever" 曾经有过车/"none" 从没买过车。
    //   ctx.settle："home"|"city"|"abroad"——当前定居地（轨迹终点，settledOf）。
    if (ctx.house) {
      const h = typeof IFY.housingOf === "function" ? IFY.housingOf(IFY.S) : null;
      if (!h) return false;
      const ok = ctx.house === "owned" ? !!h.owned
        : ctx.house === "renting" ? h.rentingNow
        : ctx.house === "unit" ? h.unitLike
        : ctx.house === "any" ? !!(h.owned || h.unitLike || h.rentingNow)
        : false;
      if (!ok) return false;
    }
    if (ctx.car) {
      const c = typeof IFY.carOf === "function" ? IFY.carOf(IFY.S) : null;
      if (!c) return false;
      const ok = ctx.car === "now" ? c.now : ctx.car === "ever" ? c.ever : ctx.car === "none" ? !c.ever : false;
      if (!ok) return false;
    }
    if (ctx.settle) {
      const so = typeof IFY.settledOf === "function" ? IFY.settledOf(IFY.S) : null;
      if (!so || so.final !== ctx.settle) return false;
    }
    return true;
  }
  // 家里还有人门（判词批 D）：派生量、纯读现行 state、不进存档——父母任一在世，或有在世伴侣
  // （spouse = partnered/dating），或有子女（kids = has），任一成立即「家里还有人」。
  // 与 ctx.anyCareTarget 同层同法：只认当下还在的人，不认只增不减的旧旗——「家里人」类文本
  // 在空屋局（双亲已故、无伴侣、无子女）里照出，正是缺了这个单一派生、逐条目自己拼的漏。
  // 条目侧以 scheduler.met()/unmetConditions() 的顶层字段 anyFamilyAlive 消费，两处同读本函数。
  // 考试窗谓词（考试门片·审议单 #5）：home 路线（route=home，或 route 在身且 track=home）在
  // 22–28 岁、考试链未出结果（exam_passed/exam_landed/exam_failed 皆未落）且本人对链头
  // 「还有指望」时，窗继续等——ctx.entry 的纯入行拍不可抽（ctxOk 消费，unmetConditions 经
  // ctxOk 同读，不许两处各拼一份）。指望的口径：已立 edu_bridge，或 schooling 宽门可达
  // （school/pre/half——链头 p16_001 已改 eduGateHalf）恒算有指望；never/left 且无桥者，看与
  // home 桥拍 p16_077 的关系：已明确表态不补（exam_bridge_declined 在账）→ 不再等，立即出窗；
  // 27 岁起桥窗（22–26）已过 → 不再等（年龄兜底）；22–26 未遇桥拍或未表态 → 继续等。
  // 纯读传入状态的 state/flags/usedEvents/usedRare/ledger（hasFact 的同口径镜像，作用域随
  // withLife 切换自动同源），不读旧旗、不进存档。
  function examPending(S) {
    const T = S || IFY.S;
    if (!T || !T.route) return false;
    const st = T.state || {};
    if (T.route.id !== "home" && st.track !== "home") return false;
    if (typeof T.age !== "number" || T.age < 22 || T.age > 28) return false;
    const fact = (id) =>
      !!(T.flags && T.flags[id]) ||
      (Array.isArray(T.usedEvents) && T.usedEvents.includes(id)) ||
      (Array.isArray(T.usedRare) && T.usedRare.includes(id)) ||
      (Array.isArray(T.ledger) && T.ledger.some((e) => e && e.id === id));
    if (fact("exam_passed") || fact("exam_landed") || fact("exam_failed")) return false;
    if (fact("edu_bridge")) return true;
    const sc = st.schooling;
    if (!sc || sc === "school" || sc === "pre" || sc === "half") return true;
    if (fact("exam_bridge_declined")) return false;
    if (T.age >= 27) return false;
    return true;
  }
  function anyFamilyAlive(S) {
    const st = (S && S.state) || (IFY.S && IFY.S.state) || {};
    return st.dad === "alive" || st.mom === "alive" ||
      st.spouse === "partnered" || st.spouse === "dating" ||
      st.kids === "has";
  }
  Object.assign(IFY, { rec, hasRec, hasFact, ctxOk, anyFamilyAlive, examPending });
})(window.IFY);
