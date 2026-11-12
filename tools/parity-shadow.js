#!/usr/bin/env node
/* 《如果那年》parity 套件（v0.21 WP5 常设项，蓝图 8.1 第 2 条）——用法：node tools/parity-shadow.js
   在当前树上以 sim 工作区 scripts/dump-baseline.js 同口径（同一种子集、同一种子/人格轮转、
   同一 runGame）重跑冻结集 416 局（V018 四年代各 100 + AUDIT19 审计矩阵 16），与 WP0 封存的
   baseline/baseline-mainline.json 逐局逐字比对（ledger + log + 终局数值：stats/state/death/
   special/verdict/comboKey/flags/route/track）——任一局不一致即 FAIL 并指出种子与首个差异点。
   另含一条 WP4 登记的常设断言：「两处事实来源清单全等」——src/views/shadow.js 的
   GLIMPSE_FACT_SOURCES 与 sim 工作区 scripts/glimpse-provenance.js 的 SOURCES 是同一份清单的
   两处抄写（有意双抄、互相校验），逐项全等才算过；此断言放在本工具里（quality-gate
   经本工具一并执行），因为它要同时读游戏树与 sim 工作区两侧。
   v0.24.4（AN-2 生活事实源）：OWNED_FLAGS 与两组 MORTGAGE id 清单随住房派生化退役——
   瞥视住房行改读 place.js housingOf 单一源，产品侧不再持有这三组清单；断言一相应改为：
   退役三组必须在树侧缺席（防手维清单回潮）、HEALTH_ALERT_IDS 仍与 sim 侧双抄全等。
   sim 工作区 scripts/glimpse-provenance.js 的 SOURCES 退役同步在集成阶段做（不在本树内）。
   定位：IFY_SIM_DIR 指定 sim 工作区 scripts（默认 ~/workspace/sim-v021/scripts）；
   基线默认取该工作区 ../baseline/baseline-mainline.json（IFY_BASELINE 可覆盖）。 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), crypto = require("crypto");
const SIM_DIR = process.env.IFY_SIM_DIR || path.join(os.homedir(), "workspace", "sim-v021", "scripts");
const BASELINE = process.env.IFY_BASELINE || path.join(SIM_DIR, "..", "baseline", "baseline-mainline.json");

function firstDiff(a, b, trail) {
  if (JSON.stringify(a) === JSON.stringify(b)) return null;
  if (Array.isArray(a) && Array.isArray(b)) {
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) { const d = firstDiff(a[i], b[i], `${trail}[${i}]`); if (d) return d; }
    return `${trail}: 数组长度 ${a.length} vs 基线 ${b.length}`;
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { const d = firstDiff(a[k], b[k], trail ? `${trail}.${k}` : k); if (d) return d; }
    return `${trail}: 对象键集不同`;
  }
  return `${trail}: ${JSON.stringify(a)} vs 基线 ${JSON.stringify(b)}`;
}

function main() {
  if (!fs.existsSync(path.join(SIM_DIR, "sim.js"))) { console.log(`parity-shadow: FAIL — 找不到 sim harness：${SIM_DIR}/sim.js`); process.exit(1); }
  if (!fs.existsSync(BASELINE)) { console.log(`parity-shadow: FAIL — 找不到基线：${BASELINE}`); process.exit(1); }
  const baselineRaw = fs.readFileSync(BASELINE, "utf8");
  const baseline = JSON.parse(baselineRaw);
  const argv2 = process.argv[2];
  process.argv[2] = "__lib";
  const sim = require(path.join(SIM_DIR, "sim.js"));
  process.argv[2] = argv2;
  const { makeContext, runGame, PERSONA_ORDER, ERAS, AUDIT_MATRIX } = sim;

  let failures = 0;
  // ---- 断言一：两处事实来源清单全等 ----
  {
    const ctx = makeContext();
    const fromTree = ctx.window.IFY.GLIMPSE_FACT_SOURCES;
    const prov = require(path.join(SIM_DIR, "glimpse-provenance.js"));
    const fromTool = prov.SOURCES;
    const keys = ["HEALTH_ALERT_IDS"];
    const retired = ["OWNED_FLAGS", "MORTGAGE_SETTER_IDS", "MORTGAGE_ONGOING_IDS"]; // v0.24.4 退役：树侧必须缺席
    const bad = keys.filter((k) => JSON.stringify(fromTree && fromTree[k]) !== JSON.stringify(fromTool && fromTool[k]));
    const back = retired.filter((k) => fromTree && fromTree[k] !== undefined);
    if (bad.length || back.length) { failures++; console.log(`parity-shadow: FAIL — 事实来源清单两处登记不一致：${[...bad, ...back.map((k) => k + "(已退役却仍在树侧)")].join(", ")}`); }
    else console.log(`parity-shadow: 事实来源清单双抄全等 PASS（${keys.join(" / ")}；退役三组树侧缺席）`);
  }

  // ---- 断言二：冻结集逐局逐字 parity ----
  const ctx = makeContext();
  const candidates = [];
  const collect = (r) => {
    candidates.push({ seedStr: r.seedStr, era: r.era, persona: r.persona, route: r.route, track: r.track,
      deathAge: r.deathAge, deathType: r.deathType, stats: r.stats, state: r.state,
      special: r.special ? r.special.id : null, verdictTop: r.verdict.top, verdictBottom: r.verdict.bottom,
      comboKey: r.comboKey, flags: r.flags, log: r.log, ledger: r.ledger });
  };
  for (const era of ERAS) for (let i = 0; i < 100; i++) collect(runGame(ctx, { seedStr: `V018-${era}-${i}`, era, persona: PERSONA_ORDER[i % 6] }));
  for (const cfg0 of AUDIT_MATRIX) collect(runGame(ctx, { ...cfg0, seedStr: `AUDIT19-${cfg0.n}`, audit: true }));

  if (candidates.length !== baseline.length) { failures++; console.log(`parity-shadow: FAIL — 局数 ${candidates.length} vs 基线 ${baseline.length}`); }
  let badRuns = 0;
  const n = Math.min(candidates.length, baseline.length);
  for (let i = 0; i < n; i++) {
    if (JSON.stringify(candidates[i]) !== JSON.stringify(baseline[i])) {
      badRuns++;
      if (badRuns <= 5) console.log(`parity-shadow: FAIL — 种子 ${baseline[i].seedStr} 不一致：${firstDiff(candidates[i], baseline[i], "")}`);
    }
  }
  const payload = JSON.stringify(candidates);
  const sha = crypto.createHash("sha256").update(payload).digest("hex");
  const baseSha = crypto.createHash("sha256").update(baselineRaw).digest("hex");
  if (badRuns) failures++;
  console.log(`parity-shadow: 冻结集 ${candidates.length} 局，不一致 ${badRuns} 局；重跑 sha256=${sha}；基线 sha256=${baseSha}`);
  console.log(failures ? "parity-shadow: FAIL" : `parity-shadow: PASS（${candidates.length}/${baseline.length} 局逐字全等）`);
  process.exit(failures ? 1 : 0);
}
main();
