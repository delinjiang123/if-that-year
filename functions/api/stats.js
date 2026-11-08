// 《如果那年》匿名埋点汇总台（AE 迁移批）——同源 Pages Function，路径 /api/stats。
// 用法：GET /api/stats?key=<密钥>&days=<1..31>（days 默认 7，上限 31）。
// 密钥读 env.ANALYTICS_STATS_KEY：未设置返回 503（与 gift / verify-code 未配置同形），不匹配返回 403。
// 数据源：Analytics Engine（数据集 ify_events，与 collect.js 的 IFY_AE 绑定同一数据集），
// 经 SQL API 读取（env.CF_ACCOUNT_ID / env.CF_API_TOKEN，任一缺失返回 503）。
// 聚合全部在 SQL 里完成（collect.js 的固定列位：index1=事件名，blob1=vid、blob2=era、
// blob3=route、blob4=ending、blob5=tier、blob6=action，double1=endAge/age、double2=ok），
// 本端点只拼计数与分布——绝不输出任何单个事件，绝不输出 vid 原值（按 vid 的统计一律
// 用子查询在 SQL 内数完，只回计数）。
// 降级口径：回访/人均局数两条子查询若被平台拒绝，只降这两项（回 null 并在 notes 里注明），
// 其余查询照常出数，不整端 502；只有前面的基础查询失败才整端 502。

const MAX_DAYS = 31;
const DATASET = "ify_events";

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
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

function rowsToDist(rows, keyField) {
  const dist = {};
  for (const row of rows || []) {
    const k = row[keyField];
    if (k === null || k === undefined || k === "") continue;
    dist[String(k)] = (dist[String(k)] || 0) + Number(row.n || 0);
  }
  return dist;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const secret = env && env.ANALYTICS_STATS_KEY;
  if (!secret) return json({ ok: false, reason: "unconfigured" }, 503);
  if (url.searchParams.get("key") !== secret) return json({ ok: false, reason: "forbidden" }, 403);

  const accountId = env && env.CF_ACCOUNT_ID;
  const apiToken = env && env.CF_API_TOKEN;
  if (!accountId || !apiToken) return json({ ok: false, reason: "unconfigured" }, 503);

  let days = parseInt(url.searchParams.get("days") || "7", 10);
  if (!Number.isFinite(days) || days < 1) days = 7;
  if (days > MAX_DAYS) days = MAX_DAYS;

  // 区间：今天（UTC）往前共 days 天。SQL 区间为 [from 00:00, to+1天 00:00)。
  const dates = [];
  const nowMs = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    dates.push(new Date(nowMs - i * 86400000).toISOString().slice(0, 10));
  }
  const from = dates[0];
  const to = dates[dates.length - 1];
  const fromTs = `${from} 00:00:00`;
  const toTs = `${new Date(Date.parse(from) + days * 86400000).toISOString().slice(0, 10)} 00:00:00`;
  const range = `timestamp >= toDateTime('${fromTs}') AND timestamp < toDateTime('${toTs}')`;

  async function runSql(sql) {
    const r = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "text/plain; charset=utf-8",
        },
        body: sql,
      }
    );
    let payload = null;
    try { payload = await r.json(); } catch { /* 下面统一按失败处理 */ }
    if (!r.ok || !payload || !Array.isArray(payload.data)) {
      const detail =
        (payload && payload.errors && payload.errors[0] && payload.errors[0].message) ||
        `HTTP ${r.status}`;
      throw new Error(String(detail).slice(0, 200));
    }
    return payload.data;
  }

  let totals, startEra, startRoute, compEra, compRoute, compEnding, compTier, compAgeBand;
  let shareAction, codeVerifyOk, giftClaimOk;
  let distinctVisitors, visitorsByDay, returning, startsPerVisitor;
  let visitorDetailOk = true;
  try {
    // 每事件总数
    totals = rowsToDist(
      await runSql(`SELECT index1 AS k, count() AS n FROM ${DATASET} WHERE ${range} GROUP BY index1`),
      "k"
    );
    // game_start 分布（列位见文件头注释）
    const gs = `index1 = 'game_start'`;
    startEra = rowsToDist(
      await runSql(`SELECT blob2 AS k, count() AS n FROM ${DATASET} WHERE ${range} AND ${gs} AND blob2 != '' GROUP BY blob2`),
      "k"
    );
    startRoute = rowsToDist(
      await runSql(`SELECT blob3 AS k, count() AS n FROM ${DATASET} WHERE ${range} AND ${gs} AND blob3 != '' GROUP BY blob3`),
      "k"
    );
    // game_complete 分布与终龄分段（double1 先按原值分组，分段在本文件里做，不在 SQL 里写 CASE）
    const gc = `index1 = 'game_complete'`;
    compEra = rowsToDist(
      await runSql(`SELECT blob2 AS k, count() AS n FROM ${DATASET} WHERE ${range} AND ${gc} AND blob2 != '' GROUP BY blob2`),
      "k"
    );
    compRoute = rowsToDist(
      await runSql(`SELECT blob3 AS k, count() AS n FROM ${DATASET} WHERE ${range} AND ${gc} AND blob3 != '' GROUP BY blob3`),
      "k"
    );
    compEnding = rowsToDist(
      await runSql(`SELECT blob4 AS k, count() AS n FROM ${DATASET} WHERE ${range} AND ${gc} AND blob4 != '' GROUP BY blob4`),
      "k"
    );
    compTier = rowsToDist(
      await runSql(`SELECT blob5 AS k, count() AS n FROM ${DATASET} WHERE ${range} AND ${gc} AND blob5 != '' GROUP BY blob5`),
      "k"
    );
    compAgeBand = {};
    const ageRows = await runSql(
      `SELECT double1 AS age, count() AS n FROM ${DATASET} WHERE ${range} AND ${gc} GROUP BY double1`
    );
    for (const row of ageRows) {
      const band = endAgeBand(Number(row.age));
      if (band) compAgeBand[band] = (compAgeBand[band] || 0) + Number(row.n || 0);
    }
    // share_click 的 action 分布（blob6）
    shareAction = rowsToDist(
      await runSql(`SELECT blob6 AS k, count() AS n FROM ${DATASET} WHERE ${range} AND index1 = 'share_click' AND blob6 != '' GROUP BY blob6`),
      "k"
    );
    // 漏斗成功数：只算对应事件的 sum(double2)（ok 的 0/1 编码）
    const okRows = await runSql(
      `SELECT index1 AS k, sum(double2) AS v FROM ${DATASET} WHERE ${range} AND index1 IN ('code_verify', 'gift_claim') GROUP BY index1`
    );
    codeVerifyOk = 0;
    giftClaimOk = 0;
    for (const row of okRows) {
      if (row.k === "code_verify") codeVerifyOk = Number(row.v || 0);
      if (row.k === "gift_claim") giftClaimOk = Number(row.v || 0);
    }
    // 访客聚合（vid = blob1，空串排除；原值不出 SQL，只回计数）
    const distinctRows = await runSql(
      `SELECT uniq(blob1) AS n FROM ${DATASET} WHERE ${range} AND blob1 != ''`
    );
    distinctVisitors = distinctRows.length ? Number(distinctRows[0].n || 0) : 0;
    visitorsByDay = {};
    const dayRows = await runSql(
      `SELECT toDate(timestamp) AS day, uniq(blob1) AS n FROM ${DATASET} WHERE ${range} AND blob1 != '' GROUP BY day`
    );
    for (const row of dayRows) {
      if (row.day) visitorsByDay[String(row.day)] = Number(row.n || 0);
    }
    // 回访（≥2 个不同日期出现过的 vid 数）与人均局数：按 vid 分组再聚合的子查询，
    // 使 vid 原值始终留在 SQL 内部。子查询形状待线上实证（见 docs/ANALYTICS.md）；
    // 这两条单独兜底：被平台拒绝时只降这两项，不拖垮整端（见文件头降级口径）。
    try {
      const retRows = await runSql(
        `SELECT count() AS n FROM (SELECT blob1 FROM ${DATASET} WHERE ${range} AND blob1 != '' GROUP BY blob1 HAVING uniq(toDate(timestamp)) >= 2)`
      );
      returning = retRows.length ? Number(retRows[0].n || 0) : 0;
      startsPerVisitor = { "1": 0, "2": 0, "3+": 0 };
      const startRows = await runSql(
        `SELECT starts AS s, count() AS n FROM (SELECT blob1, count() AS starts FROM ${DATASET} WHERE ${range} AND blob1 != '' AND ${gs} GROUP BY blob1) GROUP BY starts`
      );
      for (const row of startRows) {
        const s = Number(row.s);
        const band = s === 1 ? "1" : s === 2 ? "2" : s >= 3 ? "3+" : null;
        if (band) startsPerVisitor[band] += Number(row.n || 0);
      }
    } catch (e2) {
      visitorDetailOk = false;
      returning = null;
      startsPerVisitor = null;
    }
  } catch (e) {
    return json({ ok: false, reason: "ae_query_failed", detail: String((e && e.message) || e).slice(0, 200) }, 502);
  }

  const starts = totals.game_start || 0;
  const completes = totals.game_complete || 0;
  const shares = totals.share_click || 0;

  return json({
    ok: true,
    days,
    from,
    to,
    source: "analytics_engine",
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
      distinct: distinctVisitors,
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
      "数据来自 Analytics Engine，平台在高量时可能采样，当前量级为全量。",
      ...(visitorDetailOk ? [] : ["回访人数与人均局数两项这次没查出来（子查询被平台拒绝，两项为 null），其余数字不受影响。"]),
    ],
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
