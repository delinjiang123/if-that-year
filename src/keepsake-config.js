// 《如果那年》典藏与支持配置常量——全站集中一处，上线时只改这个文件。
// 2026-11-11 商业模式切换（用户拍板）：典藏导出（长图＋纪录册）改为对所有人免费，
// 不再售卖；愿意的玩家在支持页自愿支持（金额自选，不换任何商品与功能）。
// 原付费基建封存不拆：四条商品支付链接已在 Stripe 侧全部停用，payLinkJPY/payLinkCNY
// 置空；claim/verify/gift 三个端点与发码逻辑原样保留，只是不再从任何玩家面链接
// 过去，留待将来日本版/海外版若重启付费时再议。式样沿革见 docs 侧 paid-spec/SPEC.md。
window.IFY_KEEPSAKE = {
  priceJPY: 500, // 历史记录：原日元售价（2026-11-11 起不再售卖）
  priceCNY: 25, // 历史记录：原人民币售价（2026-11-11 起不再售卖）
  payLinkJPY: "", // 封存：原 Stripe 商品链接（日元档），Stripe 侧已停用，勿再引用
  payLinkCNY: "", // 封存：原 Stripe 商品链接（人民币档），Stripe 侧已停用，勿再引用
  supportLink: "https://buy.stripe.com/00w8wP2JLesqbLBaJJes005", // 自愿支持链接（仅银行卡、金额自选 ¥100–¥100,000、预设 ¥500；付后为 Stripe 托管感谢页，无回跳无领码）
  buyPage: "buy.html", // 支持页（相对游戏页路径；文件名沿用 buy.html，URL 不变）
  claimPath: "/api/claim", // 封存：领码页（Pages Function，付款回跳落点）
  verifyPath: "/api/verify-code", // 封存：输码核验端点（Pages Function）
  giftPath: "/api/gift", // 封存：赠予端点（Pages Function，圆桌决议 S3）
};
