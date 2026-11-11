// [模块]《如果那年》引擎分片：呈现层——分享卡出图。独立模块（包装器 + window.IFY 共享命名空间），加载顺序见 index.html。
(function (IFY) {
  "use strict";
  // ---------- 分享卡出图 (VISUAL-DESIGN §二, A 判词版) ----------
  function wrapText(ctx, text, x, y, maxW, lh) {
    let line = "", yy = y;
    for (const ch of text) { if (ctx.measureText(line + ch).width > maxW && line) { ctx.fillText(line, x, yy); line = ch; yy += lh; } else line += ch; }
    if (line) ctx.fillText(line, x, yy);
    return yy + lh;
  }

  // 同局链接：种子 + 年代 + 出身牌所选（v0.13.2：改过牌面后朋友打开须同牌，否则「完全相同的运气」不成立）
  function sameSeedUrl() {
    let u = location.origin + location.pathname
      + "?seed=" + encodeURIComponent(IFY.S.seedStr)
      + "&era=" + encodeURIComponent(IFY.S.era || "c2000")
      + "&k=3"; // 内核版本位（v0.18.0）：k=3 为三股流新口径；无此位的旧链接按新口径打开同一种子，不保证同一局（策略见 DEVLOG v0.18.0 条目）
    if (IFY.S.cards && IFY.S.cards.length) u += "&cards=" + encodeURIComponent(IFY.S.cards.join(","));
    return u;
  }

  // 勾选了「印到卡上」才取感想输入框的当前文字（预填的是第一句 reflection，可改）
  function cardReflText() {
    const box = IFY.el("cardrefl"), inp = IFY.el("shareline");
    if (!box || !box.checked || !inp) return "";
    return (inp.value || "").trim().slice(0, 40);
  }

  // 本局是否交换过（v0.22 WP7）：权威在 session.meta.swapped；无 session 时恒 false（legacy 口径）。
  function swappedOnce() {
    return !!(IFY.session && IFY.session.meta && IFY.session.meta.swapped);
  }

  // 发帖文案：感想（若填）+ 判词 + 主影子 + 其他三条路 + 钩子 + 同局链接
  function shareCopy() {
    const line = (IFY.el("shareline") ? IFY.el("shareline").value : "").trim();
    const parts = [];
    if (line) parts.push(line);
    parts.push(IFY.verdict().text);
    const shadowLines = IFY.shadowCompareLines();
    if (shadowLines.main) parts.push(shadowLines.main);
    parts.push(...shadowLines.others);
    if (swappedOnce()) parts.push("中途换过一条路"); // v0.22 WP7：交换过的局，文案同步加这一行
    parts.push("同样的运气，你会怎么选？");
    parts.push(sameSeedUrl());
    return parts.join("\n");
  }

  function fitText(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text;
    let t = text;
    while (t.length && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
    return t + "…";
  }

  function cardBase(x, W, H) {
    x.fillStyle = "#FAF8F4"; x.fillRect(0, 0, W, H);
    x.strokeStyle = "#DDD6C9"; x.lineWidth = 3; x.strokeRect(36, 36, W - 72, H - 72);
    x.textAlign = "left";
    x.fillStyle = "#2F4A3C"; x.font = "34px " + IFY.SERIF;
    x.fillText("人生RESTART：如果那年", 90, 130);
    x.fillStyle = "#8A948C"; x.font = "28px monospace"; x.textAlign = "right";
    x.fillText("种子 " + IFY.S.seedStr, W - 90, 130); x.textAlign = "left";
  }

  function cardFooter(x, W, H) {
    x.fillStyle = "#2F4A3C"; x.font = "34px " + IFY.SERIF;
    x.fillText("同样的运气，你会怎么选？", 90, H - 140);
    x.fillStyle = "#8A948C"; x.font = "28px " + IFY.SANS;
    x.fillText("if-that-year.sommeatlas.com", 90, H - 88);
  }

  function cardStats(x, y, barW, rowH) {
    const step = rowH || 50;
    x.font = "28px " + IFY.SANS;
    IFY.STAT_META.forEach(([k, label]) => {
      x.fillStyle = "#23211C"; x.fillText(label, 90, y + 8);
      x.fillStyle = "#DDD6C9"; x.fillRect(190, y - 8, barW, 14);
      x.fillStyle = "#2F4A3C"; x.fillRect(190, y - 8, (barW * IFY.S.stats[k]) / 100, 14);
      x.fillStyle = "#23211C"; x.fillText(String(Math.round(IFY.S.stats[k])), 190 + barW + 30, y + 8); // v0.30.3：内部浮点只取整显示，条宽仍用原值比例
      y += step;
    });
    return y;
  }

  // 分岔路图：松绿实线一生 + 影子灰绿虚线支路（与原判词卡同一画法）
  function drawRoad(x, gy) {
    const end = IFY.finalAge();
    x.strokeStyle = "#2F4A3C"; x.lineWidth = 7; x.beginPath(); x.moveTo(90, gy); x.lineTo(990, gy); x.stroke();
    x.strokeStyle = "#8A948C"; x.lineWidth = 4; x.setLineDash([14, 12]);
    IFY.D.forks.filter((f) => !f.procOnly && f.age < end).forEach((f) => { const fx = 90 + (900 * (f.age - IFY.START_AGE)) / (end - IFY.START_AGE); x.beginPath(); x.moveTo(fx, gy); x.quadraticCurveTo(fx + 60, gy - 90, fx + 150, gy - 110); x.stroke(); }); // procOnly 进程分岔无固定站点、不入图（S4 起）
    x.setLineDash([]);
    x.fillStyle = "#2F4A3C"; x.beginPath(); x.arc(990, gy, 12, 0, 7); x.fill();
  }

  // 卡面流水来源（v0.22.1 F5）：交换局改读 playerFacts 的合并段流水（玩家两段亲历的拼接，
  // 与结算同一份账），不再拿接管轨自 22 岁起的全程流水（前半段是政策 Bot 的年月）冒充
  // 「这一生」；未交换局视图为 null，走 IFY.S.log 原口径，一字不变。
  function cardLogLines() {
    const v = typeof IFY.playerFacts === "function" ? IFY.playerFacts() : null;
    return v ? v.mergedLog : (IFY.S.log || []);
  }

  function parseLog() {
    const entries = [];
    for (const l of cardLogLines()) {
      const m = l.match(/^(\d+) 岁 · ([\s\S]*)$/);
      if (m) entries.push({ age: +m[1], text: m[2] });
    }
    return entries;
  }

  // 流水账卡的关键节点（3–5 个）：第一次分岔选择 / 稀有事件 / 后段分岔 / 特殊结局
  function logNodes() {
    const entries = parseLog();
    const picked = [];
    const push = (age, title) => { if (age !== null && title && !picked.some((p) => p.age === age)) picked.push({ age, title }); };
    const forks = entries.filter((e) => e.age > IFY.START_AGE && e.text.includes("：") && !e.text.includes("影子"));
    if (forks[0]) push(forks[0].age, forks[0].text.split("：")[0]);
    const rares = entries.filter((e) => e.text.includes("【稀有】"));
    if (rares[0]) push(rares[0].age, "稀有 · " + rares[0].text.replace("【稀有】", "").slice(0, 10));
    if (rares[1]) push(rares[1].age, "稀有 · " + rares[1].text.replace("【稀有】", "").slice(0, 10));
    if (forks.length > 1) push(forks[forks.length - 1].age, forks[forks.length - 1].text.split("：")[0]);
    picked.sort((a, b) => a.age - b.age);
    const out = picked.slice(0, 5);
    if (IFY.S.special && !out.some((p) => p.age === IFY.finalAge())) {
      if (out.length >= 5) out.pop();
      out.push({ age: IFY.finalAge(), title: IFY.S.special.title });
    }
    return out;
  }

  // 9:16 流水账卡补的年表节选：带「：」的抉择行与稀有行优先，再等距补足
  function logHighlights(n) {
    const entries = parseLog();
    if (entries.length <= n) return entries;
    const picks = new Set();
    entries.forEach((e, i) => { if (e.text.includes("：") || e.text.includes("【稀有】")) picks.add(i); });
    const stepN = Math.max(1, Math.floor(entries.length / n));
    for (let i = 0; i < entries.length && picks.size < n; i += stepN) picks.add(i);
    return [...picks].sort((a, b) => a - b).slice(0, n + 1).map((i) => entries[i]);
  }

  // ---------- CL-123：分享图二维码（微信内链接被拦已成定局，分享改走「存图＋相机扫码进浏览器」） ----------
  // 二维码只编站点根地址这一个字符串，逐字不得改。模块矩阵由 src/vendor/qrcode.js
  // （qrcode-generator © Kazuhiko Arase, MIT；index.html 里排在 share.js 之前装载）生成；
  // 库缺失时静默跳过二维码、图照常出（引导语还在，玩家仍可照网址手输）。
  const QR_URL = "https://if-that-year.sommeatlas.com/";
  // 在 (qx, qy) 处画 size 见方的二维码：纸色底＋4 模块静区＋深松绿模块，与卡面同色口径。
  function drawShareQr(x, qx, qy, size) {
    if (typeof qrcode !== "function") return false;
    try {
      const qr = qrcode(0, "M"); // typeNumber 0 = 按内容自动选最小版本；纠错级 M
      qr.addData(QR_URL);
      qr.make();
      const n = qr.getModuleCount();
      const cell = size / (n + 8); // 两侧各留 4 模块静区
      x.fillStyle = "#FAF8F4"; x.fillRect(qx, qy, size, size);
      x.fillStyle = "#2F4A3C";
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        if (qr.isDark(r, c)) x.fillRect(qx + (c + 4) * cell, qy + (r + 4) * cell, cell + 0.7, cell + 0.7); // +0.7 防分数格缝隙露白
      }
      return true;
    } catch (e) { return false; }
  }
  // 引导语一行拆两行排（整句一字不改）：左对齐，base 为第一行基线，行距 34。
  function drawShareQrGuide(x, gx, base) {
    x.fillStyle = "#8A948C"; x.font = "23px " + IFY.SANS; x.textAlign = "left";
    x.fillText("微信里打不开，就存下这张图，", gx, base);
    x.fillText("用手机相机扫码，在浏览器里玩", gx, base + 34);
  }
  // 底部条幅（高 190，只加在原图底边之外）：二维码靠右下，引导语靠左，与页脚原有文字不叠。
  function drawQrBand(x, W, y0) {
    drawShareQr(x, W - 90 - 92, y0 + 49, 92);
    drawShareQrGuide(x, 90, y0 + 84);
  }

  function buildCard(type, ratio) {
    const W = 1080, H0 = ratio === "916" ? 1920 : 1350;
    const BAND = 190; // CL-123：底部条幅高度——画布只加高，主体布局仍按原图高 H0 计算，一字不动
    const H = H0 + BAND;
    const big = H0 > 1500; // 9:16 用宽松参数，4:5 用紧凑参数防溢出
    const sh = IFY.shadowRoute(); const v = IFY.verdict();
    const end = IFY.finalAge();
    const refl = cardReflText();
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d");

    if (type === "mini") {
      // ===== 判词小卡（圆桌决议 F3，免费）：竖版小卡，只有判词一句 + 双轨图母题 + 游戏名与网址。
      // 主体固定 4:5，不吃尺寸档（CL-123 起画布底边外加 190 条幅放二维码，主体比例不变）；双轨图复用 drawRoad 同一画法（不标分岔点，与全产品同口径）。
      x.fillStyle = "#FAF8F4"; x.fillRect(0, 0, W, H);
      x.strokeStyle = "#DDD6C9"; x.lineWidth = 3; x.strokeRect(36, 36, W - 72, H - 72);
      x.textAlign = "left";
      x.fillStyle = "#2F4A3C"; x.font = "44px " + IFY.SERIF;
      x.fillText("《如果那年》", 90, 170);
      x.fillStyle = "#23211C"; x.font = "62px " + IFY.SERIF;
      const vy = wrapText(x, v.text, 90, 320, 900, 92);
      const gy = Math.min(vy + 190, H0 - 420);
      drawRoad(x, gy);
      x.font = "30px " + IFY.SERIF; x.fillStyle = "#8A948C";
      x.fillText("22 岁", 90, gy + 58); x.textAlign = "right"; x.fillText(end + " 岁", 990, gy + 58); x.textAlign = "left";
      x.fillStyle = "#8A948C"; x.font = "30px " + IFY.SANS;
      x.fillText("if-that-year.sommeatlas.com", 90, H0 - 96);
      drawQrBand(x, W, H0);
      return c;
    }
    cardBase(x, W, H);

    if (type === "log") {
      // ===== 流水账卡：公元年轴 + 关键节点 =====
      x.fillStyle = "#23211C"; x.font = "52px " + IFY.SERIF;
      x.fillText("这一生 · 流水账", 90, 252);
      x.fillStyle = "#8A948C"; x.font = "30px " + IFY.SANS;
      const spanTxt = IFY.S.birthYear
        ? `公元 ${IFY.S.birthYear + IFY.START_AGE} 年 — ${IFY.S.birthYear + end} 年 · ${IFY.S.route.name}`
        : `${IFY.START_AGE} 岁 — ${end} 岁 · ${IFY.S.route.name}`;
      x.fillText(spanTxt, 90, 308);
      let y = 340;
      if (IFY.S.special) {
        x.fillStyle = "#2F4A3C"; x.font = "40px " + IFY.SERIF;
        y = wrapText(x, "【" + IFY.S.special.title + "】", 90, y + 44, 900, 58);
      }
      const gy = y + (IFY.S.special ? 150 : 210); // 年轴：上方留给分岔虚线
      drawRoad(x, gy);
      // 轴两端：公元年 · 年龄
      x.font = "26px " + IFY.SANS; x.fillStyle = "#8A948C";
      x.fillText(IFY.S.birthYear ? `${IFY.S.birthYear + IFY.START_AGE} 年 · 22 岁` : "22 岁", 90, gy + 148);
      x.textAlign = "right";
      x.fillText(IFY.S.birthYear ? `${IFY.S.birthYear + end} 年 · ${end} 岁` : `${end} 岁`, 990, gy + 148);
      x.textAlign = "left";
      // 关键节点：圆点 + 竖线 + 公元年/年龄 + 事件短题
      logNodes().forEach((n) => {
        const nx = 90 + (900 * (n.age - IFY.START_AGE)) / (end - IFY.START_AGE);
        x.strokeStyle = "#DDD6C9"; x.lineWidth = 2;
        x.beginPath(); x.moveTo(nx, gy + 12); x.lineTo(nx, gy + 30); x.stroke();
        x.fillStyle = "#2F4A3C"; x.beginPath(); x.arc(nx, gy, 9, 0, 7); x.fill();
        const align = nx < 210 ? "left" : nx > 870 ? "right" : "center";
        const ax = nx < 210 ? 90 : nx > 870 ? 990 : nx;
        x.textAlign = align;
        x.fillStyle = "#8A948C"; x.font = "24px monospace";
        x.fillText(IFY.S.birthYear ? `${IFY.S.birthYear + n.age} 年 · ${n.age} 岁` : `${n.age} 岁`, ax, gy + 62);
        x.fillStyle = "#23211C"; x.font = "26px " + IFY.SANS;
        x.fillText(fitText(x, n.title, 260), ax, gy + 100);
        x.textAlign = "left";
      });
      y = gy + 196;
      x.fillStyle = "#8A948C"; x.font = "26px " + IFY.SANS;
      x.fillText("终局判词", 90, y);
      x.fillStyle = "#23211C"; x.font = "36px " + IFY.SERIF;
      const excerpt = v.text.split("。")[0] + "。"; // 节选第一句，卡面不贪多
      y = wrapText(x, excerpt, 90, y + 52, 900, 52);
      if (refl) { x.fillStyle = "#2F4A3C"; x.font = "34px " + IFY.SERIF; y = wrapText(x, "「" + refl + "」", 90, y + 12, 900, 50); }
      if (big) {
        // 9:16 长卡补年表节选，免得下半页空着
        y += 40;
        x.fillStyle = "#2F4A3C"; x.font = "32px " + IFY.SERIF;
        x.fillText("年表节选", 90, y);
        x.font = "27px " + IFY.SANS; x.fillStyle = "#23211C";
        for (const h of logHighlights(7)) {
          y += 46;
          const line = (IFY.S.birthYear ? `${IFY.S.birthYear + h.age} 年 · ` : "") + `${h.age} 岁 · ${h.text}`;
          x.fillText(fitText(x, line, 900), 90, y);
        }
        y += 8;
      }
      cardStats(x, y + 26, 560, 44);
    } else {
      // ===== 判词卡（模板 A），视觉元素与旧版一致 =====
      // CL-129：长判词下六维条压页脚（钩子行/域名行）的存量修复。判词组装本就
      // 贴着 110 字上限出句，4:5 卡的内容流经常把六维条推过页脚。修法不动页脚、
      // 不动任何主体元素的位置口径：绘制前先按 wrapText 同一套量法预演本局的
      // 版式（只量行数、不落笔），在参数梯子里选第一套能让六维条末行避开页脚
      // 钩子行的参数——收的只是判词区字号/行距、段间空与六维条行高。内容短的
      // 局第一套（＝旧版原参数）即合身，出图与旧版逐像素一致。
      const titleY = big ? 246 : 232;
      const tall = big ? (H0 - 1350) * 0.35 : 0;
      const cardLog = cardLogLines(); // v0.22.1 F5：「关键的一岔」与流水卡同源，交换局读合并段流水
      const keyFork = cardLog.find((l) => l.includes("回不回老家")) || cardLog.find((l) => l.includes("·") && l.includes("："));
      const keyForkText = keyFork ? "关键的一岔：" + keyFork.split("· ")[1] : null;
      const routeText = "这条路：" + IFY.S.route.name + "，你走完了。";
      // v0.22 WP7：有不受控 Track 条目时影子行改真账短句（路线名 + 终局岁数，同第八槽终局一句压缩版），
      // 不再用 shadowCostText 模板（防与真账打架）；无条目（legacy）照旧模板。
      const realShadowLine = typeof IFY.uncontrolledFinalLine === "function" ? IFY.uncontrolledFinalLine() : "";
      const shadowText = realShadowLine || ("另一条路（" + sh.name + "）：" + IFY.shadowCostText(sh));
      const tagsText = IFY.lifeTags();
      const specialText = IFY.S.special ? "【" + IFY.S.special.title + "】" : null;
      const swapLine = swappedOnce() ? "中途换过一条路" : null;
      const reflText = refl ? "「" + refl + "」" : null;
      const LADDER = [
        { vF: big ? 58 : 52, vLh: big ? 80 : 68, stF: big ? 58 : 50, stLh: big ? 80 : 72, svF: 46, svLh: big ? 66 : 60, tagsLh: 40, roadGap: big ? 80 : 56, forkGap: big ? 118 : 104, bodyLh: 50, shLh: big ? 50 : 46, statsGap: big ? 26 : 14, step: big ? 50 : 42 },
        { vF: big ? 58 : 52, vLh: big ? 80 : 68, stF: big ? 58 : 50, stLh: big ? 80 : 72, svF: 46, svLh: big ? 66 : 60, tagsLh: 40, roadGap: big ? 80 : 56, forkGap: big ? 118 : 104, bodyLh: 50, shLh: big ? 50 : 46, statsGap: big ? 16 : 8, step: big ? 42 : 34 },
        { vF: big ? 58 : 52, vLh: big ? 70 : 60, stF: big ? 58 : 50, stLh: big ? 72 : 64, svF: 46, svLh: big ? 60 : 54, tagsLh: 36, roadGap: big ? 64 : 44, forkGap: big ? 100 : 88, bodyLh: 46, shLh: big ? 46 : 42, statsGap: big ? 14 : 8, step: big ? 38 : 32 },
        { vF: big ? 52 : 46, vLh: big ? 64 : 56, stF: big ? 52 : 44, stLh: big ? 70 : 62, svF: 42, svLh: big ? 56 : 50, tagsLh: 36, roadGap: big ? 56 : 40, forkGap: big ? 92 : 80, bodyLh: 44, shLh: big ? 44 : 40, statsGap: big ? 10 : 6, step: big ? 34 : 30 },
      ];
      const linesOf = (text, font) => { // 与 wrapText 逐字同口径，只数行数（wrapText 返回值 = 起点 + 行数 × 行距）
        x.font = font;
        let lines = 1, line = "";
        for (const ch of text) { if (x.measureText(line + ch).width > 900 && line) { lines++; line = ch; } else line += ch; }
        return lines;
      };
      const statsBottomFor = (P) => {
        let y;
        if (specialText) {
          y = titleY + tall * 0.4 + linesOf(specialText, P.stF + "px " + IFY.SERIF) * P.stLh;
          y += 6 + linesOf(v.text, P.svF + "px " + IFY.SERIF) * P.svLh;
        } else {
          y = titleY + tall * 0.4 + linesOf(v.text, P.vF + "px " + IFY.SERIF) * P.vLh;
        }
        y += 4 + linesOf(tagsText, "27px " + IFY.SANS) * P.tagsLh;
        y = y + P.roadGap + tall * 0.6 + P.forkGap;
        if (keyForkText) y += linesOf(keyForkText, "34px " + IFY.SANS) * P.bodyLh;
        y += 6 + linesOf(routeText, "34px " + IFY.SANS) * P.bodyLh;
        if (swapLine) y += 2 + linesOf(swapLine, "27px " + IFY.SANS) * 40;
        y += 6 + linesOf(shadowText, "34px " + IFY.SANS) * P.shLh;
        if (reflText) y += 10 + linesOf(reflText, "34px " + IFY.SERIF) * P.bodyLh;
        return y + P.statsGap + 5 * P.step + 6; // 六维条末行底（cardStats 末行条带下沿）
      };
      const STATS_LIMIT = H0 - 181; // 页脚钩子行基线 H0-140、墨迹顶实测约在基线上方 29；六维条末行底须在其上方再留 12
      let P = LADDER[LADDER.length - 1];
      for (const cand of LADDER) { if (statsBottomFor(cand) <= STATS_LIMIT) { P = cand; break; } }
      x.fillStyle = "#23211C";
      let y;
      if (IFY.S.special) {
        x.font = P.stF + "px " + IFY.SERIF;
        y = wrapText(x, specialText, 90, titleY + tall * 0.4, 900, P.stLh);
        x.font = P.svF + "px " + IFY.SERIF;
        y = wrapText(x, v.text, 90, y + 6, 900, P.svLh);
      } else {
        x.font = P.vF + "px " + IFY.SERIF;
        y = wrapText(x, v.text, 90, titleY + tall * 0.4, 900, P.vLh);
      }
      x.fillStyle = "#8A948C"; x.font = "27px " + IFY.SANS; // 事实标签行（v0.11.0，与结算页同一行）
      y = wrapText(x, tagsText, 90, y + 4, 900, P.tagsLh);
      const gy = y + P.roadGap + tall * 0.6;
      drawRoad(x, gy);
      x.font = "30px " + IFY.SERIF; x.fillStyle = "#8A948C";
      x.fillText("22 岁", 90, gy + 54); x.textAlign = "right"; x.fillText(end + " 岁", 990, gy + 54); x.textAlign = "left";
      y = gy + P.forkGap;
      x.fillStyle = "#23211C"; x.font = "34px " + IFY.SANS;
      if (keyForkText) y = wrapText(x, keyForkText, 90, y, 900, P.bodyLh);
      y = wrapText(x, routeText, 90, y + 6, 900, P.bodyLh);
      // v0.22 WP7：交换过的局，路线行后加小字一行（27px 灰，与事实标签行同档，不抢判词与路线行）
      if (swapLine) { x.fillStyle = "#8A948C"; x.font = "27px " + IFY.SANS; y = wrapText(x, swapLine, 90, y + 2, 900, 40); x.font = "34px " + IFY.SANS; }
      x.fillStyle = "#8A948C";
      y = wrapText(x, shadowText, 90, y + 6, 900, P.shLh);
      if (reflText) { x.fillStyle = "#2F4A3C"; x.font = "34px " + IFY.SERIF; y = wrapText(x, reflText, 90, y + 10, 900, P.bodyLh); }
      cardStats(x, y + P.statsGap, 560, P.step);
    }
    cardFooter(x, W, H0);
    drawQrBand(x, W, H0);
    return c;
  }

  // ---------- 存图共用出口（桌面下载 / 手机分享或长按保存） ----------
  // 手机浏览器（尤其微信内置）会拦 <a download>＋data URL 的程序化点击，点了没反应。
  // 桌面维持原下载法一字不变；手机先走 Web Share 带文件，不行就把图铺满屏让玩家长按保存。
  function isMobileSave() {
    try { if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) return true; } catch (e) { /* 判定失败按 UA 兜底 */ }
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
  }

  // 微信/QQ/LINE 这类 App 自带浏览器：页面没法自动跳去系统浏览器，只能给想出去的人指一句路
  function isInAppBrowser() {
    return /MicroMessenger|QQ\/|Line\//i.test(navigator.userAgent || "");
  }

  function desktopSaveImage(canvas, filename) {
    const a = document.createElement("a");
    a.download = filename;
    a.href = canvas.toDataURL("image/png");
    a.click();
  }

  let imgViewState = null; // { el, url }：图面层同时只许一层，重开先摘旧的
  function closeImageView() {
    if (!imgViewState) return;
    imgViewState.el.remove();
    if (imgViewState.url) URL.revokeObjectURL(imgViewState.url);
    imgViewState = null;
  }

  function showImageView(canvas, blob, filename) {
    closeImageView();
    const url = blob ? URL.createObjectURL(blob) : null;
    const el = document.createElement("div");
    el.className = "ify-imgview";
    el.innerHTML = `<div class="imgview-inner">
      <p class="imgview-note">图已经做好了。长按下面这张图，选『保存图片』，就能存进手机相册。</p>
      <p class="imgview-appnav" hidden>想在手机自带浏览器里打开的话，点右上角的菜单，选『在浏览器打开』。</p>
      <p class="imgview-fallback" hidden>这张图在你的浏览器里没打开出来。把这层关掉，回到刚才那一页截个屏，也能把这一生留下来。</p>
      <img class="imgview-img" alt="这一生的图">
      <div class="imgview-tools">
        <a class="imgview-dl">也可以点这里下载</a>
        <button type="button" class="imgview-close">关闭</button>
      </div>
    </div>`;
    const img = el.querySelector(".imgview-img");
    const dl = el.querySelector(".imgview-dl");
    dl.setAttribute("download", filename);
    el.querySelector(".imgview-appnav").hidden = !isInAppBrowser(); // 只在 App 自带浏览器里指路，普通浏览器不显示
    // 图源两级兜底：先 blob 地址；老内核（微信旧 X5 等）不认 blob 图时，加载出错或图宽为 0
    // 就自动换 data URL 再试一次；两个都不行才亮截屏提示行，不让玩家对着空白图。
    let onDataURL = !url;
    const imgFailed = () => {
      if (!onDataURL) {
        onDataURL = true;
        img.src = canvas.toDataURL("image/png");
        dl.href = img.src;
        return;
      }
      el.querySelector(".imgview-fallback").hidden = false;
    };
    img.addEventListener("error", imgFailed);
    img.addEventListener("load", () => { if (img.naturalWidth === 0) imgFailed(); });
    img.src = url || canvas.toDataURL("image/png"); // toBlob 拿不到 blob 时直接用 data URL
    dl.href = img.src;
    el.querySelector(".imgview-close").addEventListener("click", closeImageView);
    document.body.appendChild(el);
    imgViewState = { el, url };
  }

  async function saveCanvasImage(canvas, filename) {
    if (!canvas) return;
    if (!isMobileSave()) { desktopSaveImage(canvas, filename); return; }
    let blob = null;
    try { blob = await new Promise((res) => canvas.toBlob(res, "image/png")); } catch (e) { blob = null; }
    if (blob && navigator.canShare && navigator.share) {
      try {
        const file = new File([blob], filename, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file] });
          return; // 分享成功就结束
        }
      } catch (e) {
        if (e && e.name === "AbortError") return; // 玩家自己取消了分享，不再打扰
      }
    }
    showImageView(canvas, blob, filename); // 分享走不通：铺图让玩家长按保存
  }

  function downloadCurrent() {
    if (!IFY.currentCanvas) return;
    saveCanvasImage(IFY.currentCanvas, "if-that-year-" + IFY.S.seedStr + ".png");
  }
  Object.assign(IFY, { wrapText, sameSeedUrl, cardReflText, shareCopy, fitText, cardBase, cardFooter, cardStats, drawRoad,
    parseLog, logNodes, logHighlights, buildCard, downloadCurrent, saveCanvasImage, drawShareQr, drawShareQrGuide });
})(window.IFY);
