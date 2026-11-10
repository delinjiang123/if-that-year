"use strict";
/* 链后继选择门检查（v0.19.0 审计急修立）：凡 chain 后继的前置条目带选项、且只有部分选项
   立旗（即「继续」立旗、「退出」不立），后继必须 require 其中一面旗——否则玩家选了退出，
   后继与结局照样找上门（r_drug2 / r_funding / r_ipo / r_school2 / r_teacher_students 五例）。
   读法：node tools/chain-choice-check.js */
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.join(__dirname, "..");
const sandbox = { window: {}, console };
sandbox.window = sandbox;
vm.createContext(sandbox);
const load = (rel) => vm.runInContext(fs.readFileSync(path.join(ROOT, rel), "utf8"), sandbox, { filename: rel });
load("src/content/registry-v023.js"); load("src/content/registry-wp2.js"); load("src/content/registry-wp3.js"); load("src/content/registry-wp4.js"); load("src/content/registry-wp5.js"); load("src/content/registry-wp6.js"); load("src/content/registry-wp7.js"); load("src/content/registry-wp8.js"); load("src/world/state.js"); load("src/registry.js"); // v0.20.0 拆分：state.js（domains）须先于 registry.js（milestones）；v0.23 WP1：登记数据文件先行（registry.js 尾部合入）
const PACK_FILES = ["src/content/pool/pack1.js", "src/content/pool/pack2.js", "src/content/pool/pack3.js", "src/content/pool/pack4.js", "src/content/pool/pack5.js", "src/content/pool/pack6.js", "src/content/pool/pack9.js", "src/content/pool/pack10.js", "src/content/pool/pack11.js", "src/content/pool/pack12.js", "src/content/lines/side-and-steady.js", "src/content/pool/pack14.js", "src/content/pool/pack15.js", "src/content/lines/exam.js", "src/content/pool/pack17.js", "src/content/pool/pack18.js", "src/content/pool/pack19.js", "src/content/pool/pack20.js", "src/content/pool/pack21.js", "src/content/pool/pack22.js", "src/content/pool/pack23.js", "src/content/lines/late-life.js", "src/content/pool/pack25.js", "src/content/pool/pack26.js", "src/content/pool/pack27.js", "src/content/pool/pack28.js", "src/content/pool/pack29.js", "src/content/pool/pack30.js", "src/content/pool/pack33.js", "src/content/pool/pack31.js", "src/content/pool/pack32.js", "src/content/pool/pack34.js", "src/content/pool/pack35.js", "src/content/pool/pack36.js", "src/content/pool/pack37.js", "src/content/pool/pack38.js", "src/content/pool/pack39.js", "src/content/pool/pack40.js", "src/content/pool/pack41.js", "src/content/pool/pack42.js", "src/content/pool/pack43.js", "src/content/pool/pack44.js", "src/content/pool/pack45.js", "src/content/pool/pack46.js", "src/content/pool/pack47.js", "src/content/pool/pack48.js", "src/content/pool/pack49.js", "src/content/pool/pack50.js", "src/content/pool/pack51.js", "src/content/pool/pack52.js", "src/content/pool/pack53.js", "src/content/pool/pack54.js", "src/content/pool/pack55.js", "src/content/pool/pack56.js", "src/content/pool/pack57.js", "src/content/pool/pack58.js", "src/content/pool/pack59.js", "src/content/pool/pack60.js", "src/content/pool/pack61.js", "src/content/pool/pack62.js", "src/content/pool/pack63.js", "src/content/pool/pack64.js", "src/content/pool/pack65.js", "src/content/pool/pack66.js", "src/content/pool/pack67.js", "src/content/pool/pack68.js", "src/content/pool/pack69.js", "src/content/pool/pack70.js", "src/content/pool/pack71.js", "src/content/pool/pack72.js", "src/content/pool/pack73.js", "src/content/pool/pack74.js", "src/content/pool/pack75.js", "src/content/pool/pack76.js", "src/content/pool/pack77.js", "src/content/pool/pack78.js", "src/content/pool/pack79.js", "src/content/pool/pack80.js", "src/content/pool/pack81.js", "src/content/pool/pack82.js", "src/content/pool/pack83.js", "src/content/pool/pack84.js", "src/content/pool/pack85.js", "src/content/pool/pack86.js", "src/content/pool/pack87.js", "src/content/pool/pack88.js", "src/content/pool/pack89.js", "src/content/pool/pack90.js", "src/content/pool/pack91.js", "src/content/pool/pack92.js", "src/content/pool/pack93.js", "src/content/pool/pack94.js", "src/content/pool/pack95.js", "src/content/pool/pack96.js", "src/content/pool/pack99.js", "src/content/pool/pack98.js", "src/content/pool/pack100.js", "src/content/pool/pack97.js", "src/content/pool/pack101.js", "src/content/pool/pack102.js", "src/content/pool/pack103.js", "src/content/pool/pack104.js", "src/content/lines/covenant.js", "src/content/lines/process-beats.js", "src/content/lines/abroad.js", "src/content/era/era1955.js", "src/content/era/era1965.js", "src/content/era/era1978.js"];
load("src/events.js");
for (const p of PACK_FILES) { const fp = path.join(ROOT, p); if (fs.existsSync(fp)) load(p); } // v0.20.0 M1-B：旧版读 GAME_REGISTRY.packFiles（注册表从未有此字段，恒为空）；改为与 index.html 同序的显式清单（本检查的 rares/byId 语义不变，packs 本就只经 GAME_PACKS 累加、不入 byId）
load("src/content/rare/synergy.js");
const byId = new Map();
for (const e of sandbox.GAME_DATA.events) byId.set(e.id, e);
const rares = [...(sandbox.GAME_DATA.rares || []), ...(sandbox.GAME_SYNERGY.rare || [])];
let bad = 0, checked = 0;
for (const r of rares) {
  if (!r.chain) continue;
  const pred = byId.get(r.chain) || rares.find((x) => x.id === r.chain);
  if (!pred || !pred.choices) continue;
  const setFlags = new Set(pred.choices.map((c) => c.set).filter(Boolean));
  const unsetChoices = pred.choices.filter((c) => !c.set);
  if (!setFlags.size || !unsetChoices.length) continue; // 全选项都立旗或都没立旗：无「选了退出还续上」的口子
  checked++;
  const reqs = Array.isArray(r.require) ? r.require : (r.require ? [r.require] : []);
  if (!reqs.some((f) => setFlags.has(f))) { console.log(`FAIL ${r.id}: chain 前置 ${r.chain} 只有部分选项立旗 [${[...setFlags].join(",")}]，后继未 require 其中任何一面`); bad++; }
}
console.log(`chain-choice-check: ${checked} 条部分立旗链后继已查，违规 ${bad}`);
process.exit(bad ? 1 : 0);
