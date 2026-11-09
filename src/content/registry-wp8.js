// 《如果那年》v0.23 WP8 登记数据文件（c1995）——形状随 WP1 骨架（registry-v023.js）：五槽，加载期由
// registry.js 尾部的 mergeRegistryExtra（registry 类）与 anchors.js（prologueForks 类）合入，同名键先登记者胜。
// 本文件只补 WP1 本体没有的键：本体已登记者（examBand 枚举事实、originLB/migrantExam/famRestructure95 家庭事实旗、
// studyForm 枚举事实）不在此重登。加载点（合并期接线，见 work/wp8-loading-patch.md）：index.html / sim.js /
// simlib19.js 三处与 registry-v023.js 同位（其后、src/world/state.js 之前）。
window.GAME_REGISTRY_EXTRA = (window.GAME_REGISTRY_EXTRA || []).concat([{
  milestones: {
    // c1995 童年记号九枚：setter 为序章变体所在幕（与 c2000 记号同规：变体级 set 记在幕 id 名下）。
    // 消费点登记（G3；fix4 四修订正；v0.23 WP9 A线再订正）：主幕九枚的影子共同事实句在 prologue-c1995.js 的 marks 里
    // （瞥视「两条路上都一样的是」由落账条目自带 shadow ?? PRO.marks 合并读）。WP9 起瞥视改轮换消费
    // （shadow.js glimpseMarkLineNext＋sim 同口径复刻）：每次点开按 S.marks 落账序取第一个未示且有文本的条目，
    // 已示记 S.prologue.shadowMarksShown，不再恒读 marks[0]。mark_palm95 的影子句随 WP9 补齐——不在本包 marks 里，
    // 而在搬家池中段变体的 markShadow（键 mark_palm95），经池调度转发、present 落账存进条目自带 shadow 后由瞥视消费。
    // 成年回响：九枚固定记号＋mark_palm95 各一条，落 era1995.js（echo_*95，见下方各条 note）。
    "mark_autopen95": { "setters": ["pr_child1"], "note": "c1995 童年记号：同桌的自动铅笔（WP8）；成年回响 echo_autopen95" },
    "mark_bus95": { "setters": ["pr_child1"], "note": "c1995 童年记号：村里凑钱雇的接送面包车路线（WP8；fix2 二修去制度形「校车」）；成年回响 echo_bus95" },
    "mark_song95": { "setters": ["pr_child1"], "note": "c1995 童年记号：新老师教的歌（WP8）；成年回响 echo_song95" },
    "mark_skate95": { "setters": ["pr_child2"], "note": "c1995 童年记号：旱冰场松手那半圈（WP8）；成年回响 echo_skate95" },
    "mark_game95": { "setters": ["pr_child2"], "note": "c1995 童年记号：邻居哥哥家电脑上的泡泡堂（WP8）；成年回响 echo_game95" },
    "mark_field95": { "setters": ["pr_child2"], "note": "c1995 童年记号：野地与陷泥的鞋（WP8）；成年回响 echo_field95" },
    "mark_tree95": { "setters": ["pr_child4"], "note": "c1995 童年记号：小学门口的老梧桐（WP8）；成年回响 echo_tree95" },
    "mark_fuwa95": { "setters": ["pr_child4"], "note": "c1995 童年记号：五个福娃贴纸（WP8）；成年回响 echo_fuwa95" },
    "mark_campus95": { "setters": ["pr_child4"], "note": "c1995 童年记号：锁上的老校区大门（WP8）；成年回响 echo_campus95" },
    "mark_palm95": { "setters": ["pr_pool95_move"], "note": "c1995 童年记号：手心里的旧地址（搬家旗舰中段变体落点，§3.6 记号最重段）（WP8；v0.23 WP9 A线订正：影子句已补齐——中段变体 markShadow.mark_palm95，池调度转发＋落账自带，瞥视轮换消费可达；成年回响 echo_palm95）" },
    // 成年回响条目自身不立新旗，只登记回响 id 的归属说明（消费点登记，G4 补强片；照 registry-wp7.js 里 echo_*85 的注法）
    "echo_game95": { "setters": ["echo_game95"], "note": "成年回响（c1995）：require mark_game95，消费童年记号（邻居哥哥家的泡泡堂）" },
    "echo_fuwa95": { "setters": ["echo_fuwa95"], "note": "成年回响（c1995）：require mark_fuwa95，消费童年记号（五个福娃贴纸）" },
    "echo_autopen95": { "setters": ["echo_autopen95"], "note": "成年回响（c1995）：require mark_autopen95，消费童年记号（同桌的自动铅笔）" },
    "echo_skate95": { "setters": ["echo_skate95"], "note": "成年回响（c1995）：require mark_skate95，消费童年记号（旱冰场松手那半圈）" },
    // 疫情当下旗（G4 补强片）：e95_001 在公历门 2020–2022 内呈现即立；p1_039/p1_040 以 forbid 消费——
    // 立过当下拍的人（25–27 岁亲历封控）不再在 28–38 岁抽到疫情回望/封控复述拍，疫情只落一拍。
    "covid95_days": { "setters": ["e95_001"], "note": "疫情当下旗（c1995）：e95_001 呈现即立；消费者 p1_039/p1_040 的 forbid（持有本旗则两拍不出现）" },
  },
  enumFacts: {
    "examResult": {
      "values": ["admit", "miss"],
      "host": "track",
      "note": "高考结果（FIX-01 学业主线修复）：admit=考上 / miss=落榜（下游口径＝复读一年、第二年考上）；写手只有序章 rollExamResult（派生流掷定，按 examBand 分档 high 0.90/mid 0.65/low 0.35 为设计参数、无统计出处），只给 study 轨的人；band 缺失但已在 study 轨的（没进过校门/退学者经对口口转入）按 0.50 掷；对口升学线（craftForm95=upgrade）不掷、其结果由 pr_y20 既有 factTexts 兑现。消费者：各包 19 岁平年 textByFact、pr_y18（仅 c1965）/pr_y20/pr_y21 的 factTexts 分文。c1955 无 examBand 表、永不掷（该代学业轨＝高中毕业回乡，本无高考环）"
    },
    "craftForm95": {
      "values": ["upgrade", "job"],
      "host": "track",
      "note": "中职内部分班（v0.23 WP8 F95）：upgrade=对口升学班 / job=就业班；pr_fork16 两形选项写、pr_duikou18 小链可改写；消费者（WP8 修复线落点）：pr_y18 factTexts 只供 16 岁直选者读（翻转者在本拍时事实仍为 job，读缺省顶岗实习文），pr_y20/pr_y21 factTexts 为两类 upgrade 人群共同的结果与去向落点；就业班出身者 18 岁经小链可改写为 upgrade（出口不对低档关闭）"
    },
  },
  familyFacts: {
    "transfer95": { "beat": "搬家（旗舰·c1995 皮）", "note": "转过学（学籍线轻事实，§3.6 长尾封顶内）：童年随家搬迁转过学；只落学籍线与回响，不碰 track/quotaHolder/examBand" },
  },
  examBandTables: {
    "c1995": {
      "school": { "high": 35, "mid": 35, "low": 30 },
      "half": { "high": 20, "mid": 35, "low": 45 },
      "note": "c1995 定版登记（v0.23 WP8；fix2 二修改）：设计参数，无统计出处（蓝图 §3.2 总则②/附录 B）；只受阈值单调性（处境越差高档越低）与可玩性约束；与 prologue-c1995.js 文件头 CALIB 同值。never 处境不入表（fix2 二修，同 c1985 G6 口径）：没进过校门的人不掷 band——rollExamBand 无该处境行即不掷、不写 examBand 事实，fork16 题面走中性分文；half 退学者（schooling=left）另由 fork16 的 bandSkipSchooling 引擎门关掷档、study/对口选项另带 requiresState{ schooling: [school, half] } 关门。"
    },
  },
  prologueForks: [
    { era: "c1995", age: 16, id: "pr_fork16", status: "live", form: "F95 半张单子（band 与分岔同拍、按处境分表；随 WP8 落形）。分根集成预留（蓝图 §七）：本拍为本代 splitPoint 候选（choice 分根），splitPoint 标记与锚点段待 §七评审后薄集成，本轮不落。" },
  ],
  // G0 出处登记（本代新写入数字/比例/制度年份；mergeRegistryExtra 不读此槽，仅作随包登记，权威摘要在 prologue-c1995.js 文件头 SOURCES 与 logs/wp8.md）：
  sources95: [
    { item: "借读费 1992 年起步、2008/09 前后取消；赞助费；子弟学校关停风险", where: "L95-留（originLB/originMigrant/pr_pool95_leave）", source: "蓝图 §2.5/§3.3 转引童年调查报告", grade: "报告已核" },
    { item: "2008 年秋起义务教育免学杂费、不收借读费，墙移到升学端", where: "L95-考背景（pr_pool95_exam 只写「议在哪儿考」，不写制度断言）", source: "蓝图 §2.5（评审 F7 修正）", grade: "报告已核" },
    { item: "搬家旗舰·本代皮「父母打工迁徙」（随厂/换活儿迁徙）", where: "pr_pool95_move 三段变体（窗 5–15）；临考段学籍挂回老家＝migrantExam 事实来源之一", source: "蓝图 §3.6 旗舰条（质地逐代换皮：c1985+ 为父母打工迁徙）", grade: "蓝图口径" },
    { item: "中考普职约各半（2009 年自算）", where: "F95 题面体感（红榜/半张单子），不作 band 出处", source: "蓝图 §2.5", grade: "自算口径" },
    { item: "粗离婚率 2000 年 0.96‰→2010 年 2.00‰", where: "L95-婚背景（正文不写数字；触发率 0.08 为设计参数）", source: "蓝图 §2.5", grade: "报告已核" },
    { item: "留守孩子常做家务（留守女童 47.2%）", where: "L95-留小应对「学着生灶火」（只写家务事实，不写性别线）", source: "蓝图 §2.5", grade: "报告已核" },
    { item: "本代高考 2013 年录取宽口（七成上下）", where: "pr_y18 study 文只写体感、不写率", source: "蓝图 §2.5（评审 F9 附带）", grade: "报告已核" },
    { item: "汶川地震 2008（本体·目击形）", where: "pr_teen1 ceremony 款（异地默哀/捐款切片）", source: "事件轴种子登记 [2008,2008]（蓝图 §八 8.1）", grade: "轴登记" },
    { item: "examBand 三档分布（按处境分表）", where: "examBandTables.c1995 / calib95", source: "设计参数，无统计出处", grade: "设计参数" },
    { item: "池触发权重：随迁状态 migrant 0.14/0.10/0.04（calib95）；L95-考 hazard 0.45/年、搬家 0.022/年、L95-婚 0.0104/年（整窗约 8%，全池最低）", where: "pool95 各条目 trigger 字段（调度归集成步）", source: "设计参数，无统计出处", grade: "设计参数" },
    { item: "死亡三段带 c1995 <60 1–15%／60–79 18–36%／活到 80 56–74%", where: "G2 验收（参数登记见 work/wp8-mortality-patch.md）", source: "work/g2-bands.md 定版（外部锚：普查预期寿命序列等）", grade: "按外推口径标定" },
  ],
}]);
