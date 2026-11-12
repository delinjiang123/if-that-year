// 《如果那年》v0.23 WP4（c1978）登记数据文件——形状随 WP1 骨架（registry-v023.js 五槽），
// 加载期由 registry.js 尾部 mergeRegistryExtra 合入、anchors.js 合入 prologueForks；
// 本文件不直改 registry.js / anchors.js 本体。加载点（补丁稿 work/wp4-index.html-patch.md）：
// index.html / sim / 校验工具在 registry-v023.js 之后、state.js 之前同序登记。
// 同名先登记者胜：famTight78 已在 WP1 本体 familyFacts 登记，本文件不重复；
// examBand / studyForm 枚举事实已在本体 enumFacts 定版，本文件不重复。
// prologueForks 的 c1978 行与 anchors 骨架行同 era+id（骨架先登记者胜，合入时被去重），
// 此行只作本包交付登记与 form 说明留痕。
window.GAME_REGISTRY_EXTRA = (window.GAME_REGISTRY_EXTRA || []).concat([{
  milestones: {
    "f78_zhongzhuan": {
      setters: ["pr_fork16"],
      note: "中专出身（v0.23 WP4 F78）：pr_fork16 中专选项立旗，与枚举事实 studyForm=zhongzhuan 同步；下游消费者＝era1978.js 的 e78_056/057/058（按出身分口的成年入口）＋结算手艺槽专属收法（WP9 落，接口登记见 logs/wp4.md）",
    },
    "f78_repeated": {
      setters: ["pr_fork16"],
      note: "中考复读一年（v0.23 WP4 F78 出口）：pr_fork16 低档专属选项立旗；下游消费者＝序章 pr_y17 的 flagText 专属分文",
    },
    "famTight78": {
      setters: ["pr_fam78a", "pr_fam78b"],
      note: "家里的钱先紧起来（v0.23 WP4 L78-家）：家庭事实旗，与本体 familyFacts 的 famTight78 同旗双登记——familyFacts 管「算家庭事实」的口径与分根复制清单，本条管 validate-state 的 require 引用与 setter 可达性判定；下游消费者＝era1978.js 的 e78_059",
    },
    "mark_sharpener78": { setters: ["pr_child1"], note: "童年记号（c1978）：同桌的小汽车卷笔刀；影子句在本代序章包 marks，成年回响走通用记号回响池" },
    "mark_egg78": { setters: ["pr_child1"], note: "童年记号（c1978）：上学第一天的一个煮鸡蛋；影子句在本代序章包 marks" },
    "mark_roster78": { setters: ["pr_child1"], note: "童年记号（c1978）：子弟小学点名记住全班名字；影子句在本代序章包 marks" },
    "mark_river78": { setters: ["pr_child2"], note: "童年记号（c1978）：放学路上那条河沟；影子句在本代序章包 marks" },
    "mark_yanghua78": { setters: ["pr_child2"], note: "童年记号（c1978）：一铁盒洋画；影子句在本代序章包 marks" },
    "mark_band78": { setters: ["pr_child2"], note: "童年记号（c1978）：跳皮筋的皮筋；影子句在本代序章包 marks" },
    "mark_tree78": { setters: ["pr_child4"], note: "童年记号（c1978）：小学门口的老槐树；影子句在本代序章包 marks" },
    "mark_panda78": { setters: ["pr_child4"], note: "童年记号（c1978）：熊猫盼盼贴纸；影子句在本代序章包 marks" },
    "mark_colortv78": { setters: ["pr_child4"], note: "童年记号（c1978）：家里换的第一台彩电；影子句在本代序章包 marks" },
  },
  enumFacts: {},
  familyFacts: {},
  examBandTables: {
    "c1978": {
      "school": { "high": 58, "mid": 27, "low": 15 },
      "half": { "high": 32, "mid": 36, "low": 32 },
      "note": "c1978 定版（v0.23 WP4）：examBand 三档分布是设计参数、无统计出处（蓝图 §3.2 总则②注）；按处境分表，处境在先、band 在后；消费点＝pr_fork16 选项门，单调性自查见 logs/wp4/。fix3 B1（子类 3a）：never 行删除——没进过校门的人不掷 band（与 c1985/c1995 口径对齐，另由 pr_fork16 的 bandSkipSchooling 在引擎侧兜底）",
    },
  },
  prologueForks: [
    { era: "c1978", age: 16, id: "pr_fork16", status: "live", form: "F78 中考分岔（examBand 先切＋studyForm 中专尖子形），WP4 落形；分根点登记与锚点段后置（§七评审后薄集成，本轮预留）" },
  ],
}]);
