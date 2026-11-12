// 《如果那年》v0.23 WP2 登记数据文件（c1955）——形状随 WP1 骨架（registry-v023.js）：
// 五槽（milestones/enumFacts/familyFacts/examBandTables/prologueForks）由 registry.js 尾部
// mergeRegistryExtra 与 anchors.js 在加载期合入（同名先登记者胜）；加载点须排在
// src/content/registry-v023.js 之后、src/world/state.js 之前（登记见补丁稿 wp2-loads-patch）。
// 本文件另带 sources 段（合入器忽略，只作出处登记）：共通简报要求新数字逐条登记出处与证据档位。
window.GAME_REGISTRY_EXTRA = (window.GAME_REGISTRY_EXTRA || []).concat([{
  milestones: {
    // —— E7 住房事实旗（本代部分；旗定义口径随蓝图 §3.5 E7，结算读法归 WP9）——
    "unitHousing": {
      "setters": ["e55_024", "e55_026"],
      "note": "分到单位房（v0.23 E7，WP2 本代部分）：e55_024 筒子楼一间半、e55_026 新楼两居，两次分配同旗；结算落脚/钱槽读法归 WP9"
    },
    "boughtReform": {
      "setters": ["e55_062", "e65_064"],
      "note": "房改把住着的单位房买下来（v0.23 E7，WP2 新写 e55_062，门=require unitHousing）；结算读法归 WP9。e65_064 为 WP3 c1965 侧同旗生产端（e65_026 买下后经 e65_064 补全手续立）——合并二期登记补全：合入规则先登记者胜，本条为全集，registry-wp3 的同名条目与此一致"
    },
    // —— F55-b 分配结果镜像旗（枚举事实 sentdownForm 为正本，旗供现行 require/forbid 机制读）——
    "sent_down": {
      "setters": ["pr_fork16"],
      "note": "本人下过乡（v0.23 F55-b）：pr_fork16 城镇形下乡选项落旗，与 sentdownForm 非空同值；e55_005/006/061 以 require/forbid 分本人形/目击形"
    },
    "stayed_town": {
      "setters": ["pr_fork16"],
      "note": "留城等招工（v0.23 F55-b 招工指标形落点）：pr_fork16 留城通用选项落旗；窄门四条各有专旗（见下），不与本旗叠写；e55_060 以 any 消费全部留城旗"
    },
    "narrow_frail": {
      "setters": ["pr_fork16"],
      "note": "窄门·病残留城（v0.23 F55-b/R1）：资格=性子牌 ct_13（病历本比课本厚，11 岁拍玩家亲手所选、场景可见）；后续账——身体事实终身在场，消费者 pr_y17–pr_y21 textByFlag 与 e55_063（体检/招工挑剩回响）"
    },
    "narrow_only": {
      "setters": ["pr_fork16"],
      "note": "窄门·独生留城（v0.23 F55-b/复核观察 1 独生专属账）：资格=家底 cf_11（家里就你一个，来历幕可见）；专属账——无兄弟姐妹分担照护，消费者 pr_y17–pr_y21 textByFlag 与 e55_066（独生照护专属回响）"
    },
    "narrow_alone": {
      "setters": ["pr_fork16"],
      "note": "窄门·多子女身边只剩一个留城（v0.23 F55-b/R1）：资格=家底 cf_06（上头有姐姐下头有弟弟，来历幕可见；姐姐下乡、弟弟尚小由 fork 回声当场摆明）；后续账=照护账，消费者 pr_y17–pr_y21 textByFlag 与 e55_064"
    },
    "narrow_poor": {
      "setters": ["pr_fork16"],
      "note": "窄门·家庭特困留城（v0.23 F55-b/R1）：资格=家底 cf_13（家里欠着账，来历幕可见）；后续账=家里的紧，消费者 pr_y17–pr_y21 textByFlag 与 e55_065"
    },
    "fam_split55_lived": {
      "setters": ["pool_fam55"],
      "note": "L55-家经历过（v0.23，§3.6 入池后 setter 随条目 id 改 pool_fam55）：与家庭事实旗 famSplit55 同源——池条目呈现即立 famSplit55（家庭事实登记在 registry.js，结算读）；validate 的事件 require 只认里程碑，故另立本旗作 e55_068 的门，两旗同拍同源、不得单独增减"
    },
    "wed_in_country": {
      "setters": ["e55_061"],
      "note": "在乡成家（v0.23 F55-b 长尾）：只对 sent_down 者开 e55_061，两选项同落此旗，分量写在其对返城名额/户口的实际影响上；消费者 e55_067（成年回响）"
    },
    // —— 童年记号（影子共同事实句在包内 marks{}，形状同 c2000 记号登记）——
    "mark_tablet55": { "setters": ["pool_fam55"], "note": "童年记号（c1955，池条目 L55-家 中段「留姨家」选项落）：姨家被坐裂的石板；影子句见 prologue-c1955.js marks" },
    "mark_doorplate55": { "setters": ["pool_move55"], "note": "童年记号（c1955，池旗舰「搬家」中段落）：抄在课本最后一页的老屋门牌号；影子句见包内 marks" },
    "mark_slate55": { "setters": ["pr_child1"], "note": "童年记号（c1955）：头一天上学抱着的石板，后来裂成两半；影子句见 prologue-c1955.js marks" },
    "mark_pencil55": { "setters": ["pr_child1"], "note": "童年记号（c1955）：同桌掰给的半截铅笔，用到只剩个头；影子句见包内 marks" },
    "mark_bridge55": { "setters": ["pr_child1"], "note": "童年记号（c1955）：上学路上桥头那棵柳树；影子句见包内 marks" },
    "mark_hoop55": { "setters": ["pr_child2"], "note": "童年记号（c1955）：打谷场上的铁环，后来锈了还挂在仓房墙上；影子句见包内 marks" },
    "mark_comic55": { "setters": ["pr_child2"], "note": "童年记号（c1955）：租书摊上始终差最后一本的连环画；影子句见包内 marks" },
    "mark_band55": { "setters": ["pr_child2"], "note": "童年记号（c1955）：院里那根断了又接起来的皮筋；影子句见包内 marks" },
    "mark_book55": { "setters": ["pr_child4"], "note": "童年记号（c1955）：受了潮又晾干的课本，水印像年轮；影子句见包内 marks" },
    "mark_locust55": { "setters": ["pr_child4"], "note": "童年记号（c1955）：村口老槐树，代销点换了小卖部树还在；影子句见包内 marks" },
    "mark_movie55": { "setters": ["pr_child4"], "note": "童年记号（c1955）：露天电影的台词记了半辈子；影子句见包内 marks" },
  },
  enumFacts: {},
  familyFacts: {
    "movedSchool": { "beat": "搬家（旗舰·低龄段）", "note": "学籍线轻事实（蓝图 §3.6 旗舰三段代价·低龄段）：转过学；只落学籍连续性，亲疏/记号之外不碰主线事实；消费归 WP9 学籍线与结算供料，本轮无成年事件直用" },
    "movedSchoolLate": { "beat": "搬家（旗舰·临考段）", "note": "学籍线事实（蓝图 §3.6 旗舰三段代价·临考段）：临考前转学、升学地与学籍重算；与随迁/回流线事实口径对齐（migrantExam 的事实来源之一在后代），消费归 WP9" },
  },
  examBandTables: {},
  prologueForks: [
    { era: "c1955", age: 16, id: "pr_fork16", status: "live", form: "F55-b 毕业分配：城镇两层掷定（发生率 41.8%＋构成 72.2/11.4/16.4）＋窄门四条＋招工指标形；农村四轨。分根登记（splitPoint）按蓝图 §七后置，本行不带——预留见 logs/wp2.md「分根集成预留」" },
  ],
  // —— SOURCES 段（本包新写入数字/比例/制度年份逐条登记；证据档位随调查报告三档口径）——
  sources: {
    sentdown_incidence: { value: "下乡 41.8% / 留城 58.2%", where: "pr_fork16 assignRoll.downPerMille=418", source: "调查报告 §6 c1955 第 1 条（1966–1972 年城镇中学毕业生实际构成）；只覆盖该届段，不外推", tier: "报告正文数字（二手研究汇编口径）" },
    sentdown_forms: { value: "插队 72.2% / 集体场队 11.4% / 国营农场含兵团 16.4%", where: "pr_fork16 assignRoll.formsPerMille", source: "调查报告 §6 c1955 第 1 条（1962–1979 全期已下乡者内部构成，统计局社会统计司口径，经顾洪章《中国知识青年上山下乡始末》）；作本届去向近似，非发生率", tier: "一手统计转引（报告 notes/sentdown.md 明细）" },
    narrow_gates: { value: "病残 / 多子女身边只剩一个 / 独生 / 家庭特困 四条", where: "pr_fork16 choicesTown 窄门四选项", source: "调查报告 §6 c1955 第 1 条：1973 年全国知青工作会议后成文最明确的留城类别；资格只用序章内已立且场景可见的事实（家底牌/性子牌）", tier: "制度事实（多源一致）" },
    recruitment_quota: { value: "招工指标（不量化）", where: "pr_fork16 留城形＋e55_060", source: "调查报告 §6 c1955 第 1 条：招工指标按计划分到同届头上（1971 年招工放量地区下乡量骤降有地方志实例）；是指标处境、不是资格，故不做玩家选项、不写概率", tier: "制度事实（地方志实例）" },
    gaokao_gate: { value: "1977 年报考：高中毕业或同等学力", where: "era1955 e55_001–004/058/059 的门（requiresFactAny/Hard）", source: "蓝图 §3.2 F55-c（评审 F4 修订）＋调查报告 §6 c1955 第 2 条长尾；门按 schoolingDepth 划、不按 track；同等学力事实取 depth=cut 且立 literacy_gain/half_grown 者", tier: "制度事实（蓝图定版口径）" },
    country_marriage: { value: "在乡成家的分量（不写比例进文案）", where: "era1955 e55_061/067", source: "调查报告 §6 c1955 第 1 条长尾：在乡结婚知青 1977 年达峰值、配偶以当地农民为主，走与留最后锁在婚姻与落户上（潘鸣啸专著口径）；文案只写其对返城名额/户口的实际分量，不引数字", tier: "二手研究口径（只承载质地）" },
    pool_weights: { value: "搬家 0.045/年（窗 5–15）／L55-家 0.05/年（窗 9–15），逐年按序章流掷定、同组互斥、每局至多呈现一幕（本代池仅此两条且互斥）", where: "prologue-c1955.js poolActs weight 字段", source: "蓝图 §3.6 池规格第 2 条：权重按处境/年代登记为设计参数；触发分布只报不设带（验收口径）", tier: "设计参数（无统计出处）" },
    track_target_c1955: { value: "study 18 / work 42 / craft 12 / home 28（%）", where: "验收对照（非文案数字）", source: "WP0 目标表（work/wp0-tables.md 第二节）：设计预期值、非统计锚；终验偏差 ≤5pp", tier: "设计参数（无统计出处）" },
    situation_weight_c1955: { value: "school 46 / half 34 / never 20（%）", where: "验收对照（序章发放权重在 prologue.js SITUATION_W，WP1 已落）", source: "蓝图附录 B 处境权重六代终表（沿 CALIBRATION 与 PACK-SPEC）；终验偏差 ≤3pp", tier: "标定参数（出处见 CALIBRATION.md）" },
  },
  // 池条目登记（蓝图 §3.6；调度引擎归集成步，落点规格见补丁稿 wp2-pool-patch——本键只作文档，合入器忽略）：
  poolEntries: [
    { id: "pool_move55", flagship: "move", form: "旗舰「搬家」c1955 皮（工作调动/分房形）", window: [5, 15], weight: 0.045, mutexGroup: "fam_move_split", guaranteeAge: null, bands: ["low", "mid", "late"], tails: "low=学籍线 movedSchool / mid=记号 mark_doorplate55 / late=学籍线 movedSchoolLate，小应对只动亲疏" },
    { id: "pool_fam55", form: "L55-家入池（分居形）", window: [9, 15], weight: 0.05, mutexGroup: "fam_move_split", guaranteeAge: null, bands: ["low", "mid", "late"], tails: "家庭事实旗 famSplit55＋里程碑 fam_split55_lived（同拍同源）；mid 段「留姨家」选项落记号 mark_tablet55；与 pool_move55 同局互斥" },
  ],
  // townSide 门说明：城镇形 fork 的下乡/留城两侧不设登记旗——掷定结果由呈现层按选项 townSide 字段
  // 直接过滤（同 c2000 altLabel 的引擎换形先例），故无 assign_* 里程碑；sentdownForm 事实是下乡侧的
  // 唯一数据痕迹（留城侧=该事实缺失），e55 系列以 sent_down 镜像旗与事实门消费，不受影响。
  townGateNote: "choicesTown 选项以 townSide: down|stay 声明所属侧；呈现层在 assignRoll 掷定后过滤（补丁稿 wp2-prologue-js-patch 第 1 条）；窄门资格仍走 requiresFamily/requiresTemper 数据门",
  // schoolingDepth 写入点登记（值集 full/cut/none 随 WP1 enumFacts 定版，本包只登记写入面）：
  depthWriters: {
    full: ["pr_fork16 农村形 study 选项 setFact"],
    cut: ["pr_half2 三选项 setFact", "pr_never2 认字两选项 setFact", "pr_fork16 农村形 craft/work/home 选项 setFact"],
    none: ["pr_never2 未去选项 setFact"],
    note: "已知近似（登记）：never 处境且立 home_ledger 者在 fork16 选非 study 轨时，depth 由 none 被 fork 选项覆写为 cut——只影响 e55_069 晚年识字回响分口，不影响 F55-c 门（门只认 full 与 cut+识字旗组合）；修法需 fork 选项按旗分口，登记进 v0.24 对账，不在本轮硬凑",
  },
}]);
