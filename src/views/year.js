// [模块]《如果那年》引擎分片：呈现层——年度/分岔/稀有/危机画面与文本状态变体解析。独立模块（包装器 + window.IFY 共享命名空间），加载顺序见 index.html。
(function (IFY) {
  "use strict";
  function renderRare(r) {
    IFY.curKind = "rare";
    IFY.S.flatCarry = null; // 稀有年不是平年：挂起的平年只留在流水账里
    IFY.S.usedRare.push(r.id);
    IFY.rec("rare", r.id, { set: r.set || null });
    if (r.set) IFY.S.flags[r.set] = true; // 呈现即立旗（v0.11.0 起覆盖有选项事件：去世旗等必立旗靠它保证）
    if (typeof IFY.houseOnBuyFlag === "function") IFY.houseOnBuyFlag(IFY.S, r.set, r);
    if (typeof IFY.careerNote === "function") IFY.careerNote(IFY.S, r); // 第 1 期 P1-2：履历记账（平行账，只写不读，下同）
    if (typeof IFY.plantSeed === "function") IFY.plantSeed(IFY.S, r); // 第 1 期 P1-3：埋种（与 careerNote 镜像同位，唯一写点 plantSeed，下同）
    IFY.applyState(r); // v0.12.0：状态流转与立旗同一时机
    if (!r.choices) { IFY.applyEffects(r.effects); } else IFY.S.lastDelta = "";
    const rtext = procText(r); // v0.20.0 M2：呈现走变体解析（textState/textForm），与 sim 记录口径一致
    IFY.S.log.push(`${IFY.S.age} 岁 · 【稀有】${rtext}`);
    IFY.app().innerHTML = `<section class="card rare">${IFY.head("这一年不太一样")}
      <p class="rare-tag">稀有事件</p><p class="body">${IFY.esc(rtext)}</p>${IFY.deltaLine()}
      ${r.choices ? `<div class="choices">${r.choices.map((c, i) => `<button class="choice" data-i="${i}">${IFY.esc(c.label)}</button>`).join("")}</div><div id="echo"></div>`
                  : `<button class="primary" id="cont">过一年</button>`}</section>`;
    IFY.finishRender();
    if (!r.choices) { IFY.save(); IFY.el("cont").addEventListener("click", IFY.advance); IFY.armAuto(rtext); return; }
    const chooseRareChoice = (c, autoSelected) => {
      IFY.clearAuto();
      IFY.applyEffects(c.effects);
      if (c.set) IFY.S.flags[c.set] = true;
      if (typeof IFY.houseOnBuyFlag === "function") IFY.houseOnBuyFlag(IFY.S, c.set, c);
      if (typeof IFY.careerNote === "function") IFY.careerNote(IFY.S, c);
      if (typeof IFY.plantSeed === "function") IFY.plantSeed(IFY.S, c, r.id);
      IFY.applyState(c);
      IFY.rec("rare", r.id, { choice: c.label, set: c.set || null, fx: IFY.S.lastDelta });
      if (autoSelected) IFY.S.log.push(`${IFY.S.age} 岁 · 自动选：${c.label}`);
      document.querySelector(".choices").remove();
      IFY.el("echo").innerHTML = `${IFY.deltaLine()}${autoSelected ? `<p class="autonote">自动推进 · 已选「${IFY.esc(c.label)}」</p>` : `<p class="pickednote">已选「${IFY.esc(c.label)}」</p>`}<p class="echo">${IFY.esc(echoText(c))}</p><button class="primary" id="cont">过一年</button>`;
      IFY.refreshStatsBar(); // fx-fix：稀有事件选项落账后就地刷条（与事件/危机的 v0.31.2 修复对齐，此前漏了这一处）
      IFY.save(); IFY.el("cont").addEventListener("click", IFY.advance);
      IFY.armAuto(echoText(c) || c.label, IFY.advance, "advance"); // v0.60.121：手动点选后回响屏同样 arm（用户裁定：选项点完应当继续自动推进）
    };
    document.querySelectorAll(".choice").forEach((b) => b.addEventListener("click", () => {
      const c = r.choices[Number(b.dataset.i)];
      IFY.choiceBeat(b, () => chooseRareChoice(c, false));
    }));
    // 全程自动选扩围（本批）：稀有选项与事件屏同一套两段式——主计时到点先预高亮 400ms，再走同一落定函数
    IFY.armAuto(rtext, () => {
      const idx = Math.floor(IFY.rng() * r.choices.length);
      const btns = document.querySelectorAll(".choices .choice");
      btns.forEach((o, j) => {
        o.disabled = true;
        o.classList.toggle("picked", j === idx);
        o.classList.toggle("faded", j !== idx);
      });
      IFY.autoPhase2 = setTimeout(() => { IFY.autoPhase2 = null; chooseRareChoice(r.choices[idx], true); }, 400);
    }, "choice");
  }

  // 文本状态变体（v0.19.0 三相，通用形状）：条目可带 textState、选项可带 echoState，形状同为 { 域: { 状态值: 文本 } }——
  // 按本局当前状态逐域查，命中即用变体，未命中回落原文（text / echo）。不限于 spouse 域，任何注册域都可作键；
  // 字段形状在 tools/validate-state.js 登记核对。与分岔专用的 labelBySpouse/echoBySpouse 并存（分岔仍走 spouseText）。
  function stateVariant(map, fallback) {
    if (map) for (const [dom, variants] of Object.entries(map)) { const v = variants && variants[IFY.S.state[dom]]; if (v != null) return v; }
    return fallback;
  }

  // 活计形态变体（v0.20.0 M2）：textForm/echoForm 形状 { 形态: 文本 }，解析点与 textState 同一机制——
  // 先取状态域变体，再按本局 formOf() 取形态变体；当前形态无变体时回落上一层原文，两层互不覆盖。
  function formVariant(map, fallback) {
    if (!map) return fallback;
    const f = typeof IFY.formOf === "function" ? IFY.formOf() : "employee";
    return map[f] != null ? map[f] : fallback;
  }

  // 年代变体（v0.20.1 面板急修）：textEra/echoEra/labelEra 形状 { 年代id: 文本 }——年代不是状态域
  // （S.era 独立于 S.state，textState 的键只能是注册域，装不下年代），故与 textState/textForm 同形另立一层：
  // 按本局 S.era 取变体，未声明该年代或未声明变体时回落下一层原文。优先级：无单位变体 > 年代 > 形态 > 状态。
  function eraVariant(map, fallback) {
    if (!map) return fallback;
    const v = map[IFY.S && IFY.S.era];
    return v != null ? v : fallback;
  }

  // 未决态变体（X-1）：echoFlag/textFlag 形状 { 旗名: 文本 }——考试链结果未落定（录取未到）时，
  // fork25 的入职回声与 fork28m 的县里题面按考试旗改口径。优先级序固定 exam_passed > exam_shortlist >
  // exam_retry（写死在此，不读对象键序）；位置在无单位变体之后、年代变体之前；已录取（exam_landed）
  // 或落榜（exam_failed）立旗后整层关闭——此时原口径的预设事实已经成立，恢复原文。
  const FLAG_VARIANT_ORDER = ["exam_passed", "exam_shortlist", "exam_retry"];
  function flagVariant(map, fallback) {
    if (!map) return fallback;
    const F = (IFY.S && IFY.S.flags) || {};
    if (F.exam_landed || F.exam_failed) return fallback;
    for (const f of FLAG_VARIANT_ORDER) { const v = map[f]; if (v != null && F[f]) return v; }
    return fallback;
  }

  // 与父母距离变体（v0.24.4 AN-2）：textDist/echoDist 形状 { far: 文本 }——本局与父母距离派生
  // （place.js distToParentsOf）为 far（出国定居）时取远版，未命中回落下一层原文。距离是硬事实，
  // 位置与无单位变体同级（在年代/形态/状态变体之外）；只有父母住院/信号拍声明此字段，
  // 其余条目恒等回落、行为一字不变。主线与影子轨共用（解析时 IFY.S 指向当前 Track）。
  function distVariant(map, fallback) {
    if (!map) return fallback;
    const d = typeof IFY.distToParentsOf === "function" ? IFY.distToParentsOf(IFY.S) : "unknown";
    return d === "far" && map.far != null ? map.far : fallback;
  }

  // 居所近远派生（AN-3 D-7）：按账本流转现算最终居所（与 place.js residenceTrailOf 的 home/非home 判定同口径：
  // back_to_city 与 abroad 映射只影响 city/abroad 之别，不翻转 home 判定；对受控 Track 现算）——账本路线拍与 back_home_stay/near_family/moved_city/stayed_city
  // 流转定的最终居所；place=home 视为「近」（人在老家一带，父母多半也在老家）。
  // 账本无记录时按路线默认（与 residenceOf 的缺省分支一致）。
  function nearHome() {
    const S = IFY.S;
    if (!S) return false;
    let place = null;
    for (const e of (Array.isArray(S.ledger) ? S.ledger : [])) {
      if (e.kind === "route") place = e.id === "abroad" ? "abroad" : (e.id === "home" || e.id === "gap") ? "home" : "city";
      else if (e.set === "back_home_stay" || e.set === "near_family") place = "home";
      else if (e.set === "moved_city" || e.set === "stayed_city") place = "city";
    }
    if (!place) place = !S.route ? "home" : S.route.id === "abroad" ? "abroad" : (S.route.id === "home" || S.route.id === "gap") ? "home" : "city";
    return place === "home";
  }

  function echoText(c) {
    // 无当前单位变体（v0.20.1 W7 补 W2 遗留）：选项声明 echoNoUnit 且本局无当前单位事实
    // （work.js noCurrentUnit：买断离厂后无新入行/返聘事实）时优先于形态/状态变体——
    // fork58 选「退」的回响靠它（分岔没有进程拍的 applyRetireVariant 通道）。
    if (c && c.echoNoUnit && typeof IFY.noCurrentUnit === "function" && IFY.noCurrentUnit()) return c.echoNoUnit;
    // 近居变体（AN-3 D-7）：选项声明 echoNear 且本局居所派生为老家（近）时启用，压过
    // 年代/形态/状态变体——治「住在父母十来分钟路程内，还写路上的时间变多了、
    // 请了长假住回家里」类距离轴预设。未声明 echoNear 的选项一字不动。
    if (c && c.echoNear && nearHome()) return c.echoNear;
    const rest = eraVariant(c && c.echoEra, formVariant(c && c.echoForm, stateVariant(c && c.echoState, (c && c.echo) || "")));
    const flagged = flagVariant(c && c.echoFlag, rest);
    if (flagged !== rest) return distVariant(c && c.echoDist, flagged);
    // 未入行中性变体（AN-3 D-1）：echoFlag 层未命中、本局尚无任何入行事实、且形态
    // 只是路线断言或默认（public/employee——备考期/未入行期）时，用选项声明的
    // echoNotEmployed 中性回响，压过形态变体——治 fork25「留下」在备考期被回响成
    // 「组里的老人」。已有生计形态（farm/self/flex）的人不走此层，形态变体照旧。
    if (c && c.echoNotEmployed && typeof IFY.isEmployed === "function" && !IFY.isEmployed()) {
      const f = typeof IFY.formOf === "function" ? IFY.formOf() : "employee";
      if (f === "employee" || f === "public") return c.echoNotEmployed;
    }
    return distVariant(c && c.echoDist, flagged);
  }

  // 选项标签形态变体（v0.20.0 M2 收尾）：labelForm 形状同 echoForm——先按 spouse 变体取标签，
  // 再按本局形态覆盖；无变体回落 spouse 口径。分岔按钮、流水账、未选支记录共用此读法，结算 chosenOfFork 按变体集合反查。
  // 年代变体（labelEra）叠在形态之上，口径同 echoText。
  function labelText(c) { return eraVariant(c && c.labelEra, formVariant(c && c.labelForm, IFY.spouseText(c, "label"))); }

  // 退休年数变体（v0.20.1 W7）：条目声明 textRetireYears { mid, long } 时，按 S.retiredAt
  // 算出的退休年数分版替换正文首处「没多久」——≤2 年原文（没多久）、3–6 年 mid（几年）、
  // >6 年 long（好些年）。retiredAt 缺失（旧存档）或年数 ≤2 一律回落原文。形状在
  // tools/validate-state.js 登记核对（mid/long 须非空且原文须真含「没多久」，防静默失效）。
  function retireYearsText(item, text) {
    const map = item && item.textRetireYears;
    if (!map || typeof text !== "string") return text;
    const ra = IFY.S && IFY.S.retiredAt;
    if (typeof ra !== "number") return text;
    const yrs = IFY.S.age - ra;
    const rep = yrs <= 2 ? null : yrs <= 6 ? map.mid : map.long;
    if (!rep) return text;
    return text.replace("没多久", rep);
  }

  // 童年记号变体（0–4 小段抓周回指）：条目声明 textMark { 记号id: 文本 } 时，本局真落过
  // 该记号（旗与 S.marks 条目都在）才整段换文；文本中的 {item} 以记号落账自带的物件名
  // 替换（抓周抓到的那一样）。未声明此字段的条目恒等回落，既有解析一字不变。
  function markVariant(map, fallback) {
    if (!map) return fallback;
    const S = IFY.S;
    if (!S || !S.flags) return fallback;
    for (const [mid, txt] of Object.entries(map)) {
      if (!S.flags[mid] || typeof txt !== "string") continue;
      const e = (S.marks || []).find((m) => m && m.id === mid);
      if (!e) return fallback;
      return txt.replace("{item}", e.item || "那样东西");
    }
    return fallback;
  }

  function formText(item) {
    // 无当前单位变体（v0.20.1 W7）：条目声明 textNoUnit 且本局无当前单位事实时优先于
    // 形态/状态变体（fork58 开场靠它；进程拍另有 work.js applyRetireVariant 通道，口径一致）。
    // 例外：条目带 textAgain 且本局已全退过时，再退变体优先（与 applyRetireVariant 同序）。
    if (item && item.textNoUnit && typeof IFY.noCurrentUnit === "function" && IFY.noCurrentUnit()
        && !(item.textAgain && typeof IFY.hasRetiredBefore === "function" && IFY.hasRetiredBefore())) return retireYearsText(item, item.textNoUnit);
    return retireYearsText(item, distVariant(item && item.textDist, markVariant(item && item.textMark, flagVariant(item && item.textFlag, eraVariant(item && item.textEra, formVariant(item && item.textForm, stateVariant(item && item.textState, (item && item.text) || "")))))));
  }

  // WP2（补丁稿 wp2-scheduler-year-patch，合并二期落）: textFact 枚举事实文本变体 { 事实名: { 值: 文本 } };
  // 条目带 requiresFactAny(软门)时: 门已过用原文(本人形), 未过按事实值取变体(目击形); 无软门的 textFact 直接按值取。
  function factVariant(item, fallback) {
    const map = item && item.textFact;
    if (!map) return fallback;
    if (item.requiresFactAny) {
      const F = (IFY.S && IFY.S.facts) || {};
      const ok = item.requiresFactAny.some((cl) => Object.entries(cl).every(([k, v]) => k === "_flag" ? !!IFY.S.flags[v] : ((F[k] == null ? "absent" : F[k]) === v)));
      if (ok) return fallback;
    }
    for (const [fn, variants] of Object.entries(map)) { const cur = ((IFY.S && IFY.S.facts) || {})[fn]; const v = variants && variants[cur == null ? "absent" : cur]; if (v != null) return v; }
    return fallback;
  }
  function procText(item) { return factVariant(item, formText(item)); }

  function renderFork(fork) {
    IFY.curKind = "fork";
    IFY.S.flatCarry = null; // 分岔年不是平年：挂起的平年只留在流水账里（22–38 合并纪律）
    // 年代框变体（v0.23 WP1 E2）：fork.eraFrame 命中本年代时整框替换（题面+全选项，title 可随框换）——
    // set 旗与影子政策按旗匹配的读法不变（框选项与本体同 set 目标，内容随 WP6、对应关系登记在 anchors.eraFrames）；
    // 无 eraFrame 或未命中本年代时 fork 原样走现行解析，行为一字不变。无头解决器（shadow-life.js）同口径。
    const frame = fork.eraFrame && fork.eraFrame[IFY.S.era];
    if (frame) fork = Object.assign({}, fork, { title: frame.title || fork.title, choices: frame.choices || fork.choices });
    const covPrefix = fork.age === 45 && IFY.S.covenant && IFY.S.covenant.kind === "wait" ? `<p>七年前在 38 岁挂起的那份账，今天到期。</p>` : ""; // 立约到期点呈现
    const careNow = IFY.S.parents ? ((IFY.S.parents.dad.stage === "care" && IFY.S.state.dad === "alive") || (IFY.S.parents.mom.stage === "care" && IFY.S.state.mom === "alive")) : !!IFY.S.flags.care_stage;
    const forkText = frame ? (frame.text || "") : (fork.age === 52 && careNow && fork.textCare ? fork.textCare : formText(fork)); // v0.18.0 审计急修：textCare 只认「正在照护且父母尚在」——旧 care_stage 旗在父母离世后仍留着，不能让 52 岁分岔对孤儿说「你已经在照护里了」 // fork52 与父母进程对齐（v0.18.0）：进程已到照护段时文本随动 // v0.19.0 审计急修：非照护段文本走 textState 分版（只剩一位父母时按在世的那位说）
    const GATE_KEYS = ["require", "forbid", "all", "any", "state", "stateAll", "stateNot", "era", "eraIn", "minYear", "route", "routeIn", "forbidRoute", "chain"];
    let vis = fork.choices.map((c, i) => [c, i]).filter(([c]) => !GATE_KEYS.some((k) => k in c) || IFY.met(c)); // 选项级门（v0.18.0）：带门的选项按本局事实显隐（如 fork52 排班选项只给有兄弟姐妹的人）
    if (!vis.length) vis = fork.choices.map((c, i) => [c, i]);
    // 关口分组呈现（第 1 期 P1-6，裁定 D4/D5）：view 带 gateGroupTitles 时按 group
    // 分段——种子点亮组（承继＋点亮，按钮内带回指/来处副文案 sub）与冷门组各用真实
    // 标题元素分隔，推后项不带组题排在最后；学历门说明行（gateNotes）排在选项区
    // 之外、不进任何按钮。普通分岔无此字段，走原样单列，呈现一字不变。
    // 配额溢出回响行（第 2 期 P2-1，DESIGN-41 §4.1.3）：view 的 gateEchoes 与
    // gateNotes 平行，排在其后单独成段，class 独立（gate-echo）——数据、呈现、
    // 验收计数都与 D5 行分开：D5 是规则、回响是惦记，同屏不许串味。
    const gateGrouped = !!(fork.gateGroupTitles && typeof fork.gateGroupTitles === "object");
    const gateBtn = ([c, i]) => `<button class="choice" data-i="${i}">${IFY.esc(labelText(c))}${c.sub ? `<span class="choice-sub">${IFY.esc(c.sub)}</span>` : ""}</button>`;
    let choicesHtml;
    // SHUF-01：呈现序（自动选抽位与高亮按此序）。非关口分岔恒等于 vis、行为一字
    // 不变；关口菜单（只有 gateForkView 的 view 带 gateGroupTitles）在下方按
    // 分组段内洗牌后的顺序落定。按钮始终带 fork.choices 原下标（data-i），
    // 点击按身份回查，呈现序不进任何账。
    let presented = vis;
    if (gateGrouped) {
      const parts = [];
      // SHUF-01 关口菜单呈现洗牌：只在各分组段内重排（组题与段的构成是 D4
      // 既定呈现，段间不串位——冷门项不许跑到「有来处的」标题下）；置换走旁路
      // menuPerm（种子串＋菜单 id＋年龄＋年代＋段名），不消费任何游戏随机流，
      // 组装结果（fork.choices）与影子无头解决读到的选项集一字不动。
      const shufSeg = (arr, tag) => {
        if (arr.length < 2 || typeof IFY.menuPerm !== "function" || !IFY.S) return arr;
        const ctx = `gate:${fork.id || ""}@${fork.age}@${IFY.S.era || ""}:${tag}`;
        return IFY.menuPerm(IFY.S.seedStr, ctx, arr.length).map((k) => arr[k]);
      };
      const litPart = shufSeg(vis.filter(([c]) => c.group === "lit"), "lit");
      const coldPart = shufSeg(vis.filter(([c]) => c.group === "cold"), "cold");
      const deferPart = shufSeg(vis.filter(([c]) => c.group !== "lit" && c.group !== "cold"), "defer");
      presented = litPart.concat(coldPart, deferPart);
      if (litPart.length && fork.gateGroupTitles.lit) parts.push(`<h3 class="gate-group">${IFY.esc(fork.gateGroupTitles.lit)}</h3>${litPart.map(gateBtn).join("")}`);
      if (coldPart.length && fork.gateGroupTitles.cold) parts.push(`<h3 class="gate-group">${IFY.esc(fork.gateGroupTitles.cold)}</h3>${coldPart.map(gateBtn).join("")}`);
      parts.push(deferPart.map(gateBtn).join(""));
      choicesHtml = parts.join("");
    } else {
      choicesHtml = vis.map(([c, i]) => `<button class="choice" data-i="${i}">${IFY.esc(labelText(c))}</button>`).join("");
    }
    const gateNotesHtml = gateGrouped && Array.isArray(fork.gateNotes) && fork.gateNotes.length
      ? fork.gateNotes.map((n) => `<p class="gate-note">${IFY.esc(n)}</p>`).join("") : "";
    const gateEchoesHtml = gateGrouped && Array.isArray(fork.gateEchoes) && fork.gateEchoes.length
      ? fork.gateEchoes.map((n) => `<p class="gate-note gate-echo">${IFY.esc(n)}</p>`).join("") : "";
    IFY.app().innerHTML = `<section class="card">${IFY.head()}<h2>${IFY.esc(fork.title)}</h2>${covPrefix}<p>${IFY.esc(forkText)}</p>
      <div class="choices">${choicesHtml}</div>${gateNotesHtml}${gateEchoesHtml}</section>`;
    IFY.finishRender();
    const chooseForkChoice = (c, autoSelected) => {
      IFY.clearAuto();
      IFY.applyEffects(c.effects);
      if (c.set) IFY.S.flags[c.set] = true;
      if (typeof IFY.houseOnBuyFlag === "function") IFY.houseOnBuyFlag(IFY.S, c.set, c);
      if (typeof IFY.careerNote === "function") IFY.careerNote(IFY.S, c);
      if (typeof IFY.plantSeed === "function") IFY.plantSeed(IFY.S, c, fork.id);
      IFY.applyState(c);
      IFY.applyTempDelta(c.temp); // 温度接点（v0.17.0）：选项可带 temp 增减，只改质地字段
      if (fork.id === "fork_kid") IFY.kidForkCovenant(c); // 孩子线批次 S4：fork_kid 落点记账（约的登记/再问补旗，旗与状态走上方通用序）
      fork.choices.forEach((o) => { if (o !== c) IFY.S.unchosen.push({ kind: "fork", age: fork.age, label: labelText(o) }); });
      if (typeof IFY.noteSplitFork === "function") IFY.noteSplitFork(IFY.S, fork); // 分家记账（丙案第一步）：换轨级岔口覆盖分家点（只记账，不声称影子走了未选支）
      IFY.S.log.push(`${fork.age} 岁 · ${fork.title.split("·")[1].trim()}：${labelText(c)}`);
      if (autoSelected) IFY.S.log.push(`${fork.age} 岁 · 自动选：${labelText(c)}`);
      IFY.rec("fork", fork.id || ("fork" + fork.age), { choice: labelText(c), set: c.set || null, fx: IFY.S.lastDelta });
      IFY.S.pendingFork = { age: fork.age, label: labelText(c), echo: echoText({ ...c, echo: IFY.spouseText(c, "echo") }) || null }; // §3.3 复述拍：先存下，续玩回到这一拍而不是重选
      IFY.save();
      renderForkEcho();
      IFY.mountStream();
    };
    document.querySelectorAll(".choice").forEach((b) => b.addEventListener("click", () => {
      const c = fork.choices[Number(b.dataset.i)];
      IFY.choiceBeat(b, () => chooseForkChoice(c, false));
    }));
    // 全程自动选扩围（本批）：大岔口与事件屏同一套两段式——抽选只在玩家看得见的选项里抽，
    // 主计时到点先预高亮 400ms，再走同一落定函数；plain 模式 kind 门控照旧不触发、停住等玩家。
    // SHUF-01：抽的是「呈现位」下标（presented，与屏上按钮同位），高亮与落定同位
    // 取项——自动流跟着呈现走；非关口分岔 presented === vis，与旧行为一致。
    IFY.armAuto(forkText, () => {
      const p = Math.floor(IFY.rng() * presented.length);
      const btns = document.querySelectorAll(".choices .choice");
      btns.forEach((o, j) => {
        o.disabled = true;
        o.classList.toggle("picked", j === p);
        o.classList.toggle("faded", j !== p);
      });
      IFY.autoPhase2 = setTimeout(() => { IFY.autoPhase2 = null; chooseForkChoice(presented[p][0], true); }, 400);
    }, "choice");
  }

  // §3.3 完整版（v0.10.0）：分岔选后不直接进下一年，先留一拍专属回响（文案在 events.js 各分岔选项的 echo 字段；旧存档无 echo 时回落最小版复述）。
  function renderForkEcho() {
    IFY.curKind = "fork";
    const pf = IFY.S.pendingFork;
    IFY.app().innerHTML = `<section class="card">${IFY.head()}${IFY.deltaLine()}<p class="echo">${IFY.esc(pf.echo || ("你选了「" + pf.label + "」"))}</p><button class="primary" id="cont">过一年</button></section>`;
    IFY.finishRender();
    const goNext = () => { IFY.S.pendingFork = null; IFY.save(); IFY.advance(); };
    IFY.el("cont").addEventListener("click", goNext);
    // 全程自动选扩围（本批）：回响屏是无抉择屏，按 advance 规矩 arm——不然自动选完岔口会卡在这一屏，
    // 零点击整局断在这里。plain/full 都可流过；手动落选后模式多半已被夺回手势关掉，arm 只是登记、不误触发。
    IFY.armAuto(pf.echo || ("你选了「" + pf.label + "」"), goNext);
  }

  function renderCrisis(c) {
    IFY.curKind = "crisis";
    IFY.S.flatCarry = null; // 危机年不是平年：挂起的平年只留在流水账里
    if (c.key === "health") { IFY.S.healthCrisisSeen = true; IFY.save(); }
    IFY.app().innerHTML = `<section class="card crisis">${IFY.head("身体和日子，都得当回事")}<h2>${IFY.S.age} 岁 · ${IFY.esc(c.title)}</h2><p>${IFY.esc(c.text)}</p>
      <div class="choices">${c.choices.map((ch, i) => `<button class="choice" data-i="${i}">${IFY.esc(ch.label)}</button>`).join("")}</div><div id="echo"></div></section>`;
    IFY.finishRender();
    const chooseCrisisChoice = (ch, autoSelected) => {
      IFY.clearAuto();
      IFY.applyEffects(ch.effects); IFY.S.crisisUsed[c.key] = true;
      if (ch.set) IFY.S.flags[ch.set] = true; IFY.applyState(ch); // v0.12.0：与其它选项路径统一（现行危机数据未用 set/setState，防未来内容轮）
      if (typeof IFY.houseOnBuyFlag === "function") IFY.houseOnBuyFlag(IFY.S, ch.set, ch);
      if (typeof IFY.careerNote === "function") IFY.careerNote(IFY.S, ch);
      if (typeof IFY.plantSeed === "function") IFY.plantSeed(IFY.S, ch, c.id || c.key);
      IFY.S.log.push(`${IFY.S.age} 岁 · ${c.title}：${ch.label}`);
      if (autoSelected) IFY.S.log.push(`${IFY.S.age} 岁 · 自动选：${ch.label}`);
      IFY.rec("crisis", c.key, { choice: ch.label, set: ch.set || null, fx: IFY.S.lastDelta });
      document.querySelector(".choices").remove();
      IFY.el("echo").innerHTML = `${IFY.deltaLine()}${autoSelected ? `<p class="autonote">自动推进 · 已选「${IFY.esc(ch.label)}」</p>` : `<p class="pickednote">已选「${IFY.esc(ch.label)}」</p>`}<p class="echo">${IFY.esc(echoText(ch))}</p><button class="primary" id="cont">过一年</button>`;
      IFY.refreshStatsBar(); // v0.31.2：效果已落账，头部数值条就地跟上真数
      IFY.save(); IFY.el("cont").addEventListener("click", IFY.advance);
      IFY.armAuto(echoText(ch) || ch.label, IFY.advance, "advance"); // 照事件屏：回响屏的「过一年」接着 arm，别让整局停在危机回响；v0.60.121 起手动点选同样 arm
    };
    document.querySelectorAll(".choice").forEach((b) => b.addEventListener("click", () => {
      const ch = c.choices[Number(b.dataset.i)];
      IFY.choiceBeat(b, () => chooseCrisisChoice(ch, false));
    }));
    // 全程自动选扩围（本批）：危机与事件屏同一套两段式——主计时到点先预高亮 400ms，再走同一落定函数
    IFY.armAuto(c.text, () => {
      const idx = Math.floor(IFY.rng() * c.choices.length);
      const btns = document.querySelectorAll(".choices .choice");
      btns.forEach((o, j) => {
        o.disabled = true;
        o.classList.toggle("picked", j === idx);
        o.classList.toggle("faded", j !== idx);
      });
      IFY.autoPhase2 = setTimeout(() => { IFY.autoPhase2 = null; chooseCrisisChoice(c.choices[idx], true); }, 400);
    }, "choice");
  }

  function renderEventYear(plan) {
    IFY.curKind = "year";
    // 内容判定已收进调度层（v0.20.0 M2）：planYear() 按五层仲裁给出本年计划，本函数只呈现。
    // 无计划调用（旧调用点）时现算一份，口径同一。
    const p = plan || IFY.planYear();
    // 温度平淡年出口（v0.17.0）：平淡与否由调度层按 rhythm derive 判定（plan.kind === "flat"），
    // 本层不再自行掷骰。平淡年不抽事件卡：流水账记一行带具体细节的平淡，数值至多 ±1；
    // 死亡判定仍在 advance() 里逐年走，温度不碰死亡率（红线）。
    if (p.kind === "flat") {
      const f = p.flat;
      IFY.S.flatYears = (IFY.S.flatYears || 0) + 1;
      IFY.S.flatCarry = null;
      IFY.applyEffects(f.effects);
      IFY.S.log.push(`${IFY.S.age} 岁 · ${f.text}`);
      IFY.rec("flat", "flat_adult", { text: f.text });
      IFY.app().innerHTML = `<section class="card">${IFY.head()}<p class="body">${IFY.esc(f.text)}</p>${IFY.deltaLine()}<button class="primary" id="cont">过一年</button></section>`;
      IFY.finishRender();
      IFY.save(); IFY.el("cont").addEventListener("click", IFY.advance);
      IFY.armAuto(f.text);
      return;
    }
    if (p.kind === "micro") {
      // 平年微文本（L4 风味填充）：年份不再被静默跳过；抽哪条已由调度层定（p.microIdx）
      const idx = p.microIdx;
      if (!IFY.S.microUsed.includes(idx)) IFY.S.microUsed.push(idx);
      const microText = IFY.D.micro[idx];
      IFY.S.log.push(`${IFY.S.age} 岁 · ${microText}`);
      IFY.rec("micro", "micro", { text: microText });
      // 22–38 相邻平年合并（v0.17.0）：前一年先挂起（只入流水账），下一年同为平年则两行同卡呈现，省一屏；
      // 合并只动呈现——抽取、随机流、死亡判定全不变（模拟口径与旧版一致），总时长不涨。
      if (IFY.S.flatCarry) {
        const carryText = IFY.S.flatCarry.text;
        IFY.S.flatCarry = null;
        IFY.app().innerHTML = `<section class="card">${IFY.head()}<p class="body">${IFY.esc(carryText)}</p><p class="body">${IFY.esc(microText)}</p><p class="hint">这两年都没什么大事，一并记在这里。</p><button class="primary" id="cont">过一年</button></section>`;
        IFY.finishRender();
        IFY.save(); IFY.el("cont").addEventListener("click", IFY.advance);
        IFY.armAuto(microText);
        return;
      }
      if (IFY.S.age >= IFY.START_AGE && IFY.S.age <= 37) {
        IFY.S.flatCarry = { age: IFY.S.age, text: microText };
        IFY.save();
        IFY.advance(); // 挂起本年直接进下一年：下一年是平年合并呈现，不是平年则本年只留在流水账里
        return;
      }
      IFY.app().innerHTML = `<section class="card">${IFY.head()}<p class="body">${IFY.esc(microText)}</p><button class="primary" id="cont">过一年</button></section>`;
      IFY.finishRender();
      IFY.save(); IFY.el("cont").addEventListener("click", IFY.advance);
      IFY.armAuto(microText);
      return;
    }
    const e = p.event; // kind === "event"（L2 链推进或 L3 saliency，plan.layer 标明）
    IFY.S.flatCarry = null; // 事件年：挂起的平年只留在流水账里
    IFY.S.usedEvents.push(e.id);
    if (e.set) IFY.S.flags[e.set] = true; // 顶层 set 呈现即立（v0.9.2 补齐普通事件路径；v0.11.0 起覆盖有选项事件：去世旗等必立旗靠它保证）
    if (typeof IFY.houseOnBuyFlag === "function") IFY.houseOnBuyFlag(IFY.S, e.set, e);
    if (typeof IFY.careerNote === "function") IFY.careerNote(IFY.S, e);
    if (typeof IFY.plantSeed === "function") IFY.plantSeed(IFY.S, e);
    IFY.applyState(e); // v0.12.0：状态流转与立旗同一时机
    if (!e.choices) { IFY.applyEffects(e.effects); } else IFY.S.lastDelta = "";
    IFY.rec("event", e.id, { set: e.set || null, fx: !e.choices ? IFY.S.lastDelta : null });
    const etext = procText(e); // v0.20.0 M2：呈现走变体解析（textState/textForm），与 sim 记录口径一致
    IFY.S.log.push(`${IFY.S.age} 岁 · ${etext}`);
    IFY.app().innerHTML = `<section class="card">${IFY.head()}<p class="body">${IFY.esc(etext)}</p>${IFY.deltaLine()}
      ${e.choices ? `<div class="choices">${e.choices.map((c, i) => `<button class="choice" data-i="${i}">${IFY.esc(labelText(c))}</button>`).join("")}</div><div id="echo"></div>`
                  : `<button class="primary" id="cont">过一年</button>`}</section>`;
    IFY.finishRender();
    if (!e.choices) { IFY.save(); IFY.el("cont").addEventListener("click", IFY.advance); IFY.armAuto(etext); return; }
    const chooseEventChoice = (c, autoSelected) => {
      IFY.clearAuto();
      IFY.applyEffects(c.effects);
      if (c.set) IFY.S.flags[c.set] = true;
      // 陪伴延寿（CL-42，用户亲定）：选项声明 care {who, yrs} 时，玩家对这位父母的照护投入换成其实在年头（共享函数 parentCareExtend，在世才移、封顶 105）。
      if (c.care && typeof IFY.parentCareExtend === "function") IFY.parentCareExtend(c.care.who, c.care.yrs);
      if (typeof IFY.houseOnBuyFlag === "function") IFY.houseOnBuyFlag(IFY.S, c.set, c);
      if (typeof IFY.careerNote === "function") IFY.careerNote(IFY.S, c);
      if (typeof IFY.plantSeed === "function") IFY.plantSeed(IFY.S, c, e.id);
      IFY.applyState(c);
      IFY.rec("event", e.id, { choice: c.label, set: c.set || null, fx: IFY.S.lastDelta });
      if (autoSelected) IFY.S.log.push(`${IFY.S.age} 岁 · 自动选：${labelText(c)}`);
      document.querySelector(".choices").remove();
      IFY.el("echo").innerHTML = `${IFY.deltaLine()}${autoSelected ? `<p class="autonote">自动推进 · 已选「${IFY.esc(labelText(c))}」</p>` : `<p class="pickednote">已选「${IFY.esc(labelText(c))}」</p>`}<p class="echo">${IFY.esc(echoText(c))}</p><button class="primary" id="cont">过一年</button>`;
      IFY.refreshStatsBar(); // v0.31.2：效果已落账，头部数值条就地跟上真数
      IFY.save(); IFY.el("cont").addEventListener("click", IFY.advance);
      IFY.armAuto(echoText(c) || c.label, IFY.advance, "advance"); // v0.60.121：手动点选后回响屏同样 arm（用户裁定：选项点完应当继续自动推进）
    };
    document.querySelectorAll(".choice").forEach((b) => b.addEventListener("click", () => {
      IFY.choiceBeat(b, () => chooseEventChoice(e.choices[Number(b.dataset.i)], false));
    }));
    // §4.3 全程自动选分两段：主计时到点先预高亮被选按钮 400ms（玩家可点任意处夺回手动），再执行选择
    IFY.armAuto(etext, () => {
      const idx = Math.floor(IFY.rng() * e.choices.length);
      const btns = document.querySelectorAll(".choices .choice");
      btns.forEach((o, j) => {
        o.disabled = true;
        o.classList.toggle("picked", j === idx);
        o.classList.toggle("faded", j !== idx);
      });
      IFY.autoPhase2 = setTimeout(() => { IFY.autoPhase2 = null; chooseEventChoice(e.choices[idx], true); }, 400);
    }, "choice");
  }
  Object.assign(IFY, { renderRare, stateVariant, formVariant, eraVariant, formText, echoText, labelText, procText, renderFork, renderForkEcho, renderCrisis,
    renderEventYear });
})(window.IFY);
