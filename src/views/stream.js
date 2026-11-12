// [模块]《如果那年》引擎分片：呈现层——自动推进、倒计时细线、数值条与流水呈现。独立模块（包装器 + window.IFY 共享命名空间），加载顺序见 index.html。
(function (IFY) {
  "use strict";
  function linePaint(pct, transitionMs) {
    const l = IFY.el("autolinefill");
    if (!l) return;
    l.style.transition = transitionMs ? `width ${transitionMs}ms linear` : "none";
    l.style.width = pct + "%";
  }

  function lineStart(total) {
    lineReset();
    if (IFY.reducedMotion() || !total) return; // 减动效下不画细线，只留常亮圆点表示计时中（UX-MOTION §8.1 二选一取此）
    IFY.lineTotal = total; IFY.lineSegT = Date.now();
    linePaint(100, 0);
    const l = IFY.el("autolinefill"); if (l) void l.offsetWidth; // 强制回流，让随后的收尽过渡真正播放
    linePaint(0, total);
  }

  function lineFreeze() {
    if (!IFY.lineSegT || !IFY.lineTotal) return;
    IFY.lineElapsedBase += Date.now() - IFY.lineSegT; IFY.lineSegT = 0;
    linePaint(Math.max(0, Math.min(100, (IFY.lineTotal - IFY.lineElapsedBase) / IFY.lineTotal * 100)), 0);
  }

  function lineResume() {
    if (!IFY.lineTotal || IFY.reducedMotion()) return;
    const rem = IFY.lineTotal - IFY.lineElapsedBase;
    if (rem <= 0) { linePaint(0, 0); return; }
    linePaint(Math.max(0, Math.min(100, rem / IFY.lineTotal * 100)), 0); // 先无过渡地站到剩余位置（冻结态或未启动态）
    const l = IFY.el("autolinefill"); if (l) void l.offsetWidth;
    IFY.lineSegT = Date.now();
    linePaint(0, rem);
  }

  function lineReset() { IFY.lineTotal = 0; IFY.lineElapsedBase = 0; IFY.lineSegT = 0; linePaint(0, 0); }

  function autoEligible() {
    if (IFY.autoHold) return false; // 玩家点正文暂停了本屏：本屏不再自动推进，偏好本身不动（暂停≠关）
    if (!IFY.autoText || !IFY.autoAction || IFY.prefs.mode === "off") return false;
    // v0.34.1（用户定）：自动推进从 0 岁起与成年同一套规矩——序章不再排除平年，无选项的幕按阅读时长自己往前走，选项幕照旧停住等玩家。
    return IFY.autoKind === "advance" || (IFY.autoKind === "choice" && IFY.prefs.mode === "full");
  }

  function clearAuto() {
    if (IFY.autoTimer !== null) { clearTimeout(IFY.autoTimer); IFY.autoTimer = null; }
    if (IFY.autoPhase2 !== null) {
      clearTimeout(IFY.autoPhase2); IFY.autoPhase2 = null;
      // 预高亮被取消（切档/点正文夺回手动）时复位按钮，否则选项会被锁死在禁用态
      document.querySelectorAll(".choices .choice").forEach((o) => { o.disabled = false; o.classList.remove("picked", "faded"); });
    }
    IFY.autoRemain = 0; lineReset();
  }

  function clearAutoContext() { clearAuto(); IFY.autoText = null; IFY.autoAction = null; IFY.autoKind = null; }

  function autoDelay(text) {
    const cps = IFY.SPEED_CPS[IFY.prefs.speed] || IFY.SPEED_CPS.mid;
    return Math.min(IFY.AUTO_CAP_MS, Math.round(IFY.AUTO_BASE_MS + ((text ? text.length : 0) * 1000) / cps));
  }

  function startAuto(ms) {
    if (IFY.autoTimer !== null) clearTimeout(IFY.autoTimer);
    IFY.autoStamp = Date.now(); IFY.autoRemain = ms;
    const action = IFY.autoAction;
    IFY.autoTimer = setTimeout(() => { IFY.autoTimer = null; IFY.autoRemain = 0; if (action) action(); }, ms);
  }

  function scheduleAuto() {
    clearAuto();
    if (autoEligible()) {
      IFY.autoTotal = autoDelay(IFY.autoText);
      // choice 模式：主计时在总停留的最后 400ms 之前到点，先预高亮，再由第二段执行选择（§4.3）
      const wait = IFY.autoKind === "choice" ? Math.max(200, IFY.autoTotal - 400) : IFY.autoTotal;
      IFY.autoRemain = wait;
      if (!document.hidden) { startAuto(wait); lineStart(IFY.autoTotal); }
      else { IFY.lineTotal = IFY.autoTotal; IFY.lineElapsedBase = 0; IFY.lineSegT = 0; } // 后台排程：只记账，回前台由 lineResume 从全长起线
    }
    refreshAutoRow();
  }

  function armAuto(text, action, kind) { // 无抉择画面传 advance；普通事件选项画面只在 full 模式传自动选动作
    IFY.autoHold = false; // 新一屏：上一屏的点按暂停到此为止，按存好的偏好重新排程
    IFY.autoText = text; IFY.autoAction = action || IFY.advance; IFY.autoKind = kind || "advance";
    scheduleAuto();
  }

  function pauseAuto() {
    if (IFY.autoTimer !== null) { clearTimeout(IFY.autoTimer); IFY.autoTimer = null; IFY.autoRemain = Math.max(0, IFY.autoRemain - (Date.now() - IFY.autoStamp)); lineFreeze(); }
    // 第二段（预高亮后的 400ms）已承诺执行，不在此冻结：窗口极短且 clearAuto 仍可由玩家点击取消
  }

  function resumeAuto() { // 回到前台且当前画面仍可自动推进、还有剩余时间，才接着走
    // v0.51.1：序章还没选路、S.route 为空时也要能续——旧闸只认 route，切走再切回时序章的计时永远续不上、画面死在原地（玩家席实测：平年开着，1 岁屏纹丝不动）。
    if (autoEligible() && IFY.autoRemain > 0 && IFY.autoTimer === null && IFY.autoPhase2 === null && IFY.S && (IFY.S.route || (IFY.S.prologue && !IFY.S.prologue.done)) && !IFY.S.death && IFY.S.age < IFY.MAX_AGE && !document.hidden) { startAuto(IFY.autoRemain); lineResume(); }
  }

  function speedButtonLabel(k) { return `${IFY.SPEED_LABEL[k]} · ${IFY.SPEED_STYLE[k]}`; }

  function autoRowHtml() {
    const counting = autoEligible();
    const modes = IFY.AUTO_MODES.map(([k, label]) => `<button type="button" class="automode${IFY.prefs.mode === k ? " on" : ""}" data-automode="${k}">${label}</button>`).join("");
    const spd = ["slow", "mid", "fast"].map((k) => `<button type="button" class="autospd${IFY.prefs.speed === k ? " on" : ""}" data-autospeed="${k}">${speedButtonLabel(k)}</button>`).join("");
    return `<span class="autoleft">自动推进 ${modes}${counting ? `<span class="autodot" aria-hidden="true"></span><span class="autolive">自动推进中</span>` : ""}</span><span class="autoright">${spd}</span>`;
  }

  function refreshAutoRow() { const r = IFY.el("autorow"); if (r) r.innerHTML = autoRowHtml(); refreshAutoPanel(); }

  // v0.20.4 局内推进设置面板：卡内一行小字入口，点开是开局页同款控件（模式 .switchpicks / 速度 .segpicks），
  // 按钮沿用 data-automode / data-autospeed 走 engine.js 的既有事件委托（setAutoMode / 速度分支 → savePrefs + scheduleAuto 立即生效）。
  function autoPanelHtml() {
    const modes = IFY.AUTO_MODES.map(([k, label]) => `<button type="button" class="switchbtn${IFY.prefs.mode === k ? " sel" : ""}" data-automode="${k}"><b>${label}</b></button>`).join("");
    const spd = ["slow", "mid", "fast"].map((k) => `<button type="button" class="segbtn${IFY.prefs.speed === k ? " sel" : ""}" data-autospeed="${k}">${speedButtonLabel(k)}</button>`).join("");
    const open = !!IFY.autoPanelOpen;
    return `<div class="autopanelwrap"><p class="autopanelrow"><button type="button" class="setlink" id="autosetbtn" aria-expanded="${open}">${open ? "推进设置 · 收起" : "推进设置"}</button></p><div class="autopanel" id="autopanel"${open ? "" : " hidden"}><p class="picklab">自动推进</p><div class="switchpicks">${modes}</div><p class="picklab">速度</p><div class="segpicks${IFY.prefs.mode === "off" ? " dim" : ""}">${spd}</div></div></div>`;
  }

  function refreshAutoPanel() {
    const p = IFY.el("autopanel"); if (!p) return;
    p.querySelectorAll("[data-automode]").forEach((b) => b.classList.toggle("sel", b.getAttribute("data-automode") === IFY.prefs.mode));
    p.querySelectorAll("[data-autospeed]").forEach((b) => b.classList.toggle("sel", b.getAttribute("data-autospeed") === IFY.prefs.speed));
    const sp = p.querySelector(".segpicks"); if (sp) sp.classList.toggle("dim", IFY.prefs.mode === "off");
  }

  function setAutoMode(mode) {
    if (!IFY.AUTO_MODES.some(([k]) => k === mode)) return;
    IFY.autoHold = false; // 显式改档 = 按新档恢复排程，清掉点按暂停
    IFY.prefs.mode = mode;
    IFY.savePrefs();
    scheduleAuto();
    if (IFY.S && IFY.S.route) IFY.save();
  }

  function statsBar() {
    // §2.1：先按上屏快照的旧值出宽，渲染后一帧再写新值，让 .6s 过渡真正播放；§2.3：<30 的维度加临界静态分级
    return `<div class="stats">${IFY.STAT_META.map(([k, label]) => {
      const cur = IFY.S.stats[k], old = IFY.prevStats ? IFY.prevStats[k] : cur, crit = cur < 30;
      return `<div class="stat${crit ? " crit" : ""}"><span>${label}</span><div class="bar"><i style="width:${old}%" data-cur="${cur}"></i></div><b>${Math.round(cur)}</b>${crit ? '<i class="cdot"></i>' : ""}</div>`;
    }).join("")}</div>`;
  }

  function animateBars() {
    document.querySelectorAll("#app .bar i[data-cur]").forEach((bar) => {
      const cur = bar.getAttribute("data-cur");
      requestAnimationFrame(() => { bar.style.width = cur + "%"; });
    });
    if (IFY.S) IFY.prevStats = { ...IFY.S.stats };
  }

  // v0.31.2：选项效果落账后就地刷新数值条。事件/危机选项处理器只重写 #echo，头部条
  // 原本停在进屏时的数——平时下一屏紧接着来没人察觉，终局下一屏换成结算页就对不上
  // （ellie-diag-money80 定根）。这里按当刻 stats 原地改数与条宽、临界分级同步，
  // prevStats 一并更新（下一整屏的入场动画不再从旧值起）。纯呈现：不动落账、随机流、状态。
  function refreshStatsBar() {
    if (!IFY.S) return;
    const rows = document.querySelectorAll("#app .stats .stat");
    IFY.STAT_META.forEach(([k], i) => {
      const row = rows[i]; if (!row) return;
      const cur = IFY.S.stats[k];
      const bar = row.querySelector(".bar i");
      if (bar) { bar.setAttribute("data-cur", String(cur)); bar.style.width = cur + "%"; }
      const b = row.querySelector("b");
      if (b) b.textContent = String(Math.round(cur));
      const crit = cur < 30;
      row.classList.toggle("crit", crit);
      let dot = row.querySelector(".cdot");
      if (crit && !dot) { dot = document.createElement("i"); dot.className = "cdot"; row.appendChild(dot); }
      if (!crit && dot) dot.remove();
    });
    IFY.prevStats = { ...IFY.S.stats };
  }

  // 渲染收尾：§1.1 分级入场（同类画面卡壳不动、只正文淡入）+ 数值条动画
  function finishRender() {
    const sec = IFY.app().querySelector("section.card");
    if (sec && IFY.curKind === IFY.prevKind && (IFY.curKind === "year" || IFY.curKind === "fork")) {
      sec.classList.add("still");
      let past = false;
      [...sec.children].forEach((kid) => {
        if (past) kid.classList.add("enter");
        if (kid.classList.contains("autorow") || kid.classList.contains("autoline") || kid.classList.contains("meta")) past = true;
      });
    }
    IFY.prevKind = IFY.curKind;
    animateBars();
  }

  function roadSvg() {
    const W = 640, pad = 14, end = IFY.finalAge();
    if (!IFY.S.death && IFY.S.age < IFY.MAX_AGE) {
      // fix6：游玩中改滑动窗口（step() 保证游玩屏只出现在未终局且岁数未及上限时，故终局屏/结算屏不会进此分支）。
      // 视窗只装一段路：身后约 21 年＋脚下＋前方约 30 年（同一标尺 12px/年）；当前点锚在全宽 42% 处（cx=271）永不移动，
      // 岁月推进时路从脚下流过。任何几何量都不编码一生总长：没有全长、没有终点、点的位置比例反推不出剩余寿命。
      // 图上不出现任何岁数标（当前岁数见下方 meta 行）。
      const PP = 12; // 每年 12px，身后/前方同一标尺
      const anchorX = 271; // nowdot 锚位（全宽 42.3%）：身后 (271-14)/12 ≈ 21.4 年，前方 (640-14-271)/12 ≈ 29.6 年
      const age = IFY.S.age;
      const X = (a) => anchorX + (a - age) * PP;
      const forkFiredW = (f) => IFY.S.log.some((l) => l.startsWith(`${f.age} 岁 · `) && f.choices.some((c) => l.endsWith(`：${c.label}`)));
      let s = "";
      (IFY.D.forks || []).filter((f) => !f.procOnly && f.age < end && !(f.state && age > f.age && !forkFiredW(f))).forEach((f) => { // 过滤口径同旧画法（带门分岔没轮到这位玩家时不画）；procOnly 进程分岔无固定站点、不入图（S4 起）
        const x = X(f.age);
        if (x < pad || x > W - pad) return; // 窗口外的站点不画：走过的随窗口左移出界，未来的从右侧渐隐段里随接近而显形
        const on = age >= f.age, col = on ? "#2F4A3C" : "#C4BCA9";
        s += `<line x1="${x}" y1="30" x2="${x + 13}" y2="13" stroke="${col}" stroke-width="1.6" stroke-dasharray="3 3"/><circle cx="${x}" cy="30" r="3" fill="${col}"/>`;
      });
      // 序章引线与 22 站点：只在窗口覆盖到时出现（开局头几年在画内，年岁渐长自然滑出，不为留住它们破坏窗口规则）；不再配岁数文字标
      let leadIn = "";
      if (X(IFY.START_AGE) > pad) {
        leadIn = `<line x1="${Math.max(pad, X(5))}" y1="30" x2="${X(IFY.START_AGE)}" y2="30" stroke="#C4BCA9" stroke-width="2" stroke-dasharray="2 4"/>`
          + (X(5) >= pad ? `<circle cx="${X(5)}" cy="30" r="3" fill="none" stroke="#C4BCA9" stroke-width="1.6"/>` : "")
          + `<circle cx="${X(IFY.START_AGE)}" cy="30" r="3.5" fill="#2F4A3C"/>`;
      }
      const track = `<defs><linearGradient id="roadfade" gradientUnits="userSpaceOnUse" x1="${pad}" y1="30" x2="${W - pad}" y2="30"><stop offset="0" stop-color="#D8D2C2" stop-opacity="0"/><stop offset=".07" stop-color="#D8D2C2"/><stop offset=".58" stop-color="#D8D2C2"/><stop offset="1" stop-color="#D8D2C2" stop-opacity="0"/></linearGradient></defs><line x1="${pad}" y1="30" x2="${W - pad}" y2="30" stroke="url(#roadfade)" stroke-width="2"/>`;
      const greenFrom = X(IFY.START_AGE) > pad ? X(IFY.START_AGE) : pad; // 已走过的成人段：22 站点还在画内时从站点起画（不覆盖引线点线），滑出后从左缘起画
      return `<svg class="road" viewBox="0 0 ${W} 52" width="100%" aria-hidden="true">${track}${leadIn}${s}<line x1="${greenFrom}" y1="30" x2="${anchorX}" y2="30" stroke="#2F4A3C" stroke-width="2.5"/><circle class="nowdot" cx="${anchorX}" cy="30" r="5" fill="#2F4A3C"/></svg>`;
    }
    // 终局路径（死亡屏 renderDeath、结算屏 renderEnd 的 head 调用）：身后记录，v0.26.1 画法原样保留，不走滑动窗口
    const lead = 64; // fix5 追加修正：序章引线宽（全宽 10%，象征段，不参与成人段比例）——人生从 5 岁起，22 岁只是选路的汇合站，不是路的端点
    const x0 = pad + lead;
    const X = (a) => x0 + ((a - IFY.START_AGE) / (end - IFY.START_AGE)) * (W - pad - x0); // 成人段比例不变：先扣引线宽，再按 22..end 标尺算
    const alive = !IFY.S.death; // fix5：游玩中终局未定——右端不标岁数（不预设终点），底线末段渐隐成开放式；终局已定后右端标真实终局岁（事实）
    let s = "";
    const forkFired = (f) => IFY.S.log.some((l) => l.startsWith(`${f.age} 岁 · `) && f.choices.some((c) => l.endsWith(`：${c.label}`)));
    (IFY.D.forks || []).filter((f) => !f.procOnly && f.age < end && !(f.state && IFY.S.age > f.age && !forkFired(f))).forEach((f) => { // v0.16.0：带门分岔没轮到这位玩家时不画（未到龄仍照常淡显）；procOnly 进程分岔不入图（S4 起）
      const on = IFY.S.age >= f.age, col = on ? "#2F4A3C" : "#C4BCA9";
      s += `<line x1="${X(f.age)}" y1="30" x2="${X(f.age) + 13}" y2="13" stroke="${col}" stroke-width="1.6" stroke-dasharray="3 3"/><circle cx="${X(f.age)}" cy="30" r="3" fill="${col}"/>`;
    });
    const leadIn = `<line x1="${pad}" y1="30" x2="${x0}" y2="30" stroke="#C4BCA9" stroke-width="2" stroke-dasharray="2 4"/><circle cx="${pad}" cy="30" r="3" fill="none" stroke="#C4BCA9" stroke-width="1.6"/>`;
    const track = alive
      ? `<defs><linearGradient id="roadfade" gradientUnits="userSpaceOnUse" x1="${x0}" y1="30" x2="${W - pad}" y2="30"><stop offset=".55" stop-color="#D8D2C2"/><stop offset="1" stop-color="#D8D2C2" stop-opacity="0"/></linearGradient></defs><line x1="${x0}" y1="30" x2="${W - pad}" y2="30" stroke="url(#roadfade)" stroke-width="2"/>`
      : `<line x1="${x0}" y1="30" x2="${W - pad}" y2="30" stroke="#D8D2C2" stroke-width="2"/>`;
    const endLab = alive ? "" : `<text x="${W - pad}" y="49" font-size="10" fill="#8A8378" text-anchor="end">${end} 岁</text>`;
    return `<svg class="road" viewBox="0 0 ${W} 52" width="100%" aria-hidden="true">${leadIn}${track}${s}<line x1="${x0}" y1="30" x2="${X(IFY.S.age)}" y2="30" stroke="#2F4A3C" stroke-width="2.5"/><circle cx="${x0}" cy="30" r="3.5" fill="#2F4A3C"/><circle class="nowdot" cx="${X(IFY.S.age)}" cy="30" r="5" fill="#2F4A3C"/><text x="${pad}" y="49" font-size="10" fill="#8A8378">5 岁</text><text x="${x0}" y="49" font-size="10" fill="#8A8378" text-anchor="middle">22 岁</text>${endLab}</svg>`;
  }

  function head(note, bare) {
    const yr = IFY.S.birthYear ? ` · 公元 ${IFY.S.birthYear + IFY.S.age} 年` : "";
    const mark = IFY.resumeMark ? " · （上次玩到这里）" : ""; // §6.2 续玩定位：只出现一次
    if (IFY.resumeMark) IFY.resumeMark = false;
    return `${roadSvg()}${statsBar()}<p class="meta">${IFY.S.age} 岁${yr} · ${IFY.esc(IFY.S.route.name)} · 种子 ${IFY.esc(IFY.S.seedStr)}${mark}${note ? " · " + note : ""}</p>${bare ? "" : `<div class="autorow" id="autorow">${autoRowHtml()}</div><div class="autoline"><i id="autolinefill"></i></div>${autoPanelHtml()}`}`;
  }

  // CL-150：工资年结降为附加信息（用户裁定「不作为主要事件」）——流水账里年结行不再
  // 与事件行同格独立成行：按年龄组归并后作小字附注（.wageattach）挂到同年最后一行
  // 非年结行之下；该年若只有年结行，垫底一条弱化附注行（.wageonly），不丢行。
  // 存储（S.log 原行）与识别口径（行首「工资年结」前缀）一字未动，旧存档同读同认；
  // 归并只动呈现，零 rng、零状态写。结算年表同口径（settlement.js 年表段）。
  function streamHtml() {
    if (!IFY.S || !IFY.S.log.length) return "";
    const unread = !IFY.streamFollow && IFY.S.log.length > IFY.streamSeen;
    const log = IFY.S.log;
    const ent = log.map((l, i) => {
      const m = typeof l === "string" && l.match(/^(\d+) 岁 · ([\s\S]*)$/);
      return { i, age: m ? +m[1] : IFY.S.age, txt: m ? m[2] : l, wage: !!(m && m[2].startsWith("工资年结")) };
    });
    // 同龄行在流水账里天然相邻（逐年追加），按连续同龄段归并
    const groups = [];
    for (const e of ent) {
      const g = groups[groups.length - 1];
      if (g && g.age === e.age) g.items.push(e); else groups.push({ age: e.age, items: [e] });
    }
    const rowCls = (idxs) => idxs.includes(log.length - 1) ? " last" : (!IFY.streamFollow && idxs.some((i) => i >= IFY.streamSeen) ? " new" : "");
    const rows = [];
    for (const g of groups) {
      const mains = g.items.filter((e) => !e.wage), wages = g.items.filter((e) => e.wage);
      mains.forEach((e, k) => {
        const yr = IFY.S.birthYear ? `${IFY.S.birthYear + e.age} · ` : "";
        const notes = k === mains.length - 1 ? wages : []; // 年结附注只挂该年最后一行正文
        const idxs = [e.i].concat(notes.map((w) => w.i));
        rows.push(`<div class="srow${rowCls(idxs)}"><span class="sage">${yr}${e.age} 岁</span><span>${IFY.esc(e.txt)}${notes.map((w) => `<span class="wageattach">${IFY.esc(w.txt)}</span>`).join("")}</span></div>`);
      });
      if (!mains.length) for (const w of wages) {
        const yr = IFY.S.birthYear ? `${IFY.S.birthYear + w.age} · ` : "";
        rows.push(`<div class="srow wageonly${rowCls([w.i])}"><span class="sage">${yr}${w.age} 岁</span><span>${IFY.esc(w.txt)}</span></div>`);
      }
    }
    return `<div class="streamwrap"><p class="streamtitle">这一生 · 流水账<button type="button" class="newhint" id="newhint"${unread ? "" : " hidden"}>有新的一年 ↓</button></p><div class="stream" id="stream">${rows.join("")}</div></div>`;
  }

  function mountStream() {
    const sec = IFY.app().querySelector("section.card");
    if (!sec || !IFY.S || (!IFY.S.route && IFY.S.phase !== "prologue") || IFY.S.death || IFY.S.age >= IFY.MAX_AGE) return; // v0.17.0：序章段无 route 也挂流水账（童年的平年行要看得见）
    const html = streamHtml();
    if (!html) return;
    if (window.matchMedia && window.matchMedia("(min-width: 1024px)").matches) {
      IFY.app().classList.add("playwrap");
      sec.insertAdjacentHTML("afterend", html);
    } else {
      IFY.app().classList.remove("playwrap");
      sec.insertAdjacentHTML("beforeend", html);
    }
    const st = IFY.el("stream");
    if (!st) return;
    // §5.1 跟随状态机：距底 <40px 为贴底跟随；上翻后切自由浏览，不再被新行拽回
    st.addEventListener("scroll", () => {
      IFY.streamTop = st.scrollTop;
      if (Date.now() < IFY.streamProgUntil) return; // 程序滚动进行中，不让它误判跟随状态
      const dist = st.scrollHeight - st.scrollTop - st.clientHeight;
      const was = IFY.streamFollow;
      IFY.streamFollow = dist < 40;
      if (IFY.streamFollow && !was) markStreamRead(st);
    });
    const nh = IFY.el("newhint");
    if (nh) nh.addEventListener("click", () => {
      IFY.streamFollow = true;
      markStreamRead(st);
      IFY.streamProgUntil = Date.now() + 450;
      st.scrollTo({ top: st.scrollHeight, behavior: IFY.reducedMotion() ? "auto" : "smooth" });
    });
    requestAnimationFrame(() => {
      if (IFY.streamFollow) {
        // §5.2 先回到上屏的滚动位置再跟随到底。v0.31.1：程序跟随滚动一律瞬时到位——平滑滚动约 0.2 秒
        // 的在飞窗口里最末一行会被盒子下缘切一截（bantou-diag1 定根）；玩家手动滚动与 newhint 钮行为不变。
        st.scrollTop = Math.min(IFY.streamTop, Math.max(0, st.scrollHeight - st.clientHeight));
        IFY.streamProgUntil = Date.now() + 450;
        st.scrollTo({ top: st.scrollHeight, behavior: "auto" });
        IFY.streamSeen = IFY.S.log.length;
      } else {
        st.scrollTop = Math.min(IFY.streamTop, Math.max(0, st.scrollHeight - st.clientHeight));
      }
    });
  }

  function markStreamRead(st) {
    IFY.streamSeen = IFY.S.log.length;
    const nh = IFY.el("newhint"); if (nh) nh.hidden = true;
    if (st) st.querySelectorAll(".srow.new").forEach((r) => r.classList.remove("new"));
  }

  // fx-fix：标注行＝工资年结（S.wageDelta）＋本屏这一笔（S.lastDelta），两笔分开印。
  // 工资在 step() 内进程拍之后、分岔/瞥视/事件之前结算，此前它的 lastDelta 总被后续
  // 渲染覆盖或清空——钱跨屏变了却无标注，同岁事件的钱还会被它静默抵平。拼行后：
  // 带标注行的屏（事件/分岔回响/危机/稀有/平年）当屏可见；瞥视/微年不走本函数，
  // 靠 wageDue 同步写下的流水账一行留痕。本函数是 deltaLine 唯一的口径改动点。
  function deltaLine() {
    const parts = [];
    if (IFY.S.wageDelta) parts.push(IFY.S.wageDelta);
    if (IFY.S.lastDelta) parts.push(IFY.S.lastDelta);
    return parts.length ? `<p class="delta">${IFY.esc(parts.join(" · "))}</p>` : "";
  }

  // §3.2 选择留一拍：被选按钮先置选中态停留 250ms、其余变淡，然后才执行后续（回响/复述拍）
  function choiceBeat(btn, fn) {
    clearAuto();
    const box = btn.closest(".choices");
    if (box) box.querySelectorAll(".choice").forEach((o) => {
      o.disabled = true;
      o.classList.toggle("picked", o === btn);
      o.classList.toggle("faded", o !== btn);
    });
    setTimeout(fn, 250);
  }
  Object.assign(IFY, { linePaint, lineStart, lineFreeze, lineResume, lineReset, autoEligible, clearAuto, clearAutoContext,
    autoDelay, startAuto, scheduleAuto, armAuto, pauseAuto, resumeAuto, speedButtonLabel, autoRowHtml,
    refreshAutoRow, autoPanelHtml, refreshAutoPanel, setAutoMode, statsBar, animateBars, refreshStatsBar, finishRender, roadSvg, head, streamHtml,
    mountStream, markStreamRead, deltaLine, choiceBeat });
})(window.IFY);
