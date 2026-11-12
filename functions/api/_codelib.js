// 《如果那年》人生纪录典藏 · 兑换码公共库（claim / verify-code 共用，下划线开头不占路由）。
// 码制（paid-spec/SPEC.md 附则：码制全通道共用一套）：12 位，字符集 30 个——
// 去掉易混的 0 / O / 1 / l / I（大写集里本就没有 l，小写输入先转大写再比）。
// 码空间 30^12 ≈ 5.3e17；单码靠 KV 精确查，无枚举面；防爆破在 verify-code 的失败限速。
// KV 键：
//   code:{码12位}     → JSON {status: "unused"|"issued"|"activated", session?, issuedAt?, activatedAt?, activations?, flagged?}
//   session:{Stripe 会话 id} → 码12位（发码幂等：同一笔付款重复回跳只发同一码）
//   gift:{来源码12位}  → 赠予码12位（gift.js 写：已激活码领出的赠予码，与来源码绑死，
//                        重复请求返回同一枚；赠予码本身就是池中普通码，issued 后走同一核验）
//   rl:{IP}           → JSON {fails}（失败计数，TTL 600 秒）
//   verifylog:{日期}  → 逐行 JSON（高频复核的报警式留痕）
// 状态机：unused（码池待售/待发）→ issued（付款核验后发出）→ activated（首次输码解锁）；
// 爱发电等备选通道售出的码从 unused 直接被首次核验激活，同一套码、同一个核验端点。

export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LEN = 12;

export function normalizeCode(raw) {
  return String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function displayCode(c12) {
  return c12 && c12.length === CODE_LEN
    ? `${c12.slice(0, 4)}-${c12.slice(4, 8)}-${c12.slice(8)}`
    : String(c12 || "");
}

export function validCodeShape(c12) {
  if (!c12 || c12.length !== CODE_LEN) return false;
  for (const ch of c12) if (!CODE_ALPHABET.includes(ch)) return false;
  return true;
}

export const codeKey = (c12) => `code:${c12}`;
export const sessionKey = (sid) => `session:${sid}`;
export const giftKey = (c12) => `gift:${c12}`;

export async function readCode(kv, c12) {
  const raw = await kv.get(codeKey(c12));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function writeCode(kv, c12, rec) {
  await kv.put(codeKey(c12), JSON.stringify(rec), { metadata: { status: rec.status } });
}

export function escHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
