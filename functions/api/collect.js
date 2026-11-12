// 《如果那年》匿名埋点收集端（v0.17.0）——同源 Pages Function，路径 /api/collect。
// 口径见 docs/ANALYTICS.md：只收事件表内字段，不记录 IP、不种 cookie、不回任何可识别信息。
// 存储：Analytics Engine 绑定 IFY_AE（数据集 ify_events），每条清洗后的事件写一个数据点，
// 列位固定（见 toDataPoint 的列映射表）；时间由 AE 按写入时刻自动落 timestamp 列。
// 绑定缺失 = 只收不存：仍返回 204 并静默丢弃，站点绝不能因埋点未配好而出错。

const MAX_BODY_BYTES = 64 * 1024; // 请求体上限约 64KB
const MAX_EVENTS_PER_BATCH = 50;

// 每事件允许保留的字段（ANALYTICS.md 事件表声明），外加通用字段 name / at。
// 种子原文绝不落库：事件表里本来就没有 seed 字段，白名单自然排除，
// 客户端即使误传 seed 等任何未声明字段，也会在这里被剔除。
const ALLOWED_FIELDS = {
  game_start: ["era", "route"],
  card_pick: ["cat", "pick", "changed"],
  glimpse: ["age", "seen"],
  game_complete: ["era", "route", "endAge", "death", "ending", "tier"],
  share_click: ["action"],
  lives_view: [],
  // 统计升级批（2026-11-08）：visit 的 ref 只许 hostname（客户端只发域名，完整 URL 绝不上行）；
  // code_verify / gift_claim 只许 ok 布尔——码值不在字段表里，白名单自然剔除。
  visit: ["ref"],
  prologue_done: ["era"],
  retire_reached: ["era", "route", "age"],
  keepsake_open: ["state"],
  keepsake_preview: [],
  buy_click: [],
  code_verify: ["ok"],
  keepsake_export: ["kind"],
  gift_claim: ["ok"],
};

// Analytics Engine 列映射（固定列位，stats.js 的 SQL 按列号读，不许挪动）：
//   index1  = 事件名
//   blob1   = vid          blob6  = action        blob11 = ref
//   blob2   = era          blob7  = cat           blob12 = pick（整数下标的字符串形：
//   blob3   = route        blob8  = kind                口径是按取值分组数选了哪张卡，
//   blob4   = ending       blob9  = state               不是求和求平均，故不入 doubles）
//   blob5   = tier         blob10 = death（布尔的字符串形 "true"/"false"）
//   blob13  = seen（布尔的字符串形）
//   double1 = endAge ?? age（岁数类数值）  double2 = ok（true→1，其余→0）
//   double3 = changed（true→1，其余→0，与改选率 sum 口径对齐）
// 缺失字段一律落空串 / 0，形状恒定，方便 SQL 侧无条件按列聚合。
function bs(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function toDataPoint(ev) {
  const ageRaw = ev.endAge ?? ev.age;
  return {
    indexes: [ev.name],
    blobs: [
      bs(ev.vid), bs(ev.era), bs(ev.route), bs(ev.ending), bs(ev.tier),
      bs(ev.action), bs(ev.cat), bs(ev.kind), bs(ev.state), bs(ev.death),
      bs(ev.ref), bs(ev.pick), bs(ev.seen),
    ],
    doubles: [
      typeof ageRaw === "number" && Number.isFinite(ageRaw) ? ageRaw : 0,
      ev.ok === true ? 1 : 0,
      ev.changed === true ? 1 : 0,
    ],
  };
}

// 其余方法 405：Pages Functions 只导出 onRequestPost 时，非 POST 请求由运行时
// 返回 405；这里再显式导出其余常用方法的处理，双重保证语义。
export async function onRequestPost(context) {
  const { request, env } = context;

  // 请求体上限：先看 Content-Length，再按实际字节数复核。
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_BODY_BYTES) {
    return new Response(null, { status: 413 });
  }

  let text;
  try {
    text = await request.text();
  } catch {
    return new Response(null, { status: 400 });
  }
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    return new Response(null, { status: 413 });
  }

  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    payload.v !== 1 ||
    !Array.isArray(payload.events)
  ) {
    return new Response(null, { status: 400 });
  }

  const cleaned = [];
  for (const raw of payload.events.slice(0, MAX_EVENTS_PER_BATCH)) {
    if (!raw || typeof raw !== "object") continue;
    const name = raw.name;
    // 未知事件名丢弃该条，不报错。
    if (typeof name !== "string" || !(name in ALLOWED_FIELDS)) continue;
    const ev = { name };
    if (typeof raw.at === "string") ev.at = raw.at;
    // vid 是全事件通用字段（与 name / at 同级）：客户端生成的随机访客编号，只用来在
    // 汇总时数人数与回访。格式校验：字符串且长度 ≤64，不合规只丢这个字段、不丢事件。
    // 服务端不记 IP、不读任何设备信号，vid 永不与码池/订单/账户关联（口径见 ANALYTICS.md）。
    if (typeof raw.vid === "string" && raw.vid.length > 0 && raw.vid.length <= 64) ev.vid = raw.vid;
    for (const field of ALLOWED_FIELDS[name]) {
      if (Object.prototype.hasOwnProperty.call(raw, field)) {
        ev[field] = raw[field];
      }
    }
    cleaned.push(ev);
  }

  const ae = env && env.IFY_AE;
  if (ae && cleaned.length) {
    for (const ev of cleaned) {
      try {
        ae.writeDataPoint(toDataPoint(ev));
      } catch {
        // 单条写入失败静默丢弃这一条，其余照常写，绝不影响站点。
      }
    }
  }
  // 绑定不存在时同样走到这里：只收不存，返回 204。

  return new Response(null, { status: 204 });
}

export async function onRequestGet() {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}

export async function onRequestPut() {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}

export async function onRequestPatch() {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}

export async function onRequestDelete() {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}

export async function onRequestHead() {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}

export async function onRequestOptions() {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}
