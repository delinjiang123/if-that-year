// 《如果那年》人生纪录典藏 · 输码核验端点（v0.33.0）——同源 Pages Function，路径 /api/verify-code。
// 游戏结算页「用码解锁」与领码页回跳自动解锁都走这里。语义：
//   码在池中（unused/issued）→ 首次核验即激活，记 activatedAt，返回 {ok:true, state:"activated"}；
//   已激活码再核验 = 换设备恢复，照样通过并计数留痕 {ok:true, state:"restored"}；
//   激活次数异常多（≥10）→ 标 flagged 并往 verifylog 留一行报警式记录（人工回看），不拦人；
//   查无此码/码形不对 → {ok:false, reason:"not_found"}，并计入该 IP 的失败限速
//   （600 秒内失败 ≥8 次 → 429 rate_limited；成功的核验不计数）。
// 绑定：IFY_CODES_KV（与 claim 共用码池）。

import { normalizeCode, validCodeShape, readCode, writeCode } from "./_codelib.js";

const RL_WINDOW_SEC = 600;
const RL_MAX_FAILS = 8;
const FLAG_ACTIVATIONS = 10;

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const kv = env && env.IFY_CODES_KV;
  if (!kv) return json({ ok: false, reason: "unconfigured" }, 503);

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const rlKey = `rl:${ip}`;
  let fails = 0;
  try {
    const raw = await kv.get(rlKey);
    if (raw) fails = (JSON.parse(raw).fails | 0) || 0;
  } catch (e) {}
  if (fails >= RL_MAX_FAILS) return json({ ok: false, reason: "rate_limited" }, 429);

  let body = null;
  try { body = await request.json(); } catch (e) {}
  const c12 = normalizeCode(body && body.code);

  async function fail(reason, status) {
    try { await kv.put(rlKey, JSON.stringify({ fails: fails + 1 }), { expirationTtl: RL_WINDOW_SEC }); } catch (e) {}
    return json({ ok: false, reason }, status || 200);
  }

  if (!validCodeShape(c12)) return fail("not_found");
  const rec = await readCode(kv, c12);
  if (!rec) return fail("not_found");

  const now = new Date().toISOString();
  if (rec.status === "unused" || rec.status === "issued") {
    await writeCode(kv, c12, { ...rec, status: "activated", activatedAt: now, activations: 1 });
    return json({ ok: true, state: "activated" });
  }
  if (rec.status === "activated") {
    const activations = (rec.activations | 0) + 1;
    const flagged = activations >= FLAG_ACTIVATIONS;
    const next = { ...rec, activations };
    if (flagged && !rec.flagged) next.flagged = true;
    await writeCode(kv, c12, next);
    if (flagged) {
      try {
        const day = now.slice(0, 10);
        const logKey = `verifylog:${day}`;
        const prev = (await kv.get(logKey)) || "";
        const line = JSON.stringify({ at: now, code: c12, activations, ip, note: "激活次数异常多，人工回看" });
        await kv.put(logKey, prev + line + "\n");
      } catch (e) {}
    }
    return json({ ok: true, state: "restored" });
  }
  return fail("not_found");
}

export async function onRequestGet() {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}
