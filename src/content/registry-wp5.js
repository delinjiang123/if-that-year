// 《如果那年》v0.23 WP5 登记数据文件（c2000 补课：F00＋L00-考/L00-护）——形状同 registry-v023.js，
// 加载期由 registry.js 尾部合入器并入（同名先登记者胜）。加载点须由协调者在集成时登记三处：
// index.html 脚本序、scripts/sim.js 与 simlib19.js 载入清单，一律排在 registry-v023.js 之后、
// src/world/state.js 之前（补丁稿 work/wp5-engine-patch.md 第 1 项）。本文件未登记前，本包内容
// 依赖的登记已全部在 WP1 本体里（familyFacts 的 migrantExam/famCare00、enumFacts 的 examBand、
// anchors 的 c2000 pr_fork16 live 行），故未合入本文件时校验与运行不缺登记；本文件登记的是
// WP5 的定版口径与出处，供 WP10 出处关与证据包①差异归因对账。
//
// 下表与 registry.js 本体 c2000 行同值——WP1 落的是占位登记并注明
// 「精确值随 WP5 在本表定版」，WP5 定版结论：数值不改，予以采用为正式设计参数（本体 note 的
// 「占位」措辞由协调者按补丁稿第 2 项更新）。口径（蓝图 §3.2 总则②＋附录 B）：三档分布是
// 设计参数，无统计出处——升学率是「升入全部高中阶段」的比例，不是分数档位占比，底座里没有
// band 的统计对应物；只受阈值单调性与可玩性约束。按处境分表：处境在先、band 在后。
// high＝全单（study/craft 分班双口形/work/home）；mid＝study 切掉
// （题面以同学去向回声出现一次）、craft 换对口升学班形；low＝study 切掉、craft 换就业班形
// （回声里留高二对口升学的口子，即蓝图 §3.2 总则④出口在本代回声层的落点）。随迁「回老家
// 读高中」（requires migrantExam）不走 band 切——回老家读的是户籍地另一张单子。
// L00-考：situation=school 且家底牌 ∈ {cf_08}（随迁质地，来历幕可见）；
// L00-护：leftBehind 或家底牌 ∈ {cf_07, cf_12}。同局至多入一拍（考优先），净增至多 1 幕。
// migrantExam → pr_fork16「回老家读高中」选项（本包内消费点）＋结算父母线
// 槽供料（WP9 接入）；famCare00 → 晚年父母线前置回响登记：结算父母线槽（s6）供料＋成年
// 照护回响分口，消费者由 WP9 落码，本包只登记落点（蓝图 WP5 行 L00-护「回响落点＝晚年
// 父母线前置回响登记」）。两旗本体已在 WP1 的 GAME_REGISTRY.familyFacts 登记，本文件不重复登记。
// （§七评审后薄集成，本包不写）：c2000 分根拍＝pr_fork16（选择分根），
// splitPoint 登记与锚点段文案随薄集成补；分岔拍 id 与结果文案位置＝pr_fork16 的 bandText/echo。
window.GAME_REGISTRY_EXTRA = (window.GAME_REGISTRY_EXTRA || []).concat([{
milestones: {},
enumFacts: {},
familyFacts: {},
examBandTables: {
"c2000": {
"school": { "high": 45, "mid": 35, "low": 20},
"half": { "high": 25, "mid": 35, "low": 40},
"note": "c2000 定版（v0.23 WP5）：设计参数，无统计出处；与 registry.js 本体同值，本体为先登记者、本表作定版对账。fix3 B1（子类 3a）：never 行与本体同步删除——没进过校门的人不掷 band"
},
},
prologueForks: [
{ era: "c2000", age: 16, id: "pr_fork16", status: "live", form: "F00 fork16 升级（WP5）：band 切单子＋随迁回老家选项＋craft 中职分班形"},
],
}]);
