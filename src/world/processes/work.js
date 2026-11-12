// [模块]《如果那年》引擎分片：工作/退休相位进程。独立模块（包装器 + window.IFY 共享命名空间），加载顺序见 index.html。
(function (IFY) {
  "use strict";
  // ---------- 退休相位（v0.19.0）：workPhase 小进程（进程流 #world，不碰叙事/环境流） ----------
  // 规则一句话：50 岁起按活计形态定下本局的退休节点年龄（S.retirePlan，只定一次）——
  // 体制内路线（route=home）与正式入行旗持有者 55–60；店主/零工/种地/自由形态 63–68；其余 58–63。
  // 到点发节点拍 proc_retire_node（退/part/再干几年）；part 停留期（applyState 流转时定）满后发 proc_retire_full；
  // 推迟两次或拖过 74 岁由 proc_retire_auto 收束；58 岁分岔 fork58 的选项同步写 workPhase。
  // v0.20.1 W2 退休单一事实源：退休只认 workPhase 状态域 + S.retiredAt/retirePlan + 旗 retire_final_said。
  // 三套机制互锁（同一年不许双决）：进程拍与 fork58 谁先在当年落账，另一个当年不再响——
  // 进程拍先响由 engine.js 的 fork58 门读 retireDecidedThisYear() 跳过当年分岔（外加 fork58 自带
  // workPhase 状态门：已 retired 者永不再出此岔）；fork58 先响由 workPhaseDue 读 forkFiredThisYear() 当年不再发拍。
  // 「真退了」一局至多一次：proc_retire_full 首次落定用原文，返聘后复退改走条目声明的 textAgain 再退变体
  // （变体选择只能在本函数做：呈现时 applyState 已先行流转，textState 无可分辨的域——口径见 sim-v0201/logs/w2-retire.md）。
  // 无当前单位事实者（买断离厂 laid_off 后再无入行/返聘事实）走条目声明的 textNoUnit/echoNoUnit 不点名单位变体。
  // 钱进程接口：未来养老金标定读 S.state.workPhase、S.retiredAt（退休落点年龄）与 S.retirePlan.form（退休前活计形态），定义见 docs/WORK-PHASE.md。
  const WORK_FORMAL_FLAGS = ["factory_work", "fab_work", "craft_work", "heavy_work", "miner_work", "truck_work", "med_hosp", "teach_work", "acct_work", "fin_work", "press_work", "dev_work", "forestry_work", "rail_work", "post_work", "geo_work"]; // rail_work：CL-121 铁路开线新增（总指挥裁定 form=employee、单位制，退休窗随 formal 55–60）；post_work：CL-119 邮政开线新增（邮电／邮政单位制，退休窗 55–60）；geo_work：CL-133 地质开线新增（地质队事业单位制，退休窗 55–60）
  const WORK_INFORMAL_FLAGS = ["shop_work", "gig_work", "farm_work", "courier_work", "care_work", "write_work", "sea_work", "photo_work", "recycle_work"]; // photo_work：CL-78 注册落地定 flex 机会层，退休窗随 informal 63–68；recycle_work：CL-120 回收开线新增（总指挥裁定 form=self、退休窗 63–68、养老金率 0.3 随 informal 口径）

  function workForm() {
    if (WORK_FORMAL_FLAGS.some((f) => IFY.S.flags[f])) return "formal";
    if (IFY.S.route && IFY.S.route.id === "home") return "formal";
    if (IFY.S.route && IFY.S.route.id === "farm") return "informal"; // 农民路线：未立 farm_work 旗前也按 informal 读（退休节点 63–68）
    if (WORK_INFORMAL_FLAGS.some((f) => IFY.S.flags[f])) return "informal";
    return "fallback";
  }

  // ---------- 活计形态（v0.20.0 M2）：通用职场纹理的语境层，与二相行当旗正交 ----------
  // formOf() 是派生量：只读本局已发生的事实（入行旗 + flagAges/账本先后 + 路线 + 少年轨道），
  // 不写入存档状态域、不新增旗标——旧存档载入后现算现得，读档口径不破。
  // 五形态：farm 务农 / public 体制内 / self 自营 / flex 灵活 / employee 受雇（默认）。
  // 派生规则表（显式优先级，多旗共存时按此表裁定）：
  //   R1 主入行旗（下表 FORM_OF_FLAG）——先在非零活类入行旗里取「最近入行」的那一面定主形态：
  //      先比 flagAges 落点年龄，年龄同再比账本里该旗最后一次落账的先后；仍同则按 farm>public>
  //      self>flex>employee 的表序。零活类旗（形态为 flex 的 gig/courier/care/write）只在没有任何
  //      主线旗时才定 flex——晚年接一摊零活改不了一辈子的行当（v0.24.4 AN-2 主线约束；旧版零活旗
  //      与主线旗同池比最近，一面晚立的零活旗就能把整局形态改写成 flex）。ctx.mainLine 读的
  //      mainEntryOf 本体同批由 AN-3 D-8 改两层裁——机会层四旗恰与 flex 形态四旗同集，两边分池口径一致。
  //   R2 副业成型旗（side_job / xiahai）——只在没有任何入行旗时定 self：副业是主业
  //      之外的第二摊，它成型不等于主线换人；有入行旗时不抢主形态。
  //   R4 少年轨道 track=home（留在家里帮着种地守店）——再无上项、且成年路线没有把人带离家乡
  //      （路线未定，或路线就是 home/gap）时才定 farm：16 岁留家、22 岁进城进厂的人，少年轨道
  //      不能把他一辈子按在 farm 上（v0.24.4 AN-2 降位；旧版 R4 无条件垫底，是「城里定居却
  //      靠种地过日子」一族的根）。track 的其余取值（study/work/craft）不单独定形态。
  //   R5 默认 employee——含 corp 路线与一切未落入行旗的局：22 岁出发即按受雇处理，
  //      通用职场纹理对这批人成立。
  //   （旧 R3「路线 home 直接定 public」v0.24.4 删除：路线决定的是住哪儿，不是活计形态——
  //   回乡没上岸、没立任何入行旗的人此前被一辈子读成体制内。上岸者有 exam_landed 旗走 R1，
  //   不受影响；无旗者回落 R4/R5。③段施工定：回落默认取 R5 的 employee，不新设年代默认表。）
  const FORM_VALUES = ["farm", "public", "self", "flex", "employee"];
  const FORM_OF_FLAG = {
    farm_work: "farm",
    township_work: "employee", // 乡镇企业入行（农民路线混合层）：离土不离乡——形态按受雇、工资 C 档；farm_work 旗不清，土地池不关门
    farm_returned: "farm", // 厂散回落（farm_township_back 立）：落点年龄晚于 township_work，R1 按落点裁定把形态拽回 farm
    exam_landed: "public",
    shop_work: "self",
    gig_work: "flex", courier_work: "flex", care_work: "flex", write_work: "flex", photo_work: "flex",
    factory_work: "employee", fab_work: "employee", craft_work: "employee", heavy_work: "employee",
    miner_work: "employee", truck_work: "employee", med_hosp: "employee", med_work: "employee",
    nurse_work: "employee", img_work: "employee", teach_work: "employee", acct_work: "employee",
    fin_work: "employee", press_work: "employee", dev_work: "employee", driver_taxi: "employee",
    grad_work: "employee", builder_work: "employee", sea_work: "self", forestry_work: "employee", consult_work: "employee", rail_work: "employee", recycle_work: "self", post_work: "employee", geo_work: "employee", // 第 2 期注册片新增行当（建筑工人＋CL-27 出海，与 trades.js 双向对应，validate-state 守）；forestry_work 为 CL-47 林业开线新增（总指挥裁定 form=employee）；rail_work 为 CL-121 铁路开线新增（同裁定 form=employee）；photo_work 的 form 已由 CL-78 注册落地片改定 flex（见上行 flex 组与 trades.js photo 注）；consult_work 为 CL-93 咨询注册片新增（总指挥裁定 form=employee；不进 WORK_FORMAL_FLAGS/WORK_INFORMAL_FLAGS，退休落 fallback 58–63、养老金率 0.45）；recycle_work 为 CL-120 回收开线新增（总指挥裁定 form=self；入 WORK_INFORMAL_FLAGS，退休窗 63–68、养老金率 0.3）；post_work 为 CL-119 邮政开线新增（同 rail 裁定 form=employee、入 WORK_FORMAL_FLAGS）；geo_work 为 CL-133 地质开线新增（同 rail 裁定 form=employee、入 WORK_FORMAL_FLAGS）
  };
  const FORM_SIDE_FLAGS = ["side_job", "xiahai"];
  const FORM_TIE_ORDER = ["farm", "public", "self", "flex", "employee"]; // R1 同龄同序时的表序
  // 主线资格分层（AN-3 D-8）：机会层入行旗（写稿/照护/零工/快递——过渡活计口径，
  // r_gap_work 等条目自带此读法）只在本局没有任何正职层入行旗时才算主线；正职层
  // （其余全部入行旗）一旦落定，机会层后到不夺主线（先开店后写稿，主线仍是开店）。
  const ENTRY_OPPORTUNITY_FLAGS = ["write_work", "care_work", "gig_work", "courier_work", "photo_work"];

  // 主入行旗（v0.20.0 M2 形态补修第二批）：R1 的「最近入行旗」单独导出为可读量——
  // formOf() 的形态与 ctx.mainLine 门都读它。返回值是入行旗 id（如 "teach_work"），
  // 本局尚无任何主入行旗时为 null。派生量，只读现算，不进存档。
  // formOf 的主线约束（分池）用它取「最近入行旗」；mainEntryOf 本体走 mainEntryOfState 的两层裁（见下）。
  // st 可传任意 Track 的 state（瞥视读影子轨用）；不传时读 IFY.S，与旧行为逐项一致。
  function bestEntryFlag(S, pred) {
    let best = null; // { flag, form, age, idx }
    for (const [flag, form] of Object.entries(FORM_OF_FLAG)) {
      if (!S.flags[flag] || (pred && !pred(flag, form))) continue;
      const age = S.flagAges && typeof S.flagAges[flag] === "number" ? S.flagAges[flag] : 22;
      let idx = -1;
      if (Array.isArray(S.ledger)) for (let i = S.ledger.length - 1; i >= 0; i--) { if (S.ledger[i].set === flag) { idx = i; break; } }
      const cand = { flag, form, age, idx };
      if (!best || cand.age > best.age || (cand.age === best.age && cand.idx > best.idx) ||
          (cand.age === best.age && cand.idx === best.idx && FORM_TIE_ORDER.indexOf(cand.form) < FORM_TIE_ORDER.indexOf(best.form))) best = cand;
    }
    return best ? best.flag : null;
  }

  // AN-3 D-8 两层裁的候选/胜负实现（正职层优先、机会层兜底）；影子侧无第二份复刻——
  // 瞥视经 IFY.formOf(B) 同源现算（AN-2 单一源），改这里即全域生效。
  function entryCand(S, flag, form) {
    const age = S.flagAges && typeof S.flagAges[flag] === "number" ? S.flagAges[flag] : 22;
    let idx = -1;
    if (Array.isArray(S.ledger)) for (let i = S.ledger.length - 1; i >= 0; i--) { if (S.ledger[i].set === flag) { idx = i; break; } }
    return { flag, form, age, idx };
  }
  function entryBeats(a, b) {
    return !b || a.age > b.age || (a.age === b.age && a.idx > b.idx) ||
      (a.age === b.age && a.idx === b.idx && FORM_TIE_ORDER.indexOf(a.form) < FORM_TIE_ORDER.indexOf(b.form));
  }
  function mainEntryOfState(S) {
    if (!S || !S.flags) return null;
    let main = null, opp = null;
    for (const [flag, form] of Object.entries(FORM_OF_FLAG)) {
      if (!S.flags[flag]) continue;
      const cand = entryCand(S, flag, form);
      if (ENTRY_OPPORTUNITY_FLAGS.includes(flag)) { if (entryBeats(cand, opp)) opp = cand; }
      else if (entryBeats(cand, main)) main = cand;
    }
    const best = main || opp;
    return best ? best.flag : null;
  }
  function mainEntryOf(st) {
    // 本体走 mainEntryOfState 的两层裁（AN-3 D-8）；st 可传任意 Track 的 state，不传读 IFY.S。
    return mainEntryOfState(st || IFY.S);
  }

  function formOf(st) {
    const S = st || IFY.S;
    if (!S || !S.flags) return "employee";
    // R1：主线约束——先认非零活类入行旗里最近的一面；一面都没有时才轮到零活类旗定 flex
    const mainEntry = bestEntryFlag(S, (flag, form) => form !== "flex");
    if (mainEntry) return FORM_OF_FLAG[mainEntry];
    const lightEntry = bestEntryFlag(S, (flag, form) => form === "flex");
    if (lightEntry) return "flex";
    // R2：副业成型
    if (FORM_SIDE_FLAGS.some((f) => S.flags[f])) return "self";
    // R3.5 农民路线兜底：路线本身就是留在土地上——未立任何入行旗时按 farm 读，
    // 不让 22 岁选了这条路的人在入口条目抽到之前先被读成受雇者。入行旗仍由 R1 优先
    // （进乡镇企业立 township_work 后按 employee；厂散回落拍重立 farm_work，按落点年龄再翻回）。
    if (S.route && S.route.id === "farm") return "farm";
    // R4（降位后）：少年轨道只在成年路线没把人带离家乡时垫底定 farm
    if (S.state && S.state.track === "home" && (!S.route || S.route.id === "home" || S.route.id === "gap")) return "farm";
    // R5：默认受雇
    return "employee";
  }

  // 在职判定（AN-3 D-1）：本局已有任一入行事实（FORM_OF_FLAG 任一旗在账，含
  // exam_landed 与 grad_work）即在职。分岔的 job_hop/stay_put/side_start/steady_job
  // 是叙事旗、不是就业事实，不计入——只落叙事旗的人仍是未入行。旧存档同口径现算：
  // 入行旗都是老旗，不依赖任何新旗，旧档读入即得真值。
  function isEmployed() {
    const S = IFY.S;
    if (!S || !S.flags) return false;
    return Object.keys(FORM_OF_FLAG).some((f) => S.flags[f]);
  }
  // 当前主线工龄（AN-3 D-4）：主入行旗落点年龄到今年的年数（入行当年 = 0）。
  // 无主线、或落点年龄缺失（极旧档 flagAges 不全）时返回 null——门按 fail-closed
  // 处理，不拿 mainEntryOf 排序兜底的 22 岁硬凑成事实。
  function tenureYears() {
    const S = IFY.S;
    if (!S || !S.flags) return null;
    const m = mainEntryOf();
    if (!m) return null;
    const at = S.flagAges && typeof S.flagAges[m] === "number" ? S.flagAges[m] : null;
    return at == null ? null : S.age - at;
  }
  // 最近一次换线落点（AN-3 D-4）：当前主线之外还存在落点更早的入行旗时，
  // 「换到现主线」这件事的落点年龄 = 当前主线旗的落点年龄；从没换过线返回 null。
  // 供 ctx.lineSwitchWithin 读（「刚换线」回响专用）。
  function entrySwitchAge() {
    const S = IFY.S;
    if (!S || !S.flags || !S.flagAges) return null;
    const m = mainEntryOf();
    if (!m || typeof S.flagAges[m] !== "number") return null;
    const cur = S.flagAges[m];
    const hasEarlier = Object.keys(FORM_OF_FLAG).some((f) => f !== m && S.flags[f] && typeof S.flagAges[f] === "number" && S.flagAges[f] < cur);
    return hasEarlier ? cur : null;
  }

  function ensureRetirePlan() {
    if (IFY.S.retirePlan || !IFY.S.route || IFY.S.age < 50 || !IFY.S.state || IFY.S.state.workPhase !== "working") return;
    const form = workForm();
    const band = form === "formal" ? [55, 60] : form === "informal" ? [63, 68] : [58, 63];
    IFY.S.retirePlan = { form, nodeAge: band[0] + Math.floor(IFY.rngW() * (band[1] - band[0] + 1)) };
  }

  // ---------- v0.20.1 W2：退休单一事实源的账本读法（只读账本/旗标，不另记一套时点） ----------
  const RETIRE_BEAT_IDS = ["proc_retire_node", "proc_retire_full", "proc_retire_auto"];
  function ledgerOf() { return (IFY.S && Array.isArray(IFY.S.ledger)) ? IFY.S.ledger : []; }
  // 账本里是否已有过 workPhase>retired 流转（= 已全退落定过一次）
  function hasRetiredBefore() { return ledgerOf().some((e) => e.kind === "state" && e.id === "workPhase>retired"); }
  // 返聘后复退门（v0.20.1 W7，p14_010 专用口径）：真退之后真有过返聘边——账本里首次
  // workPhase>retired 流转之后，又出现过 workPhase>part 流转（retired→part 的唯一载体是
  // e_rehire_1/e_rehire_2 的接活选项；fork58 已被其自身状态门挡在 retired 之外）。
  // 只认 rehire 旧旗不够：fork58 在 58 岁选返聘立的 rehire 旗落在首次全退之前，那种情形
  // 本局从没在全退后返聘过，p14_010 的「返聘合同到期」落定永不出（run-13 实锤）。
  function hasRehireAfterRetire() {
    const led = ledgerOf();
    let retiredIdx = -1;
    for (let i = 0; i < led.length; i++) { const e = led[i]; if (e.kind === "state" && e.id === "workPhase>retired") { retiredIdx = i; break; } }
    if (retiredIdx < 0) return false;
    for (let i = retiredIdx + 1; i < led.length; i++) { const e = led[i]; if (e.kind === "state" && e.id === "workPhase>part") return true; }
    return false;
  }
  // retire_final_said 同步：账本首次出现全退流转即立旗（flagAges 记流转年龄，与 retired_begun 同口径）。
  // 落定载体本身的 set 位已被 retired_begun/retired_full 占满，此同步是该旗的主生产点（登记见 registry 注）。
  function syncRetireFinalSaid() {
    const S = IFY.S;
    if (!S || !S.flags || S.flags.retire_final_said) return;
    const t = ledgerOf().find((e) => e.kind === "state" && e.id === "workPhase>retired");
    if (!t) return;
    S.flags.retire_final_said = true;
    if (!S.flagAges) S.flagAges = {};
    if (!("retire_final_said" in S.flagAges)) S.flagAges.retire_final_said = t.age;
  }
  // pension_paid 同步（内容修复批，退休进程三连）：proc_retire_full 的正文/无单位变体已经当众说过
  // 「退休的钱已经打进来了」——账本出现该进程呈现即立旗（flagAges 记呈现年龄），与 syncRetireFinalSaid 同型。
  // 落定载体的 set 位已被 retired_begun 占用，此同步是该旗的唯一生产点（登记见 registry 的 pension_paid 注）。
  // 再退变体（textAgain）正文不提到账、口径从宽计入：其消费者（p12_019/p14_011）的窗口在再退时点已过，不产生实际误伤。
  function syncPensionPaid() {
    const S = IFY.S;
    if (!S || !S.flags || S.flags.pension_paid) return;
    const t = ledgerOf().find((e) => e.kind === "proc" && e.id === "proc_retire_full");
    if (!t) return;
    S.flags.pension_paid = true;
    if (!S.flagAges) S.flagAges = {};
    if (!("pension_paid" in S.flagAges)) S.flagAges.pension_paid = t.age;
  }
  // unit_gone 同步（时序回响修复段）：p22_010 的条目级 set 是主生产点，此同步只为旧存档自愈——
  // 修复前呈现过 p22_010 的中途局，账本有呈现记录而旗未立，载入后首次调用即按账本补立。
  function syncUnitGone() {
    const S = IFY.S;
    if (!S || !S.flags || S.flags.unit_gone) return;
    const t = ledgerOf().find((e) => e.id === "p22_010");
    if (!t) return;
    S.flags.unit_gone = true;
    if (!S.flagAges) S.flagAges = {};
    if (!("unit_gone" in S.flagAges)) S.flagAges.unit_gone = t.age;
  }
  // self_hosp_done 同步（时序回响修复段）：主角本人住院叙述者四条——p21_039/p23_022/p27_007 条目级
  // 自立为主，p26_003 的 set 位归 cataract_done 族占用，故全族统一由本同步按账本补齐（含旧存档自愈）。
  // 与全仓首次口径不同：flagAges 记最近一次住院年龄（账本按年龄序追加，取最后一条）——消费者
  // p25_028 的恢复期语义要读近时窗，口径登记见 registry 的 self_hosp_done 注。
  const SELF_HOSP_IDS = ["p21_039", "p23_022", "p26_003", "p27_007"];
  function syncSelfHosp() {
    const S = IFY.S;
    if (!S || !S.flags) return;
    let latest = null;
    for (const e of ledgerOf()) if (SELF_HOSP_IDS.includes(e.id)) latest = e;
    if (!latest) return;
    S.flags.self_hosp_done = true;
    if (!S.flagAges) S.flagAges = {};
    S.flagAges.self_hosp_done = latest.age;
  }
  // grandkid_seen 同步（时序回响修复段）：把孙辈写成主角自己的在场人物的条目名单——任一呈现即立，
  // flagAges 记首次呈现年龄。新增同类条目须同步往此名单加 id（登记见 registry 的 grandkid_seen 注）。
  const GRANDKID_BEAT_IDS = ["p14_027", "p14_028", "p14_030", "p14_031", "p14_032", "p14_034", "p16_059", "p16_070", "p23_066", "p25_006", "p25_017", "p25_027", "p25_037", "p25_042", "p25_063", "p26_013", "p29_019", "e55_044", "e55_050", "e55_069", "e95_009", "rt_grand_open", "rt_grand_show", "rt_grand_decide", "rt_grand_echo", "rt_grand_watch", "rt_kin_far"]; // 退休池批追加：带孙辈链六拍同为孙辈在场人物条目，按本注同步规矩入名单
  function syncGrandkidSeen() {
    const S = IFY.S;
    if (!S || !S.flags || S.flags.grandkid_seen) return;
    const t = ledgerOf().find((e) => GRANDKID_BEAT_IDS.includes(e.id));
    if (!t) return;
    S.flags.grandkid_seen = true;
    if (!S.flagAges) S.flagAges = {};
    if (!("grandkid_seen" in S.flagAges)) S.flagAges.grandkid_seen = t.age;
  }
  // trial_done 同步（时序回响修复段）：单位球队试训的两个叙述者任一呈现即立——试训一生一次，
  // 两条自身的 forbid 读它。与 syncPensionPaid 同型（登记见 registry 的 trial_done 注）。
  const TRIAL_BEAT_IDS = ["p16_023", "p19_014"];
  function syncTrialDone() {
    const S = IFY.S;
    if (!S || !S.flags || S.flags.trial_done) return;
    const t = ledgerOf().find((e) => TRIAL_BEAT_IDS.includes(e.id));
    if (!t) return;
    S.flags.trial_done = true;
    if (!S.flagAges) S.flagAges = {};
    if (!("trial_done" in S.flagAges)) S.flagAges.trial_done = t.age;
  }
  // 今年是否已有退休决定落账（进程拍呈现过，或 workPhase 当年发生过流转）——engine.js 的 fork58 当年互锁读它
  function retireDecidedThisYear() {
    const S = IFY.S;
    if (!S) return false;
    return ledgerOf().some((e) => e.age === S.age && ((e.kind === "proc" && RETIRE_BEAT_IDS.includes(e.id)) || (e.kind === "state" && typeof e.id === "string" && e.id.startsWith("workPhase>"))));
  }
  // 今年 fork58 是否已响过（呈现即落账 kind=fork/id=fork58）——进程拍的反向互锁读它
  function forkFiredThisYear() {
    const S = IFY.S;
    if (!S) return false;
    return ledgerOf().some((e) => e.age === S.age && e.kind === "fork" && e.id === "fork58");
  }
  // 无当前单位事实判定（run-14 型）：单位终结标记（laid_off 买断离厂，或 unit_gone 单位散了）已立，
  // 且其后再没有任何入行旗或返聘旗落账。先后以 flagAges 为准（取最近一次终结标记的落点年龄）；
  // 缺落点年龄时以账本里 set 记录的先后为准；都读不到按「有单位事实」保守处理（走原文）。
  function noCurrentUnit() {
    const S = IFY.S;
    if (!S || !S.flags || (!S.flags.laid_off && !S.flags.unit_gone)) return false;
    const ages = S.flagAges || {};
    const unitFlags = [...Object.keys(FORM_OF_FLAG), "rehire"];
    const endAges = ["laid_off", "unit_gone"].map((f) => (S.flags[f] && typeof ages[f] === "number") ? ages[f] : null).filter((x) => x !== null);
    if (endAges.length) { const endAge = Math.max(...endAges); return !unitFlags.some((f) => typeof ages[f] === "number" && ages[f] > endAge); }
    if (S.flags.unit_gone && !S.flags.laid_off) return true; // unit_gone 无落点年龄的兜底（同步/条目立旗恒记年龄，理论不到达）
    const led = ledgerOf();
    let laidIdx = -1;
    led.forEach((e, i) => { if (e.set === "laid_off") laidIdx = i; });
    if (laidIdx < 0) return false;
    return !led.some((e, i) => i > laidIdx && unitFlags.includes(e.set));
  }
  // 落定文本变体选择：发拍前按本局事实把条目正文/回响切到声明好的变体（原文存档在条目上，逐次重算、不累积）。
  // 优先级：再退变体（已全退过又复退）> 不点名单位变体（无当前单位事实）> 原文（首次落定）。
  const RETIRE_ORIG_TEXT = {}; // id -> { text, echo0 }
  function applyRetireVariant(id) {
    const it = (IFY.D.events || []).find((e) => e.id === id);
    if (!it) return;
    if (!RETIRE_ORIG_TEXT[id]) RETIRE_ORIG_TEXT[id] = { text: it.text, echo0: it.choices && it.choices[0] ? it.choices[0].echo : null };
    const orig = RETIRE_ORIG_TEXT[id];
    if (id === "proc_retire_full" && hasRetiredBefore() && it.textAgain) it.text = it.textAgain;
    else if (noCurrentUnit() && it.textNoUnit) it.text = it.textNoUnit;
    else it.text = orig.text;
    if (id === "proc_retire_node" && it.choices && it.choices[0]) {
      const c = it.choices[0]; // 「退下来」选项的回响：无单位事实时不走大门/工位口吻
      if (noCurrentUnit() && c.echoNoUnit) c.echo = c.echoNoUnit;
      else if (orig.echo0 != null) c.echo = orig.echo0;
    }
  }

  function workPhaseDue() {
    if (!IFY.S.route || !IFY.S.state || !IFY.S.state.workPhase) return null;
    syncRetireFinalSaid();
    syncPensionPaid();
    syncUnitGone();
    syncSelfHosp();
    syncGrandkidSeen();
    syncTrialDone();
    if (forkFiredThisYear()) return null; // 反向互锁：fork58 已在当年响过，进程拍当年不再决一次（结构上 fork 从不把人留在 working，此为显式保险）
    ensureRetirePlan();
    const wp = IFY.S.state.workPhase;
    const due = (id) => { if (!IFY.D.events.some((e) => e.id === id)) return null; applyRetireVariant(id); return { item: id }; };
    if (wp === "part" && typeof IFY.S.partAt === "number" && IFY.S.age - IFY.S.partAt >= (IFY.S.partYears || 2)) return due("proc_retire_full");
    if (wp === "working") {
      if (IFY.S.age >= 74) return due("proc_retire_auto");
      if (IFY.S.retirePlan && IFY.S.age >= IFY.S.retirePlan.nodeAge) {
        if ((IFY.S.retireDefers || 0) >= 2) return due("proc_retire_auto");
        return due("proc_retire_node");
      }
    }
    return null;
  }
  Object.assign(IFY, { WORK_FORMAL_FLAGS, WORK_INFORMAL_FLAGS, workForm, FORM_VALUES, FORM_OF_FLAG, formOf, mainEntryOf, mainEntryOfState, ENTRY_OPPORTUNITY_FLAGS, isEmployed, tenureYears, entrySwitchAge, ensureRetirePlan, workPhaseDue, syncRetireFinalSaid, syncPensionPaid, syncUnitGone, syncSelfHosp, syncGrandkidSeen, syncTrialDone, retireDecidedThisYear, forkFiredThisYear, hasRetiredBefore, hasRehireAfterRetire, noCurrentUnit });
})(window.IFY);
