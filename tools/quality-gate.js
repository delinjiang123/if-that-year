#!/usr/bin/env node
/* 《如果那年》quality-gate 一键编排器（v0.20.0 M1-B）——用法：node tools/quality-gate.js
   一条命令顺序跑齐全部常设检查并汇总：仓库侧 validate-state / validate-storylet /
   stateline-assert / chain-choice-check；模拟侧（IFY_SIM_DIR 定位，默认
   ~/workspace/sim-v020/scripts）determinism / oldsave / regression / main 4000（16000 局护栏，
   含死亡按年代对带判定与特殊结局单体护栏）/ stateline-scan / occupation-check /
   era-scan / threshold-check。
   本文件只编排与汇总，不改任何检查的判定口径：每项的 PASS/WARN/FAIL 按该检查自身的
   输出与既有口径判定（死亡带宽对照 docs/MORTALITY-MODEL.md 现行带；c1955 中段/活满按
   v0.19 裁定，贴边 ≤2pp 记 WARN 不记 FAIL；环游世界单体为已知留裁项，超线记 WARN 不记 FAIL）。
   汇总写 sim 工作区 logs/quality-gate-latest.md 并存一份带时间戳的副本；任一 FAIL 退出码非 0。
   接口适配登记（按各脚本实际 CLI/输出，不改判定口径）：sim determinism 的实际输出为
   「determinism: N/200」单行（无哈希字样）；sim regression 的实际输出为 run-02/run-04 两条
   ASSERT 行（无 campaigns 汇总行）；stateline-scan 随 M1-A 引擎拆分换装载法（逐模块载入 +
   IFY 探针，扫描逻辑未动）；occupation-check 的登记表 occupation-gating.json 已从
   sim-v019/logs 复制到 sim-v020/logs（其脚本按 ../logs 相对路径读取）。 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), { spawnSync } = require("child_process");
const ROOT = path.join(__dirname, "..");
const SIM_DIR = process.env.IFY_SIM_DIR || path.join(os.homedir(), "workspace", "sim-v020", "scripts");
const SIM_HOME = path.dirname(SIM_DIR);
const LOG_DIR = path.join(SIM_HOME, "logs");
const RUN_TIMEOUT = 30 * 60 * 1000;

const results = []; // {check, status, note, artifact, ms}
function record(check, status, note, artifact, ms) {
  results.push({ check, status, note, artifact: artifact || "-", ms });
  console.log(`[${status}] ${check} — ${note}`);
}
function run(cmd, args, cwd) {
  const t0 = Date.now();
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8", maxBuffer: 256 * 1024 * 1024, timeout: RUN_TIMEOUT });
  return { code: r.status, out: (r.stdout || "") + (r.stderr || ""), ms: Date.now() - t0, error: r.error };
}
const tail = (out, n) => out.trim().split("\n").slice(-n).join(" / ");

// ---------- 仓库侧 ----------
{
  const r = run("node", ["tools/validate-state.js"], ROOT);
  record("validate-state", r.code === 0 && /RESULT: PASS/.test(r.out) ? "PASS" : "FAIL", tail(r.out, 1), "（控制台）", r.ms);
}
{
  const r = run("node", ["tools/validate-storylet.js"], ROOT);
  const dom = (r.out.match(/domain 计数: (\{.*\})/) || [])[1] || "";
  record("validate-storylet", r.code === 0 && /RESULT: PASS/.test(r.out) ? "PASS" : "FAIL", `${tail(r.out, 1)}; domain ${dom}`, "（控制台）", r.ms);
}
{
  const r = run("node", ["tools/stateline-assert.js"], ROOT);
  record("stateline-assert", r.code === 0 && /RESULT: PASS/.test(r.out) ? "PASS" : "FAIL", tail(r.out, 2), "（控制台）", r.ms);
}
{
  const r = run("node", ["tools/chain-choice-check.js"], ROOT);
  record("chain-choice-check", r.code === 0 ? "PASS" : "FAIL", tail(r.out, 1), "（控制台）", r.ms);
}
{
  // v0.20.1 常设项：立约对账行与 fork45 真实选择不得冲突（16000 局，冲突数必须为 0）
  const r = run("node", ["tools/settle-choice-check.js"], ROOT);
  const m = r.out.match(/runs=(\d+) fork45=(\d+) try=(\d+) settle=(\d+) covSoloDue=(\d+) conflicts=(\d+)/);
  record("settle-choice-check（立约对账）", r.code === 0 && m && m[6] === "0" ? "PASS" : "FAIL",
    m ? `runs=${m[1]} fork45=${m[2]} try=${m[3]} settle=${m[4]} covSoloDue=${m[5]} conflicts=${m[6]}` : tail(r.out, 2), "（控制台）", r.ms);
}
{
  // v0.21 常设项（WP5）：主线冻结集 416 局与 WP0 基线逐局逐字 parity + 瞥视事实来源清单双抄全等。
  // harness 与基线经 IFY_SIM_DIR 定位（与本编排器的模拟侧同源，环境变量随 run 继承）。
  const r = run("node", ["tools/parity-shadow.js"], ROOT);
  const m = r.out.match(/parity-shadow: PASS（(\d+)\/(\d+) 局逐字全等）/);
  record("parity-shadow（主线 parity + 来源双抄）", r.code === 0 && m ? "PASS" : "FAIL",
    m ? `冻结集 ${m[1]}/${m[2]} 局逐字全等，事实来源清单双抄全等` : tail(r.out, 2), "（控制台）", r.ms);
}

// ---------- 模拟侧 ----------
{
  const r = run("node", ["sim.js", "determinism"], SIM_DIR);
  const m = r.out.match(/determinism: (\d+)\/(\d+)/);
  const ok = r.code === 0 && m && Number(m[1]) === Number(m[2]) && !/MISMATCH/.test(r.out);
  record("sim determinism", ok ? "PASS" : "FAIL", m ? `determinism: ${m[1]}/${m[2]}` : tail(r.out, 2), "（控制台）", r.ms);
}
{
  const r = run("node", ["sim.js", "oldsave"], SIM_DIR);
  const fails = (r.out.match(/FAIL/g) || []).length;
  const ok = r.code === 0 && fails === 0 && /oldsave loadSave alive: PASS/.test(r.out) && /oldsave prologue present/.test(r.out);
  record("sim oldsave", ok ? "PASS" : "FAIL", `PASS 行 ${(r.out.match(/PASS/g) || []).length} / FAIL 行 ${fails}`, "（控制台）", r.ms);
}
{
  const r = run("node", ["sim.js", "regression"], SIM_DIR);
  const asserts = (r.out.match(/ASSERT .* PASS/g) || []).length;
  const ok = r.code === 0 && asserts >= 2 && !/ASSERT .* FAIL/.test(r.out);
  record("sim regression", ok ? "PASS" : "FAIL", `审计复现断言 ${asserts} 条 PASS`, "（控制台）", r.ms);
}

// main 4000 + 死亡对带 + 环游世界单体护栏
const BANDS = { // docs/MORTALITY-MODEL.md 现行带（22 岁条件生存，%）：[early<60, mid 60–79, full 活到80]
  c1955: { early: [14, 20], mid: [36, 45], full: [38, 46] },
  c1965: { early: [11, 16], mid: [32, 41], full: [46, 54] },
  c1978: { early: [8, 12], mid: [28, 36], full: [54, 62] },
  c2000: { early: [5, 9], mid: [22, 30], full: [62, 71] },
};
{
  const r = run("node", ["sim.js", "main", "4000"], SIM_DIR);
  const finalPath = path.join(LOG_DIR, "final.json");
  let fin = null;
  try { fin = JSON.parse(fs.readFileSync(finalPath, "utf8")); } catch (e) { /* 下方按 FAIL 记录 */ }
  const okRun = r.code === 0 && fin && fin.runs === 16000;
  record("sim main 4000", okRun ? "PASS" : "FAIL", fin ? `runs=${fin.runs}` : `退出码 ${r.code}，final.json 不可读`, "logs/final.json", r.ms);
  if (fin && fin.byEra) {
    let worst = 0; const notes = [];
    for (const [era, band] of Object.entries(BANDS)) {
      const got = fin.byEra[era] || {};
      for (const k of ["early", "mid", "full"]) {
        const v = typeof got[k] === "number" ? got[k] * 100 : NaN;
        const [lo, hi] = band[k];
        const dev = Number.isNaN(v) ? Infinity : (v < lo ? lo - v : (v > hi ? v - hi : 0));
        if (dev > 0) notes.push(`${era}.${k} 实测 ${Number.isNaN(v) ? "?" : v.toFixed(2)}% 带 ${lo}–${hi} 出带 ${dev.toFixed(2)}pp`);
        worst = Math.max(worst, dev);
      }
    }
    // v0.19 裁定：贴边 ≤2pp 记 WARN 不记 FAIL（c1955 中段/活满为已知贴边项）；>2pp 才 FAIL
    const st = worst === 0 ? "PASS" : (worst <= 2 ? "WARN" : "FAIL");
    record("mortality bands（死亡按年代对带）", st, notes.length ? notes.join("；") : "四世代三档全部落带", "logs/final.json", 0);
    const trav = fin.specialById && typeof fin.specialById.end_traveler === "number" ? fin.specialById.end_traveler : 0;
    // 环游世界单体：已知留裁项——占比超 3% 只记 WARN 并注明，不做假绿也不记 FAIL
    record("special end_traveler（环游世界单体）", trav > 0.03 ? "WARN" : "PASS",
      trav > 0.03 ? `占比 ${(trav * 100).toFixed(2)}%，为全池最大单体特殊结局——已知留裁项，按裁定记 WARN` : `占比 ${(trav * 100).toFixed(2)}%`, "logs/final.json", 0);
  }
}
{
  const r = run("node", ["stateline-scan.js", "4000"], SIM_DIR);
  let sum = null;
  try { sum = JSON.parse(fs.readFileSync(path.join(LOG_DIR, "stateline-summary.json"), "utf8")); } catch (e) { /* 同上 */ }
  const det = (r.out.match(/determinism sanity: (\d+)\/20/) || [])[1];
  const ok = r.code === 0 && sum && sum.totalRuns === 16000 && det === "20";
  const patNote = sum && sum.patterns ? Object.entries(sum.patterns).map(([k, v]) => `${k}:${v.hits}`).join(" ") : "";
  record("stateline-scan", ok ? "PASS" : "FAIL", `totalRuns=${sum ? sum.totalRuns : "?"} determinism sanity=${det || "?"}/20 patterns ${patNote}`, "logs/stateline-summary.json", r.ms);
}
{
  const r = run("node", ["occupation-check.js", "4000"], SIM_DIR);
  const m = r.out.match(/runs=(\d+) gatedHits=(\d+) staticMissing=(\d+) violations=(\d+)/);
  const ok = r.code === 0 && m && m[3] === "0" && m[4] === "0";
  record("occupation-check", ok ? "PASS" : "FAIL", m ? `runs=${m[1]} gatedHits=${m[2]} staticMissing=${m[3]} violations=${m[4]}` : tail(r.out, 2), "logs/occupation-check.json", r.ms);
}
{
  const r = run("node", ["era-scan.js", "--json"], SIM_DIR);
  let hits = null;
  try { hits = JSON.parse(r.out.slice(r.out.indexOf("["))); } catch (e) { /* 下方按 FAIL 记录 */ }
  if (Array.isArray(hits)) { try { fs.writeFileSync(path.join(SIM_DIR, "era-scan.json"), JSON.stringify(hits, null, 1)); } catch (e) { /* 产物落盘失败不影响判定 */ } }
  record("era-scan", r.code === 0 && Array.isArray(hits) ? "PASS" : "FAIL",
    Array.isArray(hits) ? `报告型扫描（只报告不判读）：命中 ${hits.length} 条待人工判读` : `退出码 ${r.code}`, "scripts/era-scan.json", r.ms);
}
{
  const r = run("node", ["threshold-check.js"], SIM_DIR);
  let f = null;
  try { f = JSON.parse(fs.readFileSync(path.join(LOG_DIR, "threshold-check.json"), "utf8")); } catch (e) { /* 同上 */ }
  const ok = r.code === 0 && f;
  record("threshold-check", ok ? "PASS" : "FAIL",
    f ? `报告型检查：A 链式方向翻转 ${(f.A || []).length} / B 同组自相挤压 ${(f.B || []).length} / C 多高门槛同立 ${(f.C || []).length}（C 为候选清单，只查不改）` : `退出码 ${r.code}`, "logs/threshold-check.md", r.ms);
}

// ---------- 汇总 ----------
const anyFail = results.some((x) => x.status === "FAIL");
const stamp = new Date().toISOString();
const fname = `quality-gate-${stamp.replace(/[:.]/g, "-")}.md`;
const lines = [
  `# quality-gate 汇总（${stamp}）`, "",
  `模拟目录：${SIM_DIR}（IFY_SIM_DIR${process.env.IFY_SIM_DIR ? " 已设置" : " 未设置，用默认"}）`, "",
  "| check | 状态 | 说明 | 产物 |",
  "|---|---|---|---|",
  ...results.map((x) => `| ${x.check} | ${x.status} | ${x.note.replace(/\|/g, "¦")} | ${x.artifact} |`),
  "",
  `总判定：${anyFail ? "FAIL（存在 FAIL 项）" : "无 FAIL（PASS/WARN 如上）"}`,
  "",
];
fs.mkdirSync(LOG_DIR, { recursive: true });
fs.writeFileSync(path.join(LOG_DIR, "quality-gate-latest.md"), lines.join("\n"));
fs.writeFileSync(path.join(LOG_DIR, fname), lines.join("\n"));
console.log(`quality-gate: ${results.filter((x) => x.status === "PASS").length} PASS / ${results.filter((x) => x.status === "WARN").length} WARN / ${results.filter((x) => x.status === "FAIL").length} FAIL -> logs/quality-gate-latest.md（副本 ${fname}）`);
process.exit(anyFail ? 1 : 0);
