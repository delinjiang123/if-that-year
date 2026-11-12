// 《如果那年》人生纪录典藏 · 兑换码批量生成（运营工具，非游戏运行时代码）。
// 用法：node tools/gen-codes.js [数量=200] [文件名前缀=codes]
// 产物：
//   <前缀>-bulk.json   wrangler kv bulk put 用（键 code:{码}，值 status:unused，metadata 带状态）
//   <前缀>-list.txt    明码清单（X-XXXX-XXXX 显示形）——爱发电等备选通道上架时直接导入为库存，
//                      与 Stripe 通道共用同一码池：售出/发出的码在核验时都会离开 unused 状态。
// 上线步骤（细节见 paid-build/REPORT.md 上线清单）：
//   1) npx wrangler kv namespace create IFY_CODES
//   2) Pages 项目设置里把该命名空间绑为 IFY_CODES_KV（wrangler.toml 的 kv_namespaces 或后台 Bindings）
//   3) npx wrangler kv bulk put <前缀>-bulk.json --namespace-id <id>
// 码制与 functions/api/_codelib.js 一致：12 位 × 30 字符集（无 0/O/1/l/I）。
"use strict";
const { randomInt } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const LEN = 12;

function genOne() {
  let s = "";
  for (let i = 0; i < LEN; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return s;
}
const display = (c) => `${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8)}`;

function main() {
  const n = Math.max(1, parseInt(process.argv[2] || "200", 10) || 200);
  const prefix = process.argv[3] || "codes";
  const seen = new Set();
  while (seen.size < n) seen.add(genOne());
  const codes = [...seen];
  const bulk = codes.map((c) => ({
    key: `code:${c}`,
    value: JSON.stringify({ status: "unused", createdAt: new Date().toISOString() }),
    metadata: { status: "unused" },
  }));
  const bulkPath = path.resolve(process.cwd(), `${prefix}-bulk.json`);
  const listPath = path.resolve(process.cwd(), `${prefix}-list.txt`);
  fs.writeFileSync(bulkPath, JSON.stringify(bulk, null, 1));
  fs.writeFileSync(listPath, codes.map(display).join("\n") + "\n");
  console.log(`生成 ${codes.length} 枚兑换码`);
  console.log(`  bulk（wrangler kv bulk put 用）: ${bulkPath}`);
  console.log(`  明码清单（备选通道库存导入用）: ${listPath}`);
  console.log("示例:", display(codes[0]));
}

main();
