// 《如果那年》行当注册表（第 1 期 P1-1 登记批）——职业层的单一事实源（数据面）。
// 本批只登记已有行当：全表 26 行与 src/world/processes/work.js 的 FORM_OF_FLAG 逐行对应
// （tools/validate-state.js 双向核对，不一致即报错）。新行当留第 2 期，禁止在本表先造。
// P1-1 时本文件不进加载序、无运行时引用（零行为变化）；第 1 期 P1-2 起进入
// index.html 加载序，与其它登记数据文件同位（src/world/state.js 之前）——纯数据面，
// 登记经 GAME_REGISTRY_EXTRA 合入（registry.js 尾部合入器认 trades 键，先登记者胜），
// 运行时唯一读点是 world/career.js 的记账映射（flag → trade/form 现读本表，不另存副本）。
//
// 字段口径（设计稿 ~/workspace/p1-design/DESIGN.md §一/§三/§四，裁定见同目录 RULINGS.md）：
//   trade id     = 旗名去掉尾部 "_work"（无此尾者原名：exam_landed/farm_returned/
//                  driver_taxi/med_hosp），机械规则、无例外。
//   flag / form  = work.js FORM_OF_FLAG 的键/值，逐字抄录（form 是入行时形态，派生纪律不变）。
//   eraIn        = 现有内容可达年代：对每面旗的全部登记 setter 做实扫——条目年代门（era/
//                  eraIn/文件年代）∩ 公历窗（minYear/maxYear 与该代出生窗 [生年, 生年+9]
//                  ＋条目年龄窗 [min, max] 相交）。这是「现有内容能不能走到」的事实登记，
//                  不是行当的历史存废判断；第 2 期补内容后应随 setter 变化重扫更新。
//   eduGate      = 现有入行路径的学历门实况："gate"＝严口径（ctxOk 的 eduGate：schooling
//                  ∈{school, pre} 或 edu_bridge）、"half"＝宽口径（eduGateHalf：另放行
//                  half）、null＝现有入行拍未挂任何学历门（实扫结论，不是疏漏）。
//   gateDirect   = 关口可否直达：false＝落旗必须先有另一面入行旗或先过考试链（setter 的
//                  require/chain 实扫），这类行当不进关口的点亮候选（§八.3 普查口径）。
//   coldOk       = 可否进关口下层「冷门层」被抽（§4.3）；false 的行当 coldKinds 恒空、
//                  coldWeight 恒 0。chain 型（exam_landed）、路线/深造型（grad_work）、
//                  分科支与回落型（nurse/img/township/farm_returned）一律 false——冷门层
//                  直达会绕开它们既有的链与前置旗。
//   coldKinds    = 该行当可绑的冷门类型（assign 分配/recruit 招工/follow 跟人走/near
//                  离家近/wage 给的钱多），按入行拍的渠道性质登记；类型本身在某代可不可
//                  用由 COLD_KIND_ERA 表另管（见文件尾）。
//   coldWeight   = 冷门抽取权重。P1-1 先登标量基线：按入行渠道宽度首登（招工主渠道 5；
//                  劳务/跟车/站点/学徒等冷门原生渠道 4；单位招工常规渠道 3；写作/种地
//                  等窄渠道 2；coldOk=false 为 0）。设计稿 §4.3 的「年代×行当」二维表
//                  在 P1-6 逐代填实，届时本字段改对象形——本批标量只是骨架基线，
//                  不作统计宣称（与 examBandTables 的登记法同例）。
//   inheritFrom  = 承继项的家庭事实来源 id 列表（出身牌 cf_* 或 familyFacts 登记旗），
//                  只登现有事实里直接点名家业的行当；无来源者为空数组（不是遗漏：
//                  如 farm 的承继在现行事实里走少年轨道/农民路线本身，无家庭牌来源，
//                  留第 2 期补）。famRetire65/famQuota65（顶替）牵 L65-家发放规则，
//                  本批不登，留 P1-4 关口批裁。
//   seedEcho / inheritEcho = 回指句模板位（§3.4）：本批只占位（null），模板文案随
//                  P1-6 文案审定稿后填；null 时回指回落通用句的口径在 §3.4 已定。
window.GAME_TRADES = {
  "farm": {
    "flag": "farm_work", "form": "farm",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["near"], "coldWeight": 2,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "种地入行：分家单过/分地到户拍（p29/farm_entry）立旗，农民路线立线旗"
  },
  "township": {
    "flag": "township_work", "form": "employee",
    "eraIn": ["c1965", "c1978", "c1985"],
    "eduGate": null, "gateDirect": false,
    "coldOk": false, "coldKinds": [], "coldWeight": 0,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "乡镇企业入行（农民路线混合层）：farm_township 立旗，须先有 farm_work；工资 C 档、土地池不关门"
  },
  "farm_returned": {
    "flag": "farm_returned", "form": "farm",
    "eraIn": ["c1965", "c1978", "c1985"],
    "eduGate": null, "gateDirect": false,
    "coldOk": false, "coldKinds": [], "coldWeight": 0,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "乡镇企业回落旗：厂散后回地里（farm_township_back），不是入行口、是回落落点"
  },
  "exam_landed": {
    "flag": "exam_landed", "form": "public",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": "half", "gateDirect": false,
    "coldOk": false, "coldKinds": [], "coldWeight": 0,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "体制内上岸：考试链尾 p16_072 落旗；链头 p16_001/p16_012 为 eduGateHalf 宽门，故登记 half"
  },
  "shop": {
    "flag": "shop_work", "form": "self",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["follow", "near", "wage"], "coldWeight": 3,
    "inheritFrom": ["cf_01", "cf_10"],
    "seedEcho": null, "inheritEcho": null,
    "note": "店主入行：批发学徒/接手家店/开网店拍立旗；承继来源＝柜台后头长大的（cf_01）、家里开过饭馆（cf_10）"
  },
  "gig": {
    "flag": "gig_work", "form": "flex",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["recruit", "follow", "near", "wage"], "coldWeight": 4,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "零工/自由职业（机会层）：劳务市场报名接活拍立旗；与 side_job 副业分家"
  },
  "courier": {
    "flag": "courier_work", "form": "flex",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["recruit", "follow", "wage"], "coldWeight": 4,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "快递物流（机会层）：转运分拣/站点招工拍立旗；可达年代含晚年转行拍 p22_002（50–54 岁、无公历门）"
  },
  "care": {
    "flag": "care_work", "form": "flex",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["recruit", "follow", "near"], "coldWeight": 3,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "职业陪护（机会层）：陪护接活入行拍立旗；与家庭照护旗分家"
  },
  "write": {
    "flag": "write_work", "form": "flex",
    "eraIn": ["c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["follow", "near"], "coldWeight": 2,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "写作（机会层）：副业写作留用拍 p2_086 立旗（minYear 2005、年龄窗 26–40，c1955 出生窗＋40 岁＜2005 故不可达）"
  },
  "factory": {
    "flag": "factory_work", "form": "employee",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["assign", "recruit", "follow", "near", "wage"], "coldWeight": 5,
    "inheritFrom": ["cf_05"],
    "seedEcho": null, "inheritEcho": null,
    "note": "工厂制造入行：招工入行拍 p15_071 立旗（注记原文「招工入行」），五种冷门渠道全开；承继来源＝一个厂里出来的（cf_05）"
  },
  "fab": {
    "flag": "fab_work", "form": "employee",
    "eraIn": ["c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["recruit", "wage"], "coldWeight": 3,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "半导体入行：进晶圆厂跟线拍 p18_032 立旗，该拍 era=c2000 独占，故只登 c2000"
  },
  "craft": {
    "flag": "craft_work", "form": "employee",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["follow", "recruit", "near"], "coldWeight": 4,
    "inheritFrom": ["cf_03"],
    "seedEcho": null, "inheritEcho": null,
    "note": "手艺入行：p20 簇四拍立旗；承继来源＝院子里支着作坊（cf_03）"
  },
  "heavy": {
    "flag": "heavy_work", "form": "employee",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["assign", "recruit", "follow", "wage"], "coldWeight": 3,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "重工业入行：进钢铁厂拍 p20_004 为主入行口（farm_township_back/farm_exit_settle 是回落/退出侧的同旗落点）"
  },
  "miner": {
    "flag": "miner_work", "form": "employee",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["assign", "recruit", "follow", "wage"], "coldWeight": 3,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "矿工入行：矿上招工签约拍 p20_009 立旗"
  },
  "truck": {
    "flag": "truck_work", "form": "employee",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["follow", "recruit", "wage"], "coldWeight": 4,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "长途货车入行：跟车入行拍 e_truck_start 立旗（纯入行拍，ctx.entry）"
  },
  "med_hosp": {
    "flag": "med_hosp", "form": "employee",
    "eraIn": ["c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["recruit", "assign"], "coldWeight": 3,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "医院线入行：市医院招工培训拍 p21_071 立旗（era=c2000 独占），影像/病房/药房三支共用此门"
  },
  "med": {
    "flag": "med_work", "form": "employee",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["assign", "recruit", "near"], "coldWeight": 3,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "从医（基层）：卫生院入行拍 e_med_start 立旗（纯入行拍），村医类稀有与结局以此为门"
  },
  "nurse": {
    "flag": "nurse_work", "form": "employee",
    "eraIn": ["c2000"],
    "eduGate": null, "gateDirect": false,
    "coldOk": false, "coldKinds": [], "coldWeight": 0,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "医护·病房护士支：医院分科拍 p21_072 病房选项立旗，须先有 med_hosp（分科支、非独立入行口）"
  },
  "img": {
    "flag": "img_work", "form": "employee",
    "eraIn": ["c2000"],
    "eduGate": null, "gateDirect": false,
    "coldOk": false, "coldKinds": [], "coldWeight": 0,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "医护·影像科支：医院分科拍 p21_072 影像选项立旗，须先有 med_hosp（分科支、非独立入行口）"
  },
  "teach": {
    "flag": "teach_work", "form": "employee",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["assign", "recruit", "near"], "coldWeight": 3,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "教师入行：r_school1 分配到校呈现即立（注记原文「分配到校」），assign 是其本行渠道"
  },
  "acct": {
    "flag": "acct_work", "form": "employee",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["recruit", "near"], "coldWeight": 3,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "财会入行：第一份出纳活拍 p16_016 立旗"
  },
  "fin": {
    "flag": "fin_work", "form": "employee",
    "eraIn": ["c1965"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["recruit", "wage"], "coldWeight": 3,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "证券柜台入行（年代内小线）：营业部柜台拍 p18_021 立旗，该拍 era=c1965 独占（注记「仅 c1965 两条」）"
  },
  "press": {
    "flag": "press_work", "form": "employee",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["recruit", "assign"], "coldWeight": 3,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "报社入行：报社招工拍 p30_022 立旗"
  },
  "dev": {
    "flag": "dev_work", "form": "employee",
    "eraIn": ["c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["recruit", "wage"], "coldWeight": 3,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "软件开发入行：软件公司入行拍 p22_073 立旗，该拍 era=c2000 独占（注记原文「c2000 软件公司入行拍」）"
  },
  "driver_taxi": {
    "flag": "driver_taxi", "form": "employee",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["recruit", "wage", "near"], "coldWeight": 3,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "出租车入行：出租车公司招工拍 p30_021 立旗"
  },
  "grad": {
    "flag": "grad_work", "form": "employee",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": "gate", "gateDirect": true,
    "coldOk": false, "coldKinds": [], "coldWeight": 0,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "研究在行：深造路线课题组入行拍 e_grad_start 立旗——全表唯一带 ctx.eduGate（严口径）＋studyLine 的入行拍，故 eduGate 登记 gate；工资 A 档高薪组＋grad 溢价"
  },
};

// 冷门类型 × 年代可用表（COLD_KIND_ERA，§4.3）：机制只查表，格子内容是登记事实。
// true＝该代关口的冷门层可出此类型；false＝不出。逐格依据：
//   assign（分配/安排）：设计稿点名 c1955/c1965 城镇语境、c1978 回城语境可用、c2000 不出；
//     c1985/c1995 设计稿未点名——按分配制度退出年份推定：两代出生窗 1985–2003、入行年
//     最早 2007/2017，包分配与单位招工分配均已退出，登记 false（推定项，P1-6 内容层定版）。
//   recruit/follow/near/wage：四类在六代入行年窗内都有现实语境，全登 true；其中 wage 在
//     c1955/c1965 的口径是重体力/长途高工资（文案层分版），机制层不分。
// 空缺标明（本批不填）：① kind × track 的细分（如 assign 在 farm 轨不出）归 P1-4 关口
// 组装时处理，本表只到年代；② 各代 coldWeight 二维权重表归 P1-6。
window.GAME_COLD_KIND_ERA = {
  "assign":  { "c1955": true,  "c1965": true,  "c1978": true,  "c1985": false, "c1995": false, "c2000": false },
  "recruit": { "c1955": true,  "c1965": true,  "c1978": true,  "c1985": true,  "c1995": true,  "c2000": true },
  "follow":  { "c1955": true,  "c1965": true,  "c1978": true,  "c1985": true,  "c1995": true,  "c2000": true },
  "near":    { "c1955": true,  "c1965": true,  "c1978": true,  "c1985": true,  "c1995": true,  "c2000": true },
  "wage":    { "c1955": true,  "c1965": true,  "c1978": true,  "c1985": true,  "c1995": true,  "c2000": true },
};

// 经登记数据文件通道合入（形状随 WP1 E9 骨架）：registry.js 尾部合入器认 trades 键，
// 本体登记优先、同名先登记者胜。P1-2 起本文件在 index.html 加载序内（state.js 之前），
// 此行在现行运行时执行；validate-state 按同一位置载入本文件验证合入链。
window.GAME_REGISTRY_EXTRA = (window.GAME_REGISTRY_EXTRA || []).concat([{ trades: window.GAME_TRADES }]);
