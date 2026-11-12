// 《如果那年》v0.23 登记数据文件 · WP7（c1985）——形状同 src/content/registry-v023.js（WP1 E9 骨架），
// 加载期由 registry.js 的 mergeRegistryExtra 与 anchors.js 合入（同名先登记者胜：本体已登记者本文件不重复，
// 只补本体没有的键）。加载点：index.html / sim / 各校验工具同序，排在 registry-v023.js 之后、state.js 之前
// （三处登记见 work/wp7-loading-patch.md）。
window.GAME_REGISTRY_EXTRA = (window.GAME_REGISTRY_EXTRA || []).concat([{
  milestones: {
    // 本代记号（setter＝序章幕 id；note 写明成年回响消费点——回响条目随包在 prologue-c1985.js 的 adultEntries，
    // 合并期落 era1985.js；影子共同事实句在包 marks 段）
    "mark_case85": { "setters": ["pr_child1"], "note": "童年记号（c1985）：铁皮文具盒；成年回响 echo_case85，影子句见 prologue-c1985.js marks" },
    "mark_flag85": { "setters": ["pr_child1"], "note": "童年记号（c1985）：头一条红领巾；成年回响 echo_flag85" },
    "mark_cover85": { "setters": ["pr_child1"], "note": "童年记号（c1985）：挂历纸包书皮；成年回响 echo_cover85" },
    "mark_marble85": { "setters": ["pr_child2"], "note": "童年记号（c1985）：一兜玻璃弹珠；成年回响 echo_marble85" },
    "mark_game85": { "setters": ["pr_child2"], "note": "童年记号（c1985）：小霸王学习机；成年回响 echo_game85" },
    "mark_arcade85": { "setters": ["pr_child2"], "note": "童年记号（c1985）：游戏厅门口看打；成年回响 echo_arcade85" },
    "mark_football85": { "setters": ["pr_child4"], "note": "童年记号（c1985）：十强赛赛程表；成年回响 echo_football85" },
    "mark_shop85": { "setters": ["pr_child4"], "note": "童年记号（c1985）：小卖部赊账本（与 c2000 的 mark_shop 同名不同代、id 独立）；成年回响 echo_shop85" },
    "mark_car85": { "setters": ["pr_child4"], "note": "童年记号（c1985）：四驱车马达；成年回响 echo_car85" },
    // 家庭事实回响条目自身不立新旗，只登记回响 id 的归属说明（消费点登记，G3）
    "echo_lb85": { "setters": ["echo_lb85"], "note": "成年回响（c1985）：require originLB，消费 L85-留 的家庭事实旗（旗本体已在 registry 本体 familyFacts 登记）" },
    "echo_laidoff85": { "setters": ["echo_laidoff85"], "note": "成年回响（c1985）：any famLaidOff85/famArrears85（AN-5 R5 后两档同消费——账本在下岗变体与停发变体里都在），消费 L85-岗 的家庭事实旗（旗本体已在 registry 本体 familyFacts 登记）" },
    // 搬家旗舰（蓝图 §3.6）中段记号：发放点＝pool_move85 中段变体的 markGrant（池调度 P5），不进记号位抽选
    "mark_move85": { "setters": ["pool_move85"], "note": "童年记号（c1985）：搬家带走的文具盒（盖内侧抄着老同桌地址）；成年回响 echo_addr85，影子句见 prologue-c1985.js pool_move85 markGrant；never 分文：影子句 markGrant.shadowBySchooling.never、中段选项组 choicesBySchooling.never、成年回响 echo_addr85 textState.schooling.never" },
    "echo_move85": { "setters": ["echo_move85"], "note": "成年回响（c1985）：require movedHome85，消费旗舰「搬家」的学籍线事实旗" },
    "echo_addr85": { "setters": ["echo_addr85"], "note": "成年回响（c1985）：require mark_move85，消费搬家中段记号" },
  },
  enumFacts: {},
  familyFacts: {
    // 池条目长尾事实（蓝图 §3.6 第 4 条：只落学籍线/亲疏/记号）：本体未登记者在此补登（合入规则先登记者胜）
    "movedHome85": { "beat": "搬家（旗舰池条目 pool_move85）", "note": "学籍线轻事实（c1985）：童年随父母打工迁徙搬过家、转过学；呈现即立，成年回响 echo_move85" },
    "transferBeforeExam85": { "beat": "搬家·临考段（pool_move85）", "note": "学籍线事实（c1985）：临考前转学、升学地与学籍变动；随迁/回流线 migrantExam 的事实来源之一" },
  },
  // examBand 分布表（E5）：c1985 按处境分表——设计参数，无统计出处（蓝图 §3.2 总则②／附录 B），
  // 只受阈值单调性（school＞half＞never 的 high 递减、low 递增）与可玩性约束。
  examBandTables: {
    "c1985": {
      "school": { "high": 40, "mid": 35, "low": 25 },
      "half": { "high": 22, "mid": 33, "low": 45 },
      "note": "c1985 定版登记（v0.23 WP7；G6 修复改）：设计参数，无统计出处；band 只切 fork16 第一次的单子，low 档出口＝pr_y18 对口升学（craft 门）。never 处境不入表（G6 终判）：没进过校门的人不掷 band——rollExamBand 无该处境行即不掷、不写 examBand 事实，fork16 的 study 选项靠 requiresFact 天然不亮，题面走无 band 的中性分文；half 退学者（schooling=left）的 study 选项另由选项级 requiresState{ schooling: [school, half] } 关门。"
    },
  },
  // prologueForks 合入行：本体 anchors 已有 c1985 skeleton 行（同 era+id 先登记者胜，本行不会重复追加，
  // 只作本代分岔形态的随包登记存证）；splitPoint 标记按蓝图 §七评审后薄集成，本轮不写（交付清单预留）。
  prologueForks: [
    { era: "c1985", age: 16, id: "pr_fork16", status: "wp7", form: "F85 中考分岔（普高主选项形，examBand 先切，中专并 craft 普通口）" },
  ],
}]);
