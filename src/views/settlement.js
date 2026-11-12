// [模块]《如果那年》引擎分片：呈现层——结算（判词、标签、特殊结局、九槽、结算页）。独立模块（包装器 + window.IFY 共享命名空间），加载顺序见 index.html。
(function (IFY) {
  "use strict";
  // ---------- 结算 ----------
  // 判词升格（审议单 #6）：定调 verdictTone + 合议选维 verdictCouncil + 组装 verdict，三者
  // 都是「本局记录的纯函数」——只读终局已定格的 stats / statsPeak / statsLate / flags /
  // ledger / state / death / crisisUsed / usedRare / usedEvents，不掷主骰、不写状态；
  // 选段的随机走以种子派生的判词专属子流（种子 + "#verdict"，与 #birth: 同法），不消费
  // 任何游戏随机流。同一份记录重复求判词逐字一致；游戏轨迹零扰动。_verdict 记 v:2。
  const VDIM = ["health", "money", "growth", "freedom", "relation", "wisdom"]; // 固定维序（STAT_META 序）：一切并列的唯一打破口径，替代旧版并列抽骰
  const VINIT = { health: 60, money: 45, growth: 50, freedom: 50, relation: 50, wisdom: 40 }; // 六维初值（与 STAT_META 同值）：涨幅腿的原点
  const VDIM_NAME = { health: "身体", money: "钱", growth: "本事", freedom: "自由", relation: "关系", wisdom: "见识" }; // 轻提对并列模板的维度名
  const vPeakOf = (S, k) => { const p = S && S.statsPeak; return p && typeof p[k] === "number" ? p[k] : (S && S.stats && typeof S.stats[k] === "number" ? S.stats[k] : 0); };
  const vLateOf = (S, k) => { const l = S && S.statsLate; return l && typeof l[k] === "number" ? l[k] : null; };

  // 定调（纯函数）：只读账本派生事实与峰值形状，不读数值曲线（盘点 4.1/4.4 的定版规则 v2.1）。
  // aux 可预填 { view, ph, special }（verdict 主流程已算好的段视图/伴侣史/特殊结局，省重算）；
  // 单独调用（断言台架）时自行派生，special 只在 S 就是当前局时读 specialEnding()。
  function verdictTone(S, aux) {
    S = S || IFY.S; aux = aux || {};
    const view = aux.view !== undefined ? aux.view : playerFacts();
    const led = view ? view.ledger : (Array.isArray(S.ledger) ? S.ledger : []);
    const hasFlag = (f) => view ? (view.hasFact(f) || view.flagWitnessed(f)) : !!(S.flags && S.flags[f]);
    const fin = S.stats || {};
    const pk = (k) => vPeakOf(S, k);
    let drop = 0; for (const k of VDIM) drop += Math.max(0, pk(k) - (typeof fin[k] === "number" ? fin[k] : 0));
    // 变故数 ADV（每项 1 分）
    let adv = 0;
    const ph = aux.ph || partnerHistoryOf(view);
    if (ph.parts.some((p) => p.endKind === "widowed")) adv++;
    if (ph.parts.some((p) => p.endKind === "divorced")) adv++;
    if (hasFlag("laid_off")) adv++;
    if (S.crisisUsed && Object.keys(S.crisisUsed).length) adv++;
    if (led.some((e) => e.kind === "state" && (e.id === "dad>dead" || e.id === "mom>dead") && typeof e.age === "number" && e.age < 38)) adv++;
    if (S.death && S.death.type === "accident") adv++;
    if (S.death && typeof S.death.age === "number" && S.death.age < 65) adv++;
    if ((S.usedRare || []).length >= 2) adv++;
    if (pk("money") - (typeof fin.money === "number" ? fin.money : 0) >= 25) adv++;
    // 顺遂数 JOY（每项 1 分）
    let joy = 0;
    if (pk("relation") >= 90) joy++;
    if (["hobby_calligraphy", "hobby_photo", "hobby_fishing", "hobby_garden", "hobby_music", "hobby_run", "hobby_cook", "hobby_badminton"].some(hasFlag)) joy++;
    const dogSt = S.state && S.state.dog;
    if ((dogSt && dogSt !== "none") || hasFlag("dog_home") || (S.usedEvents || []).some((id) => id === "p11_054" || id === "p5_044" || id === "p13_055")) joy++;
    let special = aux.special;
    if (special === undefined) { special = false; if (S === IFY.S) { try { special = !!specialEnding(); } catch (e) { special = false; } } }
    if (special) joy++;
    if (pk("freedom") >= 85) joy++;
    if ((typeof fin.health === "number" ? fin.health : 0) >= 70 && pk("health") - fin.health <= 6) joy++;
    if (S.state && S.state.spouse === "partnered") joy++;
    // 判定序：壮阔 → 欢快 → 散文兜底（散文 = 两个签名都没有，平平静静本身即其义）
    let tone = "prose";
    if (adv >= 3 || (adv >= 2 && drop >= 22)) tone = "grand";
    else if ((adv <= 1 && joy >= 3) || (adv === 0 && joy >= 2 && drop <= 25)) tone = "joy";
    return { tone, adv, joy, drop };
  }

  // 合议选维（纯函数）：故事维三腿入选（峰值≥75 ∨ 涨幅≥25 ∨ 终局站位），按「峰值＋晚年
  // 加分（statsLate：60 岁后涨≥10 且终局≥60 的维 +4，只作排序、不当门）」取至多 2 维满句；
  // 钱的主线判定与封顶三条按盘点第三节定版（主线必提 / 非主线降轻提 / 唯一故事维保险丝）；
  // 低位侧 L1=钱且非主线走轻提对。返回 { full, light, cost, pair, moneyMain }：
  // full = 正面满句维（≤2）、light = [{k, kind:"story"|"low"}]、cost = 代价满句维或 null、
  // pair = 轻提对 [钱, 伙伴维] 或 null。
  function verdictCouncil(S) {
    S = S || IFY.S;
    const fin = S.stats || {};
    const fv = (k) => (typeof fin[k] === "number" ? fin[k] : 0);
    const pk = (k) => vPeakOf(S, k);
    const rise = (k) => pk(k) - VINIT[k];
    const dropK = (k) => pk(k) - fv(k);
    const isStory = (k) => pk(k) >= 75 || rise(k) >= 25 || (fv(k) >= 70 && dropK(k) <= 6);
    const lateBonus = (k) => { const l = vLateOf(S, k); return l !== null && fv(k) - l >= 10 && fv(k) >= 60; };
    const score = (k) => pk(k) + (lateBonus(k) ? 4 : 0);
    const byScore = VDIM.filter(isStory).sort((a, b) => (score(b) - score(a)) || (VDIM.indexOf(a) - VDIM.indexOf(b)));
    const moneyMain = (pk("money") >= 75 && rise("money") >= 25) || (pk("money") >= 70 && rise("money") >= 20 && dropK("money") >= 25);
    const lows = VDIM.slice().sort((a, b) => (pk(a) - pk(b)) || (VDIM.indexOf(a) - VDIM.indexOf(b)));
    const L1 = lows[0];
    const full = byScore.slice(0, 2);
    const light = [];
    const lightHas = (k) => light.some((x) => x.k === k);
    // 封顶 3（主线必提）：主线局钱还没被提到（不在正维、也不是最低维——最低维自有代价面）
    // → 钱占第二个正维位，被挤下去的那维降轻提。
    if (moneyMain && !full.includes("money") && L1 !== "money") {
      if (full.length >= 2) { const dis = full[1]; full[1] = "money"; light.push({ k: dis, kind: "story" }); }
      else full.push("money");
    }
    // 封顶 1：钱入选正面、非主线、且另有正维 → 钱降轻提，满句位让给下一位故事维；
    // 封顶 2（保险丝）：钱是唯一故事维时不降，保留满句。
    if (!moneyMain && full.includes("money") && full.length >= 2) {
      full.splice(full.indexOf("money"), 1);
      light.push({ k: "money", kind: "story" });
      const nxt = byScore.find((k) => !full.includes(k) && k !== "money");
      if (nxt) full.push(nxt);
    }
    // 一维都没入选（0.1% 量级）：回落最高峰维出满句，保证正面恒有满句。
    if (!full.length) full.push(VDIM.slice().sort((a, b) => (pk(b) - pk(a)) || (VDIM.indexOf(a) - VDIM.indexOf(b)))[0]);
    // 低位侧：自 L1 起找第一个不在正维里的维。
    let cost = null, pair = null;
    for (const cand of lows) {
      if (full.includes(cand)) continue;
      if (cand === "money" && !moneyMain) {
        // 轻提对：钱与次低维并列轻提，钱不独占代价满句。伙伴只许取还没被提到的维——
        // 已降为故事轻提的维不再进低位对（同维两提且口吻打架），顺延下一位；无伙伴时钱单独轻提。
        if (!lightHas("money")) light.push({ k: "money", kind: "low" });
        const partner = lows.find((k2) => k2 !== "money" && !full.includes(k2) && !lightHas(k2));
        if (partner) { light.push({ k: partner, kind: "low" }); pair = ["money", partner]; }
        cost = null;
        break;
      }
      cost = cand;
      break;
    }
    return { full, light, cost, pair, moneyMain, lows };
  }

  function verdict() {
    if (IFY.S._verdict) return IFY.S._verdict;
    const S = IFY.S;
    // 判词专属子流：自本局种子派生，每次求判词都从头起算——抽数与顺序只由记录决定。
    const vst = { a: IFY.seedFromString(String(S.seedStr || "") + "#verdict") };
    const vrng = () => IFY.mulberry(vst);
    // F1/F2（v0.17.0）：片段先按 needs 对本局事实过滤再抽；过滤后为空回落中性片段（无 needs 者），事实不许将就
    // AN-5 R7：交换局判词改段口径——factOk 本体（scheduler.js，事件调度在用）口径不动；
    // 本函数内另建段版：flag/anyFlag 按段见证判（任一段成立过即算），notFlag/notAnyFlag 按
    // 「任一段都没见证过」判（负向门防的是把交出段发生过的事断言成没发生过），state/stateNot/
    // eraIn 仍读终局身体（状态类句子说的是终局形状，与九槽口径一致）。未交换局（view 为 null）
    // 走 IFY.factOk 原路，逐字不变。
    const view = playerFacts();
    const factOkSeg = view ? (needs) => {
      if (!needs) return true;
      const wit = (f) => view.hasFact(f) || view.flagWitnessed(f);
      if (needs.flag && !wit(needs.flag)) return false;
      if (needs.notFlag && wit(needs.notFlag)) return false;
      if (needs.anyFlag && !needs.anyFlag.some(wit)) return false;
      if (needs.notAnyFlag && needs.notAnyFlag.some(wit)) return false;
      if (needs.state) for (const [dom, vals] of Object.entries(needs.state)) if (!vals.includes(IFY.S.state[dom])) return false;
      if (needs.stateNot) for (const [dom, vals] of Object.entries(needs.stateNot)) if (vals.includes(IFY.S.state[dom])) return false;
      if (needs.eraIn && !needs.eraIn.includes(IFY.S.era)) return false;
      return true;
    } : IFY.factOk;
    // 判词批 B：singlePartner 门（片段级 needs 键，只判词消费）——预设「陪到老的另一半是
    // 同一个人」的片段，伴侣史多任（partnerHistoryOf 回放 parts ≥ 2）的局不许抽。离婚在
    // 现行旗里没有专属旗（旧旗 divorced / spouse_dead 是 v0.11 时代物，validate-state 已明令
    // 数据不得再用），光靠片段上的 notFlag spouse_passed 只挡得住丧偶史，离异史须在此按账本
    // 回放复合判定。历史不可知（无账本老档）时放行，与九槽老档回落现行文案的口径一致。
    const phVerdict = partnerHistoryOf(view);
    const factOkHere = (needs) => {
      if (!factOkSeg(needs)) return false;
      if (needs && needs.singlePartner && phVerdict.known && phVerdict.parts.length >= 2) return false;
      return true;
    };
    const toneR = verdictTone(S, { view, ph: phVerdict });
    const tone = toneR.tone;
    const C = verdictCouncil(S);
    // 选段：事实门（needs）+ 终局断言硬门（minFinal）在先，调偏向在内——先按本调标记挑，
    // 没有再落无标记段，再落回事实门全集、无预设段、全池（旧回落链同形）。minFinal 是硬
    // 门：先于一切回落过滤，任何一层都不许越过（断言终局身体的段，终局对不上永不出）。
    const fragT = (f) => (typeof f === "string" ? f : f.t);
    const fragTone = (f) => (typeof f === "string" ? null : f.tone || null);
    const pickCands = (pool) => {
      const hardOk = (f) => { const mf = typeof f === "string" ? null : f.minFinal; if (!mf) return true; return Object.entries(mf).every(([k, v]) => (typeof S.stats[k] === "number" ? S.stats[k] : 0) >= v); };
      let base = pool.map((f, i) => [f, i]).filter(([f]) => hardOk(f));
      if (!base.length) base = pool.map((f, i) => [f, i]); // 理论不可达（每池都留无门兜底段）；真空了宁可全池，不许判词缺句
      const layers = [
        base.filter(([f]) => factOkHere(typeof f === "string" ? null : f.needs) && (tone === "prose" ? !fragTone(f) : fragTone(f) === tone)),
        base.filter(([f]) => factOkHere(typeof f === "string" ? null : f.needs) && !fragTone(f)),
        base.filter(([f]) => factOkHere(typeof f === "string" ? null : f.needs)),
        base.filter(([f]) => typeof f === "string" || !f.needs),
        base,
      ];
      return layers.find((l) => l.length) || base;
    };
    const pickF = (pool) => {
      if (!Array.isArray(pool)) return { text: pool, idx: 0 };
      const cands = pickCands(pool);
      const [f, i] = cands[Math.floor(vrng() * cands.length)];
      return { text: fragT(f), idx: i };
    };
    // 篇幅兜底专用：同一候选层里取最短一段（同长取先）——只在满句叠满仍超 110 时换段，不掷骰。
    const pickShort = (pool) => {
      if (!Array.isArray(pool)) return { text: pool, idx: 0 };
      const cands = pickCands(pool);
      let best = cands[0];
      for (const ci of cands) if (fragT(ci[0]).length < fragT(best[0]).length) best = ci;
      return { text: fragT(best[0]), idx: best[1] };
    };
    const pickFrame = (pool) => {
      if (!Array.isArray(pool) || !pool.length) return "";
      return pool[Math.floor(vrng() * pool.length)];
    };
    // 组装序（抽序恒定，只由记录决定）：开场框架 → 正面满句（合议序）→ 故事轻提 →
    // 代价满句或低位轻提（轻提对优先并列成句、其余低位轻提逐句）→ 收尾框架。
    const D = IFY.D;
    const openT = pickFrame(D.verdictFrame && D.verdictFrame.open && D.verdictFrame.open[tone]);
    let fullPicks = C.full.map((k) => ({ k, pick: pickF(D.verdictTop[k]) }));
    const storyLightT = C.light.filter((x) => x.kind === "story").map((x) => (D.verdictLightStory || {})[x.k] || "").filter(Boolean);
    let costPick = C.cost ? pickF(D.verdictCost[C.cost]) : null;
    let lowT = [];
    if (C.pair) {
      const tpl = pickFrame(D.verdictLightPair);
      lowT = [tpl.replace("{a}", VDIM_NAME[C.pair[0]]).replace("{b}", VDIM_NAME[C.pair[1]])];
    } else {
      lowT = C.light.filter((x) => x.kind === "low").map((x) => (D.verdictLightLow || {})[x.k] || "").filter(Boolean);
    }
    const closeT = pickFrame(D.verdictFrame && D.verdictFrame.close && D.verdictFrame.close[tone]);
    // 篇幅硬线 ≤110 字：超线按序处理——撤收尾框架 → 撤开场框架 → 代价换同层最短段 →
    // 第二满句换最短段 → 撤故事轻提 → 撤低位轻提 → 第一满句换最短段（最后兜底）。
    // 换段优先于撤轻提：提及维度是本片的账，段内换哪一段只是选材；全程只看总长与
    // 段长，是记录的确定性函数。_verdict.light 只记真正活进文本的轻提（被裁掉的不算
    // 「提到」，普查口径按文本算）。
    const build = (o, s, l, c) => [o ? openT : "", ...fullPicks.map((x) => x.pick.text), ...(s ? storyLightT : []), ...(costPick ? [costPick.text] : []), ...(l ? lowT : []), c ? closeT : ""].filter(Boolean).join("");
    let text = build(true, true, true, true);
    let dropS = false, dropL = false;
    if (text.length > 110) text = build(true, true, true, false);
    if (text.length > 110) text = build(false, true, true, false);
    if (text.length > 110 && costPick) { costPick = pickShort(D.verdictCost[C.cost]); text = build(false, true, true, false); }
    if (text.length > 110 && fullPicks.length > 1) { fullPicks[1] = { k: fullPicks[1].k, pick: pickShort(D.verdictTop[fullPicks[1].k]) }; text = build(false, true, true, false); }
    if (text.length > 110) { dropS = true; text = build(false, false, true, false); }
    if (text.length > 110) { dropL = true; text = build(false, false, false, false); }
    if (text.length > 110 && fullPicks.length) { fullPicks[0] = { k: fullPicks[0].k, pick: pickShort(D.verdictTop[fullPicks[0].k]) }; text = build(false, false, false, false); }
    const lightShown = C.light.filter((x) => (x.kind === "story" ? !dropS : !dropL)).map((x) => x.k);
    IFY.S._verdict = {
      v: 2, text, tone, adv: toneR.adv, joy: toneR.joy,
      full: C.full.slice(), light: lightShown, cost: C.cost, pair: C.pair, moneyMain: C.moneyMain,
      top: C.full[0] || null, bottom: C.cost,
      topIdx: fullPicks.length ? fullPicks[0].pick.idx : 0, costIdx: costPick ? costPick.idx : -1,
    };
    return IFY.S._verdict;
  }
  // ---------- 事实标签行（v0.11.0） ----------
  // 只从本局事实取材，三段为限、纯描述：①路线与人生形状（落脚终点由居所轨迹单一派生，旗标只作质地修饰——AN-5 R2）②一条最有分量的轨迹（按下方优先级取第一条有旗标/日志证据的，无证据不生成）③晚年与家庭收尾。
  // 无稀有度、无档位；不复述特殊结局名；纯函数（不耗 rng），同局在结算页与分享卡恒一致。
  function lifeTags() {
    const F = IFY.S.flags, used = IFY.S.usedEvents, out = [];
    // CL-140b：富贵深面孔轨迹签——与钱槽深面孔同门（(D) 门：持 traj_fortune_*/traj_ipo、
    // 终局 money≥55 且坐实年龄 ≤47；坐实年龄取 IFY.S.flagAges 里富贵旗的最早落点，口径见钱槽注）。
    const FD_FA = IFY.S.flagAges || {};
    let fdFirmAge = null;
    for (const k of Object.keys(F)) if (F[k] && (k.indexOf("traj_fortune_") === 0 || k === "traj_ipo") && typeof FD_FA[k] === "number") fdFirmAge = fdFirmAge === null ? FD_FA[k] : Math.min(fdFirmAge, FD_FA[k]);
    const fortuneDeep = fdFirmAge !== null && fdFirmAge <= 47 && ((IFY.S.stats || {}).money || 0) >= 55;
    const trail = typeof IFY.settledOf === "function" ? IFY.settledOf(IFY.S) : IFY.residenceTrail(); // v0.18.0：形状段改读实际居所轨迹（账本里的路线起点与迁徙记录），不再只凭路线与旗标
    // v0.24.4（AN-2）：形状只认轨迹终点与段长，旧版的裸旗回落段整段删除——back_home_stay 这类
    // 只增不减的旗会把「回老家住一阵」读成终局形状，与落脚槽（读轨迹）在同一屏打架（B85-04 实锤）。
    // 映射表（轨迹形状 → 标签，旧标签词全保留）：终点老家且在外≥5年＝最后回了老家；终点国外＝
    // 在异乡扎下根；终点城市＝在异乡扎下根，唯「城市→城市搬家」轨迹看不见（同为 city 段），
    // moved_city 旗是唯一证据且只断言过去搬过家，单独保留这一条旗读；终点老家且在外<5年＝
    // 按 near_family/often_back/路线默认收尾。
    let shape = "";
    if (trail.final === "home" && trail.spans.city + trail.spans.abroad >= 5) shape = "最后回了老家";
    else if (trail.final === "abroad") shape = "在异乡扎下根";
    else if (trail.final === "city" && F.moved_city && trail.spans.home + trail.spans.abroad === 0 && trail.start === "city") shape = "换过城市生活";
    else if (trail.final === "city") shape = "在异乡扎下根";
    else if (trail.final === "home" && F.near_family) shape = "守在家人近处";
    else if (F.often_back) shape = "一直没断了回老家的路";
    else shape = { corp: "去大城市闯过", home: "留在家乡过日子", abroad: "去远方生活过", study: "多读了几年书", gap: "停过一年再出发", farm: "留在村里种地" }[IFY.S.route.id] || "";
    if (shape) out.push(shape);
    const traj = [
      [used.includes("p11_054"), "送走过一条狗"],
      [used.includes("p5_044") || used.includes("p13_055"), "送走过一只猫"],
      [!!F.care_self, "把工作放一放，回去陪过父母"],
      [!!F.laid_off, "下过岗，又重新站住"],
      [!!F.xiahai, "下过海"],
      [!!F.exam_landed, "考进过体制内"],
      [!!F.stock_2008, "在六千点那年跟过风"],
      [!!F.crypto_old, "早年倒腾过一阵币"],
      [!!F.stall_breakfast, "摆过早点摊"],
      [!!F.kid_abroad, "把孩子送到了国外"],
      [!!F.two_cities, "过过两地奔波的日子"],
      [!!F.long_dist, "和对方两地过"],
      [!!(F.side_business || F.side_start || F.side_job), "正职之外干过副业"],
      [fortuneDeep, "钱攒到后来，成了个数字"], // CL-140：深面孔签——位置在副业之后、CL-135 三行之前（钱的大事重于理财小节）
      [!!F.dca, "定投过一只基金"], // CL-135（路线总账 P3）：孤旗接判词——三行均追加在表尾、最低优先，仅高于其后的爱好兜底
      [!!F.loan_swap, "折腾过一回房贷"],
      [!!F.badminton_captain, "张罗过一支羽毛球局"],
      [!!F.stayed_put, "守着老地方，没挪窝"], // CL-145（路线总账 P4）：晚年结果旗 32 面接判词——追加在 CL-135 三行之后、同为表尾低优先；另 5 旗（shop_grew/grandkid_kept/kin_far_visit/skill_passed/moved_near_kid）走 pack135 回响拍，不在此表
      [!!F.kin_far_video, "在视频里看着孙辈长大"],
      [!!F.kin_topup, "住到儿女家顶过班"],
      [!!F.grandkid_rest, "放下带娃，歇个清静"],
      [!!F.grandkid_help, "接送孙辈、管晚饭"],
      [!!F.grandkid_paid, "出钱请人带孙辈"],
      [!!F.shop_regulars, "修椅子修出了熟客"],
      [!!F.shop_begun, "退休后开过一间小店"],
      [!!F.stall_begun, "退休后支过一个小摊"],
      [!!F.stream_craft, "开直播讲过老本行"],
      [!!F.stream_cook, "直播里教过做饭"],
      [!!F.stream_chat, "直播里陪人聊老事"],
      [!!F.stream_fun, "拒了带货，只陪人聊天"],
      [!!F.travel_group, "退休后跟团走过几趟"],
      [!!F.travel_pair, "两个人，慢慢走过些地方"],
      [!!F.travel_near, "近处的好地方没少去"],
      [!!F.cruise_near, "坐船出去走过一趟"],
      [!!F.cruise_train, "没坐船，改坐了慢火车"],
      [!!F.winter_again, "去暖和地方过过两个冬"],
      [!!F.winter_home, "冬天就守在自己这边"],
      [!!F.class_photo, "在老年大学学过摄影"],
      [!!F.class_write, "在老年大学练过书法"],
      [!!F.class_sing, "在老年大学唱过合唱"],
      [!!F.class_kept, "老了还在老年大学上课"],
      [!!F.class_paused, "老年大学先歇了一学期"],
      [!!F.unit_visit, "老同事的聚会场场到"],
      [!!F.garden_shared, "种的菜常分给邻居"],
      [!!F.garden_small, "种了一小畦自己吃的菜"],
      [!!F.house_kept, "老屋没大修，自己鼓捣"],
      [!!F.old_friends_met, "八十岁还赴老朋友的约"],
      [!!F.exercise_kept, "晨练坚持了好几年"],
      [!!F.pet_old_friend && !!(IFY.S.state && IFY.S.state.cat && IFY.S.state.cat !== "none"), "陪一只老猫一起变老"],
      [!!F.pet_old_friend && !!(IFY.S.state && IFY.S.state.dog && IFY.S.state.dog !== "none"), "陪一条老狗一起变老"]
    ];
    let t2 = "";
    for (const [ok, label] of traj) if (ok) { t2 = label; break; }
    if (!t2 && IFY.finalAge() >= 55) {
      const HOB = { hobby_calligraphy: "书法", hobby_photo: "摄影", hobby_fishing: "钓鱼", hobby_garden: "种菜", hobby_music: "音乐", hobby_run: "跑步", hobby_cook: "做饭", hobby_badminton: "羽毛球" };
      const hk = Object.keys(HOB).find((k) => F[k]);
      if (hk) t2 = HOB[hk] + "陪了大半辈子";
    }
    if (!t2 && IFY.S.state && IFY.S.state.dog !== "none") t2 = "养过一条狗"; // v0.12.0：旗标时代 dog_home 立后不清（在养/已离世都算养过），状态读法等价取 ≠none
    if (!t2 && typeof IFY.housingOf === "function" && IFY.housingOf(IFY.S).owned) t2 = IFY.housingOf(IFY.S).owned === "selfbuilt" ? "亲手盖起一栋房" : "供过一套房"; // 自建房没「供」过——是自己动手盖起来的 // v0.24.4：改读住房派生（旧版只认 bought_house 一面旗，商品房/房改/集资买家全漏）
    if (t2) out.push(t2);
    const res = trail.final === "home" ? "家乡" : trail.final === "abroad" ? "异国" : "异乡"; // v0.18.0：「终老在异国」只在居所轨迹终点确为异国时才写
    let close = "";
    const ST = IFY.S.state || {}; // v0.12.0：收尾段改读状态矩阵（原旗标读法在离异/丧偶后因旗不清会误判，现按当前状态）
    // 判词批 B：收尾段认伴侣史——多任史时单任口径（「和老伴走完这一生」「老伴先走」）会把
    // 前任抹掉，按前任的终结方式改写；任一前任方式不可知、单任史、无账本老档，一律回落原句。
    const phT = partnerHistoryOf(playerFacts());
    const prevsT = phT.known && phT.parts.length >= 2 ? phT.parts.slice(0, -1) : null;
    const prevsTok = prevsT && prevsT.every((p) => p.endKind === "widowed" || p.endKind === "divorced") ? prevsT : null;
    const tW = prevsTok ? prevsTok.some((p) => p.endKind === "widowed") : false;
    const tD = prevsTok ? prevsTok.some((p) => p.endKind === "divorced") : false;
    const widowedClose = !prevsTok ? "老伴先走，最后一段自己过"
      : prevsTok.length === 1 && tW ? "两位老伴都先走，最后一段自己过"
      : prevsTok.length === 1 ? "头一段散了，后一位先走，最后一段自己过"
      : tW && tD ? "有散的，也有先走的，最后一段自己过"
      : tW ? "陪着的人都先走了，最后一段自己过"
      : "前头几段都散了，后一位也先走，最后一段自己过";
    const divorcedClose = (kids) => !prevsTok ? (kids ? "后来一个人把孩子带大" : "后来一个人过")
      : prevsTok.length === 1 && tW ? (kids ? "老伴先走，后来一个人把孩子带大" : "老伴先走，后一段也散了，后来一个人过")
      : prevsTok.length === 1 ? (kids ? "两段都散了，后来一个人把孩子带大" : "两段婚姻都散了，后来一个人过")
      : (kids ? "几经离合，后来一个人把孩子带大" : "几经离合，后来一个人过");
    const partneredPrefix = !prevsTok ? ""
      : prevsTok.length === 1 && tW ? "送走过一位，后来"
      : prevsTok.length === 1 ? "头一段散了，后来"
      : tW && tD ? "几经离合，后来"
      : tW ? "陪着的人都先走了，后来"
      : "前头几段都散了，后来";
    if (ST.spouse === "widowed") close = widowedClose;
    else if (ST.spouse === "divorced" && ST.kids === "has") close = divorcedClose(true);
    else if (ST.spouse === "divorced") close = divorcedClose(false);
    else if (ST.spouse === "partnered" && F.kid_abroad) close = partneredPrefix + "和老伴相伴，儿女在远方";
    else if (ST.spouse === "partnered" && ST.kids === "has") close = partneredPrefix + "和老伴、儿女一起走完";
    else if (ST.spouse === "partnered") close = partneredPrefix + "和老伴走完这一生";
    else if (ST.kids === "has") close = "儿女陪着走完";
    else if (ST.spouse === "single") close = "一个人走完这一生";
    else close = IFY.S.death ? "最后住在" + res : "终老在" + res;
    out.push(close);
    return out.join(" · ");
  }

  // 分岔「本局选了哪一项」（结算年表与差一步共用同一读法：查本局日志行）
  // 日志行写的是呈现口径的标签（spouse 变体 / 形态 labelForm 变体），反查须把变体集合一并认下，只认原文会漏掉变体局。
  function chosenFromLog(logArr, f) {
    const variants = (c) => [c.label, ...Object.values(c.labelBySpouse || {}), ...Object.values(c.labelForm || {})];
    const line = (Array.isArray(logArr) ? logArr : []).find((l) => typeof l === "string" && l.startsWith(`${f.age} 岁 · `) && f.choices.some((c) => variants(c).some((v) => v && l.endsWith(`：${v}`))));
    return line ? line.slice(line.lastIndexOf("：") + 1) : "";
  }
  function chosenOfFork(f) {
    return chosenFromLog(IFY.S && IFY.S.log, f);
  }
  // v0.22 WP7：段版反查——在指定 Track 的 state.log 里查（道路图段脊线与分段 faced 判定用）。
  function chosenOfForkIn(state, f) {
    return chosenFromLog(state && state.log, f);
  }

  // ---------- 段事实视图 playerFacts（v0.22 WP7，蓝图 7.3） ----------
  // 未交换（无 session / !meta.swapped / controlLog 段数 <2 / 段引用的 Track 缺失）恒返回 null：
  // 全部调用方在 null 时走既有原读法一字不动——未交换局结算与现行逐字一致是硬线。
  // 交换后返回段视图：segments（每段 track/state/fromAge/toAge，末段 toAge 取该 Track 终局岁）、
  // mergedLedger / mergedLog（各段按 [fromAge,toAge] 切片、按 age 稳定排序；swap 账落在交换岁、
  // 两段切片都含它）、hasFact（merged ledger 里 id 或 set 命中）、flagWitnessed（分段见证判，见下）、
  // domainEnd（见证终局，见下）、stateWitnessed / covenant（跨段查的辅助口）。
  const DOMAIN_INITIAL = { dad: "alive", mom: "alive", spouse: "none", kids: "undecided", workPhase: "working" };
  function domainInitial(dom) {
    if (dom in DOMAIN_INITIAL) return DOMAIN_INITIAL[dom];
    try { const ini = typeof IFY.initialState === "function" ? IFY.initialState() : null; if (ini && dom in ini) return ini[dom]; } catch (e) {}
    return undefined;
  }
  function playerFacts() {
    const ses = IFY.session;
    if (!ses || !ses.tracks || !ses.meta || !ses.meta.swapped) return null;
    const clog = Array.isArray(ses.meta.controlLog) ? ses.meta.controlLog.filter((s) => s && (s.track === "A" || s.track === "B")) : [];
    if (clog.length < 2) return null;
    const segs = [];
    for (let i = 0; i < clog.length; i++) {
      const entry = ses.tracks[clog[i].track];
      if (!entry || !entry.state) return null; // 段引用的 Track 缺失：视图不成立，调用方回落原读法
      const st = entry.state;
      const isLast = i === clog.length - 1;
      const fromAge = typeof clog[i].fromAge === "number" ? clog[i].fromAge : (IFY.START_AGE || 22);
      let toAge = typeof clog[i].toAge === "number" ? clog[i].toAge : null;
      if (isLast) toAge = st.death ? st.death.age : (typeof st.age === "number" ? st.age : (IFY.MAX_AGE || 80)); // 末段 toAge 取该 Track 终局岁
      else if (toAge == null) toAge = typeof clog[i + 1].fromAge === "number" ? clog[i + 1].fromAge : fromAge;
      segs.push({ track: clog[i].track, state: st, trackState: st, entry, fromAge, toAge });
    }
    // 各段切片（账本与流水同口径：[fromAge,toAge] 闭区间；带原始次序供稳定排序）
    const segLedgers = segs.map((seg) => (Array.isArray(seg.state.ledger) ? seg.state.ledger : []).filter((e) => e && typeof e.age === "number" && e.age >= seg.fromAge && e.age <= seg.toAge));
    const segLogs = segs.map((seg) => (Array.isArray(seg.state.log) ? seg.state.log : []).filter((l) => { const m = typeof l === "string" && l.match(/^(\d+) 岁 · /); return m && +m[1] >= seg.fromAge && +m[1] <= seg.toAge; }));
    const mergedLedger = [];
    segLedgers.forEach((led, si) => led.forEach((e, ei) => mergedLedger.push({ e, si, ei })));
    mergedLedger.sort((a, b) => (a.e.age - b.e.age) || (a.si - b.si) || (a.ei - b.ei));
    const mergedLogArr = [];
    segLogs.forEach((lines, si) => lines.forEach((l, ei) => mergedLogArr.push({ l, si, ei, age: +l.match(/^(\d+) 岁 · /)[1] })));
    mergedLogArr.sort((a, b) => (a.age - b.age) || (a.si - b.si) || (a.ei - b.ei));
    const view = {
      segments: segs, segmentLedgers: segLedgers, segmentLogs: segLogs,
      ledger: mergedLedger.map((x) => x.e),
      mergedLedger: mergedLedger.map((x) => x.e),
      log: mergedLogArr.map((x) => x.l),
      mergedLog: mergedLogArr.map((x) => x.l),
    };
    view.hasFact = (id) => view.mergedLedger.some((e) => e.id === id || e.set === id);
    // 分段见证：某段见证某旗 = 该段切片账本有 set=该旗，或该段 Track 的 flagAges 落段内，
    // 或该段为末段且该旗现存于末段 Track（换入身体既有的旗，是玩家接手后要过的日子的一部分）。
    const segWitnesses = (si, flag) => {
      const seg = segs[si], st = seg.state, isLast = si === segs.length - 1;
      if (segLedgers[si].some((e) => e.set === flag)) return true;
      const fa = st.flagAges && typeof st.flagAges[flag] === "number" ? st.flagAges[flag] : null;
      if (fa != null && fa >= seg.fromAge && fa <= seg.toAge) return true;
      if (isLast && st.flags && st.flags[flag]) return true;
      return false;
    };
    view.segWitnesses = segWitnesses;
    view.flagWitnessed = (a, b) => {
      if (b !== undefined) { // 双参 (trackState, flag)：第一参定位段（段对象 / Track state 对象 / track 键）
        const flag = b;
        let si = -1;
        if (typeof a === "string") si = segs.findIndex((s) => s.track === a);
        else if (a && Array.isArray(a.segmentLedgers) === false && a.state && typeof a.fromAge === "number") si = segs.indexOf(a);
        else if (a) si = segs.findIndex((s) => s.state === a);
        if (si >= 0) return segWitnesses(si, flag);
        if (a && a.flags) return !!a.flags[flag]; // 定位不到段的裸 state：只认现存
        return false;
      }
      return segs.some((_, si) => segWitnesses(si, a));
    };
    // 见证终局（三级口径，理由见 wp7 日志）：段切片内最后一条该域流转 → 无流转时读末段终局 state → 回落初始值。
    view.domainEnd = (dom) => {
      let val, found = false;
      for (let si = 0; si < segs.length; si++) for (const e of segLedgers[si]) {
        if (e.kind === "state" && typeof e.id === "string" && e.id.startsWith(dom + ">")) { val = e.id.slice(dom.length + 1); found = true; }
      }
      if (found) return val;
      const lastSt = segs[segs.length - 1].state;
      if (lastSt.state && lastSt.state[dom] !== undefined) return lastSt.state[dom];
      return domainInitial(dom);
    };
    // 某域某值在任一段内成立过：段切片有该流转，或末段终局 state 就是该值，或段内流转推得的段末值是该值。
    view.stateWitnessed = (dom, v) => {
      for (let si = 0; si < segs.length; si++) {
        let cur = domainInitial(dom);
        for (const e of segLedgers[si]) if (e.kind === "state" && typeof e.id === "string" && e.id.startsWith(dom + ">")) cur = e.id.slice(dom.length + 1);
        if (segLedgers[si].some((e) => e.kind === "state" && e.id === dom + ">" + v)) return true;
        if (si === segs.length - 1 && segs[si].state.state && segs[si].state.state[dom] === v) return true;
        if (cur === v && segLedgers[si].some((e) => e.kind === "state" && typeof e.id === "string" && e.id.startsWith(dom + ">"))) return true;
      }
      return false;
    };
    // 立约跨段查：任一段 Track 的 covenant，其 since 落段内、或它长在末段 Track 上（换入身体在身的约），都算玩家这边的约；
    // 多段都有时取时间序最后一份（后一段的约是玩家最后在过的那份）。
    view.covenant = () => {
      let cov = null;
      segs.forEach((seg, si) => {
        const c = seg.state.covenant;
        if (!c) return;
        const isLast = si === segs.length - 1;
        if (isLast || (typeof c.since === "number" && c.since >= seg.fromAge && c.since <= seg.toAge)) cov = c;
      });
      return cov;
    };
    return view;
  }

  // ---------- 职业轨迹（v0.20.0 M2 结算事实对账）：入行旗按行当归组读账本 ----------
  // 医护一线四旗同源（med_work 乡镇线 / med_hosp 入行拍 + nurse_work/img_work 分科支）归一组，
  // 不按旗数误判漂移；其余入行旗各算一行当。改行类事实（数控再培训/新产线再培训/下海）单列：
  // 任一命中即不再算「一辈子一行」。跳槽（job_hop）只换东家不换行当，不入改行列（登记于 slots 审表）。
  const OCC_MED = ["med_work", "med_hosp", "nurse_work", "img_work"];
  const OCC_SINGLE = ["factory_work", "craft_work", "miner_work", "fab_work", "shop_work", "gig_work", "courier_work", "farm_work", "teach_work", "acct_work", "care_work", "write_work", "heavy_work", "dev_work", "press_work", "driver_taxi", "fin_work", "truck_work", "took_over_job", "exam_landed"];
  const OCC_CHANGE = ["p20_cnc_retrain", "p20_newline_trained", "xiahai"];
  // 账本里的明确转行事实（v0.20.1 返修）：条目本身没有入行旗，但正文就是一次换行当——
  // p2_022「转行一年，新工作的收入只有原来的六成」、p17_015「你转行去了房产中介」。
  const OCC_CHANGE_FACTS = ["p2_022", "p17_015"];
  function occupationTrail() {
    const F = IFY.S.flags || {};
    const lines = [];
    if (OCC_MED.some((f) => F[f])) lines.push("med");
    for (const f of OCC_SINGLE) if (F[f]) lines.push(f);
    // 入行旗之外的成段行当（v0.20.1 返修，审计 run-03）：网贷地推立的是经历旗 p19_p2p_in、不在入行旗表里，
    // 此前不计数——run-03 这类「地推几年又去做批发」的局因此被误判单行当。地推/销售单列一组。
    if (F.p19_p2p_in) lines.push("p19_p2p_in");
    // 副业形态（v0.20.1 返修）：已有主行当时，副业是第二摊活儿，算另一行——不再算「一辈子就干这一行」。
    if (lines.length && (F.side_start || F.side_job || F.side_business)) lines.push("side");
    const change = OCC_CHANGE.filter((f) => F[f]);
    for (const id of OCC_CHANGE_FACTS) if (typeof IFY.hasFact === "function" ? IFY.hasFact(id) : F[id]) change.push(id);
    const ages = IFY.S.flagAges || {};
    let entryAge = null;
    for (const f of [...OCC_MED, ...OCC_SINGLE]) if (F[f] && typeof ages[f] === "number") entryAge = entryAge == null ? ages[f] : Math.min(entryAge, ages[f]);
    return {
      lines, change, entryAge,
      drift: lines.length >= 2 || change.length > 0,
      // AN-5 R3：入行旗只覆盖成年段，「一辈子」的辖域还含序章——少年轨是打工形（state.track="work"，
      // 杂工拼盘）时不判 single，落回事业槽中性支（只往少说收，不误伤真单行）。
      single: lines.length === 1 && !change.length && (entryAge == null || entryAge <= 42) && !(IFY.S.state && IFY.S.state.track === "work"),
      none: lines.length === 0,
    };
  }

  // 职业轨迹段版（v0.22 WP7）：与 occupationTrail 同一张 OCC 表、同一种归组，入行旗/改行事实改按段见证口径汇总——
  // 原人生段里入过的行、接管段里入过的行都算玩家的行当；Bot 在玩家离场后给交出 Track 立的旗不算（flagWitnessed 分段判）。
  // entryAge 取各段见证旗在其 Track flagAges 里的最小落点。occupationTrail() 无参行为一字不动，未交换局仍走它。
  function occupationTrailFromFacts(view) {
    const lines = [];
    if (OCC_MED.some((f) => view.flagWitnessed(f))) lines.push("med");
    for (const f of OCC_SINGLE) if (view.flagWitnessed(f)) lines.push(f);
    if (view.flagWitnessed("p19_p2p_in")) lines.push("p19_p2p_in");
    if (lines.length && ["side_start", "side_job", "side_business"].some((f) => view.flagWitnessed(f))) lines.push("side");
    const change = OCC_CHANGE.filter((f) => view.flagWitnessed(f));
    for (const id of OCC_CHANGE_FACTS) if (view.hasFact(id)) change.push(id);
    let entryAge = null;
    for (const seg of view.segments) {
      const ages = seg.state.flagAges || {};
      for (const f of [...OCC_MED, ...OCC_SINGLE]) {
        if (!view.flagWitnessed(seg.state, f)) continue;
        if (typeof ages[f] === "number") entryAge = entryAge == null ? ages[f] : Math.min(entryAge, ages[f]);
      }
    }
    // AN-5 R3（段版同门）：少年轨两段共享同一序章，读末段 Track 的 state.track 即可；打工形不判 single。
    const lastSegState = view.segments.length ? view.segments[view.segments.length - 1].state : null;
    const teenTrack = lastSegState && lastSegState.state ? lastSegState.state.track : null;
    return {
      lines, change, entryAge,
      drift: lines.length >= 2 || change.length > 0,
      single: lines.length === 1 && !change.length && (entryAge == null || entryAge <= 42) && teenTrack !== "work",
      none: lines.length === 0,
    };
  }

  // ---------- 年表「差一步」（v0.20.0 M2）：只差一项的未落定结局与未遇分岔 ----------
  // 计算只读既有求值（met/evidenceCount/unmetConditions），不掷骰、不改状态；文案按回望口径写，
  // 数值门写具体数（结算后回望、防迷路）。差两项以上、未走过的普通事件，一律不显示。
  function flagStepLabel(flag) {
    const ms = IFY.REG && IFY.REG.milestones ? IFY.REG.milestones[flag] : null;
    for (const id of (ms && ms.setters) || []) {
      const r = (IFY.D.rare || []).find((x) => x.id === id);
      if (r && r.label) return r.label;
    }
    return null;
  }
  function missText(d) {
    const name = (k) => { const m = (IFY.STAT_META || []).find(([kk]) => kk === k); return m ? m[1] : k; };
    switch (d.kind) {
      case "stat": return d.gt !== undefined && d.gt != null ? `${name(d.stat)}没过 ${d.gt}` : `${name(d.stat)}没压到 ${d.lt} 以下`;
      case "flag": { const lb = flagStepLabel(d.flag); return lb ? `还没走到那一步：${lb}` : "有段经历没赶上"; }
      case "anyFlag": { for (const f of d.flags) { const lb = flagStepLabel(f); if (lb) return `还没走到那一步：${lb}`; } return "有段经历没赶上"; }
      case "forbidFlag": return "有件事先定下了，路就岔开了";
      case "state":
        if (d.dom === "spouse" && d.need.includes("partnered")) return "身边得有个人陪着";
        if (d.dom === "kids" && d.need.includes("has")) return "得有孩子";
        if (d.dom === "kids" && d.need.includes("none")) return "孩子的事得定下来不要";
        if (d.dom === "workPhase" && d.need.includes("retired")) return "得先退下来";
        return "眼下的情形差了一项";
      case "stateNot": return "眼下的情形差了一项";
      case "route": case "routeIn": { const r = (IFY.D.routes || []).find((x) => x.id === (Array.isArray(d.need) ? d.need[0] : d.need)); return `差走另一条路：得是「${r ? r.name : "另一条"}」那条线`; }
      case "forbidRoute": return "差走另一条路：你走的这条线到不了那里";
      case "chain": { const r = (IFY.D.rare || []).find((x) => x.id === d.chain); return r && r.label ? `前头那件事没遇上：${r.label}` : "前头那件事没遇上"; }
      case "ctx": return "有段经历没赶上";
      case "parents": return "父母都不在了";
      case "kidAge": case "kidAgeMax": return "孩子年纪没对上";
      case "flagAge": return "有件事过去太久了";
      case "rehireAfter": return "退了以后没再回去做过半截";
      case "era": case "eraIn": return "那是另一代人的事";
      case "minYear": return "年份还没到";
      default: return "就差一项";
    }
  }
  function forkUnmet(f) {
    const u = [];
    const S = IFY.S;
    if (f.route && S.route.id !== f.route) { const r = (IFY.D.routes || []).find((x) => x.id === f.route); u.push(`差走另一条路：这个岔口只在「${r ? r.name : "另一条"}」那条线上`); }
    if (f.forbidRoute && S.route.id === f.forbidRoute) u.push("差走另一条路：你走的这条线，到不了这个岔口");
    if (f.forbid && S.flags[f.forbid]) u.push(f.forbid === "bought_house" ? "那年已经买了房，这个岔口没再出现" : "有件事先定下了，这个岔口没再出现");
    if (f.anyParentAlive && S.state.dad !== "alive" && S.state.mom !== "alive") u.push("父母都不在了，这个岔口没等到");
    if (f.state) for (const [dom, v] of Object.entries(f.state)) {
      const vals = Array.isArray(v) ? v : [v];
      if (!vals.includes(S.state[dom])) u.push(dom === "kids" ? "孩子的事，那年已经定了" : dom === "spouse" ? "身边人的情形不一样" : "情形差了一项");
    }
    return u;
  }
  function nearMisses() {
    const out = [];
    if (!IFY.S || !IFY.S.route) return out;
    const endAge = IFY.finalAge();
    const sp = specialEnding();
    for (const e of IFY.D.endings || []) {
      if (sp && e.id === sp.id) continue; // 本局落定的不算差一步
      if (IFY.met(e) && IFY.evidenceCount(e) >= 2) continue; // 条件证据全满只是没排上档位的，不算差
      const u = IFY.unmetConditions(e);
      if (u.unmet.length === 1 && u.evidenceMissing <= 1) out.push({ kind: "ending", id: e.id, title: e.title, age: endAge, miss: missText(u.unmet[0]), evMiss: u.evidenceMissing });
    }
    // v0.22 WP7：视图非空时 faced 判定改读 merged log（两段里真遇过的分岔都算玩家遇过）；未交换走原读法。
    const nmView = playerFacts();
    const faced = (IFY.D.forks || []).filter((f) => !f.procOnly && (!IFY.S.death || f.age < IFY.S.death.age) && (!f.state || (nmView ? !!chosenFromLog(nmView.mergedLog, f) : chosenOfFork(f)))); // procOnly 进程分岔无固定岁数、不入对照/差一步（S4 起）
    for (const f of IFY.D.forks || []) {
      if (f.procOnly) continue;
      if (IFY.S.death ? f.age >= IFY.S.death.age : f.age > endAge) continue; // 没活到那个岁数的岔口不算差一步
      if (faced.includes(f)) continue;
      const u = forkUnmet(f);
      if (u.length === 1) out.push({ kind: "fork", age: f.age, title: f.title || "", miss: u[0] });
    }
    const ends = out.filter((n) => n.kind === "ending");
    const forks = out.filter((n) => n.kind === "fork").sort((a, b) => a.age - b.age);
    return [...ends, ...forks].slice(0, 6); // 不展示全图：最多六个剪影
  }

  // ---------- specialEnding 段事实补通道（v0.22 WP7，蓝图 7.3） ----------
  // 口径边界（硬线）：终局身体上未命中的结局，只许用段视图补「事实类」未满项——kind ∈ flag/anyFlag/chain/state/ctx。
  // 数值类（stat）、路线类（route/routeIn/forbidRoute）、年代类（era/eraIn/minYear）、时间窗类（kidAge/petAge/flagAge/
  // rehireAfter/parents 等）未满，一律不许用段视图补——那些讲的是终局身体的形状与时候，不是「经历过没有」。
  // 负向条件（forbidFlag/stateNot）同样不补：段视图只能证明发生过，证明不了没发生过。
  // ctx 只补可由段事实直接核的分量（flag/anyFlag/state）；带 form/mainLine/entry/eduGate 等派生分量的 ctx 核不了、不硬补。
  // evidence 证据点同理只补事实类备选（string id / {rec} / {state}）；{stat} 数值备选永不补。
  const SEG_FACT_KINDS = new Set(["flag", "anyFlag", "chain", "state", "ctx"]);
  function segSatisfiesUnmet(view, e, item) {
    switch (item.kind) {
      case "flag": return view.hasFact(item.flag) || view.flagWitnessed(item.flag);
      case "anyFlag": return (item.flags || []).some((f) => view.hasFact(f) || view.flagWitnessed(f));
      case "chain": return view.hasFact(item.chain);
      case "state": return (item.need || []).some((v) => view.domainEnd(item.dom) === v || view.stateWitnessed(item.dom, v));
      case "ctx": {
        const ctx = e.ctx; if (!ctx) return false;
        if (["form", "notForm", "mainLine", "notMainLine", "entry", "eduGate", "eduGateHalf", "anyCareTarget"].some((k) => ctx[k] !== undefined)) return false;
        if (ctx.flag && !(view.hasFact(ctx.flag) || view.flagWitnessed(ctx.flag))) return false;
        if (ctx.anyFlag && !ctx.anyFlag.some((f) => view.hasFact(f) || view.flagWitnessed(f))) return false;
        if (ctx.state) for (const [dom, vals] of Object.entries(ctx.state)) {
          if (!vals.some((v) => (IFY.S.state && IFY.S.state[dom] === v) || view.domainEnd(dom) === v || view.stateWitnessed(dom, v))) return false;
        }
        return !!(ctx.flag || ctx.anyFlag || ctx.state);
      }
      default: return false;
    }
  }
  function segEvidenceCount(view, e) {
    if (!e.evidence) return 99; // 与 evidenceCount 同口径：未声明证据组按满证据
    let n = 0;
    for (const group of e.evidence) {
      const hit = group.some((alt) => {
        if (typeof alt === "string") return IFY.hasFact(alt) || view.hasFact(alt) || view.flagWitnessed(alt);
        if (alt && alt.stat) return alt.stat.gt !== undefined ? IFY.S.stats[alt.stat.k] > alt.stat.gt : IFY.S.stats[alt.stat.k] < alt.stat.lt; // 数值备选只认终局身体，不补
        if (alt && alt.state) return Object.entries(alt.state).every(([dom, v]) => (IFY.S.state && IFY.S.state[dom] === v) || view.domainEnd(dom) === v || view.stateWitnessed(dom, v));
        if (alt && alt.rec) return IFY.hasRec(alt.rec) || view.hasFact(alt.rec);
        return false;
      });
      if (hit) n++;
    }
    return n;
  }

  // ---------- 结局落定：同档多命中的贴合加权抽（结局抽选批） ----------
  // 背景：此前 specialEnding 在同档多命中时恒取目录第一（hits[0]），与这一局的实际
  // 形状无关。用户裁定（2026-11-09）：多结局同达标时按贴合度加权、用本局种子抽——
  // 是抽，不是确定；完全均匀乱抽不许。落法（本批边界）：
  //   · 档位优先一字不动：legendary/epic 手写特殊结局仍在顶层，低档永不压高档；
  //     抽只发生在「最高档候选池」内部，单命中池照旧直落。
  //   · 回老家链（end_return_home）不参加抽选：它在池首时（即现行规则下本就落它）
  //     照旧落定；在池中其他位置时从抽池剔除——它落定的局集合与改前逐局相同。
  //   · 权重全由本局真账算（见 endingWeight 的五面片口径），不用 Math.random、
  //     不耗主随机流：抽数走 seedStr 派生子流（与判词 "#verdict" 同法），同种子
  //     必同结局，结算页重渲染/回放多次调用结果恒一致（本文件纯函数纪律）。
  //   · 权重只许倾斜不许独裁：池内权重比封顶 ENDING_DRAW_RATIO（2.5）——两候选时
  //     最高权重者至多约 71%，永不保送；每条已达标结局都留真实机会。
  const ENDING_DRAW_RATIO = 2.5;
  const ENDING_HOME_ID = "end_return_home";
  // 数值维 → 面片（与九槽读法同源：growth 是手艺事业、money 的收场即住房落脚、
  // health/wisdom/freedom 是晚年形状、relation 是关系）。
  const ENDING_STAT_FACET = { growth: "career", money: "home", health: "late", wisdom: "late", freedom: "late", relation: "relation" };
  // 事实 id → 面片：只按事实所属的生活域归类（登记一次、全结局统一适用；不给任何
  // 单条结局设专属数值）。未列入的通用事件/稀有 id 是叙事质地、不计面片贴合。
  const ENDING_FACT_FACET = {
    retired_full: "late", r_marathon: "late",
    c_house: "home", c_rent: "home", renting: "home", bought_house: "home",
    back_home_stay: "home", moved_city: "home", stayed_city: "home", r_abroad_pr: "home",
    side_job: "career", mentor_bond: "career", legacy_sharing_done: "career",
    r_ipo: "career", r_funding: "career", r_drug1: "career", r_drug2: "career",
    r_award: "career", r_school1: "career", r_school2: "career", r_book: "career",
    r_viral: "career", r_craft_apprentice: "career", r_village_doc: "career",
    r_trucker_route: "career", r_teacher_students: "career", r_captain_final: "relation",
    care_self: "family", late_parent: "family", kid_no: "family", kid_abroad: "family",
  };
  function endingFactFacet(id) {
    if (Object.prototype.hasOwnProperty.call(ENDING_FACT_FACET, id)) return ENDING_FACT_FACET[id];
    if (id.startsWith("c_") || id.startsWith("cb_")) return "family"; // 立约/伴侣/子女事实族
    if (id.endsWith("_work")) return "career"; // 行当旗族（factory_work/teach_work/…）
    if (id.startsWith("traj_")) return id === "traj_captain" ? "relation" : id === "traj_lottery" ? null : "career"; // 轨迹链主体是行当线；队长链是队伍关系、彩票链是运气，都不冒充行当
    return null;
  }
  // 证据组在本局是否命中、命中备选归哪个面片：命中判法与 evidenceCount/segEvidenceCount
  // 同口径（本局身体 ∪ 段视图见证），取组内第一个命中的备选归面。
  function endingEvidenceFacet(group, view) {
    for (const alt of group) {
      let hit = false, facet = null;
      if (typeof alt === "string") { hit = IFY.hasFact(alt) || !!(view && (view.hasFact(alt) || view.flagWitnessed(alt))); facet = endingFactFacet(alt); }
      else if (alt && alt.stat) { const v = IFY.S.stats[alt.stat.k]; hit = alt.stat.gt !== undefined ? v > alt.stat.gt : v < alt.stat.lt; facet = ENDING_STAT_FACET[alt.stat.k] || null; }
      else if (alt && alt.state) {
        hit = Object.entries(alt.state).every(([dom, v]) => (IFY.S.state && IFY.S.state[dom] === v) || (view && (view.domainEnd(dom) === v || view.stateWitnessed(dom, v))));
        const doms = Object.keys(alt.state);
        facet = doms.some((d) => d === "spouse" || d === "kids" || d === "dad" || d === "mom") ? "family" : doms.includes("workPhase") ? "late" : "career";
      }
      else if (alt && alt.rec) { hit = IFY.hasRec(alt.rec) || !!(view && view.hasFact(alt.rec)); facet = endingFactFacet(alt.rec); }
      if (hit) return facet;
    }
    return undefined; // 整组未命中：不计分（与达标判定一致，组未命中本就不算证据）
  }
  // 贴合度：结局自己的声明（数值门＋证据组）被这一局的账应答的程度，按五面片分账。
  // 每面片满分 1：该面片的应答量（数值门按越过门槛的纵深计 [0,1]、证据组命中计 1）
  // 累计到 2 即满——一处应答算半贴（0.5），两处以上算这面真对上了。权重 = 1 + 五面之和。
  function endingWeight(e, view) {
    const sums = { career: 0, family: 0, home: 0, late: 0, relation: 0 };
    for (const c of e.stats || []) {
      const F = ENDING_STAT_FACET[c.k]; if (!F) continue;
      const v = (IFY.S.stats || {})[c.k]; if (typeof v !== "number") continue;
      const m = c.lt !== undefined ? (c.lt - v) / Math.max(1, c.lt) : (v - (c.gt || 0)) / Math.max(1, 100 - (c.gt || 0));
      sums[F] += Math.min(1, Math.max(0, m));
    }
    for (const group of e.evidence || []) {
      const F = endingEvidenceFacet(group, view);
      if (F) sums[F] += 1;
    }
    let w = 1;
    for (const k of Object.keys(sums)) w += Math.min(1, sums[k] / 2);
    return { w, facets: sums };
  }
  function boundEndingWeights(ws) {
    const lo = Math.min.apply(null, ws), hi = Math.max.apply(null, ws);
    if (!(hi > lo * ENDING_DRAW_RATIO)) return ws.slice();
    const target = lo * ENDING_DRAW_RATIO;
    return ws.map((w) => lo + (w - lo) * ((target - lo) / (hi - lo)));
  }
  // 池内落定：hits 已按档位排好序。返回 { hit, pool, via, weights }（weights 仅抽选时非空）。
  function pickEnding(hits, view) {
    const topTier = IFY.TIER_ORDER[hits[0].tier];
    const pool = hits.filter((e) => IFY.TIER_ORDER[e.tier] === topTier);
    if (pool.length === 1) return { hit: pool[0], pool, via: "single", weights: null };
    if (pool[0].id === ENDING_HOME_ID) return { hit: pool[0], pool, via: "returnHome", weights: null };
    const drawPool = pool.filter((e) => e.id !== ENDING_HOME_ID);
    if (drawPool.length === 1) return { hit: drawPool[0], pool, via: "single", weights: null };
    const raw = drawPool.map((e) => endingWeight(e, view).w);
    const bounded = boundEndingWeights(raw);
    const weights = {};
    drawPool.forEach((e, i) => { weights[e.id] = bounded[i]; });
    const total = bounded.reduce((a, b) => a + b, 0);
    const dst = { a: IFY.seedFromString(String(IFY.S.seedStr || "") + "#ending") };
    let r = IFY.mulberry(dst) * total;
    for (let i = 0; i < drawPool.length; i++) { r -= bounded[i]; if (r < 0) return { hit: drawPool[i], pool, via: "draw", weights }; }
    return { hit: drawPool[drawPool.length - 1], pool, via: "draw", weights };
  }
  // 诊断出口（普查/台架用）：本局达标全集、最高档池、抽选权重与落定，与 specialEnding 同源。
  function endingDrawInfo() {
    if (!IFY.S) return null;
    const view = playerFacts();
    const hits = endingHits(view);
    if (!hits.length) return { hits: [], pool: [], weights: null, picked: null, via: "none" };
    const sorted = hits.slice().sort((a, b) => IFY.TIER_ORDER[a.tier] - IFY.TIER_ORDER[b.tier]);
    const p = pickEnding(sorted, view);
    return { hits: hits.map((e) => e.id), pool: p.pool.map((e) => e.id), weights: p.weights, picked: p.hit ? p.hit.id : null, via: p.via };
  }

  function endingHits(view) {
    // F3/F4（v0.17.0）：met() 条件之外还须凑满 2 个独立证据点（evidence，见 src/content/rare/synergy.js）；凑不满就不出——一局可以没有特殊结局
    const hits = (IFY.D.endings || []).filter((e) => IFY.met(e) && IFY.evidenceCount(e) >= 2);
    // v0.22 WP7：交换局补一条段事实通道（口径边界见上方注释）——终局身体未命中、未满项全部是事实类且被段视图满足、
    // 且证据点经段补后凑满 2 点的结局，算命中；与终局命中同池按 tier 排序。未交换（视图为 null）时本段恒不触发。
    if (view) {
      for (const e of IFY.D.endings || []) {
        if (hits.includes(e)) continue;
        const u = IFY.unmetConditions(e);
        if (!u.unmet.every((item) => SEG_FACT_KINDS.has(item.kind) && segSatisfiesUnmet(view, e, item))) continue;
        if (segEvidenceCount(view, e) < 2) continue;
        hits.push(e);
      }
    }
    // AN-5 R9（P-END-2 普查实证后落门）：四个结局的正文预设「65 岁/退休」，本体此前无终局年龄门——
    // 普查种子 END2-180（c1955）实证：桃李满天下在终局 56 岁、workPhase=working 时落定，正文却写「退休那年」。
    // 门加在普通通道与段通道汇合之后、排序之前：不合者不算落定，剔除后由下一候选或普通结局接续。
    // 子孙满堂四个变体都是「65 岁生日那天」的当日戏，只认年龄轴（终局 <65 一律剔除，纵已退休——
    // 65 岁生日还没到，那场戏无从发生）；其余三结局（桃李/手艺/村医）的预设是退休本身，
    // 年龄 ≥65 或 workPhase 已 retired/part 任一达标即放行。
    {
      const finAge = typeof IFY.finalAge === "function" ? IFY.finalAge() : null;
      const finPhase = IFY.S && IFY.S.state ? IFY.S.state.workPhase : null;
      const RETIRE_GATED = { end_teacher_taoli: 1, end_craft_legacy: 1, end_village_doctor: 1 };
      for (let i = hits.length - 1; i >= 0; i--) {
        const e = hits[i];
        if (finAge == null) break;
        if (e.id === "end_bigfamily") { if (finAge < 65) hits.splice(i, 1); }
        else if (RETIRE_GATED[e.id] && finAge < 65 && finPhase !== "retired" && finPhase !== "part") hits.splice(i, 1);
      }
    }
    // 人生形状批（结局扩容 17→32）：七条新结局的定义含数据层（met/evidence）表达不了的
    // 终局形状——终局年龄（九十多岁 ≥90 / 安稳一生 ≥75 / 送行的人多 <62 / 无房一身轻 ≥60）、伴侣史任数
    // 与成伴岁数（迟来的伴 / 白头偕老，读 partnerHistoryOf，与判词批 B 同一派生）、
    // 60 岁后成长涨幅（越老越学，读 statsLate）、稀有事件零发生（安稳一生，读 usedRare）。
    // 与 R9 同法在此按 id 剔除：普通通道与段通道汇合之后、排序之前；全程只读已定格
    // 事实，不掷骰、不写状态；形状读不准（伴侣史 unknown、statsLate 缺失、终局年龄
    // 读不到）一律 fail-closed 剔除，只少说不多说。
    {
      const finAgeS = typeof IFY.finalAge === "function" ? IFY.finalAge() : null;
      const stS = (IFY.S && IFY.S.state) || {};
      const needPH = hits.some((e) => e.id === "end_late_partner" || e.id === "end_one_partner");
      const phS = needPH ? partnerHistoryOf(view) : null;
      for (let i = hits.length - 1; i >= 0; i--) {
        const e = hits[i];
        if (e.id === "end_long_life") {
          if (finAgeS == null || finAgeS < 90) hits.splice(i, 1);
        } else if (e.id === "end_rent_free") {
          // 「一辈子没买房」是整段人生的说法：终局 <60 时买房的机会窗口还没走完，不落此名。
          if (finAgeS == null || finAgeS < 60) hits.splice(i, 1);
        } else if (e.id === "end_steady_life") {
          if (finAgeS == null || finAgeS < 75 || ((IFY.S.usedRare || []).length > 0)) hits.splice(i, 1);
        } else if (e.id === "end_early_full") {
          const fam = stS.spouse === "partnered" || stS.spouse === "dating" || stS.kids === "has";
          if (finAgeS == null || finAgeS >= 62 || !fam) hits.splice(i, 1);
        } else if (e.id === "end_late_learner") {
          // 涨幅门 ≥6 按实测分布校准：525 局采样里 60 岁后成长涨幅 p50≈2、p90≈5、≥12 为 0，
          // 原案 ≥12 在现行数值下等于不存在；≥6 取涨幅前一成的形状（结局扩容批普查诊断）。
          const sl = IFY.S.statsLate, g = (IFY.S.stats || {}).growth;
          if (!sl || typeof sl.growth !== "number" || typeof g !== "number" || g - sl.growth < 6) hits.splice(i, 1);
        } else if (e.id === "end_late_partner") {
          const parts = phS && phS.known ? phS.parts : [];
          const last = parts.length ? parts[parts.length - 1] : null;
          const okP = !!(last && last.settled && !last.endKind && stS.spouse === "partnered" &&
            (parts.length >= 2 || (typeof last.settledAge === "number" && last.settledAge >= 45) || (typeof last.start === "number" && last.start >= 45)));
          if (!okP) hits.splice(i, 1);
        } else if (e.id === "end_one_partner") {
          const parts = phS && phS.known ? phS.parts : [];
          const p0 = parts.length === 1 ? parts[0] : null;
          let dur = null;
          if (p0 && p0.settled && typeof p0.settledAge === "number" && finAgeS != null) {
            dur = (p0.endKind === "widowed" && typeof p0.endAge === "number" ? p0.endAge : finAgeS) - p0.settledAge;
          }
          const okP = !!(p0 && dur != null && dur >= 30 && (stS.spouse === "partnered" || stS.spouse === "widowed"));
          if (!okP) hits.splice(i, 1);
        }
      }
    }
    return hits;
  }

  function specialEnding() {
    const view = playerFacts();
    const hits = endingHits(view);
    if (!hits.length) return null;
    hits.sort((a, b) => IFY.TIER_ORDER[a.tier] - IFY.TIER_ORDER[b.tier]);
    const hit = pickEnding(hits, view).hit;
    // 内容修复批（第 8 条 b）：子孙满堂的四代说法须有代际算术支撑——按子女落点（kidsBornAt ?? kidsAt，
    // 与 scheduler 的 kidAgeTrue 同锚）推 65 岁时子女年龄：≥40 出四代原文；32–39 出三代文（textThree）；
    // 更小、或读不到落点时出儿孙满堂文（textFull，不提孙辈）。只换文本——命中、档位、证据一概不动，
    // 出现率不变。交换局按终局身体的落点推，读不到就落 textFull：只会少说，不会多说。
    if (hit.id === "end_bigfamily" && (hit.textThree || hit.textFull || hit.textFullSolo)) {
      const S = IFY.S || {};
      const bornAt = typeof S.kidsBornAt === "number" ? S.kidsBornAt : S.kidsAt;
      const childAgeAt65 = typeof bornAt === "number" ? 65 - bornAt : null;
      // AN-5 R6：选文加第二轴——伴侣在场。textFull 写「另一半在对面」，是 65 岁当下的一场戏，
      // 要的是当下状态（终局身体 spouse=partnered），不是「曾经 partnered」；交换局经段通道
      // （stateWitnessed 补「经历过」）落定的局，伴侣已逝时 textFull 不许出，落无伴侣兜底变体
      // textFullSolo。选文位于普通通道与段通道汇合之后，两路同门——只在普通 met 上加门堵不住段通道。
      // text/textThree 本就不提伴侣，伴侣已逝时照旧出。命中、档位、证据一概不动，只换文本。
      const spouseHere = !!(S.state && S.state.spouse === "partnered");
      const text = childAgeAt65 != null && childAgeAt65 >= 40 ? hit.text
        : (childAgeAt65 != null && childAgeAt65 >= 32 ? (hit.textThree || hit.text)
          : (spouseHere ? (hit.textFull || hit.text) : (hit.textFullSolo || hit.textFull || hit.text)));
      if (text !== hit.text) return Object.assign({}, hit, { text });
    }
    return hit;
  }

  // ---------- 结算图纵轴口径（2026-11-06 裁定：图上不标分开点） ----------
  // 两条命从头到尾各走各的，图上不标任何「分开点」：旧 splitMapOf/splitMapSvg（分开岁
  // 实心点＋分家标签＋从分开点引回 22 岁节点的灰虚线）全删，出国/搬家/换轨局与普通局
  // 同图口径、无任何按 source 分支的画法。分家记账（pendingSplit）仍在引擎层记账
  // （瞥视站位等读它，与呈现无关），结算图不再消费它。
  // 纵轴自 5 岁起：5→22 段压缩 4px/年，22 后维持 11px/年；两版图共用同一分段函数。
  const MAP_ORIGIN = 5, MAP_PX_CHILD = 4, MAP_PX_ADULT = 11;
  function mapScaleY(topPad) {
    return (a) => topPad
      + (Math.min(a, IFY.START_AGE) - MAP_ORIGIN) * MAP_PX_CHILD
      + Math.max(0, a - IFY.START_AGE) * MAP_PX_ADULT;
  }
  // 5 岁起点节点＋标签（两版图同画法）：普通实心点，标签只写「5 岁」。
  function mapOriginSvg(Y, cx) {
    return {
      node: `<circle cx="${cx}" cy="${Y(MAP_ORIGIN)}" r="4.5" fill="#2F4A3C"/>`,
      label: `<text class="maplab" style="--bd2:.3s" x="${cx + 12}" y="${Y(MAP_ORIGIN) + 4}" font-size="11.5" fill="#6E6A5E">5 岁</text>`,
    };
  }

  // ---------- 结算纵轴立轴图（VISUAL-DESIGN 第四节裁定 + UX-MOTION §9.2 生长仪式） ----------
  // fix5 改：纵轴只画到本轨实际终局岁，不预设终点、不标 80；未选支流按分岔序号左右交替。
  // 新口径（2026-11-06）：纵轴自 5 岁起（5→22 压缩刻度），画布高容下两轨各自的事实终局。
  function settlementMapHtmlLegacy() {
    const end = IFY.finalAge();
    const W = Math.min(460, Math.max(300, (window.innerWidth || 360) - 56));
    const cx = W / 2, pxY = MAP_PX_ADULT, topPad = 34;
    const origin = MAP_ORIGIN;
    const Y = mapScaleY(topPad);
    // 影子终局岁：只读第八槽同口径的既有结果（renderEnd 入口已 fastForwardUncontrolled，
    // 本函数不推进影子步进、不新消费随机流）。无不受控 Track、或其 death 未定时，
    // shEnd 为 null——该局整条影子线不画（见下方 shEnd 守卫）。
    const shState = uncontrolledState();
    const shEnd = shState && shState.death ? shState.death.age : null;
    const H = Y(Math.max(end, shEnd == null ? end : shEnd)) + 30;
    const GROW_S = 1.05, GROW_DELAY = 0.36;
    // 标签按可用宽度截断：宽度单位（半角 0.55 / 全角 1）×字号 ≈ 实际像素，原型实测口径
    const units = (s) => [...s].reduce((a, ch) => a + (ch.charCodeAt(0) < 256 ? 0.55 : 1), 0);
    const fitW = (t) => {
      const maxU = (W / 2 - 18) / 11.5;
      if (units(t) <= maxU) return t;
      let s = t;
      while (s.length && units(s + "…") > maxU) s = s.slice(0, -1);
      return s + "…";
    };
    const chosenOf = chosenOfFork;
    const faced = (IFY.D.forks || []).filter((f) => !f.procOnly && (!IFY.S.death || f.age < IFY.S.death.age) && (!f.state || chosenOf(f))); // v0.16.0：带门分岔没触发过的，不进结算对照（无门分岔照旧）；procOnly 进程分岔不入图（S4 起）
    let g = `<line x1="${cx}" y1="${Y(origin)}" x2="${cx}" y2="${Y(end)}" stroke="#DDD6C9" stroke-width="1.5"/>`;
    g += `<path class="mapspine" style="--gd:${GROW_DELAY}s" pathLength="100" d="M ${cx} ${Y(origin)} L ${cx} ${Y(end)}" fill="none" stroke="#2F4A3C" stroke-width="3" stroke-linecap="round"/>`;
    const labels = [];
    let prevBd = -1;
    faced.forEach((f, fi) => {
      const side = fi % 2 === 0 ? -1 : 1; // 分岔序号定侧：左右交替，横向偏移不编码好坏
      const y0 = Y(f.age);
      let bd = GROW_DELAY + ((f.age - IFY.START_AGE) / Math.max(1, end - IFY.START_AGE)) * GROW_S;
      if (prevBd >= 0) bd = Math.max(bd, prevBd + 0.09); // 早年分岔密集：延迟加 90ms 最小间隔下限，保住「依次」感（原型验证对策）
      prevBd = bd;
      IFY.S.unchosen.filter((u) => u.kind === "fork" && u.age === f.age).forEach((u, j) => {
        const dx = side * (84 + j * 42), dy = Math.min((6 + j * 2.5) * pxY, Y(end) + 24 - y0); // fix5 追加守卫：未选支末端不许探出画布底（画布已随 end 变矮，晚年分岔的多支会溢出）
        g += `<path class="mapbranch" style="--bd:${bd.toFixed(2)}s" d="M ${cx} ${y0} Q ${cx + dx * 0.72} ${y0 + dy * 0.5} ${cx + dx} ${y0 + dy}" fill="none" stroke="#8A948C" stroke-width="2" stroke-dasharray="4 4" stroke-linecap="round"/><circle cx="${cx + dx}" cy="${y0 + dy}" r="2" fill="#8A948C" opacity=".45"/>`;
      });
      g += `<circle cx="${cx}" cy="${y0}" r="4" fill="#2F4A3C"/>`;
      const chosen = chosenOf(f);
      if (chosen) labels.push(`<text class="maplab" style="--bd2:${(bd + 0.1).toFixed(2)}s" x="${cx - side * 12}" y="${y0 + 4}" font-size="11.5" fill="#6E6A5E" text-anchor="${side === 1 ? "end" : "start"}">${IFY.esc(fitW(`${f.age} 岁 · ${chosen}`))}</text>`);
    });
    g += `<circle cx="${cx}" cy="${Y(IFY.START_AGE)}" r="4.5" fill="#2F4A3C"/>`;
    labels.push(`<text class="maplab" style="--bd2:.4s" x="${cx + 12}" y="${Y(IFY.START_AGE) + 4}" font-size="11.5" fill="#6E6A5E">22 岁 · ${IFY.esc(IFY.S.route.name)}</text>`);
    { const o5 = mapOriginSvg(Y, cx); g += o5.node; labels.push(o5.label); } // 5 岁起点节点＋标签（新口径）
    g += `<circle cx="${cx}" cy="${Y(end)}" r="4.5" fill="#2F4A3C"/>`;
    labels.push(`<text class="maplab" style="--bd2:${(GROW_DELAY + GROW_S + 0.1).toFixed(2)}s" x="${cx - 12}" y="${Y(end) + 4}" font-size="11.5" fill="#6E6A5E" text-anchor="end">${end} 岁</text>`);
    // 影子的线（新口径）：既有灰虚线（与交换图交出线同画法）自 22 岁节点弯出到左侧
    // （固定 -84）再直落到影子自己的终局岁，末端小点＋只写岁数的标签。不在 22 处新加
    // 节点或标签，不写路线名、不写任何分开字样。shEnd 取不到时整条不画。
    if (shEnd != null) {
      const y22 = Y(IFY.START_AGE), ySh = Y(shEnd);
      const bend = Math.min(66, Math.max(0, (ySh - y22) / 2)); // 弯出段纵距：长落差封顶 66px，短落差取半，余下全是直落
      g += `<path class="mapbranch mapshadow" style="--bd:${(GROW_DELAY + 0.05).toFixed(2)}s" d="M ${cx} ${y22} Q ${cx - 84 * 0.72} ${y22 + bend * 0.5} ${cx - 84} ${y22 + bend} L ${cx - 84} ${ySh}" fill="none" stroke="#8A948C" stroke-width="2" stroke-dasharray="4 4" stroke-linecap="round"/><circle cx="${cx - 84}" cy="${ySh}" r="2" fill="#8A948C" opacity=".45"/>`;
      labels.push(`<text class="maplab" style="--bd2:${(GROW_DELAY + 0.15).toFixed(2)}s" x="${cx - 84 - 9}" y="${ySh + 4}" font-size="11.5" fill="#6E6A5E" text-anchor="end">${shEnd} 岁</text>`);
    }
    // 差一步剪影层（v0.20.0 M2）：空心虚线圈 + 既有灰的虚线支，与已走节点（实心松绿）可区分；不新造配色
    // fix5：剪影纵向一律钳在本轨终局 end 内（age 大于 end 的钳到 end 处），不许溢出画布
    nearMisses().forEach((n, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      const y0 = Y(Math.min(n.age, end));
      const dx = side * 84, dy = n.kind === "ending" ? -34 : 30;
      const yy = Math.max(Y(origin) + 8, Math.min(Y(end) - 4, y0 + dy));
      g += `<path class="mapbranch" style="--bd:${(GROW_DELAY + GROW_S + 0.15 + i * 0.09).toFixed(2)}s" d="M ${cx} ${y0} Q ${cx + dx * 0.72} ${(y0 + yy) / 2} ${cx + dx} ${yy}" fill="none" stroke="#8A948C" stroke-width="1.5" stroke-dasharray="3 4" stroke-linecap="round" opacity=".6"/><circle class="mapnear" cx="${cx + dx}" cy="${yy}" r="4" fill="none" stroke="#8A948C" stroke-width="1.5" stroke-dasharray="3 3" opacity=".75"/>`;
      const lab = n.kind === "ending" ? `差一步 · ${n.title}：${n.miss}` : `差一步 · ${n.age} 岁：${n.miss}`;
      labels.push(`<text class="maplab" style="--bd2:${(GROW_DELAY + GROW_S + 0.25 + i * 0.09).toFixed(2)}s" x="${cx + dx + (side === 1 ? 9 : -9)}" y="${yy + 4}" font-size="11" fill="#A39C8B" text-anchor="${side === 1 ? "start" : "end"}">${IFY.esc(fitW(lab))}</text>`);
    });
    return `<div class="mapwrap" id="mapwrap"><svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="这一生的分岔图">${g}${labels.join("")}</svg></div>`;
  }

  // ---------- 道路图分发（v0.22 WP7，蓝图 7.4） ----------
  // 未交换局走 settlementMapHtmlLegacy 原样（与改前逐字一致，断言守）；交换局走交叉点版。
  function settlementMapHtml() {
    const ses = IFY.session;
    if (ses && ses.meta && ses.meta.swapped && ses.meta.swap && playerFacts()) return settlementMapHtmlSwapped();
    return settlementMapHtmlLegacy();
  }

  // 交换版道路图：脊线 = 段视图分岔序列（各段 Track 在段内 faced 的分岔 + chosenOfForkIn 标签）；
  // swap.age 处实心点 + 交叉标签；交出路线以既有灰虚线从交叉点续到交出 Track 终局岁（末端小点），
  // 接管路线以同款虚线从 22 岁引到交叉点并入脊线。不新造配色（灰 #8A948C 虚线、松绿 #2F4A3C 实心，与原图同）。
  function settlementMapHtmlSwapped() {
    fastForwardUncontrolled(); // 交出 Track 的终局岁要读快进后的完整账本（与第八槽同口径）
    const view = playerFacts();
    const meta = IFY.session.meta, swapAge = meta.swap.age;
    const end = IFY.finalAge();
    const outEnd = view.segments[0].state.death ? view.segments[0].state.death.age : IFY.MAX_AGE; // fix5：交出轨自己的终局岁（事实），其虚线须完整落在画布内
    const W = Math.min(460, Math.max(300, (window.innerWidth || 360) - 56));
    const cx = W / 2, pxY = MAP_PX_ADULT, topPad = 34;
    const origin = MAP_ORIGIN; // 纵轴自 5 岁起（新口径，与普通图同一分段函数）
    const Y = mapScaleY(topPad);
    const H = Y(Math.max(end, outEnd)) + 30; // fix5：主轴只到 end；画布高容下两轨各自的事实终局，不标预设终点
    const GROW_S = 1.05, GROW_DELAY = 0.36;
    const units = (s) => [...s].reduce((a, ch) => a + (ch.charCodeAt(0) < 256 ? 0.55 : 1), 0);
    const fitW = (t) => {
      const maxU = (W / 2 - 18) / 11.5;
      if (units(t) <= maxU) return t;
      let s = t;
      while (s.length && units(s + "…") > maxU) s = s.slice(0, -1);
      return s + "…";
    };
    // 段内 faced 序列：分岔岁落在段内、且该段 Track 的 log 里真有已选标签（chosenOfForkIn），同岁只取先命中的段
    const facedSeg = [];
    for (const f of IFY.D.forks || []) {
      if (f.procOnly) continue; // procOnly 进程分岔无固定岁数、不入段图（S4 起）
      for (let si = 0; si < view.segments.length; si++) {
        const seg = view.segments[si];
        if (f.age < seg.fromAge || f.age > seg.toAge) continue;
        if (seg.state.death && f.age >= seg.state.death.age) continue;
        if (f.state && !chosenOfForkIn(seg.state, f)) continue;
        const chosen = chosenOfForkIn(seg.state, f);
        if (!chosen && f.state) continue;
        facedSeg.push({ f, seg, chosen });
        break;
      }
    }
    let g = `<line x1="${cx}" y1="${Y(origin)}" x2="${cx}" y2="${Y(end)}" stroke="#DDD6C9" stroke-width="1.5"/>`;
    g += `<path class="mapspine" style="--gd:${GROW_DELAY}s" pathLength="100" d="M ${cx} ${Y(origin)} L ${cx} ${Y(end)}" fill="none" stroke="#2F4A3C" stroke-width="3" stroke-linecap="round"/>`;
    const labels = [];
    let prevBd = -1;
    facedSeg.forEach(({ f, seg, chosen }, fi) => {
      const side = fi % 2 === 0 ? -1 : 1;
      const y0 = Y(f.age);
      let bd = GROW_DELAY + ((f.age - IFY.START_AGE) / Math.max(1, end - IFY.START_AGE)) * GROW_S;
      if (prevBd >= 0) bd = Math.max(bd, prevBd + 0.09);
      prevBd = bd;
      (seg.state.unchosen || []).filter((u) => u.kind === "fork" && u.age === f.age).forEach((u, j) => {
        const dx = side * (84 + j * 42), dy = Math.min((6 + j * 2.5) * pxY, Y(Math.max(end, outEnd)) + 24 - y0); // fix5 追加守卫：未选支末端不许探出画布底
        g += `<path class="mapbranch" style="--bd:${bd.toFixed(2)}s" d="M ${cx} ${y0} Q ${cx + dx * 0.72} ${y0 + dy * 0.5} ${cx + dx} ${y0 + dy}" fill="none" stroke="#8A948C" stroke-width="2" stroke-dasharray="4 4" stroke-linecap="round"/><circle cx="${cx + dx}" cy="${y0 + dy}" r="2" fill="#8A948C" opacity=".45"/>`;
      });
      g += `<circle cx="${cx}" cy="${y0}" r="4" fill="#2F4A3C"/>`;
      if (chosen) labels.push(`<text class="maplab" style="--bd2:${(bd + 0.1).toFixed(2)}s" x="${cx - side * 12}" y="${y0 + 4}" font-size="11.5" fill="#6E6A5E" text-anchor="${side === 1 ? "end" : "start"}">${IFY.esc(fitW(`${f.age} 岁 · ${chosen}`))}</text>`);
    });
    g += `<circle cx="${cx}" cy="${Y(IFY.START_AGE)}" r="4.5" fill="#2F4A3C"/>`;
    const startRoute = view.segments[0].state.route ? view.segments[0].state.route.name : "";
    labels.push(`<text class="maplab" style="--bd2:.4s" x="${cx + 12}" y="${Y(IFY.START_AGE) + 4}" font-size="11.5" fill="#6E6A5E">22 岁 · ${IFY.esc(startRoute)}</text>`);
    { const o5 = mapOriginSvg(Y, cx); g += o5.node; labels.push(o5.label); } // 5 岁起点节点＋标签（新口径）
    g += `<circle cx="${cx}" cy="${Y(end)}" r="4.5" fill="#2F4A3C"/>`;
    labels.push(`<text class="maplab" style="--bd2:${(GROW_DELAY + GROW_S + 0.1).toFixed(2)}s" x="${cx - 12}" y="${Y(end) + 4}" font-size="11.5" fill="#6E6A5E" text-anchor="end">${end} 岁</text>`);
    // ---- 交叉点：接管路线虚线（22 岁 → 交叉点）+ 交出路线虚线（交叉点 → 交出 Track 终局岁）+ 实心点与标签 ----
    const ySwap = Y(swapAge);
    const bdSwap = GROW_DELAY + ((swapAge - IFY.START_AGE) / Math.max(1, end - IFY.START_AGE)) * GROW_S;
    const dxIn = 84, dxOut = -84;
    g += `<path class="mapbranch" style="--bd:${bdSwap.toFixed(2)}s" d="M ${cx + dxIn} ${Y(IFY.START_AGE)} Q ${cx + dxIn * 0.72} ${(Y(IFY.START_AGE) + ySwap) / 2} ${cx} ${ySwap}" fill="none" stroke="#8A948C" stroke-width="2" stroke-dasharray="4 4" stroke-linecap="round"/>`;
    g += `<path class="mapbranch" style="--bd:${bdSwap.toFixed(2)}s" d="M ${cx} ${ySwap} Q ${cx + dxOut * 0.72} ${(ySwap + Y(outEnd)) / 2} ${cx + dxOut} ${Y(outEnd)}" fill="none" stroke="#8A948C" stroke-width="2" stroke-dasharray="4 4" stroke-linecap="round"/><circle cx="${cx + dxOut}" cy="${Y(outEnd)}" r="2" fill="#8A948C" opacity=".45"/>`;
    g += `<circle cx="${cx}" cy="${ySwap}" r="4.5" fill="#2F4A3C"/>`;
    // 交叉标签是定稿整句，不走 fitW 截断（截了就不是那句话了）；居中锚在脊线上，窄屏也放得下整句
    labels.push(`<text class="maplab" style="--bd2:${(bdSwap + 0.1).toFixed(2)}s" x="${cx}" y="${ySwap - 10}" font-size="11.5" fill="#6E6A5E" text-anchor="middle">${IFY.esc(`${swapAge} 岁 · 换到了「${meta.swap.to}」那条路`)}</text>`);
    // 差一步剪影层：与原图同画法（nearMisses 的 faced 已按 merged log 判，见 nearMisses 内注）
    // fix5：剪影纵向钳在主轨终局 end 内（age 大于 end 的钳到 end 处），不许溢出画布
    nearMisses().forEach((n, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      const y0 = Y(Math.min(n.age, end));
      const dx = side * 84, dy = n.kind === "ending" ? -34 : 30;
      const yy = Math.max(Y(origin) + 8, Math.min(Y(end) - 4, y0 + dy));
      g += `<path class="mapbranch" style="--bd:${(GROW_DELAY + GROW_S + 0.15 + i * 0.09).toFixed(2)}s" d="M ${cx} ${y0} Q ${cx + dx * 0.72} ${(y0 + yy) / 2} ${cx + dx} ${yy}" fill="none" stroke="#8A948C" stroke-width="1.5" stroke-dasharray="3 4" stroke-linecap="round" opacity=".6"/><circle class="mapnear" cx="${cx + dx}" cy="${yy}" r="4" fill="none" stroke="#8A948C" stroke-width="1.5" stroke-dasharray="3 3" opacity=".75"/>`;
      const lab = n.kind === "ending" ? `差一步 · ${n.title}：${n.miss}` : `差一步 · ${n.age} 岁：${n.miss}`;
      labels.push(`<text class="maplab" style="--bd2:${(GROW_DELAY + GROW_S + 0.25 + i * 0.09).toFixed(2)}s" x="${cx + dx + (side === 1 ? 9 : -9)}" y="${yy + 4}" font-size="11" fill="#A39C8B" text-anchor="${side === 1 ? "start" : "end"}">${IFY.esc(fitW(lab))}</text>`);
    });
    return `<div class="mapwrap" id="mapwrap"><svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="这一生的分岔图">${g}${labels.join("")}</svg></div>`;
  }

  // 「活过的人生」记录页（§B3）：已活到的给名与日期；未活到的不给名、不印线索
  // （clue 是结局本人的画像句，逐条印出等于把整个目录提前摊开——2026-11-06 裁定），
  // 两段各收成一行汇总，只给总数；无完成度、无稀有度、无奖励（§B2.4 禁止项）
  function renderLives() {
    IFY.curKind = "lives";
    IFY.clearAutoContext();
    IFY.app().classList.remove("playwrap");
    const rec = IFY.loadLives();
    const lived = (list, key) => list.filter((x) => rec[key][x.id]).sort((a, b) => (rec[key][a.id] < rec[key][b.id] ? -1 : 1));
    const unlived = (list, key) => list.filter((x) => !rec[key][x.id]);
    const le = lived(IFY.D.endings, "endings"), ue = unlived(IFY.D.endings, "endings");
    const lr = lived(IFY.D.rare, "rares"), ur = unlived(IFY.D.rare, "rares");
    IFY.app().innerHTML = `<section class="card">
      <h2>你活过的人生</h2>
      <p>结局活过 ${le.length} 种，稀有际遇撞过 ${lr.length} 件。每一种，都只是众多人生里的一种。</p>
      <h3>结局</h3>
      ${le.map((e) => `<p class="liverow"><b>${IFY.esc(e.title)}</b><span>${IFY.esc(rec.endings[e.id])}</span></p>`).join("")}
      ${ue.length ? `<p class="clue">还有 ${ue.length} 种结局，等你活到。</p>` : ""}
      <h3>稀有际遇</h3>
      ${lr.map((r) => `<p class="liverow"><b>${IFY.esc(r.label || r.name)}</b><span>${IFY.esc(rec.rares[r.id])}</span></p>`).join("")}
      ${ur.length ? `<p class="clue">还有 ${ur.length} 件际遇，等你撞上。</p>` : ""}
      <p class="hint">这份记录只存在这台设备的浏览器里，清掉浏览器数据就没了。</p>
      <div class="row">
        <button class="ghost" id="backstart">回开局</button>
        <button class="ghost" id="clearlives">清空记录</button>
      </div>
    </section>`;
    IFY.el("backstart").addEventListener("click", IFY.renderStart);
    let armed = false;
    IFY.el("clearlives").addEventListener("click", () => {
      if (!armed) { armed = true; IFY.el("clearlives").textContent = "再点一次，真的清空"; return; }
      try { localStorage.removeItem(IFY.LIVES_KEY); } catch (e) {}
      IFY.livesCache = { v: 1, endings: {}, rares: {} };
      renderLives();
    });
  }

  // ---------- 子女在场判定（v0.20.1 返修，审计 run-02）：「孩子在跟前长大」类句子要有孩子实际出场记录 ----------
  // 口径：账本（S.ledger）里 kind=event/rare/proc 的记录，其条目定义带 kids=has 状态门
  // （state 或 stateAll 的 kids 含 has）或带 kidMin 门，且落账年龄在孩子长大期间
  // （kidsAt 起 18 年内；kidsAt 缺失的旧存档回落为不限年）——计数 ≥1 才算在场。
  // run-02 的形状正是反例：39–58 岁零出场、59 岁才冒出来买房（那时孩子按账已成年），不算「在跟前长大」。
  function kidPresenceCount() {
    const led = Array.isArray(IFY.S.ledger) ? IFY.S.ledger : [];
    if (!led.length || !IFY.D || !Array.isArray(IFY.D.events)) return 0;
    const byId = new Map(IFY.D.events.map((e) => [e.id, e]));
    const kidsAt = typeof IFY.S.kidsAt === "number" ? IFY.S.kidsAt : null;
    let n = 0;
    for (const e of led) {
      if (e.kind !== "event" && e.kind !== "rare" && e.kind !== "proc") continue;
      const def = byId.get(e.id);
      if (!def) continue;
      const gateHas = (o) => o && o.kids !== undefined && [].concat(o.kids).includes("has");
      if (!gateHas(def.state) && !gateHas(def.stateAll) && def.kidMin == null) continue;
      if (kidsAt != null && typeof e.age === "number" && e.age - kidsAt > 18) continue;
      n++;
    }
    return n;
  }

  // ---------- 结算快进 + 第八槽真账（v0.22 WP7，蓝图 7.3/7.4） ----------
  // STATE_PHRASE 同口径复刻：源在 shadow.js（该文件内的 const，未导出）——蓝图口径「同一事实全游戏一套句形」，
  // 此表与 shadow.js 的 STATE_PHRASE 逐字同值，改一处必须同步另一处（本包不许动 shadow.js，故在此复刻并注明）。
  const STATE_PHRASE_LOCAL = {
    "spouse>partnered": "成了家", "spouse>dating": "处了一个人", "spouse>single": "定下来一个人过",
    "spouse>divorced": "离了婚", "spouse>widowed": "另一半先走了",
    "kids>has": "有了孩子", "kids>none": "定下来不要孩子",
    "dad>dead": "父亲走了", "mom>dead": "母亲走了",
    "workPhase>part": "改成做半截活", "workPhase>retired": "退了下来",
    "dog>home": "养了条狗", "dog>gone": "狗没了", "cat>home": "养了只猫", "cat>gone": "猫没了",
  };

  // 结算快进（蓝图 7.4）：不受控条目存在、未 finalized、且未终局时，无头步进到死亡或保险丝
  // （v0.32.0：上限 130 次——22 岁起最长 88 年到保险丝 110，旧 70 次会把长寿影子截在半路），
  // 置条目 finalized=true。幂等：renderEnd 入口与第八槽/交叉点图都会先调它，重复调用在 finalized 后恒为空转。
  function fastForwardUncontrolled() {
    const ses = IFY.session;
    if (!ses || !ses.tracks || typeof IFY.stepUncontrolled !== "function") return;
    const key = ses.controlTrack === "A" ? "B" : "A";
    const entry = ses.tracks[key];
    if (!entry || !entry.state || entry.finalized) return;
    if (!entry.state.death && entry.state.age >= (IFY.MAX_AGE || 110)) IFY.stepUncontrolled(); // 及保险丝无死亡的边界档：stepUncontrolled 内部补保险丝终局（while 的 age 条件进不去）
    let steps = 0;
    while (!entry.state.death && entry.state.age < (IFY.MAX_AGE || 110) && steps < 130) { IFY.stepUncontrolled(); steps++; }
    entry.finalized = true;
  }

  function uncontrolledState() {
    if (typeof IFY.uncontrolledEntry !== "function") return null;
    const found = IFY.uncontrolledEntry();
    return found && found.entry && found.entry.state ? found.entry.state : null;
  }

  // 对面终局短句（分享卡判词卡用，同第八槽终局一句的压缩版）：路线名 + 终局岁数口径。
  function uncontrolledFinalLine() {
    const B = uncontrolledState();
    if (!B || !B.route) return "";
    fastForwardUncontrolled();
    return B.death ? `另一条路（${B.route.name}）走到了 ${B.death.age} 岁` : `另一条路（${B.route.name}）走到了最后`; // v0.32.0：无 death 只剩快进被截断的理论边界，兜底句不许再把任何岁数写成终点
  }

  // 第八槽终局一句：早夭（<60 岁）用 glimpseSkeleton 全生骨架压缩成一句（去掉与槽头重复的路线句），不缩水成光杆终局。
  function shadowFinalSentence(B) {
    const routeName = B.route ? B.route.name : "";
    if (B.death && B.death.age < 60 && typeof IFY.glimpseSkeleton === "function") {
      const parts = IFY.glimpseSkeleton(B).slice(1).map((s) => s.replace(/。$/, ""));
      if (parts.length) return `另一条路（${routeName}）在 ${B.death.age} 岁走完了：${parts.join("，")}。`;
    }
    if (B.death) return `另一条路（${routeName}）走到了 ${B.death.age} 岁，在那一年走完了。`;
    return `另一条路（${routeName}）走到了最后。`; // v0.32.0：同 uncontrolledFinalLine 兜底口径，不写岁数
  }

  // 第八槽揭价一句（硬线）：揭价对象只能从 meta.shownFacts 里 type:"material" 的素材选，且必须能在它
  // 来源轨的账本里对上（id 与 atAge 同时命中），再找锚之后同域的下一次 state 流转作「后来的事」——
  // 素材域的认法：素材本身是 state 条目时域即其 id 前缀；其余素材认同岁紧邻其前的 state 条目
  // （落账序里流转先于条目记账，那条流转就是这件事落定的域）。找不到同域后续流转、或后续流转没有
  // 登记句形时不出句——没露过面的事不许凭空收费，无后续的事不许编后来的价。
  // v0.22.1 Z1（锚归属修复）：旧实现只在入参 B（被换下轨）一本账里找锚，但交换前瞥视的素材全部出自
  // 当时的影子轨——交换后那条轨正是玩家接管并续过的身体，其账本就是 IFY.S 的账本；交换后的瞥视素材
  // 才出自被换下轨。归属错位使揭价句在审计 10 局交换局里 0 触发。现口径：候选账本按
  // [接管轨（IFY.S）、被换下轨（B）] 顺序排，素材按新近（atAge 大者优先、同龄后示者优先）逐个试锚，
  // 第一个能凑齐「锚 + 同域后续流转」的出句（旧实现只试最新一条、凑不齐即沉默，同样是 0 触发的成因）。
  // 未交换局候选只有影子轨一本（B），与素材来源恒一致。
  function shadowRevealSentence(B) {
    const ses = IFY.session;
    const shown = ses && ses.meta && Array.isArray(ses.meta.shownFacts) ? ses.meta.shownFacts : [];
    const mats = shown.filter((f) => f && f.type === "material" && f.id);
    if (!mats.length) return "";
    const ledgers = [];
    if (ses && ses.meta && ses.meta.swapped && IFY.S && Array.isArray(IFY.S.ledger)) ledgers.push(IFY.S.ledger); // 接管轨：交换前素材的来源账
    if (B && Array.isArray(B.ledger)) ledgers.push(B.ledger); // 被换下轨（未交换局即影子轨）：交换后素材的来源账
    const ordered = mats.map((sf, order) => ({ sf, order })).sort((a, b) => ((b.sf.atAge || 0) - (a.sf.atAge || 0)) || (b.order - a.order));
    for (const { sf } of ordered) {
      for (const led of ledgers) {
        let idx = -1;
        led.forEach((e, i) => { if (e.id === sf.id && (sf.atAge == null || e.age === sf.atAge)) idx = i; }); // 同 id 同岁取后落账一条（带选项的条目后一条是落点）
        if (idx < 0) continue;
        const anchor = led[idx];
        let dom = null;
        if (anchor.kind === "state" && typeof anchor.id === "string" && anchor.id.includes(">")) dom = anchor.id.split(">")[0];
        else {
          for (let j = idx - 1; j >= Math.max(0, idx - 4); j--) {
            if (led[j].kind === "state" && led[j].age === anchor.age && typeof led[j].id === "string" && led[j].id.includes(">")) { dom = led[j].id.split(">")[0]; break; }
          }
        }
        if (!dom) continue;
        let next = null;
        for (let j = idx + 1; j < led.length; j++) {
          const e = led[j];
          if (e.kind === "state" && typeof e.id === "string" && e.id.startsWith(dom + ">") && STATE_PHRASE_LOCAL[e.id]) { next = e; break; }
        }
        if (!next) continue;
        const glimpseAge = typeof sf.glimpseAge === "number" ? sf.glimpseAge : anchor.age;
        return `你 ${glimpseAge} 岁看过的那件事，后来${STATE_PHRASE_LOCAL[next.id]}，在 ${next.age} 岁。`;
      }
    }
    return "";
  }

  function eighthSlotReal(B) {
    fastForwardUncontrolled(); // 先确保已快进（renderEnd 入口已做过时此处为空转）
    return shadowFinalSentence(B) + shadowRevealSentence(B);
  }

  // shadowCompareLines 包装（v0.22 WP7 立、v0.22.1 F7 扩围）：原函数在 shadow.js——
  // 有不受控 Track 的局（交换与未交换 alike），对照主句改由第八槽真账承载，main 返回 ""
  // （v0.22 时只对交换局如此收紧，是为 parity 冻结集所做的协调者裁定；v0.22.1 按审计 F7 推翻该裁定：
  // 未交换局第八槽一并真账化、主句一并让位，parity 基线随本版按归因表重封，见 fix-v0221/REPORT.md）。
  // 无 Track 的 legacy 局无账可依，原样透传模板（回落口径）。
  if (typeof IFY.shadowCompareLines === "function" && !IFY._wp7ShadowCompareWrapped) {
    const origShadowCompareLines = IFY.shadowCompareLines;
    IFY.shadowCompareLines = function () {
      const r = origShadowCompareLines();
      if (uncontrolledState()) return { main: "", others: r.others };
      return r;
    };
    IFY._wp7ShadowCompareWrapped = true;
  }

  // 段进段配偶状态（v0.22.1 F2 辅助）：某段 Track 在进段岁（fromAge）那一刻的 spouse 值——
  // 按该 Track 全账本回放 age ≤ fromAge 的 spouse 流转取最后一个（无流转取初始 none）。
  // 接管轨在交换前已成家的事实不在段切片里，stateWitnessed 认不到，靠这一口补认。
  function segEntrySpouse(view, val) {
    for (const seg of view.segments) {
      let cur = "none";
      for (const e of (Array.isArray(seg.state.ledger) ? seg.state.ledger : [])) {
        if (e.kind === "state" && typeof e.id === "string" && e.id.startsWith("spouse>") && typeof e.age === "number" && e.age <= seg.fromAge) cur = e.id.slice(7);
      }
      if (cur === val) return true;
    }
    return false;
  }

  // 立约资格（fix4-settle 第 3 条）：立约是两个人的约定。fork38 对从没成过家的人也照样
  // registerCovenant（spouse.js），但那只是一个人把孩子的事定下来——子女槽已按此陈述
  // （「孩子的事，X 岁那年就定下了」），对账行里凡断言「立的约」的句子只许真有约的局出。
  // 判法：把会被对账行读到的每一份约（与 covenantSettleLineSeg 的 covOf 同口径），回到它
  // 所属 Track 的全账本——38 岁之前真走过定关系/领证路径（spouse 曾落到 partnered/dating）
  // 才算有约；38 岁那年正单身、但先前成过家的人（离异/丧偶）不算单身局，不在此门内。
  // 「挂起的那份账」类句子不带立约断言，不在此门内，照旧出。
  function trackHadPartnerBy38(trackState) {
    const led = trackState && Array.isArray(trackState.ledger) ? trackState.ledger : [];
    return led.some((e) => (e.id === "spouse>partnered" || e.id === "spouse>dating") && typeof e.age === "number" && e.age <= 38);
  }
  function covenantHadPartner(view) {
    if (!view) return trackHadPartnerBy38(IFY.S);
    const lastIdx = view.segments.length - 1;
    return view.segments.some((seg, si) => {
      const c = seg.state && seg.state.covenant;
      if (!c) return false;
      if (si !== lastIdx && !(typeof c.since === "number" && c.since >= seg.fromAge && c.since <= seg.toAge)) return false;
      return trackHadPartnerBy38(seg.state);
    });
  }

  // ---------- 伴侣史派生（判词批 B）：账本 spouse 流转回放 ----------
  // 事实源 = 账本里 kind:"state" 且 id 形如 "spouse>X" 的条目（applyState 是唯一执行点、
  // 落账时 age 戳为流转当岁）。回放规则（边表见 world/state.js 的 spouse 域）：none→dating
  // 是一任的相处期起点；dating→partnered 是同一任定下来，不是新人；divorced/widowed 之后
  // 再 partnered 才是新一任；相处期散了的（dating→single）不算「任」，只记 datingBreakups
  // ——现行文案对这类历史不断言错话，不动它。任数可以 >2。
  // parts 每任记 { start, settledAge, endAge, endKind }，endKind 为 "widowed"/"divorced"/
  // null（进行中）；段外终结的前任起止不全，相应字段记 null，文案侧遇 null 不写岁数、
  // 方式不可知（endKind 记 "unknown"）时整槽回落现行文案，不编。
  // 交换局按段读：段切片账本（view.segmentLedgers）按段序拼接，每段先以该 Track 全账本
  // 回放到进段岁的配偶值补头（接管轨在交换前已成家的那段不在切片内，口径同 segEntrySpouse）。
  // 无账本（v0.18.0 前老存档）→ known=false，调用方一律回落现行终局文案，一字不改。
  // 纯派生：不掷骰、不读随机流、不写状态。
  function partnerHistoryOf(view) {
    const finalState = (IFY.S.state || {}).spouse;
    const stream = [];
    if (view) {
      view.segments.forEach((seg, si) => {
        let entry = "none";
        for (const e of (Array.isArray(seg.state.ledger) ? seg.state.ledger : [])) {
          if (e.kind === "state" && typeof e.id === "string" && e.id.startsWith("spouse>") && typeof e.age === "number" && e.age <= seg.fromAge) entry = e.id.slice(7);
        }
        stream.push({ age: seg.fromAge, to: entry, entryMark: true });
        for (const e of (view.segmentLedgers[si] || [])) if (e.kind === "state" && typeof e.id === "string" && e.id.startsWith("spouse>")) stream.push({ age: e.age, to: e.id.slice(7) });
      });
    } else {
      const led = Array.isArray(IFY.S.ledger) ? IFY.S.ledger : [];
      for (const e of led) if (e.kind === "state" && typeof e.id === "string" && e.id.startsWith("spouse>")) stream.push({ age: e.age, to: e.id.slice(7) });
    }
    let cur = "none", open = null, datingBreakups = 0;
    const parts = [];
    const dropOpen = () => { // 未结的任在段界/账外收掉：定下来的记「方式不可知」，相处期的记散了
      if (!open) return;
      if (open.settled) { open.endKind = "unknown"; parts.indexOf(open) >= 0 || parts.push(open); }
      else datingBreakups++;
      open = null;
    };
    for (const ev of stream) {
      const to = ev.to;
      if (to === cur) continue;
      if (ev.entryMark) { // 进段补头：先收上一段的未结任，再按进段值起头
        dropOpen();
        if (to === "partnered") { open = { start: null, settled: true, settledAge: null, endAge: null, endKind: null }; parts.push(open); }
        else if (to === "dating") open = { start: null, settled: false, settledAge: null, endAge: null, endKind: null };
        else if (to === "divorced" || to === "widowed") parts.push({ start: null, settled: true, settledAge: null, endAge: null, endKind: to });
        cur = to;
        continue;
      }
      if (to === "dating") {
        if (cur === "partnered") continue; // 边表无此边，不据此改写正在进行的任
        open = { start: ev.age, settled: false, settledAge: null, endAge: null, endKind: null };
        cur = "dating";
      } else if (to === "partnered") {
        if (cur === "dating" && open) { open.settled = true; open.settledAge = ev.age; parts.push(open); }
        else { open = { start: ev.age, settled: true, settledAge: ev.age, endAge: null, endKind: null }; parts.push(open); }
        cur = "partnered";
      } else if (to === "divorced" || to === "widowed") {
        if (open && open.settled) { open.endAge = ev.age; open.endKind = to; open = null; }
        else { if (open && !open.settled) { datingBreakups++; open = null; } parts.push({ start: null, settled: true, settledAge: null, endAge: ev.age, endKind: to }); }
        cur = to;
      } else if (to === "single") {
        if (cur === "dating" && open && !open.settled) { datingBreakups++; open = null; }
        cur = "single";
      } else if (to === "none") {
        cur = "none";
      }
    }
    const hasEntries = stream.some((e) => !e.entryMark);
    const known = view ? stream.length > 0 : (hasEntries || finalState === "none" || finalState === undefined);
    return { known, parts, datingBreakups, finalState };
  }

  // 陪伴槽多任文案（判词批 B）：parts ≥ 2，或终局 dating 但此前成过家时，按任次分开写。
  // 形状对不上、或任一相关任的终结方式不可知 → 返回 null，调用方回落现行文案，不编。
  // 三任以上走压缩形：前任们合成一句（prevClause 的多任支），只单写最后一段的收尾。
  function s2FromHistory(ph, final) {
    const parts = ph.parts;
    if (!parts.length) return null;
    const curInParts = final === "partnered" || final === "widowed" || final === "divorced";
    if (!curInParts && final !== "dating") return null;
    const prevs = curInParts ? parts.slice(0, -1) : parts.slice(); // 终局 dating 时现任不在 parts 里，全部任都是前任
    if (!prevs.length) return null; // 单任：回落现行
    const last = curInParts ? parts[parts.length - 1] : null;
    if (last) {
      if (final === "partnered" && last.endKind) return null;
      if (final === "widowed" && last.endKind !== "widowed") return null;
      if (final === "divorced" && last.endKind !== "divorced") return null;
    }
    if (prevs.some((p) => p.endKind !== "widowed" && p.endKind !== "divorced")) return null;
    const prevClause = () => {
      if (prevs.length === 1) {
        const p = prevs[0];
        if (p.endKind === "widowed") return p.endAge ? `${p.endAge}岁那年，对方先走了一步。` : "先前那位另一半，先走了一步。";
        return "先前那段婚姻，中途散了。";
      }
      const w = prevs.some((p) => p.endKind === "widowed"), d = prevs.some((p) => p.endKind === "divorced");
      if (w && d) return "再往前的日子里，有人先走了一步，也有婚姻中途散了。";
      if (w) return "再往前的日子里，陪着的人都先走了一步。";
      return "再往前的婚姻，前后都散了。";
    };
    if (final === "partnered") return prevClause() + "后来遇上的这个，陪着走到了最后。到老了，还是一张桌上吃饭。";
    if (final === "widowed") return prevClause() + "后来的这位，也先走了一步。最后一段路，是自己走完的。";
    if (final === "divorced") return prevClause() + "后来的这段，也散了。后来的日子，各过各的。";
    return prevClause() + "后来又遇上一个人，没领证，也没散，就这么处到了老。"; // final === "dating"
  }

  // ---------- 结算九槽（v0.18.0，地基 §4.6/§4.7）：九个槽位全读状态与账本拼装 ----------
  // 落脚/陪伴/钱/手艺事业/子女线/父母线/没办完的事/影子代价/认领句；认领句（玩家在瞥视时留下的话）原样入槽；
  // 判词退为九槽之后的收尾一行。平淡轨（没撞上什么大事的一生）在认领槽有「平淡而完整」的写法。
  function settlementSlots() {
    const F = IFY.S.flags, ST = IFY.S.state || {};
    // v0.22 WP7：段视图只在交换局非空——非空时子女/父母/没办完的事三槽与手艺事业的轨迹读段视图，
    // 钱槽照旧读终局身体（IFY.S）；视图为 null 时全槽走下方原读法，一字不动。
    // v0.22.1 F2/F4：交换局的落脚（下文 trail 段拼接）与陪伴（终局单身时查段内伴侣史）也改读段视图。
    const view = playerFacts();
    // v0.22.1 F4：交换局的落脚按段拼接——每段在自己 Track 的账本窗口内算居所轨迹
    // （residenceTrailOf），年数按段归属相加、终局落点取末段的真实落点；不再只读终局身体
    // 一轨的全程轨迹（那会把一段的年数说成整生、甚至把落点说反，审计 run-01/03/06）。
    // 未交换局（view 为 null）仍走 IFY.residenceTrail() 原读法。
    const trail = (view && typeof IFY.residenceTrailOf === "function") ? (() => {
      const spans = { home: 0, city: 0, abroad: 0 };
      let fin = null;
      for (const seg of view.segments) {
        const t = IFY.residenceTrailOf(seg.state, seg.fromAge, seg.toAge);
        spans.home += t.spans.home; spans.city += t.spans.city; spans.abroad += t.spans.abroad;
        fin = t.final;
      }
      return { final: fin, spans };
    })() : IFY.residenceTrail();
    const slots = [];
    // 落脚槽住房分文（v0.23 WP9，E7）：只许在无更强信号的缺省支按住房事实分文——final=home 的熟门熟路支
    // 与 final=city 的缺省支（else）；在外多年回老家、异国、出乡落脚三支是强信号支，不读住房。
    // v0.24.4（AN-2）：住房改读派生 housingOf（place.js）——form=reform 即房改那套、unit 即单位分房；
    // 旧版直读 boughtReform/unitHousing 两面旗，漏了只走到 bought_fangai 的半截房改链。
    const housing = typeof IFY.housingOf === "function" ? IFY.housingOf(IFY.S) : { form: F.boughtReform ? "reform" : null, unit: !!F.unitHousing, rentingNow: !!F.renting && !F.bought_house && !F.boughtReform && !F.unitHousing };
    // 落脚槽自洽（fix4-settle 第 2 条）：轨迹（residenceTrailOf）只读迁徙节点——居所预设事件
    // （永住 r_abroad_pr、派遣续约 ab37_014/005 这类「人还在外头」的既成事实）与 fork28 选了
    // 「不回」（often_back，只落探亲旗、不落迁徙节点）都不在轨迹的账上。这类事实与轨迹结论
    // 打架时，年数与归宿都不可靠：落脚槽改中性说法，不写具体年数、不下归宿断言（宁缺不编）。
    // 判定只读账本原样条目；交换局读合并账本（玩家亲历的时间线）。
    const ledS1 = view ? view.mergedLedger : (Array.isArray(IFY.S.ledger) ? IFY.S.ledger : []);
    const ABROAD_ASSERT_IDS = ["r_abroad_pr", "ab37_014", "ab37_005"];
    let lastHomeMoveAge = -1;
    for (const e of ledS1) if ((e.set === "back_home_stay" || e.set === "near_family") && typeof e.age === "number" && e.age > lastHomeMoveAge) lastHomeMoveAge = e.age;
    const s1ReturnDoubted = trail.final === "home" && ledS1.some((e) => ABROAD_ASSERT_IDS.includes(e.id) && typeof e.age === "number" && e.age > lastHomeMoveAge);
    const s1NeverLeftDoubted = trail.final === "home" && trail.spans.city + trail.spans.abroad === 0 && ledS1.some((e) => e.kind === "fork" && e.id === "fork28" && e.set === "often_back");
    const S1_NEUTRAL = "住的地方前后换过几处，老家住过，外头也住过。";
    let s1;
    if (trail.final === "home" && trail.spans.city + trail.spans.abroad >= 5) s1 = s1ReturnDoubted ? S1_NEUTRAL : `在外头住了${trail.spans.city + trail.spans.abroad}年，最后还是回了老家落脚。`;
    else if (trail.final === "abroad") s1 = `最后落脚在异国，在那边住了${trail.spans.abroad}年。`;
    else if (trail.final === "city" && IFY.S.route && IFY.S.route.id === "home") s1 = `后来出了家乡，在外头落了脚，一住${trail.spans.city}年。`;
    else if (trail.final === "home") s1 = s1NeverLeftDoubted ? S1_NEUTRAL : housing.form === "reform" ? "最后落脚在老家这边，住的还是房改那会儿买下的那套房。" : housing.unit ? "最后落脚在老家这边，住的还是单位分的那套房。" : housing.form === "selfbuilt" ? "最后落脚在老家这边，住的还是自己动手盖起来的那栋房。" : "最后落脚在老家这边，住的还是熟门熟路的地方。";
    else s1 = housing.form === "reform" ? "最后落脚在住惯了的这座城，住的还是房改那会儿买下的那套房。" : housing.unit ? "最后落脚在住惯了的这座城，住的还是单位分的那套房。" : "最后落脚在住惯了的这座城。";
    slots.push(["落脚", s1]);
    let s2;
    // 判词批 B：伴侣史认账——只读终局快照会把先逝/离异的前任整段抹掉（实证：第 13 局原配
    // 61 岁病故、71 岁再结伴，旧文仍写「另一半陪着走到了最后」；番頭 B 局离异后被同支吞掉）。
    // 账本可回放且是多任史时先按任次分开写（s2FromHistory）；单任史、历史不可知（无账本
    // 老档）与形状对不上的，一律回落下方现行链，一字不改。
    const phS2 = partnerHistoryOf(view);
    const s2hist = phS2.known ? s2FromHistory(phS2, ST.spouse) : null;
    if (s2hist) s2 = s2hist;
    else if (ST.spouse === "partnered") s2 = "另一半陪着走到了最后。几十年里吵过，也和好过，到老了还是一张桌上吃饭。";
    else if (ST.spouse === "widowed") s2 = "另一半先走了一步。最后一段路，是自己走完的。";
    else if (ST.spouse === "divorced") s2 = "中间那段婚姻散了。后来的日子，各过各的。";
    else if (ST.spouse === "dating") s2 = "身边一直有个人，没领证，也没散，就这么处到了老。";
    // v0.22.1 F2：终局身体是单身、但任一段里成过家/有过伴侣时，不许断言「没和谁凑成一对」——
    // 见证口径 = 段内 spouse 流转（stateWitnessed）或该段进段时的配偶状态（接管轨在交换岁
    // 之前已成家的情形，流转不在段切片内，按其全账本回放进段值补认）。
    else if (view && (view.stateWitnessed("spouse", "partnered") || segEntrySpouse(view, "partnered"))) s2 = "前一段日子里成了家，身边有过人。换了路以后，饭自己吃，屋里一直是一个人。";
    else if (view && (view.stateWitnessed("spouse", "dating") || segEntrySpouse(view, "dating"))) s2 = "前一段日子里，身边处过一个人。换了路以后没再遇上谁，饭自己吃，日子自己过，饭桌上一直是一副碗筷。";
    else if (ST.spouse === "single") s2 = "这一生没和谁凑成一对。日子自己过，饭自己吃，屋里一直是一个人。";
    else s2 = "没遇上要凑成一对的人。一个人过日子，饭桌上一直是一副碗筷。";
    slots.push(["陪伴", s2]);
    const m = IFY.S.stats.money;
    let s3;
    // 钱槽住房读法（v0.23 WP9，E7）：优先级 bought_house ＞ boughtReform ＞ unitHousing。
    // v0.24.4（AN-2）：改读派生 housingOf 的形态——own/commodity 走供房支（商品房与集资建房同此口径），
    // reform 走房改支（半截链 bought_fangai 也在此认账，旧版直读 boughtReform 会把这批人说成没买房），
    // unit 支只在未购房时走（住单位分的房、没在房子上掏大钱，余下按 money 四段分说）；多笔购房并存时
    // 形态取最早一次（housingOf 口径）。各支文案一字未动。
    // 住房线（v0.30.0）：钱槽多读 houseTier 与涨幅倍数 M（现值/asset0，house.js 闭式派生）。
    // R 档改按 houseTier 命中房改分支——fork33 年代框买家形态读 own 但档是 R，必须走房改文案；
    // own/commodity 支先按 M 分说（涨上来了/买在高点），其余情形沿用原两句按变现后钱分档（m 已含变现额）。
    const houseTier = IFY.S.houseTier || null;
    const houseM = houseTier && typeof IFY.houseMultipleOf === "function" ? IFY.houseMultipleOf(IFY.S, IFY.S.birthYear + (IFY.S.death ? IFY.S.death.age : IFY.S.age)) : null;
    // 富贵档（CL-112，CL-109 §六）：钱槽在住房支之前先判 FORTUNE——持有任一 traj_fortune_* 坐实旗
    // 或 traj_ipo（与事业槽读 traj_ipo 同口径：读本局终局旗，交换局的段见证不在此扩读）。
    // money≥55 走富贵档（覆盖住房支文案，住房形态在措辞里分三形带过）；money<40 走散财变体
    // （挣到过、没守住，也给一句体面的话）；40–55 不覆盖、回落下方住房支（旗是年轻时的事，
    // 日子回到了常态）。判词 moneyMain 只读数字轨迹，与此互不干涉，本次不动。
    // 深面孔（CL-140 立形、CL-140b 改门）：富贵档内部再分一副面孔——走深面孔三形（与
    // 普通富贵同住房分形、同层并列，不设更高档、不给头衔）。只在档内分流，富贵档总命中
    // （≥55）与散财/回落口径一字不动；轨迹行 lifeTags 同步一签（同门）。
    // 【改门注记，CL-140b】初版门 money≥85 经 1800 局双遍同种子亲验作废：富贵链坐实钱效
    // 使档内 money 普遍饱和（档内中位 96、=100 者占 48.3%、≥85 者占 82.8%），money 单轴
    // 切不出「一至两成半」的薄片。改切 (D)：FORTUNE ∧ money≥55 ∧ 坐实年龄 ≤47——坐实
    // 年龄 = IFY.S.flagAges 里本局富贵旗（traj_fortune_*/traj_ipo）的最早落点（flagAges
    // 是 record.js 的落旗岁账，首落即记；31 持旗种子三方对账：账本首落＝末落＝flagAges
    // 逐旗全等，富贵旗每局只落一次）。实测覆盖：富贵档 29 局中 5 局（17.2%，全人口
    // 0.28%），在「一至两成半」带内，语义为「坐实得早且守到终局」。flagAges 查不到落点
    // （无账本老档等）→ 不走深面孔，回落普通富贵面孔，不冒充。
    const FORTUNE = Object.keys(F).some((k) => F[k] && k.indexOf("traj_fortune_") === 0) || !!F.traj_ipo;
    const FD_FA2 = IFY.S.flagAges || {};
    let fortuneFirmAge = null;
    for (const k of Object.keys(F)) if (F[k] && (k.indexOf("traj_fortune_") === 0 || k === "traj_ipo") && typeof FD_FA2[k] === "number") fortuneFirmAge = fortuneFirmAge === null ? FD_FA2[k] : Math.min(fortuneFirmAge, FD_FA2[k]);
    if (FORTUNE && m >= 55 && fortuneFirmAge !== null && fortuneFirmAge <= 47) s3 = (houseTier === "R" || housing.unit || housing.owned === "reform" || housing.form === "reform") ? "住的还是这套老房，没换。钱到了这个数，花起来反倒没了声响——儿女差一截，你补上；老伙计张口，你应下。问你图啥，你说，住惯了。" : housing.owned ? "房子早供完了。钱到后来，成了账上的一个数：买东西先看喜不喜欢，价签是顺带瞥见的。家里谁遇上过不去的事，电话先打到你这儿，你应得下来。账还是自己记，就是记着记着，数目大得没了实感。" : "没买房，钱倒是真攒下了，攒到后来成了一个数。租房住着，房东涨租你就搬，搬哪儿都行。儿女置办东西差钱，你随手就给添上，从没让他们开第二回口。";
    else if (FORTUNE && m >= 55) s3 = (houseTier === "R" || housing.unit || housing.owned === "reform" || housing.form === "reform") ? "住的还是这套老房，没换。手里的钱够，后半程没为钱发过愁。老邻居问你图啥，你说，住惯了。" : housing.owned ? "房子早供完了。钱这一辈子，算是挣出来了——后半程没再为钱发过愁。账还是自己记，菜还是自己买，就是买什么不用再算三遍了。" : "没买房，钱倒是真攒下了。这一辈子钱上没受过憋屈，租房住着也自在，房东涨租，你搬走就是。";
    else if (FORTUNE && m < 40) s3 = "钱是真挣到过。后来散了大半，剩下的够过日子。说起那几年，你还是会笑一下——风光过，就不算白过。";
    else if (houseTier === "R" || housing.owned === "reform") s3 = m >= 60 ? "房改那会儿把住着的单位房买下来了，手里还留着余钱，够花。" : "房改时把住着的单位房买了下来，钱多半填进了这套房里，日子紧巴巴地过。";
    else if (housing.owned === "selfbuilt") s3 = m >= 40 ? "自己动手盖起来的房，没欠下月月要还的钱。地是村里的，房是自家的，手里还留着余钱，够花。" : "自己动手盖起来的房，没欠下月月要还的钱。地是村里的，房是自家的，日子紧巴巴地过。"; // 自建房支（农民路线）：无月供、无变现，只按手头宽紧分说
    else if (housing.owned === "own" || housing.owned === "commodity") {
      if (houseM != null && houseM >= 1.6) s3 = "当年买的那套房，涨上来了。终局算总账，房子这一笔是挣的。";
      else if (houseM != null && houseM < 0.9) s3 = "房子买在了价高的时候，后来一直没涨回来。钱多半填进了房子里。";
      else s3 = m >= 60 ? "房子供下来了，手里还留着余钱，够花。" : "供下了一套房，钱多半填进了房子里，日子紧巴巴地过。";
    }
    else if (housing.unit) s3 = m >= 70 ? "住的是单位分的房，没在房子上掏过大钱，手里的钱攒下了，够用，还有富余。" : m >= 40 ? "住的是单位分的房，没在房子上掏过大钱。钱不多不少，够日常开销。" : m >= 20 ? "住的是单位分的房，没在房子上掏过大钱，可手头还是紧，钱这事操心了一辈子。" : "住的是单位分的房，没在房子上掏过大钱，到最后也没攒下什么。饭还是一顿一顿吃，觉也照常睡。";
    else if (m >= 70) s3 = "没买房，手里的钱倒是攒下了，够用，还有富余。";
    else if (m >= 40) s3 = "钱不多不少，够日常开销。遇上大事帮不上，小日子能过。";
    else if (m >= 20) s3 = "手头一直紧。钱这事，操心了一辈子。";
    else s3 = "到最后也没攒下什么。饭还是一顿一顿吃，觉也照常睡。";
    slots.push(["钱", s3]);
    const g = IFY.S.stats.growth;
    const occ = view ? occupationTrailFromFacts(view) : occupationTrail(); // v0.20.0 M2：事业槽先读职业轨迹——「一辈子就干这一行」只许真单一行当贯穿的局出；v0.22 WP7：交换局改段版（见证口径汇总）
    let s4;
    if (F.traj_ipo || F.traj_funded) s4 = "事业做到过上市那一步，锣声听过，名字也上过报。";
    else if (F.side_business || F.side_job || F.side_start) s4 = g >= 60 ? "正职之外还干出过一份副业，后来成了日子里的一块。" : "正职之外试过副业，成没成另说，手没闲着。";
    else if (g >= 75) s4 = occ.none ? "手里的事干到了顶。碰上难事，身边的人会先来问你。" : "手里的活儿干到了顶。行里的人碰上难事，会来问你。";
    else if (g >= 50) s4 = occ.drift ? "干过的活儿不止一样。中间换过行当，新活儿从头学起，饭碗换了几次，都端住了。" : occ.single ? "一辈子就干这一行。活儿拿得出手，饭吃得安稳。" : "手里的活儿拿得出手，饭吃得安稳。";
    else if (F.night_school) s4 = "下班之后，还去夜校把课一节一节上完。手艺是自己给自己添的，没白费。";
    else if (F.mentor_bond) s4 = "带过人。自己踩过的坑，一条条列给年轻人，后来他们走得比你当年稳当。";
    else if (g >= 30) s4 = "活儿干得不算出色，胜在没出过大错。经手的事，没误过一件大的。";
    else s4 = "没在活儿上争过什么高低。活儿不好不坏，到点去，到点回，就这么干了一年又一年。";
    slots.push(["手艺事业", s4]);
    // 自检补修：子女槽「长成了大人」须有年龄算术支撑——子女在终局（死亡岁数）时须已满 18；
    // 还没长成的只说还在长。落点锚与子孙满堂同源（kidsBornAt ?? kidsAt），读不到锚按没长成处理（只少说不多说）。
    const kidGrownAtEnd = () => {
      const bornAt = typeof IFY.S.kidsBornAt === "number" ? IFY.S.kidsBornAt : (typeof IFY.S.kidsAt === "number" ? IFY.S.kidsAt : null);
      if (bornAt == null) return false;
      const endAge = IFY.S.death && typeof IFY.S.death.age === "number" ? IFY.S.death.age : (IFY.MAX_AGE || 80);
      return endAge - bornAt >= 18;
    };
    const kidPresenceSentence = () => kidPresenceCount() < 1 ? "孩子的事落定之后，日子还是照常往下过。逢年过节，电话里多说几句。" : (kidGrownAtEnd() ? "孩子在跟前长大，一年一年，也长成了大人。" : "孩子还在跟前长着，一年一年，个头往上蹿。");
    let s5;
    if (view) {
      // 子女槽段版（v0.22 WP7）：任一段有子（段内 kids>has 流转，或末段终局 kids=has）都算玩家的子女线；
      // 两段都有按时间序各一句（交换变体，单句 ≤60 字）；late_parent/kid_abroad 按 flagWitnessed 分段判。
      const lastIdx = view.segments.length - 1;
      const segHasKid = view.segments.map((seg, si) => view.segmentLedgers[si].some((e) => e.kind === "state" && e.id === "kids>has") || (si === lastIdx && seg.state.state && seg.state.state.kids === "has"));
      const hasIdx = segHasKid.map((h, i) => (h ? i : -1)).filter((i) => i >= 0);
      const kidSent = (si, ord) => {
        const seg = view.segments[si];
        if (view.flagWitnessed(seg.state, "late_parent")) return ord === 0 ? "前一段里孩子来得晚，还在给孩子开家长会。" : "后一段里孩子来得晚，还在给孩子开家长会。";
        if (view.flagWitnessed(seg.state, "kid_abroad")) return ord === 0 ? "前一段的孩子大了去了远方，过节靠电话热闹。" : "后一段的孩子大了去了远方，过节靠电话热闹。";
        return ord === 0 ? "前一段日子里有了孩子，看着孩子一点点长大。" : "后一段日子里也有了孩子，屋里又热闹起来。";
      };
      if (hasIdx.length >= 2) s5 = kidSent(hasIdx[0], 0) + kidSent(hasIdx[1], 1);
      else if (hasIdx.length === 1 && hasIdx[0] === lastIdx) {
        if (view.flagWitnessed("late_parent")) s5 = "孩子来得晚。别人抱孙辈的年纪，你还在给孩子开家长会。";
        else s5 = view.flagWitnessed("kid_abroad") ? "孩子大了，去了远方。逢年过节，电话那头热闹。" : kidPresenceSentence();
      }
      else if (hasIdx.length === 1) s5 = kidSent(hasIdx[0], 0);
      else if (view.domainEnd("kids") === "none") { const covK = view.covenant(); s5 = covK && covK.kind === "none" ? "孩子的事，" + (typeof covK.since === "number" ? covK.since : 38) + " 岁那年就定下了：不要。后来照着这个安排过。" : "这一生没要孩子。别人家围着孩子转的那些年，你这儿没这一摊事。"; }
      else s5 = "孩子的事一直没正式定下来。拖着拖着，就到了这岁数。";
    }
    else if (F.late_parent) s5 = "孩子来得晚。别人抱孙辈的年纪，你还在给孩子开家长会。";
    else if (ST.kids === "has") s5 = F.kid_abroad ? "孩子大了，去了远方。逢年过节，电话那头热闹。" : kidPresenceSentence();
    else if (ST.kids === "none") s5 = IFY.S.covenant && IFY.S.covenant.kind === "none" ? "孩子的事，" + (typeof IFY.S.covenant.since === "number" ? IFY.S.covenant.since : 38) + " 岁那年就定下了：不要。后来照着这个安排过。" : "这一生没要孩子。别人家围着孩子转的那些年，你这儿没这一摊事。";
    else s5 = "孩子的事一直没正式定下来。拖着拖着，就到了这岁数。";
    slots.push(["子女", s5]);
    // 父母槽：交换局 dad/mom 取 domainEnd 的见证终局、照护三旗按见证口径；未交换局读终局身体与本局旗（原读法）。
    const dadD = view ? view.domainEnd("dad") === "dead" : ST.dad === "dead", momD = view ? view.domainEnd("mom") === "dead" : ST.mom === "dead";
    const careSelf = view ? view.flagWitnessed("care_self") : !!F.care_self, careHired = view ? view.flagWitnessed("care_hired") : !!F.care_hired, careRotate = view ? view.flagWitnessed("care_rotate") : !!F.care_rotate;
    let s6;
    if (dadD && momD) s6 = careSelf ? "爸妈都送走了。需要人那几年，你回去陪过一阵。" : careHired ? "爸妈都送走了。走之前请了人照护，你管钱，也管事。" : careRotate ? "爸妈都送走了。需要人那几年，兄妹几个排着班，一人陪一段。" : "爸妈都送走了。最后那一程，赶上了。";
    else if (dadD) s6 = "爸先走了，妈还在。逢年过节，先给妈打电话。";
    else if (momD) s6 = "妈先走了，爸还在。老两口剩一个，屋里空了一半。";
    else s6 = "到这一生走完，爸妈都还健在。这一辈子，你没送走过他们。";
    // 父母线供料（v0.23 WP9）：家庭事实旗（GAME_REGISTRY.familyFacts）中父母线五旗按下方优先表至多取一条，
    // 追加在终局句之后。句子只写小时候/那几年的人生过程（那时家里的事），不写终局断言，与 dad/mom 终局不冲突。
    // 读法与本槽照护三旗同口径：交换局按段视图见证判（view.flagWitnessed），未交换局读本局旗。
    const PARENT_LINE_FACTS = [
      ["famRestructure95", "爸妈后来分开了。这事你小时候就知道了，日子还是照着过。"],
      ["famSplit55", "小时候你爸去外地支援新厂，家里分两处住过一阵。"],
      ["originLB", "小时候爸妈在外头挣钱，你跟着老人住，过年才齐人。"], // 带形门：随迁局不出此句（见下方 migrantForm 判）
      ["famLaidOff85", "你爸下过岗，家里紧过一阵，先紧的是你们小的。"], // AN-5 R5：主语按变体正文改单数（两变体都只有爸一人）
      ["famArrears85", "你爸的厂子发不出工资，家里紧过一阵。"], // AN-5 R5：11–13 岁弱档（停发找零活，未下岗落定）
      ["famTight78", "爸妈那几年为钱折腾过，家里的钱紧过一阵。"],
    ];
    // AN-5 R4：originLB 一旗两形——旗记的是「父母外出」状态，留守句断言的是「留守」形；
    // 形（leftBehind/migrantChild）在序章状态里，结算须读形再取句。随迁局（任一段序章状态
    // migrantChild 为真，两段共享同一序章、值恒一致）命中 originLB 时视同未命中、继续往下找；
    // 序章状态读不到（老档/无序章局）按原行为出句。随迁形自己的回述句属内容决定，本轮只止血。
    const migrantForm = (() => {
      const pros = [];
      if (IFY.S && IFY.S.prologue) pros.push(IFY.S.prologue);
      if (view) for (const seg of view.segments) if (seg.state && seg.state.prologue) pros.push(seg.state.prologue);
      return pros.some((p) => p && p.migrantChild);
    })();
    for (const [factFlag, factLine] of PARENT_LINE_FACTS) {
      if (factFlag === "originLB" && migrantForm) continue;
      if (view ? view.flagWitnessed(factFlag) : !!F[factFlag]) { s6 += factLine; break; }
    }
    slots.push(["父母", s6]);
    let s7;
    // 没办完的事（v0.22 WP7）：交换局 covenant 跨段查（任一段的约与其结账旗按见证口径）、late_tried 同理，
    // kids 收尾按 domainEnd 判；glimpsesSkipped 以下各支照旧（meta 与终局身体）。未交换局走原三支。
    const covSettle = view ? view.covenant() : (IFY.S.covenant || null);
    const covSince = covSettle && typeof covSettle.since === "number" ? covSettle.since : 38; // 立约岁数读本局真账（kidGateDue 随成家进度开门，不再钉 38；旧档无 since 才回落 38）
    if (view && view.flagWitnessed("cov_solo_done") && view.domainEnd("kids") === "undecided") s7 = covSince + " 岁挂起的那份账，" + (covSince + 7) + " 岁你一个人对完了。孩子的事没落定，可那份约不算悬着了。";
    else if (view && view.covenant() && view.covenant().kind === "wait" && view.domainEnd("kids") === "undecided") s7 = covSince + " 岁挂起的那份账，到最后也没正式对完。";
    else if (view && view.flagWitnessed("late_tried") && !view.flagWitnessed("late_parent")) s7 = "想要孩子那几年，试过，也跑过医院，最后没等来。这事放下了，就是偶尔还想起。";
    else if (!view && F.cov_solo_done && ST.kids === "undecided") s7 = covSince + " 岁挂起的那份账，" + (covSince + 7) + " 岁你一个人对完了。孩子的事没落定，可那份约不算悬着了。";
    else if (!view && IFY.S.covenant && IFY.S.covenant.kind === "wait" && ST.kids === "undecided") s7 = covSince + " 岁挂起的那份账，到最后也没正式对完。";
    else if (!view && F.late_tried && !F.late_parent) s7 = "想要孩子那几年，试过，也跑过医院，最后没等来。这事放下了，就是偶尔还想起。";
    else if ((IFY.playerMeta().glimpsesSkipped || 0) >= 2 && !(IFY.playerMeta().glimpsesSeen > 0)) s7 = "另一条路有几回摆在眼前，你都没去细看。那边后来什么样，你一直不知道。"; // v0.21 WP1：瞥视计数改读 session.meta（蓝图 3.1）；v0.22.1 F8：看过至少一次的人不许判「都没去细看」，计数口径与文案对齐（审计 run-13）
    else if (housing.rentingNow) s7 = "买房的事提过几回，最后没办成，一直租着住。"; // v0.24.4：改读派生 rentingNow——旧版三旗排除漏了 bought_commodity/bought_fangai/jizi_house，商品房买家照样出「一直租着住」（侦察 c1965 rec-05 实锤）
    else s7 = "没什么悬着的大事。手头的事都料理完了，没留下一桩拖到最后的。";
    slots.push(["没办完的事", s7]);
    // 第八槽（v0.22 WP7 交换局真账化；v0.22.1 F7 扩到未交换局）：只要本局有不受控 Track
    // （新局恒有），就读它的真实账本——终局一句 + shownFacts 揭价一句（取材与硬线见
    // eighthSlotReal 上方注释），与交换局同口径。模板代价句只作无账可依（legacy 旧档、
    // 无 Track）时的回落。沿革如实记：蓝图 7.3 字面本要未交接局也读 Track_B 全账本，v0.22
    // 施工时因 parity 冻结集硬线做了协调者裁定、只对交换局真账化；全记录审计 F7 证实模板
    // 断言（买房/搬家次数等）与未交换局影子的真实流水可逐条对撞，v0.22.1 按审计推翻裁定、
    // 全量真账化，parity 基线随本版按归因表重封（fix-v0221/REPORT.md）。
    const uncB = uncontrolledState();
    if (uncB) slots.push(["另一条路", eighthSlotReal(uncB)]);
    else {
      const mainU = (IFY.S.unchosen || []).find((u) => u.kind === "route");
      const sh = mainU && IFY.D.shadows ? IFY.D.shadows[mainU.id] : null;
      const cost = sh ? IFY.shadowCostText(sh).replace(/^代价也清楚：/, "") : "";
      slots.push(["另一条路", cost ? `没走的那条路，代价在那边：${cost}` : "没走的那几条路，你没走过，那边是什么日子，你不知道。"]);
    }
    const reflArr = IFY.playerMeta().reflections || []; const refl = reflArr.length ? reflArr[reflArr.length - 1].text : ""; // v0.21 WP1：第九槽 reflections 改读 session.meta（蓝图 3.1）
    const flatLife = !(IFY.S.usedRare || []).length && (Array.isArray(IFY.S.ledger) ? IFY.S.ledger.filter((e) => e.kind === "event").length : 99) < 30;
    slots.push(["你留的话", refl ? `「${refl}」` : flatLife ? "这一生没留下认领的话。没撞上什么稀罕事，年表里记着的，都是过日子的小事。" : "这一生没留下认领的话。话没留，事都在年表里记着。"]);
    return slots;
  }

  // ---------- 人生线（结算页收尾一节，年表之后、分享台之前） ----------
  // 六行横条：爸爸/妈妈/我/对方/孩子/另一条路，只记「谁在、从哪一年到哪一年」。
  // 取数全走本页既有通道，不新造口径：父母与伴侣、孩子的流转岁数读账本 state 流转
  // （交换局读 playerFacts 的 mergedLedger，与年表/九槽同源）；父母是否离世读 domainEnd/
  // 终局 state（与父母槽同判）；父母本人终龄 = 离世时我的岁数 + 出生时父母年龄 age0
  // （parents 进程，age0 出生掷定、两轨同值）；伴侣的任次与收尾读 partnerHistoryOf；
  // 孩子出生年读 kidsBornAt ?? kidsAt（apply/spouse 既有口径）；影子终龄读不受控 Track
  // 本人 state（与第八槽同源，renderEnd 入口已 fastForwardUncontrolled）。
  // 红线：不标分岔点/分开年龄、不写比较句、伴侣只写「对方」、孩子不写性别。
  // 纯呈现、只读：任何一步取数失败整节缺席，绝不拖垮结算页。
  function lifelineHtml(view) {
    try {
      const S = IFY.S;
      if (!S || !S.route) return "";
      const myFinal = IFY.finalAge();
      const led = view ? view.mergedLedger : (Array.isArray(S.ledger) ? S.ledger : []);
      const transFirst = {}, transLast = {};
      for (const e of led) {
        if (e && e.kind === "state" && typeof e.id === "string" && typeof e.age === "number") {
          if (!(e.id in transFirst)) transFirst[e.id] = e.age;
          transLast[e.id] = e.age;
        }
      }
      const parentsOf = (who) => {
        if (S.parents && S.parents[who]) return S.parents[who];
        if (view) for (const seg of view.segments) { const p = seg.state && seg.state.parents; if (p && p[who]) return p[who]; }
        return null;
      };
      const parentDead = (who) => view ? view.domainEnd(who) === "dead" : !!((S.state || {})[who] === "dead");
      const parentInfo = (who) => {
        let deathAt = null;
        if (parentDead(who)) {
          if (typeof transLast[who + ">dead"] === "number") deathAt = transLast[who + ">dead"];
          else { const P = parentsOf(who); if (P && typeof P.deathAge === "number") deathAt = P.deathAge; } // 账本缺流转时的回落：进程掷定的离世点（进程发作即此岁）
        }
        const P0 = parentsOf(who);
        const age0 = P0 && typeof P0.age0 === "number" ? P0.age0 : null;
        return { deathAt, ownAge: deathAt != null && age0 != null ? deathAt + age0 : null };
      };
      const dad = parentInfo("dad"), mom = parentInfo("mom");
      // 伴侣：对方行画最后一任（结算陪伴槽的「对方」同指）；成家标记取第一次定下来的岁数。
      const ph = partnerHistoryOf(view);
      const marryAge = typeof transFirst["spouse>partnered"] === "number" ? transFirst["spouse>partnered"]
        : (ph.parts.length && typeof ph.parts[0].settledAge === "number" ? ph.parts[0].settledAge : null);
      let pStart = null, pEnd = null; // pEnd: {t:"alive"} | {t:"widowed"|"divorced", age}
      if (ph.parts.length) {
        const last = ph.parts[ph.parts.length - 1];
        pStart = typeof last.settledAge === "number" ? last.settledAge
          : (typeof transLast["spouse>partnered"] === "number" ? transLast["spouse>partnered"] : marryAge);
        if ((last.endKind === "widowed" || last.endKind === "divorced") && typeof last.endAge === "number") pEnd = { t: last.endKind, age: last.endAge };
        else pEnd = { t: "alive" };
      } else if (marryAge != null) { // 账本可回放但任次形状对不上（known=false 的老档等）：按终局身体回落
        pStart = marryAge;
        const fin = (S.state || {}).spouse;
        if (fin === "widowed" && typeof transLast["spouse>widowed"] === "number") pEnd = { t: "widowed", age: transLast["spouse>widowed"] };
        else if (fin === "divorced" && typeof transLast["spouse>divorced"] === "number") pEnd = { t: "divorced", age: transLast["spouse>divorced"] };
        else pEnd = { t: "alive" };
      }
      if (pStart == null && (S.state || {}).spouse === "dating" && typeof transFirst["spouse>dating"] === "number") {
        pStart = transFirst["spouse>dating"]; pEnd = { t: "alive" }; // 没领证、处到老的：行从处上那年起，不落成家标记
      }
      // 孩子：有孩子才有行；出生年优先本轨 kidsBornAt ?? kidsAt，交换局再退账本首次 kids>has 流转岁。
      let kidBorn = null;
      const kidsHas = view ? (view.domainEnd("kids") === "has" || typeof transFirst["kids>has"] === "number") : (S.state || {}).kids === "has";
      if (kidsHas) {
        if (typeof S.kidsBornAt === "number") kidBorn = S.kidsBornAt;
        else if (typeof S.kidsAt === "number") kidBorn = S.kidsAt;
        else if (typeof transFirst["kids>has"] === "number") kidBorn = transFirst["kids>has"];
        else if (view) for (const seg of view.segments) { const st = seg.state; if (typeof st.kidsBornAt === "number") { kidBorn = st.kidsBornAt; break; } if (typeof st.kidsAt === "number") { kidBorn = st.kidsAt; break; } }
      }
      // 影子：不受控 Track 本人终龄（无 Track 的旧档整行缺席，不编岁数）。
      const B = uncontrolledState();
      const shadowFinal = B ? (B.death ? B.death.age : (typeof B.age === "number" ? B.age : null)) : null;
      // ---------- 几何（手机列：viewBox 360 宽，按原生尺寸出图，字号 ≥10） ----------
      const X0 = 52, XR = 338, XTIP = 350, W = 360;
      const axisMax = Math.max(30, Math.ceil(Math.max(myFinal, shadowFinal || 0) / 10) * 10);
      const X = (age) => X0 + (Math.max(0, Math.min(age, axisMax)) / axisMax) * (XR - X0);
      const estW = (t) => { let w = 0; for (const ch of String(t)) w += /[0-9]/.test(ch) ? 6 : 10.5; return w; };
      const C = { dad: "#5d5648", mom: "#7a6a58", me: "#2f5d43", partner: "#8a6f55", kid: "#97917a", shadow: "#7d968a", grid: "#e3dac4", note: "#9a8f7a" };
      const rows = [];
      const arrow = (x, y, col) => `<path d="M${x} ${y} l-9 -4.5 v9 z" fill="${col}"/>`;
      const endNote = (dotX, y, text, col) => { // 点旁注：右侧放得下就放右边；放不下改到点左上方（贴线同高会让虚线从字缝里透出来）
        const w = estW(text);
        return dotX + 7 + w <= W - 2
          ? `<text x="${(dotX + 7).toFixed(1)}" y="${y + 4}" font-size="10.5" fill="${col}">${IFY.esc(text)}</text>`
          : `<text x="${(dotX - 2).toFixed(1)}" y="${y - 8}" font-size="10.5" fill="${col}" text-anchor="end">${IFY.esc(text)}</text>`;
      };
      const belowNote = (sx, y, text) => { // 行下注：从起点往右写，超界改贴右界收尾
        const w = estW(text);
        return sx + w <= W - 2
          ? `<text x="${sx.toFixed(1)}" y="${y}" font-size="10.5" fill="${C.note}">${IFY.esc(text)}</text>`
          : `<text x="${W - 2}" y="${y}" font-size="10.5" fill="${C.note}" text-anchor="end">${IFY.esc(text)}</text>`;
      };
      const parentRow = (label, info, col) => {
        if (info.deathAt != null) {
          const dx = X(info.deathAt);
          return { h: 30, body: (y) => `<line x1="${X0}" y1="${y}" x2="${dx.toFixed(1)}" y2="${y}" stroke="${col}" stroke-width="3" stroke-linecap="round"/><circle cx="${dx.toFixed(1)}" cy="${y}" r="3.5" fill="${col}"/>${endNote(dx, y, info.ownAge != null ? `${info.ownAge} 岁那年走了` : "那年走了", col)}` };
        }
        return { h: 30, body: (y) => `<line x1="${X0}" y1="${y}" x2="${XTIP - 2}" y2="${y}" stroke="${col}" stroke-width="3" stroke-linecap="round"/>${arrow(XTIP, y, col)}` };
      };
      rows.push({ label: "爸爸", col: C.dad, ...parentRow("爸爸", dad, C.dad) });
      rows.push({ label: "妈妈", col: C.mom, ...parentRow("妈妈", mom, C.mom) });
      rows.push({
        label: "我", col: C.me, h: 46,
        body: (y) => {
          const lineY = y + 18, ex = X(myFinal);
          let s = `<line x1="${X0}" y1="${lineY}" x2="${ex.toFixed(1)}" y2="${lineY}" stroke="${C.me}" stroke-width="4" stroke-linecap="round"/>`;
          const marks = [];
          if (marryAge != null) marks.push({ age: marryAge, text: `${marryAge} 岁，成家` });
          if (kidBorn != null) marks.push({ age: kidBorn, text: `${kidBorn} 岁，孩子出生` });
          marks.sort((a, b) => a.age - b.age);
          const near = marks.length === 2 && Math.abs(X(marks[1].age) - X(marks[0].age)) < 100;
          marks.forEach((mk, i) => {
            const mx = X(mk.age);
            s += `<circle cx="${mx.toFixed(1)}" cy="${lineY}" r="3" fill="#FFFDF8" stroke="${C.me}" stroke-width="2.2"/>`;
            let anchor = "middle", tx = mx;
            if (near) { anchor = i === 0 ? "end" : "start"; tx = i === 0 ? mx - 6 : mx + 6; }
            else tx = Math.max(X0 + 26, Math.min(322, mx));
            s += `<text x="${tx.toFixed(1)}" y="${lineY - 8}" font-size="10.5" fill="${C.me}" text-anchor="${anchor}">${IFY.esc(mk.text)}</text>`;
          });
          s += `<circle cx="${ex.toFixed(1)}" cy="${lineY}" r="4" fill="${C.me}"/><text x="${ex.toFixed(1)}" y="${lineY + 17}" font-size="11" fill="${C.me}" text-anchor="end">${myFinal} 岁</text>`;
          return s;
        },
      });
      if (pStart != null && pEnd) rows.push({
        label: "对方", col: C.partner, h: 48,
        body: (y) => {
          const sx = X(pStart);
          let s = pEnd.t === "alive"
            ? `<line x1="${sx.toFixed(1)}" y1="${y}" x2="${XTIP - 2}" y2="${y}" stroke="${C.partner}" stroke-width="3" stroke-linecap="round"/>${arrow(XTIP, y, C.partner)}`
            : `<line x1="${sx.toFixed(1)}" y1="${y}" x2="${X(pEnd.age).toFixed(1)}" y2="${y}" stroke="${C.partner}" stroke-width="3" stroke-linecap="round"/><circle cx="${X(pEnd.age).toFixed(1)}" cy="${y}" r="3.5" fill="${C.partner}"/>`;
          return s + belowNote(sx, y + 17, `${pStart} 岁那年，并入这条线`);
        },
      });
      if (kidBorn != null) rows.push({
        label: "孩子", col: C.kid, h: 48,
        body: (y) => {
          const sx = X(kidBorn);
          return `<line x1="${sx.toFixed(1)}" y1="${y}" x2="${XTIP - 2}" y2="${y}" stroke="${C.kid}" stroke-width="3" stroke-linecap="round"/>${arrow(XTIP, y, C.kid)}` + belowNote(sx, y + 17, `${kidBorn} 岁那年，从这条线分出去`);
        },
      });
      if (shadowFinal != null) rows.push({
        label: "另一条路", col: C.shadow, h: 26,
        body: (y) => {
          const dx = X(shadowFinal);
          return `<line x1="${X0}" y1="${y}" x2="${dx.toFixed(1)}" y2="${y}" stroke="${C.shadow}" stroke-width="3" stroke-linecap="round" stroke-dasharray="6 5"/><circle cx="${dx.toFixed(1)}" cy="${y}" r="3.5" fill="${C.shadow}"/>${endNote(dx, y, `没选的那条路，${shadowFinal} 岁走完`, C.shadow)}`;
        },
      });
      // 纵向排布 + 网格 + 轴标
      let y = 14;
      const rowYs = rows.map((r) => { const yy = y; y += r.h; return yy; });
      const axisY = y + 4, H = axisY + 16;
      let grid = "", axis = "";
      for (let a = 0; a <= axisMax; a += 10) {
        const gx = X(a).toFixed(1);
        grid += `<line x1="${gx}" y1="6" x2="${gx}" y2="${axisY - 12}" stroke="${C.grid}" stroke-width="1"/>`;
        const lab = a === 0 ? "0 岁" : (a === axisMax ? `${a} 岁` : `${a}`);
        axis += `<text x="${gx}" y="${axisY + 2}" font-size="10.5" fill="${C.note}" text-anchor="middle">${lab}</text>`;
      }
      let body = "";
      rows.forEach((r, i) => {
        const yy = rowYs[i];
        const lineY = r.label === "我" ? yy + 18 : yy + 10;
        body += `<text x="46" y="${lineY + 4}" font-size="11" fill="${r.col}" text-anchor="end"${r.label === "我" ? ` font-weight="600"` : ""}>${r.label}</text>` + r.body(yy + (r.label === "我" ? 0 : 10) - (r.label === "我" ? 0 : 0)) ;
      });
      // 图下小注：按本局实际有的开口行拼（父母双双开口时并成一个单位，避免与首句重名）
      const openNames = [];
      if (dad.deathAt == null && mom.deathAt == null) openNames.push("爸爸妈妈");
      else { if (dad.deathAt == null) openNames.push("爸爸"); if (mom.deathAt == null) openNames.push("妈妈"); }
      if (pEnd && pEnd.t === "alive") openNames.push("对方");
      if (kidBorn != null) openNames.push("孩子");
      let cap;
      if (openNames.length === 1 && openNames[0] === "爸爸妈妈") cap = "爸爸妈妈的线从我出生那年画起，还往前走，画到我这一生结束为止。";
      else {
        cap = "爸爸妈妈的线从我出生那年画起";
        if (openNames.length) {
          const joined = openNames.length === 1 ? openNames[0] : openNames.slice(0, -1).join("、") + "和" + openNames[openNames.length - 1];
          cap += `；${joined}的线还往前走，画到我这一生结束为止`;
        }
        cap += "。";
      }
      return `<div class="rev" id="lifeline-sec" style="--d:.65s"><h3>人生线</h3><svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="人生线">${grid}${body}${axis}</svg><p class="hint" style="margin-top:2px">${IFY.esc(cap)}</p></div>`;
    } catch (e) { return ""; }
  }

  // ---------- F1「回头看，有一年」（圆桌决议 F1）：从玩家本人账本里选出最好的一年 ----------
  // 纯函数：只读已定格的账本（交换局读 playerFacts 合并账）、流水、flagAges 与 statsPeak，
  // 不掷骰、不写状态、不消费任何随机流；同一局重复求值逐字一致。
  // 选年打分（多维读账，钱维数值本身永不计分——买房计的是「落定一件大事」不是钱多）：
  //   关系：领证 +50 / 孩子出生 +50 / 处上对象（首次 dating）+25 / 添宠物 +15
  //   事件：买房落定 +35 / 考上入行 +35 / 稀有际遇 +30 / 副业成形 +20 / 退休 +20 /
  //         爱好立旗 +15 / 其余有抉择的年份 +10（兜底候选）
  //   健康：流水里出现康复/戒断/锻炼类事实的年份 +15（每岁至多一次）
  //   维度加权（复用判词升格的 statsPeak 峰值读账）：关系峰值 ≥85 时关系类 +10、≥75 时 +5；
  //   健康峰值 ≥85 时健康类 +10、≥75 时 +5；成长峰值 ≥85 时考上/副业 +5。
  //   守卫：当年有父母离世/丧偶/离异流转的年份整年出局（那一年再有喜事也不指它）；
  //   同分时先比「有没有一句能引的流水」，再取更早的岁数。全候选 ≤0 分 → 返回 null，整节不出。
  function bestYearOf(view) {
    try {
      const S = IFY.S;
      if (!S || !S.route) return null;
      const led = view ? view.mergedLedger : (Array.isArray(S.ledger) ? S.ledger : []);
      const logArr = view ? view.mergedLog : (Array.isArray(S.log) ? S.log : []);
      const pk = (k) => (S.statsPeak && typeof S.statsPeak[k] === "number" ? S.statsPeak[k] : 0);
      const relB = pk("relation") >= 85 ? 10 : pk("relation") >= 75 ? 5 : 0;
      const heaB = pk("health") >= 85 ? 10 : pk("health") >= 75 ? 5 : 0;
      const groB = pk("growth") >= 85 ? 5 : 0;
      const score = new Map(); // age -> { pts, cat }（cat = 该岁最高优先类别，定引文口径）
      const CAT_PRIO = { kid: 0, marry: 1, house: 2, exam: 3, rare: 4, dating: 5, side: 6, retire: 7, pet: 8, hobby: 9, health: 10, fork: 11 };
      const add = (age, pts, cat) => {
        if (typeof age !== "number" || !(age >= 0)) return;
        const cur = score.get(age) || { pts: 0, cat: null };
        cur.pts += pts;
        if (cat && (cur.cat === null || CAT_PRIO[cat] < CAT_PRIO[cur.cat])) cur.cat = cat;
        score.set(age, cur);
      };
      const banned = new Set();
      let datingDone = false;
      for (const e of led) {
        if (!e || typeof e.age !== "number") continue;
        if (e.kind === "state") {
          if (e.id === "dad>dead" || e.id === "mom>dead" || e.id === "spouse>widowed" || e.id === "spouse>divorced") banned.add(e.age);
          else if (e.id === "spouse>partnered") add(e.age, 50 + relB, "marry");
          else if (e.id === "spouse>dating" && !datingDone) { datingDone = true; add(e.age, 25 + relB, "dating"); }
          else if (e.id === "dog>home" || e.id === "cat>home") add(e.age, 15, "pet");
          else if (e.id === "workPhase>retired") add(e.age, 20, "retire");
        }
      }
      // 孩子出生年：与子女槽/人生线同锚（kidsBornAt ?? kidsAt），交换局再扫各段 Track
      let kidBorn = null;
      if (typeof S.kidsBornAt === "number") kidBorn = S.kidsBornAt;
      else if (typeof S.kidsAt === "number") kidBorn = S.kidsAt;
      else if (view) for (const seg of view.segments) { const st = seg.state; if (typeof st.kidsBornAt === "number") { kidBorn = st.kidsBornAt; break; } if (typeof st.kidsAt === "number") { kidBorn = st.kidsAt; break; } }
      if (kidBorn != null) add(kidBorn, 50 + relB, "kid");
      // 旗标落点（flagAges 是引擎的落旗岁账）：买房/考上/爱好/副业
      const FA = S.flagAges || {};
      const F = S.flags || {};
      const flagAge = (f) => (F[f] && typeof FA[f] === "number" ? FA[f] : null);
      for (const f of ["bought_house", "bought_fangai", "jizi_house", "bought_commodity"]) { const a = flagAge(f); if (a != null) { add(a, 35, "house"); break; } }
      { const a = flagAge("exam_landed"); if (a != null) add(a, 35 + groB, "exam"); }
      for (const f of ["side_business", "side_job", "side_start"]) { const a = flagAge(f); if (a != null) { add(a, 20 + groB, "side"); break; } }
      for (const f of Object.keys(F)) if (f.startsWith("hobby_")) { const a = flagAge(f); if (a != null) add(a, 15, "hobby"); }
      // 流水逐年读：稀有际遇 / 健康事实 / 有抉择的年份（兜底候选），并留引文
      const SYS = ["影子：", "两条路上都一样的是", "工资年结", "交换：", "出身：", "立约："];
      const linesByAge = new Map();
      for (const l of logArr) {
        const m = typeof l === "string" && l.match(/^(\d+) 岁 · ([\s\S]*)$/);
        if (!m) continue;
        const age = +m[1], text = m[2];
        if (!linesByAge.has(age)) linesByAge.set(age, []);
        linesByAge.get(age).push(text);
        if (SYS.some((p) => text.startsWith(p)) || text.includes("这一生停在这里")) continue;
        if (text.includes("【稀有】")) add(age, 30, "rare");
        if (/出院|康复|戒了|戒烟|锻炼|跑起来|爬山|游泳/.test(text)) add(age, 15 + heaB, "health");
        if (text.includes("：")) add(age, 10, "fork");
      }
      for (const a of banned) score.delete(a);
      let best = null;
      for (const [age, v] of [...score.entries()].sort((a, b) => a[0] - b[0])) {
        if (v.pts <= 0) continue;
        const hasLine = (linesByAge.get(age) || []).some((t) => !SYS.some((p) => t.startsWith(p)));
        const cand = { age, pts: v.pts, cat: v.cat, hasLine };
        if (!best || cand.pts > best.pts || (cand.pts === best.pts && cand.hasLine && !best.hasLine)) best = cand;
      }
      if (!best) return null;
      // 引文：先按类别在当年流水里找那件事本体，找不到退当年第一条非系统行，再退事实句
      const CAT_RE = {
        marry: /领证|结婚|成家|把证领了/, kid: /孩子出生|产房|生了/, house: /买房|买了房|搬进|新房/,
        exam: /考上|录取|上岸|考进/, rare: /【稀有】/, retire: /退休|退了|退下来/,
        dating: /处了|在一起|对象/, side: /副业|摊|小店/, pet: /狗|猫/, hobby: /书法|摄影|钓鱼|种菜|音乐|跑步|做饭|羽毛球|爱好/,
      };
      const FALLBACK = {
        marry: "那一年，你和对方把证领了。", kid: "那一年，孩子出生了。", dating: "那一年，你处了一个人。",
        house: "那一年，房子定下来了。", retire: "那一年，你退了下来。", pet: "那一年，家里添了个伴儿。",
        exam: "那一年，你考上了。", side: "那一年，正职之外多了一摊活儿。", hobby: "那一年，你添了个爱好。",
        health: "那一年，身体缓过来了。", rare: "那一年，撞上一件稀罕事。", fork: "那一年，你做了个大决定。",
      };
      const lines = (linesByAge.get(best.age) || []).filter((t) => !SYS.some((p) => t.startsWith(p)) && !t.includes("这一生停在这里"));
      let sentence = "";
      const re = best.cat && CAT_RE[best.cat];
      if (re) { const hit = lines.find((t) => re.test(t)); if (hit) sentence = hit; }
      if (!sentence && lines.length) sentence = lines[0];
      if (sentence) {
        sentence = sentence.split("。")[0].trim();
        if (sentence.length > 64) sentence = sentence.slice(0, 64);
        if (sentence) sentence += "。";
      }
      if (!sentence) sentence = (best.cat && FALLBACK[best.cat]) || "那一年，日子过得顺。";
      const year = typeof S.birthYear === "number" ? S.birthYear + best.age : null;
      return { age: best.age, year, pts: best.pts, cat: best.cat, sentence };
    } catch (e) { return null; }
  }
  function bestYearHtml(view) {
    const b = bestYearOf(view);
    if (!b) return "";
    const head = b.year != null ? `${b.year} 年，你 ${b.age} 岁。` : `你 ${b.age} 岁那年。`;
    return `<div class="bestyear"><h3>回头看，有一年</h3><p>${IFY.esc(head + b.sentence)}</p></div>`;
  }

  function renderEnd() {
    // 回放标记（父亲事故热修）：开局屏「最近活过的人生」列表置 IFY._endRerun/_endInfo 后调本
    // 函数，按那一局的快照重渲染本页——本页全部取数都是状态的纯函数（本文件不耗随机流），
    // 重渲染与原页一致；回放时不重复上报 game_complete、不重复落活过记录、也不再留档（看旧局
    // 不许挤掉新局的档、更不许在列表里重复占位），「第一次」两行按快照 endInfo 还原。
    const endRerun = !!IFY._endRerun;
    const endInfo = IFY._endInfo || null;
    IFY._endRerun = false; IFY._endInfo = null;
    // 结算快进（v0.22 WP7，蓝图 7.4）：先把不受控 Track 步进到死亡或保险丝（110）并置 finalized。
    // 终局后续读入口已随父亲事故热修落地（本函数下方「终局留档」）：不再清档，定案整局带
    // ended 标记留在存档里，开新局时 save() 覆盖、标记随之消失——蓝图当年留的话至此兑现。
    fastForwardUncontrolled();
    // 住房变现落账（v0.30.0）：两条 Track 都已定案——在 verdict/特殊结局/九槽文案等任何读终值的
    // 判定之前，各调一次 houseSettleDue（houseSettled 防重；资产只在此刻进流动金钱）。
    // v0.30.3：主角轨终局必经死亡屏，落账已在 renderDeath 提前发生，此处对主角轨为空转；
    // 影子轨仍在此处落账（v0.32.0 起影子终局同样必有 death）。
    if (typeof IFY.houseSettleDue === "function") {
      IFY.houseSettleDue(IFY.S);
      const sesH = IFY.session;
      const otherH = sesH && sesH.tracks ? sesH.tracks[sesH.controlTrack === "A" ? "B" : "A"] : null;
      if (otherH && otherH.state && otherH.state !== IFY.S) IFY.houseSettleDue(otherH.state);
    }
    // 住房变现来历行（v0.31.2）：80 岁走完路径没有死亡屏先落这笔，结算页的钱凭空多出一截、
    // 没一句话交代（ellie-diag-money80 定根）。从玩家本人 Track 的房子账本读 settle 条的实际
    // 落账额（死亡/走完两条路径同读法；影子轨的账记在它自己的 state 上，不进这行），取整后
    // >0 才出一行。纯呈现：只读账本，不动落账时刻与金额。
    const settleEnt = typeof IFY.houseLedgerOf === "function"
      ? IFY.houseLedgerOf(IFY.S).filter((e) => e.type === "settle").pop() : null;
    const houseGain = settleEnt ? Math.round(settleEnt.actual) : 0;
    const houseLine = houseGain > 0 ? `<p>房子最后折了 ${houseGain}，添进这一生的钱里。</p>` : "";
    IFY.curKind = "end";
    IFY.clearAutoContext();
    IFY.app().classList.remove("playwrap");
    const v = verdict();
    const sp = specialEnding();
    IFY.S.special = sp;
    if (!endRerun) IFY.ANA.track("game_complete", { era: IFY.S.era, route: IFY.S.route.id, endAge: IFY.finalAge(), death: !!IFY.S.death, ending: sp ? sp.id : "none", tier: sp ? sp.tier : "none" });
    if (!endRerun && typeof window !== "undefined" && window.IFY_MONITOR) IFY_MONITOR.runEnd(); // CL-144：数据监视新路（events 表 run_end），与 game_complete 同刻同守卫；失败静默、模块缺席即跳过
    const livesNew = endRerun ? (endInfo || { newEnding: false, newRare: false }) : IFY.recordLives(sp ? sp.id : null, IFY.S.usedRare || []); // 活过记录：落盘 + 本局新纪录（§B3）；回放按快照 endInfo 还原，不重复落盘
    if (!endRerun) {
      IFY.recordDayAndLife(); // 留存记录（v0.15.0）：日子表 + 最近一局回看，与活过记录同一落点、互不相干
      // 终局留档（父亲事故热修）：定案整局两处落盘——①ify-save-v2 打 ended 标记，保留到下一局
      // 开局 save() 覆盖为止；②「最近活过的人生」列表（ify-history-v1，环形保留最近 5 局整局
      // 快照）供开局屏逐局回看。回放时两处都不写（见函数头回放标记注释）。
      const endInfoObj = { newEnding: !!livesNew.newEnding, newRare: !!livesNew.newRare };
      const endDisplay = { at: IFY.todayStr(), era: IFY.S.era, routeName: IFY.S.route ? IFY.S.route.name : "", endAge: IFY.finalAge(), verdictLine: v.text.split("。")[0] + "。" };
      try {
        IFY.save();
        const rawEnd = localStorage.getItem(IFY.SAVE_KEY);
        if (rawEnd) {
          const dataEnd = JSON.parse(rawEnd);
          dataEnd.ended = true;
          dataEnd.endInfo = endInfoObj;
          dataEnd.endDisplay = endDisplay;
          localStorage.setItem(IFY.SAVE_KEY, JSON.stringify(dataEnd));
        }
      } catch (e) { /* 落不下不阻塞结算呈现 */ }
      if (typeof IFY.recordHistory === "function") IFY.recordHistory(endInfoObj, endDisplay);
      if (typeof IFY.recordSeen === "function") IFY.recordSeen(); // 跨局避重：本局见过的池事件落盘，供下一局开局装填（回放不写，与上方各记录同一 !endRerun 守卫）
    }
    const shadowLines = IFY.shadowCompareLines();
    const covLineRaw = IFY.covenantSettleLine(); // fork38 立约的结算对账行（v0.17.0）：没有立过约就不出
    const covLine = (covLineRaw.includes("立的约") && !covenantHadPartner(playerFacts())) ? "" : covLineRaw; // fix4-settle 第 3 条：38 岁前没走过定关系/领证路径的局，对账行不许断言立过约（判法见 covenantHadPartner）
    // 自动推进提示（v0.17.0 定案）：默认关的玩家，完局后只在这页提示一次可开平年自动；提示过就落 prefs，不再重复
    const showAutoHint = IFY.prefs.mode === "off" && !IFY.prefs.autoHintSeen;
    if (showAutoHint) { IFY.prefs.autoHintSeen = true; IFY.savePrefs(); }
    const skippedLine = IFY.playerMeta().glimpsesSkipped ? `<p>你有 ${IFY.playerMeta().glimpsesSkipped} 次没有去细看另一条路。那几条路后来走成了什么样，你没看过。</p>` : ""; // v0.21 WP1：瞥视计数改读 meta
    const reflHtml = IFY.playerMeta().reflections.length
      ? `<h3>你留给自己的话</h3>` + IFY.playerMeta().reflections.map((r) => `<p class="refl">「${IFY.esc(r.text)}」（${r.age} 岁）</p>`).join("") : ""; // v0.21 WP1：reflections 改读 meta
    // fix7：结算年表改读分段合并视图（playerFacts，与分岔图/九槽同源）：交换局按 controlLog 段窗拼玩家实际控制过的
    // 每一段账（A 轨 5 岁→交换岁、B 轨交换岁→终局，交换交出/接管行都落在交换岁、两段切片都含）；视图为 null
    // （未交换/段不成立）时走原直读 IFY.S.log，未交换输出逐行不变。
    const tlView = playerFacts();
    const tlLog = tlView ? tlView.mergedLog : IFY.S.log;
    // F7（圆桌决议）：影子结局一句话前置到判词之后——取第八槽同一句（shadowFinalSentence，
    // 与九槽「另一条路」槽同源同字）。2026-11-08 用户批准艾莉预判：结算页展示时收掉第八槽里
    // 的同句，只保留揭价句；没有揭价句时第八槽不在本页重复出现。settlementSlots() 的原始
    // 数据不变，典藏仍从槽里取完整终局句。无不受控 Track 的旧档不出前置行、也不收槽。
    const uncF7 = uncontrolledState();
    const shadowFirst = uncF7 ? shadowFinalSentence(uncF7) : "";
    const displaySlots = settlementSlots().map(([k, t]) => {
      if (k === "另一条路" && shadowFirst && t.startsWith(shadowFirst)) return [k, t.slice(shadowFirst.length)];
      return [k, t];
    }).filter(([k, t]) => !(k === "另一条路" && shadowFirst && !t));
    // CL-150：年表里的工资年结同流水账口径降为附加信息——不再独立成段，按连续同龄段
    // 归并后作小字附注（.wageattach）挂到同年最后一段正文之下；该年只有年结行时以
    // 弱化小字段（.wagenote）垫底，不丢行。tlLog 存储与 SYS 前缀识别一字未动。
    const tlHtml = (() => {
      const ent = (tlLog || []).map((l) => {
        const m = typeof l === "string" && l.match(/^(\d+) 岁 · ([\s\S]*)$/);
        return { raw: l, age: m ? +m[1] : null, txt: m ? m[2] : l, wage: !!(m && m[2].startsWith("工资年结")) };
      });
      const groups = [];
      for (const e of ent) {
        const g = groups[groups.length - 1];
        if (g && e.age != null && g.age === e.age) g.items.push(e); else groups.push({ age: e.age, items: [e] });
      }
      const out = [];
      for (const g of groups) {
        const mains = g.items.filter((e) => !e.wage), wages = g.items.filter((e) => e.wage);
        mains.forEach((e, k) => {
          const m = typeof e.raw === "string" && e.raw.match(/^(\d+) 岁 · /);
          const yr = m && IFY.S.birthYear ? `${IFY.S.birthYear + (+m[1])} 年 · ` : "";
          const notes = k === mains.length - 1 ? wages : [];
          out.push(`<p>${IFY.esc(yr + e.raw)}${notes.map((w) => `<span class="wageattach">${IFY.esc(w.txt)}</span>`).join("")}</p>`);
        });
        if (!mains.length) for (const w of wages) {
          const m = typeof w.raw === "string" && w.raw.match(/^(\d+) 岁 · /);
          const yr = m && IFY.S.birthYear ? `${IFY.S.birthYear + (+m[1])} 年 · ` : "";
          out.push(`<p class="wagenote">${IFY.esc(yr + w.raw)}</p>`);
        }
      }
      return out.join("");
    })();
    IFY.app().innerHTML = `<section class="card">${IFY.head(null, true)}
      <div class="rev" style="--d:0s">
      <h2>${IFY.finalAge()} 岁 · 这一局走完了</h2>
      ${IFY.S.death ? `<p>${IFY.S.death.age} 岁那年，你走了。${IFY.esc(IFY.S.death.text)}</p>` : ""}
      ${sp ? `<div class="special"><p class="rare-tag">${IFY.TIER_LABEL[sp.tier]}</p><p class="special-title">${IFY.esc(sp.title)}</p><p>${IFY.esc(sp.text)}</p></div>` : ""}
      </div>
      <div class="rev" style="--d:.12s">
      <p class="lifetags">${IFY.esc(lifeTags())}</p>
      ${displaySlots.map(([k, t]) => `<p class="slotline"><span class="slotk">${IFY.esc(k)}</span>${IFY.esc(t)}</p>`).join("")}
      ${houseLine}
      <p class="verdict">${IFY.esc(v.text)}</p>
      ${shadowFirst ? `<p class="shadowfirst">${IFY.esc(shadowFirst)}</p>` : ""}
      ${bestYearHtml(tlView)}
      <p class="seedline">这一局的种子是 <b>${IFY.esc(IFY.S.seedStr)}</b>。<button type="button" class="textlink" id="seedcopy">复制带种子的链接</button><br>谁打开这个链接，活的就是你这同一条命，选得不一样，后来各走各的。</p>
      <p>你走了这条路：${IFY.esc(IFY.S.route.name)}。</p>
      ${covLine ? `<p>${IFY.esc(covLine)}</p>` : ""}
      </div>
      <div class="rev" style="--d:.24s">
      ${livesNew.newEnding ? `<p class="livesnew">这种人生，你第一次活到。</p>` : (livesNew.newRare ? `<p class="livesnew">这件稀罕事，你这回头一次撞上。</p>` : "")}
      ${shadowLines.main ? `<p>${IFY.esc(shadowLines.main)}</p>` : ""}
      ${shadowLines.others.length ? `<h3>其他几条路</h3>${shadowLines.others.map((line) => `<p>${IFY.esc(line)}</p>`).join("")}` : ""}
      ${skippedLine}
      ${reflHtml}
      </div>
      ${settlementMapHtml()}
      <div class="rev" style="--d:.55s">
      <h3>这一生，年表<button type="button" class="newhint" id="tlhint" hidden>到最新一年 ↓</button></h3>
      <div class="timeline" id="timeline">${tlHtml}</div>
      </div>
      ${lifelineHtml(tlView)}
      <div class="sharedesk">
        <h3>把这一生寄出去</h3>
        <p class="hint">这一生可以做成一张卡带走——判词和年表都在上面。存进手机，或者发给朋友，都行。</p>
        <div class="row">
          <button class="ghost" id="shareopen" aria-expanded="false">做成分享卡</button>
        </div>
        <div id="sharebody" hidden>
        <label class="refl-label">给这一生留一句话（可选）
          <input id="shareline" type="text" maxlength="60" placeholder="一句就好，会出现在发帖文案的开头" value="${IFY.playerMeta().reflections.length ? IFY.esc(IFY.playerMeta().reflections[0].text) : ""}">
        </label>
        <label class="refl-label"><input type="checkbox" id="cardrefl"> 把这句话印到分享卡上（只有你勾选才会印）</label>
        <p class="setlab">卡面</p>
        <div class="segpicks" id="cardtype">
          <button type="button" class="segbtn sel" data-type="verdict"><b>判词卡</b><small>判词 + 分岔路图 + 六维</small></button>
          <button type="button" class="segbtn" data-type="log"><b>流水账卡</b><small>公元年轴 + 关键节点 + 六维</small></button>
          <button type="button" class="segbtn" data-type="mini"><b>判词小卡</b><small>判词一句 + 双轨图，竖版小图</small></button>
        </div>
        <p class="setlab">尺寸</p>
        <div class="segpicks" id="cardratio">
          <button type="button" class="segbtn sel" data-ratio="45">4:5</button>
          <button type="button" class="segbtn" data-ratio="916">9:16</button>
        </div>
        <div class="cardpreview" id="cardpreview"></div>
        <div class="row">
          <button class="primary" id="share">分享这张卡</button>
          <button class="ghost" id="saveimg">保存图片</button>
          <button class="ghost" id="copytext">复制发帖文案</button>
        </div>
        <details class="sharetext">
          <summary>发帖文案预览</summary>
          <p class="sharetext-body" id="sharetext"></p>
        </details>
        </div>
      </div>
      <div class="row">
        <button class="primary" id="again-same">同种子再来一局（换选择）</button>
        <button class="ghost" id="again-new">随机种子新开一局</button>
      </div>
      ${showAutoHint ? `<p class="hint">这一局是手动过完的。开局页和游戏里都能把「自动推进」设成平年——没有抉择的年份会自己往前走，分岔和要紧事还是会停下来等你。</p>` : ""}
      <p class="hint">种子码：${IFY.esc(IFY.S.seedStr)}。朋友打开同局链接，就是和你完全相同的运气——他选得不一样，会走成什么样？</p>
    </section>`;
    IFY.finishRender();
    // §1.2/§9.2 揭示与生长都可跳过：点结算页任意处立即全显
    const endSec = IFY.app().querySelector("section.card");
    if (endSec) endSec.addEventListener("click", () => {
      endSec.classList.add("shown");
      const mw = IFY.el("mapwrap"); if (mw) mw.classList.add("shown");
    });
    // v0.31.1：年表跳底钮（形态与流水账 newhint 看齐）——年表盒 480px 高、整局 80 多行只露一小截，
    // 滚离底部时出钮，点了瞬时跳到最新一年；贴底（距底 <40px）或内容不满一盒时不出。
    const tlBox = IFY.el("timeline"), tlHint = IFY.el("tlhint");
    if (tlBox && tlHint) {
      const syncTlHint = () => { tlHint.hidden = (tlBox.scrollHeight - tlBox.scrollTop - tlBox.clientHeight) < 40; };
      tlBox.addEventListener("scroll", syncTlHint);
      syncTlHint();
      tlHint.addEventListener("click", () => { tlBox.scrollTo({ top: tlBox.scrollHeight, behavior: "auto" }); syncTlHint(); });
    }
    IFY.el("again-same").addEventListener("click", () => location.assign(IFY.sameSeedUrl()));
    IFY.el("again-new").addEventListener("click", () => location.assign(location.pathname));
    IFY.el("seedcopy").addEventListener("click", async () => {
      IFY.ANA.track("share_click", { action: "copy_seed_link" });
      const url = IFY.sameSeedUrl();
      try { await navigator.clipboard.writeText(url); IFY.el("seedcopy").textContent = "已复制，去发给他"; }
      catch (e) { IFY.el("seedcopy").textContent = url; }
    });
    // 复制同局链接只留种子行那一处（seedcopy，整洁化批玩家席裁定）：原整行按钮 #copylink
    // 与它重复，已撤；开始页种子输入与典藏种子档案页不在此列。
    // ---------- 分享台接线：切换版式/尺寸即重绘预览 ----------
    let cardType = "verdict", cardRatio = "45";
    const refreshCard = () => {
      IFY.currentCanvas = IFY.buildCard(cardType, cardRatio);
      IFY.currentCanvas.className = "card-img";
      const box = IFY.el("cardpreview");
      box.innerHTML = "";
      box.appendChild(IFY.currentCanvas);
      IFY.el("sharetext").textContent = IFY.shareCopy();
    };
    const pickDesk = (id, isType) => {
      const box = IFY.el(id);
      box.querySelectorAll(".segbtn").forEach((b) => b.addEventListener("click", () => {
        box.querySelectorAll(".segbtn").forEach((o) => o.classList.remove("sel"));
        b.classList.add("sel");
        if (isType) cardType = b.dataset.type; else cardRatio = b.dataset.ratio;
        refreshCard();
      }));
    };
    pickDesk("cardtype", true);
    pickDesk("cardratio", false);
    IFY.el("shareline").addEventListener("input", () => {
      IFY.el("sharetext").textContent = IFY.shareCopy();
      if (IFY.el("cardrefl").checked) refreshCard(); // 勾选了印卡，改字要即时重绘
    });
    IFY.el("cardrefl").addEventListener("change", refreshCard);
    IFY.el("share").addEventListener("click", () => { IFY.ANA.track("share_click", { action: "share" }); IFY.shareCurrent(); });
    IFY.el("saveimg").addEventListener("click", () => { IFY.ANA.track("share_click", { action: "save_image" }); IFY.downloadCurrent(); });
    IFY.el("copytext").addEventListener("click", async () => {
      IFY.ANA.track("share_click", { action: "copy_text" });
      try { await navigator.clipboard.writeText(IFY.shareCopy()); IFY.el("copytext").textContent = "已复制，去粘贴吧"; }
      catch (e) { IFY.el("copytext").textContent = "复制失败，展开下面的文案预览手动复制"; }
    });
    refreshCard();
    // 结算整洁化（真机专项）：分享台默认收起——整页先是一份完整的纪录，点入口才展开
    // 卡型/尺寸/保存等控件。控件全在 #sharebody 内，ID 与接线、预绘、埋点一律照旧，
    // 容器隐藏不影响 buildCard；展开后与改前完全一致。
    const shareOpenBtn = IFY.el("shareopen"), shareBody = IFY.el("sharebody");
    if (shareOpenBtn && shareBody) shareOpenBtn.addEventListener("click", () => {
      const open = shareBody.hidden;
      shareBody.hidden = !open;
      shareOpenBtn.textContent = open ? "收起" : "做成分享卡";
      shareOpenBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // v0.33.0 人生纪录典藏：分享台之后挂一行安静入口＋导出面板（keepsake.js）。结算原有呈现
    // 一字不动，本钩子只做 DOM 追加；模块缺席（旧缓存）时静默跳过。
    if (typeof IFY.mountKeepsakeDesk === "function") IFY.mountKeepsakeDesk();
  }
  Object.assign(IFY, { verdict, verdictTone, verdictCouncil, lifeTags, specialEnding, endingDrawInfo, settlementMapHtml, renderLives, settlementSlots, renderEnd, occupationTrail, kidPresenceCount, nearMisses, chosenOfFork,
    // v0.22 WP7 新增导出：段事实视图、段版分岔反查、对面终局短句与结算快进（分享卡与断言复用同一口径）
    playerFacts, chosenOfForkIn, uncontrolledFinalLine, fastForwardUncontrolled,
    // 判词批 B 新增导出：伴侣史回放派生（断言与后续槽位复用同一口径）
    partnerHistoryOf, s2FromHistory,
    // 圆桌 P0 免费层结算批新增导出：F1 选年纯函数（验收台架复用同一口径）
    bestYearOf });
})(window.IFY);
