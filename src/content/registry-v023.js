// 《如果那年》v0.23 登记数据文件（骨架，WP1 E9）——各内容包的新登记一律写这种独立文件随包走、
// 加载期合入，不许直改 src/registry.js 本体。加载点：index.html 里排在 src/world/state.js 之前
// （sim 与各校验工具同序登记）；合入点：src/registry.js 尾部的 mergeRegistryExtra（registry 类）
// 与 src/anchors.js（prologueForks 类）。同名键先登记者胜——本体（WP1 定版）优先，本文件只补新键。
// 形状（五槽，缺槽按空处理）：
//   milestones:     { 旗名: { setters: [条目 id...], note } }        —— 与 registry 里程碑同形
//   enumFacts:      { 事实名: { values: [...], host: 宿主域, note } } —— 与 E11 枚举事实同形
//   familyFacts:    { 旗名: { beat: 拍编号, note } }                  —— 与 E4 家庭事实旗同形
//   examBandTables: { 年代id: { 处境: { high, mid, low } } }          —— 设计参数，无统计出处
//   prologueForks:  [{ era, age, id }]                                —— 合入 GAME_ANCHORS.prologueForks
// 本文件是 WP1 交付的空骨架：槽位齐、内容为空——各代包（WP2–WP5/WP7/WP8）把本代登记填进各自的
// 登记数据文件（同形状、另起文件），不要往这个骨架文件里堆内容。
window.GAME_REGISTRY_EXTRA = (window.GAME_REGISTRY_EXTRA || []).concat([{
  milestones: {},
  enumFacts: {},
  familyFacts: {},
  examBandTables: {},
  prologueForks: [],
}]);
