// [模块]《如果那年》引擎分片：父母进程。独立模块（包装器 + window.IFY 共享命名空间），加载顺序见 index.html。
// [模块]注：renderProcItem 是进程拍通用渲染（父母/dating/退休/出国等进程条目共用），随本文件存放。
(function (IFY) {
  "use strict";
  // ---------- 父母进程（v0.18.0，内核一期）：父亲、母亲各一条身体进程 ----------
  // 出生时父母年龄、父母一代人寿命均值与散布按年代标定（标定说明见 docs/PARENTS-PROCESS.md）；
  // 需照护、住院、离世由进程越线发作成动静（pack36 的 proc_* 条目），不再等事件抽中。主角自身死亡曲线不在此列，一字未动。
  const PARENT_CAL = {
    c1955: { dadAge: [27, 35], momAge: [25, 33], dadLife: [66, 9], momLife: [71, 9] },
    c1965: { dadAge: [27, 35], momAge: [25, 33], dadLife: [69, 9], momLife: [74, 9] },
    c1978: { dadAge: [26, 34], momAge: [24, 32], dadLife: [73, 9], momLife: [78, 9] },
    c2000: { dadAge: [25, 33], momAge: [23, 31], dadLife: [79, 10], momLife: [85, 10] },
  };

  function triW(draw) { const d = draw || (() => IFY.rngW()); return (d() + d() + d() - 1.5) / 1.5; } // [-1,1] 近正态扰动（进程流；v0.21 WP1：抽取函数可注入，缺省即进程流 rngW，公式不动）

  // 照护预警信号点（v0.20.0 M2 收尾，可见检定）：care 起点前 2–4 年的一个呈现点。
  // 由已掷出的 careAge/deathAge 确定性派生、不消费进程流——父母各时点（care/hosp/dead）的掷点序列与旧版逐位一致，死亡分布不动。
  // 旧存档的父母对象没有 signalAge/signalShown 字段：读时现算现补（signalShown 缺省未呈现），口径与新局一致。
  function signalAgeOf(P) {
    const a = Math.max(22, P.careAge - (2 + ((P.deathAge + P.careAge) % 3)));
    return a < P.careAge ? a : P.careAge - 1;
  }

  // v0.21 WP1（蓝图裁定三）：掷点函数 one() 改为可注入流抽取函数——Track_A 传 rngW、Track_B 传它自己的
  // #shadow#world 流包装；公式与 PARENT_CAL 一字不动，缺省抽取即现行 rngW，主线消费顺序与数值逐位不变。
  // parentFate 是 one() 去掉 age0 掷点后的同一条公式：影子出生时 age0 拷自主线（出身共享），只在影子
  // 进程流上重掷 deathAge/careAge/hospAge（命运各自），掷序与 one() 的后半段逐位同构。
  function parentFate(age0, lifeBand, draw) {
    const d = draw || (() => IFY.rngW());
    const life = Math.round(lifeBand[0] + triW(d) * lifeBand[1]);
    const deathAge = Math.max(26, life - age0); // 换算成主角年龄口径的离世点；下限保证此事不出在童年段（序章不处理）
    const careAge = Math.max(24, deathAge - (2 + Math.floor(d() * 4))); // 需照护段起点：离世前 2–5 年
    const hospAge = deathAge - careAge >= 2 ? careAge + 1 + Math.floor(d() * (deathAge - careAge - 1)) : null;
    return { age0, deathAge, careAge, hospAge, stage: "well", signalAge: signalAgeOf({ careAge, deathAge }), signalShown: false }; // stage: well → care → hosp → dead；signal 为 care 前的呈现层前置标记（进程内部状态，不进存档状态域、不改 care/hosp/dead 时点）
  }

  function one(ageBand, lifeBand, draw) {
    const d = draw || (() => IFY.rngW());
    const age0 = ageBand[0] + Math.floor(d() * (ageBand[1] - ageBand[0] + 1));
    return parentFate(age0, lifeBand, d);
  }

  function initParents(draw) {
    if (IFY.S.parents || !IFY.S.route) return;
    const cal = PARENT_CAL[IFY.S.era] || PARENT_CAL.c2000;
    IFY.S.parents = { dad: one(cal.dadAge, cal.dadLife, draw), mom: one(cal.momAge, cal.momLife, draw) };
  }

  // 本年到期的进程动静（每岁至多一件：离世 > 住院 > 照护，父先于母）；已被事件写过世的父母不再发作
  function parentsDue() {
    if (!IFY.S.parents) return null;
    // 内容修复批二轮（双亲进程防重入）：52 岁分岔 fork52「父母需要人了」已把照护落定（住院＋请人/轮流/自己陪），
    // 但分岔不推进进程段位——此后段位仍停在 well 的在世父母，在本函数口径上一律视同已进 care 段：
    // 早段信号与照护拍不再回头发，进程住院拍凭 care 段照常可出，离世不受影响。判据只读账本落账
    // （引擎与无头解决器记账同形：kind="fork"、id="fork52"），不改掷点、段位字段与存档形状，老档同口径。
    const fork52Done = Array.isArray(IFY.S.ledger) && IFY.S.ledger.some((e) => e && e.kind === "fork" && e.id === "fork52");
    const due = [];
    for (const who of ["dad", "mom"]) {
      const P = IFY.S.parents[who];
      if (!P || IFY.S.state[who] !== "alive") continue;
      const stage = fork52Done && P.stage === "well" ? "care" : P.stage; // fork52 已落账时 well 视同 care（仅本函数判定用，不写回）
      if (IFY.S.age >= P.deathAge) due.push({ pr: 0, item: "proc_" + who + "_dead", who, beat: "dead" });
      else if (P.hospAge !== null && IFY.S.age >= P.hospAge && stage === "hosp") { /* 已呈现 */ }
      else if (P.hospAge !== null && IFY.S.age >= P.hospAge && stage === "care") due.push({ pr: 1, item: "proc_" + who + "_hosp", who, beat: "hosp" });
      else if (IFY.S.age >= P.careAge && stage === "well") due.push({ pr: 2, item: "proc_" + who + "_care", who, beat: "care" });
      else if (stage === "well" && !P.signalShown && IFY.S.age >= signalAgeOf(P) && IFY.S.age < P.careAge) due.push({ pr: 3, item: "proc_" + who + "_signal", who, beat: "signal" }); // 预警信号：care 之前、每位父母至多一次，优先级最低
    }
    if (!due.length) return null;
    due.sort((a, b) => a.pr - b.pr);
    return due[0];
  }

  // 父母进程段位推进（v0.21 WP2 抽共享）：节拍解决即推进父母进程段位（离世的状态流转走条目自身的 setState）。
  // 呈现层 renderProcItem 与无头解决器（shadow-life.js 的 stepYearHeadless）共用这一份——蓝图 5.2 点名抽取处：
  // 改这段逻辑两边同时生效，不许在无头侧另抄一份。函数体与抽取前 renderProcItem 内的原段逐字相同。
  function advanceParentStage(who, beat) {
    if (beat && IFY.S.parents && IFY.S.parents[who]) { // 节拍呈现即推进父母进程段位（离世的状态流转走条目自身的 setState）
      if (beat === "signal") { IFY.S.parents[who].signalShown = true; } // 信号拍只记呈现过：不推进段位、不立 care_stage 旗
      else {
        IFY.S.parents[who].stage = beat === "dead" ? "dead" : beat === "hosp" ? "hosp" : "care";
        if (beat === "care") IFY.S.flags.care_stage = true;
      }
    }
  }

  // 进程条目呈现（pack36 的 proc_* 条目）：与事件年同形，但过完回到本年 step（进程拍不独占这一年，年内的分岔/瞥视照常）
  function renderProcItem(item, who, beat) {
    IFY.curKind = "proc";
    IFY.S.flatCarry = null; // 进程年不是平年
    advanceParentStage(who, beat); // v0.21 WP2：父母 stage 推进改调共享函数（原段代码搬家，逻辑一字不动）
    if (item.set) IFY.S.flags[item.set] = true;
    if (typeof IFY.houseOnBuyFlag === "function") IFY.houseOnBuyFlag(IFY.S, item.set, item);
    if (typeof IFY.careerNote === "function") IFY.careerNote(IFY.S, item); // 第 1 期 P1-2：履历记账（平行账，只写不读，下同）
    IFY.applyState(item);
    if (!item.choices) { IFY.applyEffects(item.effects); } else IFY.S.lastDelta = "";
    IFY.rec("proc", item.id, { set: item.set || null, fx: !item.choices ? IFY.S.lastDelta : null });
    IFY.S.log.push(`${IFY.S.age} 岁 · ${IFY.procText(item)}`);
    const GATE_KEYS = ["require", "forbid", "all", "any", "state", "stateAll", "stateNot", "era", "eraIn", "minYear", "route", "routeIn", "forbidRoute", "chain"]; // v0.23 WP6（S-6D）：选项级门与 renderFork 同口径（原只过滤 deferDating，proc_abroad_kind 的 eraIn 不生效）
    let visChoices = item.choices ? item.choices.map((c, i) => [c, i]).filter(([c]) => !(c.deferDating && (IFY.S.datingDefers || 0) >= 2) && (!GATE_KEYS.some((k) => k in c) || IFY.met(c))) : null; // dating 推迟两次后不再给推迟选项
    if (visChoices && !visChoices.length && item.choices) visChoices = item.choices.map((c, i) => [c, i]); // 全被过滤时回落全选项集（与 renderFork 同款，防空屏/abroadKind 永远落不了值）
    IFY.app().innerHTML = `<section class="card">${IFY.head()}<p class="body">${IFY.esc(IFY.procText(item))}</p>${IFY.deltaLine()}
      ${visChoices ? `<div class="choices">${visChoices.map(([c, i]) => `<button class="choice" data-i="${i}">${IFY.esc(c.label)}</button>`).join("")}</div><div id="echo"></div>`
                  : `<button class="primary" id="cont">继续</button>`}</section>`;
    IFY.finishRender();
    if (!visChoices) {
      IFY.save(); IFY.el("cont").addEventListener("click", () => IFY.step());
      // 全程自动选扩围（本批补漏）：无选项的进程拍也是无抉择屏，按 advance 规矩 arm——
      // 否则零点击整局会卡在退休/照护这类叙述拍上。plain/full 都可流过。
      IFY.armAuto(IFY.procText(item), () => IFY.step());
      return;
    }
    const chooseProcChoice = (c, autoSelected) => {
      IFY.clearAuto();
      IFY.applyEffects(c.effects);
      if (c.set) IFY.S.flags[c.set] = true;
      if (typeof IFY.houseOnBuyFlag === "function") IFY.houseOnBuyFlag(IFY.S, c.set, c);
      if (typeof IFY.careerNote === "function") IFY.careerNote(IFY.S, c);
      IFY.applyState(c);
      if (c.deferDating) { IFY.S.datingSince = IFY.S.age - 3; IFY.S.datingDefers = (IFY.S.datingDefers || 0) + 1; } // 推迟：时钟回拨，下次到期在约 4 年后
      if (c.deferRetire) { if (IFY.S.retirePlan) IFY.S.retirePlan.nodeAge = IFY.S.age + 3; IFY.S.retireDefers = (IFY.S.retireDefers || 0) + 1; } // 退休节点推迟（v0.19.0）：节点后移 3 年，推迟两次后由 proc_retire_auto 收束
      if (autoSelected) IFY.S.log.push(`${IFY.S.age} 岁 · 自动选：${c.label}`);
      IFY.rec("proc", item.id, { choice: c.label, set: c.set || null, fx: IFY.S.lastDelta });
      document.querySelector(".choices").remove();
      IFY.el("echo").innerHTML = `${IFY.deltaLine()}${autoSelected ? `<p class="autonote">自动推进 · 已选「${IFY.esc(c.label)}」</p>` : `<p class="pickednote">已选「${IFY.esc(c.label)}」</p>`}${IFY.echoText(c) ? `<p class="echo">${IFY.esc(IFY.echoText(c))}</p>` : ""}<button class="primary" id="cont">继续</button>`;
      IFY.refreshStatsBar(); // fx-fix：进程拍选项落账后就地刷条（与事件/危机的 v0.31.2 修复对齐，此前漏了这一处，账落了条要等下一整屏才跟上）
      IFY.save(); IFY.el("cont").addEventListener("click", () => IFY.step());
      if (autoSelected) IFY.armAuto(IFY.echoText(c) || c.label, () => IFY.step(), "advance"); // 照事件屏：自动选后回响「继续」接着 arm
    };
    document.querySelectorAll(".choice").forEach((b) => b.addEventListener("click", () => {
      const c = item.choices[Number(b.dataset.i)];
      IFY.choiceBeat(b, () => chooseProcChoice(c, false));
    }));
    // 全程自动选扩围（本批补漏）：带选项的进程拍（摊牌/退休节点等）与事件屏同一套两段式——
    // 抽选只在玩家看得见的选项（visChoices）里抽，走同一落定函数；不补则零点击整局必卡在这类拍上。
    IFY.armAuto(IFY.procText(item), () => {
      const p = Math.floor(IFY.rng() * visChoices.length);
      const btns = document.querySelectorAll(".choices .choice");
      btns.forEach((o, j) => {
        o.disabled = true;
        o.classList.toggle("picked", j === p);
        o.classList.toggle("faded", j !== p);
      });
      IFY.autoPhase2 = setTimeout(() => { IFY.autoPhase2 = null; chooseProcChoice(visChoices[p][0], true); }, 400);
    }, "choice");
  }
  Object.assign(IFY, { PARENT_CAL, triW, signalAgeOf, initParents, parentsDue, renderProcItem, advanceParentStage, parentOne: one, parentFate });
})(window.IFY);
