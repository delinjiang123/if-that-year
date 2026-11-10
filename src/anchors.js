// 《如果那年》年代锚点表（v0.20.0 M2）——加载位：registry 之后、storylet 之前（见 index.html）。
// 这是对现状的登记，不是新内容：L0 必经节点此前散落在 engine.js 的 step()、各进程模块与
// 数据本体里，本表把「哪些是锚点」收成一张可校验的表。锚点的触发机制本步不变（进程拍仍由
// 各进程的 Due 函数判定、分岔仍由 step() 按年龄找、瞥视仍在 30/40/50）；调度层（scheduler.js）
// 以本表组织年份计划（planYear 先认锚点、再仲裁内容时槽）。
// 一致性由 tools/validate-storylet.js 的锚点断言守住：表里有的 forks 数据里必须有、数据里的
// forks 必须全在表里；procBeats 必须与 D.events 中 procOnly 条目集合全等；瞥视年龄恒 [30,40,50]。
// 分岔登记键 = 年龄 + id + route：无 id 的分岔以 id=null 登记（数据本体即无 id，靠年龄定位）；
// 28 岁有两条（fork28 通用 / fork28m 限 home 路线），靠 route 区分。
(function () {
  "use strict";
  const FORKS = [
    { age: 25, id: null, route: null },
    { age: 28, id: "fork28", route: null },
    { age: 28, id: "fork28m", route: "home" },
    { age: 28, id: "fork28f", route: "farm" },
    { age: 33, id: "fork33f", route: "farm" },
    { age: 31, id: null, route: null },
    { age: 33, id: null, route: null },
    { age: 44, id: null, route: null },
    { age: 52, id: null, route: null },
    { age: 58, id: null, route: null },
    // 孩子线批次 S4：fork_kid 是进程分岔（kidGateDue 开门呈现，无固定呈现年龄）——age 33
    // 只是 D7 最早开门岁的建模登记（anchorInfo 无消费者、不改触发机制），本体以 id 认；
    // 原 38 岁（fork38）与 45 岁（fork45）两行随其提问功能退役删除。
    { age: 33, id: "fork_kid", route: null },
    // 第 1 期 P1-6：入行关口同为进程分岔（career.js 的 gateDue 开门呈现，无固定呈现
    // 年龄）——age 22/26 只是建模登记（gate_first 最早开门岁 / gate_switch 本体登记岁，
    // 与 fork_kid 的 33 同例：anchorInfo 无消费者、不改触发机制），本体以 id 认。
    { age: 22, id: "fork_gate_first", route: null },
    { age: 26, id: "fork_gate_switch", route: null },
  ];
  // 进程拍：父母进程 care/hosp/dead 六拍（who/beat 与 parentsDue 的返回同形）、dating 到期拍、
  // 退休节点拍（node/full/auto 三条呈现条目同属一个节点机制）、出国去向拍（abroad 入口拍）。
  const PROC_BEATS = [
    { id: "proc_dad_signal", who: "dad", beat: "signal" },
    { id: "proc_mom_signal", who: "mom", beat: "signal" },
    { id: "proc_dad_care", who: "dad", beat: "care" },
    { id: "proc_mom_care", who: "mom", beat: "care" },
    { id: "proc_dad_hosp", who: "dad", beat: "hosp" },
    { id: "proc_mom_hosp", who: "mom", beat: "hosp" },
    { id: "proc_dad_dead", who: "dad", beat: "dead" },
    { id: "proc_mom_dead", who: "mom", beat: "dead" },
    { id: "proc_dad_century", who: "dad", beat: "century" },
    { id: "proc_mom_century", who: "mom", beat: "century" },
    { id: "proc_dating", kind: "dating" },
    { id: "proc_kid_debut", kind: "kidDebut" },
    { id: "proc_retire_node", kind: "retire" },
    { id: "proc_retire_full", kind: "retire" },
    { id: "proc_retire_auto", kind: "retire" },
    { id: "proc_abroad_kind", kind: "abroad" },
  ];
  // 序章分岔锚点（v0.23 WP1 E9 扩表骨架）：按代登记每代 fork16 的形态锚——c2000 是现行实存条目；
  // 其余五代先立骨架行（status:"skeleton"，锚点 id 与 c2000 同名 pr_fork16，各代包以同 id 在本代
  // acts 里落形），各代包集成时把本代行改 status:"live" 并在本行补 form 说明，不许另起 id。
  // 登记数据文件（GAME_REGISTRY_EXTRA[].prologueForks）在此合入：同 era+id 已登记者胜，不重复追加。
  const PROLOGUE_FORKS = [
    { era: "c2000", age: 16, id: "pr_fork16", status: "live" },
    { era: "c1955", age: 16, id: "pr_fork16", status: "skeleton", form: "F55-b 毕业分配（城镇两层掷定/农村四轨），随 WP2 落形" },
    { era: "c1965", age: 16, id: "pr_fork16", status: "skeleton", form: "F65-a 顶替名额归属后的本人路，随 WP3 落形" },
    { era: "c1978", age: 16, id: "pr_fork16", status: "skeleton", form: "F78 中考分岔（examBand 先切），随 WP4 落形" },
    { era: "c1985", age: 16, id: "pr_fork16", status: "skeleton", form: "F85 中考分岔（普高主选项形），随 WP7 落形" },
    { era: "c1995", age: 16, id: "pr_fork16", status: "skeleton", form: "F95 半张单子（band 与分岔同拍），随 WP8 落形" },
  ];
  for (const x of window.GAME_REGISTRY_EXTRA || []) {
    for (const pf of (x && x.prologueForks) || []) {
      if (pf && !PROLOGUE_FORKS.some((q) => q.era === pf.era && q.id === pf.id)) PROLOGUE_FORKS.push(pf);
    }
  }
  // fork33 年代框登记（v0.23 WP1 E2）：eraFrame 的框与本体对应关系在此登记——本体 = events.js 中
  // age 33 的分岔（题面+四选项，set 旗 bought_house/renting/near_family 不变）；renderFork/无头解决器
  // 按 eraFrame 字段命中即整框替换。v0.23 WP6：两框内容已落码（events.js fork33 的 eraFrame.c1955/
  // c1965，框选项与本体逐项同门/同效果/同 set，parity 机械比对见 sim-v023/logs/wp6/parity.log），
  // status 改 live；框 id 与数据内键的对应：frameId 是本表登记名，数据键即 era id 本身（eraFrame.era）。
  const ERA_FRAMES = [
    { forkAge: 33, era: "c1955", frameId: "fork33_frame_c1955", status: "live", form: "分房排到没排到/房改买不买下（WP6 落码）" },
    { forkAge: 33, era: "c1965", frameId: "fork33_frame_c1965", status: "live", form: "房改买下与第一批商品房（WP6 落码）" },
  ];
  window.GAME_ANCHORS = {
    // 六个年代共用同一套成年段锚点（数据本体即如此：分岔不分年代、进程拍不分年代）。
    eras: ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    forks: FORKS,
    glimpseAges: [30, 40, 50], // 瞥视年龄（L0 展示层）：与 engine.js 的 GLIMPSE_AGES 键集同口径
    procBeats: PROC_BEATS,
    // 序章分岔按代扩表（骨架见上）：id 实存由 validate-storylet 一并校验（骨架行与 c2000 同 id，实存指向 c2000 现行幕；各代落形后仍同 id）。
    prologueForks: PROLOGUE_FORKS,
    eraFrames: ERA_FRAMES,
  };
})();
