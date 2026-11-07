// 《如果那年》匿名埋点汇总台（统计升级批，2026-11-08）——同源 Pages Function，路径 /api/stats。
// 用法：GET /api/stats?key=<密钥>&days=<1..31>（days 默认 7，上限 31）。
// 密钥读 env.ANALYTICS_STATS_KEY：未设置返回 503（与 gift / verify-code 未配置同形），不匹配返回 403。
// 数据读与 collect.js 同一个 IFY_ANALYTICS_KV 绑定（未绑定返回 503）：按 UTC 日期前缀 list + get，
// 解析 JSONL 后只在内存里聚合，只输出计数与分布——绝不输出任何单个事件，绝不输出 vid 原值
// （vid 只在内存里做 distinct 计数，数完即弃）。
// 量级上限（按小站设计，明写在此）：最多读 MAX_KEYS 个 KV 键、MAX_EVENTS 条事件，
// 超出即停止读取并在返回的 truncated 字段注明——宁可少算，不可无界扫库。

const MAX_DAYS = 31;
const MAX_KEYS = 2000; // 单次汇总最多读的 KV 键数（一键 = 一批事件的 JSONL）
const MAX_EVENTS = 50000; // 单次汇总最多聚合的事件条数
const LIST_PAGE = 1000; // KV list 单页键数上限（平台上限即 1000）

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function bump(obj, key) {
  if (key === null || key === undefined || key === "") return;
  const k = String(key);
  obj[k] = (obj[k] || 0) + 1;
}

function endAgeBand(age) {
  if (typeof age !== "number" || !Number.isFinite(age)) return null;
  if (age < 50) return "<50";
  if (age < 60) return "50s";
  if (age < 70) return "60s";
  if (age < 80) return "70s";
  return "80+";
}

function ratio(a, b) {
  if (!b) return null;
  return Math.round((a / b) * 10000) / 10000;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const secret = env && env.ANALYTICS_STATS_KEY;
  if (!secret) return json({ ok: false, reason: "unconfigured" }, 503);
  if (url.searchParams.get("key") !== secret) return json({ ok: false, reason: "forbidden" }, 403);

  const kv = env && env.IFY_ANALYTICS_KV;
  if (!kv) return json({ ok: false, reason: "unconfigured" }, 503);

  let days = parseInt(url.searchParams.get("days") || "7", 10);
  if (!Number.isFinite(days) || days < 1) days = 7;
  if (days > MAX_DAYS) days = MAX_DAYS;

  // 区间：今天（UTC）往前共 days 天，按日期从旧到新。
  const dates = [];
  const nowMs = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    dates.push(new Date(nowMs - i * 86400000).toISOString().slice(0, 10));
  }

  const totals = {};
  const startEra = {}, startRoute = {};
  const compEra = {}, compRoute = {}, compEnding = {}, compTier = {}, compAgeBand = {};
  const shareAction = {};
  let codeVerifyOk = 0, giftClaimOk = 0;
  const vidDays = new Map(); // vid -> Set(日期)：只在内存里活这一次请求
  const vidStarts = new Map(); // vid -> game_start 次数
  let keysRead = 0, eventsRead = 0, truncated = false;

  outer:
  for (const day of dates) {
    let cursor;
    do {
      let page;
      try {
        page = await kv.list({ prefix: day + "/", cursor, limit: LIST_PAGE });
      } catch {
        break; // 读不到就按已读部分出汇总，不让汇总台自己 500
      }
      for (const k of page.keys || []) {
        if (keysRead >= MAX_KEYS || eventsRead >= MAX_EVENTS) { truncated = true; break outer; }
        keysRead++;
        let text;
        try { text = await kv.get(k.name); } catch { continue; }
        if (!text) continue;
        for (const line of text.split("\n")) {
          if (!line.trim()) continue;
          if (eventsRead >= MAX_EVENTS) { truncated = true; break outer; }
          let ev;
          try { ev = JSON.parse(line); } catch { continue; }
          if (!ev || typeof ev.name !== "string") continue;
          eventsRead++;
          bump(totals, ev.name);
          if (ev.name === "game_start") {
            bump(startEra, ev.era); bump(startRoute, ev.route);
          } else if (ev.name === "game_complete") {
            bump(compEra, ev.era); bump(compRoute, ev.route);
            bump(compEnding, ev.ending); bump(compTier, ev.tier);
            bump(compAgeBand, endAgeBand(ev.endAge));
          } else if (ev.name === "share_click") {
            bump(shareAction, ev.action);
          } else if (ev.name === "code_verify") {
            if (ev.ok === true) codeVerifyOk++;
          } else if (ev.name === "gift_claim") {
            if (ev.ok === true) giftClaimOk++;
          }
          if (typeof ev.vid === "string" && ev.vid) {
            if (!vidDays.has(ev.vid)) vidDays.set(ev.vid, new Set());
            vidDays.get(ev.vid).add(day);
            if (ev.name === "game_start") vidStarts.set(ev.vid, (vidStarts.get(ev.vid) || 0) + 1);
          }
        }
      }
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
  }

  // 访客聚合（vid 只计数，不出原值）
  const visitorsByDay = {};
  let returning = 0;
  for (const daySet of vidDays.values()) {
    if (daySet.size >= 2) returning++;
    for (const d of daySet) bump(visitorsByDay, d);
  }
  const startsPerVisitor = { "1": 0, "2": 0, "3+": 0 };
  for (const n of vidStarts.values()) {
    if (n === 1) startsPerVisitor["1"]++;
    else if (n === 2) startsPerVisitor["2"]++;
    else if (n >= 3) startsPerVisitor["3+"]++;
  }

  const starts = totals.game_start || 0;
  const completes = totals.game_complete || 0;
  const shares = totals.share_click || 0;

  return json({
    ok: true,
    days,
    from: dates[0],
    to: dates[dates.length - 1],
    totals,
    game_start: { era: startEra, route: startRoute },
    game_complete: { era: compEra, route: compRoute, ending: compEnding, tier: compTier, endAgeBand: compAgeBand },
    share_click: { action: shareAction },
    keepsake_funnel: {
      open: totals.keepsake_open || 0,
      preview: totals.keepsake_preview || 0,
      buy_click: totals.buy_click || 0,
      code_verify_ok: codeVerifyOk,
      gift_claim_ok: giftClaimOk,
    },
    visitors: {
      distinct: vidDays.size,
      byDay: visitorsByDay,
      returning,
      startsPerVisitor,
    },
    rates: {
      completion: ratio(completes, starts), // 完局率 = game_complete ÷ game_start
      share_per_complete: ratio(shares, completes), // 分享率（近似）= share_click 总数 ÷ game_complete；事件级计数，一局可多次分享，非按局去重
    },
    notes: [
      "share_per_complete 是事件级近似：share_click 按点击次数计，一局可能多次分享，未按局去重。",
      "visitors 只统计带 vid 的事件（统计升级上线前的旧事件无 vid，不计入访客数）。",
      "endAgeBand 分段：<50 / 50s / 60s / 70s / 80+。",
    ],
    keysRead,
    eventsRead,
    truncated,
  });
}

export async function onRequestPost() {
  return new Response(null, { status: 405, headers: { Allow: "GET" } });
}
export async function onRequestPut() {
  return new Response(null, { status: 405, headers: { Allow: "GET" } });
}
export async function onRequestPatch() {
  return new Response(null, { status: 405, headers: { Allow: "GET" } });
}
export async function onRequestDelete() {
  return new Response(null, { status: 405, headers: { Allow: "GET" } });
}
export async function onRequestHead() {
  return new Response(null, { status: 405, headers: { Allow: "GET" } });
}
export async function onRequestOptions() {
  return new Response(null, { status: 405, headers: { Allow: "GET" } });
}
