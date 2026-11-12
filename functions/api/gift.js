// 《如果那年》人生纪录典藏 · 赠予端点（圆桌决议 S3）——同源 Pages Function，路径 /api/gift。
// 玩家解锁后，用自己那枚已激活的码领一枚赠予码，送给一个人：
//   POST {code: 玩家自己的码} → 校验该码确为 activated → 先查 gift:{源码} 绑定，
//   已领过就返回同一枚（幂等，每码限一份）；没领过才从 KV 码池取一枚未用码，
//   标为 issued 并记 giftFrom，与来源码绑定后返回。
// 赠予码就是池中普通码：受赠者在结算页输码入口输入，走 verify-code 同一流程解锁，
// 状态机沿用 unused→issued→activated，不另起一套。
// 安全口径：码不存在、码形不对、码未激活，三种情形返回同一个 reason，不区分、
// 不回显任何码池信息（池量、剩余、他人码一概不出这个端点）。
// 绑定：IFY_CODES_KV（与 claim / verify-code 共用码池）。

import { normalizeCode, validCodeShape, readCode, writeCode, giftKey } from "./_codelib.js";

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

  let body = null;
  try { body = await request.json(); } catch (e) {}
  const src = normalizeCode(body && body.code);

  // 资格闸：只有确为 activated 的码能领赠予码；其余情形同一个回话，不许试出区别
  if (!validCodeShape(src)) return json({ ok: false, reason: "not_eligible" });
  const rec = await readCode(kv, src);
  if (!rec || rec.status !== "activated") return json({ ok: false, reason: "not_eligible" });

  // 幂等：这枚码领过赠予码，就返回原来那一枚
  let bound = null;
  try { bound = await kv.get(giftKey(src)); } catch (e) {}
  if (bound) return json({ ok: true, code: bound, again: true });

  // 从码池取一枚未用码（与 claim 同一套扫描：按 KV 元数据的 status 找 unused）
  let candidate = null;
  try {
    let cursor = undefined;
    for (let pageNo = 0; pageNo < 20 && !candidate; pageNo++) {
      const list = await kv.list({ prefix: "code:", cursor, limit: 1000 });
      for (const k of list.keys) {
        if (k.metadata && k.metadata.status === "unused") { candidate = k.name.slice("code:".length); break; }
      }
      if (list.list_complete) break;
      cursor = list.cursor;
    }
  } catch (e) {}
  if (!candidate) return json({ ok: false, reason: "unavailable" }, 503);

  const now = new Date().toISOString();
  const grec = (await readCode(kv, candidate)) || { status: "unused" };
  await writeCode(kv, candidate, { ...grec, status: "issued", giftFrom: src, issuedAt: now });
  try { await kv.put(giftKey(src), candidate); } catch (e) {}
  // 来源码上留一笔（状态不动，只记账，便于日后人工回看）
  try { await writeCode(kv, src, { ...rec, giftCode: candidate, giftedAt: now }); } catch (e) {}
  return json({ ok: true, code: candidate });
}

export async function onRequestGet() {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}
