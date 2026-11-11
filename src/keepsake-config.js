// 《如果那年》付费功能「人生纪录典藏」配置常量（v0.33.0）——全站集中一处，上线时只改这个文件。
// 式样定稿：docs 侧 ~/workspace/paid-spec/SPEC.md（玩家席与用户谈定，不再回炉）。
// 支付链接为空 = 通道尚未开通：购买页与结算入口照常显示价格与说明，购买按钮呈「通道开通中」
// 不可点，不许把玩家领到不存在的链接上去。真值由运营（用户）在 Stripe 建好支付链接后填入：
// 两个链接的付款成功回跳都须设为 https://if-that-year.sommeatlas.com/api/claim?session_id={CHECKOUT_SESSION_ID}。
// 2026-11-11 换代：旧链接（回跳 pages.dev）因 Stripe 建后改不动回跳而退役，新链接回跳正式域名；
// 旧链接未停用（回跳的 pages.dev 领码页仍在），已发出去的旧链接照常能付、能领码。
window.IFY_KEEPSAKE = {
  priceJPY: 500, // 日元档（定数：附则区间 ¥480–¥500 取整档）
  priceCNY: 25, // 人民币档（附则已定，不按汇率硬换算）
  payLinkJPY: "https://buy.stripe.com/aFaeVdacd2JI4j98BBes002", // Stripe 支付链接（日元 ¥500；支持卡与钱包）
  payLinkCNY: "https://buy.stripe.com/28E9AT845gAy3f58BBes003", // Stripe 支付链接（人民币 ¥25；支付宝 / 微信支付）
  buyPage: "buy.html", // 购买页（相对游戏页路径）
  claimPath: "/api/claim", // 领码页（Pages Function，付款回跳落点）
  verifyPath: "/api/verify-code", // 输码核验端点（Pages Function）
  giftPath: "/api/gift", // 赠予端点（Pages Function，圆桌决议 S3）
};
