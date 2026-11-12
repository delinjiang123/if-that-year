/* 《如果那年》匿名埋点模块（v0.13.1）——默认关闭。事件表、开关方法与隐私口径见 docs/ANALYTICS.md。
   关闭时零网络、零行为变化：track() 立即返回，不入队、不读游戏状态、不碰主 RNG、不写任何存档。
   开启方式：部署方在加载本文件之前设置 window.IFY_ANALYTICS = { enabled: true, endpoint: "https://…" }；
   发送实现可插拔（cfg.send(endpoint, bodyString)），缺省走 navigator.sendBeacon、回落 fetch(keepalive)。
   收集口径：只有事件名与游戏内分类字段（年代/路线/年龄/结局类别），无种子原文、无玩家输入。
   统计升级批（2026-11-08）：开启时另生成一个随机访客编号 vid（crypto.randomUUID，存 localStorage
   键 ify_vid，与游戏存档完全无关），随每个事件附带——只用来在汇总时数「有多少个人、回没回访」。
   vid 是纯随机数：不采集任何设备信号拼指纹（不读 UA/屏幕/时区），永不与兑换码、订单或任何
   账户信息关联，也永不出现在任何玩家可见输出里。关闭时不生成、不读取。 */
(function () {
  "use strict";
  var cfg = (typeof window !== "undefined" && window.IFY_ANALYTICS) || {};
  var enabled = cfg.enabled === true && typeof cfg.endpoint === "string" && cfg.endpoint.length > 0;
  var queue = [];
  var FLUSH_N = 10; // 攒满 10 条批量发送一次；页面隐藏时也会冲刷

  function send(batch) {
    if (!enabled || !batch.length) return;
    var body = JSON.stringify({ v: 1, sentAt: new Date().toISOString(), events: batch });
    try {
      if (typeof cfg.send === "function") { cfg.send(cfg.endpoint, body); return; } // 可插拔发送实现（如自建收集端）
      if (typeof navigator !== "undefined" && navigator.sendBeacon && navigator.sendBeacon(cfg.endpoint, body)) return;
      fetch(cfg.endpoint, { method: "POST", body: body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(function () {});
    } catch (e) { /* 埋点失败绝不影响游戏 */ }
  }
  function flush() { if (queue.length) { var b = queue; queue = []; send(b); } }

  // 匿名访客编号 vid（统计升级批）：首次 track 时生成并存 localStorage（键 ify_vid）。
  // 存储不可用时退化为内存编号（本页内一致，关页即弃）。生成只用 crypto 随机源，
  // 不读任何设备信号——它是一个随机编号，不是指纹。
  var vidCache = null;
  function getVid() {
    if (vidCache) return vidCache;
    try { vidCache = window.localStorage.getItem("ify_vid") || null; } catch (e) {}
    if (!vidCache) {
      try { vidCache = (window.crypto && typeof crypto.randomUUID === "function") ? crypto.randomUUID() : ""; } catch (e) { vidCache = ""; }
      if (!vidCache) vidCache = "v" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      try { window.localStorage.setItem("ify_vid", vidCache); } catch (e) {}
    }
    return vidCache;
  }
  var api = {
    enabled: enabled,
    track: function (name, props) {
      if (!enabled) return; // 关闭即无操作
      var ev = { name: name, at: new Date().toISOString() };
      if (props) for (var k in props) ev[k] = props[k];
      ev.vid = getVid(); // 通用字段最后落，调用方 props 不许覆盖
      queue.push(ev);
      if (queue.length >= FLUSH_N) flush();
    },
    flush: flush
  };
  // visit（统计升级批，2026-11-08）：页面加载时每会话报一次到达。
  // 会话判定只用 sessionStorage 的一个本地标志位：标志本身不发送、不含任何编号，
  // 关页即随会话消失——它不是访客标识，跨会话无法关联同一个人（本项目不做访客标识）。
  // ref 只取 document.referrer 的 hostname：无来源记 "direct"，本站记 "internal"；
  // 完整 URL 绝不发送（路径与查询串可能含同局种子链接）。
  var VISIT_FLAG = "ify-ana-visit";
  function refHost() {
    try {
      var r = document.referrer || "";
      if (!r) return "direct";
      var h = new URL(r).hostname;
      if (!h) return "direct";
      return h === window.location.hostname ? "internal" : h;
    } catch (e) { return "direct"; }
  }
  function trackVisitOnce() {
    var seen = false;
    try { seen = !!window.sessionStorage.getItem(VISIT_FLAG); } catch (e) { /* 存储不可用时退化为每页加载一次 */ }
    if (seen) return;
    try { window.sessionStorage.setItem(VISIT_FLAG, "1"); } catch (e) {}
    api.track("visit", { ref: refHost() });
  }
  if (typeof window !== "undefined") {
    window.GAME_ANALYTICS = api;
    if (enabled) {
      window.addEventListener("pagehide", flush);
      document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") flush(); });
      trackVisitOnce();
    }
  }
})();
