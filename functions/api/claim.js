// 《如果那年》人生纪录典藏 · 领码页（v0.33.0）——同源 Pages Function，路径 /api/claim。
// 落点：Stripe 支付链接的付款成功回跳 …/api/claim?session_id={CHECKOUT_SESSION_ID}。
// 流程：拿 session_id 向 Stripe 核验确已付款且买的是本店价格档 → 从 KV 码池发一枚
// 未用码并与 session 绑死（同 session 重复打开本页返回同一码，幂等）→ 渲染领码页：
// 核验口径（两条任一过即认）：①币种＋金额与价格档分毫不差；②会话行项目里含本店
// 两个价格 ID 之一。留第②条是因为付款链接的 Adaptive Pricing 在 Stripe 侧固定开启、
// 关不掉：中文环境玩家在日元链接上会按 Stripe 汇率换算成人民币付款（如 ¥21.74），
// 会话币种与金额随之变成换算值，与价格档对不上——但买的仍是本店那个价格，按价格
// ID 认才不会把真买家挡在门外。价格 ID 由 Stripe 绑定在价格对象上，伪造不出。
// 码大而清楚，「回游戏自动解锁」按钮带码回跳 /?kc=码，码作备用（回跳失败时手输）。
// 环境变量（用户在 Cloudflare Pages 后台配置，见 REPORT 上线清单）：
//   STRIPE_SECRET_KEY  Stripe 密钥（只核验会话，不经手卡号）
//   IFY_CODES_KV       码池 KV 绑定名
// 任一缺失 = 本页呈「还没配好」，不发码、不假称成功。

import { sessionKey, codeKey, readCode, writeCode, displayCode, escHtml } from "./_codelib.js";

// 价格档（与 src/keepsake-config.js 定数一致；Stripe 金额单位：日元为整元，人民币为分）
const EXPECTED = [
  { currency: "jpy", amount_total: 500 },
  { currency: "cny", amount_total: 2500 },
];

// 本店两个价格的 ID（Stripe 侧实查过，与上面价格档一一对应）：
// price_1UZQcT…BA0orP = 日元 ¥500；price_1UZQcX…wv2uAO = 人民币 ¥25（2500 分）。
const EXPECTED_PRICE_IDS = ["price_1UZQcTGauekqyAQxcdBA0orP", "price_1UZQcXGauekqyAQxyswv2uAO"];

const PAGE_CSS = `
  body{margin:0;background:#FAF8F4;color:#23211C;font-family:"Hiragino Sans","Noto Sans SC",system-ui,sans-serif;line-height:1.75}
  .card{max-width:560px;margin:36px auto;background:#FFFDF8;border:1px solid #DDD6C9;border-radius:14px;padding:28px 26px;box-shadow:0 4px 14px rgba(35,33,28,.05)}
  h1{font-family:Georgia,"Songti SC","Noto Serif SC",serif;font-size:24px;margin:2px 0 10px}
  .code{font-family:Menlo,Consolas,monospace;font-size:40px;letter-spacing:.08em;text-align:center;color:#2F4A3C;background:#F6F3EC;border:1.5px dashed #2F4A3C;border-radius:12px;padding:20px 8px;margin:20px 0;word-break:break-all}
  .btn{display:block;text-align:center;background:#2F4A3C;color:#fff;text-decoration:none;border-radius:999px;padding:14px 20px;font-size:16px;margin:14px 0}
  .hint{font-size:13.5px;color:#6E6A5E}
  .err{color:#8C3A2B}
`;

function page(title, bodyHtml, status) {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escHtml(title)} · 人生RESTART：如果那年</title>
<style>${PAGE_CSS}</style>
</head>
<body>
<div class="card">
<h1>${escHtml(title)}</h1>
${bodyHtml}
</div>
</body>
</html>`;
  return new Response(html, { status: status || 200, headers: { "content-type": "text/html; charset=utf-8" } });
}

function codePage(c12) {
  const shown = escHtml(displayCode(c12));
  const backUrl = "/?kc=" + encodeURIComponent(c12);
  return page("这是你的兑换码", `
    <p>付款收到了。这一枚码，就是你订的册子。</p>
    <div class="code" id="codebox">${shown}</div>
    <p class="hint">先把这枚码存好，再往下走。抄在纸上，或者截一张图存好，都行。</p>
    <button type="button" class="btn" id="copycode">一键复制这枚码</button>
    <p class="hint" id="copytip"></p>
    <p class="hint">码要是丢了也别急：凭付款订单（Stripe 发到你邮箱的收据）到游戏页脚的 GitHub Issues 留言，能补发。换了设备，拿码再输一次就能恢复。</p>
    <a class="btn" href="${backUrl}">回游戏自动解锁</a>
    <p class="hint">点上面这个按钮回到游戏，正常就自动解锁了。要是跳回去没解开，回到游戏这一局的结算页，展开「支持作者 · 把这一生留成纪念」那一行，把这枚码输进去，一样解锁。</p>
    <p class="hint">这枚码记在输码的那个浏览器里：平时在哪个浏览器里玩，就在哪个浏览器里输。输过一次，往后在这个浏览器里每一局走完都能导出，不用再输。</p>
    <script>
    (function () {
      var btn = document.getElementById("copycode");
      var tip = document.getElementById("copytip");
      if (!btn) return;
      function fallback() {
        try {
          var el = document.getElementById("codebox");
          var range = document.createRange();
          range.selectNodeContents(el);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          tip.textContent = "没复制成。码已经帮你选中了，在选中的字上点一下「复制」，或者长按码选「复制」就行。";
        } catch (e) {
          tip.textContent = "没复制成。就照着上面的码抄下来，或者截一张图存好。";
        }
      }
      btn.addEventListener("click", function () {
        var text = ${JSON.stringify(c12)};
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            tip.textContent = "复制好了。粘到记事本或者发给自己存一份吧。";
          }, fallback);
        } else {
          fallback();
        }
      });
    })();
    </script>`);
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const kv = env && env.IFY_CODES_KV;
  const secret = env && env.STRIPE_SECRET_KEY;
  if (!kv || !secret) {
    return page("领码通道还没配好", `<p class="err">付款收到了，但领码这边还没配置完（缺 KV 绑定或 Stripe 密钥）。</p>
      <p class="hint">请把 Stripe 收据邮件留好，凭它到游戏页脚的 GitHub Issues 留言补发兑换码。给你添麻烦了。</p>`, 500);
  }
  const url = new URL(request.url);
  const sid = url.searchParams.get("session_id") || "";
  if (!sid) {
    return page("没找到这笔付款", `<p class="err">这个页面要带着付款凭证才能领码，链接里没有。</p>
      <p class="hint">如果你是付完款跳过来的，请从 Stripe 的完成页再点一次；或者凭付款订单到 GitHub Issues 留言补发。</p>`, 400);
  }

  // 幂等：同一笔付款重复打开，只发同一枚码
  let bound = null;
  try { bound = await kv.get(sessionKey(sid)); } catch (e) {}
  if (bound) return codePage(bound);

  // 向 Stripe 核验这笔会话确已付款、且买的是本店价格档（展开行项目，为按价格 ID 认换算付款）
  let session = null;
  try {
    const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sid)}?expand[]=line_items`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    if (!r.ok) {
      return page("核验没通过", `<p class="err">刚向 Stripe 查这笔付款，没有查到。</p>
        <p class="hint">可能是网络问题。过一会儿从 Stripe 完成页再点回来；一直不行就凭付款订单到 GitHub Issues 留言补发。</p>`, 502);
    }
    session = await r.json();
  } catch (e) {
    return page("核验没通过", `<p class="err">刚向 Stripe 查这笔付款，没连上。</p>
      <p class="hint">过一会儿从 Stripe 完成页再点回来；一直不行就凭付款订单到 GitHub Issues 留言补发。</p>`, 502);
  }
  if (!session || session.payment_status !== "paid") {
    return page("这笔付款还没完成", `<p>查到了这笔单子，但它还没付完款。</p>
      <p class="hint">付完款再回到 Stripe 完成页，点回这里领码。</p>`, 402);
  }
  const amountOk = EXPECTED.some((e) => e.currency === session.currency && session.amount_total === e.amount_total);
  const lineItems = (session.line_items && session.line_items.data) || [];
  const priceOk = lineItems.some((li) => li && li.price && EXPECTED_PRICE_IDS.includes(li.price.id));
  if (!amountOk && !priceOk) {
    return page("金额对不上", `<p class="err">这笔付款的金额和典藏的价格对不上，先不发码。</p>
      <p class="hint">请凭付款订单到 GitHub Issues 留言，人工核对后补发。</p>`, 422);
  }

  // 从码池发一枚未用码
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
  if (!candidate) {
    return page("码暂时发完了", `<p class="err">付款收到了，但码池暂时空了。</p>
      <p class="hint">请凭付款订单（Stripe 收据邮件）到 GitHub Issues 留言，当天补发到你的留言里。给你添麻烦了。</p>`, 503);
  }
  const rec = (await readCode(kv, candidate)) || { status: "unused" };
  await writeCode(kv, candidate, { ...rec, status: "issued", session: sid, issuedAt: new Date().toISOString() });
  try { await kv.put(sessionKey(sid), candidate); } catch (e) {}
  return codePage(candidate);
}

export async function onRequestPost() {
  return new Response(null, { status: 405, headers: { Allow: "GET" } });
}
