/* 《如果那年》数据监视（CL-144）——旧埋点（src/analytics.js → /api/collect）之外的第二条路：
   完局（run_end）、客户端报错（client_error），以及旧路全部事件种类的镜像（包一层
   GAME_ANALYTICS.track，种类与字段与旧路逐项对位），一并投 somme-commons 的 events 表。
   口径照共用规矩「坏了也不碍事」：全异步、失败静默、不重试（页面关闭时未落定补发一次
   除外）、不弹窗、不阻塞任何游戏流程；每处入口全包 try/catch，模块故障绝不冒泡进游戏。
   payload 只放匿名对局数据与报错三元组：无 IP、无 UA 全文（只落 mobile/desktop 判型
   结果）、无 vid（与旧路刻意区隔）、无玩家输入原文。模块不调任何随机函数、不写存档、
   不改 DOM，不碰游戏随机流；全部游戏状态都懒到调用/观测时刻才读，加载期不碰 IFY。 */
(function () {
  "use strict";
  // CL-144：监视投稿目标——Somme 共用反馈库 somme-commons（Supabase 独立项目，各小项目
  // 一个自己的 schema：本站写 if_that_year_cn.events，RLS 只插不读；投稿时以
  // Content-Profile 头点名 schema，schema 本身就是项目身份，提交体不带 project 字段）。
  // MONITOR_KEY 是 publishable 公钥：设计上公开、各站前端明文用，不是秘密；写权限由
  // 表上的 RLS 插入策略把着（只能投、读不回）。与 CL-143 的 FEEDBACK_API/FEEDBACK_KEY
  // 同一出处（同项目、同公钥同值），集成时由总指挥归并。
  var MONITOR_API = "https://wzikzrunjfideycabajc.supabase.co/rest/v1/events";
  var MONITOR_KEY = "sb_publishable_NLlQz1wbGZKOOq0uX8ooYg_o_m8aiYf";
  var MONITOR_PROFILE = "if_that_year_cn";
  var loadT = Date.now();

  // 版本号不写死，从页脚版本小字里读（与 CL-141/143 的 gameVersion 同读法：页脚是全站
  // 唯一版本出处，升版改 index.html 时自动跟着走）。
  function gameVersion() {
    try { var f = document.querySelector(".foot"); var m = f && f.textContent.match(/v\d+\.\d+\.\d+/); return m ? m[0] : ""; } catch (e) { return ""; }
  }
  function uaClass() {
    try { return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || "") ? "mobile" : "desktop"; } catch (e) { return "desktop"; }
  }
  // 发送法选 fetch(keepalive)，不用 sendBeacon：Supabase REST 必须带 apikey /
  // Content-Profile 自定义头，sendBeacon 设不了头——此为等价法。返回的 Promise 恒
  // resolve 布尔（成/败），永不 reject，调用方不必接异常。
  function send(kind, payload) {
    try {
      if (typeof fetch !== "function") return Promise.resolve(false);
      return fetch(MONITOR_API, {
        method: "POST",
        headers: { apikey: MONITOR_KEY, Authorization: "Bearer " + MONITOR_KEY, "Content-Type": "application/json", "Content-Profile": MONITOR_PROFILE, Prefer: "return=minimal" },
        body: JSON.stringify({ kind: kind, version: gameVersion(), payload: payload }),
        keepalive: true
      }).then(function (r) { return !!(r && r.ok); }, function () { return false; });
    } catch (e) { return Promise.resolve(false); }
  }

  // ---- 全量镜像（用户加严口径：旧路每种事件都对应投一份进 events，Supabase 侧自此
  // 是旧路的完整镜像）：给 GAME_ANALYTICS.track 包一层——先原样调旧 track（旧路行为
  // 一字不变），再按白名单把 (name, props) 投出。白名单与 collect.js 的 ALLOWED_FIELDS
  // 逐字对齐（客户端先清一遍，与收集端双保险同构）；盘点表外的 kind 不投。旧路的
  // 通用字段 vid 是 analytics 在其内部队列组装时才追加的、从不经过 props——镜像在
  // track 接缝取数天然碰不到它，正合新路红线（不放任何可关联人的编号）；at 与服务端
  // created_at 重叠，同样不带。部署方关了旧埋点（enabled 非 true）时镜像跟着关。
  var MIRROR_FIELDS = {
    game_start: ["era", "route"], card_pick: ["cat", "pick", "changed"],
    glimpse: ["age", "seen"], game_complete: ["era", "route", "endAge", "death", "ending", "tier"],
    share_click: ["action"], lives_view: [], visit: ["ref"], prologue_done: ["era"],
    retire_reached: ["era", "route", "age"], keepsake_open: ["state"], keepsake_preview: [],
    buy_click: [], code_verify: ["ok"], keepsake_export: ["kind"], gift_claim: ["ok"]
  };
  function mirror(name, props) {
    try {
      var A = window.GAME_ANALYTICS;
      if (!A || A.enabled !== true) return;
      var fields = MIRROR_FIELDS[name];
      if (!fields) return;
      var payload = {};
      if (props) for (var i = 0; i < fields.length; i++) { var k = fields[i]; if (Object.prototype.hasOwnProperty.call(props, k)) payload[k] = props[k]; }
      send(name, payload);
    } catch (e) {}
  }
  function installMirror() {
    try {
      var A = window.GAME_ANALYTICS;
      if (!A || typeof A.track !== "function" || A.__cl144Mirror) return;
      var orig = A.track;
      A.track = function (name, props) { var r = orig.apply(this, arguments); mirror(name, props); return r; };
      A.__cl144Mirror = true;
    } catch (e) {}
  }
  // visit 补投：visit 由 analytics 在自身求值期就发出（早于上面的包层），故单独补——
  // 旧路会话旗 ify-ana-visit 在、镜像旗 ify-mon-visit 未落时，按 analytics 同口径算
  // ref（referrer 只取 hostname，本站 internal、无来源 direct）补投一发，每会话恰一次。
  function mirrorVisit() {
    try {
      var A = window.GAME_ANALYTICS;
      if (!A || A.enabled !== true) return;
      var anaSeen = false, monSeen = false;
      try {
        anaSeen = !!window.sessionStorage.getItem("ify-ana-visit");
        monSeen = !!window.sessionStorage.getItem("ify-mon-visit");
      } catch (e) { anaSeen = true; /* 存储不可用：退化为每页加载至多一次（与旧路退化同形） */ }
      if (!anaSeen || monSeen) return;
      try { window.sessionStorage.setItem("ify-mon-visit", "1"); } catch (e) {}
      var ref = "direct";
      try {
        var r = document.referrer || "";
        if (r) { var h = new URL(r).hostname; ref = h ? (h === window.location.hostname ? "internal" : h) : "direct"; }
      } catch (e) {}
      send("visit", { ref: ref });
    } catch (e) {}
  }

  // ---- 局界观测（被动）：1 秒节拍只读 IFY.S.seedStr，新种子首次出现即打局开始戳，
  // 供 durationSec 近似与 client_error 的本局去重重置。只读、不调游戏任何函数。
  var curSeed = null, runStartT = 0;
  var seenMsgs = {}, errCount = 0, ERR_MAX = 3;
  function observe() {
    try {
      var S = window.IFY && window.IFY.S;
      var seed = S && S.seedStr;
      if (seed && seed !== curSeed) {
        curSeed = seed; runStartT = Date.now();
        seenMsgs = {}; errCount = 0; // 新局：报错去重集与计数重置（本局口径）
      }
    } catch (e) {}
  }
  setInterval(observe, 1000);
  observe();

  // ---- run_end：结算入口挂点（settlement.js renderEnd，与 game_complete 同刻同守卫）调
  // IFY_MONITOR.runEnd()，无参自取终局状态（此刻 S.special / S._verdict 均已落定）。
  var sentKey = null, pendingPayload = null, acked = true, resendUsed = false;
  function runEnd() {
    try {
      var IFY = window.IFY;
      if (!IFY || !IFY.S) return;
      var S = IFY.S;
      var endAge = typeof IFY.finalAge === "function" ? IFY.finalAge() : S.age;
      var runKey = String(S.seedStr || "") + "#" + endAge;
      if (runKey === sentKey) return; // 本局只发一次
      var sp = S.special || null;
      var st = S.stats || {};
      var payload = {
        seed: S.seedStr || "",
        eraId: S.era || "",
        birthYear: typeof S.birthYear === "number" ? S.birthYear : null,
        route: S.route ? (S.route.name || S.route.id || "") : "",
        endingId: sp && sp.id ? sp.id : "verdict:" + ((S._verdict && S._verdict.tone) || "prose"),
        endAge: endAge,
        stats: { health: st.health, money: st.money, growth: st.growth, freedom: st.freedom, relation: st.relation, wisdom: st.wisdom },
        durationSec: Math.max(0, Math.round((Date.now() - (runStartT || loadT)) / 1000)),
        shadowSeen: (S.glimpsesSeen || 0) > 0,
        ua: uaClass(),
        runKey: runKey // 分析侧去重键（补发残余窗口撞车时按此剔重）
      };
      sentKey = runKey; pendingPayload = payload; acked = false; resendUsed = false;
      send("run_end", payload).then(function (ok) { if (ok) { acked = true; pendingPayload = null; } });
    } catch (e) {}
  }
  // 页面关闭路径补发：run_end 已调但未落定确认时，隐藏/关闭再补一次（补后即置 ack，
  // visibilitychange 与 pagehide 双触发也只补一发）。首发本身带 keepalive、由浏览器
  // 保证送出，补发只兜「结算时断网、关闭前恢复」这类缝。
  function flushPending() {
    try {
      if (pendingPayload && !acked && !resendUsed) {
        resendUsed = true; acked = true;
        var p = pendingPayload; pendingPayload = null;
        send("run_end", p);
      }
    } catch (e) {}
  }
  if (typeof document !== "undefined") document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") flushPending(); });
  if (typeof window !== "undefined") window.addEventListener("pagehide", flushPending);

  // ---- client_error：脚本运行时错误与未处理拒绝。同一 message 本局只报一次、本局
  // 最多 3 条；资源加载错误（无 message 的 error 事件）不收。
  function phase() {
    try {
      var IFY = window.IFY;
      if (IFY && IFY.curKind === "end") return "settlement";
      if (IFY && IFY.S) return "playing";
    } catch (e) {}
    return "start";
  }
  function reportError(message, source, line) {
    try {
      message = String(message == null ? "" : message).slice(0, 300);
      if (!message || seenMsgs[message] || errCount >= ERR_MAX) return;
      seenMsgs[message] = 1; errCount += 1;
      var src = "";
      if (source) { src = String(source).split("?")[0].split("#")[0]; src = src.substring(src.lastIndexOf("/") + 1); }
      send("client_error", { message: message, source: src, line: typeof line === "number" ? line : null, phase: phase(), ua: uaClass() });
    } catch (e) {}
  }
  if (typeof window !== "undefined") {
    window.addEventListener("error", function (ev) { if (ev && ev.message) reportError(ev.message, ev.filename, ev.lineno); });
    window.addEventListener("unhandledrejection", function (ev) {
      var r = ev && ev.reason;
      reportError(r && r.message ? r.message : String(r || "unhandledrejection"), "", null);
    });
    installMirror();
    mirrorVisit();
    window.IFY_MONITOR = { runEnd: runEnd };
  }
})();
