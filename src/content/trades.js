// 《如果那年》行当注册表（第 1 期 P1-1 登记批）——职业层的单一事实源（数据面）。
// 本批只登记已有行当：全表 28 行与 src/world/processes/work.js 的 FORM_OF_FLAG 逐行对应
// （tools/validate-state.js 双向核对，不一致即报错）。其中 26 行是 P1-1 的存量登记；
// photo/builder 两行是第 2 期注册片按用户 2026-11-09 裁定先行登记（只注册、不写内容
// 拍，两行 note 里写明 eraIn 口径与重扫约定），FORM_OF_FLAG 同步加两旗。
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
//                  原定 P1-6 填实——P1-6 激活批按总指挥红线未动抽取口径（点亮密度
//                  问题留第 2 期），二维表随第 2 期内容批再议；标量基线继续生效，
//                  不作统计宣称（与 examBandTables 的登记法同例）。
//   inheritFrom  = 承继项的家庭事实来源 id 列表（出身牌 cf_* 或 familyFacts 登记旗），
//                  只登现有事实里直接点名家业的行当；无来源者为空数组（不是遗漏：
//                  如 farm 的承继在现行事实里走少年轨道/农民路线本身，无家庭牌来源，
//                  留第 2 期补）。famRetire65/famQuota65（顶替）牵 L65-家发放规则，
//                  P1-1 不登、留 P1-4 关口批裁——P1-4 裁定（本批）：只登 famQuota65
//                  进 factory（它在 familyFacts 在册、过得了来源校验）；命中口径在
//                  关口组装侧收紧为「枚举事实 quotaHolder === "mine"」（名额定下且
//                  归我才算承继机会，归兄姐时不出项）；famRetire65 不登——顶替表
//                  发下 ≠ 名额归我，且顶替进厂在现行内容里已有 pr_fork16 的
//                  took_quota65 落点，关口再加一遍是重复。
//   seedEcho / inheritEcho = 回指句模板位（§3.4）：本批只占位（null），模板文案随
//                  P1-6 文案审定稿后填；null 时回指回落通用句的口径在 §3.4 已定。
//   family       = 同族分区 id（第 2 期 P2-1 落数据，DESIGN-41 §4.1.0 与 FAMILY-TABLE
//                  冻结版）：28 行当恰属一族——land 田土（farm/township/farm_returned，
//                  T3 裁定 township 归田土）、plant 厂矿（factory/heavy/miner/builder）、
//                  hand 手艺（craft/photo）、road 路上（truck/driver_taxi/courier）、
//                  medic 医护（med_hosp/med/nurse/img/care）、word 文教（teach/
//                  grad/press/write/exam_landed）、counter 柜台数（acct/fin）、
//                  market 营生（shop/gig）、tech 技术（dev/fab）。只供 career.js 的
//                  同族外溢现算（seedStrengthOf），改族籍＝改点亮分布，须走裁定；
//                  完备性由 tools/validate-state.js 的分区校验守（恰属一族、族 id
//                  合法、每族至少一行 gateDirect=true）。
window.GAME_TRADES = {
  "farm": {
    "flag": "farm_work", "form": "farm",
    "family": "land",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["near"], "coldWeight": 2,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "种地入行：分家单过/分地到户拍（p29/farm_entry）立旗，农民路线立线旗"
  },
  "township": {
    "flag": "township_work", "form": "employee",
    "family": "land",
    "eraIn": ["c1965", "c1978", "c1985"],
    "eduGate": null, "gateDirect": false,
    "coldOk": false, "coldKinds": [], "coldWeight": 0,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "乡镇企业入行（农民路线混合层）：farm_township 立旗，须先有 farm_work；工资 C 档、土地池不关门"
  },
  "farm_returned": {
    "flag": "farm_returned", "form": "farm",
    "family": "land",
    "eraIn": ["c1965", "c1978", "c1985"],
    "eduGate": null, "gateDirect": false,
    "coldOk": false, "coldKinds": [], "coldWeight": 0,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "乡镇企业回落旗：厂散后回地里（farm_township_back），不是入行口、是回落落点"
  },
  "exam_landed": {
    "flag": "exam_landed", "form": "public",
    "family": "word",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": "half", "gateDirect": false,
    "coldOk": false, "coldKinds": [], "coldWeight": 0,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "体制内上岸：考试链尾 p16_072 落旗；链头 p16_001/p16_012 为 eduGateHalf 宽门，故登记 half"
  },
  "shop": {
    "flag": "shop_work", "form": "self",
    "family": "market",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["follow", "near", "wage"], "coldWeight": 3,
    "inheritFrom": ["cf_01", "cf_10"],
    "seedEcho": null, "inheritEcho": null,
    "note": "店主入行：批发学徒/接手家店/开网店拍立旗；承继来源＝柜台后头长大的（cf_01）、家里开过饭馆（cf_10）"
  },
  "gig": {
    "flag": "gig_work", "form": "flex",
    "family": "market",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["recruit", "follow", "near", "wage"], "coldWeight": 4,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "零工/自由职业（机会层）：劳务市场报名接活拍立旗；与 side_job 副业分家"
  },
  "courier": {
    "flag": "courier_work", "form": "flex",
    "family": "road",
    "eraIn": ["c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["recruit", "follow", "wage"], "coldWeight": 4,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "快递物流（机会层）：转运分拣/站点招工拍立旗；可达年代含晚年转行拍 p22_002（50–54 岁、无公历门）。CL-61 开线（总指挥裁定 3）：eraIn 收为 c1965 起五代——本行 1993 年才起步，c1955 代整命入行不成立；其实测依据：trades.eraIn 只管 career.js 关口菜单（gateRowCommon），storylet 资格不读它——收窄前后直调 IFY.met 对四扇存量门判定逐字不变（p22_002 对 c1955 恒 true，是该代唯一通道；p22_072/cr_shop_097/cr_factory_127 对 c1955 本就被各自年龄窗×公历门挡死）。c1955 玩家进本线只走 p22_002 晚年门与两扇中年转入门的既有形状，不靠关口菜单。"
  },
  "care": {
    "flag": "care_work", "form": "flex",
    "family": "medic",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["recruit", "follow", "near"], "coldWeight": 3,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "职业陪护（机会层）：陪护接活入行拍立旗；与家庭照护旗分家"
  },
  "write": {
    "flag": "write_work", "form": "flex",
    "family": "word",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["follow", "near"], "coldWeight": 3,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "写作（机会层）：副业写作留用拍 p2_086 立旗（minYear 2005、年龄窗 26–40，c1955 出生窗＋40 岁＜2005 故不可达）；CL-37 开线（v0.60.61，总指挥三裁）：认机会层大线不升正职层（160 是内容配额非入行层级，与 care/gig/courier 同规）、eraIn 补 c1955（传统作家脸原生代际）、coldWeight 2 升 3"
  },
  "factory": {
    "flag": "factory_work", "form": "employee",
    "family": "plant",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["assign", "recruit", "follow", "near", "wage"], "coldWeight": 5,
    "inheritFrom": ["cf_05", "famQuota65"],
    "seedEcho": null, "inheritEcho": null,
    "note": "工厂制造入行：招工入行拍 p15_071 立旗（注记原文「招工入行」），五种冷门渠道全开；承继来源＝一个厂里出来的（cf_05）、顶替名额归我（famQuota65，命中须 quotaHolder=mine，组装侧收紧，P1-4 裁）"
  },
  "fab": {
    "flag": "fab_work", "form": "employee",
    "family": "tech",
    "eraIn": ["c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["recruit", "wage"], "coldWeight": 3,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "半导体入行：进晶圆厂跟线拍 p18_032 立旗，该拍 era=c2000 独占，故只登 c2000"
  },
  "craft": {
    "flag": "craft_work", "form": "employee",
    "family": "hand",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["follow", "recruit", "near"], "coldWeight": 4,
    "inheritFrom": ["cf_03"],
    "seedEcho": null, "inheritEcho": null,
    "note": "手艺入行：p20 簇四拍立旗；承继来源＝院子里支着作坊（cf_03）"
  },
  "heavy": {
    "flag": "heavy_work", "form": "employee",
    "family": "plant",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["assign", "recruit", "follow", "wage"], "coldWeight": 3,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "重工业入行：进钢铁厂拍 p20_004 为主入行口（farm_township_back/farm_exit_settle 是回落/退出侧的同旗落点）"
  },
  "miner": {
    "flag": "miner_work", "form": "employee",
    "family": "plant",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["assign", "recruit", "follow", "wage"], "coldWeight": 3,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "矿工入行：矿上招工签约拍 p20_009 立旗"
  },
  "truck": {
    "flag": "truck_work", "form": "employee",
    "family": "road",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["follow", "recruit", "wage"], "coldWeight": 4,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "长途货车入行：跟车入行拍 e_truck_start 立旗（纯入行拍，ctx.entry）"
  },
  "med_hosp": {
    "flag": "med_hosp", "form": "employee",
    "family": "medic",
    "eraIn": ["c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["recruit", "assign"], "coldWeight": 3,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "医院线入行：市医院招工培训拍 p21_071 立旗（era=c2000 独占），影像/病房/药房三支共用此门"
  },
  "med": {
    "flag": "med_work", "form": "employee",
    "family": "medic",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["assign", "recruit", "near"], "coldWeight": 3,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "从医（基层）：卫生院入行拍 e_med_start 立旗（纯入行拍），村医类稀有与结局以此为门"
  },
  "nurse": {
    "flag": "nurse_work", "form": "employee",
    "family": "medic",
    "eraIn": ["c2000"],
    "eduGate": null, "gateDirect": false,
    "coldOk": false, "coldKinds": [], "coldWeight": 0,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "医护·病房护士支：医院分科拍 p21_072 病房选项立旗，须先有 med_hosp（分科支、非独立入行口）"
  },
  "img": {
    "flag": "img_work", "form": "employee",
    "family": "medic",
    "eraIn": ["c2000"],
    "eduGate": null, "gateDirect": false,
    "coldOk": false, "coldKinds": [], "coldWeight": 0,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "医护·影像科支：医院分科拍 p21_072 影像选项立旗，须先有 med_hosp（分科支、非独立入行口）"
  },
  "teach": {
    "flag": "teach_work", "form": "employee",
    "family": "word",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["assign", "recruit", "near"], "coldWeight": 3,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "教师入行：r_school1 分配到校呈现即立（注记原文「分配到校」），assign 是其本行渠道"
  },
  "acct": {
    "flag": "acct_work", "form": "employee",
    "family": "counter",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["recruit", "near"], "coldWeight": 3,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "财会入行：第一份出纳活拍 p16_016 立旗；CL-46 开线补四门 p74_004–007（供销社学徒/乡办厂出纳/支行培训/事务所分配，各以公历窗分代）"
  },
  "fin": {
    "flag": "fin_work", "form": "employee",
    "family": "counter",
    "eraIn": ["c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["recruit", "wage"], "coldWeight": 3,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "证券柜台入行：营业部柜台拍 p18_021 立旗（该拍 era=c1965 独占）；CL-46 开线（总指挥裁定）：eraIn 自 c1965 扩为 c1965–c2000，入行门 p74_008 以公历窗 1990–2000 把可达面收在柜台年代内，在行拍按公历门与年龄窗分代"
  },
  "press": {
    "flag": "press_work", "form": "employee",
    "family": "word",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["recruit", "assign"], "coldWeight": 3,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "报社入行：报社招工拍 p30_022 立旗"
  },
  "dev": {
    "flag": "dev_work", "form": "employee",
    "family": "tech",
    "eraIn": ["c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["recruit", "wage"], "coldWeight": 3,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "软件开发入行：软件公司入行拍 p22_073 立旗，该拍 era=c2000 独占（注记原文「c2000 软件公司入行拍」）"
  },
  "driver_taxi": {
    "flag": "driver_taxi", "form": "employee",
    "family": "road",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["recruit", "wage", "near"], "coldWeight": 3,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "出租车入行：出租车公司招工拍 p30_021 立旗"
  },
  "grad": {
    "flag": "grad_work", "form": "employee",
    "family": "word",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": "gate", "gateDirect": true,
    "coldOk": false, "coldKinds": [], "coldWeight": 0,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "研究在行：深造路线课题组入行拍 e_grad_start 立旗——全表唯一带 ctx.eduGate（严口径）＋studyLine 的入行拍，故 eduGate 登记 gate；工资 A 档高薪组＋grad 溢价"
  },
  "photo": {
    "flag": "photo_work", "form": "flex",
    "family": "hand",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["follow", "recruit", "near"], "coldWeight": 4,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "摄影师（第 2 期注册片先行登记，用户 2026-11-09 裁定立行当、族籍归 hand 手艺族；CL-78 注册落地片定 form）：四张脸里婚礼跟拍是接活、风光是自由投稿、开影楼是自己的店，只有新闻一脸是稳定受雇，早年代照相馆职工脸是年代脸——入行主形状是爱好起步（相机/摄影社种子）后接活吃饭，与 write 同型，form 定 flex 机会层（配额 150 是内容量不是层级，照 write/care 先例），入 ENTRY_OPPORTUNITY_FLAGS、退休走 WORK_INFORMAL_FLAGS 的 63–68 窗；eraIn 六代全开的论证：照相馆作为国营/集体服务行当在县城自 1950 年代起不断线（c1955 出生者青年正赶上学徒招工），行当先于最早一代人的从业年存在，与 1993 年才出生的 courier 收窄情形不同——胶片/数码只是换脸，脸由条目公历门分；eraIn 仍非现行 setter 实扫（本片只注册不写内容拍，入行拍随摄影师线施工批补，届时按文件头口径随 setter 重扫 eraIn/eduGate）；coldKinds/coldWeight 与 flex 同侪同档（care 同 kinds、courier 同权重）；CL-84 开线批随五门 setter（p100_014–018）实扫复核：六代各有至少一扇可达门——c1955/c1965 走 014 馆学徒（≤1998、16–22 岁）与 016 通讯员（≤1998、19–30 岁），c1978/c1985 走 015 影楼助理（2000 起）、017 卖图起步（1998–2008）与 018 器材店转入（2005 起），c1995/c2000 走 015/018 并有 019 手机先行土壤面（2016 起），eraIn 六代全开复核维持；eduGate 复核维持 null（五门均无学历门，影楼助理与通讯员皆以手艺与作品入行）"
  },
  "builder": {
    "flag": "builder_work", "form": "employee",
    "family": "plant",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["assign", "recruit", "follow", "wage"], "coldWeight": 3,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "建筑工人（第 2 期注册片先行登记，用户 2026-11-09 裁定立行当）：建筑工六代都有、包工头脸是内容层的事，eraIn 按行当存续六代全开——非现行 setter 实扫（本片只注册不写内容拍，入行拍随后补，届时按文件头口径随 setter 重扫）；族籍归 plant 厂矿（工地与厂矿同属重工业现场，总指挥定），coldKinds/coldWeight 与同族 heavy/miner 同档"
  },
  "sea": {
    "flag": "sea_work", "form": "self",
    "family": "land",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["assign", "recruit", "follow", "wage"], "coldWeight": 3,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "出海（第 2 期 CL-27 新线，用户 2026-11-10 亲点）：捕捞/海水养殖/海上体验三脸共用 sea_work 一旗；form 按自家船/自家水面的自营形态登 self（跟船学徒是入行前段，本线落点在自营）；族籍归 land 田土（耕海与种地同族，与 farm 互溢）；非正规口径（不在 WORK_FORMAL_FLAGS、入 WORK_INFORMAL_FLAGS，退休窗 63–68 与 farm 同族）；eraIn 六代全开（捕捞全年代、养殖规模化脸与体验脸由条目公历门分开）；inheritFrom 空——承继走线内入行拍（接家里的船/顶替），现行出身牌无渔家来源"
  },
  "forestry": {
    "flag": "forestry_work", "form": "employee",
    "family": "land",
    "eraIn": ["c1955", "c1965", "c1978", "c1985", "c1995", "c2000"],
    "eduGate": null, "gateDirect": true,
    "coldOk": true, "coldKinds": ["recruit", "assign"], "coldWeight": 3,
    "inheritFrom": [],
    "seedEcho": null, "inheritEcho": null,
    "note": "林业（CL-47 开线，总指挥注册裁定）：森工/营林/林农/林站/生态护林五脸共用 forestry_work 一旗，脸靠公历门与 ctx 分；form 按单位制登 employee（森工局/国营林场/林业站是单位，命三林农与命五公益岗的脸在条目层自洽，不另立旗）；正规口径（入 WORK_FORMAL_FLAGS，退休窗 55–60，本片不写退休段）；族籍归 land 田土（山与田同族，与 farm/sea 互溢，照 sea 先例）；eraIn 六代全开（顶替脸止 1986、分配脸止 2003、选聘脸 2016 起，由条目公历门分开）；inheritFrom 空——承继（顶替）走线内入行拍 p75_015，现行出身牌无林业子弟来源"
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

// 关口总开关（第 1 期 P1-4 休眠批落、P1-6 激活批打开，设计稿 §6.1/§七）：数据面
// 开关——open 不为 true（含本字段缺失、注册表未载入）时，career.js 的 gateDue 恒返
// false，关口不可达。改此一处即全门生效/回滚，不许在别处再设第二开关。
// P1-6 激活注记：coldWeight 仍用 P1-1 标量基线（年代×行当二维表与种子点亮密度
// 同属第 2 期内容批的调参面，本批按红线不动抽取口径，只接线开门）。
window.GAME_GATE_SWITCH = { open: true };

// 经登记数据文件通道合入（形状随 WP1 E9 骨架）：registry.js 尾部合入器认 trades 键，
// 本体登记优先、同名先登记者胜。P1-2 起本文件在 index.html 加载序内（state.js 之前），
// 此行在现行运行时执行；validate-state 按同一位置载入本文件验证合入链。
window.GAME_REGISTRY_EXTRA = (window.GAME_REGISTRY_EXTRA || []).concat([{ trades: window.GAME_TRADES }]);
