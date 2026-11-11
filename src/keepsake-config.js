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
  supportLink: "https://buy.stripe.com/6oUcN50BDacadTJ199es00a", // 自愿支持·自选金额（仅银行卡、¥100–¥10,000、预设 ¥500；付后为 Stripe 托管感谢页，无回跳无领码）
  supportTiers: { // 自愿支持·四档定额（仅银行卡；2026-11-11 用户定：四档＋任意，上限 ¥10,000）
    "300": "https://buy.stripe.com/aFa8wP3NPcki4j99FFes006",
    "500": "https://buy.stripe.com/6oU4gz3NP3NM8zp199es007",
    "1000": "https://buy.stripe.com/3cI00jest5VU2b1g43es008",
    "10000": "https://buy.stripe.com/fZu4gzfwx6ZYg1R3hhes009"
  },
  buyPage: "buy.html", // 支持页（相对游戏页路径；文件名沿用 buy.html，URL 不变）
  claimPath: "/api/claim", // 封存：领码页（Pages Function，付款回跳落点）
  verifyPath: "/api/verify-code", // 封存：输码核验端点（Pages Function）
  giftPath: "/api/gift", // 封存：赠予端点（Pages Function，圆桌决议 S3）
};
